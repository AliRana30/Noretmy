const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    conversationId: { type: String, required: true },
    userId: { type: String, required: true },
    desc: { type: String, required: false }, // Made optional for file-only messages
    
    messageType: { 
        type: String, 
        enum: ['text', 'file', 'order_invitation', 'order_accepted', 'order_rejected', 'order_update', 'milestone_update', 'payment_update', 'system'],
        default: 'text' 
    },
    
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
    
    attachmentCount: { type: Number, default: 0 },
    
    isRead: { type: Boolean, default: false },
    
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date }

}, {
    timestamps: true
});

messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ orderId: 1 });
messageSchema.index({ userId: 1 });
messageSchema.index({ messageType: 1 });

module.exports = mongoose.model('Message', messageSchema);
