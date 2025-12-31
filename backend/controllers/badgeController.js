/**
 * Badge Controller
 * Handles all seller badge and trust system operations
 */

const SellerBadge = require('../models/SellerBadge');
const User = require('../models/User');
const Order = require('../models/Order');
const Review = require('../models/Review');
const Job = require('../models/Job');
const badgeService = require('../services/badgeService');

// ==================== PUBLIC ENDPOINTS ====================

/**
 * Get seller badge info (public)
 * Returns badge level, trust score, and reliability indicators
 */
const getSellerBadge = async (req, res) => {
  try {
    const { sellerId } = req.params;
    
    if (!sellerId) {
      return res.status(400).json({
        success: false,
        message: 'Seller ID is required'
      });
    }

    const badge = await badgeService.getSellerBadgeInfo(sellerId);
    
    if (!badge) {
      // Return default badge info for new sellers
      return res.status(200).json({
        success: true,
        data: {
          level: 'new',
          label: 'New Seller',
          trustScore: 50,
          displayBadge: {
            label: 'New Seller',
            emoji: '🆕',
            color: '#4CAF50'
          },
          metrics: {
            completedOrders: 0,
            averageRating: 0,
            totalReviews: 0,
            completionRate: 100,
            onTimeDeliveryRate: 100,
            responseRate: 100
          },
          achievements: [],
          reliabilityIndicators: {
            showOnTimeRate: true,
            showResponseTime: true,
            showCompletionRate: true
          }
        }
      });
    }

    res.status(200).json({
      success: true,
      data: badge
    });
  } catch (error) {
    console.error('Error getting seller badge:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get seller badge info',
      error: error.message
    });
  }
};

/**
 * Get multiple seller badges (for search/listings)
 * Efficient batch retrieval of badge info
 */
const getMultipleSellerBadges = async (req, res) => {
  try {
    const { sellerIds } = req.body;
    
    if (!sellerIds || !Array.isArray(sellerIds) || sellerIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'sellerIds array is required'
      });
    }

    // Limit to 50 sellers per request
    const limitedIds = sellerIds.slice(0, 50);
    
    const badges = await SellerBadge.find({
      userId: { $in: limitedIds }
    }).select('userId currentLevel label trustScore searchBoost metrics.averageRating metrics.completedOrders metrics.onTimeDeliveryRate metrics.responseRate');

    // Create a map for easy lookup
    const badgeMap = {};
    badges.forEach(badge => {
      badgeMap[badge.userId.toString()] = {
        level: badge.currentLevel,
        label: badge.label,
        trustScore: badge.trustScore,
        searchBoost: badge.searchBoost,
        rating: badge.metrics.averageRating,
        completedOrders: badge.metrics.completedOrders,
        onTimeRate: badge.metrics.onTimeDeliveryRate,
        responseRate: badge.metrics.responseRate
      };
    });

    // Fill in defaults for sellers without badges
    limitedIds.forEach(id => {
      if (!badgeMap[id]) {
        badgeMap[id] = {
          level: 'new',
          label: 'New Seller',
          trustScore: 50,
          searchBoost: 1.0,
          rating: 0,
          completedOrders: 0,
          onTimeRate: 100,
          responseRate: 100
        };
      }
    });

    res.status(200).json({
      success: true,
      data: badgeMap
    });
  } catch (error) {
    console.error('Error getting multiple seller badges:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get seller badges',
      error: error.message
    });
  }
};

/**
 * Get seller achievements
 */
const getSellerAchievements = async (req, res) => {
  try {
    const { sellerId } = req.params;
    
    const badge = await SellerBadge.findOne({ userId: sellerId });
    
    if (!badge) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    res.status(200).json({
      success: true,
      data: badge.achievements || []
    });
  } catch (error) {
    console.error('Error getting seller achievements:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get seller achievements',
      error: error.message
    });
  }
};

/**
 * Get badge history for a seller
 */
const getSellerBadgeHistory = async (req, res) => {
  try {
    const { sellerId } = req.params;
    
    const badge = await SellerBadge.findOne({ userId: sellerId })
      .populate('badgeHistory.changedBy', 'fullName email');
    
    if (!badge) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    res.status(200).json({
      success: true,
      data: badge.badgeHistory || []
    });
  } catch (error) {
    console.error('Error getting badge history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get badge history',
      error: error.message
    });
  }
};

