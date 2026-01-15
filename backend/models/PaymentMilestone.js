const mongoose = require('mongoose');

/**
 * Payment Milestone Schema
 * Tracks individual payment milestones for each order
 * Supports the milestone-based payment flow:
 * - Order Placed → 0% paid
 * - Freelancer Accepted → 10% authorized
 * - In Escrow → 50% captured
 * - Delivered → 20% pending release
 * - Reviewed → 20% pending final
 * - Completed → 100% released
 */
const paymentMilestoneSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true
  },
  
  stage: {
    type: String,
    required: true,
    enum: [
      'order_placed',       // 0% - Order created
      'accepted',           // 10% - Freelancer accepted
      'in_escrow',          // 50% - Funds captured and held
      'delivered',          // 20% - Work delivered
      'reviewed',           // 20% - Client reviewed
      'completed',          // 100% total released
      'cancelled',          // Order cancelled
      'refunded',           // Payment refunded
      'disputed'            // Payment in dispute
    ]
  },
  
  percentageOfTotal: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  vatAmount: {
    type: Number,
    default: 0
  },
  
  stripePaymentIntentId: {
    type: String,
    required: false,
    index: true
  },
  stripeChargeId: {
    type: String,
    required: false
  },
  stripeTransferId: {
    type: String,
    required: false
  },
  
  paymentStatus: {
    type: String,
    required: true,
    enum: [
      'pending',            // Payment not yet initiated
      'authorized',         // Payment authorized but not captured
      'captured',           // Payment captured and held
      'held_in_escrow',     // Funds held in platform escrow
      'pending_release',    // Awaiting release to freelancer
      'released',           // Funds released to freelancer
      'refunded',           // Funds returned to client
      'failed',             // Payment failed
      'cancelled'           // Payment cancelled
    ],
    default: 'pending'
  },
  
  authorizedAt: { type: Date },
  capturedAt: { type: Date },
  releasedAt: { type: Date },
  refundedAt: { type: Date },
  failedAt: { type: Date },
  
  failureReason: { type: String },
  failureCode: { type: String },
  
  metadata: {
    type: Map,
    of: String,
    default: {}
  },
  
  triggeredBy: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['buyer', 'seller', 'system', 'admin'] },
    action: { type: String }
  },
  
  notes: { type: String }
  
}, {
  timestamps: true
});

paymentMilestoneSchema.index({ orderId: 1, stage: 1 });
paymentMilestoneSchema.index({ stripePaymentIntentId: 1 });
paymentMilestoneSchema.index({ createdAt: -1 });

paymentMilestoneSchema.virtual('displayAmount').get(function() {
  return `$${this.amount.toFixed(2)}`;
});

paymentMilestoneSchema.statics.getOrderMilestones = async function(orderId) {
  return this.find({ orderId }).sort({ createdAt: 1 });
};

paymentMilestoneSchema.statics.getCurrentPaymentStatus = async function(orderId) {
  const milestones = await this.find({ orderId }).sort({ createdAt: -1 });
  if (milestones.length === 0) return null;
  
  const totalPaid = milestones
    .filter(m => m.paymentStatus === 'released')
    .reduce((sum, m) => sum + m.amount, 0);
    
  const totalPending = milestones
    .filter(m => ['held_in_escrow', 'pending_release'].includes(m.paymentStatus))
    .reduce((sum, m) => sum + m.amount, 0);
    
  return {
    currentStage: milestones[0].stage,
    totalPaid,
    totalPending,
    milestones: milestones.reverse()
  };
};

paymentMilestoneSchema.methods.markFailed = async function(reason, code = null) {
  this.paymentStatus = 'failed';
  this.failureReason = reason;
  this.failureCode = code;
  this.failedAt = new Date();
  return this.save();
};

paymentMilestoneSchema.methods.markReleased = async function(transferId = null) {
  this.paymentStatus = 'released';
  this.stripeTransferId = transferId;
  this.releasedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('PaymentMilestone', paymentMilestoneSchema);
