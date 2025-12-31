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
      console.log(`[Cron] Expired ${result.modifiedCount} promotion(s) at ${now.toISOString()}`);
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
  
  // Run every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    console.log('[Cron] Running promotion expiration check...');
    await expirePromotions();
  });
  
  console.log('✅ Promotion expiration cron job initialized (runs hourly)');
  
  // Also run immediately on startup to catch any missed expirations
  expirePromotions();
};

module.exports = {
  expirePromotions,
  initPromotionExpirationCron
};
