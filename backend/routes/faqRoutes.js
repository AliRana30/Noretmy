const express = require('express');
const router = express.Router();
const faqController = require('../controllers/faqController');
const { 
  requireAdmin
} = require('../middleware/jwt');

// Public routes (no authentication required) - MUST be before any middleware
router.get('/categories', faqController.getCategories);
router.get('/category/:category', faqController.getFAQsByCategory);

// Admin routes for FAQ management - requireAdmin already includes verifyTokenEnhanced
router.get('/', ...requireAdmin, faqController.getAllFAQs);
router.get('/stats', ...requireAdmin, faqController.getFAQStats);
router.get('/:id', ...requireAdmin, faqController.getFAQById);

// Create FAQ(s) - handles both single and bulk (admin only)
router.post('/', ...requireAdmin, faqController.createFAQ);

// Update FAQ(s) - handles both single and bulk (admin only)
router.put('/:id', ...requireAdmin, faqController.updateFAQ);

// Delete FAQ(s) - handles both single and bulk (admin only)
router.delete('/:id', ...requireAdmin, faqController.deleteFAQ);

module.exports = router;

