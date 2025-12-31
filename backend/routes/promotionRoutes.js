const express = require('express');
const { 
  allJobsPromotionMonthlySubscription, 
  singleJobPromotionMonthlySubscriptionController, 
  getUserGigPromotions,
  checkGigActivePromotion,
  getUserActivePromotions,
  deletePromotion,
  cancelPromotion,
  getPromotionHistory,
  getPromotionPlans
} = require('../controllers/promotionController');
const { verifyToken, checkRole } = require('../middleware/jwt');

const router = express.Router();

/**
 * PROMOTION ROUTES
 * 
 * IMPORTANT: Only seller and company users can access promotion features.
 * - seller = individual freelancer (role: 'freelancer', sellerType: 'individual')
 * - company = organization seller (role: 'freelancer', sellerType: 'company')
 * 
 * Clients CANNOT purchase promotions - they are buyers only.
 */

// ============ PUBLIC ROUTES ============
// Get all available promotion plans (prices, features, etc.)
router.get("/plans", getPromotionPlans);

// ============ SELLER ROUTES ============
// All promotion routes require authentication and seller role

// Purchase all-gigs promotion (monthly subscription)
router.post("/monthly", verifyToken, checkRole(["seller"]), allJobsPromotionMonthlySubscription);

// Purchase single-gig promotion (monthly subscription)
router.post("/gig/monthly", verifyToken, checkRole(["seller"]), singleJobPromotionMonthlySubscriptionController);

// Get promotion purchase history (from PromotionPurchase - single source of truth)
router.get("/history", verifyToken, checkRole(["seller"]), getPromotionHistory);

// Legacy: Get all user's promotions from old Promotion model
router.get("/user", verifyToken, checkRole(["seller"]), getUserGigPromotions);

// Get only active promotions for the user
router.get("/user/active", verifyToken, checkRole(["seller"]), getUserActivePromotions);

// Check if a specific gig has an active promotion
router.get("/gig/:gigId/active", verifyToken, checkRole(["seller"]), checkGigActivePromotion);

// Delete a promotion (only pending/expired promotions can be deleted)
router.delete("/:promotionId", verifyToken, checkRole(["seller"]), deletePromotion);

// Cancel an active promotion
router.put("/:promotionId/cancel", verifyToken, checkRole(["seller"]), cancelPromotion);

module.exports = router;
