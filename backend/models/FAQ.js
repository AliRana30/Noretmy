const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: [
      'Promotional_Plans',
      'Service_Management', 
      'Buying_Services',
      'Account_Profile',
      'Withdrawals_Fees',
      'Commission_Fees',
      'VAT_Taxes',
      'General',
      'Privacy_Security',
      'Disputes_Conflict_Resolution',
      'Platform_Policies_Guidelines',
      'Technical_Support_Troubleshooting',
      'Community_Support',
      'Pricing_Fees',
      'Payments_Withdrawals',
      'Client_Services',
      'Service_Pricing',
      'Quality_Standards',
      'Freelancer',
      'Account_Management',
      'Refund_Policy',
      'Intellectual_Property',
      'Project_Management',
      'Feedback',
      'Support',
      'Clients'
    ]
  },
  question: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  answer: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

faqSchema.index({ category: 1, isActive: 1, order: 1 });
faqSchema.index({ question: 'text', answer: 'text' });

faqSchema.virtual('categoryDisplay').get(function() {
  return this.category.replace(/_/g, ' & ');
});

faqSchema.statics.getCategories = function() {
  return this.schema.path('category').enumValues.map(cat => ({
    value: cat,
    display: cat.replace(/_/g, ' & ')
  }));
};

faqSchema.statics.getByCategory = function(category, activeOnly = true) {
  const query = { category };
  if (activeOnly) query.isActive = true;
  return this.find(query).sort({ order: 1, createdAt: -1 });
};

faqSchema.methods.toAPIResponse = function() {
  return {
    id: this._id,
    category: this.category,
    categoryDisplay: this.categoryDisplay,
    question: this.question,
    answer: this.answer,
    isActive: this.isActive,
    order: this.order,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

module.exports = mongoose.model('FAQ', faqSchema);
