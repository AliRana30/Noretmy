// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  isVerified: { type: Boolean, default: false },
  isSeller: { type: Boolean, default: false }, 
  isCompany: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },
  isWarned: { type: Boolean, default: false },
  
  // Seller type: individual freelancer or company/agency
  sellerType: {
    type: String,
    enum: ['individual', 'company'],
    default: 'individual'
  },
  
  // Favorites - array of gig IDs
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  }],
  
  // Enhanced role-based system
  role: {
    type: String,
    enum: ['admin', 'client', 'freelancer'],
    default: 'client',
    required: true
  },
  
  // Administrative fields
  permissions: [{
    type: String,
    enum: [
      'user_management', 'order_management', 'payment_management',
      'system_settings', 'analytics_view', 'content_moderation',
      'seller_management', 'promotion_management'
    ]
  }],
  
  verificationToken: { type: String },
  verificationTokenExpiry: { type: Date },
  documentStatus: {
    type: String,
    enum: ['none', 'pending', 'approved', 'rejected'],
    default: 'none'
  }, 

  documentImages: [{ type: String, required: false }],

  // Revenue tracking for freelancers
  revenue: {
    total: { type: Number, default: 0 },        // Total earned
    available: { type: Number, default: 0 },    // Available for withdrawal
    pending: { type: Number, default: 0 },      // From timeline extensions, released on order completion
    withdrawn: { type: Number, default: 0 }     // Total withdrawn
  },

}, {
  timestamps: true // Add createdAt and updatedAt
});

// Pre-save hook to sync role with isSeller for backward compatibility
userSchema.pre('save', async function (next) {
  // Handle password hashing
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  
  // Sync role with isSeller for backward compatibility
  if (this.isModified('role') || this.isModified('isSeller')) {
    if (this.role === 'freelancer') {
      this.isSeller = true;
    } else if (this.role === 'client') {
      this.isSeller = false;
    }
    // For admin, keep isSeller as is or set to false by default
    if (this.role === 'admin' && !this.isModified('isSeller')) {
      this.isSeller = false;
    }
  }
  
  // Sync sellerType with isCompany for backward compatibility
  if (this.isModified('sellerType') || this.isModified('isCompany')) {
    if (this.sellerType === 'company') {
      this.isCompany = true;
    } else {
      this.isCompany = false;
    }
    // If isCompany was set directly, sync sellerType
    if (this.isModified('isCompany') && !this.isModified('sellerType')) {
      this.sellerType = this.isCompany ? 'company' : 'individual';
    }
  }
  
  next();
});

// Virtual to get user type for API responses
userSchema.virtual('userType').get(function() {
  return this.role;
});

/**
 * Virtual field: effectiveRole
 * Returns the user's effective role in the platform:
 * - 'seller' for individual freelancers
 * - 'company' for company/agency sellers
 * - 'client' for buyers
 * - 'admin' for administrators
 */
userSchema.virtual('effectiveRole').get(function() {
  if (this.role === 'admin') return 'admin';
  if (this.role === 'client') return 'client';
  if (this.role === 'freelancer') {
    return this.sellerType === 'company' ? 'company' : 'seller';
  }
  return 'client';
});

/**
 * Virtual field: displayRole  
 * Returns a human-readable role name
 */
userSchema.virtual('displayRole').get(function() {
  if (this.role === 'admin') return 'Administrator';
  if (this.role === 'client') return 'Client';
  if (this.role === 'freelancer') {
    return this.sellerType === 'company' ? 'Company' : 'Seller';
  }
  return 'User';
});

/**
 * Method to check if user is a seller (individual or company)
 */
userSchema.methods.isSellerUser = function() {
  return this.role === 'freelancer' || this.role === 'seller' || this.isSeller === true;
};

/**
 * Method to check if user is a company account
 */
userSchema.methods.isCompanyAccount = function() {
  return this.role === 'freelancer' && this.sellerType === 'company';
};

// Method to check if user has specific permission
userSchema.methods.hasPermission = function(permission) {
  if (this.role === 'admin') {
    return true; // Admins have all permissions
  }
  return this.permissions.includes(permission);
};

// Method to check if user has any of the specified roles
userSchema.methods.hasRole = function(roles) {
  if (!Array.isArray(roles)) {
    roles = [roles];
  }
  return roles.includes(this.role);
};

userSchema.methods.matchPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Ensure virtuals are included in JSON
userSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
