require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

async function verifyAllUsers() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB!\n');

    const unverifiedUsers = await User.find({ isVerified: false });
    
    console.log(`📋 Found ${unverifiedUsers.length} unverified users`);

    if (unverifiedUsers.length === 0) {
      console.log('✅ All users are already verified!');
      process.exit(0);
    }

    console.log('\n🔓 Verifying all users...\n');

    for (const user of unverifiedUsers) {
      user.isVerified = true;
      user.verificationToken = undefined;
      user.verificationTokenExpiry = undefined;
      await user.save();
      console.log(`✅ Verified: ${user.email} (${user.fullName})`);
    }

    console.log(`\n✨ Successfully verified ${unverifiedUsers.length} users!`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed.');
    process.exit(0);
  }
}

verifyAllUsers();
