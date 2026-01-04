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
    // Validate required fields (username is optional, will be auto-generated)
    if (!email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: email, password, and fullName are required',
      });
    }

    // Fetch country information
    const countryInfo = await getCountryInfo(req);
    if (!countryInfo.success) {
      console.error('Country info fetch failed:', countryInfo);
      return res.status(400).json({
        success: false,
        message: 'Unable to fetch country information',
        error: countryInfo.error,
      });
    }

    // const allowedOrigins =  [...americanCountryCodes,...europeanCountryCodes];

    // if (!allowedOrigins.includes(countryInfo.countryCode)) {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Registration is only allowed for users from Europe or America.',
    //   });
    // }

    const signUpResponse = await signUp(
      email,
      password,
      fullName,
      username,
      isSeller,
      isCompany,
      countryInfo.country,
      countryInfo.countryCode
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
      message: signUpResponse.emailSent 
        ? 'Account created successfully. Please check your email to verify your account.'
        : 'Account created successfully, but verification email failed. Please request a new verification email.',
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
    const user = await signIn(email, password);

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

    // Generate reset token valid for 15 minutes
    const resetToken = jwt.sign({ email: user.email }, process.env.JWT_KEY, { expiresIn: "15m" });

    // Send email with reset link
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

// const handleResetPassword = async (req, res) => {
//   const { token, newPassword } = req.body;
//   try {
//     // Verify token
//     const decoded = jwt.verify(token, process.env.JWT_KEY);
//     //     const user = await User.findOne({ email: decoded.email });

//     if (!user) {
//       return res.status(400).json({ message: "Invalid token or user does not exist" });
//     }

//     // Hash and update password
//     const salt = await bcrypt.genSalt(10);
//     user.password = await bcrypt.hash(newPassword, salt);
//     await user.save();

//     res.json({ message: "Password reset successful. You can now log in." });
//   } catch (error) {
//     res.status(400).json({ message: "Invalid or expired token", error: error.message });
//   }
// };

const { validatePassword, getPasswordRequirements } = require('../utils/passwordValidation');

const handleResetPassword = async (req, res) => {
  const { token, password } = req.body;
  try {
    // Validate new password strength
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
