const TimelineExtension = require('../models/TimelineExtension');
const Order = require('../models/Order');
const User = require('../models/User');
const { createCustomerAndPaymentIntentUtil } = require('./PaymentController');
const { getVatRate } = require('./vatController');
const { getAmountWithFeeAndTax, getSellerPayout } = require('../services/priceUtil');
const { notifyTimelineExtended } = require('../services/notificationService');

/**
 * Get timeline extension pricing
 */
const getTimelineExtensionPricing = (days) => {
  const pricePerDay = {
    3: 15,   // 3 days = $15
    7: 30,   // 7 days = $30
    14: 50,  // 14 days = $50
    30: 80   // 30 days = $80
  };
  
  return pricePerDay[days] || days * 5; // Default: $5 per day
};

/**
 * Create timeline extension payment intent
 */
const createTimelineExtensionPayment = async (req, res) => {
  try {
    const { orderId, extensionDays } = req.body;
    const userId = req.userId;

    // Validate input
    if (!orderId || !extensionDays) {
      return res.status(400).json({
        success: false,
        message: 'Order ID and extension days are required'
      });
    }

    if (extensionDays < 1 || extensionDays > 90) {
      return res.status(400).json({
        success: false,
        message: 'Extension days must be between 1 and 90'
      });
    }

    // Get order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user is the buyer
    if (order.buyerId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the buyer can extend the timeline'
      });
    }

    // Get user for VAT calculation
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate pricing
    const baseAmount = getTimelineExtensionPricing(extensionDays);
    const vatRate = await getVatRate(userId);
    const totalAmount = getAmountWithFeeAndTax(baseAmount, vatRate);

    // Calculate freelancer revenue (95% of base amount)
    const freelancerRevenue = getSellerPayout(baseAmount);

    // Calculate new deadline
    const currentDeadline = new Date(order.deliveryTime);
    const newDeadline = new Date(currentDeadline);
    newDeadline.setDate(newDeadline.getDate() + extensionDays);

    const additionalData = {
      orderId,
      extensionDays,
      previousDeadline: currentDeadline,
      newDeadline,
      freelancerRevenue,
      userId,
      vatRate
    };

    // Create payment intent
    const paymentIntentResponse = await createCustomerAndPaymentIntentUtil(
      totalAmount,
      user.email,
      'timeline_extension',
      additionalData
    );

    const { client_secret: secret, payment_intent } = paymentIntentResponse;

    if (!secret) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create payment intent'
      });
    }

    res.status(200).json({
      success: true,
      client_secret: secret,
      amount: totalAmount,
      extensionDays,
      newDeadline
    });
  } catch (error) {
    console.error('Error creating timeline extension payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create timeline extension payment',
      error: error.message
    });
  }
};

/**
 * Process timeline extension after successful payment
 * (This is called from the Stripe webhook)
 */
const processTimelineExtension = async (paymentIntent) => {
  try {
    const { orderId, extensionDays, previousDeadline, newDeadline, freelancerRevenue, userId } = paymentIntent.metadata;

    // Get order
    const order = await Order.findById(orderId);
    if (!order) {
      console.error('Order not found for timeline extension:', orderId);
      return false;
    }

    // Create timeline extension record
    const timelineExtension = await TimelineExtension.create({
      orderId,
      requestedBy: userId,
      extensionDays: parseInt(extensionDays),
      amount: paymentIntent.amount / 100, // Convert from cents
      paymentIntentId: paymentIntent.id,
      status: 'completed',
      previousDeadline: new Date(previousDeadline),
      newDeadline: new Date(newDeadline),
      freelancerRevenue: parseFloat(freelancerRevenue),
      completedAt: new Date()
    });

    // Update order delivery time
    order.deliveryTime = new Date(newDeadline);
    await order.save();

    // Add to freelancer's pending revenue
    const freelancer = await User.findById(order.sellerId);
    if (freelancer) {
      if (!freelancer.revenue) {
        freelancer.revenue = {
          total: 0,
          available: 0,
          pending: 0,
          withdrawn: 0
        };
      }
      freelancer.revenue.pending += parseFloat(freelancerRevenue);
      freelancer.revenue.total += parseFloat(freelancerRevenue);
      await freelancer.save();
    }

    // Send notifications to both parties
    await notifyTimelineExtended(
      order.buyerId,
      order.sellerId,
      orderId,
      parseInt(extensionDays),
      new Date(newDeadline)
    );

    console.log(`✓ Timeline extended for order ${orderId} by ${extensionDays} days`);
    return true;
  } catch (error) {
    console.error('Error processing timeline extension:', error);
    return false;
  }
};

/**
 * Get timeline extensions for an order
 */
const getOrderTimelineExtensions = async (req, res) => {
  try {
    const { orderId } = req.params;

    const extensions = await TimelineExtension.find({ orderId })
      .sort({ createdAt: -1 })
      .populate('requestedBy', 'fullName email');

    res.status(200).json({
      success: true,
      data: extensions
    });
  } catch (error) {
    console.error('Error fetching timeline extensions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch timeline extensions',
      error: error.message
    });
  }
};

module.exports = {
  createTimelineExtensionPayment,
  processTimelineExtension,
  getOrderTimelineExtensions,
  getTimelineExtensionPricing
};
