const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

async function checkAndFixUserRole(email) {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find the user
    const user = await User.findOne({ email });

    
    if (!user) {
      console.error(`❌ User with email "${email}" not found`);
      process.exit(1);
    }

    console.log('\n=== Current User Info ===');
    console.log(`Email: ${user.email}`);
    console.log(`Full Name: ${user.fullName}`);
    console.log(`Username: ${user.username}`);
    console.log(`Role: ${user.role}`);
    console.log(`isSeller: ${user.isSeller}`);
    console.log(`isVerified: ${user.isVerified}`);
    console.log(`isBlocked: ${user.isBlocked}`);

    // Check if user needs to be fixed
    if (user.role !== 'freelancer' && user.isSeller !== true) {
      console.log('\n⚠️  User is not set as a freelancer/seller');
      console.log('Fixing user role...\n');
      
      user.role = 'freelancer';
      user.isSeller = true;
      await user.save();
      
      console.log('✅ User role updated successfully!');
      console.log(`New Role: ${user.role}`);
      console.log(`New isSeller: ${user.isSeller}`);
    } else {
      console.log('\n✅ User role is already correct!');
    }

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.log('Usage: node checkUserRole.js <email>');
  console.log('Example: node checkUserRole.js user@example.com');
  process.exit(1);
}

checkAndFixUserRole(email);
