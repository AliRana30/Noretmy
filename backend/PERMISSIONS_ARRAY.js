// 🔐 **ALL ACCESS PERMISSIONS ARRAY**

// ==================== PERMISSION STRINGS ====================

/**
 * Core permission strings used throughout the application
 * These are stored in the user.permissions array in the database
 */
const PERMISSIONS = [
  'user_management',        // Manage users, roles, permissions, blocking/unblocking
  'order_management',       // Manage orders, update order status, view all orders
  'payment_management',     // Financial oversight, withdrawals, revenue management
  'system_settings',        // Platform configuration, VAT settings, system logs
  'analytics_view',         // View analytics, reports, dashboard statistics
  'content_moderation',     // Moderate content, reviews, jobs, messages, projects
  'content_management',     // Manage FAQs, content creation and editing
  'seller_management',      // Freelancer-specific management and oversight
  'promotion_management'    // Marketing, promotions, campaigns management
];

// ==================== ROLE STRINGS ====================

/**
 * User role strings
 */
const ROLES = [
  'admin',          // Highest level - full access to everything
  'freelancer',     // Service providers (previously isSeller: true)
  'client'          // Service buyers (previously isSeller: false)
];

// ==================== ADMIN ROUTE PERMISSIONS MAPPING ====================

/**
 * Mapping of admin routes to required permissions
 * Format: { route: [required_permissions] }
 */
const ADMIN_ROUTE_PERMISSIONS = {
  // Dashboard & Analytics
  '/admin/dashboard/stats': [],                           // Admin only
  '/admin/analytics/users': [],                           // Admin only
  '/admin/analytics/revenue': ['analytics_view'],         // Admin + analytics permission
  '/admin/analytics/performance': ['analytics_view'],     // Admin + analytics permission

  // User Management
  '/admin/users': [],                                     // Admin only
  '/admin/users/:userId': [],                             // Admin only
  '/admin/users/:userId/role': ['user_management'],       // Admin + user management
  '/admin/users/:userId/permissions': ['user_management'], // Admin + user management
  '/admin/users/:userId/block': ['user_management'],      // Admin + user management
  '/admin/users/:userId/unblock': ['user_management'],    // Admin + user management
  '/admin/users/bulk': ['user_management'],               // Admin + user management

  // Job/Gig Management
  '/admin/jobs': [],                                      // Admin only
  '/admin/jobs/:jobId/status': ['content_moderation'],    // Admin + content moderation
  '/admin/jobs/:jobId': ['content_moderation'],           // Admin + content moderation (DELETE)

  // Order Management
  '/admin/orders': [],                                    // Admin only
  '/admin/orders/:orderId': [],                           // Admin only
  '/admin/orders/:orderId/status': ['order_management'],  // Admin + order management

  // Financial Management
  '/admin/financial/overview': ['payment_management'],               // Admin + payment management
  '/admin/financial/withdrawals': ['payment_management'],            // Admin + payment management
  '/admin/financial/withdrawals/:withdrawalId/approve': ['payment_management'], // Admin + payment management
  '/admin/financial/withdrawals/:withdrawalId/reject': ['payment_management'],  // Admin + payment management

  // Content Management
  '/admin/content/reviews': [],                                      // Admin only
  '/admin/content/reviews/:reviewId/moderate': ['content_moderation'], // Admin + content moderation
  '/admin/content/sensitive-messages': ['content_moderation'],        // Admin + content moderation

  // Communication Management
  '/admin/communication/contacts': [],                               // Admin only
  '/admin/communication/contacts/:contactId/read': [],               // Admin only
  '/admin/conversations': [],                                        // Admin only

  // System Management
  '/admin/system/health': [],                             // Admin only
  '/admin/system/logs': ['system_settings'],             // Admin + system settings
  '/admin/system/audit': ['system_settings'],            // Admin + system settings

  // Platform Settings
  '/admin/settings/vat': ['system_settings'],            // Admin + system settings

  // Marketing
  '/admin/marketing/newsletter': [],                      // Admin only
  '/admin/marketing/promotions': [],                      // Admin only
  '/admin/marketing/promotions/:promotionId/status': ['promotion_management'], // Admin + promotion management

  // Notification Management
  '/admin/notifications': [],                             // Admin only
  '/admin/notifications/broadcast': ['user_management'],  // Admin + user management

  // Project Management
  '/admin/projects': [],                                  // Admin only
  '/admin/projects/:projectId/status': ['content_moderation'], // Admin + content moderation

  // Admin Management
  '/admin/admins': ['user_management'],                   // Admin + user management

  // FAQ Management
  '/faq/categories': [],                                   // Public endpoint
  '/faq/category/:category': [],                           // Public endpoint
  '/faq': ['content_management'],                         // Admin + content management
  '/faq/stats': ['content_management'],                   // Admin + content management
  '/faq/:id': ['content_management']                      // Admin + content management (handles single & bulk)
};

