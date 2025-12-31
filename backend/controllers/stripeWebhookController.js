// controllers/stripeWebhookController.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/Order');
const User = require('../models/User');
const Freelancer = require('../models/Freelancer');
const PaymentMilestone = require('../models/PaymentMilestone');
const PromotionPurchase = require('../models/PromotionPurchase');
const Job = require('../models/Job');
const notificationService = require('../services/notificationService');
const paymentMilestoneService = require('../services/paymentMilestoneService');
const { sendOrderSuccessEmail, sendSellerOrderNotificationEmail, sendPaymentFailedEmail } = require('../services/emailService');

/**
 * Main Stripe Webhook Handler
 * Handles all Stripe events with proper error handling and idempotency
 */
const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;

  console.log('[Stripe Webhook] Received webhook request');

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    console.log('[Stripe Webhook] Event verified:', event.type, 'ID:', event.id);

    // Process event based on type
    const result = await processWebhookEvent(event);
    
    if (result.success) {
      console.log('[Stripe Webhook] Event processed successfully:', event.type);
      res.status(200).json({ received: true, processed: true });
    } else {
      console.warn('[Stripe Webhook] Event processed with warning:', result.message);
      res.status(200).json({ received: true, processed: false, message: result.message });
    }

  } catch (err) {
    console.error('[Stripe Webhook] Error:', err.message);
    
    if (err.type === 'StripeSignatureVerificationError') {
      return res.status(400).send(`Webhook signature verification failed: ${err.message}`);
    }
    
    // Return 200 for other errors to prevent Stripe retries for non-recoverable errors
    res.status(200).json({ received: true, error: err.message });
  }
};

/**
 * Process webhook event based on type
 */
const processWebhookEvent = async (event) => {
  const { type, data } = event;
  const object = data.object;

  switch (type) {
    // Payment Intent Events
    case 'payment_intent.succeeded':
      return await handlePaymentIntentSucceeded(object);
      
    case 'payment_intent.payment_failed':
      return await handlePaymentIntentFailed(object);
      
    case 'payment_intent.canceled':
      return await handlePaymentIntentCanceled(object);
      
    case 'payment_intent.requires_action':
      return await handlePaymentIntentRequiresAction(object);

    // Charge Events
    case 'charge.succeeded':
      return await handleChargeSucceeded(object);
      
    case 'charge.captured':
      return await handleChargeCaptured(object);
      
    case 'charge.refunded':
      return await handleChargeRefunded(object);
      
    case 'charge.failed':
      return await handleChargeFailed(object);

    // Checkout Session Events
    case 'checkout.session.completed':
      return await handleCheckoutSessionCompleted(object);
      
    case 'checkout.session.expired':
      return await handleCheckoutSessionExpired(object);

    // Payout Events (for connected accounts)
    case 'payout.paid':
      return await handlePayoutPaid(object);
      
    case 'payout.failed':
      return await handlePayoutFailed(object);

    // Transfer Events
    case 'transfer.created':
      return await handleTransferCreated(object);
      
    case 'transfer.reversed':
      return await handleTransferReversed(object);

    // Account Events (for connected accounts)
    case 'account.updated':
      return await handleAccountUpdated(object);

    default:
      console.log(`[Stripe Webhook] Unhandled event type: ${type}`);
      return { success: true, message: `Unhandled event type: ${type}` };
  }
};

/**
 * Handle successful payment intent
 */
