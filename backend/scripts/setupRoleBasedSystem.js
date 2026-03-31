const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

const setupRoleBasedSystem = async () => {
  try {
    const usersToUpdate = await User.find({
      $or: [
        { role: { $exists: false } },
        { role: null }
      ]
    });

    for (const user of usersToUpdate) {
      let newRole = 'client'; // default
      if (user.isSeller === true) {
        newRole = 'freelancer';
      }

      await User.findByIdAndUpdate(user._id, {
        role: newRole,
        permissions: [] // Empty permissions for regular users
      });

      }


    const roleStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    roleStats.forEach(stat => {
      });

    const usersWithoutRole = await User.countDocuments({ 
      $or: [
        { role: { $exists: false } },
        { role: null }
      ]
    });

    const adminCount = await User.countDocuments({ role: 'admin' });
    const verificationIssues = await User.countDocuments({ 
      role: { $ne: 'admin' },
      isVerified: false 
    });

    if (usersWithoutRole === 0 && adminCount > 0) {
      } else {
      }

    } catch (error) {
    console.error('❌ Error during role-based system setup:', error);
    throw error;
  }
};

const main = async () => {
  await connectDB();
  
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    if (command === 'setup') {
      await setupRoleBasedSystem();
    }
  } catch (error) {
    console.error('❌ Script execution failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    }
};

if (require.main === module) {
  main();
}

module.exports = {
  setupRoleBasedSystem
}; 