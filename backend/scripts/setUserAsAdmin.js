/**
 * Script to set a user as admin
 * Usage: node scripts/setUserAsAdmin.js <email>
 */

const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const setUserAsAdmin = async () => {
  const email = process.argv[2];
  
  if (!email) {
    console.error('Usage: node scripts/setUserAsAdmin.js <email>');
    process.exit(1);
  }

  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to database');

    // Find and update user (case-insensitive email search)
    const user = await User.findOneAndUpdate(
      { email: { $regex: new RegExp(`^${email}$`, 'i') } },
      { 
        role: 'admin',
        isVerified: true,
        isBlocked: false,
        permissions: [
          'user_management',
          'order_management', 
          'payment_management',
          'system_settings',
          'analytics_view',
          'content_moderation',
          'seller_management',
          'promotion_management'
        ]
      },
      { new: true }
    );

    if (!user) {
      console.error(`User with email ${email} not found`);
      process.exit(1);
    }

    console.log(`Successfully set ${user.fullName} (${user.email}) as admin`);
    console.log('User details:', {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      permissions: user.permissions
    });

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
};

setUserAsAdmin();
