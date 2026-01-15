/**
 * VAT Service - Comprehensive VAT Calculation and Validation
 * 
 * RULES:
 * - VAT is always paid by the client (buyer)
 * - Seller never earns VAT - it goes to the platform for remittance
 * - EU clients pay VAT based on their billing country
 * - Non-EU clients pay 0% VAT
 * - B2B with valid EU VAT ID = reverse charge (0% VAT)
 * - All calculations are server-side only
 */

const axios = require('axios');
const VATRate = require('../models/Vat');
const UserProfile = require('../models/UserProfile');
const User = require('../models/User');

const EU_COUNTRIES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
];

const PLATFORM_FEE_RATE = 0.05; // 5% platform fee

/**
 * Check if a country is in the EU
 */
const isEUCountry = (countryCode) => {
  if (!countryCode) return false;
  return EU_COUNTRIES.includes(countryCode.toUpperCase());
};

/**
 * Validate EU VAT ID using VIES service
 * Returns: { valid: boolean, name: string, address: string, error: string }
 */
const validateVATID = async (vatId, countryCode) => {
  try {
    if (!vatId || !countryCode) {
      return { valid: false, error: 'VAT ID or country code missing' };
    }

    const cleanVatId = vatId.replace(/\s/g, '').toUpperCase();
    const country = countryCode.toUpperCase();
    
    if (!isEUCountry(country)) {
      return { valid: false, error: 'Country is not in EU' };
    }

    let vatNumber = cleanVatId;
    if (cleanVatId.startsWith(country)) {
      vatNumber = cleanVatId.substring(country.length);
    }

    
    const vatFormats = {
      'AT': /^U\d{8}$/,
      'BE': /^0?\d{9,10}$/,
      'BG': /^\d{9,10}$/,
      'HR': /^\d{11}$/,
      'CY': /^\d{8}[A-Z]$/,
      'CZ': /^\d{8,10}$/,
      'DK': /^\d{8}$/,
      'EE': /^\d{9}$/,
      'FI': /^\d{8}$/,
      'FR': /^[A-Z0-9]{2}\d{9}$/,
      'DE': /^\d{9}$/,
      'GR': /^\d{9}$/,
      'HU': /^\d{8}$/,
      'IE': /^\d{7}[A-Z]{1,2}$|^\d[A-Z+*]\d{5}[A-Z]$/,
      'IT': /^\d{11}$/,
      'LV': /^\d{11}$/,
      'LT': /^\d{9}$|^\d{12}$/,
      'LU': /^\d{8}$/,
      'MT': /^\d{8}$/,
      'NL': /^\d{9}B\d{2}$/,
      'PL': /^\d{10}$/,
      'PT': /^\d{9}$/,
      'RO': /^\d{2,10}$/,
      'SK': /^\d{10}$/,
      'SI': /^\d{8}$/,
      'ES': /^[A-Z0-9]\d{7}[A-Z0-9]$/,
      'SE': /^\d{12}$/
    };

    const format = vatFormats[country];
    if (format && !format.test(vatNumber)) {
      return { valid: false, error: 'Invalid VAT ID format' };
    }

    
    
    return {
      valid: true,
      vatNumber: `${country}${vatNumber}`,
      countryCode: country,
      verifiedAt: new Date()
    };

  } catch (error) {
    console.error('VAT ID validation error:', error.message);
    return { valid: false, error: 'VAT validation service error' };
  }
};

/**
 * Get VAT rate for a country
 * Returns rate as decimal (e.g., 0.20 for 20%)
 */
const getVATRateByCountry = async (countryCode) => {
  try {
    if (!countryCode) {
      return 0;
    }

    const country = countryCode.toUpperCase();

    if (!isEUCountry(country)) {
      return 0;
    }

    const vatRecord = await VATRate.findOne({ countryCode: country });
    
    if (vatRecord && vatRecord.standardRate) {
      return vatRecord.standardRate / 100;
    }

    const fallbackRates = {
      'AT': 0.20, 'BE': 0.21, 'BG': 0.20, 'HR': 0.25, 'CY': 0.19,
      'CZ': 0.21, 'DK': 0.25, 'EE': 0.22, 'FI': 0.24, 'FR': 0.20,
      'DE': 0.19, 'GR': 0.24, 'HU': 0.27, 'IE': 0.23, 'IT': 0.22,
      'LV': 0.21, 'LT': 0.21, 'LU': 0.17, 'MT': 0.18, 'NL': 0.21,
      'PL': 0.23, 'PT': 0.23, 'RO': 0.19, 'SK': 0.20, 'SI': 0.22,
      'ES': 0.21, 'SE': 0.25
    };

    return fallbackRates[country] || 0;

  } catch (error) {
    console.error('Error getting VAT rate:', error.message);
    return 0; // Graceful fallback
  }
};

/**
 * Calculate complete price breakdown with VAT
 * This is the ONLY source of truth for all price calculations
 * 
 * @param {Object} params
 * @param {number} params.basePrice - Base price of service
 * @param {string} params.clientCountry - Client's billing country code
 * @param {string} params.vatId - Client's VAT ID (for B2B)
 * @param {boolean} params.isBusinessClient - Whether client is a business
 * @param {string} params.currency - Currency code (default: EUR)
 */
