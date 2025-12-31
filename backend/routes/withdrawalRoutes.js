const express = require('express');
const router = express.Router();
const {
  createWithdrawalRequest,
  getUserWithdrawalRequests,
  getAllWithdrawalRequests,
  approveWithdrawalRequest,
  rejectWithdrawalRequest,
  cancelWithdrawalRequest,
  getCooldownStatus,
  getWithdrawalStats
} = require('../controllers/withdrawalController');
const { verifyTokenEnhanced, checkRoleEnhanced } = require('../middleware/jwt');

// User routes (freelancers)
router.post('/', verifyTokenEnhanced, createWithdrawalRequest);
router.get('/my-requests', verifyTokenEnhanced, getUserWithdrawalRequests);
router.get('/cooldown-status', verifyTokenEnhanced, getCooldownStatus);
router.get('/stats', verifyTokenEnhanced, getWithdrawalStats);
router.delete('/:requestId', verifyTokenEnhanced, cancelWithdrawalRequest);

// Admin routes
router.get('/admin/all', verifyTokenEnhanced, checkRoleEnhanced(['admin']), getAllWithdrawalRequests);
router.patch('/admin/:requestId/approve', verifyTokenEnhanced, checkRoleEnhanced(['admin']), approveWithdrawalRequest);
router.patch('/admin/:requestId/reject', verifyTokenEnhanced, checkRoleEnhanced(['admin']), rejectWithdrawalRequest);

module.exports = router;
