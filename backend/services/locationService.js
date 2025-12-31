const axios = require('axios');

const getCountryInfo = async (req) => {
    try {
        // Get IP address from request headers or socket
        let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        
        // Handle localhost/development environment
        if (ip === '::1' || ip === '127.0.0.1' || ip === 'localhost' || ip?.includes('::ffff:127.0.0.1')) {
            console.log('Localhost detected, using default country info');
            return {
                success: true,
                country: 'United States',
                countryCode: 'US',
            };
        }

        // Clean IPv6-mapped IPv4 addresses
        if (ip?.includes('::ffff:')) {
            ip = ip.split('::ffff:')[1];
        }

        // Fetch country info using the IP address
        const response = await axios.get(`https://ipwhois.app/json/${ip}`, {
            timeout: 5000 // 5 second timeout
        });
        const data = response.data;

        // Check if the response was successful
        if (data.success) {
            return {
                success: true,
                country: data.country,
                countryCode: data.country_code,
            };
        } else {
            // Fallback to default if API returns unsuccessful
            console.log('API returned unsuccessful, using default country info');
            return {
                success: true,
                country: 'United States',
                countryCode: 'US',
            };
        }
    } catch (error) {
        console.error('Error fetching country info:', error.message);
        // Fallback to default instead of failing
        return {
            success: true,
            country: 'United States',
            countryCode: 'US',
        };
    }
};

module.exports = getCountryInfo;
