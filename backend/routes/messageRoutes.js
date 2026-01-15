






const express = require('express');
const { verifyToken, requireAdmin } = require('../middleware/jwt');
const { createMessage, getMessages, searchSensitiveMessages, setSocketIO } = require('../controllers/messageController');

const router = express.Router();

const socketIO = require('socket.io');
const io = socketIO(); // Initialize with your HTTP server instance

setSocketIO(io); // Set Socket.IO instance for the controller


router.get('/sensitive-messages', verifyToken, ...requireAdmin, searchSensitiveMessages);

router.post('/', verifyToken, createMessage);
router.get('/:id', verifyToken, getMessages);

module.exports = router;

