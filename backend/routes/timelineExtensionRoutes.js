const express = require('express');
const router = express.Router();
const {
  createTimelineExtensionPayment,
  getOrderTimelineExtensions
} = require('../controllers/timelineExtensionController');
const { verifyTokenEnhanced } = require('../middleware/jwt');

// Create timeline extension payment intent
router.post('/create-payment', verifyTokenEnhanced, createTimelineExtensionPayment);

// Get timeline extensions for an order
router.get('/order/:orderId', verifyTokenEnhanced, getOrderTimelineExtensions);

module.exports = router;
