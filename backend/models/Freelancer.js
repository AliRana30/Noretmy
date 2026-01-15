const mongoose = require('mongoose');

const freelancerSchema = new mongoose.Schema({
   userId: {
       type: mongoose.Schema.Types.ObjectId,
       ref: 'User', 
       required: true
     }, 
    email: {
        type: String,
        unique: true,
        required:false
    },
    onboardingStatus :{
        type  : String ,
        required: true
    },
    withdrawalMethod  : {
        type  : String,
        required  : true,
    },
    stripeAccountId: {
        type: String,
        required: false,
    },
    availableBalance: {
        type: Number,
        default: 0,
    },
    revenue: {
        total: { type: Number, default: 0 },           // Total lifetime earnings
        pending: { type: Number, default: 0 },         // In escrow, not yet released
        available: { type: Number, default: 0 },       // Available for withdrawal
        withdrawn: { type: Number, default: 0 },       // Already withdrawn
        inTransit: { type: Number, default: 0 }        // Withdrawal in progress
    },
    monthlyEarnings: [{
        month: { type: String },  // Format: "2025-01"
        amount: { type: Number, default: 0 },
        ordersCompleted: { type: Number, default: 0 }
    }],
    payouts: [{
        amount: { type: Number },
        stripePayoutId: { type: String },
        status: { type: String, enum: ['pending', 'in_transit', 'paid', 'failed', 'cancelled'] },
        method: { type: String },
        initiatedAt: { type: Date },
        completedAt: { type: Date },
        failureReason: { type: String }
    }],
    payoutAccountVerified: { type: Boolean, default: false },
    payoutAccountLast4: { type: String },
    payoutAccountType: { type: String } // 'bank_account', 'card', 'paypal'
});

freelancerSchema.index({ userId: 1 });
freelancerSchema.index({ email: 1 });
freelancerSchema.index({ stripeAccountId: 1 });

freelancerSchema.methods.addEarnings = async function(amount, orderId) {
    this.revenue.pending += amount;
    this.revenue.total += amount;
    
    const currentMonth = new Date().toISOString().slice(0, 7); // "2025-01"
    const monthEntry = this.monthlyEarnings.find(e => e.month === currentMonth);
    if (monthEntry) {
        monthEntry.amount += amount;
        monthEntry.ordersCompleted += 1;
    } else {
        this.monthlyEarnings.push({
            month: currentMonth,
            amount,
            ordersCompleted: 1
        });
    }
    
    return this.save();
};

freelancerSchema.methods.releaseEarnings = async function(amount) {
    if (this.revenue.pending < amount) {
        throw new Error('Insufficient pending balance');
    }
    this.revenue.pending -= amount;
    this.revenue.available += amount;
    this.availableBalance = this.revenue.available; // Sync legacy field
    return this.save();
};

freelancerSchema.methods.processWithdrawal = async function(amount, payoutId, method) {
    if (this.revenue.available < amount) {
        throw new Error('Insufficient available balance');
    }
    this.revenue.available -= amount;
    this.revenue.inTransit += amount;
    this.availableBalance = this.revenue.available;
    
    this.payouts.push({
        amount,
        stripePayoutId: payoutId,
        status: 'pending',
        method,
        initiatedAt: new Date()
    });
    
    return this.save();
};

const Freelancer = mongoose.model('Freelancer', freelancerSchema);
module.exports = Freelancer;
