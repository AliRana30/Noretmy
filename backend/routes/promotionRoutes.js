const express = require('express');
const {
  allJobsPromotionMonthlySubscription,
  singleJobPromotionMonthlySubscriptionController,
  completePromotionAfterPayment,
  getUserGigPromotions,
  checkGigActivePromotion,
  getUserActivePromotions,
  deletePromotion,
  cancelPromotion,
  getPromotionHistory,
  getPromotionPlans,
  checkActivePromotion
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

router.get("/plans", getPromotionPlans);


router.post("/monthly", verifyToken, checkRole(["seller"]), allJobsPromotionMonthlySubscription);

router.post("/gig/monthly", verifyToken, checkRole(["seller"]), singleJobPromotionMonthlySubscriptionController);

router.post("/complete-payment", verifyToken, checkRole(["seller"]), completePromotionAfterPayment);

router.get("/history", verifyToken, checkRole(["seller"]), getPromotionHistory);

router.get("/user", verifyToken, checkRole(["seller"]), getUserGigPromotions);

router.get("/user/active", verifyToken, checkRole(["seller"]), getUserActivePromotions);

router.get("/gig/:gigId/active", verifyToken, checkRole(["seller"]), checkGigActivePromotion);

router.delete("/:promotionId", verifyToken, checkRole(["seller"]), deletePromotion);

router.put("/:promotionId/cancel", verifyToken, checkRole(["seller"]), cancelPromotion);

module.exports = router;
