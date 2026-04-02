const mongoose = require('mongoose');

const deletedAccountLogSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
      unique: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },
    reason: {
      type: String,
      default: 'Deleted by admin',
    },
    deletedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DeletedAccountLog', deletedAccountLogSchema);