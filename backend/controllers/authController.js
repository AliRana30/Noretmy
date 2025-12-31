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

  console.log('Signup request received:', { email, fullName, username, isSeller, isCompany });

  try {
    // Validate required fields (username is optional, will be auto-generated)
    if (!email || !password || !fullName) {
      console.log('Validation failed: Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: email, password, and fullName are required',
      });
    }

    // Fetch country information
    console.log('Fetching country info...');
    const countryInfo = await getCountryInfo(req);
    console.log('Country info received:', countryInfo);

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

    console.log('Calling signUp service...');
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

    console.log('SignUp response:', { success: signUpResponse.success, message: signUpResponse.message });

    if (!signUpResponse.success) {
      return res.status(400).json({
        success: false,
        message: signUpResponse.message,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Verification email sent. Please check your email to verify your account.',
      user: signUpResponse.user,
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({
      success: false,
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
      isSeller:user.isSeller, // Keep for backward compatibility
    },process.env.JWT_KEY)

    // req.session.user = user;
    // const {password,...info}=user;

    res.cookie("accessToken",token,{
      httpOnly:true,
      secure: true, 
  sameSite: 'None',
   maxAge: 30 * 24 * 60 * 60 * 1000
    }).status(200)  
    .json(user); 

    
  } catch (error) {
    const statusCode = error.statusCode || 500;

    res.status(statusCode).json({
      success: false,
      message: error.message || 'Internal Server Error',
    });
    console.log(error);
  }
};


const handleVerifiedEmail = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email }); // Access email from req.body
    if (user && user.isVerified === true) {
      res.status(200).send("User is verified!");
    } else if (user && user.isVerified === false) {
      res.status(400).send("User is not verified");
    } else {
      res.status(404).send("User not found");
    }
  } catch (error) {
    res.status(500).send("Server error");
  }
};



const handleLogout = async (req, res) => {
  res.clearCookie("accessToken",{
    sameSite:"none",
    secure:true,

  }).status(200).send("User has been logged out!")
};

const handleEmailVerification = async (req, res,next) => {
  const { email, token } = req.query;
  try {
    await verifyEmail(email, token);
    res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    next(error)
  }
};

const handleResendVerificationEmail = async (req, res,next) => {
  const { email } = req.body;
  try {
    await resendVerificationEmail(email);
    res.status(200).json({ message: 'Verification email resent successfully' });
  } catch (error) {
    next(error)

  }
};




const handleForgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate reset token valid for 15 minutes
    const resetToken = jwt.sign({ email: user.email }, process.env.JWT_KEY, { expiresIn: "15m" });

    // Send email with reset link
    const resetLink = `https://noretmy.com/reset-password?token=${resetToken}`;
    await sendResetPasswordEmail(user.email,resetLink);

    res.json({ message: "Password reset link sent to your email" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// const handleResetPassword = async (req, res) => {
//   const { token, newPassword } = req.body;
//   try {
//     // Verify token
//     const decoded = jwt.verify(token, process.env.JWT_KEY);
//     console.log("Decoded token", decoded);
//     const user = await User.findOne({ email: decoded.email });

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
  console.log("Received reset request:", { token, passwordLength: password?.length });

  try {
    // Validate new password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        message: 'Password does not meet security requirements',
        errors: passwordValidation.errors,
        requirements: getPasswordRequirements()
      });
    }
    
    console.log("Verifying token...");
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    console.log("Token decoded successfully:", decoded);

    const user = await User.findOne({ email: decoded.email });
    console.log("User found in database:", user ? user.email : "User not found");

    if (!user) {
      console.log("Error: User does not exist or invalid token");
      return res.status(400).json({ message: "Invalid token or user does not exist" });
    }

    console.log("Hashing new password...");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    console.log("Updating user password...");
    user.password = hashedPassword;
    await user.save();

    console.log("Password reset successful!");
    res.json({ message: "Password reset successful. You can now log in." });

  } catch (error) {
    console.error("Error during password reset:", error);

    if (error.name === "TokenExpiredError") {
      return res.status(400).json({ message: "Token expired. Please request a new password reset link." });
    }
    
    if (error.name === "JsonWebTokenError") {
      return res.status(400).json({ message: "Invalid token." });
    }

    res.status(400).json({ message: "Invalid or expired token", error: error.message });
  }
};



module.exports = { handleSignup, handleLogin, handleLogout, handleEmailVerification,handleVerifiedEmail, handleResendVerificationEmail,getCountryInfo,handleForgotPassword,handleResetPassword };
