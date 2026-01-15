const mongoose = require('mongoose');

const WITHDRAWAL_COOLDOWN_DAYS = 7;

const withdrawalRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 10 // Minimum withdrawal amount
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'paid', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'paypal', 'stripe', 'other'],
    required: true
  },
  accountDetails: {
    accountHolderName: String,
    bankName: String,
    accountNumber: String,
    routingNumber: String,
    swiftCode: String,
    iban: String,
    
    paypalEmail: String,
    
    stripeAccountId: String,
    
    otherDetails: String
  },
  notes: {
    type: String,
    maxlength: 500
  },
  adminNotes: {
    type: String,
    maxlength: 500
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: {
    type: Date
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: {
    type: String
  },
  transactionId: {
    type: String // For tracking actual payment transaction
  },
  cooldownEndsAt: {
    type: Date
  }
}, {
  timestamps: true
});

withdrawalRequestSchema.index({ userId: 1, status: 1 });
withdrawalRequestSchema.index({ status: 1, createdAt: -1 });

withdrawalRequestSchema.statics.isInCooldown = async function(userId) {
  const lastApprovedWithdrawal = await this.findOne({
    userId,
    status: { $in: ['approved', 'paid'] }
  }).sort({ processedAt: -1 });
  
  if (!lastApprovedWithdrawal || !lastApprovedWithdrawal.processedAt) {
    return { inCooldown: false };
  }
  
  const cooldownEnd = new Date(lastApprovedWithdrawal.processedAt);
  cooldownEnd.setDate(cooldownEnd.getDate() + WITHDRAWAL_COOLDOWN_DAYS);
  
  if (new Date() < cooldownEnd) {
    return {
      inCooldown: true,
      cooldownEndsAt: cooldownEnd,
      daysRemaining: Math.ceil((cooldownEnd - new Date()) / (1000 * 60 * 60 * 24))
    };
  }
  
  return { inCooldown: false };
};

withdrawalRequestSchema.statics.getCooldownDays = function() {
  return WITHDRAWAL_COOLDOWN_DAYS;
};

module.exports = mongoose.model('WithdrawalRequest', withdrawalRequestSchema);
