const User = require('../models/User');
const crypto = require('crypto');
const { sendVerificationEmail, sendWelcomeEmail } = require('./emailService');
const UserProfile = require('../models/UserProfile');
const { validatePassword } = require('../utils/passwordValidation');

const TOKEN_EXPIRY_DURATION = 15 * 60 * 1000; // 15 minutes

const signUp = async (email, password, fullName, username, isSeller, isCompany, countryInfoPromise) => {
  try {
    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return {
        success: false,
        message: 'Password does not meet security requirements',
        errors: passwordValidation.errors,
        feedback: passwordValidation.feedback
      };
    }
    
    // Auto-generate username if not provided
    if (!username) {
      const emailPrefix = email.split('@')[0];
      const randomSuffix = Math.floor(Math.random() * 10000);
      username = `${emailPrefix}${randomSuffix}`;
    }

    const existingUserByEmail = await User.findOne({ email });
    const existingUserByUsername = await User.findOne({ username });

    // If either email or username exists
    if (existingUserByEmail || existingUserByUsername) {
      // If the existing email/username is not verified
      const existingUser = existingUserByEmail || existingUserByUsername;

      if (!existingUser.isVerified) {
        const now = Date.now();
        if (!existingUser.verificationTokenExpiry || existingUser.verificationTokenExpiry < now) {
          // Token expired → generate new token and resend
          const newToken = crypto.randomBytes(32).toString('hex');
          existingUser.verificationToken = newToken;
          existingUser.verificationTokenExpiry = now + TOKEN_EXPIRY_DURATION;
          await existingUser.save();

          // Send verification email in background
          const backgroundResend = async () => {
            try {
              console.log(`📧 Resending verification email to existing unverified user: ${existingUser.email} in background`);
              await sendVerificationEmail(existingUser.email, newToken);
              console.log(`✅ Verification email resent successfully to ${existingUser.email}`);
            } catch (emailError) {
              console.error(`❌ Background email resend failed for ${existingUser.email}:`, emailError.message);
            }
          };
          backgroundResend();

          return {
            success: false,
            message: 'Your previous signup was incomplete. A new verification email has been sent.',
            emailSent: true,
          };
        } else {
          return {
            success: false,
            message: 'Please check your email to verify your account.',
            emailSent: false,
          };
        }
      }

      // If verified, block duplicate signup
      if (existingUserByEmail) {
        const existingRole = existingUserByEmail.role === 'freelancer' ? 'freelancer' : 'client';
        const requestedRole = isSeller === true || isSeller === 'true' ? 'freelancer' : 'client';
        
        if (existingRole !== requestedRole) {
          return {
            success: false,
            code: 'DUPLICATE_EMAIL_DIFFERENT_ROLE',
            message: `This email is already registered as a ${existingRole}. Noretmy allows only one account type per email. Please use a different email or log in as a ${existingRole}.`,
            existingRole,
            requestedRole
          };
        }
        
        return {
          success: false,
          code: 'DUPLICATE_EMAIL',
          message: `Email already registered as ${existingRole}.`,
          existingRole
        };
      }
      
      return {
        success: false,
        code: 'DUPLICATE_USERNAME',
        message: 'Username already in use',
      };
    }

    const token = crypto.randomBytes(32).toString('hex');

    // Determine user role based on input
    let userRole = 'client'; // Default role
    if (isSeller === true || isSeller === 'true') {
      userRole = 'freelancer';
    }

    const user = new User({
      email,
      password, // Will be hashed by the pre-save hook
      fullName,
      username,
      isSeller: isSeller || false,
      isCompany: isCompany || false,
      role: userRole,
      verificationToken: token,
      verificationTokenExpiry: Date.now() + TOKEN_EXPIRY_DURATION,
      // All users start unverified - they appear in admin documents for manual verification
      isVerified: false,
    });

    await user.save();

    // Resolve country info (which was started in parallel)
    const resolvedCountryInfo = await countryInfoPromise;
    const { country = 'United States', countryCode = 'US' } = resolvedCountryInfo || {};

    // Create associated user profile
    const userProfile = new UserProfile({
      userId: user._id,
      country,
      countryCode,
      isCompany: isCompany || false,
    });

    await userProfile.save();

    console.log('✅ User created successfully:', user.email);
    console.log('ℹ️  User will appear in admin documents for manual verification');
    console.log('ℹ️  User can login immediately without email verification');

    // Send admin notification in background
    const sendAdminNotification = async () => {
      try {
        const notificationService = require('./notificationService');
        const Admin = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 });
        if (Admin) {
          await notificationService.createNotification({
            userId: Admin._id,
            title: '🆕 New User Registration',
            message: `${fullName} (${email}) signed up as ${isSeller ? 'freelancer' : 'client'} - Pending verification`,
            type: 'system',
            link: `/admin/documents`
          });

          const io = global.io;
          if (io) {
            io.to(`user_${Admin._id}`).emit('notification', {
              title: '🆕 New User Registration',
              message: `${fullName} signed up - Pending verification`,
              type: 'admin',
              link: `/admin/documents`
            });
          }
        }
      } catch (notifError) {
        console.error('Admin notification failed:', notifError.message);
      }
    };

    // Execute admin notification without awaiting
    sendAdminNotification();

    // Send verification email in background (fire-and-forget to avoid delays)
    const sendVerificationInBackground = async () => {
      try {
        console.log(`📧 Sending verification email to: ${user.email}`);
        await sendVerificationEmail(user.email, token);
        console.log(`✅ Verification email sent successfully to: ${user.email}`);
      } catch (emailError) {
        console.error(`❌ Signup email failed for ${user.email}:`, emailError.message);
      }
    };
    
    // Execute verification email without awaiting
    sendVerificationInBackground();

    return {
      success: true,
      code: 'SIGNUP_SUCCESS',
      message: 'Registration successful! Please check your email to verify your account.',
      emailSent: true,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        username: user.username,
        role: user.role,
        isSeller: user.isSeller,
        isCompany: user.isCompany,
      },
    };
  } catch (error) {
    console.error('Signup error:', error);
    // Return more specific error message
    if (error.code === 11000) {
      // Duplicate key error
      const field = Object.keys(error.keyPattern)[0];
      return {
        success: false,
        code: field === 'email' ? 'DUPLICATE_EMAIL' : 'DUPLICATE_USERNAME',
        message: `${field === 'email' ? 'Email' : 'Username'} already exists`
      };
    }
    return {
      success: false,
      code: 'SIGNUP_ERROR',
      message: error.message || 'Failed to create user account'
    };
  }
};

