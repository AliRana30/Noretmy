import axios from 'axios';
import { API_CONFIG, getApiUrl, getAuthHeaders, replaceUrlParams, FAQ_ENDPOINTS, FAQ_CATEGORIES } from '../config/api';

// Create a dedicated axios instance for admin panel
const adminAxios = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to ensure credentials are sent
adminAxios.interceptors.request.use(
  (config) => {
    // Ensure withCredentials is set for all requests
    config.withCredentials = true;
    
    // Add headers
    const headers = getAuthHeaders();
    if (headers) {
      Object.assign(config.headers, headers);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

adminAxios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't retry on 403 (forbidden) - let it fail
    if (error.response?.status === 403) {
      return Promise.reject(error);
    }

    // If error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return adminAxios(originalRequest);
        }).catch((err) => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try to refresh the session
        await adminAxios.get('/api/auth/check-session');
        
        processQueue(null, null);
        isRefreshing = false;
        return adminAxios(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        // Session truly expired, redirect to login
        localStorage.removeItem('userData');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);


// Helper function to make authenticated requests
const makeRequest = async (method, endpoint, data = null, params = {}) => {
  try {
    const url = replaceUrlParams(getApiUrl(endpoint), params);
    const config = {
      method,
      url,
      withCredentials: true,
      headers: getAuthHeaders(),
      ...(data && { data })
    };

    const response = await adminAxios(config);
    return response.data;
  } catch (error) {
    console.error(`API Error (${method} ${endpoint}):`, error);
    
    // Enhanced error handling with user-friendly messages
    if (error.response) {
      const status = error.response.status;
      const serverMessage = error.response.data?.message;
      
      // Map status codes to user-friendly messages
      if (status === 401) {
        throw new Error('Your session has expired. Please log in again.');
      } else if (status === 403) {
        throw new Error('Access denied. You don\'t have permission to perform this action.');
      } else if (status === 404) {
        throw new Error('The requested resource was not found.');
      } else if (status === 422) {
        throw new Error(serverMessage || 'Invalid data provided. Please check your input.');
      } else if (status >= 500) {
        throw new Error('Server error. Please try again later.');
      } else {
        throw new Error(serverMessage || `Request failed with status ${status}`);
      }
    } else if (error.request) {
      throw new Error('Unable to connect to the server. Please check your internet connection.');
    } else {
      throw new Error(error.message || 'An unexpected error occurred. Please try again.');
    }
  }
};

// ===== DASHBOARD & ANALYTICS =====

export const getAdminDashboardStats = async () => {
  return makeRequest('GET', API_CONFIG.ENDPOINTS.ADMIN_DASHBOARD_STATS);
};

export const getAdminAnalyticsUsers = async (period = '30d') => {
  return makeRequest('GET', `${API_CONFIG.ENDPOINTS.ADMIN_ANALYTICS_USERS}?period=${period}`);
};

export const getAdminAnalyticsRevenue = async (period = '30d') => {
  return makeRequest('GET', `${API_CONFIG.ENDPOINTS.ADMIN_ANALYTICS_REVENUE}?period=${period}`);
};

export const getAdminAnalyticsPerformance = async (period = '30d') => {
  return makeRequest('GET', `${API_CONFIG.ENDPOINTS.ADMIN_ANALYTICS_PERFORMANCE}?period=${period}`);
};

// ===== USER MANAGEMENT =====

export const getAdminUsers = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters).toString();
  const endpoint = queryParams ? `${API_CONFIG.ENDPOINTS.ADMIN_USERS}?${queryParams}` : API_CONFIG.ENDPOINTS.ADMIN_USERS;
  return makeRequest('GET', endpoint);
};

export const getAdminUserDetail = async (userId) => {
  return makeRequest('GET', API_CONFIG.ENDPOINTS.ADMIN_USER_DETAIL, null, { userId });
};

export const updateUserRole = async (userId, role, permissions = []) => {
  return makeRequest('PUT', API_CONFIG.ENDPOINTS.ADMIN_USER_ROLE, { role, permissions }, { userId });
};

export const updateUserPermissions = async (userId, permissions) => {
  return makeRequest('PUT', API_CONFIG.ENDPOINTS.ADMIN_USER_PERMISSIONS, { permissions }, { userId });
};

export const blockUser = async (userId, reason, duration = 0) => {
  return makeRequest('PUT', API_CONFIG.ENDPOINTS.ADMIN_USER_BLOCK, { reason, duration }, { userId });
};

