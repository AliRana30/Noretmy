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

  console.log('\n========== STRIPE WEBHOOK RECEIVED ==========');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Signature present:', !!sig);
  console.log('Endpoint secret configured:', !!endpointSecret);

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    console.log('✅ Webhook signature verified');
    console.log('Event type:', event.type);
    console.log('Event ID:', event.id);
    console.log('Payment Intent ID:', event.data.object.id);
    console.log('Metadata:', JSON.stringify(event.data.object.metadata, null, 2));
    // Process event based on type
    const result = await processWebhookEvent(event);
    
    if (result.success) {
      res.status(200).json({ received: true, processed: true });
    } else {
      console.warn('[Stripe Webhook] Event processed with warning:', result.message);
      res.status(200).json({ received: true, processed: false, message: result.message });
    }

  } catch (err) {
    console.error('[Stripe Webhook] Error:', err.message);
    console.error('[Stripe Webhook] Error Details:', {
      type: err.type,
      message: err.message,
      stack: err.stack,
      hasSignature: !!sig,
      hasEndpointSecret: !!endpointSecret,
      bodyType: typeof req.body,
      bodyLength: req.body?.length || 0
    });
    
    if (err.type === 'StripeSignatureVerificationError') {
      console.error('[Stripe Webhook] SIGNATURE VERIFICATION FAILED - Check STRIPE_WEBHOOK_SECRET in production');
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
    case 'payment_intent.amount_capturable_updated':
      return await handlePaymentIntentAmountCapturableUpdated(object);

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
      return { success: true, message: `Unhandled event type: ${type}` };
  }
};

/**
 * Handle successful payment intent
 */
