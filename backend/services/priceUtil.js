/**
 * Price Utility Service
 * Handles all price calculations including VAT, platform fees, and totals
 * 
 * IMPORTANT: All VAT calculations happen on the backend only.
 * Frontend displays backend-calculated values.
 */

const PLATFORM_FEE_RATE = 0.05; // 5% platform fee

/**
 * Calculate total amount with fee and tax
 * @param {number} orderPrice - Base price of the order
 * @param {number} vatRate - VAT rate as a decimal (e.g., 0.20 for 20%)
 * @returns {number} Total price rounded to nearest dollar
 */
const getAmountWithFeeAndTax = (orderPrice, vatRate) => {
    const price = Number(orderPrice);
    const vat = Number(vatRate) || 0;

    if (isNaN(price) || price <= 0) {
        throw new Error("Invalid input: orderPrice must be a positive number");
    }

    const platformFee = price * PLATFORM_FEE_RATE;
    const taxableAmount = price + platformFee;
    const vatAmount = taxableAmount * vat;
    const totalPrice = taxableAmount + vatAmount;
    
    return Math.round(totalPrice * 100) / 100; // Round to 2 decimal places
};

/**
 * Get detailed price breakdown for display and storage
 * @param {number} orderPrice - Base price of the order
 * @param {number} vatRate - VAT rate as a decimal (e.g., 0.20 for 20%)
 * @param {string} currency - Currency code (default: USD)
 * @returns {Object} Detailed price breakdown
 */
const getPriceBreakdown = (orderPrice, vatRate, currency = 'USD') => {
    const basePrice = Number(orderPrice);
    const vat = Number(vatRate) || 0;

    if (isNaN(basePrice) || basePrice <= 0) {
        return {
            success: false,
            error: "Invalid base price",
            basePrice: 0,
            platformFee: 0,
            platformFeeRate: PLATFORM_FEE_RATE,
            vatRate: 0,
            vatAmount: 0,
            totalPrice: 0,
            currency
        };
    }

    const platformFee = Math.round(basePrice * PLATFORM_FEE_RATE * 100) / 100;
    const taxableAmount = basePrice + platformFee;
    const vatAmount = Math.round(taxableAmount * vat * 100) / 100;
    const totalPrice = Math.round((taxableAmount + vatAmount) * 100) / 100;

    return {
        success: true,
        basePrice,
        platformFee,
        platformFeeRate: PLATFORM_FEE_RATE,
        vatRate: vat,
        vatRatePercentage: vat * 100, // For display (e.g., 20%)
        vatAmount,
        totalPrice,
        currency,
        stripeTotalCents: Math.round(totalPrice * 100)
    };
};

/**
 * Calculate seller payout (excluding VAT and platform fee)
 * @param {number} orderPrice - Base price of the order
 * @returns {number} Amount seller receives
 */
const getSellerPayout = (orderPrice) => {
    const basePrice = Number(orderPrice);
    if (isNaN(basePrice) || basePrice <= 0) {
        return 0;
    }
    
    const platformFee = basePrice * PLATFORM_FEE_RATE;
    return Math.round((basePrice - platformFee) * 100) / 100;
};

/**
 * Validate VAT rate
 * @param {number} vatRate - VAT rate to validate
 * @returns {number} Valid VAT rate or 0 as fallback
 */
const validateVatRate = (vatRate) => {
    const rate = Number(vatRate);
    if (isNaN(rate) || rate < 0 || rate > 1) {
        console.warn(`Invalid VAT rate: ${vatRate}, using 0% as fallback`);
        return 0;
    }
    return rate;
};

module.exports = { 
    getAmountWithFeeAndTax, 
    getPriceBreakdown,
    getSellerPayout,
    validateVatRate,
    PLATFORM_FEE_RATE 
};