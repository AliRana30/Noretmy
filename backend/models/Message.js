// models/Message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    conversationId: { type: String, required: true },
    userId: { type: String, required: true },
    desc: { type: String, required: false }, // Made optional for file-only messages
    
    // Message type - can be 'text', 'order_invitation', 'order_accepted', 'order_rejected', 'order_update', 'system', 'file'
    messageType: { 
        type: String, 
        enum: ['text', 'file', 'order_invitation', 'order_accepted', 'order_rejected', 'order_update', 'milestone_update', 'payment_update', 'system'],
        default: 'text' 
    },
    
    // Order-related fields (for order messages)
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: false },
    orderData: {
        gigTitle: { type: String, required: false },
        gigImage: { type: String, required: false },
        planTitle: { type: String, required: false },
        price: { type: Number, required: false },
        deliveryTime: { type: String, required: false },
        status: { type: String, required: false },
        invitationStatus: { type: String, required: false }
    },
    
    // Enhanced Attachments for file sharing
    attachments: [{
        _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
        url: { type: String, required: true },
        thumbnailUrl: { type: String },
        type: { type: String, enum: ['image', 'document', 'archive', 'video', 'audio', 'other'], required: true },
        name: { type: String, required: true },
        originalName: { type: String, required: true },
        mimeType: { type: String, required: true },
        size: { type: Number, required: true },
        publicId: { type: String }, // For Cloudinary
        s3Key: { type: String }, // For S3
        dimensions: {
            width: { type: Number },
            height: { type: Number }
        }
    }],
    
    // File count for quick reference
    attachmentCount: { type: Number, default: 0 },
    
    // For tracking if message is read
    isRead: { type: Boolean, default: false },
    
    // For deleted messages
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date }

}, {
    timestamps: true
});

// Index for faster queries
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ orderId: 1 });
messageSchema.index({ userId: 1 });
messageSchema.index({ messageType: 1 });

module.exports = mongoose.model('Message', messageSchema);
