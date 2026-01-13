// models/Review.js
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  gigId: { type: String, required: true },
  orderId: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reviewer (buyer)
  sellerId: { type: String, required: true }, // Seller being reviewed
  star: { type: Number, required: true, min: 1, max: 5 },
  desc: { type: String, required: true },
  
  // Additional review details
  communicationRating: { type: Number, min: 1, max: 5 },
  qualityRating: { type: Number, min: 1, max: 5 },
  deliveryRating: { type: Number, min: 1, max: 5 },
  
  // Review metadata
  reviewerName: { type: String },
  reviewerImage: { type: String },
  
  // Completion stats from order
  completionTime: { type: Number }, // Days to complete
  deadlineMet: { type: Boolean },
  
  // Response from seller
  sellerResponse: { type: String },
  sellerResponseDate: { type: Date },
  
  // Moderation
  isApproved: { type: Boolean, default: true },
  isFlagged: { type: Boolean, default: false },
  
}, {
  timestamps: true
});

// Index for faster queries
reviewSchema.index({ sellerId: 1, createdAt: -1 });
reviewSchema.index({ gigId: 1 });

module.exports = mongoose.model('Reviews', reviewSchema);
