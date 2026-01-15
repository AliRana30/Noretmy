const express = require('express');
const router = express.Router();
const faqController = require('../controllers/faqController');
const { 
  requireAdmin
} = require('../middleware/jwt');

router.get('/categories', faqController.getCategories);
router.get('/category/:category', faqController.getFAQsByCategory);

router.get('/', ...requireAdmin, faqController.getAllFAQs);
router.get('/stats', ...requireAdmin, faqController.getFAQStats);
router.get('/:id', ...requireAdmin, faqController.getFAQById);

router.post('/', ...requireAdmin, faqController.createFAQ);

router.put('/:id', ...requireAdmin, faqController.updateFAQ);

router.delete('/:id', ...requireAdmin, faqController.deleteFAQ);

module.exports = router;

