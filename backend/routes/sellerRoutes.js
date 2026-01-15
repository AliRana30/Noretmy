const express = require('express');
const router = express.Router();
const { getSellerStats,editProject,createProject,deleteProject} = require('../controllers/sellerController'); // Import the controller
const { verifyToken, checkRole } = require('../middleware/jwt');
const { upload } = require('../controllers/uploadController');

router.get('/stats', verifyToken,checkRole(["seller"]),getSellerStats); // :sellerId is a dynamic parameter
router.post('/project',verifyToken, upload, createProject)
router.put('/:projectId', verifyToken,checkRole(['seller']), upload, editProject);

router.delete('/:projectId', verifyToken,checkRole(['seller']), deleteProject);

module.exports = router;
