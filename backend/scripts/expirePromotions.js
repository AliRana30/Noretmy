/**
 * Promotion Expiration Cron Job
 * Runs periodically to mark expired promotions as 'expired'
 * 
 * Usage: Called from server.js via node-cron
 */

const PromotionPurchase = require('../models/PromotionPurchase');

/**
 * Expire promotions that have passed their expiresAt date
 * This ensures promotion effects stop immediately after expiration
 */
const expirePromotions = async () => {
  try {
    const now = new Date();
    
    const result = await PromotionPurchase.updateMany(
      {
        status: 'active',
        expiresAt: { $lte: now }
      },
      {
        $set: { status: 'expired' }
      }
    );
    
    if (result.modifiedCount > 0) {
      }
    
    return result.modifiedCount;
  } catch (error) {
    console.error('[Cron] Error expiring promotions:', error);
    return 0;
  }
};

/**
 * Initialize the cron job
 * Runs every hour to check for expired promotions
 */
const initPromotionExpirationCron = () => {
  const cron = require('node-cron');
  
  cron.schedule('0 * * * *', async () => {
    await expirePromotions();
  });
  
  expirePromotions();
};

module.exports = {
  expirePromotions,
  initPromotionExpirationCron
};
