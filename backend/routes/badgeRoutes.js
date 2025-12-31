/**
 * Badge Routes
 * Routes for seller badge and trust system
 */

const express = require('express');
const router = express.Router();
const {
  // Public
  getSellerBadge,
  getMultipleSellerBadges,
  getSellerAchievements,
  getSellerBadgeHistory,
  
  // Seller
  getMyBadge,
  getMyPerformanceDetails,
  
  // Admin
  adminGetAllBadges,
  adminGetSellerBadgeDetails,
  adminOverrideBadge,
  adminRemoveOverride,
  adminFreezeBadge,
  adminUnfreezeBadge,
  adminReEvaluateBadge,
  adminBatchReEvaluate,
  adminGetBadgeStats,
  adminGetBadgeAuditLog
} = require('../controllers/badgeController');

const { 
  verifyToken, 
  checkRole, 
  verifyTokenEnhanced,
  checkRoleEnhanced,
  requirePermission 
} = require('../middleware/jwt');

// ==================== PUBLIC ROUTES ====================
// These don't require authentication

// Get badge info for a specific seller
router.get('/seller/:sellerId', getSellerBadge);

// Get badges for multiple sellers (batch request)
router.post('/batch', getMultipleSellerBadges);

// Get achievements for a seller
router.get('/seller/:sellerId/achievements', getSellerAchievements);

// Get badge history for a seller
router.get('/seller/:sellerId/history', getSellerBadgeHistory);

// ==================== SELLER ROUTES ====================
// Require authentication and seller role

// Get own badge details
router.get('/my-badge', verifyToken, checkRole(['freelancer', 'seller']), getMyBadge);

// Get detailed performance breakdown
router.get('/my-performance', verifyToken, checkRole(['freelancer', 'seller']), getMyPerformanceDetails);

// ==================== ADMIN ROUTES ====================
// Require admin authentication

// Get all badges with filtering
router.get(
  '/admin/all', 
  verifyTokenEnhanced, 
  checkRoleEnhanced(['admin']), 
  adminGetAllBadges
);

// Get badge statistics
router.get(
  '/admin/stats', 
  verifyTokenEnhanced, 
  checkRoleEnhanced(['admin']), 
  adminGetBadgeStats
);

// Get audit log
router.get(
  '/admin/audit-log', 
  verifyTokenEnhanced, 
  checkRoleEnhanced(['admin']),
  ...requirePermission('seller_management'),
  adminGetBadgeAuditLog
);

// Get detailed badge info for a seller
router.get(
  '/admin/seller/:sellerId', 
  verifyTokenEnhanced, 
  checkRoleEnhanced(['admin']), 
  adminGetSellerBadgeDetails
);

// Override badge level
router.post(
  '/admin/seller/:sellerId/override', 
  verifyTokenEnhanced, 
  checkRoleEnhanced(['admin']),
  ...requirePermission('seller_management'),
  adminOverrideBadge
);

// Remove override
router.delete(
  '/admin/seller/:sellerId/override', 
  verifyTokenEnhanced, 
  checkRoleEnhanced(['admin']),
  ...requirePermission('seller_management'),
  adminRemoveOverride
);

// Freeze badge
router.post(
  '/admin/seller/:sellerId/freeze', 
  verifyTokenEnhanced, 
  checkRoleEnhanced(['admin']),
  ...requirePermission('seller_management'),
  adminFreezeBadge
);

// Unfreeze badge
router.delete(
  '/admin/seller/:sellerId/freeze', 
  verifyTokenEnhanced, 
  checkRoleEnhanced(['admin']),
  ...requirePermission('seller_management'),
  adminUnfreezeBadge
);

// Re-evaluate badge for a seller
router.post(
  '/admin/seller/:sellerId/re-evaluate', 
  verifyTokenEnhanced, 
  checkRoleEnhanced(['admin']),
  ...requirePermission('seller_management'),
  adminReEvaluateBadge
);

// Batch re-evaluate all sellers
router.post(
  '/admin/batch-re-evaluate', 
  verifyTokenEnhanced, 
  checkRoleEnhanced(['admin']),
  ...requirePermission('seller_management'),
  adminBatchReEvaluate
);

module.exports = router;
