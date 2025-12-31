// const axios = require('axios');
// const cron = require('node-cron');
// const VATRate = require('../models/Vat'); // VATRate model
// require('dotenv').config();

// // API key from your VATSense account
// const API_KEY = process.env.VAT_API_KEY;

// // Updated API endpoint for global tax rates
// const TAX_API_URL = `https://api.vatsense.com/1.0/rates`;

// // Function to fetch and store VAT rates
// const fetchAndStoreVATRates = async () => {
//     try {
//         // Fetch global VAT data from the API
//         const response = await axios.get(TAX_API_URL, {
//             auth: {
//                 username: 'user', // Basic Auth username
//                 password: API_KEY // Use your VATSense API Key here
//             }
//         });

//         // Check the response structure
//         if (!response.data || !response.data.data) {
//             throw new Error("Unexpected response format from API");
//         }

//         const taxRates = response.data.data; // Adjusting based on VATSense API response structure

//         // Process VAT rates using only the `standard` property
//         const operations = taxRates.map((data) => {
//             const standardRate = data.standard && data.standard.rate ? data.standard.rate : 0;

//             return {
//                 updateOne: {
//                     filter: { countryCode: data.country_code },
//                     update: {
//                         $set: {
//                             countryName: data.country_name || 'unknown',
//                             standardRate: standardRate,
//                             lastUpdated: new Date(),
//                         },
//                     },
//                     upsert: true, // Insert if not exists
//                 },
//             };
//         });

//         // Perform bulk update to save VAT data in MongoDB
//         await VATRate.bulkWrite(operations);

//         console.log('VAT rates updated successfully.');
//     } catch (error) {
//         console.error('Error updating VAT rates:', error.response ? error.response.data : error.message);
//     }
// };

// // Schedule the VAT update to run every 24 hours
// cron.schedule('0 0 * * *', () => {
//     console.log('Running scheduled VAT rates update...');
//     fetchAndStoreVATRates();
// });

// // Export for manual route-based trigger as well
// module.exports = { fetchAndStoreVATRates };


const axios = require('axios');
const cron = require('node-cron');
const VATRate = require('../models/Vat'); // VATRate model
const UserProfile = require('../models/UserProfile');
const { sendOrderSuccessEmail } = require('../services/emailService');
require('dotenv').config();

// API key from your VATSense account
const API_KEY = process.env.VAT_API_KEY;

// Updated API endpoint for global tax rates
const TAX_API_URL = `https://api.vatsense.com/1.0/rates`;

// Function to fetch and store VAT rates
const fetchAndStoreVATRates = async () => {
    try {
        // Fetch global VAT data from the API
        const response = await axios.get(TAX_API_URL, {
            auth: {
                username: 'user', // Basic Auth username
                password: API_KEY // Use your VATSense API Key here
            }
        });

        // Check if the response contains the required data
        if (!response.data || !response.data.data) {
            throw new Error("Unexpected response format from API");
        }

        const taxRates = response.data.data;

        // Filter out countries that already have the latest VAT data
        const filteredTaxRates = taxRates.filter((data) => {
            const existingRate = VATRate.findOne({ countryCode: data.country_code });
            // Check if the standard rate is different or if the country is not in the database
            return existingRate && existingRate.standardRate !== data.standard?.rate;
        });

        // Bulk write operations for the updated tax rates
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

        // If there are any updates to apply, perform bulk write
        if (operations.length > 0) {
            await VATRate.bulkWrite(operations);
            console.log(`${operations.length} VAT rates updated successfully.`);
        } else {
            console.log('No VAT rate updates required.');
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
        // Fetch user profile to get the countryCode
        const userProfile = await UserProfile.findOne({ userId: userId });

        if (!userProfile) {
            console.warn(`[VAT] User profile not found for ID: ${userId}, defaulting to 0%`);
            return 0;
        }

        if (!userProfile.countryCode) {
            console.warn(`[VAT] Country code missing for user: ${userProfile.username}, defaulting to 0%`);
            return 0;
        }

        // Fetch VAT rate based on the countryCode from user profile
        const vatRate = await VATRate.findOne({ countryCode: userProfile.countryCode.toUpperCase() });

        if (!vatRate) {
            // Log as informational, not necessarily an error as many countries might not be in the DB yet
            console.info(`[VAT] Standard rate not found in database for country: ${userProfile.countryCode}, defaulting to 0%`);
            return 0;
        }

        return (vatRate.standardRate || 0) / 100;
    } catch (error) {
        console.error('[VAT] Critical error fetching VAT rate:', error);
        return 0;
    }
};


// to be deleted
const ToBeDeleted=async(req,res)=>{
    try {
        const { email, orderDetails } = req.body;
    
        // Validate inputs (ensure required fields are present)
        if (!email || !orderDetails) {
          return res.status(400).send('Email and order details are required');
        }
    
        // Call the sendOrderSuccessEmail function from the controller
        await sendOrderSuccessEmail(email, orderDetails);
    
        res.status(200).send('Order success email sent successfully!');
      } catch (error) {
        console.error('Error sending order success email:', error);
        res.status(500).send('Failed to send email');
      }
}


// Schedule the VAT update to run every 24 hours
cron.schedule('0 0 * * *', () => {
    console.log('Running scheduled VAT rates update...');
    fetchAndStoreVATRates();
});

// Export for manual route-based trigger as well
module.exports = { fetchAndStoreVATRates,getVatRate,ToBeDeleted };
