const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    deliveryDate: { type: Date, required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', "started", 'delivered', 'requestedRevision', 'approved'], default: 'pending' },
    statusHistory: {
      type: [
          {
              status: { type: String, default: "pending" },
              changedAt: { type: Date, default: Date.now },
              reason: { type: String },
              deliveryDescription: { type: String },
              attachmentUrls: { type: Array }
          }
      ],
      default: [
          { status: "pending" }
      ]
  }
  }, {
    timestamps: true
  });

const timelineEventSchema = new mongoose.Schema({
    event: { type: String, required: true },
    description: { type: String },
    timestamp: { type: Date, default: Date.now },
    actor: { type: String, enum: ['buyer', 'seller', 'system'], default: 'system' }
});
  
const orderSchema = new mongoose.Schema({
   gigId: { type: String, required: true },
   price: { type: Number, required: true },
   feeAndTax: { type: Number, required: true },
   sellerId: { type: String, required: true },
   buyerId: { type: String, required: true },
   status: { 
     type: String, 
     default: 'pending',
     enum: [
       'pending',           // Order created, waiting for seller to accept
       'accepted',          // Seller accepted the order
       'requirementsSubmitted', // Buyer submitted requirements
       'started',           // Seller started working
       'halfwayDone',       // 50% progress
       'delivered',         // Seller delivered the work
       'requestedRevision', // Buyer requested changes  
       'waitingReview',     // Work accepted, waiting for review
       'readyForPayment',   // Work completed, payment required
       'completed',         // Order fully completed with payment
       'cancelled',         // Order cancelled
       'disputed'           // Order in dispute
     ]
   },
   
   isInvitation: { type: Boolean, default: false },
   invitationStatus: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
   invitationMessage: { type: String, required: false },
   selectedPlanTitle: { type: String, required: false },
   selectedPlanDeliveryTime: { type: String, required: false },
   rejectionReason: { type: String, required: false },
   
   orderRequirements: { type: String, required: false },
   attachments: [{ type: String, required: false }],
   
   paymentMethod: { type: String, required: false },
   amount_received: { type: Number, required: false },
   last_payment_error: { type: String, required: false },
   isCompleted: { type: Boolean, default: false }, // payment completion status
   isPaid: { type: Boolean, default: false }, // Track if payment is done
   payment_intent: { type: String, required: false },
   
   baseAmount: { type: Number, required: false }, // Price before VAT
   vatRate: { type: Number, default: 0 }, // VAT rate as decimal (e.g., 0.20 for 20%)
   vatAmount: { type: Number, default: 0 }, // Calculated VAT amount
   platformFee: { type: Number, default: 0 }, // Platform fee amount
   platformFeeRate: { type: Number, default: 0.05 }, // Platform fee rate (5%)
   totalAmount: { type: Number, required: false }, // Total including VAT and fees
   currency: { type: String, default: 'EUR' },
   clientCountry: { type: String, required: false }, // Country for VAT calculation
   vatCollected: { type: Boolean, default: false }, // Whether VAT was collected
   reverseChargeApplied: { type: Boolean, default: false }, // B2B reverse charge
   reverseChargeNote: { type: String, required: false }, // Reverse charge legal note
   clientVatId: { type: String, required: false }, // Client's VAT ID for B2B
   vatLockedAt: { type: Date, required: false }, // When VAT was locked after payment
   paymentProvider: { type: String, default: 'stripe' }, // stripe, paypal, etc.
   paymentStatus: { type: String, enum: ['pending', 'processing', 'completed', 'failed', 'refunded'], default: 'pending' },
   
   paymentMilestoneStage: {
     type: String,
     enum: ['order_placed', 'accepted', 'in_escrow', 'delivered', 'reviewed', 'completed', 'cancelled', 'refunded', 'disputed'],
     default: 'order_placed'
   },
   escrowStatus: {
     type: String,
     enum: ['none', 'partial', 'full', 'released', 'refunded'],
     default: 'none'
   },
   paymentBreakdown: {
     authorizedAmount: { type: Number, default: 0 },    // 10% on accept
     escrowAmount: { type: Number, default: 0 },        // 50% captured
     deliveryAmount: { type: Number, default: 0 },      // 20% on delivery
     reviewAmount: { type: Number, default: 0 },        // 20% on review
     totalReleasedAmount: { type: Number, default: 0 }, // Total released to freelancer
     pendingReleaseAmount: { type: Number, default: 0 } // Pending release
   },
   stripeChargeId: { type: String, required: false },
   stripeTransferId: { type: String, required: false },
   escrowLockedAt: { type: Date, required: false },
   fundsReleasedAt: { type: Date, required: false },
   
   invoiceId: { type: String, required: false },
   invoiceGenerated: { type: Boolean, default: false },
   invoiceGeneratedAt: { type: Date, required: false },
   
   isMilestone: { type: Boolean, default: false },
   milestones: { type: [milestoneSchema], default: [] },
   type: { type: String, required: true, enum: ['simple', 'milestone', 'custom'] },
   
   deliveryDescription: { type: String, required: false },
   deliveryAttachments: [{ type: String, required: false }],
   revisionReason: { type: String, required: false },
   deliveryDate: { type: Date, required: false },
    timeline: { type: [timelineEventSchema], default: [] },

    autoDeadlineExtended: { type: Boolean, default: false },
    
   orderCompletionDate: { type: Date, required: false },
   deadlineMet: { type: Boolean, required: false },
   completionTime: { type: Number, required: false }, // in days
   
   progress: { type: Number, default: 0, min: 0, max: 100 },
   
   isReviewed: { type: Boolean, default: false },
   reviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reviews', required: false },
   
   statusHistory: {
     type: [
         {
             status: { type: String, default: "pending" },
             changedAt: { type: Date, default: Date.now },
             reason: { type: String, required: false },
             deliveryDescription: { type: String, required: false },
             deliveryAttachments: { type: Array, required: false },
         }
     ],
     default: [
         { status: "pending" }
     ]
   }
   
}, {
    timestamps: true
});

orderSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    const statusProgressMap = {
      'pending': 0,
      'accepted': 20,
      'started': 40,
      'halfwayDone': 60,
      'delivered': 70,
      'waitingReview': 90,
      'completed': 100,
      'cancelled': 0,
      'disputed': 0
    };
    
    if (statusProgressMap[this.status] !== undefined) {
      this.progress = statusProgressMap[this.status];
    }
  }
  next();
});

orderSchema.methods.addTimelineEvent = function(event, description = '', actor = 'system') {
  this.timeline.push({
    event,
    description,
    timestamp: new Date(),
    actor
  });
};

orderSchema.methods.calculateCompletionStats = function() {
  if (this.orderCompletionDate && this.createdAt) {
    const diffTime = this.orderCompletionDate - this.createdAt;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    this.completionTime = diffDays;
    
    if (this.deliveryDate) {
      this.deadlineMet = this.orderCompletionDate <= this.deliveryDate;
    }
  }
};

module.exports = mongoose.model('Order', orderSchema);