export const unblockUser = async (userId) => {
  return makeRequest('PUT', API_CONFIG.ENDPOINTS.ADMIN_USER_UNBLOCK, null, { userId });
};

export const warnUser = async (userId, reason) => {
  return makeRequest('PUT', API_CONFIG.ENDPOINTS.ADMIN_USER_WARN, { reason }, { userId });
};

export const deleteUser = async (userId, reason = 'Deleted by admin') => {
  return makeRequest('DELETE', API_CONFIG.ENDPOINTS.ADMIN_USER_DELETE, { reason }, { userId });
};

export const bulkUserAction = async (userIds, action, data = {}) => {
  return makeRequest('POST', API_CONFIG.ENDPOINTS.ADMIN_USERS_BULK, { userIds, action, data });
};

// ===== JOB/GIG MANAGEMENT =====

export const getAdminJobs = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters).toString();
  const endpoint = queryParams ? `${API_CONFIG.ENDPOINTS.ADMIN_JOBS}?${queryParams}` : API_CONFIG.ENDPOINTS.ADMIN_JOBS;
  return makeRequest('GET', endpoint);
};

export const updateJobStatus = async (jobId, status, reason) => {
  return makeRequest('PUT', API_CONFIG.ENDPOINTS.ADMIN_JOB_STATUS, { status, reason }, { jobId });
};

export const deleteJob = async (jobId, reason) => {
  return makeRequest('DELETE', API_CONFIG.ENDPOINTS.ADMIN_JOB_DELETE, { reason }, { jobId });
};

// ===== ORDER MANAGEMENT =====

export const getAdminOrders = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters).toString();
  const endpoint = queryParams ? `${API_CONFIG.ENDPOINTS.ADMIN_ORDERS}?${queryParams}` : API_CONFIG.ENDPOINTS.ADMIN_ORDERS;
  return makeRequest('GET', endpoint);
};

export const getAdminOrderDetail = async (orderId) => {
  return makeRequest('GET', API_CONFIG.ENDPOINTS.ADMIN_ORDER_DETAIL, null, { orderId });
};

export const updateOrderStatus = async (orderId, status, adminNote) => {
  return makeRequest('PUT', API_CONFIG.ENDPOINTS.ADMIN_ORDER_STATUS, { status, adminNote }, { orderId });
};

export const deleteAdminOrder = async (orderId, reason = 'Deleted by admin') => {
  return makeRequest('DELETE', API_CONFIG.ENDPOINTS.ADMIN_ORDER_DELETE, { reason }, { orderId });
};

// ===== FINANCIAL MANAGEMENT =====

export const getAdminFinancialOverview = async (period = '30d') => {
  return makeRequest('GET', `${API_CONFIG.ENDPOINTS.ADMIN_FINANCIAL_OVERVIEW}?period=${period}`);
};

export const getAdminWithdrawals = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters).toString();
  const endpoint = queryParams ? `${API_CONFIG.ENDPOINTS.ADMIN_WITHDRAWALS}?${queryParams}` : API_CONFIG.ENDPOINTS.ADMIN_WITHDRAWALS;
  return makeRequest('GET', endpoint);
};

export const approveWithdrawal = async (withdrawalId, adminNote) => {
  return makeRequest('PUT', API_CONFIG.ENDPOINTS.ADMIN_WITHDRAWAL_APPROVE, { adminNote }, { withdrawalId });
};

export const rejectWithdrawal = async (withdrawalId, reason) => {
  return makeRequest('PUT', API_CONFIG.ENDPOINTS.ADMIN_WITHDRAWAL_REJECT, { reason }, { withdrawalId });
};

// ===== CONTENT MANAGEMENT =====

export const getAdminReviews = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters).toString();
  const endpoint = queryParams ? `${API_CONFIG.ENDPOINTS.ADMIN_REVIEWS}?${queryParams}` : API_CONFIG.ENDPOINTS.ADMIN_REVIEWS;
  return makeRequest('GET', endpoint);
};

export const moderateReview = async (reviewId, action, reason) => {
  return makeRequest('PUT', API_CONFIG.ENDPOINTS.ADMIN_REVIEW_MODERATE, { action, reason }, { reviewId });
};

export const getAdminSensitiveMessages = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters).toString();
  const endpoint = queryParams ? `${API_CONFIG.ENDPOINTS.ADMIN_SENSITIVE_MESSAGES}?${queryParams}` : API_CONFIG.ENDPOINTS.ADMIN_SENSITIVE_MESSAGES;
  return makeRequest('GET', endpoint);
};

