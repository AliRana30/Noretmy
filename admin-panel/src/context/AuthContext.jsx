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
      console.error('Login error:', error);
      
      // Handle different types of errors with priority on backend messages
      if (error.code === 'ECONNABORTED') {
        setErrorKey('timeoutError');
        setError('Request timeout. Please try again.');
        return { success: false, error: 'Request timeout. Please try again.' };
      } else if (error.message.includes('Network Error')) {
        setErrorKey('networkError');
        setError('Network error. Please check your connection and try again.');
        return { success: false, error: 'Network error. Please check your connection and try again.' };
      } else if (error.response) {
        // Server responded with error status
        // Extract the actual error message from backend
        const backendMessage = error.response.data?.message || error.response.data?.error;
        const statusCode = error.response.status;
        
        let userFriendlyMessage;
        
        if (statusCode === 401) {
          // Unauthorized - invalid credentials
          userFriendlyMessage = backendMessage || 'Invalid email or password';
          setErrorKey('invalidCredentials');
        } else if (statusCode === 403) {
          // Forbidden - could be email not verified or account blocked
          userFriendlyMessage = backendMessage || 'Access denied';
          setErrorKey('accessDenied');
        } else if (statusCode === 404) {
          userFriendlyMessage = backendMessage || 'User not found';
          setErrorKey('notFound');
        } else if (statusCode >= 500) {
          userFriendlyMessage = 'Server error. Please try again later.';
          setErrorKey('serverError');
        } else {
          userFriendlyMessage = backendMessage || 'Login failed. Please try again.';
          setErrorKey('loginFailed');
        }
        
        setError(userFriendlyMessage);
        return { success: false, error: userFriendlyMessage };
      } else {
        setErrorKey('loginFailed');
        const errorMessage = error.message || 'Login failed. Please try again.';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
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