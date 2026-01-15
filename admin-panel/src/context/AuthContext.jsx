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

  useEffect(() => {
    const userData = localStorage.getItem('userData');
    
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
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

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);

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

      const enhancedUserData = {
        ...data,
        role: data.role || (data.isAdmin ? ROLES.ADMIN : (data.isSeller ? ROLES.FREELANCER : ROLES.CLIENT)),
        permissions: data.permissions || [],
        isAdmin: data.isAdmin || data.role === ROLES.ADMIN,
        img: data.profilePicture || data.img || "https://via.placeholder.com/150",
        token: data.token || data.accessToken || null
      };
      
      if (enhancedUserData.role !== ROLES.ADMIN && !enhancedUserData.isAdmin) {
        setErrorKey('accessDenied');
        setError('Login unsuccessful - Admin access required');
        return { success: false, error: 'Login unsuccessful - Admin access required' };
      }
      
      localStorage.setItem('userData', JSON.stringify(enhancedUserData));
      
      setUser(enhancedUserData);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.code === 'ECONNABORTED') {
        setErrorKey('timeoutError');
        setError('Request timeout. Please try again.');
        return { success: false, error: 'Request timeout. Please try again.' };
      } else if (error.message.includes('Network Error')) {
        setErrorKey('networkError');
        setError('Network error. Please check your connection and try again.');
        return { success: false, error: 'Network error. Please check your connection and try again.' };
      } else if (error.response) {
        const backendMessage = error.response.data?.message || error.response.data?.error;
        const statusCode = error.response.status;
        
        let userFriendlyMessage;
        
        if (statusCode === 401) {
          userFriendlyMessage = backendMessage || 'Invalid email or password';
          setErrorKey('invalidCredentials');
        } else if (statusCode === 403) {
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

  const logout = () => {
    localStorage.removeItem('userData');
    setUser(null);
    setError(null);
  };

  const isAuthenticated = () => {
    return !!user && !!localStorage.getItem('userData');
  };

  const isAdmin = () => {
    return user && (user.isAdmin || user.role === ROLES.ADMIN);
  };

  const hasRole = (role) => {
    return user && user.role === role;
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    if (isAdmin()) return true;
    return user.permissions && user.permissions.includes(permission);
  };

  const hasAnyPermission = (permissions) => {
    if (!user) return false;
    if (isAdmin()) return true;
    return permissions.some(permission => hasPermission(permission));
  };

  const getUser = () => {
    return user;
  };

  const getUserRole = () => {
    return user ? user.role : null;
  };

  const getUserPermissions = () => {
    return user ? user.permissions || [] : [];
  };

  const clearError = () => {
    setError(null);
    setErrorKey(null);
  };

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
    ROLES,
    PERMISSIONS
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 