// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  FRONTEND_URL: import.meta.env.VITE_FRONTEND_URL || 'http://localhost:3000',
  ENDPOINTS: {

    // Authentication
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    USER_PROFILE: '/api/user/profile',
    
    // Admin Dashboard & Analytics
    ADMIN_DASHBOARD_STATS: '/api/admin/dashboard/stats',
    ADMIN_ANALYTICS_USERS: '/api/admin/analytics/users',
    ADMIN_ANALYTICS_REVENUE: '/api/admin/analytics/revenue',
    ADMIN_ANALYTICS_PERFORMANCE: '/api/admin/analytics/performance',
    
    // Admin User Management
    ADMIN_USERS: '/api/admin/users',
    ADMIN_USER_DETAIL: '/api/admin/users/:userId',
    ADMIN_USER_ROLE: '/api/admin/users/:userId/role',
    ADMIN_USER_PERMISSIONS: '/api/admin/users/:userId/permissions',
    ADMIN_USER_BLOCK: '/api/admin/users/:userId/block',
    ADMIN_USER_UNBLOCK: '/api/admin/users/:userId/unblock',
    ADMIN_USER_WARN: '/api/admin/users/:userId/warn',
    ADMIN_USER_DELETE: '/api/admin/users/:userId',
    ADMIN_USERS_BULK: '/api/admin/users/bulk',
    
    // Admin Job/Gig Management
    ADMIN_JOBS: '/api/admin/jobs',
    ADMIN_JOB_STATUS: '/api/admin/jobs/:jobId/status',
    ADMIN_JOB_DELETE: '/api/admin/jobs/:jobId',
    
    // Admin Order Management
    ADMIN_ORDERS: '/api/admin/orders',
    ADMIN_ORDER_DETAIL: '/api/admin/orders/:orderId',
    ADMIN_ORDER_STATUS: '/api/admin/orders/:orderId/status',
    ADMIN_ORDER_DELETE: '/api/admin/orders/:orderId',
    
    // Admin Financial Management
    ADMIN_FINANCIAL_OVERVIEW: '/api/admin/financial/overview',
    ADMIN_WITHDRAWALS: '/api/withdraw',
    ADMIN_WITHDRAWAL_APPROVE: '/api/withdraw/:withdrawalId/approve',
    ADMIN_WITHDRAWAL_REJECT: '/api/withdraw/reject',
    
    // Admin Content Management
    ADMIN_REVIEWS: '/api/admin/content/reviews',
    ADMIN_REVIEW_MODERATE: '/api/admin/content/reviews/:reviewId/moderate',
    ADMIN_SENSITIVE_MESSAGES: '/api/admin/content/sensitive-messages',
    
    // Admin Communication Management
    ADMIN_CONTACTS: '/api/admin/communication/contacts',
    ADMIN_CONTACT_READ: '/api/admin/communication/contacts/:contactId/read',
    ADMIN_CONVERSATIONS: '/api/admin/conversations',
    
    // Admin Marketing Management
    ADMIN_NEWSLETTER: '/api/admin/marketing/newsletter',
    ADMIN_PROMOTIONS: '/api/admin/marketing/promotions',
    ADMIN_PROMOTION_STATUS: '/api/admin/marketing/promotions/:promotionId/status',
    
    // Admin Notification Management
    ADMIN_NOTIFICATIONS: '/api/admin/notifications',
    ADMIN_BROADCAST: '/api/admin/notifications/broadcast',
    
    // Admin Project Management
    ADMIN_PROJECTS: '/api/admin/projects',
    ADMIN_PROJECT_STATUS: '/api/admin/projects/:projectId/status',
    
    // Admin System Management
    ADMIN_SYSTEM_HEALTH: '/api/admin/system/health',
    ADMIN_SYSTEM_LOGS: '/api/admin/system/logs',
    ADMIN_SYSTEM_AUDIT: '/api/admin/system/audit',
    
    // Admin Settings
    ADMIN_SETTINGS_VAT: '/api/admin/settings/vat',
    
    // Admin Management
    ADMIN_CREATE_ADMIN: '/api/admin/admins',
    
    // Badge Management
    BADGE_ALL: '/api/badges/admin/all',
    BADGE_STATS: '/api/badges/admin/stats',
    BADGE_AUDIT_LOG: '/api/badges/admin/audit-log',
    BADGE_SELLER_DETAIL: '/api/badges/admin/seller/:sellerId',
    BADGE_OVERRIDE: '/api/badges/admin/seller/:sellerId/override',
    BADGE_FREEZE: '/api/badges/admin/seller/:sellerId/freeze',
    BADGE_RE_EVALUATE: '/api/badges/admin/seller/:sellerId/re-evaluate',
    BADGE_BATCH_RE_EVALUATE: '/api/badges/admin/batch-re-evaluate',
    
    // Regular API Endpoints (for backward compatibility)
    USERS: '/api/users',
    VERIFIED_SELLERS: '/api/users/verified-sellers',
    ORDERS: '/api/orders',
    JOBS: '/api/job',
    MESSAGES: '/api/messages',
    SENSITIVE_MESSAGES: '/api/messages/sensitive-messages',
    CONTACTS: '/api/contact',
    WITHDRAWALS: '/api/withdraw',
    NOTIFICATIONS: '/api/notification',
    FAQS: '/api/content/faqs',
    PRIVACY_POLICY: '/api/content/privacy',
    TERMS_OF_SERVICE: '/api/content/terms'
  },
  TIMEOUT: 10000, // 10 seconds
  HEADERS: {
    'Content-Type': 'application/json',
  },
};

