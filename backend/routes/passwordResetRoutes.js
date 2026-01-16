const express = require('express');
const router = express.Router();
const {
  requestPasswordReset,
  resetPassword,
  verifyResetToken
} = require('../controllers/passwordResetController');

// Request password reset
router.post('/request', requestPasswordReset);

// Verify reset token
router.get('/verify/:token', verifyResetToken);

// Reset password
router.post('/reset', resetPassword);

module.exports = router;
