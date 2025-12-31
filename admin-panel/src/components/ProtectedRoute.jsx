import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user is admin (admin panel requires admin role)
  if (!isAdmin()) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        fontSize: '18px',
        color: '#dc3545',
        backgroundColor: '#1a1a2e',
        textAlign: 'center',
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: '#16213e',
          padding: '40px',
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          maxWidth: '400px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚫</div>
          <h2 style={{ color: '#fff', marginBottom: '12px' }}>Access Denied</h2>
          <p style={{ color: '#a0a0a0', marginBottom: '8px' }}>
            This area is restricted to administrators only.
          </p>
          <p style={{ color: '#a0a0a0', fontSize: '14px' }}>
            Please contact support if you believe this is an error.
          </p>
          <button 
            onClick={() => window.location.href = 'https://noretmy.com'}
            style={{
              marginTop: '24px',
              padding: '12px 32px',
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'transform 0.2s'
            }}
          >
            Return to Main Site
          </button>
        </div>
      </div>
    );
  }

  // Render children if authenticated and is admin
  return children;
};

export default ProtectedRoute; 