// ==================== SELLER ENDPOINTS (Authenticated) ====================

/**
 * Get own badge details (for sellers)
 */
const getMyBadge = async (req, res) => {
  try {
    const { userId } = req;
    
    const badge = await SellerBadge.findOne({ userId });
    
    if (!badge) {
      // Create a new badge for this seller
      const newBadge = await SellerBadge.create({ userId });
      return res.status(200).json({
        success: true,
        data: await badgeService.getSellerBadgeInfo(userId)
      });
    }

    res.status(200).json({
      success: true,
      data: {
        level: badge.currentLevel,
        label: badge.label,
        trustScore: badge.trustScore,
        searchBoost: badge.searchBoost,
        displayBadge: badge.displayBadge,
        metrics: badge.metrics,
        achievements: badge.achievements,
        reliabilityIndicators: badge.reliabilityIndicators,
        lastEvaluatedAt: badge.lastEvaluatedAt,
        nextEvaluationAt: badge.nextEvaluationAt,
        isFrozen: badge.isFrozen,
        isOverridden: badge.adminOverride?.isOverridden || false,
        badgeHistory: badge.badgeHistory.slice(-10) // Last 10 entries
      }
    });
  } catch (error) {
    console.error('Error getting my badge:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get badge info',
      error: error.message
    });
  }
};

/**
 * Get detailed performance breakdown for sellers
 */
const getMyPerformanceDetails = async (req, res) => {
  try {
    const { userId } = req;
    
    // Get badge info
    const badge = await SellerBadge.findOne({ userId });
    
    // Get additional performance data
    const [
      totalOrders,
      completedOrders,
      cancelledOrders,
      disputedOrders,
      reviews,
      gigs
    ] = await Promise.all([
      Order.countDocuments({ sellerId: userId }),
      Order.countDocuments({ sellerId: userId, status: { $in: ['completed', 'waitingReview'] } }),
      Order.countDocuments({ sellerId: userId, status: 'cancelled' }),
      Order.countDocuments({ sellerId: userId, status: 'disputed' }),
      Review.find({ sellerId: userId }).sort({ createdAt: -1 }).limit(5),
      Job.countDocuments({ sellerId: userId, jobStatus: 'active' })
    ]);

    // Calculate next level requirements
    const levelRequirements = {
      level_1: { orders: 10, rating: 4.7, completion: 90, earnings: 500 },
      level_2: { orders: 50, rating: 4.8, completion: 95, earnings: 5000 },
      top_rated: { orders: 100, rating: 4.9, completion: 98, earnings: 10000 }
    };

    const metrics = badge?.metrics || {
      completedOrders: 0,
      averageRating: 0,
      completionRate: 100,
      totalEarnings: 0
    };

    const currentLevel = badge?.currentLevel || 'new';
    let nextLevelInfo = null;

    if (currentLevel === 'new') {
      nextLevelInfo = {
        target: 'level_1',
        label: 'Level 1 Seller',
        requirements: levelRequirements.level_1,
        progress: {
          orders: Math.min(100, Math.round((metrics.completedOrders / 10) * 100)),
          rating: metrics.averageRating >= 4.7 ? 100 : Math.round((metrics.averageRating / 4.7) * 100),
          completion: metrics.completionRate >= 90 ? 100 : Math.round((metrics.completionRate / 90) * 100),
          earnings: Math.min(100, Math.round((metrics.totalEarnings / 500) * 100))
        }
      };
    } else if (currentLevel === 'level_1') {
      nextLevelInfo = {
        target: 'level_2',
        label: 'Level 2 Seller',
        requirements: levelRequirements.level_2,
        progress: {
          orders: Math.min(100, Math.round((metrics.completedOrders / 50) * 100)),
          rating: metrics.averageRating >= 4.8 ? 100 : Math.round((metrics.averageRating / 4.8) * 100),
          completion: metrics.completionRate >= 95 ? 100 : Math.round((metrics.completionRate / 95) * 100),
          earnings: Math.min(100, Math.round((metrics.totalEarnings / 5000) * 100))
        }
      };
    } else if (currentLevel === 'level_2') {
      nextLevelInfo = {
        target: 'top_rated',
        label: 'Top Rated Seller',
        requirements: levelRequirements.top_rated,
        progress: {
          orders: Math.min(100, Math.round((metrics.completedOrders / 100) * 100)),
          rating: metrics.averageRating >= 4.9 ? 100 : Math.round((metrics.averageRating / 4.9) * 100),
          completion: metrics.completionRate >= 98 ? 100 : Math.round((metrics.completionRate / 98) * 100),
          earnings: Math.min(100, Math.round((metrics.totalEarnings / 10000) * 100))
        }
      };
    }

    res.status(200).json({
      success: true,
      data: {
        currentLevel,
        label: badge?.label || 'New Seller',
        trustScore: badge?.trustScore || 50,
        metrics: {
          totalOrders,
          completedOrders,
          cancelledOrders,
          disputedOrders,
          activeGigs: gigs,
          ...metrics
        },
        nextLevel: nextLevelInfo,
        recentReviews: reviews,
        lastEvaluated: badge?.lastEvaluatedAt,
        nextEvaluation: badge?.nextEvaluationAt
      }
    });
  } catch (error) {
    console.error('Error getting performance details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get performance details',
      error: error.message
    });
  }
};