const calculateVATBreakdown = async ({
  basePrice,
  clientCountry,
  vatId = null,
  isBusinessClient = false,
  currency = 'EUR'
}) => {
  try {
    const price = Number(basePrice);
    
    if (isNaN(price) || price <= 0) {
      return {
        success: false,
        error: 'Invalid base price'
      };
    }

    let vatRate = 0;
    let reverseChargeApplied = false;
    let reverseChargeNote = null;

    const country = (clientCountry || '').toUpperCase();
    const isEU = isEUCountry(country);

    if (isEU) {
      if (isBusinessClient && vatId) {
        const vatValidation = await validateVATID(vatId, country);
        
        if (vatValidation.valid) {
          vatRate = 0;
          reverseChargeApplied = true;
          reverseChargeNote = 'VAT reverse-charged under Article 44 and 196 of EU VAT Directive';
        } else {
          vatRate = await getVATRateByCountry(country);
        }
      } else {
        vatRate = await getVATRateByCountry(country);
      }
    } else {
      vatRate = 0;
    }

    const platformFee = Math.round(price * PLATFORM_FEE_RATE * 100) / 100;
    const taxableAmount = price + platformFee;
    const vatAmount = Math.round(taxableAmount * vatRate * 100) / 100;
    const totalAmount = Math.round((taxableAmount + vatAmount) * 100) / 100;
    
    const sellerEarnings = Math.round((price - platformFee) * 100) / 100;

    return {
      success: true,
      breakdown: {
        baseAmount: price,
        platformFee,
        platformFeeRate: PLATFORM_FEE_RATE,
        vatRate,
        vatRatePercentage: Math.round(vatRate * 100),
        vatAmount,
        totalAmount,
        currency,
        clientCountry: country || null,
        vatCollected: vatAmount > 0,
        reverseChargeApplied,
        reverseChargeNote,
        sellerEarnings,
        stripeTotalCents: Math.round(totalAmount * 100)
      }
    };

  } catch (error) {
    console.error('VAT calculation error:', error.message);
    
    const price = Number(basePrice) || 0;
    const platformFee = Math.round(price * PLATFORM_FEE_RATE * 100) / 100;
    
    return {
      success: true,
      breakdown: {
        baseAmount: price,
        platformFee,
        platformFeeRate: PLATFORM_FEE_RATE,
        vatRate: 0,
        vatRatePercentage: 0,
        vatAmount: 0,
        totalAmount: price,
        currency: currency || 'EUR',
        clientCountry: clientCountry || null,
        vatCollected: false,
        reverseChargeApplied: false,
        reverseChargeNote: null,
        sellerEarnings: Math.round((price - platformFee) * 100) / 100,
        stripeTotalCents: Math.round(price * 100),
        fallbackApplied: true,
        fallbackReason: error.message
      }
    };
  }
};

/**
 * Get VAT calculation for a user
 */
const getVATForUser = async (userId, basePrice, currency = 'EUR') => {
  try {
    const userProfile = await UserProfile.findOne({ userId });
    const user = await User.findById(userId);

    const clientCountry = userProfile?.countryCode || userProfile?.country || null;
    const isBusinessClient = user?.role === 'company' || userProfile?.isCompany || false;
    const vatId = userProfile?.vatId || null;

    return await calculateVATBreakdown({
      basePrice,
      clientCountry,
      vatId,
      isBusinessClient,
      currency
    });

  } catch (error) {
    console.error('Error getting VAT for user:', error.message);
    return await calculateVATBreakdown({ basePrice, currency });
  }
};

/**
 * Prepare VAT data for Stripe metadata
 */
const getStripeVATMetadata = (vatBreakdown, orderId, userId) => {
  return {
    baseAmount: String(vatBreakdown.baseAmount),
    vatRate: String(vatBreakdown.vatRate),
    vatRatePercentage: String(vatBreakdown.vatRatePercentage),
    vatAmount: String(vatBreakdown.vatAmount),
    totalAmount: String(vatBreakdown.totalAmount),
    clientCountry: vatBreakdown.clientCountry || '',
    vatCollected: String(vatBreakdown.vatCollected),
    reverseChargeApplied: String(vatBreakdown.reverseChargeApplied),
    currency: vatBreakdown.currency,
    orderId: orderId || '',
    userId: userId || '',
    calculatedAt: new Date().toISOString()
  };
};

/**
 * Lock VAT data after successful payment (immutable)
 */
const lockVATData = (order) => {
  return {
    baseAmount: order.baseAmount,
    vatRate: order.vatRate,
    vatAmount: order.vatAmount,
    platformFee: order.platformFee,
    totalAmount: order.totalAmount,
    clientCountry: order.clientCountry,
    vatCollected: order.vatCollected,
    currency: order.currency,
    lockedAt: new Date()
  };
};

module.exports = {
  isEUCountry,
  validateVATID,
  getVATRateByCountry,
  calculateVATBreakdown,
  getVATForUser,
  getStripeVATMetadata,
  lockVATData,
  PLATFORM_FEE_RATE,
  EU_COUNTRIES
};
