const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema({
  // Recipient information
  recipient: {
    type: String,
    required: true,
    index: true
  },
  recipientName: {
    type: String,
    default: ''
  },
  recipientType: {
    type: String,
    enum: ['buyer', 'seller', 'admin', 'user', 'unknown'],
    default: 'unknown'
  },

  // Email content
  subject: {
    type: String,
    required: true
  },
  emailType: {
    type: String,
    required: true,
    enum: [
      'verification',
      'password_reset',
      'order_placed',
      'order_received',
      'order_accepted',
      'order_delivered',
      'order_completed',
      'order_cancelled',
      'order_revision',
      'payment_success',
      'payment_failed',
      'payment_milestone',
      'funds_released',
      'withdrawal_request',
      'withdrawal_success',
      'withdrawal_rejected',
      'promotion_activated',
      'user_warning',
      'user_blocked',
      'newsletter_welcome',
      'custom_order_request',
      'onboarding',
      'contact_reply',
      'chat_attachment',
      'test',
      'other'
    ],
    index: true
  },
  
  // Status tracking
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'bounced', 'delivered'],
    default: 'pending',
    index: true
  },
  
  // Error handling
  error: {
    message: String,
    code: String,
    stack: String
  },
  
  // Related entities
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  
  // Email provider response
  providerResponse: {
    messageId: String,
    response: String,
    accepted: [String],
    rejected: [String]
  },
  
  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Retry information
  retryCount: {
    type: Number,
    default: 0
  },
  maxRetries: {
    type: Number,
    default: 3
  },
  lastRetryAt: Date,
  nextRetryAt: Date,
  
  // Timestamps
  sentAt: Date,
  deliveredAt: Date

}, {
  timestamps: true
});

// Indexes for efficient querying
emailLogSchema.index({ createdAt: -1 });
emailLogSchema.index({ status: 1, createdAt: -1 });
emailLogSchema.index({ emailType: 1, createdAt: -1 });
emailLogSchema.index({ recipient: 1, createdAt: -1 });

// Static methods
emailLogSchema.statics.getRecentLogs = function(limit = 100) {
  return this.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

emailLogSchema.statics.getFailedEmails = function(hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  return this.find({
    status: 'failed',
    createdAt: { $gte: since }
  }).sort({ createdAt: -1 }).lean();
};

emailLogSchema.statics.getEmailStats = async function(days = 7) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  const stats = await this.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const byType = await this.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: '$emailType',
        total: { $sum: 1 },
        sent: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } },
        failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } }
      }
    }
  ]);
  
  return {
    statusBreakdown: stats,
    typeBreakdown: byType,
    period: `${days} days`
  };
};

emailLogSchema.statics.getRetryableEmails = function() {
  return this.find({
    status: 'failed',
    retryCount: { $lt: 3 },
    $or: [
      { nextRetryAt: { $exists: false } },
      { nextRetryAt: { $lte: new Date() } }
    ]
  }).limit(50);
};

// Instance methods
emailLogSchema.methods.markAsSent = function(providerResponse) {
  this.status = 'sent';
  this.sentAt = new Date();
  if (providerResponse) {
    this.providerResponse = providerResponse;
  }
  return this.save();
};

emailLogSchema.methods.markAsFailed = function(error) {
  this.status = 'failed';
  this.retryCount += 1;
  this.lastRetryAt = new Date();
  this.error = {
    message: error.message || String(error),
    code: error.code,
    stack: error.stack
  };
  
  // Calculate next retry time with exponential backoff
  if (this.retryCount < this.maxRetries) {
    const backoffMinutes = Math.pow(2, this.retryCount) * 5; // 5, 10, 20 minutes
    this.nextRetryAt = new Date(Date.now() + backoffMinutes * 60 * 1000);
  }
  
  return this.save();
};

const EmailLog = mongoose.model('EmailLog', emailLogSchema);

module.exports = EmailLog;
