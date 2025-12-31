const express = require("express");
const { handleStripeWebhook } = require("../controllers/stripeWebhookController");
// Legacy webhook handler (kept for reference)
// const { handleStripeWebhook: legacyHandler } = require("../controllers/PaymentController");
const router = express.Router();

// Main Stripe webhook endpoint with comprehensive event handling
router.post(
    '/stripe',
    express.raw({ type: 'application/json' }),
    handleStripeWebhook
);

// PayPal webhook (future implementation)
// router.post('/paypal', handlePaypalWebhook);

module.exports = router;