const verifyEmail = async (email, token) => {
  const user = await User.findOne({ 
    email, 
    verificationToken: token,
    verificationTokenExpiry: { $gt: Date.now() }
  });

  if (!user) {
    const error = new Error('Invalid or expired verification token');
    error.statusCode = 400;
    throw error;
  }

  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpiry = undefined;
  await user.save();

  // Send welcome email after successful verification
  try {
    const { sendWelcomeEmail } = require('./emailService');
    await sendWelcomeEmail(user.email, user.fullName, user.isSeller);
    console.log(`✅ Welcome email sent to ${user.email}`);
  } catch (emailError) {
    // Don't fail verification if welcome email fails
    console.error('Failed to send welcome email:', emailError.message);
  }
};

const signIn = async (email, password) => {
  const user = await User.findOne({ email });

  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }

  // Email verification removed - users can login immediately
  // Verification is done manually by admins through admin panel

  if (user.isBlocked) {
    const error = new Error(`Your account has been blocked${user.blockReason ? ': ' + user.blockReason : ''}. Please contact support.`);
    error.statusCode = 403;
    error.code = 'ACCOUNT_BLOCKED';
    throw error;
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }

  const userProfile = await UserProfile.findOne({ userId: user._id });

  return {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    username: user.username,
    role: user.role,
    isAdmin: user.role === 'admin',
    isSeller: user.isSeller,
    isCompany: user.isCompany,
    permissions: user.permissions || [],
    profilePicture: userProfile?.profilePicture || "https://via.placeholder.com/150",
    documentStatus: user.documentStatus,
    isWarned: user.isWarned,
    country: userProfile?.country,
    countryCode: userProfile?.countryCode,
  };
};

const resendVerificationEmail = async (email) => {
  const user = await User.findOne({ email });
  
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  if (user.isVerified) {
    const error = new Error('Email is already verified');
    error.statusCode = 400;
    throw error;
  }

  // Generate new token
  const newToken = crypto.randomBytes(32).toString('hex');
  user.verificationToken = newToken;
  user.verificationTokenExpiry = Date.now() + TOKEN_EXPIRY_DURATION;
  await user.save();

  // Send new verification email
  try {
    console.log(`📧 Resending verification email to ${user.email}`);
    await sendVerificationEmail(user.email, newToken);
    console.log(`✅ Verification email resent successfully to ${user.email}`);
  } catch (emailError) {
    const error = new Error(emailError.message || 'Failed to resend verification email');
    error.statusCode = 500;
    error.code = 'EMAIL_SEND_FAILED';
    throw error;
  }
  
  return {
    success: true,
    message: 'Verification email resent successfully'
  };
};

// Admin-specific functions
const createAdminUser = async (adminData) => {
  const { email, password, fullName, username, permissions = [] } = adminData;
  
  const existingUser = await User.findOne({ 
    $or: [{ email }, { username }] 
  });
  
  if (existingUser) {
    throw new Error('Admin user with this email or username already exists');
  }

  const adminUser = new User({
    email,
    password, // Will be hashed by pre-save hook
    fullName,
    username,
    role: 'admin',
    permissions,
    isVerified: true, // Admins are verified by default
    isSeller: false,
    isCompany: false,
  });

  await adminUser.save();

  // Create admin profile
  const adminProfile = new UserProfile({
    userId: adminUser._id,
    isCompany: false,
  });

  await adminProfile.save();

  return {
    success: true,
    admin: {
      id: adminUser._id,
      email: adminUser.email,
      fullName: adminUser.fullName,
      username: adminUser.username,
      role: adminUser.role,
      permissions: adminUser.permissions,
    }
  };
};

const updateUserRole = async (userId, newRole, permissions = []) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error('User not found');
  }

  const oldRole = user.role;
  user.role = newRole;
  user.permissions = permissions;
  
  // Update isSeller for backward compatibility
  if (newRole === 'freelancer') {
    user.isSeller = true;
  } else if (newRole === 'client') {
    user.isSeller = false;
  }

  await user.save();

  return {
    success: true,
    message: `User role updated from ${oldRole} to ${newRole}`,
    user: {
      id: user._id,
      role: user.role,
      permissions: user.permissions,
      isSeller: user.isSeller,
    }
  };
};

const getUserByEmail = async (email) => {
  return await User.findOne({ email });
};

const getUserById = async (userId) => {
  return await User.findById(userId).select('-password');
};

module.exports = {
  signUp,
  signIn,
  verifyEmail,
  resendVerificationEmail,
  createAdminUser,
  updateUserRole,
  getUserByEmail,
  getUserById,
};
