const Notification = require('../models/Notification');
const User = require('../models/User');

// Create Notification (For All Users OR Single User)
const createNotification = async (req, res) => {
    try {
        const { userId, type, message, link, isGlobal } = req.body;

        // Validate required fields
        if (!type || !message) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Create Notification Object
        const notificationData = {
            userId: isGlobal ? null : userId, 
            type,
            message,
            link,
            isGlobal: !!isGlobal // Ensure it's a boolean
        };

        // If userId is required for user-specific notifications
        if (!isGlobal && !userId) {
            return res.status(400).json({ error: "userId is required for user-specific notifications" });
        }

        // Save Notification
        await Notification.create(notificationData);

        return res.status(201).json({ message: "Notification sent successfully" });
    } catch (error) {
        console.error("Error creating notification:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

// Get All Notifications for a Specific User
const getUserNotifications = async (req, res) => {
    try {
        const { userId } = req;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const notifications = await Notification.find({
            $or: [
                { userId },   // User-specific notifications
                { isGlobal: true } // Global notifications
            ]
        }).sort({ createdAt: -1 });

        return res.status(200).json({ notifications });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Get Unread Notification Count
const getUnreadNotificationCount = async (req, res) => {
    try {
        const { userId } = req;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const count = await Notification.countDocuments({
            $or: [
                { userId, isRead: false },   // User-specific unread notifications
                { isGlobal: true, isRead: false } // Global unread notifications
            ]
        });

        return res.status(200).json({ count });
    } catch (error) {
        console.error('Error counting unread notifications:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Mark a single notification as read
const markNotificationAsRead = async (req, res) => {
    try {
        const { userId } = req;
        const { notificationId } = req.params;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!notificationId) {
            return res.status(400).json({ error: 'Notification ID is required' });
        }

        const notification = await Notification.findById(notificationId);

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        // Check ownership - user can only mark their own notifications or global ones
        if (!notification.isGlobal && notification.userId && notification.userId.toString() !== userId.toString()) {
            return res.status(403).json({ error: 'You can only mark your own notifications as read' });
        }

        notification.isRead = true;
        await notification.save();

        return res.status(200).json({ 
            success: true, 
            message: 'Notification marked as read',
            notification 
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Mark all notifications as read for a user
const markAllNotificationsAsRead = async (req, res) => {
    try {
        const { userId } = req;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Update all user-specific and global unread notifications
        const result = await Notification.updateMany(
            {
                $or: [
                    { userId, isRead: false },
                    { isGlobal: true, isRead: false }
                ]
            },
            { $set: { isRead: true } }
        );

        return res.status(200).json({ 
            success: true, 
            message: 'All notifications marked as read',
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Delete a single notification
const deleteNotification = async (req, res) => {
    try {
        const { userId, userRole, user } = req;
        const { notificationId } = req.params;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!notificationId) {
            return res.status(400).json({ error: 'Notification ID is required' });
        }

        const notification = await Notification.findById(notificationId);

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        // Admins can delete any notification
        // Check multiple sources for admin role
        const isAdmin = userRole === 'admin' || user?.role === 'admin' || req.isAdmin === true;
        
        if (!isAdmin) {
            // Non-admins can only delete their own notifications
            // Global notifications can't be deleted by regular users
            if (notification.isGlobal) {
                return res.status(403).json({ error: 'Cannot delete global notifications' });
            }

            if (notification.userId && notification.userId.toString() !== userId.toString()) {
                return res.status(403).json({ error: 'You can only delete your own notifications' });
            }
        }

        await Notification.findByIdAndDelete(notificationId);

        return res.status(200).json({ 
            success: true, 
            message: 'Notification deleted successfully' 
        });
    } catch (error) {
        console.error('Error deleting notification:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Delete all user's notifications (not global ones)
const deleteAllUserNotifications = async (req, res) => {
    try {
        const { userId } = req;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const result = await Notification.deleteMany({
            userId,
            isGlobal: false
        });

        return res.status(200).json({ 
            success: true, 
            message: 'All notifications deleted successfully',
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('Error deleting all notifications:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    createNotification,
    getUserNotifications,
    getUnreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    deleteAllUserNotifications
};
