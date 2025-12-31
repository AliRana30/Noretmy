require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

async function updateUserRole() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB!');

    // Get email/username from command line argument
    const userIdentifier = process.argv[2];
    
    if (!userIdentifier) {
      console.log('❌ Please provide a username or email!');
      console.log('   Usage: node scripts/updateUserRole.js <email_or_username>');
      console.log('\n💡 Available users:');
      const allUsers = await User.find({}, 'email username role').limit(10);
      allUsers.forEach(u => {
        console.log(`   - ${u.username || 'N/A'} (${u.email}) - Role: ${u.role}`);
      });
      await mongoose.connection.close();
      return;
    }

    // Find user by email or username
    const user = await User.findOne({ 
      $or: [
        { email: userIdentifier },
        { username: userIdentifier }
      ]
    });

    if (!user) {
      console.log(`❌ User "${userIdentifier}" not found!`);
      console.log('\n💡 Available users:');
      const allUsers = await User.find({}, 'email username role').limit(10);
      allUsers.forEach(u => {
        console.log(`   - ${u.username || 'N/A'} (${u.email}) - Role: ${u.role}`);
      });
      
      await mongoose.connection.close();
      return;
    }

    console.log('\n📝 Current user details:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Current Role: ${user.role}`);
    console.log(`   Is Seller: ${user.isSeller}`);

    // Update role to admin
    user.role = 'admin';
    await user.save();

    console.log('\n✅ User role updated successfully!');
    console.log(`   New Role: ${user.role}`);

    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed.');
  } catch (error) {
    console.error('❌ Error updating user role:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

updateUserRole();
