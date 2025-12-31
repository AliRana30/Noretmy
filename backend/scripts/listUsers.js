/**
 * Script to list all users in the database
 * Usage: node scripts/listUsers.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const listUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGO);
    console.log('Connected to MongoDB\n');

    const users = await User.find({}, 'email fullName username role isSeller isVerified').lean();
    
    console.log('=== ALL USERS ===');
    console.log(`Total users: ${users.length}\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.fullName || 'No Name'}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Role: ${user.role || 'undefined'}`);
      console.log(`   isSeller: ${user.isSeller}`);
      console.log(`   Verified: ${user.isVerified}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

listUsers();
