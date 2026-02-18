const bcrypt = require('bcryptjs');
const { sign } = require('jsonwebtoken');
const jwt=  require("jsonwebtoken")
const { signUp, signIn, verifyEmail, resendVerificationEmail } = require('../services/authService');
const User = require('../models/User');

const axios = require('axios');
const getCountryInfo = require('../services/locationService');
const { americanCountryCodes, europeanCountryCodes } = require('../utils/country');
const { sendResetPasswordEmail } = require('../services/emailService');

const handleSignup = async (req, res, next) => {
  const { email, password, fullName, username, isSeller, isCompany } = req.body;

  try {
    if (!email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: email, password, and fullName are required',
      });
    }

    const countryInfoPromise = getCountryInfo(req).catch(err => {
      console.error('Background country info fetch failed:', err.message);
      return { success: true, country: 'United States', countryCode: 'US' };
    });

    const signUpResponse = await signUp(
      email,
      password,
      fullName,
      username,
      isSeller,
      isCompany,
      countryInfoPromise
    );

    if (!signUpResponse.success) {
      return res.status(400).json({
        success: false,
        code: signUpResponse.code || 'SIGNUP_FAILED',
        message: signUpResponse.message,
        ...(signUpResponse.existingRole && { existingRole: signUpResponse.existingRole }),
        ...(signUpResponse.requestedRole && { requestedRole: signUpResponse.requestedRole })
      });
    }

    return res.status(201).json({
      success: true,
      code: signUpResponse.code || 'SIGNUP_SUCCESS',
      message: signUpResponse.message || (signUpResponse.emailSent 
        ? 'Account created successfully. Please check your email to verify your account.'
        : 'Account created successfully, but verification email failed. Please request a new verification email.'),
      emailSent: signUpResponse.emailSent !== false,
      user: signUpResponse.user,
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({
      success: false,
      code: 'SIGNUP_SERVER_ERROR',
      message: error.message || 'Internal server error during signup',
    });
  }
};

const handleLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Block admin access on main platform (pass true to block admins)
    const blockAdminAccess = true;
    const user = await signIn(email, password, blockAdminAccess);

    const token= sign({
      id:user.id,
      role:user.role,
      isSeller:user.isSeller,
    },process.env.JWT_KEY)


    res.cookie("accessToken",token,{
      httpOnly:true,
      secure: true, 
  sameSite: 'None',
   maxAge: 30 * 24 * 60 * 60 * 1000
    }).status(200)  
    .json({
      success: true,
      code: 'LOGIN_SUCCESS',
      message: 'Login successful',
      ...user,
      role: user.role || 'client',
      isAdmin: user.isAdmin || user.role === 'admin',
      token
    }); 

  } catch (error) {
    const statusCode = error.statusCode || 500;

    res.status(statusCode).json({
      success: false,
      code: error.code || 'LOGIN_ERROR',
      message: error.message || 'Internal Server Error',
    });
    }
};

const handleVerifiedEmail = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (user && user.isVerified === true) {
      return res.status(200).json({ success: true, code: 'EMAIL_VERIFIED', message: "User is verified!" });
    } else if (user && user.isVerified === false) {
      return res.status(400).json({ success: false, code: 'EMAIL_NOT_VERIFIED', message: "User is not verified" });
    } else {
      return res.status(404).json({ success: false, code: 'USER_NOT_FOUND', message: "User not found" });
    }
  } catch (error) {
    return res.status(500).json({ success: false, code: 'SERVER_ERROR', message: "Server error" });
  }
};

const handleLogout = async (req, res) => {
  res.clearCookie("accessToken", {
    sameSite: "none",
    secure: true,
  }).status(200).json({ 
    success: true, 
    code: 'LOGOUT_SUCCESS', 
    message: "User has been logged out!" 
  });
};

const handleEmailVerification = async (req, res, next) => {
  const { email, token } = req.query;
  try {
    await verifyEmail(email, token);
    res.status(200).json({ 
      success: true, 
      code: 'VERIFICATION_SUCCESS', 
      message: 'Email verified successfully' 
    });
  } catch (error) {
    next(error);
  }
};

const handleResendVerificationEmail = async (req, res, next) => {
  const { email } = req.body;
  try {
    await resendVerificationEmail(email);
    res.status(200).json({ 
      success: true, 
      code: 'RESEND_SUCCESS', 
      message: 'Verification email resent successfully' 
    });
  } catch (error) {
    next(error);
  }
};

const handleForgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        code: 'USER_NOT_FOUND', 
        message: "User not found" 
      });
    }

    const resetToken = jwt.sign({ email: user.email }, process.env.JWT_KEY, { expiresIn: "15m" });

    const resetLink = `https://noretmy.com/reset-password?token=${resetToken}`;
    const emailRes = await sendResetPasswordEmail(user.email, resetLink);

    if (!emailRes.success) {
      return res.status(500).json({ 
        success: false, 
        code: 'EMAIL_SEND_FAILED', 
        message: "Failed to send reset link. Please try again later." 
      });
    }

    res.json({ 
      success: true, 
      code: 'FORGOT_PASSWORD_SUCCESS', 
      message: "Password reset link sent to your email" 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      code: 'SERVER_ERROR', 
      message: "Server error", 
      error: error.message 
    });
  }
};





const { validatePassword, getPasswordRequirements } = require('../utils/passwordValidation');

const handleResetPassword = async (req, res) => {
  const { token, password } = req.body;
  try {
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_PASSWORD',
        message: 'Password does not meet security requirements',
        errors: passwordValidation.errors,
        requirements: getPasswordRequirements()
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    const user = await User.findOne({ email: decoded.email });
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        code: 'INVALID_TOKEN', 
        message: "Invalid token or user does not exist" 
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    user.password = hashedPassword;
    await user.save();

    res.json({ 
      success: true, 
      code: 'RESET_PASSWORD_SUCCESS', 
      message: "Password reset successful. You can now log in." 
    });

  } catch (error) {
    console.error("Error during password reset:", error);

    if (error.name === "TokenExpiredError") {
      return res.status(400).json({ 
        success: false, 
        code: 'TOKEN_EXPIRED', 
        message: "Token expired. Please request a new password reset link." 
      });
    }
    
    if (error.name === "JsonWebTokenError") {
      return res.status(400).json({ 
        success: false, 
        code: 'INVALID_TOKEN', 
        message: "Invalid token." 
      });
    }

    res.status(400).json({ 
      success: false, 
      code: 'RESET_ERROR', 
      message: "Invalid or expired token", 
      error: error.message 
    });
  }
};

module.exports = { handleSignup, handleLogin, handleLogout, handleEmailVerification,handleVerifiedEmail, handleResendVerificationEmail,getCountryInfo,handleForgotPassword,handleResetPassword };
