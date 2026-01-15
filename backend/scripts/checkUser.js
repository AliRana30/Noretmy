/**
 * Script to check user details
 * Usage: node scripts/checkUser.js <email>
 */

const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const checkUser = async () => {
  const email = process.argv[2];
  
  if (!email) {
    console.error('Usage: node scripts/checkUser.js <email>');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOne({ email: email });

    if (!user) {
      console.error(`User with email ${email} not found`);
      
      const allUsers = await User.find({}).select('email fullName role').limit(10);
      allUsers.forEach(u => {
        });
      
      process.exit(1);
    }

    } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

checkUser();
