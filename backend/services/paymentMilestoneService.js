const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/Order');
const PaymentMilestone = require('../models/PaymentMilestone');
const Freelancer = require('../models/Freelancer');
const User = require('../models/User');
const notificationService = require('./notificationService');
const { sendPaymentMilestoneEmail } = require('./emailService');
const { updateSellerMetricsOnCancellation } = require('./badgeService');

/**
 * Payment Milestone Percentages
 * Defines how the total order amount is divided across stages
 */
const MILESTONE_PERCENTAGES = {
  order_placed: 0,      // 0% - No payment yet
  accepted: 10,         // 10% - Authorized on freelancer accept
  in_escrow: 50,        // 50% - Captured when work starts
  delivered: 20,        // 20% - Pending release on delivery
  reviewed: 20,         // 20% - Final amount on review
  completed: 0          // 0% - All previous amounts released
};

/**
 * Calculate milestone amount based on percentage
 */
const calculateMilestoneAmount = (totalAmount, stage) => {
  const percentage = MILESTONE_PERCENTAGES[stage] || 0;
  return Math.round((totalAmount * percentage / 100) * 100) / 100; // Round to 2 decimals
};

/**
 * Get cumulative percentage for a stage
 */
const getCumulativePercentage = (stage) => {
  const stages = Object.keys(MILESTONE_PERCENTAGES);
  const stageIndex = stages.indexOf(stage);
  if (stageIndex === -1) return 0;
  
  return stages.slice(0, stageIndex + 1).reduce((sum, s) => sum + MILESTONE_PERCENTAGES[s], 0);
};

/**
 * Create a payment intent with authorization (capture later)
 */
const createPaymentIntentWithAuth = async (order, email, captureMethod = 'manual') => {
  try {
    let customer = await stripe.customers.list({ email, limit: 1 });
    
    if (customer.data.length > 0) {
      customer = customer.data[0];
    } else {
      customer = await stripe.customers.create({ email });
    }
    
    const totalAmountCents = Math.round(order.totalAmount * 100);
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmountCents,
      currency: order.currency?.toLowerCase() || 'usd',
      customer: customer.id,
      capture_method: captureMethod,
      payment_method_types: ['card'],
      metadata: {
        paymentType: 'order_payment',
        orderId: order._id.toString(),
        buyerId: order.buyerId.toString(),
        sellerId: order.sellerId.toString(),
        milestoneEnabled: 'true'
      },
      description: `Order payment for Order #${order._id}`
    });
    
    order.payment_intent = paymentIntent.id;
    order.paymentStatus = 'processing';
    await order.save();
    
    return {
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    };
    
  } catch (error) {
    console.error('[PaymentMilestone] Error creating payment intent:', error);
    throw error;
  }
};

/**
 * Process milestone on freelancer accepting order
 * Authorizes 10% of the payment
 */