// ===== COMMUNICATION MANAGEMENT =====

export const getAdminContacts = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters).toString();
  const endpoint = queryParams ? `${API_CONFIG.ENDPOINTS.ADMIN_CONTACTS}?${queryParams}` : API_CONFIG.ENDPOINTS.ADMIN_CONTACTS;
  return makeRequest('GET', endpoint);
};

export const markContactAsRead = async (contactId) => {
  return makeRequest('PUT', API_CONFIG.ENDPOINTS.ADMIN_CONTACT_READ, null, { contactId });
};

export const getAdminConversations = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters).toString();
  const endpoint = queryParams ? `${API_CONFIG.ENDPOINTS.ADMIN_CONVERSATIONS}?${queryParams}` : API_CONFIG.ENDPOINTS.ADMIN_CONVERSATIONS;
  return makeRequest('GET', endpoint);
};

// ===== MARKETING MANAGEMENT =====

export const getAdminNewsletter = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters).toString();
  const endpoint = queryParams ? `${API_CONFIG.ENDPOINTS.ADMIN_NEWSLETTER}?${queryParams}` : API_CONFIG.ENDPOINTS.ADMIN_NEWSLETTER;
  return makeRequest('GET', endpoint);
};

export const getAdminPromotions = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters).toString();
  const endpoint = queryParams ? `${API_CONFIG.ENDPOINTS.ADMIN_PROMOTIONS}?${queryParams}` : API_CONFIG.ENDPOINTS.ADMIN_PROMOTIONS;
  return makeRequest('GET', endpoint);
};

export const updatePromotionStatus = async (promotionId, status) => {
  return makeRequest('PUT', API_CONFIG.ENDPOINTS.ADMIN_PROMOTION_STATUS, { status }, { promotionId });
};

// ===== NOTIFICATION MANAGEMENT =====

export const getAdminNotifications = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters).toString();
  const endpoint = queryParams ? `${API_CONFIG.ENDPOINTS.ADMIN_NOTIFICATIONS}?${queryParams}` : API_CONFIG.ENDPOINTS.ADMIN_NOTIFICATIONS;
  return makeRequest('GET', endpoint);
};

export const sendBroadcastNotification = async (title, message, type, targetRole) => {
  return makeRequest('POST', API_CONFIG.ENDPOINTS.ADMIN_BROADCAST, { title, message, type, targetRole });
};

// ===== PROJECT MANAGEMENT =====

export const getAdminProjects = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters).toString();
  const endpoint = queryParams ? `${API_CONFIG.ENDPOINTS.ADMIN_PROJECTS}?${queryParams}` : API_CONFIG.ENDPOINTS.ADMIN_PROJECTS;
  return makeRequest('GET', endpoint);
};

export const updateProjectStatus = async (projectId, status, reason) => {
  return makeRequest('PUT', API_CONFIG.ENDPOINTS.ADMIN_PROJECT_STATUS, { status, reason }, { projectId });
};

// ===== SYSTEM MANAGEMENT =====

export const getSystemHealth = async () => {
  return makeRequest('GET', API_CONFIG.ENDPOINTS.ADMIN_SYSTEM_HEALTH);
};

export const getSystemLogs = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters).toString();
  const endpoint = queryParams ? `${API_CONFIG.ENDPOINTS.ADMIN_SYSTEM_LOGS}?${queryParams}` : API_CONFIG.ENDPOINTS.ADMIN_SYSTEM_LOGS;
  return makeRequest('GET', endpoint);
};

export const getSystemAudit = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters).toString();
  const endpoint = queryParams ? `${API_CONFIG.ENDPOINTS.ADMIN_SYSTEM_AUDIT}?${queryParams}` : API_CONFIG.ENDPOINTS.ADMIN_SYSTEM_AUDIT;
  return makeRequest('GET', endpoint);
};

// ===== SETTINGS =====

export const getVatSettings = async () => {
  return makeRequest('GET', API_CONFIG.ENDPOINTS.ADMIN_SETTINGS_VAT);
};

// ===== ADMIN MANAGEMENT =====

export const createAdmin = async (userData) => {
  return makeRequest('POST', API_CONFIG.ENDPOINTS.ADMIN_CREATE_ADMIN, userData);
};

