const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getUserAnalytics,
  getRevenueAnalytics,
  getPerformanceAnalytics,
  
  getAllUsers,
  getUserDetails,
  updateUserRole,
  blockUser,
  unblockUser,
  verifyUser,
  warnUser,
  deleteUser,
  
  getAllJobs,
  updateJobStatus,
  deleteJob,
  
  getAllOrders,
  getOrderDetails,
  updateOrderStatus,
  deleteOrder,
  
  getFinancialOverview,
  getWithdrawalRequests,
  getWithdrawalRequestDetail,
  createWithdrawalRequestAdmin,
  approveWithdrawal,
  rejectWithdrawal,
  
  getAllReviews,
  moderateReview,
  getSensitiveMessages,
  
  getContactMessages,
  markContactAsRead,
  getConversations,
  
  getSystemLogs,
  getAuditLogs,
  systemHealth,
  
  getVatSettings,
  getVatReport,
  exportVatReport,
  
  getNewsletterSubscribers,
  getPromotions,
  updatePromotionStatus,
  
  getNotifications,
  markAllNotificationsAsReadAdmin,
  sendBroadcastNotification,
  
  getProjects,
  updateProjectStatus,
  
  bulkUpdateUsers,
  
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

router.use(verifyTokenEnhanced);
router.use((req, res, next) => {
  next();
});
router.use(checkRoleEnhanced(['admin'], { allowHigherRoles: false }));

router.get('/dashboard/stats', getDashboardStats);
router.get('/analytics/users', getUserAnalytics);
router.get('/analytics/revenue', ...requirePermission('analytics_view'), getRevenueAnalytics);
router.get('/analytics/performance', ...requirePermission('analytics_view'), getPerformanceAnalytics);

router.get('/users', getAllUsers);
router.get('/users/:userId', getUserDetails);
router.put('/users/:userId/role', ...requirePermission('user_management'), updateUserRole);
router.put('/users/:userId/permissions', ...requirePermission('user_management'), updateUserPermissions);
router.put('/users/:userId/block', ...requirePermission('user_management'), blockUser);
router.put('/users/:userId/unblock', ...requirePermission('user_management'), unblockUser);
router.put('/users/:userId/verify', ...requireAdmin, verifyUser);
router.put('/users/:userId/warn', ...requirePermission('user_management'), warnUser);
router.delete('/users/:userId', ...requirePermission('user_management'), deleteUser);
router.post('/users/bulk', ...requirePermission('user_management'), bulkUpdateUsers);

router.get('/jobs', getAllJobs);
router.put('/jobs/:jobId/status', ...requirePermission('content_moderation'), updateJobStatus);
router.delete('/jobs/:jobId', ...requirePermission('content_moderation'), deleteJob);

router.get('/orders', getAllOrders);
router.get('/orders/:orderId', getOrderDetails);
router.put('/orders/:orderId/status', ...requirePermission('order_management'), updateOrderStatus);
router.delete('/orders/:orderId', ...requirePermission('order_management'), deleteOrder);

router.get('/financial/overview', ...requirePermission('payment_management'), getFinancialOverview);
router.get('/financial/withdrawals', ...requirePermission('payment_management'), getWithdrawalRequests);
router.get('/financial/withdrawals/:withdrawalId', ...requirePermission('payment_management'), getWithdrawalRequestDetail);
router.post('/financial/withdrawals', ...requirePermission('payment_management'), createWithdrawalRequestAdmin);
router.put('/financial/withdrawals/:withdrawalId/approve', ...requirePermission('payment_management'), approveWithdrawal);
router.put('/financial/withdrawals/:withdrawalId/reject', ...requirePermission('payment_management'), rejectWithdrawal);

router.get('/content/reviews', getAllReviews);
router.put('/content/reviews/:reviewId/moderate', ...requirePermission('content_moderation'), moderateReview);
router.get('/content/sensitive-messages', ...requirePermission('content_moderation'), getSensitiveMessages);

router.get('/communication/contacts', getContactMessages);
router.put('/communication/contacts/:contactId/read', markContactAsRead);
router.get('/conversations', getConversations);

router.get('/system/health', systemHealth);
router.get('/system/logs', ...requirePermission('system_settings'), getSystemLogs);
router.get('/system/audit', ...requirePermission('system_settings'), getAuditLogs);

router.get('/settings/vat', ...requirePermission('system_settings'), getVatSettings);

router.get('/vat/report', ...requirePermission('payment_management'), getVatReport);
router.get('/vat/export', ...requirePermission('payment_management'), exportVatReport);

router.get('/marketing/newsletter', getNewsletterSubscribers);
router.get('/marketing/promotions', getPromotions);
router.put('/marketing/promotions/:promotionId/status', ...requirePermission('promotion_management'), updatePromotionStatus);

router.get('/notifications', getNotifications);
router.put('/notifications/mark-all-read', markAllNotificationsAsReadAdmin);
router.post('/notifications/broadcast', ...requirePermission('user_management'), sendBroadcastNotification);

router.get('/projects', getProjects);
router.put('/projects/:projectId/status', ...requirePermission('content_moderation'), updateProjectStatus);

router.post('/admins', ...requirePermission('user_management'), createAdmin);

module.exports = router; 