const processAcceptedMilestone = async (orderId, sellerId) => {
  const session = await Order.startSession();
  
  try {
    session.startTransaction();
    
    const order = await Order.findById(orderId).session(session);
    if (!order) throw new Error('Order not found');
    
    const amount = calculateMilestoneAmount(order.totalAmount, 'accepted');
    
    const milestone = new PaymentMilestone({
      orderId: order._id,
      stage: 'accepted',
      percentageOfTotal: MILESTONE_PERCENTAGES.accepted,
      amount,
      vatAmount: calculateMilestoneAmount(order.vatAmount || 0, 'accepted'),
      currency: order.currency || 'USD',
      stripePaymentIntentId: order.payment_intent,
      paymentStatus: 'authorized',
      authorizedAt: new Date(),
      triggeredBy: {
        userId: sellerId,
        role: 'seller',
        action: 'accept_order'
      }
    });
    
    await milestone.save({ session });
    
    order.paymentMilestoneStage = 'accepted';
    order.paymentBreakdown.authorizedAmount = amount;
    order.addTimelineEvent('Payment Authorized', `10% ($${amount.toFixed(2)}) authorized`, 'system');
    await order.save({ session });
    
    await session.commitTransaction();
    
    await notifyMilestoneChange(order, 'accepted', amount);
    
    return { success: true, milestone };
    
  } catch (error) {
    await session.abortTransaction();
    console.error('[PaymentMilestone] Error processing accepted milestone:', error);
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Process escrow milestone - capture 50% of payment
 */
const processEscrowMilestone = async (orderId) => {
  const session = await Order.startSession();
  
  try {
    session.startTransaction();
    
    const order = await Order.findById(orderId).session(session);
    if (!order) throw new Error('Order not found');
    if (!order.payment_intent) throw new Error('No payment intent found');
    
    const amount = calculateMilestoneAmount(order.totalAmount, 'in_escrow');
    const amountCents = Math.round(amount * 100);
    
    const paymentIntent = await stripe.paymentIntents.capture(order.payment_intent, {
      amount_to_capture: amountCents
    });
    
    const milestone = new PaymentMilestone({
      orderId: order._id,
      stage: 'in_escrow',
      percentageOfTotal: MILESTONE_PERCENTAGES.in_escrow,
      amount,
      vatAmount: calculateMilestoneAmount(order.vatAmount || 0, 'in_escrow'),
      currency: order.currency || 'USD',
      stripePaymentIntentId: order.payment_intent,
      stripeChargeId: paymentIntent.latest_charge,
      paymentStatus: 'held_in_escrow',
      capturedAt: new Date(),
      triggeredBy: {
        role: 'system',
        action: 'escrow_capture'
      }
    });
    
    await milestone.save({ session });
    
    order.paymentMilestoneStage = 'in_escrow';
    order.escrowStatus = 'partial';
    order.paymentBreakdown.escrowAmount = amount;
    order.stripeChargeId = paymentIntent.latest_charge;
    order.escrowLockedAt = new Date();
    order.addTimelineEvent('Funds in Escrow', `50% ($${amount.toFixed(2)}) captured and secured`, 'system');
    await order.save({ session });
    
    await session.commitTransaction();
    
    await notifyMilestoneChange(order, 'in_escrow', amount);
    
    const freelancer = await Freelancer.findOne({ userId: order.sellerId });
    if (freelancer) {
      await freelancer.addEarnings(amount, order._id);
    }
    
    return { success: true, milestone };
    
  } catch (error) {
    await session.abortTransaction();
    console.error('[PaymentMilestone] Error processing escrow milestone:', error);
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Process delivery milestone - 20% pending release
 */
const processDeliveryMilestone = async (orderId, sellerId) => {
  try {
    const order = await Order.findById(orderId);
    if (!order) throw new Error('Order not found');
    
    const amount = calculateMilestoneAmount(order.totalAmount, 'delivered');
    
    const milestone = new PaymentMilestone({
      orderId: order._id,
      stage: 'delivered',
      percentageOfTotal: MILESTONE_PERCENTAGES.delivered,
      amount,
      vatAmount: calculateMilestoneAmount(order.vatAmount || 0, 'delivered'),
      currency: order.currency || 'USD',
      stripePaymentIntentId: order.payment_intent,
      paymentStatus: 'pending_release',
      triggeredBy: {
        userId: sellerId,
        role: 'seller',
        action: 'deliver_order'
      }
    });
    
    await milestone.save();
    
    order.paymentMilestoneStage = 'delivered';
    order.paymentBreakdown.deliveryAmount = amount;
    order.paymentBreakdown.pendingReleaseAmount += amount;
    order.addTimelineEvent('Delivery Milestone', `20% ($${amount.toFixed(2)}) pending release`, 'seller');
    await order.save();
    
    await notifyMilestoneChange(order, 'delivered', amount);
    
    return { success: true, milestone };
    
  } catch (error) {
    console.error('[PaymentMilestone] Error processing delivery milestone:', error);
    throw error;
  }
};

/**
 * Process review milestone - final 20%
 */
const processReviewMilestone = async (orderId, buyerId) => {
  try {
    const order = await Order.findById(orderId);
    if (!order) throw new Error('Order not found');
    
    const amount = calculateMilestoneAmount(order.totalAmount, 'reviewed');
    
    const milestone = new PaymentMilestone({
      orderId: order._id,
      stage: 'reviewed',
      percentageOfTotal: MILESTONE_PERCENTAGES.reviewed,
      amount,
      vatAmount: calculateMilestoneAmount(order.vatAmount || 0, 'reviewed'),
      currency: order.currency || 'USD',
      stripePaymentIntentId: order.payment_intent,
      paymentStatus: 'pending_release',
      triggeredBy: {
        userId: buyerId,
        role: 'buyer',
        action: 'submit_review'
      }
    });
    
    await milestone.save();
    
    order.paymentMilestoneStage = 'reviewed';
    order.paymentBreakdown.reviewAmount = amount;
    order.paymentBreakdown.pendingReleaseAmount += amount;
    order.addTimelineEvent('Review Milestone', `Final 20% ($${amount.toFixed(2)}) pending release`, 'buyer');
    await order.save();
    
    await notifyMilestoneChange(order, 'reviewed', amount);
    
    return { success: true, milestone };
    
  } catch (error) {
    console.error('[PaymentMilestone] Error processing review milestone:', error);
    throw error;
  }
};

/**
 * Release all pending funds to freelancer
 */
const releaseFundsToFreelancer = async (orderId) => {
  const session = await Order.startSession();
  
  try {
    session.startTransaction();
    
    const order = await Order.findById(orderId).session(session);
    if (!order) throw new Error('Order not found');
    
    const freelancer = await Freelancer.findOne({ userId: order.sellerId }).session(session);
    if (!freelancer) throw new Error('Freelancer account not found');
    
    const pendingMilestones = await PaymentMilestone.find({
      orderId: order._id,
      paymentStatus: { $in: ['held_in_escrow', 'pending_release'] }
    }).session(session);
    
    let totalToRelease = 0;
    
    if (freelancer.stripeAccountId) {
      const totalCents = Math.round(order.paymentBreakdown.pendingReleaseAmount * 100 + order.paymentBreakdown.escrowAmount * 100);
      
      const transfer = await stripe.transfers.create({
        amount: totalCents,
        currency: order.currency?.toLowerCase() || 'usd',
        destination: freelancer.stripeAccountId,
        transfer_group: `ORDER_${order._id}`,
        metadata: {
          orderId: order._id.toString(),
          sellerId: order.sellerId.toString()
        }
      });
      
      order.stripeTransferId = transfer.id;
      
      for (const milestone of pendingMilestones) {
        milestone.paymentStatus = 'released';
        milestone.stripeTransferId = transfer.id;
        milestone.releasedAt = new Date();
        await milestone.save({ session });
        totalToRelease += milestone.amount;
      }
    }
    
    const completionMilestone = new PaymentMilestone({
      orderId: order._id,
      stage: 'completed',
      percentageOfTotal: 100,
      amount: totalToRelease,
      currency: order.currency || 'USD',
      stripePaymentIntentId: order.payment_intent,
      stripeTransferId: order.stripeTransferId,
      paymentStatus: 'released',
      releasedAt: new Date(),
      triggeredBy: {
        role: 'system',
        action: 'release_funds'
      }
    });
    
    await completionMilestone.save({ session });
    
    order.paymentMilestoneStage = 'completed';
    order.escrowStatus = 'released';
    order.paymentBreakdown.totalReleasedAmount = totalToRelease;
    order.paymentBreakdown.pendingReleaseAmount = 0;
    order.paymentBreakdown.escrowAmount = 0;
    order.fundsReleasedAt = new Date();
    order.paymentStatus = 'completed';
    order.addTimelineEvent('Funds Released', `$${totalToRelease.toFixed(2)} released to freelancer`, 'system');
    await order.save({ session });
    
    await freelancer.releaseEarnings(totalToRelease);
    
    const seller = await User.findById(order.sellerId).session(session);
    if (seller) {
      seller.revenue = seller.revenue || { total: 0, pending: 0, available: 0, withdrawn: 0 };
      seller.revenue.pending -= totalToRelease;
      seller.revenue.available += totalToRelease;
      await seller.save({ session });
    }
    
    await session.commitTransaction();
    
    await notifyMilestoneChange(order, 'completed', totalToRelease);
    
    return { success: true, amountReleased: totalToRelease };
    
  } catch (error) {
    await session.abortTransaction();
    console.error('[PaymentMilestone] Error releasing funds:', error);
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Handle order cancellation - refund captured amounts
 */
const processCancellation = async (orderId, reason, cancelledBy) => {
  try {
    const order = await Order.findById(orderId);
    if (!order) throw new Error('Order not found');
    
    const capturedMilestones = await PaymentMilestone.find({
      orderId: order._id,
      paymentStatus: { $in: ['captured', 'held_in_escrow'] }
    });
    
    let totalRefunded = 0;
    
    if (capturedMilestones.length > 0 && order.stripeChargeId) {
      const refundAmount = capturedMilestones.reduce((sum, m) => sum + m.amount, 0);
      const refundAmountCents = Math.round(refundAmount * 100);
      
      const refund = await stripe.refunds.create({
        charge: order.stripeChargeId,
        amount: refundAmountCents,
        reason: 'requested_by_customer',
        metadata: {
          orderId: order._id.toString(),
          reason: reason
        }
      });
      
      totalRefunded = refundAmount;
      
      for (const milestone of capturedMilestones) {
        milestone.paymentStatus = 'refunded';
        milestone.refundedAt = new Date();
        await milestone.save();
      }
    }
    
    const cancelMilestone = new PaymentMilestone({
      orderId: order._id,
      stage: 'cancelled',
      percentageOfTotal: 0,
      amount: totalRefunded,
      currency: order.currency || 'USD',
      stripePaymentIntentId: order.payment_intent,
      paymentStatus: 'refunded',
      refundedAt: new Date(),
      notes: reason,
      triggeredBy: {
        userId: cancelledBy,
        role: 'buyer',
        action: 'cancel_order'
      }
    });
    
    await cancelMilestone.save();
    
    order.paymentMilestoneStage = 'cancelled';
    order.escrowStatus = 'refunded';
    order.paymentStatus = 'refunded';
    order.addTimelineEvent('Order Cancelled', `${reason}. $${totalRefunded.toFixed(2)} refunded.`, 'system');
    await order.save();
    
    if (totalRefunded > 0) {
      const freelancer = await Freelancer.findOne({ userId: order.sellerId });
      if (freelancer && freelancer.revenue) {
        freelancer.revenue.pending = Math.max(0, freelancer.revenue.pending - totalRefunded);
        freelancer.revenue.total = Math.max(0, freelancer.revenue.total - totalRefunded);
        await freelancer.save();
      }
    }
    
    try {
      await updateSellerMetricsOnCancellation(order.sellerId);
      } catch (metricsError) {
      console.error('[PaymentMilestone] Error updating seller metrics on cancellation:', metricsError);
    }
    
    return { success: true, refundedAmount: totalRefunded };
    
  } catch (error) {
    console.error('[PaymentMilestone] Error processing cancellation:', error);
    throw error;
  }
};

/**
 * Get payment milestones for an order with status
 */
const getOrderPaymentStatus = async (orderId) => {
  try {
    const order = await Order.findById(orderId);
    if (!order) throw new Error('Order not found');
    
    const milestones = await PaymentMilestone.find({ orderId }).sort({ createdAt: 1 });
    
    const totals = {
      orderTotal: order.totalAmount,
      authorized: order.paymentBreakdown?.authorizedAmount || 0,
      inEscrow: order.paymentBreakdown?.escrowAmount || 0,
      pendingRelease: order.paymentBreakdown?.pendingReleaseAmount || 0,
      released: order.paymentBreakdown?.totalReleasedAmount || 0,
      currentStage: order.paymentMilestoneStage || 'order_placed'
    };
    
    const stages = [
      { 
        id: 'order_placed', 
        label: 'Order Placed', 
        percentage: 0, 
        status: 'completed',
        description: 'Order created successfully'
      },
      { 
        id: 'accepted', 
        label: 'Freelancer Accepted', 
        percentage: 10, 
        status: getStageStatus('accepted', order.paymentMilestoneStage),
        description: '10% payment authorized'
      },
      { 
        id: 'in_escrow', 
        label: 'Funds in Escrow', 
        percentage: 50, 
        status: getStageStatus('in_escrow', order.paymentMilestoneStage),
        description: '50% captured and secured'
      },
      { 
        id: 'delivered', 
        label: 'Work Delivered', 
        percentage: 20, 
        status: getStageStatus('delivered', order.paymentMilestoneStage),
        description: '20% pending release'
      },
      { 
        id: 'reviewed', 
        label: 'Review Completed', 
        percentage: 20, 
        status: getStageStatus('reviewed', order.paymentMilestoneStage),
        description: 'Final 20% pending'
      },
      { 
        id: 'completed', 
        label: 'Payment Complete', 
        percentage: 100, 
        status: getStageStatus('completed', order.paymentMilestoneStage),
        description: '100% released to freelancer'
      }
    ];
    
    return {
      success: true,
      order: {
        id: order._id,
        status: order.status,
        paymentMilestoneStage: order.paymentMilestoneStage,
        stripePaymentIntentId: order.payment_intent,
        stripeChargeId: order.stripeChargeId,
        stripeTransferId: order.stripeTransferId
      },
      totals,
      stages,
      milestones: milestones.map(m => ({
        id: m._id,
        stage: m.stage,
        amount: m.amount,
        displayAmount: `$${m.amount.toFixed(2)}`,
        percentage: m.percentageOfTotal,
        status: m.paymentStatus,
        createdAt: m.createdAt,
        stripePaymentIntentId: m.stripePaymentIntentId
      }))
    };
    
  } catch (error) {
    console.error('[PaymentMilestone] Error getting payment status:', error);
    throw error;
  }
};

/**
 * Helper to determine stage status
 */
const getStageStatus = (stageId, currentStage) => {
  const stageOrder = ['order_placed', 'accepted', 'in_escrow', 'delivered', 'reviewed', 'completed'];
  const currentIndex = stageOrder.indexOf(currentStage);
  const stageIndex = stageOrder.indexOf(stageId);
  
  if (currentStage === 'cancelled' || currentStage === 'refunded') {
    return stageIndex <= currentIndex ? 'cancelled' : 'pending';
  }
  
  if (stageIndex < currentIndex) return 'completed';
  if (stageIndex === currentIndex) return 'current';
  return 'pending';
};

/**
 * Send notifications for milestone changes
 */
const notifyMilestoneChange = async (order, stage, amount) => {
  try {
    const [buyer, seller] = await Promise.all([
      User.findById(order.buyerId),
      User.findById(order.sellerId)
    ]);
    
    const stageMessages = {
      accepted: {
        buyerTitle: '✅ Order Accepted',
        buyerMsg: `Your freelancer accepted the order. 10% ($${amount.toFixed(2)}) has been authorized.`,
        sellerTitle: '✅ Order Accepted',
        sellerMsg: `You accepted the order. Work can now begin.`
      },
      in_escrow: {
        buyerTitle: '🔒 Funds Secured',
        buyerMsg: `50% ($${amount.toFixed(2)}) has been captured and held in escrow.`,
        sellerTitle: '🔒 Funds Secured',
        sellerMsg: `50% ($${amount.toFixed(2)}) is now held in escrow for this order.`
      },
      delivered: {
        buyerTitle: '📦 Work Delivered',
        buyerMsg: `The freelancer has delivered the work. Please review and approve.`,
        sellerTitle: '📦 Delivery Submitted',
        sellerMsg: `Your delivery has been submitted. Awaiting client review.`
      },
      reviewed: {
        buyerTitle: '⭐ Review Submitted',
        buyerMsg: `Thank you for your review!`,
        sellerTitle: '⭐ Review Received',
        sellerMsg: `The client has reviewed your work. Final payment pending release.`
      },
      completed: {
        buyerTitle: '✨ Order Complete',
        buyerMsg: `Your order is complete. Thank you for using our platform!`,
        sellerTitle: '💰 Payment Released',
        sellerMsg: `Congratulations! $${amount.toFixed(2)} has been released to your account.`
      },
      cancelled: {
        buyerTitle: '❌ Order Cancelled',
        buyerMsg: `Your order has been cancelled. $${amount.toFixed(2)} has been refunded.`,
        sellerTitle: '❌ Order Cancelled',
        sellerMsg: `The order has been cancelled.`
      }
    };
    
    const messages = stageMessages[stage];
    if (!messages) return;
    
    const notifications = [];
    
    if (buyer) {
      notifications.push(
        notificationService.createNotification({
          userId: buyer._id,
          title: messages.buyerTitle,
          message: messages.buyerMsg,
          type: 'payment',
          link: `/orders/${order._id}`,
          data: { orderId: order._id, stage, amount }
        })
      );
      
      notifications.push(
        sendPaymentMilestoneEmail(buyer.email, {
          orderId: order._id.toString(),
          stage,
          amount,
          percentage: getCumulativePercentage(stage),
          customerName: buyer.username || buyer.email,
          sellerName: seller?.username || 'Freelancer',
          gigTitle: order.gigTitle || 'Service',
          totalAmount: order.totalAmount,
          isForSeller: false
        }).catch(err => console.error('[PaymentMilestone] Email error:', err))
      );
    }
    
    if (seller) {
      notifications.push(
        notificationService.createNotification({
          userId: seller._id,
          title: messages.sellerTitle,
          message: messages.sellerMsg,
          type: 'payment',
          link: `/orders/${order._id}`,
          data: { orderId: order._id, stage, amount }
        })
      );
      
      notifications.push(
        sendPaymentMilestoneEmail(seller.email, {
          orderId: order._id.toString(),
          stage,
          amount,
          percentage: getCumulativePercentage(stage),
          customerName: buyer?.username || 'Client',
          sellerName: seller.username || seller.email,
          gigTitle: order.gigTitle || 'Service',
          totalAmount: order.totalAmount,
          isForSeller: true
        }).catch(err => console.error('[PaymentMilestone] Email error:', err))
      );
    }
    
    await Promise.all(notifications);
    
  } catch (error) {
    console.error('[PaymentMilestone] Error sending notifications:', error);
  }
};

module.exports = {
  MILESTONE_PERCENTAGES,
  calculateMilestoneAmount,
  getCumulativePercentage,
  createPaymentIntentWithAuth,
  processAcceptedMilestone,
  processEscrowMilestone,
  processDeliveryMilestone,
  processReviewMilestone,
  releaseFundsToFreelancer,
  processCancellation,
  getOrderPaymentStatus
};
