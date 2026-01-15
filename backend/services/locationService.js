const axios = require('axios');

const getCountryInfo = async (req) => {
    try {
        let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        
        if (ip === '::1' || ip === '127.0.0.1' || ip === 'localhost' || ip?.includes('::ffff:127.0.0.1')) {
            return {
                success: true,
                country: 'United States',
                countryCode: 'US',
            };
        }

        if (ip?.includes('::ffff:')) {
            ip = ip.split('::ffff:')[1];
        }

        const response = await axios.get(`https://ipwhois.app/json/${ip}`, {
            timeout: 5000 // 5 second timeout
        });
        const data = response.data;

        if (data.success) {
            return {
                success: true,
                country: data.country,
                countryCode: data.country_code,
            };
        } else {
            return {
                success: true,
                country: 'United States',
                countryCode: 'US',
            };
        }
    } catch (error) {
        console.error('Error fetching country info:', error.message);
        return {
            success: true,
            country: 'United States',
            countryCode: 'US',
        };
    }
};

module.exports = getCountryInfo;
