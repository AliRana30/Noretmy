const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['privacy-policy', 'terms-conditions', 'cookie-policy', 'legal-notice'],
    required: true,
    unique: true
  },
  content: {
    type: String,
    required: true,
    default: ''
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Content', contentSchema);
