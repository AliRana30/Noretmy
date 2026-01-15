require('dotenv').config();
const mongoose = require('mongoose');

async function checkPromotionPurchases() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const docs = await mongoose.connection.db.collection('promotionpurchases').find({}).toArray();
    
    if (docs.length === 0) {
      } else {
      docs.forEach((doc, i) => {
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
