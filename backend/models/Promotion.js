const mongoose = require("mongoose");

const gigPromotionSchema = new mongoose.Schema({
  gigId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Job", 
    required: function () {
      return !this.isForAll; 
    }
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  isForAll: { 
    type: Boolean, 
    default: false, 
    required: true 
  }, 
  promotionPlan: { 
    type: String, 
    required: true 
  },
  // Status tracking for active/expired/cancelled promotions
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled', 'pending'],
    default: 'pending'
  },
  // Start date of the promotion (set when payment succeeds)
  promotionStartDate: {
    type: Date,
    default: null
  },
  promotionEndDate: { 
    type: Date, 
    required: true 
  },
  // Stripe payment tracking
  stripePaymentIntentId: {
    type: String,
    default: null
  },
  // Amount paid (total including VAT)
  amountPaid: {
    type: Number,
    default: 0
  },
  // VAT breakdown
  baseAmount: { type: Number },
  vatRate: { type: Number },
  vatAmount: { type: Number },
  platformFee: { type: Number },
  currency: { type: String, default: 'USD' },
  // Duration in days
  durationDays: {
    type: Number,
    default: 30
  }
}, { timestamps: true });

// Index for efficient querying of active promotions per gig
gigPromotionSchema.index({ gigId: 1, status: 1 });
gigPromotionSchema.index({ userId: 1, status: 1 });

// Method to check if promotion is currently active
gigPromotionSchema.methods.isCurrentlyActive = function() {
  const now = new Date();
  return this.status === 'active' && 
         this.promotionStartDate && 
         this.promotionStartDate <= now && 
         this.promotionEndDate > now;
};

// Static method to get active promotion for a gig
gigPromotionSchema.statics.getActivePromotionForGig = async function(gigId) {
  const now = new Date();
  return this.findOne({
    gigId: gigId,
    status: 'active',
    promotionStartDate: { $lte: now },
    promotionEndDate: { $gt: now }
  });
};

// Static method to check if user has any active promotion
gigPromotionSchema.statics.hasActivePromotion = async function(userId, gigId) {
  const now = new Date();
  return this.exists({
    userId: userId,
    gigId: gigId,
    status: 'active',
    promotionStartDate: { $lte: now },
    promotionEndDate: { $gt: now }
  });
};

module.exports = mongoose.model("GigPromotion", gigPromotionSchema);