// ==================== ADMIN ENDPOINTS ====================

/**
 * Admin: Get all seller badges with filtering
 */
const adminGetAllBadges = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      level,
      sortBy = 'trustScore',
      sortOrder = 'desc',
      search,
      isFrozen,
      isOverridden
    } = req.query;

    const filter = {};
    
    if (level && level !== 'all') {
      filter.currentLevel = level;
    }
    
    if (isFrozen !== undefined) {
      filter.isFrozen = isFrozen === 'true';
    }
    
    if (isOverridden !== undefined) {
      filter['adminOverride.isOverridden'] = isOverridden === 'true';
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    let badges = await SellerBadge.find(filter)
      .populate('userId', 'fullName email username')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // If search is provided, filter by user info
    if (search) {
      badges = badges.filter(badge => {
        const user = badge.userId;
        if (!user) return false;
        const searchLower = search.toLowerCase();
        return (
          user.fullName?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower) ||
          user.username?.toLowerCase().includes(searchLower)
        );
      });
    }

    const total = await SellerBadge.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: badges,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting all badges:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get badges',
      error: error.message
    });
  }
};

/**
 * Admin: Get detailed badge info for a seller
 */
const adminGetSellerBadgeDetails = async (req, res) => {
  try {
    const { sellerId } = req.params;

    const badge = await SellerBadge.findOne({ userId: sellerId })
      .populate('userId', 'fullName email username createdAt role')
      .populate('adminOverride.overriddenBy', 'fullName email')
      .populate('frozenBy', 'fullName email')
      .populate('badgeHistory.changedBy', 'fullName email');

    if (!badge) {
      return res.status(404).json({
        success: false,
        message: 'Badge not found for this seller'
      });
    }

    // Get additional stats
    const [totalOrders, activeGigs, recentReviews] = await Promise.all([
      Order.countDocuments({ sellerId }),
      Job.countDocuments({ sellerId, jobStatus: 'active' }),
      Review.find({ sellerId }).sort({ createdAt: -1 }).limit(10)
    ]);

    res.status(200).json({
      success: true,
      data: {
        badge,
        additionalStats: {
          totalOrders,
          activeGigs,
          recentReviews
        }
      }
    });
  } catch (error) {
    console.error('Error getting seller badge details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get badge details',
      error: error.message
    });
  }
};

/**
 * Admin: Override seller badge level
 */
