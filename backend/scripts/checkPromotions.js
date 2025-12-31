// Quick script to check PromotionPurchase collection
require('dotenv').config();
const mongoose = require('mongoose');

async function checkPromotionPurchases() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB...\n');
    
    const docs = await mongoose.connection.db.collection('promotionpurchases').find({}).toArray();
    
    if (docs.length === 0) {
      console.log('No promotion purchases found in the database.');
      console.log('\nThis is expected if no promotions have been purchased yet via Stripe webhook.');
    } else {
      console.log(`Found ${docs.length} promotion purchase(s):\n`);
      docs.forEach((doc, i) => {
        console.log(`--- Purchase ${i + 1} ---`);
        console.log(JSON.stringify(doc, null, 2));
        console.log('');
      });
    }
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkPromotionPurchases();
