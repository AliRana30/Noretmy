/**
 * Gig Ranking & Visibility Utility
 * Implements Fiverr-like ranking system based on:
 * 1. Promotion Tier (Primary)
 * 2. Seller Rating (Secondary)
 * 3. Completed Orders (Tertiary)
 * 
 * IMPORTANT: This integrates with PromotionPurchase model for active promotions
 */

const PromotionPurchase = require('../models/PromotionPurchase');

/**
 * Checks if a promotion is active using PromotionPurchase model
 * @param {string} gigId - The gig ID
 * @param {string} sellerId - The seller ID
 * @returns {Promise<number>} - Promotion priority (0 if none, or planPriority value)
 */
const getActivePromotionPriority = async (gigId, sellerId) => {
  try {
    const now = new Date();
    
    // Check for single gig promotion or all_gigs promotion
    const promotion = await PromotionPurchase.findOne({
      status: 'active',
      expiresAt: { $gt: now },
      $or: [
        { gigId: gigId, promotionType: 'single_gig' },
        { userId: sellerId, promotionType: 'all_gigs' }
      ]
    }).lean();
    
    return promotion ? (promotion.planPriority || 0) : 0;
  } catch (err) {
    console.error('Error checking promotion:', err);
    return 0;
  }
};

/**
 * Maps promotion priority to a normalized 0-3 score
 * @param {number} planPriority - From PromotionPurchase (typically 0-100)
 * @returns {number} - Normalized score
 */
const normalizePromotionScore = (planPriority) => {
  // Convert planPriority to 0-3 scale
  // Assuming: Ultimate=100, Premium=70, Standard=40, Basic=20, None=0
  if (planPriority >= 100) return 3;      // Ultimate/Premium
  if (planPriority >= 70) return 3;       // Premium
  if (planPriority >= 40) return 2;       // Standard
  if (planPriority >= 20) return 1;       // Basic
  return 0;                               // None
};

/**
 * Determines if a promotion is still active (legacy field)
 * @param {Date} promotionEndDate - The promotion end date
 * @returns {boolean} - True if promotion is still active
 */
const isPromotionActive = (promotionEndDate) => {
  if (!promotionEndDate) return false;
  return new Date(promotionEndDate) > new Date();
};

/**
 * Maps upgradeOption to promotion score (legacy field)
 * @param {string} upgradeOption - The promotion tier (premium, standard, basic, etc.)
 * @param {Date} promotionEndDate - When the promotion expires
 * @returns {number} - Promotion score (0-3)
 */
const getPromotionScore = (upgradeOption, promotionEndDate) => {
  // Check if promotion has expired
  if (!isPromotionActive(promotionEndDate)) {
    return 0; // No active promotion
  }

  const scoreMap = {
    'premium': 3,
    'standard': 2,
    'basic': 1,
    'sponsored': 3,
    'featured': 2,
    'homepage': 3,
  };

  return scoreMap[upgradeOption?.toLowerCase()] || 0;
};

/**
 * Calculates normalized rating score (0-100 scale)
 * @param {number} totalStars - Total sum of all ratings
 * @param {number} starNumber - Number of reviews
 * @returns {number} - Rating score on 0-100 scale
 */
const getRatingScore = (totalStars, starNumber) => {
  if (!starNumber || starNumber === 0) return 0;
  const avgRating = totalStars / starNumber;
  return avgRating * 20; // Convert 5-star to 0-100 scale
};

/**
 * Calculates comprehensive ranking score for a gig
 * Formula: (promotion_score * 1000) + (rating * 100) + sales
 * This ensures promotion tier is always the primary factor
 * @param {Object} gig - The gig/job document with optional promotionPriority field
 * @returns {number} - Final ranking score
 */
const calculateRankingScore = (gig, promotionPriority = 0) => {
  // Use PromotionPurchase priority if available, otherwise use legacy upgradeOption
  let promotionScore = 0;
  if (promotionPriority > 0) {
    promotionScore = normalizePromotionScore(promotionPriority);
  } else {
    promotionScore = getPromotionScore(gig.upgradeOption, gig.promotionEndDate);
  }
  
  const ratingScore = getRatingScore(gig.totalStars, gig.starNumber);
  const salesScore = gig.sales || 0;

  // Final formula: promotion is most important, then rating, then sales
  const finalScore = (promotionScore * 1000) + (ratingScore * 100) + salesScore;

  return finalScore;
};

/**
 * Sorts gigs by ranking score with integrated promotion data
 * @param {Array} gigs - Array of gigs with optional promotionPriority field
 * @returns {Array} - Sorted gigs
 */
