// routes/jobRoutes.js
const express = require('express');
const multer = require('multer');
const { storage } = require('../config/cloudinaryConfig');
const { createJob ,getAllJobs,getFeaturedJobs, getUserJobs,getGigDetailsController, deleteJob, applyDiscountToGig, editJob} = require('../controllers/jobController');
const { verifyToken, checkRole } = require('../middleware/jwt');
const { upload } = require('../controllers/uploadController');


const router = express.Router();

router.get("/single/:id", getGigDetailsController); // Single job details
router.get("/feature", getFeaturedJobs);            // Featured jobs

router.get("/user", verifyToken, getUserJobs);      

router.get("/", getAllJobs);    



// Post and delete routes at the end
router.post("/add-job", verifyToken,checkRole(["seller"]),upload, createJob); 
router.put("/discount",verifyToken,checkRole(["seller"]),applyDiscountToGig); 
router.put("/:jobId",verifyToken,checkRole(["seller"]),editJob); 


router.delete("/:id", verifyToken,checkRole(["seller"]), deleteJob); 



module.exports = router;