const handlePaymentIntentSucceeded = async (paymentIntent) => {
  const { id, amount_received, payment_method, metadata } = paymentIntent;
  const { paymentType, orderId, userId, gigId, promotionPlan } = metadata;

  console.log('[Webhook] payment_intent.succeeded:', id, 'Type:', paymentType);

  try {
    // Idempotency check
    const existingOrder = await Order.findOne({ payment_intent: id, isPaid: true });
    if (existingOrder && paymentType === 'order_payment') {
      console.log('[Webhook] Payment already processed for order:', existingOrder._id);
      return { success: true, message: 'Already processed' };
    }

    if (paymentType === 'order_payment') {
      return await processOrderPayment(paymentIntent);
    } else if (paymentType === 'gig_promotion' || paymentType === 'monthly_promotion') {
      return await processPromotionPayment(paymentIntent);
    } else if (paymentType === 'timeline_extension') {
      return await processTimelineExtensionPayment(paymentIntent);
    }

    return { success: true, message: 'Unknown payment type' };

  } catch (error) {
    console.error('[Webhook] Error processing payment_intent.succeeded:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Process order payment
 */
const processOrderPayment = async (paymentIntent) => {
  const { id, amount_received, payment_method, metadata } = paymentIntent;
  const { orderId, vatRate, discount } = metadata;

  const order = await Order.findOneAndUpdate(
    { payment_intent: id },
    {
      isCompleted: true,
      status: 'started',
      isPaid: true,
      paymentStatus: 'completed',
      paymentMethod: payment_method,
      amount_received: amount_received / 100,
      paymentMilestoneStage: 'in_escrow',
      escrowStatus: 'full',
      $push: {
        statusHistory: { status: 'started', createdAt: Date.now() },
        timeline: {
          event: 'Payment Confirmed',
          description: 'Payment secured in escrow. Order started.',
          timestamp: new Date(),
          actor: 'system'
        }
      }
    },
    { new: true }
  );

  if (!order) {
    console.error('[Webhook] Order not found for PaymentIntent:', id);
    return { success: false, message: 'Order not found' };
  }

  // Create payment milestone record
  const milestone = new PaymentMilestone({
    orderId: order._id,
    stage: 'in_escrow',
    percentageOfTotal: 100,
    amount: amount_received / 100,
    currency: order.currency || 'USD',
    stripePaymentIntentId: id,
    paymentStatus: 'held_in_escrow',
    capturedAt: new Date(),
    triggeredBy: {
      role: 'system',
      action: 'payment_succeeded'
    }
  });
  await milestone.save();

  // Update order payment breakdown
  order.paymentBreakdown = {
    ...order.paymentBreakdown,
    escrowAmount: amount_received / 100
  };
  await order.save();

  // Fetch seller and buyer
  const [seller, buyer, gig] = await Promise.all([
    User.findById(order.sellerId),
    User.findById(order.buyerId),
    Job.findById(order.gigId)
  ]);

  // Add to seller's pending revenue
  if (seller) {
    const { getSellerPayout } = require('../services/priceUtil');
    const netEarnings = getSellerPayout(order.price);
    
    seller.revenue = seller.revenue || { total: 0, pending: 0, available: 0, withdrawn: 0 };
    seller.revenue.total += netEarnings;
    seller.revenue.pending += netEarnings;
    await seller.save();

    // Also update Freelancer record
    const freelancer = await Freelancer.findOne({ userId: order.sellerId });
    if (freelancer) {
      freelancer.revenue = freelancer.revenue || { total: 0, pending: 0, available: 0, withdrawn: 0, inTransit: 0 };
      freelancer.revenue.total += netEarnings;
      freelancer.revenue.pending += netEarnings;
      await freelancer.save();
    }

    console.log(`[Webhook] $${netEarnings} added to pending for ${seller.username}`);
  }

  // Send notifications
  if (buyer && seller && gig) {
    const buyerData = {
      _id: order._id,
      price: order.price,
      createdAt: order.createdAt,
      vatRate: vatRate || 0,
      customerName: buyer.username,
      gigTitle: gig.title,
      discount: discount || 0
    };

    const sellerData = {
      _id: order._id,
      price: order.price,
      createdAt: order.createdAt,
      gigTitle: gig.title,
      sellerName: seller.username
    };

    await Promise.all([
      sendOrderSuccessEmail(buyer.email, buyerData),
      sendSellerOrderNotificationEmail(seller.email, sellerData),
      notificationService.createNotification({
        userId: seller._id,
        title: '💰 New Order Received',
        message: `New order for "${gig.title}" - $${order.price}`,
        type: 'order',
        link: `/orders/${order._id}`
      })
    ]);
  }

  console.log('[Webhook] Order payment processed:', order._id);
  return { success: true };
};

/**
 * Process promotion payment
 */
const processPromotionPayment = async (paymentIntent) => {
  const { id, amount_received, metadata } = paymentIntent;
  const { userId, gigId, promotionPlan, vatRate, baseAmount, vatAmount, platformFee, paymentType } = metadata;
  const mongoose = require('mongoose');

  // Idempotency check
  const existingPurchase = await PromotionPurchase.findOne({ stripePaymentIntentId: id });
  if (existingPurchase) {
    console.log('[Webhook] Promotion already processed:', id);
    return { success: true, message: 'Already processed' };
  }

  const { PROMOTION_PLANS, getPlan } = require('../utils/promotionPlans');
  const plan = getPlan(promotionPlan);
  if (!plan) {
    return { success: false, message: 'Invalid promotion plan' };
  }

  const user = await User.findById(userId);
  if (!user) {
    return { success: false, message: 'User not found' };
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

  const promotionPurchase = new PromotionPurchase({
    stripePaymentIntentId: id,
    userId: new mongoose.Types.ObjectId(userId),
    planKey: plan.key,
    planName: plan.name,
    planPriority: plan.priority,
    promotionType: paymentType === 'gig_promotion' ? 'single_gig' : 'all_gigs',
    gigId: gigId ? new mongoose.Types.ObjectId(gigId) : null,
    status: 'active',
    purchasedAt: now,
    activatedAt: now,
    expiresAt: expiresAt,
    baseAmount: parseFloat(baseAmount || plan.price),
    vatRate: parseFloat(vatRate || 0),
    vatAmount: parseFloat(vatAmount || 0),
    platformFee: parseFloat(platformFee || 0),
    totalAmount: amount_received / 100,
    durationDays: plan.durationDays
  });

  await promotionPurchase.save();

  // Notify user
  await notificationService.createNotification({
    userId: user._id,
    title: '🚀 Promotion Activated',
    message: `Your "${plan.name}" promotion is now active!`,
    type: 'payment',
    link: '/promote-gigs'
  });

  console.log('[Webhook] Promotion payment processed:', promotionPurchase._id);
  return { success: true };
};

/**
 * Process timeline extension payment
 */
const processTimelineExtensionPayment = async (paymentIntent) => {
  const { processTimelineExtension } = require('./timelineExtensionController');
  const success = await processTimelineExtension(paymentIntent);
  return { success };
};

/**
 * Handle failed payment intent
 */
const handlePaymentIntentFailed = async (paymentIntent) => {
  const { id, last_payment_error, metadata } = paymentIntent;
  const { orderId, userId } = metadata;

  console.log('[Webhook] payment_intent.payment_failed:', id);

  try {
    // Update order status
    const order = await Order.findOneAndUpdate(
      { payment_intent: id },
      {
        paymentStatus: 'failed',
        last_payment_error: last_payment_error?.message || 'Payment failed',
        $push: {
          timeline: {
            event: 'Payment Failed',
            description: last_payment_error?.message || 'Payment failed',
            timestamp: new Date(),
            actor: 'system'
          }
        }
      },
      { new: true }
    );

    if (order) {
      // Create failed milestone record
      const milestone = new PaymentMilestone({
        orderId: order._id,
        stage: order.paymentMilestoneStage || 'order_placed',
        percentageOfTotal: 0,
        amount: 0,
        currency: order.currency || 'USD',
        stripePaymentIntentId: id,
        paymentStatus: 'failed',
        failedAt: new Date(),
        failureReason: last_payment_error?.message,
        failureCode: last_payment_error?.code,
        triggeredBy: {
          role: 'system',
          action: 'payment_failed'
        }
      });
      await milestone.save();

      // Notify buyer
      const buyer = await User.findById(order.buyerId);
      if (buyer) {
        await notificationService.createNotification({
          userId: buyer._id,
          title: '❌ Payment Failed',
          message: `Your payment failed: ${last_payment_error?.message || 'Unknown error'}. Please try again.`,
          type: 'alert',
          link: `/orders/${order._id}`
        });

        // Send email
        try {
          await sendPaymentFailedEmail(buyer.email, {
            orderId: order._id,
            error: last_payment_error?.message
          });
        } catch (emailErr) {
          console.error('[Webhook] Failed to send payment failed email:', emailErr);
        }
      }
    }

    return { success: true };

  } catch (error) {
    console.error('[Webhook] Error handling payment failure:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Handle canceled payment intent
 */
const handlePaymentIntentCanceled = async (paymentIntent) => {
  const { id, metadata } = paymentIntent;
  
  console.log('[Webhook] payment_intent.canceled:', id);

  const order = await Order.findOneAndUpdate(
    { payment_intent: id },
    {
      paymentStatus: 'cancelled',
      $push: {
        timeline: {
          event: 'Payment Cancelled',
          description: 'Payment was cancelled',
          timestamp: new Date(),
          actor: 'system'
        }
      }
    }
  );

  return { success: true };
};

/**
 * Handle payment requiring action (3D Secure, etc.)
 */
const handlePaymentIntentRequiresAction = async (paymentIntent) => {
  const { id, metadata } = paymentIntent;
  
  console.log('[Webhook] payment_intent.requires_action:', id);

  // Notify user that action is required
  if (metadata.userId) {
    await notificationService.createNotification({
      userId: metadata.userId,
      title: '⚠️ Action Required',
      message: 'Additional verification is required to complete your payment.',
      type: 'alert',
      link: metadata.orderId ? `/orders/${metadata.orderId}` : '/orders'
    });
  }

  return { success: true };
};

/**
 * Handle successful charge
 */
const handleChargeSucceeded = async (charge) => {
  console.log('[Webhook] charge.succeeded:', charge.id);
  // Most logic handled in payment_intent.succeeded
  return { success: true };
};

/**
 * Handle captured charge (for manual capture)
 */
const handleChargeCaptured = async (charge) => {
  const { id, payment_intent, amount_captured, metadata } = charge;
  
  console.log('[Webhook] charge.captured:', id, 'Amount:', amount_captured);

  // Update order with capture info
  const order = await Order.findOneAndUpdate(
    { payment_intent },
    {
      stripeChargeId: id,
      escrowLockedAt: new Date(),
      $push: {
        timeline: {
          event: 'Funds Captured',
          description: `$${(amount_captured / 100).toFixed(2)} captured and held in escrow`,
          timestamp: new Date(),
          actor: 'system'
        }
      }
    }
  );

  return { success: true };
};

/**
 * Handle refunded charge
 */
const handleChargeRefunded = async (charge) => {
  const { id, payment_intent, amount_refunded, metadata } = charge;
  
  console.log('[Webhook] charge.refunded:', id, 'Amount:', amount_refunded);

  const order = await Order.findOneAndUpdate(
    { stripeChargeId: id },
    {
      paymentStatus: 'refunded',
      escrowStatus: 'refunded',
      $push: {
        timeline: {
          event: 'Refund Processed',
          description: `$${(amount_refunded / 100).toFixed(2)} refunded`,
          timestamp: new Date(),
          actor: 'system'
        }
      }
    }
  );

  if (order) {
    // Update freelancer pending balance
    const freelancer = await Freelancer.findOne({ userId: order.sellerId });
    if (freelancer && freelancer.revenue) {
      const refundAmount = amount_refunded / 100;
      freelancer.revenue.pending = Math.max(0, freelancer.revenue.pending - refundAmount);
      freelancer.revenue.total = Math.max(0, freelancer.revenue.total - refundAmount);
      await freelancer.save();
    }

    // Notify both parties
    await Promise.all([
      notificationService.createNotification({
        userId: order.buyerId,
        title: '💸 Refund Processed',
        message: `$${(amount_refunded / 100).toFixed(2)} has been refunded to your payment method.`,
        type: 'payment',
        link: `/orders/${order._id}`
      }),
      notificationService.createNotification({
        userId: order.sellerId,
        title: '💸 Order Refunded',
        message: `Order #${order._id} has been refunded.`,
        type: 'payment',
        link: `/orders/${order._id}`
      })
    ]);
  }

  return { success: true };
};

/**
 * Handle failed charge
 */
const handleChargeFailed = async (charge) => {
  console.log('[Webhook] charge.failed:', charge.id);
  // Handled in payment_intent.payment_failed
  return { success: true };
};

/**
 * Handle completed checkout session
 */
const handleCheckoutSessionCompleted = async (session) => {
  const { id, payment_intent, metadata, customer_email } = session;
  
  console.log('[Webhook] checkout.session.completed:', id);

  // Most logic handled via payment_intent webhook
  return { success: true };
};

/**
 * Handle expired checkout session
 */
const handleCheckoutSessionExpired = async (session) => {
  const { id, metadata } = session;
  
  console.log('[Webhook] checkout.session.expired:', id);

  if (metadata.orderId) {
    await Order.findByIdAndUpdate(metadata.orderId, {
      paymentStatus: 'failed',
      $push: {
        timeline: {
          event: 'Checkout Expired',
          description: 'Payment session expired',
          timestamp: new Date(),
          actor: 'system'
        }
      }
    });
  }

  return { success: true };
};

/**
 * Handle successful payout to connected account
 */
const handlePayoutPaid = async (payout) => {
  const { id, amount, destination, metadata } = payout;
  
  console.log('[Webhook] payout.paid:', id, 'Amount:', amount);

  // Find freelancer by Stripe account
  const freelancer = await Freelancer.findOne({ stripeAccountId: destination });
  
  if (freelancer) {
    // Update payout status
    const payoutRecord = freelancer.payouts?.find(p => p.stripePayoutId === id);
    if (payoutRecord) {
      payoutRecord.status = 'paid';
      payoutRecord.completedAt = new Date();
    }
    
    // Move from inTransit to withdrawn
    const payoutAmount = amount / 100;
    freelancer.revenue.inTransit = Math.max(0, freelancer.revenue.inTransit - payoutAmount);
    freelancer.revenue.withdrawn += payoutAmount;
    
    await freelancer.save();

    // Notify freelancer
    await notificationService.createNotification({
      userId: freelancer.userId,
      title: '💰 Payout Received',
      message: `$${payoutAmount.toFixed(2)} has been deposited to your account.`,
      type: 'payment',
      link: '/wallet'
    });
  }

  return { success: true };
};

/**
 * Handle failed payout
 */
const handlePayoutFailed = async (payout) => {
  const { id, amount, failure_message, destination } = payout;
  
  console.log('[Webhook] payout.failed:', id);

  const freelancer = await Freelancer.findOne({ stripeAccountId: destination });
  
  if (freelancer) {
    // Update payout status
    const payoutRecord = freelancer.payouts?.find(p => p.stripePayoutId === id);
    if (payoutRecord) {
      payoutRecord.status = 'failed';
      payoutRecord.failureReason = failure_message;
    }
    
    // Move back from inTransit to available
    const payoutAmount = amount / 100;
    freelancer.revenue.inTransit = Math.max(0, freelancer.revenue.inTransit - payoutAmount);
    freelancer.revenue.available += payoutAmount;
    freelancer.availableBalance = freelancer.revenue.available;
    
    await freelancer.save();

    // Notify freelancer
    await notificationService.createNotification({
      userId: freelancer.userId,
      title: '❌ Payout Failed',
      message: `Your payout of $${payoutAmount.toFixed(2)} failed: ${failure_message}. Funds returned to available balance.`,
      type: 'alert',
      link: '/wallet'
    });
  }

  return { success: true };
};

/**
 * Handle transfer created (to connected account)
 */
const handleTransferCreated = async (transfer) => {
  const { id, amount, destination, metadata } = transfer;
  
  console.log('[Webhook] transfer.created:', id);

  if (metadata.orderId) {
    await Order.findByIdAndUpdate(metadata.orderId, {
      stripeTransferId: id,
      fundsReleasedAt: new Date()
    });
  }

  return { success: true };
};

/**
 * Handle reversed transfer
 */
const handleTransferReversed = async (transfer) => {
  const { id, amount_reversed, metadata } = transfer;
  
  console.log('[Webhook] transfer.reversed:', id);

  // Handle if needed - typically for disputes
  return { success: true };
};

/**
 * Handle connected account updates
 */
const handleAccountUpdated = async (account) => {
  const { id, charges_enabled, payouts_enabled, details_submitted } = account;
  
  console.log('[Webhook] account.updated:', id);

  const freelancer = await Freelancer.findOne({ stripeAccountId: id });
  
  if (freelancer) {
    freelancer.payoutAccountVerified = charges_enabled && payouts_enabled;
    freelancer.onboardingStatus = details_submitted ? 'completed' : 'pending';
    await freelancer.save();

    if (charges_enabled && payouts_enabled) {
      await notificationService.createNotification({
        userId: freelancer.userId,
        title: '✅ Account Verified',
        message: 'Your payment account is now verified. You can receive payouts!',
        type: 'success',
        link: '/wallet'
      });
    }
  }

  return { success: true };
};

module.exports = {
  handleStripeWebhook
};
