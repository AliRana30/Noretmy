/**
 * Seller Badge System Model
 * Fiverr-style seller badge and trust system
 * 
 * Badge Levels:
 * - New Seller: Default for new sellers
 * - Level 1: 10+ orders, 4.7+ rating, 90%+ completion, $500+ earnings
 * - Level 2: 50+ orders, 4.8+ rating, 95%+ completion, $5000+ earnings
 * - Top Rated: 100+ orders, 4.9+ rating, 98%+ completion, $10000+ earnings
 */

const mongoose = require('mongoose');

const sellerBadgeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Current Badge Level
  currentLevel: {
    type: String,
    enum: ['new', 'level_1', 'level_2', 'top_rated'],
    default: 'new'
  },
  
  // Badge label for display
  label: {
    type: String,
    default: 'New Seller'
  },
  
  // Trust Score (0-100)
  trustScore: {
    type: Number,
    default: 50,
    min: 0,
    max: 100
  },
  
  // Performance Metrics (Rolling 90-day window)
  metrics: {
    // Order Metrics
    totalOrders: { type: Number, default: 0 },
    completedOrders: { type: Number, default: 0 },
    cancelledOrders: { type: Number, default: 0 },
    disputedOrders: { type: Number, default: 0 },
    
    // Rating Metrics
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    
    // Performance Rates (as percentages)
    completionRate: { type: Number, default: 100 },
    onTimeDeliveryRate: { type: Number, default: 100 },
    responseRate: { type: Number, default: 100 },
    cancellationRate: { type: Number, default: 0 },
    disputeRate: { type: Number, default: 0 },
    
    // Earnings
    totalEarnings: { type: Number, default: 0 },
    last90DaysEarnings: { type: Number, default: 0 },
    
    // Response Time (in minutes)
    averageResponseTime: { type: Number, default: 0 },
    
    // Recent Activity Indicators
    lastOrderDate: { type: Date },
    lastResponseDate: { type: Date },
    isActive: { type: Boolean, default: true }
  },
  
  // Badge History for tracking promotions/demotions
  badgeHistory: [{
    previousLevel: String,
    newLevel: String,
    reason: String,
    changedAt: { type: Date, default: Date.now },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Achievement Badges (Non-ranking milestones)
  achievements: [{
    type: {
      type: String,
      enum: [
        'first_order',       // Completed first order
        'fast_responder',    // < 1 hour avg response time
        'perfect_rating',    // 5.0 rating with 10+ reviews
        '100_orders',        // Completed 100 orders
        'super_seller',      // 500+ orders
        'veteran',           // 2+ years on platform
        'top_earner',        // $50k+ total earnings
        'trending',          // Rapid growth in orders
        'client_favorite'    // 50+ repeat clients
      ]
    },
    earnedAt: { type: Date, default: Date.now },
    metadata: mongoose.Schema.Types.Mixed
  }],
  
  // Admin Controls
  adminOverride: {
    isOverridden: { type: Boolean, default: false },
    overriddenLevel: String,
    reason: String,
    overriddenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    overriddenAt: Date
  },
  
  // Badge Freeze (prevents automatic changes)
  isFrozen: { type: Boolean, default: false },
  frozenReason: String,
  frozenBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  frozenAt: Date,
  
  // Search Ranking Boost (higher = more visibility)
  searchBoost: {
    type: Number,
    default: 1.0,
    min: 0.5,
    max: 3.0
  },
  
  // Last evaluation timestamp
  lastEvaluatedAt: { type: Date, default: Date.now },
  nextEvaluationAt: { type: Date },
  
  // Reliability Indicators (shown to buyers)
  reliabilityIndicators: {
    showOnTimeRate: { type: Boolean, default: true },
    showResponseTime: { type: Boolean, default: true },
    showCompletionRate: { type: Boolean, default: true }
  }
  
}, {
  timestamps: true
});

// Indexes for efficient queries
sellerBadgeSchema.index({ userId: 1 });
sellerBadgeSchema.index({ currentLevel: 1 });
sellerBadgeSchema.index({ 'metrics.averageRating': -1 });
sellerBadgeSchema.index({ searchBoost: -1 });
sellerBadgeSchema.index({ trustScore: -1 });

