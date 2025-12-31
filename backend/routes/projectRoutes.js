const express = require('express');
const router = express.Router();
const {createProject, getProjectsByUser, updateProject, deleteProject} = require("../controllers/projectController");
const { verifyToken, checkRole } = require('../middleware/jwt');
const { upload } = require('../controllers/uploadController');

router.post('/',verifyToken,upload, createProject);
router.get('/',verifyToken,getProjectsByUser);
router.put('/:id',verifyToken,upload, updateProject);
router.delete('/:id',verifyToken,deleteProject);

module.exports = router;
