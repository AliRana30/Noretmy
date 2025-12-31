const express = require('express');
const { handleSignup, handleLogin, handleLogout, handleEmailVerification, handleResendVerificationEmail, handleVerifiedEmail, getCountryInfo, handleForgotPassword, handleResetPassword } = require('../controllers/authController');

const router = express.Router();

router.post('/signup', handleSignup);
router.post('/login', handleLogin);
router.post('/logout', handleLogout);
router.get('/verify-email', handleEmailVerification);
router.post('/verified-email', handleVerifiedEmail);
router.post('/resend-verification-email', handleResendVerificationEmail);
router.post('/forget-password',handleForgotPassword)
router.post('/reset-password',handleResetPassword)

module.exports = router;
