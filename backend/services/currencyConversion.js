// utils/currencyConversion.js
const axios = require('axios');


const getUsdToEurRate = async () => {
  try {
    const response = await axios.get(`https://v6.exchangerate-api.com/v6/${process.env.CURRENCY_CONVERSION_API_KEY}/latest/USD`);
    
    const rate = response.data.conversion_rates.EUR;

    if (!rate) {
      throw new Error('Conversion rate for EUR not found');
    }

    return rate;
  } catch (error) {
    console.error('Error fetching conversion rate:', error.message);
    throw error; 
  }
};

module.exports = getUsdToEurRate;
