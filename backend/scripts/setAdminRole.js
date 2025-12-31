/**
 * Script to set a user's role to admin in the database
 * 
 * Usage: node scripts/setAdminRole.js <email>
 * Example: node scripts/setAdminRole.js admin@example.com
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const setAdminRole = async (email) => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGO);
    console.log('Connected to MongoDB');

    // Find user by email
    const user = await User.findOne({ email: email });
    
    if (!user) {
      console.error(`❌ User with email "${email}" not found.`);
      process.exit(1);
    }

    console.log(`Found user: ${user.fullName} (${user.email})`);
    console.log(`Current role: ${user.role}`);

    // Update role to admin and add all permissions
    user.role = 'admin';
    user.permissions = [
      'user_management',
      'order_management',
      'payment_management',
      'system_settings',
      'analytics_view',
      'content_moderation',
      'seller_management',
      'promotion_management'
    ];

    // Save without triggering password hashing (password not modified)
    await user.save();

    console.log(`✅ Successfully updated user role to admin!`);
    console.log(`New role: ${user.role}`);
    console.log(`Permissions: ${user.permissions.join(', ')}`);
    
    // Also update via updateOne to be sure
    await User.updateOne(
      { _id: user._id },
      { 
        $set: { 
          role: 'admin',
          permissions: user.permissions
        }
      }
    );
    
    console.log('\n✅ Database updated successfully!');
    console.log('Please log out and log back in to the admin panel to apply changes.');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
};

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.log('Usage: node scripts/setAdminRole.js <email>');
  console.log('Example: node scripts/setAdminRole.js admin@example.com');
  process.exit(1);
}

setAdminRole(email);
