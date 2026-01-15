/**
 * Script to clean up gigs without photos and update ratings
 * Run with: node scripts/cleanupGigs.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Job = require('../models/Job');

async function cleanupGigs() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const gigsWithoutPhotos = await Job.find({
      $or: [
        { photos: { $exists: false } },
        { photos: { $size: 0 } },
        { photos: null }
      ]
    }).limit(5);

    if (gigsWithoutPhotos.length > 0) {
      const idsToDelete = gigsWithoutPhotos.map(gig => gig._id);
      const deleteResult = await Job.deleteMany({ _id: { $in: idsToDelete } });
      }

    const gigsToUpdate = await Job.find({
      $or: [
        { totalStars: { $lt: 5 } },
        { starNumber: { $lt: 1 } }
      ]
    });

    for (const gig of gigsToUpdate) {
      const randomStars = Math.floor(Math.random() * (50 - 45 + 1)) + 45; // 45-50 total stars (for 10 reviews average of 4.5-5)
      const numReviews = Math.floor(Math.random() * 10) + 5; // 5-15 reviews
      
      gig.totalStars = randomStars;
      gig.starNumber = numReviews;
      
      await gig.save();
      }

    } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await mongoose.disconnect();
    }
}

cleanupGigs();
