/**
 * PromotionPurchase Model
 * Single source of truth for all promotion purchases.
 * History must NEVER be inferred from users, gigs, orders, or Stripe dashboard.
 */

const mongoose = require('mongoose');

const promotionPurchaseSchema = new mongoose.Schema({
  // Stripe Identity (unique, idempotent key)
  stripePaymentIntentId: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true 
  },
  
  // User who purchased
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    index: true 
  },
  
  // Plan details (from PROMOTION_PLANS constants)
  planKey: { 
    type: String, 
    required: true, 
    enum: ['basic', 'standard', 'premium', 'ultimate'],
    index: true
  },
  planName: { type: String, required: true },
  planPriority: { type: Number, required: true },
  
  // Promotion type
  promotionType: { 
    type: String, 
    enum: ['single_gig', 'all_gigs'], 
    required: true 
  },
  gigId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Job', 
    default: null,
    index: true
  },
  
  // Lifecycle status
  status: { 
    type: String, 
    enum: ['pending', 'active', 'expired', 'cancelled', 'failed', 'deleted'], 
    default: 'pending',
    index: true 
  },
  
  // Timestamps
  purchasedAt: { type: Date, default: Date.now },
  activatedAt: { type: Date, default: null },
  expiresAt: { type: Date, required: true, index: true },
  deletedAt: { type: Date, default: null },
  
  // Duration
  durationDays: { type: Number, default: 30 },
  
  // Pricing (immutable after payment)
  baseAmount: { type: Number, required: true },
  vatRate: { type: Number, default: 0 },
  vatAmount: { type: Number, default: 0 },
  platformFee: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  currency: { type: String, default: 'USD' }
  
}, { timestamps: true });

// Compound indexes for efficient queries
promotionPurchaseSchema.index({ userId: 1, status: 1, createdAt: -1 });
promotionPurchaseSchema.index({ gigId: 1, status: 1, expiresAt: 1 });
promotionPurchaseSchema.index({ status: 1, expiresAt: 1 }); // For cron job

// Static: Check if gig has active promotion
promotionPurchaseSchema.statics.hasActivePromotion = async function(gigId, userId) {
  const now = new Date();
  return this.exists({
    status: 'active',
    expiresAt: { $gt: now },
    $or: [
      { gigId: gigId, promotionType: 'single_gig' },
      { userId: userId, promotionType: 'all_gigs' }
    ]
  });
};

// Static: Get active promotion for gig
promotionPurchaseSchema.statics.getActivePromotionForGig = async function(gigId, sellerId) {
  const now = new Date();
  return this.findOne({
    status: 'active',
    expiresAt: { $gt: now },
    $or: [
      { gigId: gigId, promotionType: 'single_gig' },
      { userId: sellerId, promotionType: 'all_gigs' }
    ]
  }).sort({ planPriority: -1 }).lean();
};

// Static: Get all active promotions (for visibility logic)
promotionPurchaseSchema.statics.getAllActivePromotions = async function() {
  const now = new Date();
  return this.find({
    status: 'active',
    expiresAt: { $gt: now }
  }).lean();
};

module.exports = mongoose.model('PromotionPurchase', promotionPurchaseSchema);
