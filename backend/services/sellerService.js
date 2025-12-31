const Freelancer = require('../models/Freelancer');
const Order = require('../models/Order');
const Reviews = require('../models/Review')
const mongoose = require('mongoose');

// Helper function to calculate the first day of the current month
const getFirstDayOfCurrentMonth = () => {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

// Calculate seller level based on performance metrics
const calculateSellerLevel = (completedOrders, rating, completionRate, totalEarnings) => {
  // Level criteria based on Fiverr-like system
  // Top Rated Seller: 100+ orders, 4.9+ rating, 98%+ completion, $10000+ earnings
  // Level 2 Seller: 50+ orders, 4.8+ rating, 95%+ completion, $5000+ earnings
  // Level 1 Seller: 10+ orders, 4.7+ rating, 90%+ completion, $500+ earnings
  // New Seller: Default
  
  const ratingNum = parseFloat(rating) || 0;
  
  if (completedOrders >= 100 && ratingNum >= 4.9 && completionRate >= 98 && totalEarnings >= 10000) {
    return {
      level: 'top_rated',
      label: 'Top Rated Seller',
      badge: '⭐',
      color: '#FFD700',
      nextLevel: null,
      progress: 100
    };
  } else if (completedOrders >= 50 && ratingNum >= 4.8 && completionRate >= 95 && totalEarnings >= 5000) {
    return {
      level: 'level_2',
      label: 'Level 2 Seller',
      badge: '🥈',
      color: '#C0C0C0',
      nextLevel: 'Top Rated Seller',
      progress: Math.min(100, Math.round((completedOrders / 100) * 100))
    };
  } else if (completedOrders >= 10 && ratingNum >= 4.7 && completionRate >= 90 && totalEarnings >= 500) {
    return {
      level: 'level_1',
      label: 'Level 1 Seller',
      badge: '🥉',
      color: '#CD7F32',
      nextLevel: 'Level 2 Seller',
      progress: Math.min(100, Math.round((completedOrders / 50) * 100))
    };
  } else {
    return {
      level: 'new',
      label: 'New Seller',
      badge: '🆕',
      color: '#4CAF50',
      nextLevel: 'Level 1 Seller',
      progress: Math.min(100, Math.round((completedOrders / 10) * 100))
    };
  }
};

// Calculate success score (weighted average of different metrics)
const calculateSuccessScore = (rating, completionRate, onTimeDeliveryRate, responseRate) => {
  // Weighted calculation
  const ratingWeight = 0.4;
  const completionWeight = 0.25;
  const onTimeWeight = 0.2;
  const responseWeight = 0.15;
  
  const normalizedRating = (parseFloat(rating) || 0) / 5 * 100;
  
  const score = (normalizedRating * ratingWeight) +
                (completionRate * completionWeight) +
                (onTimeDeliveryRate * onTimeWeight) +
                (responseRate * responseWeight);
  
  return Math.round(score);
};

const getSellerStatistics = async (sellerId) => {
  try {
    const firstDayOfMonth = getFirstDayOfCurrentMonth();
    const currentDate = new Date();

    // Ensure sellerId is valid before querying
    if (!sellerId) {
      throw new Error("Invalid sellerId");
    }

    // Fetch order-related data safely
    // Count total orders that are not invitations and not pending
    const totalOrders = await Order.countDocuments({ 
      sellerId, 
      $or: [
        { isInvitation: false },
        { isInvitation: { $exists: false } }
      ],
      status: { $nin: ['pending'] }
    }) ?? 0;
    
    const activeOrders = await Order.countDocuments({ 
      sellerId, 
      status: { $in: ['accepted', 'requirementsSubmitted', 'started', 'halfwayDone', 'delivered', 'requestedRevision'] },
    }) ?? 0;
    
    const cancelledOrders = await Order.countDocuments({ sellerId, status: 'cancelled' }) ?? 0;
    
    const completedOrders = await Order.countDocuments({ 
      sellerId, 
      status: 'completed'
    }) ?? 0;

    // Calculate on-time delivery rate
    const onTimeDeliveries = await Order.countDocuments({
      sellerId,
      status: 'completed',
      $expr: { $lte: ['$updatedAt', '$deliveryDate'] }
    }) ?? 0;
    const onTimeDeliveryRate = completedOrders > 0 ? Math.round((onTimeDeliveries / completedOrders) * 100) : 100;

    // Aggregate earnings - from completed orders
    const earnings = await Order.aggregate([
      { $match: { sellerId, status: 'completed' } },
      { $group: { _id: null, totalEarnings: { $sum: { $ifNull: ['$baseAmount', '$price'] } } } }
    ]);
    // Seller gets 95% of the order price (5% platform fee)
    const totalEarnings = (earnings?.[0]?.totalEarnings ?? 0) * 0.95;

    // Handle available balance gracefully
    const freelancer = await Freelancer.findOne({ userId: sellerId }) || {};
    const availableForWithdrawalAmount = freelancer?.availableBalance ?? 0;
    const pendingClearance = freelancer?.pendingBalance ?? 0;

    // Earnings in the current month (only completed orders)
    const currentMonthEarnings = await Order.aggregate([
      {
        $match: {
          sellerId,
          status: 'completed',
          createdAt: { $gte: firstDayOfMonth }
        }
      },
      { $group: { _id: null, totalCurrentMonthEarnings: { $sum: { $ifNull: ['$baseAmount', '$price'] } } } }
    ]);
    // Seller gets 95% after platform fee
    const currentMonthTotalEarnings = (currentMonthEarnings?.[0]?.totalCurrentMonthEarnings ?? 0) * 0.95;

    // Calculate average selling price from completed orders
    const averageSellingPrice = await Order.aggregate([
      { $match: { sellerId, status: 'completed' } },
      { $group: { _id: null, avgPrice: { $avg: { $ifNull: ['$baseAmount', '$price'] } } } }
    ]);
    const avgSellingPrice = averageSellingPrice?.[0]?.avgPrice ?? 0;

    // Calculate seller rating safely
    const reviews = await Reviews.aggregate([
      { 
        $addFields: { gigIdObj: { $toObjectId: "$gigId" } } 
      },
      { 
        $lookup: { from: "gigs", localField: "gigIdObj", foreignField: "_id", as: "gigDetails" } 
      },
      { $unwind: "$gigDetails" },
      { $match: { "gigDetails.sellerId": sellerId } },
      { $group: { _id: null, averageRating: { $avg: "$star" }, totalReviews: { $sum: 1 } } },
    ]);
    const rating = reviews?.[0]?.averageRating?.toFixed(1) ?? "0";
    const totalReviews = reviews?.[0]?.totalReviews ?? 0;

    // Fetch monthly earnings (only completed orders)
    const currentYear = new Date().getFullYear();
    const monthlyEarnings = await Order.aggregate([
      {
        $match: {
          sellerId,
          status: 'completed',
          createdAt: { $gte: new Date(currentYear, 0, 1), $lte: new Date(currentYear, 11, 31, 23, 59, 59) }
        }
      },
      { $group: { _id: { $month: "$createdAt" }, totalEarnings: { $sum: { $ifNull: ['$baseAmount', '$price'] } } } },
      { $sort: { "_id": 1 } }
    ]);

    const monthlyEarningsArray = Array(12).fill(0);
    monthlyEarnings?.forEach(entry => {
      // Seller gets 95% after platform fee
      monthlyEarningsArray[entry._id - 1] = (entry.totalEarnings ?? 0) * 0.95;
    });

    // Calculate completion rate
    const completionRate = totalOrders > 0 
      ? Math.round(((totalOrders - cancelledOrders) / totalOrders) * 100)
      : 100;

    // Response rate (placeholder - would need message tracking)
    const responseRate = 98;

    // Calculate success score
    const successScore = calculateSuccessScore(rating, completionRate, onTimeDeliveryRate, responseRate);

    // Calculate seller level
    const sellerLevel = calculateSellerLevel(completedOrders, rating, completionRate, totalEarnings);

    // Get pending order invitations count
    const pendingInvitations = await Order.countDocuments({
      sellerId,
      isInvitation: true,
      invitationStatus: 'pending'
    }) ?? 0;

    return {
      // Basic stats
      totalOrders,
      activeOrders,
      completedOrders,
      cancelledOrders,
      pendingInvitations,
      
      // Earnings
      earnings: totalEarnings,
      availableForWithdrawal: availableForWithdrawalAmount,
      pendingClearance,
      currentMonthEarnings: currentMonthTotalEarnings,
      avgSellingPrice,
      
      // Performance metrics
      rating,
      totalReviews,
      completionRate,
      onTimeDeliveryRate,
      responseRate,
      successScore,
      
      // Seller level
      sellerLevel,
      
      // Chart data
      monthlyEarnings: monthlyEarningsArray,
    };

  } catch (error) {
    console.error("Error fetching seller statistics:", error.message);
    return {
      error: "Failed to fetch seller statistics",
      details: error.message
    };
  }
};

module.exports = { getSellerStatistics };
