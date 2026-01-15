const mongoose = require('mongoose');
const User = require('../models/User');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

const saveUserToDatabase = async (user) => {
  const newUser = new User(user);
  await newUser.save();
  return newUser;
};

const findUserByEmail = async (email) => {
  return await User.findOne({ email });
};

const findUserByToken = async (token) => {
  return await User.findOne({ verificationToken: token });
};

const verifyUser = async (email) => {
  return await User.updateOne({ email }, { $set: { isVerified: true }, $unset: { verificationToken: '' } });
};

module.exports = {
  connectDB,
  saveUserToDatabase,
  findUserByEmail,
  findUserByToken,
  verifyUser,
};
