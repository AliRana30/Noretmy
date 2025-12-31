const express = require("express");
const router = express.Router();
const { deleteUser, getTotalUsers, getAllUsers, warnUser, blockUser, getVerifiedSellers, createOrUpdateProfile, updateSingleAttribute, getSellerData, getUserWithProjects, getFavorites, addToFavorites, removeFromFavorites, toggleFavorite, checkFavorite, searchFreelancers, getFreelancerProfile, getClientProfile } = require("../controllers/userController");
const {verifyToken, requireAdmin, verifyTokenEnhanced}=require("../middleware/jwt");
const { upload } = require("../controllers/uploadController");

// Public routes
router.get('/search/freelancers', searchFreelancers);
router.get('/freelancer/:username', getFreelancerProfile);
router.get('/client/:userId', verifyToken, getClientProfile);
// Verified sellers - requires auth for role-aware filtering
router.get('/verified-sellers', verifyTokenEnhanced, getVerifiedSellers);
router.get('/profile/portfolio/:username',getUserWithProjects)

// Admin protected routes
router.get('/', verifyToken, ...requireAdmin, getAllUsers);
router.get("/total-users", verifyToken, ...requireAdmin, getTotalUsers);
router.put('/warn/:userId', verifyToken, ...requireAdmin, warnUser);
router.put('/block/:userId', verifyToken, ...requireAdmin, blockUser);
router.delete("/delete/:id", verifyToken, ...requireAdmin, deleteUser);

// User protected routes
router.post('/profile', verifyToken, createOrUpdateProfile);
router.put('/profile/',verifyToken, upload,updateSingleAttribute);
router.get('/profile/seller',verifyToken, getSellerData);

// Favorites routes
router.get('/favorites', verifyToken, getFavorites);
router.post('/favorites', verifyToken, addToFavorites);
router.delete('/favorites/:gigId', verifyToken, removeFromFavorites);
router.post('/favorites/toggle', verifyToken, toggleFavorite);
router.get('/favorites/check/:gigId', verifyToken, checkFavorite);

module.exports=router
