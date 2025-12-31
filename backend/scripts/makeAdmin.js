/**
 * Script to update a user's role to admin
 * Run with: node scripts/makeAdmin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const EMAIL_TO_MAKE_ADMIN = 'alimahmoodrana82@gmail.com';

// All available admin permissions
const ALL_ADMIN_PERMISSIONS = [
  'user_management',
  'order_management', 
  'payment_management',
  'system_settings',
  'analytics_view',
  'content_moderation',
  'seller_management',
  'promotion_management'
];

async function makeUserAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Find the user
    const user = await User.findOne({ email: EMAIL_TO_MAKE_ADMIN });

    if (!user) {
      console.log(`❌ User with email ${EMAIL_TO_MAKE_ADMIN} not found`);
      process.exit(1);
    }

    console.log(`\n📋 Current user details:`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Full Name: ${user.fullName}`);
    console.log(`   Current Role: ${user.role}`);
    console.log(`   Current Permissions: ${user.permissions?.join(', ') || 'None'}`);

    // Update user to admin
    user.role = 'admin';
    user.permissions = ALL_ADMIN_PERMISSIONS;
    
    // Save without triggering password rehash
    await User.updateOne(
      { _id: user._id },
      { 
        $set: { 
          role: 'admin',
          permissions: ALL_ADMIN_PERMISSIONS 
        }
      }
    );

    console.log(`\n✅ User successfully updated to admin!`);
    console.log(`   New Role: admin`);
    console.log(`   Permissions: ${ALL_ADMIN_PERMISSIONS.join(', ')}`);
    
    // Verify the update
    const updatedUser = await User.findOne({ email: EMAIL_TO_MAKE_ADMIN });
    console.log(`\n📋 Verified user details:`);
    console.log(`   Role: ${updatedUser.role}`);
    console.log(`   Permissions: ${updatedUser.permissions?.join(', ')}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

makeUserAdmin();
