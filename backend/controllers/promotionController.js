const Promotion = require("../models/Promotion"); // Legacy
const PromotionPurchase = require("../models/PromotionPurchase"); // New: Single source of truth
const User = require("../models/User");
const { sendPromotionPlanEmail } = require("../services/emailService");
const { getAmountWithFeeAndTax, getPriceBreakdown } = require("../services/priceUtil");
const { createCustomerAndPaymentIntentUtil } = require("./PaymentController");
const { getVatRate } = require("./vatController");
const { PROMOTION_PLANS, getPlan, isValidPlanKey } = require("../utils/promotionPlans");
const mongoose = require('mongoose');

/**
 * Check if user is eligible to buy promotions (must be seller or company)
 */
const isEligibleForPromotion = (user) => {
  if (!user) return false;

  console.log('Checking promotion eligibility for user:', {
    id: user._id,
    role: user.role,
    isSeller: user.isSeller,
    isCompany: user.isCompany,
    sellerType: user.sellerType
  });

  // Use the schema method if available
  if (typeof user.isSellerUser === 'function') {
    if (user.isSellerUser()) return true;
  }
  
  // Broad inclusive check
  const isFreelancer = user.role === 'freelancer' || user.role === 'seller';
  const isAdmin = user.role === 'admin';
  const hasSellerFlag = user.isSeller === true || user.isSeller === 'true';
  const hasCompanyFlag = user.isCompany === true || user.isCompany === 'true';
  const isCompanyType = user.sellerType === 'company';

  const eligible = isFreelancer || isAdmin || hasSellerFlag || hasCompanyFlag || isCompanyType;
  
  console.log('Eligibility result:', { 
    eligible, isFreelancer, isAdmin, hasSellerFlag, hasCompanyFlag, isCompanyType 
  });
  
  return eligible;
};

/**
 * All Jobs Promotion - Monthly Subscription
 * For promoting all gigs of a seller
 */
