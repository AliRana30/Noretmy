const express = require('express');
const router = express.Router();
const {createProject, getProjectsByUser} = require("../controllers/projectController");
const { verifyToken, checkRole } = require('../middleware/jwt');
const { upload } = require('../controllers/uploadController');

// Route to get seller statistics by sellerId

router.post('/',verifyToken,upload, createProject);

router.get('/',verifyToken,getProjectsByUser)

module.exports = router;
