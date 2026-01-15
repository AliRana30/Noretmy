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

router.post('/create', createNotification);

router.get('/', verifyToken, getUserNotifications);

router.get('/unread-count', verifyToken, getUnreadNotificationCount);

router.put('/:notificationId/read', verifyToken, markNotificationAsRead);

router.put('/mark-all-read', verifyToken, markAllNotificationsAsRead);

router.delete('/:notificationId', verifyToken, deleteNotification);

router.delete('/', verifyToken, deleteAllUserNotifications);

module.exports = router;