// FAQ Management API Functions
export const getFaqCategories = async () => {
  try {
    const response = await adminAxios.get(`${API_CONFIG.BASE_URL}${FAQ_ENDPOINTS.GET_CATEGORIES}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching FAQ categories:", error);
    throw error;
  }
};

export const getFaqsByCategory = async (category, activeOnly = true) => {
  try {
    const response = await adminAxios.get(`${API_CONFIG.BASE_URL}${FAQ_ENDPOINTS.GET_FAQS_BY_CATEGORY}/${category}?activeOnly=${activeOnly}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching FAQs by category:", error);
    throw error;
  }
};

export const getAllFaqs = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 20,
      ...(params.category && { category: params.category }),
      ...(params.isActive !== undefined && { isActive: params.isActive }),
      ...(params.search && { search: params.search }),
      sortBy: params.sortBy || 'createdAt',
      sortOrder: params.sortOrder || 'desc'
    });

    const response = await adminAxios.get(`${API_CONFIG.BASE_URL}${FAQ_ENDPOINTS.GET_ALL_FAQS}?${queryParams}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching all FAQs:", error);
    throw error;
  }
};

export const getFaqStats = async () => {
  try {
    const response = await adminAxios.get(`${API_CONFIG.BASE_URL}${FAQ_ENDPOINTS.GET_FAQ_STATS}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching FAQ stats:", error);
    throw error;
  }
};

export const getSingleFaq = async (id) => {
  try {
    const response = await adminAxios.get(`${API_CONFIG.BASE_URL}${FAQ_ENDPOINTS.GET_SINGLE_FAQ}/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching single FAQ:", error);
    throw error;
  }
};

export const createFaq = async (faqData) => {
  try {
    const response = await adminAxios.post(`${API_CONFIG.BASE_URL}${FAQ_ENDPOINTS.CREATE_FAQ}`, faqData);
    return response.data;
  } catch (error) {
    console.error("Error creating FAQ:", error);
    throw error;
  }
};

export const updateFaq = async (id, updateData) => {
  try {
    const response = await adminAxios.put(`${API_CONFIG.BASE_URL}${FAQ_ENDPOINTS.UPDATE_FAQ}/${id}`, updateData);
    return response.data;
  } catch (error) {
    console.error("Error updating FAQ:", error);
    throw error;
  }
};

export const deleteFaq = async (id) => {
  try {
    const response = await adminAxios.delete(`${API_CONFIG.BASE_URL}${FAQ_ENDPOINTS.DELETE_FAQ}/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting FAQ:", error);
    throw error;
  }
};

export const bulkUpdateFaqs = async (faqIds, updates) => {
  try {
    const response = await adminAxios.put(`${API_CONFIG.BASE_URL}${FAQ_ENDPOINTS.UPDATE_FAQ}/bulk`, {
      faqIds,
      updates
    });
    return response.data;
  } catch (error) {
    console.error("Error bulk updating FAQs:", error);
    throw error;
  }
};

export const bulkDeleteFaqs = async (faqIds) => {
  try {
    const response = await adminAxios.delete(`${API_CONFIG.BASE_URL}${FAQ_ENDPOINTS.DELETE_FAQ}/bulk`, {
      data: { faqIds }
    });
    return response.data;
  } catch (error) {
    console.error("Error bulk deleting FAQs:", error);
    throw error;
  }
};

// Helper function to get category display name
export const getCategoryDisplayName = (categoryValue) => {
  const category = FAQ_CATEGORIES.find(cat => cat.value === categoryValue);
  return category ? category.display : categoryValue;
};

// ===== UTILITY FUNCTIONS =====

// Format currency
export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

// Format date
export const formatDate = (date, options = {}) => {
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  return new Date(date).toLocaleDateString('en-US', { ...defaultOptions, ...options });
};

// Format datetime
export const formatDateTime = (date) => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Status color helper
export const getStatusColor = (status) => {
  const statusColors = {
    active: '#28a745',
    inactive: '#6c757d',
    pending: '#ffc107',
    approved: '#28a745',
    rejected: '#dc3545',
    completed: '#28a745',
    blocked: '#dc3545',
    warned: '#fd7e14',
  };
  return statusColors[status?.toLowerCase()] || '#6c757d';
};

// ==================== BADGE MANAGEMENT ====================

// Get all seller badges with filtering
export const getAdminBadges = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  if (params.level) queryParams.append('level', params.level);
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
  if (params.search) queryParams.append('search', params.search);
  if (params.isFrozen !== undefined) queryParams.append('isFrozen', params.isFrozen);
  if (params.isOverridden !== undefined) queryParams.append('isOverridden', params.isOverridden);
  
  const url = `${API_CONFIG.ENDPOINTS.BADGE_ALL}?${queryParams.toString()}`;
  return makeRequest('GET', url);
};