const adminOverrideBadge = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { level, reason } = req.body;
    const adminId = req.userId;

    if (!level || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Level and reason are required'
      });
    }

    const validLevels = ['new', 'level_1', 'level_2', 'top_rated'];
    if (!validLevels.includes(level)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid badge level'
      });
    }

    const badge = await badgeService.adminOverrideBadge(sellerId, level, reason, adminId);

    if (!badge) {
      return res.status(500).json({
        success: false,
        message: 'Failed to override badge'
      });
    }

    // Log the action
    console.log(`Admin ${adminId} overrode badge for seller ${sellerId} to ${level}: ${reason}`);

    res.status(200).json({
      success: true,
      message: 'Badge level overridden successfully',
      data: badge
    });
  } catch (error) {
    console.error('Error overriding badge:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to override badge',
      error: error.message
    });
  }
};

/**
 * Admin: Remove badge override
 */
const adminRemoveOverride = async (req, res) => {
  try {
    const { sellerId } = req.params;

    const badge = await badgeService.adminRemoveOverride(sellerId);

    if (!badge) {
      return res.status(404).json({
        success: false,
        message: 'Badge not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Override removed, badge will be re-evaluated automatically',
      data: badge
    });
  } catch (error) {
    console.error('Error removing override:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove override',
      error: error.message
    });
  }
};

/**
 * Admin: Freeze badge (prevent automatic changes)
 */
const adminFreezeBadge = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { reason } = req.body;
    const adminId = req.userId;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Reason is required'
      });
    }

    const badge = await badgeService.adminFreezeBadge(sellerId, reason, adminId);

    if (!badge) {
      return res.status(500).json({
        success: false,
        message: 'Failed to freeze badge'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Badge frozen successfully',
      data: badge
    });
  } catch (error) {
    console.error('Error freezing badge:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to freeze badge',
      error: error.message
    });
  }
};

/**
 * Admin: Unfreeze badge
 */
const adminUnfreezeBadge = async (req, res) => {
  try {
    const { sellerId } = req.params;

    const badge = await badgeService.adminUnfreezeBadge(sellerId);

    if (!badge) {
      return res.status(404).json({
        success: false,
        message: 'Badge not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Badge unfrozen, automatic evaluation resumed',
      data: badge
    });
  } catch (error) {
    console.error('Error unfreezing badge:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unfreeze badge',
      error: error.message
    });
  }
};

/**
 * Admin: Manually trigger badge re-evaluation for a seller
 */
const adminReEvaluateBadge = async (req, res) => {
  try {
    const { sellerId } = req.params;

    const badge = await SellerBadge.findOne({ userId: sellerId });
    
    if (!badge) {
      return res.status(404).json({
        success: false,
        message: 'Badge not found'
      });
    }

    if (badge.isFrozen) {
      return res.status(400).json({
        success: false,
        message: 'Cannot re-evaluate frozen badge. Unfreeze first.'
      });
    }

    if (badge.adminOverride?.isOverridden) {
      return res.status(400).json({
        success: false,
        message: 'Cannot re-evaluate overridden badge. Remove override first.'
      });
    }

    // Recalculate metrics from scratch
    await badgeService.recalculateSellerMetrics(sellerId);
    
    const updatedBadge = await SellerBadge.findOne({ userId: sellerId });

    res.status(200).json({
      success: true,
      message: 'Badge re-evaluated successfully',
      data: updatedBadge
    });
  } catch (error) {
    console.error('Error re-evaluating badge:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to re-evaluate badge',
      error: error.message
    });
  }
};

/**
 * Admin: Trigger batch re-evaluation for all sellers
 */
const adminBatchReEvaluate = async (req, res) => {
  try {
    const updated = await badgeService.reEvaluateAllSellers();

    res.status(200).json({
      success: true,
      message: `Re-evaluated ${updated} seller badges`
    });
  } catch (error) {
    console.error('Error in batch re-evaluation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to run batch re-evaluation',
      error: error.message
    });
  }
};

/**
 * Admin: Get badge statistics and analytics
 */
