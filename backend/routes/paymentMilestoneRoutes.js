// routes/paymentMilestoneRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/jwt');
const paymentMilestoneService = require('../services/paymentMilestoneService');
const PaymentMilestone = require('../models/PaymentMilestone');
const Order = require('../models/Order');

/**
 * @route   GET /api/payment-milestones/order/:orderId
 * @desc    Get payment milestone status for an order
 * @access  Private (buyer or seller of the order)
 */
router.get('/order/:orderId', verifyToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.userId;

    // Verify user has access to this order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (order.buyerId !== userId && order.sellerId !== userId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const status = await paymentMilestoneService.getOrderPaymentStatus(orderId);
    res.status(200).json(status);

  } catch (error) {
    console.error('[PaymentMilestone] Error fetching status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/payment-milestones/order/:orderId/history
 * @desc    Get full payment milestone history for an order
 * @access  Private
 */
router.get('/order/:orderId/history', verifyToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.userId;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (order.buyerId !== userId && order.sellerId !== userId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const milestones = await PaymentMilestone.find({ orderId })
      .sort({ createdAt: 1 })
      .select('-__v');

    res.status(200).json({
      success: true,
      orderId,
      currentStage: order.paymentMilestoneStage,
      milestones: milestones.map(m => ({
        id: m._id,
        stage: m.stage,
        amount: m.amount,
        displayAmount: `$${m.amount.toFixed(2)}`,
        percentage: m.percentageOfTotal,
        status: m.paymentStatus,
        stripePaymentIntentId: m.stripePaymentIntentId,
        stripeChargeId: m.stripeChargeId,
        stripeTransferId: m.stripeTransferId,
        authorizedAt: m.authorizedAt,
        capturedAt: m.capturedAt,
        releasedAt: m.releasedAt,
        refundedAt: m.refundedAt,
        failedAt: m.failedAt,
        failureReason: m.failureReason,
        createdAt: m.createdAt
      }))
    });

  } catch (error) {
    console.error('[PaymentMilestone] Error fetching history:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/payment-milestones/order/:orderId/release
 * @desc    Release all pending funds to freelancer (admin or system)
 * @access  Private (admin only or system trigger)
 */
router.post('/order/:orderId/release', verifyToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.userId;

    // Verify order exists and is in correct state
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Only buyer can trigger fund release (or admin)
    if (order.buyerId !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only buyer or admin can release funds' });
    }

    // Verify order is in a state where funds can be released
    if (!['reviewed', 'waitingReview', 'completed'].includes(order.status)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Order must be reviewed before funds can be released' 
      });
    }

    const result = await paymentMilestoneService.releaseFundsToFreelancer(orderId);
    res.status(200).json(result);

  } catch (error) {
    console.error('[PaymentMilestone] Error releasing funds:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/payment-milestones/order/:orderId/refund
 * @desc    Process refund for an order
 * @access  Private (admin only)
 */
router.post('/order/:orderId/refund', verifyToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    const userId = req.userId;

    // Only admin can process refunds
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const result = await paymentMilestoneService.processCancellation(orderId, reason || 'Refund requested', userId);
    res.status(200).json(result);

  } catch (error) {
    console.error('[PaymentMilestone] Error processing refund:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/payment-milestones/user/summary
 * @desc    Get payment summary for current user (earnings, pending, etc.)
 * @access  Private
 */
router.get('/user/summary', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const User = require('../models/User');
    const Freelancer = require('../models/Freelancer');

    const [user, freelancer] = await Promise.all([
      User.findById(userId).select('revenue'),
      Freelancer.findOne({ userId }).select('revenue monthlyEarnings payouts availableBalance')
    ]);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Get recent payment milestones for orders where user is seller
    const recentMilestones = await PaymentMilestone.find({})
      .populate({
        path: 'orderId',
        match: { sellerId: userId },
        select: 'sellerId'
      })
      .sort({ createdAt: -1 })
      .limit(10);

    const filteredMilestones = recentMilestones.filter(m => m.orderId);

    // Calculate total by status
    const allMilestones = await PaymentMilestone.aggregate([
      {
        $lookup: {
          from: 'orders',
          localField: 'orderId',
          foreignField: '_id',
          as: 'order'
        }
      },
      { $unwind: '$order' },
      { $match: { 'order.sellerId': userId } },
      {
        $group: {
          _id: '$paymentStatus',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const statusTotals = {};
    allMilestones.forEach(m => {
      statusTotals[m._id] = { total: m.total, count: m.count };
    });

    res.status(200).json({
      success: true,
      revenue: freelancer?.revenue || user.revenue || {
        total: 0,
        pending: 0,
        available: 0,
        withdrawn: 0
      },
      availableBalance: freelancer?.availableBalance || 0,
      monthlyEarnings: freelancer?.monthlyEarnings?.slice(-12) || [],
      recentPayouts: freelancer?.payouts?.slice(-5) || [],
      milestonesByStatus: statusTotals,
      recentMilestones: filteredMilestones.map(m => ({
        id: m._id,
        stage: m.stage,
        amount: m.amount,
        status: m.paymentStatus,
        createdAt: m.createdAt
      }))
    });

  } catch (error) {
    console.error('[PaymentMilestone] Error fetching user summary:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/payment-milestones/config
 * @desc    Get milestone configuration (percentages, stages)
 * @access  Public
 */
router.get('/config', (req, res) => {
  res.status(200).json({
    success: true,
    milestonePercentages: paymentMilestoneService.MILESTONE_PERCENTAGES,
    stages: [
      { id: 'order_placed', label: 'Order Placed', percentage: 0 },
      { id: 'accepted', label: 'Freelancer Accepted', percentage: 10 },
      { id: 'in_escrow', label: 'Funds in Escrow', percentage: 50 },
      { id: 'delivered', label: 'Work Delivered', percentage: 20 },
      { id: 'reviewed', label: 'Review Completed', percentage: 20 },
      { id: 'completed', label: 'Payment Complete', percentage: 100 }
    ]
  });
});

module.exports = router;