const handlePaymentIntentSucceeded = async (paymentIntent) => {
  const { id, amount_received, payment_method, metadata } = paymentIntent;
  const { paymentType, orderId, userId, gigId, promotionPlan } = metadata;

  try {
    // Idempotency check
    const existingOrder = await Order.findOne({ payment_intent: id, isPaid: true });
    if (existingOrder && paymentType === 'order_payment') {
      return { success: true, message: 'Already processed' };
    }

    if (paymentType === 'order_payment') {
      return await processOrderPayment(paymentIntent);
    } else if (paymentType === 'gig_promotion' || paymentType === 'monthly_promotion' || paymentType === 'monthly_promotional') {
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
 * Handle manual-capture authorization event (fires after confirm for capture_method=manual)
 * This is where we should initialize order state and capture the first 10%.
 */
const handlePaymentIntentAmountCapturableUpdated = async (paymentIntent) => {
  const { id, metadata } = paymentIntent;
  const paymentType = metadata?.paymentType;

  try {
    if (paymentType !== 'order_payment') {
      return { success: true, message: 'Not an order payment' };
    }

    // Idempotency: if we already created the accepted milestone, skip
    const existingMilestone = await PaymentMilestone.findOne({ stripePaymentIntentId: id, stage: 'accepted' });
    if (existingMilestone) {
      return { success: true, message: 'Already processed capturable event' };
    }

    return await processOrderPayment(paymentIntent);
  } catch (error) {
    console.error('[Webhook] Error processing payment_intent.amount_capturable_updated:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Process order payment
 */
const processOrderPayment = async (paymentIntent) => {
  const { id, amount_received, amount, payment_method, metadata } = paymentIntent;
  const { orderId, vatRate, discount } = metadata;

  console.log('\n========== PROCESSING ORDER PAYMENT ==========');
  console.log('Payment Intent ID:', id);
  console.log('Order ID from metadata:', orderId);
  console.log('Amount:', (amount_received || amount) / 100);

  // Calculate milestone amounts based on total order amount
  // With manual capture, amount_received can be 0 at authorization time, so fall back to amount.
  const totalAmountCents = (amount_received && amount_received > 0) ? amount_received : amount;
  const totalAmount = (totalAmountCents || 0) / 100;
  const acceptedAmount = totalAmount * 0.10; // 10% on accept
  const escrowAmount = totalAmount * 0.50;   // 50% in escrow
  const deliveryAmount = totalAmount * 0.20; // 20% on delivery
  const reviewAmount = totalAmount * 0.20;   // 20% on review

  const order = await Order.findOneAndUpdate(
    { payment_intent: id },
    {
      isCompleted: false, // Order not fully completed yet
      status: 'accepted', // Start at accepted status
      progress: 20, // Set progress to 20 (accepted level)
      isPaid: true,
      paymentStatus: 'completed',
      paymentMethod: payment_method,
      amount_received: totalAmount,
      paymentMilestoneStage: 'accepted', // Start at accepted milestone
      escrowStatus: 'partial', // Only partial amount captured
      $push: {
        statusHistory: { status: 'accepted', createdAt: Date.now() },
        timeline: {
          event: 'Payment Confirmed',
          description: `Payment authorized. 10% ($${acceptedAmount.toFixed(2)}) captured for order acceptance.`,
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

  console.log('[Webhook] Order updated successfully:', order._id, 'Status:', order.status, 'Progress:', order.progress);

  // IMPORTANT: With manual capture, payment_intent.succeeded means AUTHORIZED, not captured
  // We must explicitly capture the 10% portion now
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  try {
    const captureAmount = Math.round(acceptedAmount * 100); // Convert to cents
    const capturedPayment = await stripe.paymentIntents.capture(id, {
      amount_to_capture: captureAmount
    });
    console.log('[Webhook] Successfully captured 10% ($', acceptedAmount.toFixed(2), ') - Capture ID:', capturedPayment.id);
  } catch (captureError) {
    console.error('[Webhook] Failed to capture 10% payment:', captureError.message);
    // Update order to reflect capture failure
    order.paymentStatus = 'capture_failed';
    order.timeline.push({
      event: 'Capture Failed',
      description: `Failed to capture 10% payment: ${captureError.message}`,
      timestamp: new Date(),
      actor: 'system'
    });
    await order.save();
    return { success: false, message: 'Capture failed' };
  }

  // Create payment milestone record for accepted stage (10%)
  const milestone = new PaymentMilestone({
    orderId: order._id,
    stage: 'accepted',
    percentageOfTotal: 10,
    amount: acceptedAmount,
    currency: order.currency || 'USD',
    stripePaymentIntentId: id,
    paymentStatus: 'captured',
    capturedAt: new Date(),
    triggeredBy: {
      role: 'system',
      action: 'payment_succeeded'
    }
  });
  await milestone.save();

  // Update order payment breakdown with proper distribution
  order.paymentBreakdown = {
    authorizedAmount: acceptedAmount,     // 10% captured on accept
    escrowAmount: escrowAmount,           // 50% will be captured when work starts
    deliveryAmount: deliveryAmount,       // 20% on delivery
    reviewAmount: reviewAmount,           // 20% on review
    totalReleasedAmount: 0,
    pendingReleaseAmount: acceptedAmount  // 10% pending release
  };
  await order.save();

  // Fetch seller and buyer
  const [seller, buyer, gig] = await Promise.all([
    User.findById(order.sellerId),
    User.findById(order.buyerId),
    Job.findById(order.gigId)
  ]);

  // Add only the accepted amount (10%) to seller's pending revenue
  if (seller) {
    const { getSellerPayout } = require('../services/priceUtil');
    // Calculate seller's net from the 10% accepted amount
    const sellerNetFromAccepted = getSellerPayout(acceptedAmount);
    
    seller.revenue = seller.revenue || { total: 0, pending: 0, available: 0, withdrawn: 0 };
    seller.revenue.total += sellerNetFromAccepted;
    seller.revenue.pending += sellerNetFromAccepted;
    await seller.save();

    // Also update Freelancer record
    const freelancer = await Freelancer.findOne({ userId: order.sellerId });
    if (freelancer) {
      freelancer.revenue = freelancer.revenue || { total: 0, pending: 0, available: 0, withdrawn: 0, inTransit: 0 };
      freelancer.revenue.total += sellerNetFromAccepted;
      freelancer.revenue.pending += sellerNetFromAccepted;
      await freelancer.save();
    }

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
        message: `${buyer.username || buyer.fullName || 'A customer'} placed an order for "${gig.title}" - $${order.price}`,
        type: 'order',
        link: `/orders/${order._id}`
      })
    ]);

    // Notify admin about new order
    const Admin = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 });
    if (Admin) {
      await notificationService.createNotification({
        userId: Admin._id,
        title: '💵 New Order Placed',
        message: `${buyer.username || buyer.fullName || 'A customer'} placed an order with ${seller.username || seller.fullName || 'a seller'} - $${order.price}`,
        type: 'system',
        link: `/admin/orders/${order._id}`
      });

      // Emit real-time notification to admin
      const io = req.app?.get('io');
      if (io) {
        const adminSocketId = io.getUserSocket?.(Admin._id.toString());
        if (adminSocketId) {
          io.to(adminSocketId).emit('newNotification', {
            title: '💵 New Order',
            message: `${buyer.username || 'Customer'} ordered from ${seller.username || 'seller'}`,
            type: 'system'
          });
        }
      }
    }
  }

  return { success: true };
};

/**
 * Process promotion payment
 */
const processPromotionPayment = async (paymentIntent) => {
  const { id, amount_received, metadata } = paymentIntent;
  const { userId, gigId, promotionPlan, vatRate, baseAmount, vatAmount, platformFee, paymentType } = metadata;
  const mongoose = require('mongoose');

  console.log('\n========== PROCESSING PROMOTION PAYMENT ==========');
  console.log('Payment Intent ID:', id);
  console.log('Payment Type:', paymentType);
  console.log('User ID:', userId);
  console.log('Gig ID:', gigId || 'N/A (all gigs)');
  console.log('Promotion Plan:', promotionPlan);
  console.log('Amount Received:', amount_received / 100);

  // Idempotency check
  const existingPurchase = await PromotionPurchase.findOne({ stripePaymentIntentId: id });
  if (existingPurchase) {
    console.log('⚠️  Promotion already processed - skipping', {
      promotionId: existingPurchase._id,
      status: existingPurchase.status,
      createdAt: existingPurchase.purchasedAt
    });
    return { success: true, message: 'Already processed' };
  }
  console.log('✅ No duplicate found - proceeding with creation');

  const { PROMOTION_PLANS, getPlan } = require('../utils/promotionPlans');
  const plan = getPlan(promotionPlan);
  if (!plan) {
    console.error('[Webhook] Invalid promotion plan:', promotionPlan);
    return { success: false, message: 'Invalid promotion plan' };
  }

  const user = await User.findById(userId);
  if (!user) {
    console.error('[Webhook] User not found for promotion:', userId);
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
  console.log('✅ PROMOTION SAVED TO DATABASE');
  console.log('Promotion Details:', {
    id: promotionPurchase._id,
    userId: promotionPurchase.userId,
    plan: promotionPurchase.planName,
    expires: promotionPurchase.expiresAt,
    status: promotionPurchase.status,
    paymentIntentId: id,
    totalAmount: promotionPurchase.totalAmount
  });

  // Send promotion confirmation email
  const { sendPromotionPlanEmail, sendAllGigsPromotionEmail } = require('../services/emailService');
  try {
    if (paymentType === 'gig_promotion' && gigId) {
      const gig = await Job.findById(gigId);
      if (gig) {
        await sendPromotionPlanEmail(user.email, {
          userName: user.fullName || user.username,
          planName: plan.name,
          gigTitle: gig.title,
          duration: plan.durationDays,
          expiresAt: expiresAt
        });
      }
    } else if (paymentType === 'monthly_promotion') {
      await sendAllGigsPromotionEmail(user.email, {
        userName: user.fullName || user.username,
        planName: plan.name,
        duration: plan.durationDays,
        expiresAt: expiresAt
      });
    }
  } catch (emailError) {
    console.error('[Webhook] Failed to send promotion email:', emailError);
  }

  // Notify user
  await notificationService.createNotification({
    userId: user._id,
    title: '🚀 Promotion Activated',
    message: `Your "${plan.name}" promotion is now active!`,
    type: 'payment',
    link: '/promote-gigs'
  });

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
  // Most logic handled in payment_intent.succeeded
  return { success: true };
};

/**
 * Handle captured charge (for manual capture)
 */
const handleChargeCaptured = async (charge) => {
  const { id, payment_intent, amount_captured, metadata } = charge;
  
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
  // Handled in payment_intent.payment_failed
  return { success: true };
};

/**
 * Handle completed checkout session
 */
const handleCheckoutSessionCompleted = async (session) => {
  const { id, payment_intent, metadata, customer_email } = session;
  
  // Most logic handled via payment_intent webhook
  return { success: true };
};

/**
 * Handle expired checkout session
 */
const handleCheckoutSessionExpired = async (session) => {
  const { id, metadata } = session;
  
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
  
  // Handle if needed - typically for disputes
  return { success: true };
};

/**
 * Handle connected account updates
 */
const handleAccountUpdated = async (account) => {
  const { id, charges_enabled, payouts_enabled, details_submitted } = account;
  
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
