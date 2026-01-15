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
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled', 'pending'],
    default: 'pending'
  },
  promotionStartDate: {
    type: Date,
    default: null
  },
  promotionEndDate: { 
    type: Date, 
    required: true 
  },
  stripePaymentIntentId: {
    type: String,
    default: null
  },
  amountPaid: {
    type: Number,
    default: 0
  },
  baseAmount: { type: Number },
  vatRate: { type: Number },
  vatAmount: { type: Number },
  platformFee: { type: Number },
  currency: { type: String, default: 'USD' },
  durationDays: {
    type: Number,
    default: 30
  }
}, { timestamps: true });

gigPromotionSchema.index({ gigId: 1, status: 1 });
gigPromotionSchema.index({ userId: 1, status: 1 });

gigPromotionSchema.methods.isCurrentlyActive = function() {
  const now = new Date();
  return this.status === 'active' && 
         this.promotionStartDate && 
         this.promotionStartDate <= now && 
         this.promotionEndDate > now;
};

gigPromotionSchema.statics.getActivePromotionForGig = async function(gigId) {
  const now = new Date();
  return this.findOne({
    gigId: gigId,
    status: 'active',
    promotionStartDate: { $lte: now },
    promotionEndDate: { $gt: now }
  });
};

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

