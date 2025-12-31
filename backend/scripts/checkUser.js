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
    console.log('Connected to database');

    const user = await User.findOne({ email: email });

    if (!user) {
      console.error(`User with email ${email} not found`);
      
      // List all users to help find the correct email
      console.log('\nListing all users:');
      const allUsers = await User.find({}).select('email fullName role').limit(10);
      allUsers.forEach(u => {
        console.log(`  - ${u.email} (${u.fullName}) - role: ${u.role}`);
      });
      
      process.exit(1);
    }

    console.log('\nUser details:');
    console.log('  ID:', user._id);
    console.log('  Email:', user.email);
    console.log('  Full Name:', user.fullName);
    console.log('  Role:', user.role);
    console.log('  Is Verified:', user.isVerified);
    console.log('  Is Blocked:', user.isBlocked);
    console.log('  Permissions:', user.permissions);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

checkUser();