const allJobsPromotionMonthlySubscription = async (req, res) => {
  try {
    const { userId } = req;
    const { promotionPlan } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "You are unauthorized!" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User does not exist!" });
    }

    // Check if user is eligible (must be seller/company)
    if (!isEligibleForPromotion(user)) {
      return res.status(403).json({ 
        message: "Only sellers and companies can purchase promotion plans. Please become a seller first." 
      });
    }

    if (!promotionPlan) {
      return res.status(400).json({ message: "Promotion plan is required!" });
    }

    // Check if user already has an active "all gigs" promotion
    const existingActivePromotion = await Promotion.findOne({
      userId: userId,
      isForAll: true,
      status: 'active',
      promotionEndDate: { $gt: new Date() }
    });

    if (existingActivePromotion) {
      return res.status(400).json({ 
        message: "You already have an active promotion plan for all your gigs. Please wait until it expires before purchasing a new one.",
        activePromotion: {
          plan: existingActivePromotion.promotionPlan,
          endDate: existingActivePromotion.promotionEndDate,
          remainingDays: Math.ceil((existingActivePromotion.promotionEndDate - new Date()) / (1000 * 60 * 60 * 24))
        }
      });
    }

    let amount = 0;

    switch (promotionPlan) {
      case "homepage":
        amount = 70;
        break;
      case "premium":
        amount = 60;
        break;
      case "standard":
        amount = 50;
        break;
      case "basic":
        amount = 40;
        break;
      default:
        return res.status(400).json({ message: "Invalid promotion plan!" });
    }
    const rateAmount = await getVatRate(userId);
    const breakdown = getPriceBreakdown(amount, rateAmount);

    if (!breakdown.success) {
      return res.status(500).json({ message: "Error calculating price breakdown" });
    }

    const additionalData = { 
      promotionPlan, 
      userId, 
      vatRate: breakdown.vatRate,
      baseAmount: breakdown.basePrice,
      vatAmount: breakdown.vatAmount,
      platformFee: breakdown.platformFee,
      totalAmount: breakdown.totalPrice,
      isForAll: true 
    };

    const paymentIntentResponse = await createCustomerAndPaymentIntentUtil(
      breakdown.totalPrice,
      user.email,
      "monthly_promotion",
      additionalData
    );

    const { client_secret: secret, payment_intent } = paymentIntentResponse;

    // Don't create promotion here - it will be created by the webhook after payment succeeds
    // The webhook handler (handlePaymentIntentSucceeded) creates the promotion

    if (!secret) {
      return res.status(500).json({ message: "Failed to create payment intent." });
    }

    res.status(200).json({ client_secret: secret });
  } catch (error) {
    console.error("Error in monthlyPromotionSubscription:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * Single Gig Promotion - Monthly Subscription
 * For promoting a specific gig
 */
const singleJobPromotionMonthlySubscriptionController = async (req, res) => {
  try {
    const { gigId, promotionPlan } = req.body;
    const { userId } = req;

    if (!userId) {
      return res.status(401).json({ message: "You are unauthorized!" });
    }

    if (!gigId) {
      return res.status(400).json({ message: "Gig ID is required!" });
    }

    if (!promotionPlan) {
      return res.status(400).json({ message: "Promotion plan is required!" });
    }

    // Verify user existence
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User does not exist!" });
    }

    // Check if user is eligible (must be seller/company)
    if (!isEligibleForPromotion(user)) {
      return res.status(403).json({ 
        message: "Only sellers and companies can purchase promotion plans. Please become a seller first." 
      });
    }

    // Check if this gig already has an active promotion (FIVERR-STYLE: Only ONE active plan per gig)
    const existingActivePromotion = await Promotion.findOne({
      gigId: gigId,
      status: 'active',
      promotionEndDate: { $gt: new Date() }
    });

    if (existingActivePromotion) {
      return res.status(400).json({ 
        message: "This gig already has an active promotion plan. Only one promotion plan can be active per gig at a time.",
        activePromotion: {
          plan: existingActivePromotion.promotionPlan,
          startDate: existingActivePromotion.promotionStartDate,
          endDate: existingActivePromotion.promotionEndDate,
          remainingDays: Math.ceil((existingActivePromotion.promotionEndDate - new Date()) / (1000 * 60 * 60 * 24))
        }
      });
    }

    // Determine the promotion amount
    let amount;
    switch (promotionPlan) {
      case "homepage":
        amount = 30;
        break;
      case "sponsored":
        amount = 20;
        break;
      case "featured":
        amount = 10;
        break;
      default:
        return res.status(400).json({ message: "Invalid promotion plan!" });
    }

    const rateAmount = await getVatRate(userId);
    const breakdown = getPriceBreakdown(amount, rateAmount);

    if (!breakdown.success) {
      return res.status(500).json({ message: "Error calculating price breakdown" });
    }

    const additionalData = { 
      gigId, 
      promotionPlan, 
      userId, 
      vatRate: breakdown.vatRate,
      baseAmount: breakdown.basePrice,
      vatAmount: breakdown.vatAmount,
      platformFee: breakdown.platformFee,
      totalAmount: breakdown.totalPrice,
      isForAll: false 
    };

    console.log("Total Amount with VAT and fees:", breakdown.totalPrice);
    
    // Create payment intent
    const paymentIntentResponse = await createCustomerAndPaymentIntentUtil(
      breakdown.totalPrice,
      user.email,
      "gig_promotion",
      additionalData
    );

    const { client_secret: secret, payment_intent: intent } = paymentIntentResponse;

    if (!secret || !intent) {
      return res.status(500).json({ message: "Failed to create payment intent." });
    }

    return res.status(200).json(paymentIntentResponse);
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

/**
 * Get all promotions for the authenticated user
 * Includes active status calculation
 */
const getUserGigPromotions = async (req, res) => {
  try {
    const { userId } = req;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Fetch all promotions for this user
    const promotions = await Promotion.find({ userId: new mongoose.Types.ObjectId(userId) })
      .populate('gigId', 'title photos')
      .sort({ createdAt: -1 })
      .lean();

    const now = new Date();

    // Process promotions to add calculated fields
    const processedPromotions = promotions.map(promotion => {
      const isActive = promotion.status === 'active' && 
                       promotion.promotionStartDate && 
                       new Date(promotion.promotionStartDate) <= now && 
                       new Date(promotion.promotionEndDate) > now;

      const remainingDays = isActive 
        ? Math.ceil((new Date(promotion.promotionEndDate) - now) / (1000 * 60 * 60 * 24))
        : 0;

      // Auto-update status if expired
      if (promotion.status === 'active' && new Date(promotion.promotionEndDate) <= now) {
        // Mark as expired in DB (async, don't wait)
        Promotion.findByIdAndUpdate(promotion._id, { status: 'expired' }).catch(console.error);
      }

      return {
        _id: promotion._id,
        promotionPlan: promotion.promotionPlan,
        status: isActive ? 'active' : (new Date(promotion.promotionEndDate) <= now ? 'expired' : promotion.status),
        isActive,
        isForAll: promotion.isForAll,
        promotionStartDate: promotion.promotionStartDate,
        promotionEndDate: promotion.promotionEndDate,
        remainingDays,
        durationDays: promotion.durationDays || 30,
        amountPaid: promotion.amountPaid,
        gig: promotion.gigId ? {
          _id: promotion.gigId._id,
          title: promotion.gigId.title,
          photos: promotion.gigId.photos
        } : null,
        createdAt: promotion.createdAt
      };
    });

    res.status(200).json(processedPromotions);
  } catch (error) {
    console.error("Error fetching gig promotions:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

/**
 * Check if a gig has an active promotion
 * Used by frontend to disable purchase buttons
 */
const checkGigActivePromotion = async (req, res) => {
  try {
    const { gigId } = req.params;
    const { userId } = req;

    if (!gigId) {
      return res.status(400).json({ error: "Gig ID is required" });
    }

    const now = new Date();

    // Check for active promotion on this gig
    const activePromotion = await Promotion.findOne({
      gigId: new mongoose.Types.ObjectId(gigId),
      status: 'active',
      promotionStartDate: { $lte: now },
      promotionEndDate: { $gt: now }
    }).lean();

    if (activePromotion) {
      return res.status(200).json({
        hasActivePromotion: true,
        activePromotion: {
          plan: activePromotion.promotionPlan,
          startDate: activePromotion.promotionStartDate,
          endDate: activePromotion.promotionEndDate,
          remainingDays: Math.ceil((new Date(activePromotion.promotionEndDate) - now) / (1000 * 60 * 60 * 24))
        }
      });
    }

    return res.status(200).json({ hasActivePromotion: false });
  } catch (error) {
    console.error("Error checking gig promotion:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

/**
 * Get user's active promotions only
 */
const getUserActivePromotions = async (req, res) => {
  try {
    const { userId } = req;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const now = new Date();

    // Fetch only active promotions
    const activePromotions = await Promotion.find({
      userId: userId,
      status: 'active',
      promotionStartDate: { $lte: now },
      promotionEndDate: { $gt: now }
    })
    .populate('gigId', 'title photos')
    .sort({ promotionEndDate: 1 }) // Sort by ending soonest
    .lean();

    const processedPromotions = activePromotions.map(promotion => ({
      _id: promotion._id,
      promotionPlan: promotion.promotionPlan,
      isForAll: promotion.isForAll,
      promotionStartDate: promotion.promotionStartDate,
      promotionEndDate: promotion.promotionEndDate,
      remainingDays: Math.ceil((new Date(promotion.promotionEndDate) - now) / (1000 * 60 * 60 * 24)),
      gig: promotion.gigId ? {
        _id: promotion.gigId._id,
        title: promotion.gigId.title,
        photos: promotion.gigId.photos
      } : null
    }));

    res.status(200).json({
      activePromotions: processedPromotions,
      count: processedPromotions.length
    });
  } catch (error) {
    console.error("Error fetching active promotions:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

/**
 * Delete a promotion (only allowed for pending/expired promotions)
 */
const deletePromotion = async (req, res) => {
  try {
    const { userId } = req;
    const { promotionId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!promotionId) {
      return res.status(400).json({ error: "Promotion ID is required" });
    }

    // Find the promotion
    const promotion = await Promotion.findById(promotionId);

    if (!promotion) {
      return res.status(404).json({ error: "Promotion not found" });
    }

    // Verify ownership
    if (promotion.userId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "You can only delete your own promotions" });
    }

    // Only allow deletion of non-active promotions
    if (promotion.status === 'active') {
      const now = new Date();
      if (promotion.promotionEndDate > now) {
        return res.status(400).json({ 
          error: "Cannot delete an active promotion. You can cancel it instead.",
          suggestion: "Use the cancel endpoint to stop an active promotion"
        });
      }
    }

    // Delete the promotion
    await Promotion.findByIdAndDelete(promotionId);

    res.status(200).json({ 
      success: true, 
      message: "Promotion deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting promotion:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

/**
 * Cancel an active promotion
 */
const cancelPromotion = async (req, res) => {
  try {
    const { userId } = req;
    const { promotionId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!promotionId) {
      return res.status(400).json({ error: "Promotion ID is required" });
    }

    // Find the promotion
    const promotion = await Promotion.findById(promotionId);

    if (!promotion) {
      return res.status(404).json({ error: "Promotion not found" });
    }

    // Verify ownership
    if (promotion.userId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "You can only cancel your own promotions" });
    }

    // Check if promotion is active
    if (promotion.status !== 'active') {
      return res.status(400).json({ 
        error: `Cannot cancel a promotion with status '${promotion.status}'`,
        currentStatus: promotion.status
      });
    }

    // Cancel the promotion
    promotion.status = 'cancelled';
    await promotion.save();

    res.status(200).json({ 
      success: true, 
      message: "Promotion cancelled successfully",
      promotion: {
        _id: promotion._id,
        status: promotion.status,
        promotionPlan: promotion.promotionPlan
      }
    });
  } catch (error) {
    console.error("Error cancelling promotion:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

/**
 * Get Promotion Purchase History (Seller)
 * Reads from PromotionPurchase collection - single source of truth
 */
const getPromotionHistory = async (req, res) => {
  try {
    const { userId } = req;
    const { page = 1, limit = 20, status } = req.query;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const query = { userId: new mongoose.Types.ObjectId(userId) };
    if (status && ['pending', 'active', 'expired', 'cancelled', 'failed'].includes(status)) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [purchases, total] = await Promise.all([
      PromotionPurchase.find(query)
        .populate('gigId', 'title photos category')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      PromotionPurchase.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: purchases,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Error fetching promotion history:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

/**
 * Get all promotion plans (public endpoint)
 */
const getPromotionPlans = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      plans: Object.values(PROMOTION_PLANS)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
};

module.exports = { 
  allJobsPromotionMonthlySubscription,
  singleJobPromotionMonthlySubscriptionController,
  getUserGigPromotions,
  checkGigActivePromotion,
  getUserActivePromotions,
  deletePromotion,
  cancelPromotion,
  getPromotionHistory,
  getPromotionPlans
};
