const mongoose = require('mongoose');
const User = require('../models/User');

let isConnecting = false;

const connectDB = async () => {
  if (isConnecting) return;
  isConnecting = true;
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
    });
    console.log('MongoDB connected successfully');
    isConnecting = false;
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    isConnecting = false;
    setTimeout(() => {
      connectDB();
    }, 5000);
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected. Retrying connection...');
  connectDB();
});

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
