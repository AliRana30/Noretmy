const express = require('express');
const { verifyToken, requireAdmin } = require('../middleware/jwt');
const { createMessage, getMessages, searchSensitiveMessages, markMessagesAsRead } = require('../controllers/messageController');

const router = express.Router();


router.get('/sensitive-messages', verifyToken, ...requireAdmin, searchSensitiveMessages);

router.post('/', verifyToken, createMessage);
router.get('/:id', verifyToken, getMessages);
router.put('/mark-read', verifyToken, markMessagesAsRead);

module.exports = router;