const adminGetBadgeStats = async (req, res) => {
  try {
    const [
      totalBadges,
      levelDistribution,
      frozenBadges,
      overriddenBadges,
      avgTrustScore,
      recentPromotions,
      recentDemotions
    ] = await Promise.all([
      SellerBadge.countDocuments(),
      SellerBadge.aggregate([
        { $group: { _id: '$currentLevel', count: { $sum: 1 } } }
      ]),
      SellerBadge.countDocuments({ isFrozen: true }),
      SellerBadge.countDocuments({ 'adminOverride.isOverridden': true }),
      SellerBadge.aggregate([
        { $group: { _id: null, avgScore: { $avg: '$trustScore' } } }
      ]).then(r => r[0]?.avgScore || 0),
      SellerBadge.aggregate([
        { $unwind: '$badgeHistory' },
        { 
          $match: { 
            'badgeHistory.changedAt': { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            $expr: {
              $gt: [
                { $indexOfArray: [['new', 'level_1', 'level_2', 'top_rated'], '$badgeHistory.newLevel'] },
                { $indexOfArray: [['new', 'level_1', 'level_2', 'top_rated'], '$badgeHistory.previousLevel'] }
              ]
            }
          }
        },
        { $count: 'count' }
      ]).then(r => r[0]?.count || 0),
      SellerBadge.aggregate([
        { $unwind: '$badgeHistory' },
        { 
          $match: { 
            'badgeHistory.changedAt': { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            $expr: {
              $lt: [
                { $indexOfArray: [['new', 'level_1', 'level_2', 'top_rated'], '$badgeHistory.newLevel'] },
                { $indexOfArray: [['new', 'level_1', 'level_2', 'top_rated'], '$badgeHistory.previousLevel'] }
              ]
            }
          }
        },
        { $count: 'count' }
      ]).then(r => r[0]?.count || 0)
    ]);

    // Format level distribution
    const levels = { new: 0, level_1: 0, level_2: 0, top_rated: 0 };
    levelDistribution.forEach(l => {
      levels[l._id] = l.count;
    });

    res.status(200).json({
      success: true,
      data: {
        totalBadges,
        levelDistribution: levels,
        frozenBadges,
        overriddenBadges,
        avgTrustScore: Math.round(avgTrustScore),
        last30Days: {
          promotions: recentPromotions,
          demotions: recentDemotions
        }
      }
    });
  } catch (error) {
    console.error('Error getting badge stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get badge statistics',
      error: error.message
    });
  }
};

/**
 * Admin: Get audit log for badge changes
 */
const adminGetBadgeAuditLog = async (req, res) => {
  try {
    const { page = 1, limit = 50, sellerId } = req.query;
    
    const filter = {};
    if (sellerId) {
      filter.userId = sellerId;
    }

    const badges = await SellerBadge.find(filter)
      .populate('userId', 'fullName email username')
      .populate('badgeHistory.changedBy', 'fullName email')
      .select('userId badgeHistory')
      .lean();

    // Flatten badge history into audit entries
    let auditLog = [];
    badges.forEach(badge => {
      if (badge.badgeHistory && badge.badgeHistory.length > 0) {
        badge.badgeHistory.forEach(entry => {
          auditLog.push({
            sellerId: badge.userId?._id,
            sellerName: badge.userId?.fullName,
            sellerEmail: badge.userId?.email,
            previousLevel: entry.previousLevel,
            newLevel: entry.newLevel,
            reason: entry.reason,
            changedAt: entry.changedAt,
            changedBy: entry.changedBy
          });
        });
      }
    });

    // Sort by date descending
    auditLog.sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt));

    // Paginate
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedLog = auditLog.slice(skip, skip + parseInt(limit));

    res.status(200).json({
      success: true,
      data: paginatedLog,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: auditLog.length,
        pages: Math.ceil(auditLog.length / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting audit log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get audit log',
      error: error.message
    });
  }
};

module.exports = {
  // Public
  getSellerBadge,
  getMultipleSellerBadges,
  getSellerAchievements,
  getSellerBadgeHistory,
  
  // Seller (authenticated)
  getMyBadge,
  getMyPerformanceDetails,
  
  // Admin
  adminGetAllBadges,
  adminGetSellerBadgeDetails,
  adminOverrideBadge,
  adminRemoveOverride,
  adminFreezeBadge,
  adminUnfreezeBadge,
  adminReEvaluateBadge,
  adminBatchReEvaluate,
  adminGetBadgeStats,
  adminGetBadgeAuditLog
};