// ==================== CLIENT-SIDE ROLE CHECKING ARRAYS ====================

/**
 * Arrays for frontend role-based access control
 */

// User roles for client-side checking
const CLIENT_ROLES = {
  ADMIN: 'admin',
  FREELANCER: 'freelancer',
  CLIENT: 'client'
};

// Legacy compatibility mapping
const LEGACY_ROLES = {
  SELLER: 'freelancer',    // isSeller: true
  BUYER: 'client'          // isSeller: false
};

// Role hierarchy levels (higher number = more access)
const ROLE_HIERARCHY = {
  'admin': 3,
  'freelancer': 2,
  'client': 1
};

// ==================== FRONTEND ROUTE PERMISSIONS ====================

/**
 * Client-side route permissions by role
 */
const FRONTEND_ROUTES = {
  // Common routes (all authenticated users)
  common: [
    '/profile',
    '/orders',
    '/messages',
    '/notifications',
    '/settings'
  ],

  // Admin routes (admin only)
  admin: [
    '/admin',
    '/admin/dashboard',
    '/admin/users',
    '/admin/jobs',
    '/admin/orders',
    '/admin/financial',
    '/admin/content',
    '/admin/system',
    '/admin/marketing',
    '/admin/settings',
    '/admin/faq'
  ],

  // Freelancer routes
  freelancer: [
    '/dashboard/freelancer',
    '/my-gigs',
    '/create-gig',
    '/earnings',
    '/withdrawals',
    '/freelancer-settings',
    '/portfolio',
    '/skills-management'
  ],

  // Client routes
  client: [
    '/dashboard/client',
    '/browse-services',
    '/my-purchases',
    '/favorites',
    '/client-settings',
    '/project-requirements'
  ]
};

// ==================== MIDDLEWARE ACCESS LEVELS ====================

/**
 * Middleware function names and their access requirements
 */
const MIDDLEWARE_ACCESS = {
  // Authentication middleware
  verifyToken: [],                          // Legacy - basic auth
  verifyTokenEnhanced: [],                  // Enhanced auth with role info
  
  // Role-based middleware
  requireAdmin: ['admin'],                  // Admin only
  requireUser: ['freelancer', 'client'],    // Users only (no admin)
  requireFreelancer: ['freelancer'],        // Freelancer + Admin
  requireClient: ['client'],                // Client + Admin
  requireAuthenticated: ['admin', 'freelancer', 'client'], // Any authenticated user
  
  // Legacy compatibility
  requireFreelancerOrAdmin: ['freelancer', 'admin'],
  requireClientOrAdmin: ['client', 'admin'],
  
  // Permission-based (requires specific permissions)
  requirePermission: [], // Dynamic - depends on permission passed
  requireOwnershipOrAdmin: [], // Resource ownership or admin
  
  // Rate limiting by role
  rateLimitByRole: {
    admin: 1000,      // High limit for admins
    freelancer: 100,  // Medium limit for freelancers
    client: 50,       // Lower limit for clients
    default: 10       // Very low limit for unauthenticated
  }
};

// ==================== STATUS ARRAYS ====================

/**
 * Various status strings used throughout the application
 */

// User status options
const USER_STATUS = [
  'Active',
  'Pending',
  'Blocked',
  'Warned',
  'Suspended'
];

// Job/Gig status options
const JOB_STATUS = [
  'active',
  'inactive', 
  'pending',
  'approved',
  'rejected',
  'suspended'
];

// Order status options
const ORDER_STATUS = [
  'pending',
  'in_progress',
  'completed',
  'cancelled',
  'refunded',
  'disputed'
];

// Withdrawal status options
const WITHDRAWAL_STATUS = [
  'pending',
  'approved',
  'rejected',
  'completed',
  'cancelled'
];

// Review moderation actions
const REVIEW_ACTIONS = [
  'approve',
  'hide',
  'delete'
];

