const express = require('express');
const router = express.Router();
const {
  getPrivacyPolicy,
  updatePrivacyPolicy,
  getTermsConditions,
  updateTermsConditions
} = require('../controllers/contentController');
const { verifyToken } = require('../middleware/jwt');

// Public routes - anyone can read
router.get('/privacy-policy', getPrivacyPolicy);
router.get('/terms-conditions', getTermsConditions);

// Protected routes - only authenticated users (admin) can update
router.put('/privacy-policy', verifyToken, updatePrivacyPolicy);
router.put('/terms-conditions', verifyToken, updateTermsConditions);

module.exports = router;
