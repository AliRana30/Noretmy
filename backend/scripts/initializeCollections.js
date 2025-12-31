require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

// Import all models to ensure collections are created
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
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected successfully!');

    // Get all model names
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

    console.log('\n📋 Initializing collections...\n');

    // Create collections if they don't exist
    const existingCollections = (await mongoose.connection.db.listCollections().toArray())
      .map(col => col.name);

    for (const { name, model } of models) {
      const collectionName = model.collection.collectionName;
      
      if (!existingCollections.includes(collectionName)) {
        await mongoose.connection.db.createCollection(collectionName);
        console.log(`✅ Created collection: ${collectionName}`);
      } else {
        console.log(`⏭️  Collection already exists: ${collectionName}`);
      }
    }

    console.log('\n✅ All collections initialized successfully!');
    console.log('\n📊 Current collections in database:');
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    collections.forEach((col, index) => {
      console.log(`   ${index + 1}. ${col.name}`);
    });

    // Get count of documents in each collection
    console.log('\n📈 Document counts:');
    for (const { name, model } of models) {
      const count = await model.countDocuments();
      console.log(`   ${model.collection.collectionName}: ${count} documents`);
    }

  } catch (error) {
    console.error('❌ Error initializing collections:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed.');
    process.exit(0);
  }
}

// Run the initialization
initializeCollections();