// Notification types
const NOTIFICATION_TYPES = [
  'info',
  'warning',
  'error',
  'success'
];

// ==================== API ENDPOINT ARRAYS ====================

/**
 * All admin API endpoints for reference
 */
const ADMIN_ENDPOINTS = [
  // Dashboard & Analytics
  'GET /api/admin/dashboard/stats',
  'GET /api/admin/analytics/users',
  'GET /api/admin/analytics/revenue',
  'GET /api/admin/analytics/performance',

  // User Management
  'GET /api/admin/users',
  'GET /api/admin/users/:userId',
  'PUT /api/admin/users/:userId/role',
  'PUT /api/admin/users/:userId/permissions',
  'PUT /api/admin/users/:userId/block',
  'PUT /api/admin/users/:userId/unblock',
  'POST /api/admin/users/bulk',

  // Job/Gig Management
  'GET /api/admin/jobs',
  'PUT /api/admin/jobs/:jobId/status',
  'DELETE /api/admin/jobs/:jobId',

  // Order Management
  'GET /api/admin/orders',
  'GET /api/admin/orders/:orderId',
  'PUT /api/admin/orders/:orderId/status',

  // Financial Management
  'GET /api/admin/financial/overview',
  'GET /api/admin/financial/withdrawals',
  'PUT /api/admin/financial/withdrawals/:withdrawalId/approve',
  'PUT /api/admin/financial/withdrawals/:withdrawalId/reject',

  // Content Management
  'GET /api/admin/content/reviews',
  'PUT /api/admin/content/reviews/:reviewId/moderate',
  'GET /api/admin/content/sensitive-messages',

  // Communication Management
  'GET /api/admin/communication/contacts',
  'PUT /api/admin/communication/contacts/:contactId/read',
  'GET /api/admin/conversations',

  // System Management
  'GET /api/admin/system/health',
  'GET /api/admin/system/logs',
  'GET /api/admin/system/audit',

  // Platform Settings
  'GET /api/admin/settings/vat',

  // Marketing
  'GET /api/admin/marketing/newsletter',
  'GET /api/admin/marketing/promotions',
  'PUT /api/admin/marketing/promotions/:promotionId/status',

  // Notification Management
  'GET /api/admin/notifications',
  'POST /api/admin/notifications/broadcast',

  // Project Management
  'GET /api/admin/projects',
  'PUT /api/admin/projects/:projectId/status',

  // Admin Management
  'POST /api/admin/admins',

  // FAQ Management
  'GET /api/faq/categories',
  'GET /api/faq/category/:category',
  'GET /api/faq',
  'GET /api/faq/stats',
  'GET /api/faq/:id',
  'POST /api/faq',
  'PUT /api/faq/:id',
  'DELETE /api/faq/:id'
];

// ==================== EXPORTS ====================

module.exports = {
  // Core permission and role arrays
  PERMISSIONS,
  ROLES,
  CLIENT_ROLES,
  LEGACY_ROLES,
  ROLE_HIERARCHY,
  
  // Route and access mappings
  ADMIN_ROUTE_PERMISSIONS,
  FRONTEND_ROUTES,
  MIDDLEWARE_ACCESS,
  
  // Status arrays
  USER_STATUS,
  JOB_STATUS,
  ORDER_STATUS,
  WITHDRAWAL_STATUS,
  REVIEW_ACTIONS,
  NOTIFICATION_TYPES,
  
  // API reference
  ADMIN_ENDPOINTS
};

// ==================== USAGE EXAMPLES ====================

/**
 * Example usage in frontend:
 * 
 * import { PERMISSIONS, ROLES, CLIENT_ROLES } from './PERMISSIONS_ARRAY';
 * 
 * // Check if user has permission
 * const hasPermission = user.permissions.includes(PERMISSIONS[0]); // 'user_management'
 * 
 * // Check user role
 * const isFreelancer = user.role === CLIENT_ROLES.FREELANCER;
 * 
 * // Get all permissions for dropdown
 * const permissionOptions = PERMISSIONS.map(perm => ({ value: perm, label: perm }));
 */

/**
 * Example usage in backend middleware:
 * 
 * const { PERMISSIONS, ROLES } = require('./PERMISSIONS_ARRAY');
 * 
 * // Check permission in middleware
 * const hasRequiredPermission = user.permissions.includes(PERMISSIONS[0]);
 * 
 * // Validate role
 * const isValidRole = ROLES.includes(requestedRole);
 */ 