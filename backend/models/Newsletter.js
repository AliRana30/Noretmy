const mongoose = require('mongoose');

const subscriberSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [/\S+@\S+\.\S+/, 'is invalid'],
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null, // Null for guest subscribers
  },
  frequency: {
    type: Number,
    enum: [0, 1, 2, 3], // 0 = daily, 1 = weekly, 2 = monthly, 3 = none
    default: 1,
  },
  topics: {
    type: [Number], // topic IDs, e.g. [0, 2, 4]
    default: [],
    validate: {
      validator: (arr) => arr.every(num => [0,1,2,3,4].includes(num)),
      message: 'Invalid topic selected',
    }
  },
  receiveSpecialOffers: {
    type: Boolean,
    default: true,
  },

  isSubscribed : {
    type : Boolean,
    default : true
  }
}, { timestamps: true });

module.exports = mongoose.model('Subscriber', subscriberSchema);
