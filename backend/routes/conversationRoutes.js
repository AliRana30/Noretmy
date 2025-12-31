const express = require('express');
const router = express.Router();
const {
  createConverstion,
  getConverstion,
  getConverstions,
  updateConverstion,
  getConversationBySellerandBuyerIds,
} = require('../controllers/conversationController');
const { verifyToken } = require('../middleware/jwt');

router.get("/user/single/:sellerId/:buyerId", verifyToken, getConversationBySellerandBuyerIds);

router.get("/", verifyToken, getConverstions);

router.get("/single/:id", verifyToken, getConverstion);

router.post("/", verifyToken, createConverstion);

router.put("/:id", verifyToken, updateConverstion);

module.exports = router;