// Virtual for display badge info
sellerBadgeSchema.virtual('displayBadge').get(function() {
  const badgeConfig = {
    new: { label: 'New Seller', emoji: '🆕', color: '#4CAF50' },
    level_1: { label: 'Level 1 Seller', emoji: '🥉', color: '#CD7F32' },
    level_2: { label: 'Level 2 Seller', emoji: '🥈', color: '#C0C0C0' },
    top_rated: { label: 'Top Rated Seller', emoji: '⭐', color: '#FFD700' }
  };
  
  return badgeConfig[this.currentLevel] || badgeConfig.new;
});

// Method to calculate trust score
sellerBadgeSchema.methods.calculateTrustScore = function() {
  const m = this.metrics;
  
  // Weighted calculation
  const ratingWeight = 0.35;
  const completionWeight = 0.25;
  const onTimeWeight = 0.20;
  const responseWeight = 0.10;
  const activityWeight = 0.10;
  
  const normalizedRating = (m.averageRating / 5) * 100;
  const activityScore = m.isActive ? 100 : 50;
  
  const score = (
    (normalizedRating * ratingWeight) +
    (m.completionRate * completionWeight) +
    (m.onTimeDeliveryRate * onTimeWeight) +
    (m.responseRate * responseWeight) +
    (activityScore * activityWeight)
  );
  
  return Math.round(Math.min(100, Math.max(0, score)));
};

// Method to determine badge level based on metrics
sellerBadgeSchema.methods.evaluateBadgeLevel = function() {
  const m = this.metrics;
  
  // Top Rated: 100+ orders, 4.9+ rating, 98%+ completion, $10000+ earnings
  if (m.completedOrders >= 100 && m.averageRating >= 4.9 && 
      m.completionRate >= 98 && m.totalEarnings >= 10000) {
    return { level: 'top_rated', label: 'Top Rated Seller' };
  }
  
  // Level 2: 50+ orders, 4.8+ rating, 95%+ completion, $5000+ earnings
  if (m.completedOrders >= 50 && m.averageRating >= 4.8 && 
      m.completionRate >= 95 && m.totalEarnings >= 5000) {
    return { level: 'level_2', label: 'Level 2 Seller' };
  }
  
  // Level 1: 10+ orders, 4.7+ rating, 90%+ completion, $500+ earnings
  if (m.completedOrders >= 10 && m.averageRating >= 4.7 && 
      m.completionRate >= 90 && m.totalEarnings >= 500) {
    return { level: 'level_1', label: 'Level 1 Seller' };
  }
  
  // Default: New Seller
  return { level: 'new', label: 'New Seller' };
};

// Method to check and update badge
sellerBadgeSchema.methods.updateBadge = async function() {
  if (this.isFrozen || this.adminOverride.isOverridden) {
    return false;
  }
  
  const { level, label } = this.evaluateBadgeLevel();
  
  if (level !== this.currentLevel) {
    // Record history
    this.badgeHistory.push({
      previousLevel: this.currentLevel,
      newLevel: level,
      reason: 'Automatic evaluation based on performance metrics',
      changedAt: new Date()
    });
    
    this.currentLevel = level;
    this.label = label;
    
    // Update search boost based on level
    const boostMap = {
      new: 1.0,
      level_1: 1.5,
      level_2: 2.0,
      top_rated: 3.0
    };
    this.searchBoost = boostMap[level];
  }
  
  // Update trust score
  this.trustScore = this.calculateTrustScore();
  this.lastEvaluatedAt = new Date();
  this.nextEvaluationAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 1 week
  
  await this.save();
  return true;
};

// Static method to get or create badge for user
sellerBadgeSchema.statics.getOrCreate = async function(userId) {
  let badge = await this.findOne({ userId });
  
  if (!badge) {
    badge = await this.create({ userId });
  }
  
  return badge;
};

// Ensure virtuals are included in JSON
sellerBadgeSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('SellerBadge', sellerBadgeSchema);
