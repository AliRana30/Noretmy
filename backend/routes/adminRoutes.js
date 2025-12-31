const express = require('express');
const router = express.Router();
const {
  // Dashboard & Analytics
  getDashboardStats,
  getUserAnalytics,
  getRevenueAnalytics,
  getPerformanceAnalytics,
  
  // User Management
  getAllUsers,
  getUserDetails,
  updateUserRole,
  blockUser,
  unblockUser,
  warnUser,
  deleteUser,
  
  // Job/Gig Management
  getAllJobs,
  updateJobStatus,
  deleteJob,
  
  // Order Management
  getAllOrders,
  getOrderDetails,
  updateOrderStatus,
  deleteOrder,
  
  // Financial Management
  getFinancialOverview,
  getWithdrawalRequests,
  approveWithdrawal,
  rejectWithdrawal,
  
  // Content Management
  getAllReviews,
  moderateReview,
  getSensitiveMessages,
  
  // Communication Management
  getContactMessages,
  markContactAsRead,
  getConversations,
  
  // System Management
  getSystemLogs,
  getAuditLogs,
  systemHealth,
  
  // Platform Settings & VAT
  getVatSettings,
  getVatReport,
  exportVatReport,
  
  // Marketing
  getNewsletterSubscribers,
  getPromotions,
  updatePromotionStatus,
  
  // Notification Management
  getNotifications,
  sendBroadcastNotification,
  
  // Project Management
  getProjects,
  updateProjectStatus,
  
  // Bulk Operations
  bulkUpdateUsers,
  
  // Admin Management
  createAdmin,
  updateUserPermissions
} = require('../controllers/adminController');

const { 
  verifyTokenEnhanced, 
  requireAdmin, 
  requirePermission,
  rateLimitByRole,
  verifyToken,
  checkRoleEnhanced
} = require('../middleware/jwt');

// Debug route to check user's auth status (no admin check)
router.get('/debug/auth-status', verifyTokenEnhanced, (req, res) => {
  res.json({
    success: true,
    userId: req.userId,
    role: req.user?.role,
    isVerified: req.user?.isVerified,
    isBlocked: req.user?.isBlocked,
    permissions: req.permissions,
    fullName: req.user?.fullName,
    email: req.user?.email
  });
});

// Use verifyTokenEnhanced first to populate req.user, then check admin role
router.use(verifyTokenEnhanced);
router.use((req, res, next) => {
  // Log for debugging
  console.log('Admin route accessed by:', {
    userId: req.userId,
    role: req.user?.role,
    email: req.user?.email,
    isVerified: req.user?.isVerified
  });
  next();
});
router.use(checkRoleEnhanced(['admin'], { allowHigherRoles: false }));

// ==================== DASHBOARD & ANALYTICS ====================
router.get('/dashboard/stats', getDashboardStats);
router.get('/analytics/users', getUserAnalytics);
router.get('/analytics/revenue', ...requirePermission('analytics_view'), getRevenueAnalytics);
router.get('/analytics/performance', ...requirePermission('analytics_view'), getPerformanceAnalytics);

// ==================== USER MANAGEMENT ====================
router.get('/users', getAllUsers);
router.get('/users/:userId', getUserDetails);
router.put('/users/:userId/role', ...requirePermission('user_management'), updateUserRole);
router.put('/users/:userId/permissions', ...requirePermission('user_management'), updateUserPermissions);
router.put('/users/:userId/block', ...requirePermission('user_management'), blockUser);
router.put('/users/:userId/unblock', ...requirePermission('user_management'), unblockUser);
router.put('/users/:userId/warn', ...requirePermission('user_management'), warnUser);
router.delete('/users/:userId', ...requirePermission('user_management'), deleteUser);
router.post('/users/bulk', ...requirePermission('user_management'), bulkUpdateUsers);

// ==================== JOB/GIG MANAGEMENT ====================
router.get('/jobs', getAllJobs);
router.put('/jobs/:jobId/status', ...requirePermission('content_moderation'), updateJobStatus);
router.delete('/jobs/:jobId', ...requirePermission('content_moderation'), deleteJob);

// ==================== ORDER MANAGEMENT ====================
router.get('/orders', getAllOrders);
router.get('/orders/:orderId', getOrderDetails);
router.put('/orders/:orderId/status', ...requirePermission('order_management'), updateOrderStatus);
router.delete('/orders/:orderId', ...requirePermission('order_management'), deleteOrder);

// ==================== FINANCIAL MANAGEMENT ====================
router.get('/financial/overview', ...requirePermission('payment_management'), getFinancialOverview);
router.get('/financial/withdrawals', ...requirePermission('payment_management'), getWithdrawalRequests);
router.put('/financial/withdrawals/:withdrawalId/approve', ...requirePermission('payment_management'), approveWithdrawal);
router.put('/financial/withdrawals/:withdrawalId/reject', ...requirePermission('payment_management'), rejectWithdrawal);

// ==================== CONTENT MANAGEMENT ====================
router.get('/content/reviews', getAllReviews);
router.put('/content/reviews/:reviewId/moderate', ...requirePermission('content_moderation'), moderateReview);
router.get('/content/sensitive-messages', ...requirePermission('content_moderation'), getSensitiveMessages);

// ==================== COMMUNICATION MANAGEMENT ====================
router.get('/communication/contacts', getContactMessages);
router.put('/communication/contacts/:contactId/read', markContactAsRead);
router.get('/conversations', getConversations);

// ==================== SYSTEM MANAGEMENT ====================
router.get('/system/health', systemHealth);
router.get('/system/logs', ...requirePermission('system_settings'), getSystemLogs);
router.get('/system/audit', ...requirePermission('system_settings'), getAuditLogs);

// ==================== PLATFORM SETTINGS ====================
router.get('/settings/vat', ...requirePermission('system_settings'), getVatSettings);

// ==================== VAT REPORTING ====================
router.get('/vat/report', ...requirePermission('payment_management'), getVatReport);
router.get('/vat/export', ...requirePermission('payment_management'), exportVatReport);


// ==================== MARKETING ====================
router.get('/marketing/newsletter', getNewsletterSubscribers);
router.get('/marketing/promotions', getPromotions);
router.put('/marketing/promotions/:promotionId/status', ...requirePermission('promotion_management'), updatePromotionStatus);

// ==================== NOTIFICATION MANAGEMENT ====================
router.get('/notifications', getNotifications);
router.post('/notifications/broadcast', ...requirePermission('user_management'), sendBroadcastNotification);

// ==================== PROJECT MANAGEMENT ====================
router.get('/projects', getProjects);
router.put('/projects/:projectId/status', ...requirePermission('content_moderation'), updateProjectStatus);

// ==================== ADMIN MANAGEMENT ====================
router.post('/admins', ...requirePermission('user_management'), createAdmin);

module.exports = router; 