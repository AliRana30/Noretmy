const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
    required: true,
    unique: true
  },  
  profilePicture: { type: String, required: false },
  profileHeadline: { type: String, required: false },
  location: { type: String, required: false },
  country: { type: String, required: false },
  countryCode: { type: String, required: false },
  description: { type: String, required: false },
  skills: { type: [String], required: false },
  isCompany: { type: Boolean, default: false },
  
  // VAT fields for B2B
  vatId: { type: String, required: false }, // EU VAT ID for B2B
  vatIdVerified: { type: Boolean, default: false },
  vatIdVerifiedAt: { type: Date, required: false },
  billingCountry: { type: String, required: false }, // For VAT calculation
  
  // Seller type: individual freelancer or company/agency
  sellerType: {
    type: String,
    enum: ['individual', 'company'],
    default: 'individual'
  },
  
  // Company-specific fields (only used when sellerType is 'company')
  companyInfo: {
    companyName: { type: String },
    registrationNumber: { type: String },
    vatNumber: { type: String },
    teamSize: { type: Number },
    website: { type: String },
    foundedYear: { type: Number },
    industry: { type: String }
  },
  
  // Freelancer stats
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  totalReviews: { type: Number, default: 0 },
  onTimeDeliveryRate: { type: Number, default: 100, min: 0, max: 100 },
  totalCompletedOrders: { type: Number, default: 0 },
  completedOrders: { type: Number, default: 0 }, // Alias for compatibility
  totalEarnings: { type: Number, default: 0 },
  responseTime: { type: String, default: 'Within 1 hour' },
  avgResponseTimeMinutes: { type: Number, default: 60 },
  memberSince: { type: Date, default: Date.now },
  
  // Response time tracking
  lastResponseAt: { type: Date },
  totalResponseTimeMs: { type: Number, default: 0 },
  responseCount: { type: Number, default: 0 },
  
  // Client/Buyer stats (for clients who hire freelancers)
  totalOrdersPlaced: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  repeatHireRate: { type: Number, default: 0 },
  
  // Languages
  languages: [{
    language: { type: String },
    level: { type: String, enum: ['Native', 'Fluent', 'Conversational', 'Basic'] }
  }],
  
  // Certifications
  certifications: [{
    name: { type: String },
    issuedBy: { type: String },
    year: { type: Number }
  }],
  
  // Education
  education: [{
    degree: { type: String },
    institution: { type: String },
    year: { type: Number }
  }]
});

// Calculate average response time
userProfileSchema.methods.updateResponseTime = function() {
  if (this.responseCount > 0 && this.totalResponseTimeMs > 0) {
    const avgMinutes = Math.round(this.totalResponseTimeMs / this.responseCount / 60000);
    this.avgResponseTimeMinutes = avgMinutes;
    
    if (avgMinutes < 60) {
      this.responseTime = `Within ${avgMinutes} minutes`;
    } else if (avgMinutes < 1440) {
      this.responseTime = `Within ${Math.round(avgMinutes / 60)} hours`;
    } else {
      this.responseTime = `Within ${Math.round(avgMinutes / 1440)} days`;
    }
  }
};

const UserProfile = mongoose.model('UserProfile', userProfileSchema);

module.exports = UserProfile;
