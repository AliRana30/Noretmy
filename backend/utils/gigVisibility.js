/**
 * Gig Visibility Helper
 * Backend-driven ranking logic for promotion-aware gig ordering
 * 
 * Rules:
 * - Promoted gigs always appear above non-promoted gigs
 * - Higher promotion priority always outranks lower priority
 * - Ultimate (100) > Premium (70) > Standard (40) > Basic (20) > Non-promoted (0)
 * - After promotion priority, sort by rating and recency
 */

const PromotionPurchase = require('../models/PromotionPurchase');

/**
 * Get the active promotion priority for a gig
 * Checks both gig-specific and user-wide (all_gigs) promotions
 * Returns the highest priority if multiple promotions exist
 */
const getGigPromotionPriority = async (gigId, sellerId) => {
  const now = new Date();
  
  const activePromotion = await PromotionPurchase.findOne({
    status: 'active',
    expiresAt: { $gt: now },
    $or: [
      { gigId: gigId, promotionType: 'single_gig' },
      { userId: sellerId, promotionType: 'all_gigs' }
    ]
  }).sort({ planPriority: -1 }).lean();
  
  return activePromotion ? activePromotion.planPriority : 0;
};

/**
 * Build a map of gig IDs to their promotion priorities
 * Used for efficient batch sorting of gig listings
 */
const buildPromotionPriorityMap = async () => {
  const now = new Date();
  
  const activePromotions = await PromotionPurchase.find({
    status: 'active',
    expiresAt: { $gt: now }
  }).lean();
  
  const gigPriorityMap = {}; // gigId -> priority
  const userPriorityMap = {}; // userId -> priority (for all_gigs promotions)
  
  activePromotions.forEach(p => {
    if (p.promotionType === 'single_gig' && p.gigId) {
      const gigIdStr = p.gigId.toString();
      gigPriorityMap[gigIdStr] = Math.max(gigPriorityMap[gigIdStr] || 0, p.planPriority);
    } else if (p.promotionType === 'all_gigs') {
      const userIdStr = p.userId.toString();
      userPriorityMap[userIdStr] = Math.max(userPriorityMap[userIdStr] || 0, p.planPriority);
    }
  });
  
  return { gigPriorityMap, userPriorityMap };
};

/**
 * Apply promotion priority to an array of gigs
 * Mutates the gigs array by adding `promotionPriority` field
 */
const applyPromotionPriorities = async (gigs) => {
  const { gigPriorityMap, userPriorityMap } = await buildPromotionPriorityMap();
  
  gigs.forEach(gig => {
    const gigIdStr = gig._id.toString();
    const sellerIdStr = (gig.sellerId || gig.userId)?.toString();
    
    const gigPriority = gigPriorityMap[gigIdStr] || 0;
    const userPriority = userPriorityMap[sellerIdStr] || 0;
    
    gig.promotionPriority = Math.max(gigPriority, userPriority);
  });
  
  return gigs;
};

/**
 * Sort gigs by promotion priority, then by rating and recency
 * This is the main function to use for gig listings
 */
const sortGigsByPromotion = async (gigs) => {
  await applyPromotionPriorities(gigs);
  
  return gigs.sort((a, b) => {
    if (b.promotionPriority !== a.promotionPriority) {
      return b.promotionPriority - a.promotionPriority;
    }
    
    const aRating = a.averageRating || a.starNumber || 0;
    const bRating = b.averageRating || b.starNumber || 0;
    if (bRating !== aRating) {
      return bRating - aRating;
    }
    
    const aDate = new Date(a.createdAt || 0);
    const bDate = new Date(b.createdAt || 0);
    return bDate - aDate;
  });
};

/**
 * Check if a gig currently has an active promotion
 */
const hasActivePromotion = async (gigId, sellerId) => {
  const priority = await getGigPromotionPriority(gigId, sellerId);
  return priority > 0;
};

/**
 * Get gigs for homepage featuring
 * Returns gigs with Premium (70+) and Ultimate (100) promotions
 */
const getHomepageFeaturedGigs = async (gigModel, limit = 12) => {
  const { gigPriorityMap, userPriorityMap } = await buildPromotionPriorityMap();
  
  const featuredGigIds = Object.entries(gigPriorityMap)
    .filter(([_, priority]) => priority >= 70)
    .map(([gigId]) => gigId);
  
  const featuredUserIds = Object.entries(userPriorityMap)
    .filter(([_, priority]) => priority >= 70)
    .map(([userId]) => userId);
  
  const gigs = await gigModel.find({
    isActive: true,
    $or: [
      { _id: { $in: featuredGigIds } },
      { sellerId: { $in: featuredUserIds } }
    ]
  }).limit(limit).lean();
  
  await applyPromotionPriorities(gigs);
  
  return gigs.sort((a, b) => b.promotionPriority - a.promotionPriority);
};

module.exports = {
  getGigPromotionPriority,
  buildPromotionPriorityMap,
  applyPromotionPriorities,
  sortGigsByPromotion,
  hasActivePromotion,
  getHomepageFeaturedGigs
};
