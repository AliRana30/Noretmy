const express = require('express');
const { 
    createNotification, 
    getUserNotifications, 
    getUnreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    deleteAllUserNotifications
} = require('../controllers/notificationController');
const { verifyToken } = require('../middleware/jwt');

const router = express.Router();

// Route to create a notification (for all users or a single user)
router.post('/create', createNotification);

// Route to get all notifications for a specific user
router.get('/', verifyToken, getUserNotifications);

// Route to get unread notification count
router.get('/unread-count', verifyToken, getUnreadNotificationCount);

// Route to mark a single notification as read
router.put('/:notificationId/read', verifyToken, markNotificationAsRead);

// Route to mark all notifications as read
router.put('/mark-all-read', verifyToken, markAllNotificationsAsRead);

// Route to delete a single notification
router.delete('/:notificationId', verifyToken, deleteNotification);

// Route to delete all user's notifications
router.delete('/', verifyToken, deleteAllUserNotifications);

module.exports = router;
