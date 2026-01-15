/**
 * Badge Cron Jobs
 * Scheduled tasks for seller badge evaluation and maintenance
 */

const cron = require('node-cron');
const badgeService = require('./badgeService');
const SellerBadge = require('../models/SellerBadge');
const User = require('../models/User');

/**
 * Initialize all badge-related cron jobs
 */
const initBadgeCronJobs = () => {
  cron.schedule('0 3 * * *', async () => {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const badgesToEvaluate = await SellerBadge.find({
        isFrozen: false,
        'adminOverride.isOverridden': false,
        $or: [
          { lastEvaluatedAt: { $lt: sevenDaysAgo } },
          { lastEvaluatedAt: null }
        ]
      }).limit(100); // Process 100 at a time

      let updated = 0;
      let promoted = 0;
      let demoted = 0;

      for (const badge of badgesToEvaluate) {
        try {
          const previousLevel = badge.currentLevel;
          await badgeService.recalculateSellerMetrics(badge.userId);
          
          const updatedBadge = await SellerBadge.findOne({ userId: badge.userId });
          
          if (updatedBadge.currentLevel !== previousLevel) {
            const levelOrder = ['new', 'level_1', 'level_2', 'top_rated'];
            if (levelOrder.indexOf(updatedBadge.currentLevel) > levelOrder.indexOf(previousLevel)) {
              promoted++;
            } else {
              demoted++;
            }
          }
          
          updated++;
        } catch (err) {
          console.error(`Error evaluating badge for user ${badge.userId}:`, err.message);
        }
      }

      } catch (error) {
      console.error('❌ Error in daily badge evaluation:', error);
    }
  });

  cron.schedule('0 4 * * 0', async () => {
    try {
      const updated = await badgeService.reEvaluateAllSellers();
      } catch (error) {
      console.error('❌ Error in weekly badge re-evaluation:', error);
    }
  });

  cron.schedule('0 5 * * *', async () => {
    try {
      const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
      
      const result = await SellerBadge.updateMany(
        {
          'metrics.isActive': true,
          $and: [
            { 
              $or: [
                { 'metrics.lastOrderDate': { $lt: sixtyDaysAgo } },
                { 'metrics.lastOrderDate': null }
              ]
            },
            {
              $or: [
                { 'metrics.lastResponseDate': { $lt: sixtyDaysAgo } },
                { 'metrics.lastResponseDate': null }
              ]
            }
          ]
        },
        {
          $set: { 'metrics.isActive': false }
        }
      );

      } catch (error) {
      console.error('❌ Error checking inactive sellers:', error);
    }
  });

  cron.schedule('0 * * * *', async () => {
    try {
      const freelancersWithoutBadges = await User.find({
        role: 'freelancer'
      }).select('_id');

      const freelancerIds = freelancersWithoutBadges.map(f => f._id);
      
      const existingBadges = await SellerBadge.find({
        userId: { $in: freelancerIds }
      }).select('userId');

      const existingBadgeUserIds = existingBadges.map(b => b.userId.toString());
      
      const newFreelancers = freelancerIds.filter(
        id => !existingBadgeUserIds.includes(id.toString())
      );

      if (newFreelancers.length > 0) {
        const badgesToCreate = newFreelancers.map(userId => ({
          userId,
          currentLevel: 'new',
          label: 'New Seller'
        }));

        await SellerBadge.insertMany(badgesToCreate, { ordered: false });
        }
    } catch (error) {
      if (error.code !== 11000) {
        console.error('❌ Error creating badges for new sellers:', error);
      }
    }
  });

  cron.schedule('0 6 * * *', async () => {
    try {
      await checkAndAwardAchievements();
      } catch (error) {
      console.error('❌ Error checking achievements:', error);
    }
  });

  };

/**
 * Check and award achievements to eligible sellers
 */
const checkAndAwardAchievements = async () => {
  try {
    const badges = await SellerBadge.find({});
    
    for (const badge of badges) {
      const achievements = badge.achievements.map(a => a.type);
      
      if (!achievements.includes('fast_responder') && 
          badge.metrics.averageResponseTime > 0 &&
          badge.metrics.averageResponseTime < 60 &&
          badge.metrics.totalReviews >= 10) {
        await badgeService.addAchievement(badge.userId, 'fast_responder');
      }
      
      if (!achievements.includes('perfect_rating') &&
          badge.metrics.averageRating >= 5.0 &&
          badge.metrics.totalReviews >= 10) {
        await badgeService.addAchievement(badge.userId, 'perfect_rating');
      }
      
      if (!achievements.includes('100_orders') &&
          badge.metrics.completedOrders >= 100) {
        await badgeService.addAchievement(badge.userId, '100_orders');
      }
      
      if (!achievements.includes('super_seller') &&
          badge.metrics.completedOrders >= 500) {
        await badgeService.addAchievement(badge.userId, 'super_seller');
      }
      
      if (!achievements.includes('top_earner') &&
          badge.metrics.totalEarnings >= 50000) {
        await badgeService.addAchievement(badge.userId, 'top_earner');
      }
      
      if (!achievements.includes('veteran')) {
        const user = await User.findById(badge.userId);
        if (user) {
          const twoYearsAgo = new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000);
          if (new Date(user.createdAt) < twoYearsAgo) {
            await badgeService.addAchievement(badge.userId, 'veteran');
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in achievement check:', error);
  }
};

/**
 * Manual trigger for badge evaluation (for testing)
 */
const runManualEvaluation = async () => {
  const updated = await badgeService.reEvaluateAllSellers();
  return updated;
};

module.exports = {
  initBadgeCronJobs,
  runManualEvaluation,
  checkAndAwardAchievements
};
