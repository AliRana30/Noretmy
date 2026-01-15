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
  country: { type: String, required: false },
  city: { type: String, required: false },
  phone: { type: String, required: false },
  
  sellerType: {
    type: String,
    enum: ['individual', 'company'],
    default: 'individual'
  },
  
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  }],
  
  role: {
    type: String,
    enum: ['admin', 'client', 'freelancer'],
    default: 'client',
    required: true
  },
  
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

  revenue: {
    total: { type: Number, default: 0 },        // Total earned
    available: { type: Number, default: 0 },    // Available for withdrawal
    pending: { type: Number, default: 0 },      // From timeline extensions, released on order completion
    withdrawn: { type: Number, default: 0 }     // Total withdrawn
  },

}, {
  timestamps: true // Add createdAt and updatedAt
});

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  
  if (this.isModified('role') || this.isModified('isSeller')) {
    if (this.role === 'freelancer') {
      this.isSeller = true;
    } else if (this.role === 'client') {
      this.isSeller = false;
    }
    if (this.role === 'admin' && !this.isModified('isSeller')) {
      this.isSeller = false;
    }
  }
  
  if (this.isModified('sellerType') || this.isModified('isCompany')) {
    if (this.sellerType === 'company') {
      this.isCompany = true;
    } else {
      this.isCompany = false;
    }
    if (this.isModified('isCompany') && !this.isModified('sellerType')) {
      this.sellerType = this.isCompany ? 'company' : 'individual';
    }
  }
  
  next();
});

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

userSchema.methods.hasPermission = function(permission) {
  if (this.role === 'admin') {
    return true; // Admins have all permissions
  }
  return this.permissions.includes(permission);
};

userSchema.methods.hasRole = function(roles) {
  if (!Array.isArray(roles)) {
    roles = [roles];
  }
  return roles.includes(this.role);
};

userSchema.methods.matchPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
