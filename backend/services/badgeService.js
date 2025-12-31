/**
 * Seller Badge Service
 * Manages seller badge levels, evaluations, and achievements
 */

const SellerBadge = require('../models/SellerBadge');
const Order = require('../models/Order');
const Reviews = require('../models/Review');
const Job = require('../models/Job');
const User = require('../models/User');

/**
 * Update seller metrics based on order completion
 */
const updateSellerMetricsOnOrderComplete = async (sellerId, order) => {
  try {
    const badge = await SellerBadge.getOrCreate(sellerId);
    
    // Update order count
    badge.metrics.completedOrders += 1;
    badge.metrics.totalOrders += 1;
    badge.metrics.totalEarnings += order.price || 0;
    badge.metrics.lastOrderDate = new Date();
    
    // Check if delivered on time
    if (order.deliveryDate && order.orderCompletionDate) {
      const wasOnTime = new Date(order.orderCompletionDate) <= new Date(order.deliveryDate);
      if (!wasOnTime) {
        // Recalculate on-time rate
        const totalCompleted = badge.metrics.completedOrders;
        const currentOnTimeRate = badge.metrics.onTimeDeliveryRate;
        const onTimeCount = Math.round((currentOnTimeRate / 100) * (totalCompleted - 1));
        badge.metrics.onTimeDeliveryRate = Math.round((onTimeCount / totalCompleted) * 100);
      }
    }
    
    // Recalculate completion rate
    const total = badge.metrics.totalOrders;
    const completed = badge.metrics.completedOrders;
    const cancelled = badge.metrics.cancelledOrders;
    badge.metrics.completionRate = total > 0 ? Math.round(((total - cancelled) / total) * 100) : 100;
    
    // Check for first order achievement
    if (badge.metrics.completedOrders === 1) {
      await addAchievement(sellerId, 'first_order');
    }
    
    // Check for 100 orders achievement
    if (badge.metrics.completedOrders === 100) {
      await addAchievement(sellerId, '100_orders');
    }
    
    // Check for 500 orders achievement
    if (badge.metrics.completedOrders === 500) {
      await addAchievement(sellerId, 'super_seller');
    }
    
    await badge.updateBadge();
    
    return badge;
  } catch (error) {
    console.error('Error updating seller metrics on order complete:', error);
    return null;
  }
};

/**
 * Update seller metrics on order cancellation
 */
const updateSellerMetricsOnCancellation = async (sellerId) => {
  try {
    const badge = await SellerBadge.getOrCreate(sellerId);
    
    badge.metrics.cancelledOrders += 1;
    badge.metrics.totalOrders += 1;
    
    // Recalculate rates
    const total = badge.metrics.totalOrders;
    const cancelled = badge.metrics.cancelledOrders;
    badge.metrics.cancellationRate = Math.round((cancelled / total) * 100);
    badge.metrics.completionRate = Math.round(((total - cancelled) / total) * 100);
    
    await badge.updateBadge();
    
    return badge;
  } catch (error) {
    console.error('Error updating seller metrics on cancellation:', error);
    return null;
  }
};

/**
 * Update seller metrics when dispute is opened
 */
const updateSellerMetricsOnDispute = async (sellerId) => {
  try {
    const badge = await SellerBadge.getOrCreate(sellerId);
    
    badge.metrics.disputedOrders += 1;
    
    // Recalculate dispute rate
    const total = badge.metrics.totalOrders;
    badge.metrics.disputeRate = total > 0 ? Math.round((badge.metrics.disputedOrders / total) * 100) : 0;
    
    await badge.updateBadge();
    
    return badge;
  } catch (error) {
    console.error('Error updating seller metrics on dispute:', error);
    return null;
  }
};

/**
 * Update seller rating when new review is added
 */
