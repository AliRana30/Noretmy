const express = require('express');
const router = express.Router();
const {
  getPrivacyPolicy,
  updatePrivacyPolicy,
  getTermsConditions,
  updateTermsConditions
} = require('../controllers/contentController');
const { verifyToken } = require('../middleware/jwt');

router.get('/privacy-policy', getPrivacyPolicy);
router.get('/terms-conditions', getTermsConditions);

router.put('/privacy-policy', verifyToken, updatePrivacyPolicy);
router.put('/terms-conditions', verifyToken, updateTermsConditions);

module.exports = router;
