const express = require('express');
const { verifyToken } = require('../middleware/jwt');
const { getAgoraToken } = require('../controllers/videoController');
const router = express.Router();

router.post('/token', verifyToken, getAgoraToken);

module.exports = router; 