const updateSellerRating = async (sellerId) => {
  try {
    const badge = await SellerBadge.getOrCreate(sellerId);
    
    // Fetch all reviews for this seller's gigs
    const gigs = await Job.find({ sellerId }).select('_id');
    const gigIds = gigs.map(g => g._id);
    
    const reviews = await Reviews.aggregate([
      { $match: { gigId: { $in: gigIds } } },
      { 
        $group: { 
          _id: null, 
          averageRating: { $avg: '$star' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);
    
    if (reviews.length > 0) {
      badge.metrics.averageRating = parseFloat(reviews[0].averageRating.toFixed(2));
      badge.metrics.totalReviews = reviews[0].totalReviews;
      
      // Check for perfect rating achievement
      if (badge.metrics.averageRating === 5.0 && badge.metrics.totalReviews >= 10) {
        await addAchievement(sellerId, 'perfect_rating');
      }
    }
    
    await badge.updateBadge();
    
    return badge;
  } catch (error) {
    console.error('Error updating seller rating:', error);
    return null;
  }
};

/**
 * Update response metrics
 */
const updateResponseMetrics = async (sellerId, responseTimeMinutes) => {
  try {
    const badge = await SellerBadge.getOrCreate(sellerId);
    
    // Update average response time (rolling average)
    const currentAvg = badge.metrics.averageResponseTime || 0;
    const totalResponses = badge.metrics.totalReviews || 1;
    
    badge.metrics.averageResponseTime = Math.round(
      ((currentAvg * (totalResponses - 1)) + responseTimeMinutes) / totalResponses
    );
    badge.metrics.lastResponseDate = new Date();
    
    // Check for fast responder achievement (< 60 min average)
    if (badge.metrics.averageResponseTime < 60 && totalResponses >= 10) {
      await addAchievement(sellerId, 'fast_responder');
    }
    
    await badge.save();
    
    return badge;
  } catch (error) {
    console.error('Error updating response metrics:', error);
    return null;
  }
};

/**
 * Add achievement badge
 */
const addAchievement = async (sellerId, achievementType, metadata = {}) => {
  try {
    const badge = await SellerBadge.getOrCreate(sellerId);
    
    // Check if achievement already exists
    const hasAchievement = badge.achievements.some(a => a.type === achievementType);
    if (!hasAchievement) {
      badge.achievements.push({
        type: achievementType,
        earnedAt: new Date(),
        metadata
      });
      await badge.save();
    }
    
    return badge;
  } catch (error) {
    console.error('Error adding achievement:', error);
    return null;
  }
};

/**
 * Admin: Override seller badge level
 */
const adminOverrideBadge = async (sellerId, newLevel, reason, adminId) => {
  try {
    const badge = await SellerBadge.getOrCreate(sellerId);
    
    const levelLabels = {
      new: 'New Seller',
      level_1: 'Level 1 Seller',
      level_2: 'Level 2 Seller',
      top_rated: 'Top Rated Seller'
    };
    
    badge.badgeHistory.push({
      previousLevel: badge.currentLevel,
      newLevel: newLevel,
      reason: `Admin override: ${reason}`,
      changedAt: new Date(),
      changedBy: adminId
    });
    
    badge.adminOverride = {
      isOverridden: true,
      overriddenLevel: newLevel,
      reason,
      overriddenBy: adminId,
      overriddenAt: new Date()
    };
    
    badge.currentLevel = newLevel;
    badge.label = levelLabels[newLevel];
    
    await badge.save();
    
    return badge;
  } catch (error) {
    console.error('Error in admin override badge:', error);
    return null;
  }
};

/**
 * Admin: Remove badge override (return to automatic evaluation)
 */
const adminRemoveOverride = async (sellerId) => {
  try {
    const badge = await SellerBadge.findOne({ userId: sellerId });
    if (!badge) return null;
    
    badge.adminOverride = {
      isOverridden: false,
      overriddenLevel: null,
      reason: null,
      overriddenBy: null,
      overriddenAt: null
    };
    
    // Re-evaluate badge
    await badge.updateBadge();
    
    return badge;
  } catch (error) {
    console.error('Error removing admin override:', error);
    return null;
  }
};

/**
 * Admin: Freeze badge (prevent automatic changes)
 */
const adminFreezeBadge = async (sellerId, reason, adminId) => {
  try {
    const badge = await SellerBadge.getOrCreate(sellerId);
    
    badge.isFrozen = true;
    badge.frozenReason = reason;
    badge.frozenBy = adminId;
    badge.frozenAt = new Date();
    
    await badge.save();
    
    return badge;
  } catch (error) {
    console.error('Error freezing badge:', error);
    return null;
  }
};

/**
 * Admin: Unfreeze badge
 */
const adminUnfreezeBadge = async (sellerId) => {
  try {
    const badge = await SellerBadge.findOne({ userId: sellerId });
    if (!badge) return null;
    
    badge.isFrozen = false;
    badge.frozenReason = null;
    badge.frozenBy = null;
    badge.frozenAt = null;
    
    // Re-evaluate badge
    await badge.updateBadge();
    
    return badge;
  } catch (error) {
    console.error('Error unfreezing badge:', error);
    return null;
  }
};

/**
 * Get seller badge info for display
 */
const getSellerBadgeInfo = async (sellerId) => {
  try {
    const badge = await SellerBadge.getOrCreate(sellerId);
    
    return {
      level: badge.currentLevel,
      label: badge.label,
      trustScore: badge.trustScore,
      searchBoost: badge.searchBoost,
      displayBadge: badge.displayBadge,
      metrics: {
        completedOrders: badge.metrics.completedOrders,
        averageRating: badge.metrics.averageRating,
        totalReviews: badge.metrics.totalReviews,
        completionRate: badge.metrics.completionRate,
        onTimeDeliveryRate: badge.metrics.onTimeDeliveryRate,
        responseRate: badge.metrics.responseRate
      },
      achievements: badge.achievements,
      reliabilityIndicators: badge.reliabilityIndicators
    };
  } catch (error) {
    console.error('Error getting seller badge info:', error);
    return null;
  }
};

/**
 * Recalculate seller metrics from scratch using rolling window
 * Uses 90-day rolling window for recent performance + lifetime stats
 */
const recalculateSellerMetrics = async (sellerId) => {
  try {
    const badge = await SellerBadge.getOrCreate(sellerId);
    
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    
    // Get all orders for this seller
    const allOrders = await Order.find({ sellerId });
    
    // Lifetime metrics
    const totalOrders = allOrders.length;
    const completedOrders = allOrders.filter(o => 
      ['completed', 'waitingReview'].includes(o.status)
    ).length;
    const cancelledOrders = allOrders.filter(o => o.status === 'cancelled').length;
    const disputedOrders = allOrders.filter(o => o.status === 'disputed').length;
    
    // Calculate total earnings
    const totalEarnings = allOrders
      .filter(o => ['completed', 'waitingReview'].includes(o.status))
      .reduce((sum, o) => sum + (o.price || 0), 0);
    
    // Rolling 90-day metrics
    const recentOrders = allOrders.filter(o => new Date(o.createdAt) >= ninetyDaysAgo);
    const recentCompleted = recentOrders.filter(o => 
      ['completed', 'waitingReview'].includes(o.status)
    );
    
    // On-time delivery rate (rolling window)
    const onTimeDeliveries = recentCompleted.filter(o => {
      if (!o.deliveryDate || !o.orderCompletionDate) return true;
      return new Date(o.orderCompletionDate) <= new Date(o.deliveryDate);
    }).length;
    const onTimeRate = recentCompleted.length > 0 
      ? Math.round((onTimeDeliveries / recentCompleted.length) * 100)
      : 100;
    
    // Completion rate
    const completionRate = totalOrders > 0
      ? Math.round(((totalOrders - cancelledOrders) / totalOrders) * 100)
      : 100;
    
    // Cancellation rate
    const cancellationRate = totalOrders > 0
      ? Math.round((cancelledOrders / totalOrders) * 100)
      : 0;
    
    // Dispute rate
    const disputeRate = totalOrders > 0
      ? Math.round((disputedOrders / totalOrders) * 100)
      : 0;
    
    // Calculate 90-day earnings
    const last90DaysEarnings = recentCompleted.reduce((sum, o) => sum + (o.price || 0), 0);
    
    // Get reviews and calculate average rating
    const gigs = await Job.find({ sellerId }).select('_id');
    const gigIds = gigs.map(g => g._id.toString());
    
    const reviews = await Review.find({ gigId: { $in: gigIds } });
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? parseFloat((reviews.reduce((sum, r) => sum + r.star, 0) / totalReviews).toFixed(2))
      : 0;
    
    // Update badge metrics
    badge.metrics = {
      totalOrders,
      completedOrders,
      cancelledOrders,
      disputedOrders,
      averageRating,
      totalReviews,
      completionRate,
      onTimeDeliveryRate: onTimeRate,
      responseRate: badge.metrics.responseRate || 100, // Keep existing or default
      cancellationRate,
      disputeRate,
      totalEarnings,
      last90DaysEarnings,
      averageResponseTime: badge.metrics.averageResponseTime || 0,
      lastOrderDate: allOrders.length > 0 
        ? new Date(Math.max(...allOrders.map(o => new Date(o.createdAt))))
        : null,
      lastResponseDate: badge.metrics.lastResponseDate,
      isActive: recentOrders.length > 0 || 
        (badge.metrics.lastResponseDate && 
         new Date(badge.metrics.lastResponseDate) >= ninetyDaysAgo)
    };
    
    // Update badge level and trust score
    await badge.updateBadge();
    
    return badge;
  } catch (error) {
    console.error('Error recalculating seller metrics:', error);
    return null;
  }
};

/**
 * Calculate trust score with weighted factors
 * Returns a score from 0-100
 */
const calculateDetailedTrustScore = (metrics) => {
  const weights = {
    rating: 0.30,          // 30% - Average rating
    completion: 0.20,      // 20% - Completion rate
    onTime: 0.20,          // 20% - On-time delivery rate
    response: 0.10,        // 10% - Response rate
    experience: 0.10,      // 10% - Number of completed orders
    activity: 0.10         // 10% - Recent activity
  };
  
  // Normalize rating (1-5 scale to 0-100)
  const ratingScore = (metrics.averageRating / 5) * 100;
  
  // Experience score based on completed orders (caps at 100 orders)
  const experienceScore = Math.min(100, (metrics.completedOrders / 100) * 100);
  
  // Activity score (based on recent orders and responses)
  const activityScore = metrics.isActive ? 100 : 50;
  
  const score = (
    (ratingScore * weights.rating) +
    (metrics.completionRate * weights.completion) +
    (metrics.onTimeDeliveryRate * weights.onTime) +
    (metrics.responseRate * weights.response) +
    (experienceScore * weights.experience) +
    (activityScore * weights.activity)
  );
  
  return Math.round(Math.min(100, Math.max(0, score)));
};

/**
 * Get search boost multiplier based on badge level and trust score
 */
const getSearchBoostMultiplier = (level, trustScore) => {
  const baseBoost = {
    new: 1.0,
    level_1: 1.3,
    level_2: 1.7,
    top_rated: 2.5
  };
  
  // Add trust score bonus (up to 0.5 extra)
  const trustBonus = (trustScore / 100) * 0.5;
  
  return Math.min(3.0, (baseBoost[level] || 1.0) + trustBonus);
};

/**
 * Batch re-evaluate all sellers (cron job)
 */
const reEvaluateAllSellers = async () => {
  try {
    const badges = await SellerBadge.find({
      isFrozen: false,
      'adminOverride.isOverridden': false
    });
    
    let updated = 0;
    for (const badge of badges) {
      try {
        await badge.updateBadge();
        updated++;
      } catch (err) {
        console.error(`Error updating badge for user ${badge.userId}:`, err);
      }
    }
    
    console.log(`Re-evaluated ${updated} seller badges`);
    return updated;
  } catch (error) {
    console.error('Error in batch re-evaluation:', error);
    return 0;
  }
};

module.exports = {
  updateSellerMetricsOnOrderComplete,
  updateSellerMetricsOnCancellation,
  updateSellerMetricsOnDispute,
  updateSellerRating,
  updateResponseMetrics,
  addAchievement,
  adminOverrideBadge,
  adminRemoveOverride,
  adminFreezeBadge,
  adminUnfreezeBadge,
  getSellerBadgeInfo,
  reEvaluateAllSellers,
  recalculateSellerMetrics,
  calculateDetailedTrustScore,
  getSearchBoostMultiplier
};
