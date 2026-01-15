const express = require('express');
const { createCustomerAndPaymentIntent,withdrawFunds,processRefund } = require('../controllers/PaymentController');
const { handleStripeWebhook } = require('../controllers/stripeWebhookController');
const bodyParser = require('body-parser');

const router = express.Router();

router.post('/create-payment-intent', createCustomerAndPaymentIntent);

router.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

router.post('/withdraw', withdrawFunds);

router.post('/refund', processRefund);

module.exports = router;
