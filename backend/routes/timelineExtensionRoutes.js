const express = require('express');
const router = express.Router();
const {
  createTimelineExtensionPayment,
  getOrderTimelineExtensions
} = require('../controllers/timelineExtensionController');
const { verifyTokenEnhanced } = require('../middleware/jwt');

router.post('/create-payment', verifyTokenEnhanced, createTimelineExtensionPayment);

router.get('/order/:orderId', verifyTokenEnhanced, getOrderTimelineExtensions);

module.exports = router;
