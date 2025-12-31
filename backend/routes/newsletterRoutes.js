const express = require('express');
const router = express.Router();
const { subscribe, subscribeOrUpdate, getPreferencesByUserId } = require('../controllers/newsletterController');
const { verifyToken } = require('../middleware/jwt');

// Public route - newsletter signup without login
router.post("/", subscribe);

// Protected routes
router.put("/edit",verifyToken,subscribeOrUpdate)
router.get("/",verifyToken,getPreferencesByUserId)


module.exports = router;
