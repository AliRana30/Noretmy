const express = require('express');
const router = express.Router();
const {verifyToken} = require("../middleware/jwt")
const { upload, uploadImages ,uploadandVerifyImages} = require('../controllers/uploadController'); // Import both the upload middleware and the handler

router.post('/upload', upload, uploadImages);

router.post('/upload/verify',verifyToken,upload, uploadandVerifyImages)

module.exports = router;
