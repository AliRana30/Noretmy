











const axios = require('axios');
const cron = require('node-cron');
const VATRate = require('../models/Vat'); // VATRate model
const UserProfile = require('../models/UserProfile');
const { sendOrderSuccessEmail } = require('../services/emailService');
require('dotenv').config();

const API_KEY = process.env.VAT_API_KEY;

const TAX_API_URL = `https://api.vatsense.com/1.0/rates`;

const fetchAndStoreVATRates = async () => {
    try {
        const response = await axios.get(TAX_API_URL, {
            auth: {
                username: 'user', // Basic Auth username
                password: API_KEY // Use your VATSense API Key here
            }
        });

        if (!response.data || !response.data.data) {
            throw new Error("Unexpected response format from API");
        }

        const taxRates = response.data.data;

        const filteredTaxRates = taxRates.filter((data) => {
            const existingRate = VATRate.findOne({ countryCode: data.country_code });
            return existingRate && existingRate.standardRate !== data.standard?.rate;
        });

        const operations = filteredTaxRates.map((data) => {
            const standardRate = data.standard?.rate || 0;

            return {
                updateOne: {
                    filter: { countryCode: data.country_code },
                    update: {
                        $set: {
                            countryName: data.country_name || 'unknown',
                            standardRate: standardRate,
                            lastUpdated: new Date(),
                        },
                    },
                    upsert: true, // Insert if it doesn't exist
                },
            };
        });

        if (operations.length > 0) {
            await VATRate.bulkWrite(operations);
            } else {
            }
    } catch (error) {
        console.error('Error updating VAT rates:', error.response ? error.response.data : error.message);
    }
};

const getVatRate = async (userId) => {
    if (!userId) {
        console.warn("[VAT] No userId provided to getVatRate, defaulting to 0%");
        return 0;
    }

    try {
        const userProfile = await UserProfile.findOne({ userId: userId });

        if (!userProfile) {
            console.warn(`[VAT] User profile not found for ID: ${userId}, defaulting to 0%`);
            return 0;
        }

        if (!userProfile.countryCode) {
            console.warn(`[VAT] Country code missing for user: ${userProfile.username}, defaulting to 0%`);
            return 0;
        }

        const vatRate = await VATRate.findOne({ countryCode: userProfile.countryCode.toUpperCase() });

        if (!vatRate) {
            console.info(`[VAT] Standard rate not found in database for country: ${userProfile.countryCode}, defaulting to 0%`);
            return 0;
        }

        return (vatRate.standardRate || 0) / 100;
    } catch (error) {
        console.error('[VAT] Critical error fetching VAT rate:', error);
        return 0;
    }
};

const ToBeDeleted=async(req,res)=>{
    try {
        const { email, orderDetails } = req.body;
    
        if (!email || !orderDetails) {
          return res.status(400).send('Email and order details are required');
        }
    
        await sendOrderSuccessEmail(email, orderDetails);
    
        res.status(200).send('Order success email sent successfully!');
      } catch (error) {
        console.error('Error sending order success email:', error);
        res.status(500).send('Failed to send email');
      }
}

cron.schedule('0 0 * * *', () => {
    fetchAndStoreVATRates();
});

module.exports = { fetchAndStoreVATRates,getVatRate,ToBeDeleted };