const sortGigsByRanking = (gigs) => {
  return gigs.sort((a, b) => {
    const scoreA = calculateRankingScore(a, a.promotionPriority);
    const scoreB = calculateRankingScore(b, b.promotionPriority);
    return scoreB - scoreA; // Descending order (highest score first)
  });
};

/**
 * Adds ranking metadata to gigs for frontend display
 * @param {Array} gigs - Array of gigs
 * @returns {Array} - Gigs with ranking metadata
 */
const enrichGigsWithRanking = (gigs) => {
  return gigs.map(gig => {
    const isPromoted = gig.promotionPriority > 0 || isPromotionActive(gig.promotionEndDate);
    const promotionScore = normalizePromotionScore(gig.promotionPriority || 0);
    const ratingScore = getRatingScore(gig.totalStars, gig.starNumber);
    const rankingScore = calculateRankingScore(gig, gig.promotionPriority);

    return {
      ...gig,
      _ranking: {
        score: rankingScore,
        promotionScore,
        ratingScore,
        salesScore: gig.sales || 0,
        isPromoted,
        promotionTier: promotionScore > 0 ? 
          (promotionScore === 3 ? 'premium' : promotionScore === 2 ? 'standard' : 'basic') 
          : 'none',
      }
    };
  });
};

/**
 * MongoDB aggregation pipeline steps for ranking (advanced use)
 * @returns {Array} - MongoDB aggregation pipeline stages
 */
const getRankingAggregationPipeline = () => {
  return [
    // Stage 1: Lookup active promotions
    {
      $lookup: {
        from: 'promotionpurchases',
        let: { gigId: '$_id', sellerId: '$sellerId' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$status', 'active'] },
                  { $gt: ['$expiresAt', new Date()] },
                  {
                    $or: [
                      { $and: [{ $eq: ['$gigId', '$$gigId'] }, { $eq: ['$promotionType', 'single_gig'] }] },
                      { $and: [{ $eq: ['$userId', '$$sellerId'] }, { $eq: ['$promotionType', 'all_gigs'] }] }
                    ]
                  }
                ]
              }
            }
          },
          { $sort: { planPriority: -1 } },
          { $limit: 1 }
        ],
        as: 'activePromotion'
      }
    },
    // Stage 2: Add ranking fields
    {
      $addFields: {
        promotionPriority: { $arrayElemAt: ['$activePromotion.planPriority', 0] },
        promotionScore: {
          $cond: [
            { $gte: [{ $arrayElemAt: ['$activePromotion.planPriority', 0] }, 100] },
            3,
            {
              $cond: [
                { $gte: [{ $arrayElemAt: ['$activePromotion.planPriority', 0] }, 70] },
                3,
                {
                  $cond: [
                    { $gte: [{ $arrayElemAt: ['$activePromotion.planPriority', 0] }, 40] },
                    2,
                    {
                      $cond: [
                        { $gte: [{ $arrayElemAt: ['$activePromotion.planPriority', 0] }, 20] },
                        1,
                        0
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        },
        ratingScore: {
          $cond: [
            { $gt: ['$starNumber', 0] },
            { $multiply: [{ $divide: ['$totalStars', '$starNumber'] }, 20] },
            0
          ]
        },
        rankingScore: {
          $add: [
            {
              $multiply: [
                {
                  $cond: [
                    { $gte: [{ $arrayElemAt: ['$activePromotion.planPriority', 0] }, 100] },
                    3,
                    {
                      $cond: [
                        { $gte: [{ $arrayElemAt: ['$activePromotion.planPriority', 0] }, 70] },
                        3,
                        {
                          $cond: [
                            { $gte: [{ $arrayElemAt: ['$activePromotion.planPriority', 0] }, 40] },
                            2,
                            {
                              $cond: [
                                { $gte: [{ $arrayElemAt: ['$activePromotion.planPriority', 0] }, 20] },
                                1,
                                0
                              ]
                            }
                          ]
                        }
                      ]
                    }
                  ]
                },
                1000
              ]
            },
            {
              $multiply: [
                {
                  $cond: [
                    { $gt: ['$starNumber', 0] },
                    { $multiply: [{ $divide: ['$totalStars', '$starNumber'] }, 20] },
                    0
                  ]
                },
                100
              ]
            },
            { $ifNull: ['$sales', 0] }
          ]
        }
      }
    },
    // Stage 3: Sort by ranking score
    { $sort: { rankingScore: -1 } }
  ];
};

module.exports = {
  isPromotionActive,
  getPromotionScore,
  getRatingScore,
  calculateRankingScore,
  sortGigsByRanking,
  enrichGigsWithRanking,
  getRankingAggregationPipeline,
  getActivePromotionPriority,
  normalizePromotionScore
};
