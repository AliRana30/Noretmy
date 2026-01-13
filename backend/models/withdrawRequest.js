const mongoose = require('mongoose');

const withdrawRequestSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
    amount: { type: Number, required: true },
    withdrawalMethod: {
        type: String,
        default: null,
    },
    payoutEmail: {
        type: String,
        default: null,
    },
    status: { 
        type: String, 
        enum: ['pending', 'approved', 'rejected'], 
        default: 'pending',
    },
    createdAt: { type: Date, default: Date.now  },
});

module.exports = mongoose.model('WithdrawRequest', withdrawRequestSchema);