// Helper function to get full API URL
export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to get auth headers
export const getAuthHeaders = () => {
  const userData = localStorage.getItem('userData');
  let token = null;
  
  if (userData) {
    try {
      const parsedUser = JSON.parse(userData);
      token =
        parsedUser.token ||
        parsedUser.accessToken ||
        parsedUser?.data?.token ||
        parsedUser?.data?.accessToken ||
        parsedUser?.user?.token ||
        parsedUser?.user?.accessToken;
    } catch (e) {
      console.error('Error parsing userData for token:', e);
    }
  }

  // Only add Authorization header if token exists and is a non-empty string
  const authHeader = (token && typeof token === 'string' && token.trim().length > 0) 
    ? { 'Authorization': `Bearer ${token}` } 
    : {};

  return {
    ...API_CONFIG.HEADERS,
    ...authHeader
  };
};

// Helper function to replace URL parameters
export const replaceUrlParams = (endpoint, params) => {
  let url = endpoint;
  Object.keys(params).forEach(key => {
    url = url.replace(`:${key}`, params[key]);
  });
  return url;
};

// Role definitions
export const ROLES = {
  ADMIN: 'admin',
  FREELANCER: 'freelancer', 
  CLIENT: 'client'
};

// Permission definitions
export const PERMISSIONS = [
  'user_management',
  'order_management', 
  'payment_management',
  'system_settings',
  'analytics_view',
  'content_moderation',
  'seller_management',
  'promotion_management'
]; 

// FAQ Management Endpoints
export const FAQ_ENDPOINTS = {
  // Public endpoints
  GET_CATEGORIES: '/api/faq/categories',
  GET_FAQS_BY_CATEGORY: '/api/faq/category',
  
  // Admin endpoints
  GET_ALL_FAQS: '/api/faq',
  GET_FAQ_STATS: '/api/faq/stats',
  GET_SINGLE_FAQ: '/api/faq',
  CREATE_FAQ: '/api/faq',
  UPDATE_FAQ: '/api/faq',
  DELETE_FAQ: '/api/faq',
};

// FAQ Categories
export const FAQ_CATEGORIES = [
  { value: 'Promotional_Plans', display: 'Promotional Plans' },
  { value: 'Service_Management', display: 'Service Management' },
  { value: 'Buying_Services', display: 'Buying Services' },
  { value: 'Account_Profile', display: 'Account & Profile' },
  { value: 'Withdrawals_Fees', display: 'Withdrawals & Fees' },
  { value: 'Commission_Fees', display: 'Commission & Fees' },
  { value: 'VAT_Taxes', display: 'VAT & Taxes' },
  { value: 'General', display: 'General' },
  { value: 'Privacy_Security', display: 'Privacy & Security' },
  { value: 'Disputes_Conflict_Resolution', display: 'Disputes & Conflict Resolution' },
  { value: 'Platform_Policies_Guidelines', display: 'Platform Policies & Guidelines' },
  { value: 'Technical_Support_Troubleshooting', display: 'Technical Support & Troubleshooting' },
  { value: 'Community_Support', display: 'Community & Support' },
  { value: 'Pricing_Fees', display: 'Pricing & Fees' },
  { value: 'Payments_Withdrawals', display: 'Payments & Withdrawals' },
  { value: 'Client_Services', display: 'Client Services' },
  { value: 'Service_Pricing', display: 'Service Pricing' },
  { value: 'Quality_Standards', display: 'Quality Standards' },
  { value: 'Freelancer', display: 'Freelancer' },
  { value: 'Account_Management', display: 'Account Management' },
  { value: 'Refund_Policy', display: 'Refund Policy' },
  { value: 'Intellectual_Property', display: 'Intellectual Property' },
  { value: 'Project_Management', display: 'Project Management' },
  { value: 'Feedback', display: 'Feedback' },
  { value: 'Support', display: 'Support' },
  { value: 'Clients', display: 'Clients' }
]; 