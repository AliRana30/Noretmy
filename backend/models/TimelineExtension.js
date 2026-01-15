const mongoose = require('mongoose');

const timelineExtensionSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  extensionDays: {
    type: Number,
    required: true,
    min: 1
  },
  amount: {
    type: Number,
    required: true
  },
  paymentIntentId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'completed', 'refunded'],
    default: 'pending'
  },
  previousDeadline: {
    type: Date,
    required: true
  },
  newDeadline: {
    type: Date,
    required: true
  },
  freelancerRevenue: {
    type: Number,
    required: true // Amount added to freelancer's pending revenue
  },
  approvedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

timelineExtensionSchema.index({ orderId: 1 });
timelineExtensionSchema.index({ requestedBy: 1, createdAt: -1 });

module.exports = mongoose.model('TimelineExtension', timelineExtensionSchema);
