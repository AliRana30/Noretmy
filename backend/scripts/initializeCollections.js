require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const User = require('../models/User');
const Job = require('../models/Job');
const UserProfile = require('../models/UserProfile');
const Review = require('../models/Review');
const Order = require('../models/Order');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Contact = require('../models/Contact');
const Notification = require('../models/Notification');
const Promotion = require('../models/Promotion');
const Project = require('../models/Project');
const Newsletter = require('../models/Newsletter');
const Vat = require('../models/Vat');
const WithdrawRequest = require('../models/withdrawRequest');
const FAQ = require('../models/FAQ');
const Freelancer = require('../models/Freelancer');

async function initializeCollections() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const models = [
      { name: 'User', model: User },
      { name: 'Job', model: Job },
      { name: 'UserProfile', model: UserProfile },
      { name: 'Review', model: Review },
      { name: 'Order', model: Order },
      { name: 'Conversation', model: Conversation },
      { name: 'Message', model: Message },
      { name: 'Contact', model: Contact },
      { name: 'Notification', model: Notification },
      { name: 'Promotion', model: Promotion },
      { name: 'Project', model: Project },
      { name: 'Newsletter', model: Newsletter },
      { name: 'Vat', model: Vat },
      { name: 'WithdrawRequest', model: WithdrawRequest },
      { name: 'FAQ', model: FAQ },
      { name: 'Freelancer', model: Freelancer },
    ];

    const existingCollections = (await mongoose.connection.db.listCollections().toArray())
      .map(col => col.name);

    for (const { name, model } of models) {
      const collectionName = model.collection.collectionName;
      
      if (!existingCollections.includes(collectionName)) {
        await mongoose.connection.db.createCollection(collectionName);
        } else {
        }
    }

    const collections = await mongoose.connection.db.listCollections().toArray();
    collections.forEach((col, index) => {
      });

    for (const { name, model } of models) {
      const count = await model.countDocuments();
      }

  } catch (error) {
    console.error('❌ Error initializing collections:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

initializeCollections();
