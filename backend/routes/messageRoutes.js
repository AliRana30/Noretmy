






const express = require('express');
const { verifyToken, requireAdmin } = require('../middleware/jwt');
const { createMessage, getMessages, searchSensitiveMessages, setSocketIO, markMessagesAsRead } = require('../controllers/messageController');

const router = express.Router();

const socketIO = require('socket.io');
const io = socketIO(); // Initialize with your HTTP server instance

setSocketIO(io); // Set Socket.IO instance for the controller


router.get('/sensitive-messages', verifyToken, ...requireAdmin, searchSensitiveMessages);

router.post('/', verifyToken, createMessage);
router.get('/:id', verifyToken, getMessages);
router.put('/mark-read', verifyToken, markMessagesAsRead);

module.exports = router;

