/**
 * Script to clean up gigs without photos and update ratings
 * Run with: node scripts/cleanupGigs.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Job = require('../models/Job');

async function cleanupGigs() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find gigs without photos (empty array or no photos field)
    const gigsWithoutPhotos = await Job.find({
      $or: [
        { photos: { $exists: false } },
        { photos: { $size: 0 } },
        { photos: null }
      ]
    }).limit(5);

    console.log(`Found ${gigsWithoutPhotos.length} gigs without photos`);

    if (gigsWithoutPhotos.length > 0) {
      const idsToDelete = gigsWithoutPhotos.map(gig => gig._id);
      console.log('Deleting gigs with IDs:', idsToDelete);

      const deleteResult = await Job.deleteMany({ _id: { $in: idsToDelete } });
      console.log(`Deleted ${deleteResult.deletedCount} gigs without photos`);
    }

    // Update ratings for gigs with less than 5 stars to have at least 5 stars
    const gigsToUpdate = await Job.find({
      $or: [
        { totalStars: { $lt: 5 } },
        { starNumber: { $lt: 1 } }
      ]
    });

    console.log(`Found ${gigsToUpdate.length} gigs with ratings to update`);

    for (const gig of gigsToUpdate) {
      // Generate random rating between 4.5 and 5.0
      const randomStars = Math.floor(Math.random() * (50 - 45 + 1)) + 45; // 45-50 total stars (for 10 reviews average of 4.5-5)
      const numReviews = Math.floor(Math.random() * 10) + 5; // 5-15 reviews
      
      gig.totalStars = randomStars;
      gig.starNumber = numReviews;
      
      await gig.save();
      console.log(`Updated gig ${gig._id}: ${gig.totalStars} stars from ${gig.starNumber} reviews (avg: ${(gig.totalStars / gig.starNumber).toFixed(1)})`);
    }

    console.log('\n✅ Cleanup complete!');
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

cleanupGigs();
