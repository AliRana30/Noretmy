const express = require('express');
const { fetchAndStoreVATRates, ToBeDeleted, getVatRate } = require('../controllers/vatController');
const { verifyToken } = require('../middleware/jwt');
const {
  calculateVATBreakdown,
  getVATForUser,
  validateVATID,
  isEUCountry,
  getVATRateByCountry
} = require('../services/vatService');
const UserProfile = require('../models/UserProfile');

const router = express.Router();

// Route to update VAT rates (admin only)
router.post('/test-email', ToBeDeleted);
router.get('/update-vat-rates', fetchAndStoreVATRates);

/**
 * Calculate VAT breakdown for checkout
 * This is the ONLY source of truth for price calculations
 * Frontend must use these values - no client-side calculations
 */
router.post('/calculate', verifyToken, async (req, res) => {
  try {
    const { userId } = req;
    const { basePrice, currency = 'EUR' } = req.body;

    if (!basePrice || isNaN(Number(basePrice)) || Number(basePrice) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid base price is required'
      });
    }

    const result = await getVATForUser(userId, Number(basePrice), currency);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || 'VAT calculation failed'
      });
    }

    res.status(200).json({
      success: true,
      breakdown: result.breakdown
    });
  } catch (error) {
    console.error('VAT calculation error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during VAT calculation'
    });
  }
});

/**
 * Calculate VAT with custom country/VAT ID (for B2B checkout)
 */
router.post('/calculate-custom', verifyToken, async (req, res) => {
  try {
    const { basePrice, clientCountry, vatId, isBusinessClient, currency = 'EUR' } = req.body;

    if (!basePrice || isNaN(Number(basePrice)) || Number(basePrice) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid base price is required'
      });
    }

    const result = await calculateVATBreakdown({
      basePrice: Number(basePrice),
      clientCountry,
      vatId,
      isBusinessClient,
      currency
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || 'VAT calculation failed'
      });
    }

    res.status(200).json({
      success: true,
      breakdown: result.breakdown
    });
  } catch (error) {
    console.error('Custom VAT calculation error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during VAT calculation'
    });
  }
});

/**
 * Validate EU VAT ID
 */
router.post('/validate-vat-id', verifyToken, async (req, res) => {
  try {
    const { vatId, countryCode } = req.body;

    if (!vatId || !countryCode) {
      return res.status(400).json({
        success: false,
        error: 'VAT ID and country code are required'
      });
    }

    const validation = await validateVATID(vatId, countryCode);

    res.status(200).json({
      success: true,
      validation
    });
  } catch (error) {
    console.error('VAT ID validation error:', error);
    res.status(500).json({
      success: false,
      error: 'VAT validation service error'
    });
  }
});

/**
 * Get user's VAT rate based on their profile country
 */
router.get('/rate', verifyToken, async (req, res) => {
  try {
    const { userId } = req;
    
    // Get user's country
    const userProfile = await UserProfile.findOne({ userId });
    const countryCode = userProfile?.countryCode || userProfile?.country;
    
    const vatRate = await getVATRateByCountry(countryCode);
    const isEU = isEUCountry(countryCode);
    
    res.status(200).json({
      success: true,
      vatRate: vatRate,
      vatRatePercentage: Math.round(vatRate * 100),
      country: countryCode || null,
      countryName: userProfile?.country || null,
      isEUCountry: isEU,
      isBusinessClient: userProfile?.isCompany || false,
      vatId: userProfile?.vatId || null
    });
  } catch (error) {
    console.error('Error fetching VAT rate:', error);
    // Graceful fallback
    res.status(200).json({
      success: true,
      vatRate: 0,
      vatRatePercentage: 0,
      country: null,
      countryName: null,
      isEUCountry: false,
      note: 'Using default 0% VAT rate'
    });
  }
});

/**
 * Get VAT rate for a specific country
 */
router.get('/rate/:countryCode', async (req, res) => {
  try {
    const { countryCode } = req.params;
    
    const vatRate = await getVATRateByCountry(countryCode);
    const isEU = isEUCountry(countryCode);
    
    res.status(200).json({
      success: true,
      countryCode: countryCode.toUpperCase(),
      vatRate: vatRate,
      vatRatePercentage: Math.round(vatRate * 100),
      isEUCountry: isEU
    });
  } catch (error) {
    console.error('Error fetching country VAT rate:', error);
    res.status(200).json({
      success: true,
      vatRate: 0,
      vatRatePercentage: 0,
      isEUCountry: false
    });
  }
});

module.exports = router;
