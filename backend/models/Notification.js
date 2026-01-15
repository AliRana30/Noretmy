const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: {
        type: String, 
        default: null
    },
    type: {
        type: String,
        enum: ['order', 'promotion', 'announcement', 'warning', 'system', 'alert', 'success', 'payment', 'withdrawal', 'message'],
        required: true
    },
    title: {
        type: String, // Notification title
        required: false
    },
    message: {
        type: String, // Notification content
        required: true
    },
    link: {
        type: String, 
        default: null
    },
    data: {
        type: mongoose.Schema.Types.Mixed, // Additional data
        default: {}
    },
    isRead: {
        type: Boolean,
        default: false
    },
    isGlobal: {
        type: Boolean, // If true, send to all users
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ isGlobal: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