// Get badge statistics
export const getAdminBadgeStats = async () => {
  return makeRequest('GET', API_CONFIG.ENDPOINTS.BADGE_STATS);
};

// Get badge audit log
export const getAdminBadgeAuditLog = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  if (params.sellerId) queryParams.append('sellerId', params.sellerId);
  
  const url = `${API_CONFIG.ENDPOINTS.BADGE_AUDIT_LOG}?${queryParams.toString()}`;
  return makeRequest('GET', url);
};

// Get detailed badge info for a seller
export const getAdminSellerBadgeDetail = async (sellerId) => {
  return makeRequest('GET', API_CONFIG.ENDPOINTS.BADGE_SELLER_DETAIL, null, { sellerId });
};

// Override seller badge level
export const overrideSellerBadge = async (sellerId, level, reason) => {
  return makeRequest('POST', API_CONFIG.ENDPOINTS.BADGE_OVERRIDE, { level, reason }, { sellerId });
};

// Remove badge override
export const removeSellerBadgeOverride = async (sellerId) => {
  return makeRequest('DELETE', API_CONFIG.ENDPOINTS.BADGE_OVERRIDE, null, { sellerId });
};

// Freeze seller badge
export const freezeSellerBadge = async (sellerId, reason) => {
  return makeRequest('POST', API_CONFIG.ENDPOINTS.BADGE_FREEZE, { reason }, { sellerId });
};

// Unfreeze seller badge
export const unfreezeSellerBadge = async (sellerId) => {
  return makeRequest('DELETE', API_CONFIG.ENDPOINTS.BADGE_FREEZE, null, { sellerId });
};

// Re-evaluate seller badge
export const reEvaluateSellerBadge = async (sellerId) => {
  return makeRequest('POST', API_CONFIG.ENDPOINTS.BADGE_RE_EVALUATE, null, { sellerId });
};

// Batch re-evaluate all badges
export const batchReEvaluateBadges = async () => {
  return makeRequest('POST', API_CONFIG.ENDPOINTS.BADGE_BATCH_RE_EVALUATE);
};

// Export axios instance for direct use if needed
export { adminAxios };

// Export all admin API functions as default
export default {
  // Dashboard & Analytics
  getAdminDashboardStats,
  getAdminAnalyticsUsers,
  getAdminAnalyticsRevenue,
  getAdminAnalyticsPerformance,
  
  // User Management
  getAdminUsers,
  getAdminUserDetail,
  updateUserRole,
  updateUserPermissions,
  blockUser,
  unblockUser,
  bulkUserAction,
  
  // Job Management
  getAdminJobs,
  updateJobStatus,
  deleteJob,
  
  // Order Management
  getAdminOrders,
  getAdminOrderDetail,
  updateOrderStatus,
  
  // Financial Management
  getAdminFinancialOverview,
  getAdminWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  
  // Content Management
  getAdminReviews,
  moderateReview,
  getAdminSensitiveMessages,
  
  // Communication Management
  getAdminContacts,
  markContactAsRead,
  getAdminConversations,
  
  // Marketing Management
  getAdminNewsletter,
  getAdminPromotions,
  updatePromotionStatus,
  
  // Notification Management
  getAdminNotifications,
  sendBroadcastNotification,
  
  // Project Management
  getAdminProjects,
  updateProjectStatus,
  
  // System Management
  getSystemHealth,
  getSystemLogs,
  getSystemAudit,
  
  // Settings
  getVatSettings,
  
  // Admin Management
  createAdmin,
  
  // Badge Management
  getAdminBadges,
  getAdminBadgeStats,
  getAdminBadgeAuditLog,
  getAdminSellerBadgeDetail,
  overrideSellerBadge,
  removeSellerBadgeOverride,
  freezeSellerBadge,
  unfreezeSellerBadge,
  reEvaluateSellerBadge,
  batchReEvaluateBadges,
  
  // FAQ Management
  getFaqCategories,
  getFaqsByCategory,
  getAllFaqs,
  getFaqStats,
  getSingleFaq,
  createFaq,
  updateFaq,
  deleteFaq,
  bulkUpdateFaqs,
  bulkDeleteFaqs,
  getCategoryDisplayName,
  
  // Utilities
  formatCurrency,
  formatDate,
  formatDateTime,
  getStatusColor,
};