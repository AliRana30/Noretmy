/**
 * Badge Routes
 * Routes for seller badge and trust system
 */

const express = require('express');
const router = express.Router();
const {
  getSellerBadge,
  getMultipleSellerBadges,
  getSellerAchievements,
  getSellerBadgeHistory,
  
  getMyBadge,
  getMyPerformanceDetails,
  
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


router.get('/seller/:sellerId', getSellerBadge);

router.post('/batch', getMultipleSellerBadges);

router.get('/seller/:sellerId/achievements', getSellerAchievements);

router.get('/seller/:sellerId/history', getSellerBadgeHistory);


router.get('/my-badge', verifyToken, checkRole(['freelancer', 'seller']), getMyBadge);

router.get('/my-performance', verifyToken, checkRole(['freelancer', 'seller']), getMyPerformanceDetails);


router.get(
  '/admin/all', 
  verifyTokenEnhanced, 
  checkRoleEnhanced(['admin']), 
  adminGetAllBadges
);

router.get(
  '/admin/stats', 
  verifyTokenEnhanced, 
  checkRoleEnhanced(['admin']), 
  adminGetBadgeStats
);

router.get(
  '/admin/audit-log', 
  verifyTokenEnhanced, 
  checkRoleEnhanced(['admin']),
  ...requirePermission('seller_management'),
  adminGetBadgeAuditLog
);

router.get(
  '/admin/seller/:sellerId', 
  verifyTokenEnhanced, 
  checkRoleEnhanced(['admin']), 
  adminGetSellerBadgeDetails
);

router.post(
  '/admin/seller/:sellerId/override', 
  verifyTokenEnhanced, 
  checkRoleEnhanced(['admin']),
  ...requirePermission('seller_management'),
  adminOverrideBadge
);

router.delete(
  '/admin/seller/:sellerId/override', 
  verifyTokenEnhanced, 
  checkRoleEnhanced(['admin']),
  ...requirePermission('seller_management'),
  adminRemoveOverride
);

router.post(
  '/admin/seller/:sellerId/freeze', 
  verifyTokenEnhanced, 
  checkRoleEnhanced(['admin']),
  ...requirePermission('seller_management'),
  adminFreezeBadge
);

router.delete(
  '/admin/seller/:sellerId/freeze', 
  verifyTokenEnhanced, 
  checkRoleEnhanced(['admin']),
  ...requirePermission('seller_management'),
  adminUnfreezeBadge
);

router.post(
  '/admin/seller/:sellerId/re-evaluate', 
  verifyTokenEnhanced, 
  checkRoleEnhanced(['admin']),
  ...requirePermission('seller_management'),
  adminReEvaluateBadge
);

router.post(
  '/admin/batch-re-evaluate', 
  verifyTokenEnhanced, 
  checkRoleEnhanced(['admin']),
  ...requirePermission('seller_management'),
  adminBatchReEvaluate
);

module.exports = router;
