import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_CONFIG, getApiUrl, ROLES, PERMISSIONS } from '../config/api';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorKey, setErrorKey] = useState(null);

  // Check if user is already logged in on app start
  useEffect(() => {
    const userData = localStorage.getItem('userData');
    
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        // Ensure user has required properties for role-based access
        const enhancedUser = {
          ...parsedUser,
          role: parsedUser.role || (parsedUser.isAdmin ? ROLES.ADMIN : ROLES.CLIENT),
          permissions: parsedUser.permissions || [],
          isAdmin: parsedUser.isAdmin || parsedUser.role === ROLES.ADMIN
        };
        setUser(enhancedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('userData');
      }
    }
    setLoading(false);
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      // Use axios with withCredentials for proper cookie handling
      const response = await axios.post(getApiUrl(API_CONFIG.ENDPOINTS.LOGIN), {
        email,
        password
      }, {
        withCredentials: true,
        timeout: API_CONFIG.TIMEOUT,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = response.data;

      if (response.status !== 200) {
        throw new Error(data.message || 'Login failed');
      }

      // Handle the response format and enhance with role information
      // Expected response format:
      // {
      //   "id": "67f90e632fa9bc5352ddfb96",
      //   "fullName": "Waleed Ahmad",
      //   "email": "waleedahmad1806@gmail.com",
      //   "username": "waleed18122",
      //   "isSeller": false,
      //   "profilePicture": "https://via.placeholder.com/150",
      //   "documentStatus": "none",
      //   "role": "admin", // This should come from backend
      //   "permissions": ["user_management", "order_management"] // This should come from backend
      // }
      
      const enhancedUserData = {
        ...data,
        // Default role assignment if not provided by backend
        role: data.role || (data.isAdmin ? ROLES.ADMIN : (data.isSeller ? ROLES.FREELANCER : ROLES.CLIENT)),
        permissions: data.permissions || [],
        isAdmin: data.isAdmin || data.role === ROLES.ADMIN,
        img: data.profilePicture || data.img || "https://via.placeholder.com/150",
        // Ensure token is preserved if it exists at the top level, otherwise try to extract it
        token: data.token || data.accessToken || null
      };
      
      // Check if user has admin role - only admins can access admin panel
      if (enhancedUserData.role !== ROLES.ADMIN && !enhancedUserData.isAdmin) {
        setErrorKey('accessDenied');
        setError('Login unsuccessful - Admin access required');
        return { success: false, error: 'Login unsuccessful - Admin access required' };
      }
      
      // Store enhanced user data
      localStorage.setItem('userData', JSON.stringify(enhancedUserData));
      
      setUser(enhancedUserData);
      return { success: true };
    } catch (error) {
      // Handle different types of errors
      if (error.code === 'ECONNABORTED') {
        setErrorKey('timeoutError');
        setError('Request timeout. Please try again.');
      } else if (error.message.includes('Network Error')) {
        setErrorKey('networkError');
        setError('Network error. Please check your connection and try again.');
      } else if (error.response) {
        // Server responded with error status
        const statusCode = error.response.status;
        const errorMessage = error.response.data?.message || error.response.data?.error || `Server error: ${statusCode}`;
        
        // Set specific error keys based on status code
        if (statusCode === 401) {
          setErrorKey('invalidCredentials');
          setError('Invalid email or password');
        } else if (statusCode === 403) {
          setErrorKey('accessDenied');
          setError('Access denied');
        } else if (statusCode === 404) {
          setErrorKey('notFound');
          setError('User not found');
        } else if (statusCode >= 500) {
          setErrorKey('serverError');
          setError('Server error. Please try again later.');
        } else {
          setErrorKey('loginFailed');
          setError(errorMessage);
        }
      } else {
        setErrorKey('loginFailed');
        setError(error.message || 'Login failed. Please try again.');
      }
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('userData');
    setUser(null);
    setError(null);
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!user && !!localStorage.getItem('userData');
  };

  // Check if user is admin
  const isAdmin = () => {
    return user && (user.isAdmin || user.role === ROLES.ADMIN);
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return user && user.role === role;
  };

  // Check if user has specific permission
  const hasPermission = (permission) => {
    if (!user) return false;
    // Admins have all permissions
    if (isAdmin()) return true;
    return user.permissions && user.permissions.includes(permission);
  };

  // Check if user has any of the specified permissions
  const hasAnyPermission = (permissions) => {
    if (!user) return false;
    // Admins have all permissions
    if (isAdmin()) return true;
    return permissions.some(permission => hasPermission(permission));
  };

  // Get user data
  const getUser = () => {
    return user;
  };

  // Get user role
  const getUserRole = () => {
    return user ? user.role : null;
  };

  // Get user permissions
  const getUserPermissions = () => {
    return user ? user.permissions || [] : [];
  };

  // Clear error
  const clearError = () => {
    setError(null);
    setErrorKey(null);
  };

  // Update user data (useful for refreshing user info without re-login)
  const updateUser = (userData) => {
    const enhancedUserData = {
      ...user,
      ...userData,
      isAdmin: userData.isAdmin || userData.role === ROLES.ADMIN
    };
    localStorage.setItem('userData', JSON.stringify(enhancedUserData));
    setUser(enhancedUserData);
  };

  const value = {
    user,
    loading,
    error,
    errorKey,
    login,
    logout,
    isAuthenticated,
    isAdmin,
    hasRole,
    hasPermission,
    hasAnyPermission,
    getUser,
    getUserRole,
    getUserPermissions,
    updateUser,
    clearError,
    // Export roles and permissions for convenience
    ROLES,
    PERMISSIONS
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 