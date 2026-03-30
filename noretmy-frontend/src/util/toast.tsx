import React from 'react';
import toast from 'react-hot-toast';

/**
 * Professional Toast Notification System using react-hot-toast
 * Provides sleek, consistent notifications integrated with the global Toaster
 */

interface ToastCustomOptions {
  duration?: number;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
}

/**
 * Show a success toast notification
 * @param message - The message to display
 * @param options - Optional configuration
 */
export const showSuccess = (message: string, options: ToastCustomOptions = {}): void => {
  toast.success(message, {
    duration: options.duration || 4000,
    position: options.position || 'top-right',
  });
};

/**
 * Show an error toast notification
 * @param message - The message to display
 * @param options - Optional configuration
 */
export const showError = (message: string, options: ToastCustomOptions = {}): void => {
  toast.error(message, {
    duration: options.duration || 4000,
    position: options.position || 'top-right',
  });
};

/**
 * Show an info toast notification
 * @param message - The message to display
 * @param options - Optional configuration
 */
export const showInfo = (message: string, options: ToastCustomOptions = {}): void => {
  toast(message, {
    icon: 'ℹ️',
    duration: options.duration || 4000,
    position: options.position || 'top-right',
  });
};

/**
 * Show a warning toast notification
 * @param message - The message to display
 * @param options - Optional configuration
 */
export const showWarning = (message: string, options: ToastCustomOptions = {}): void => {
  toast(message, {
    icon: '⚠️',
    duration: options.duration || 4000,
    position: options.position || 'top-right',
  });
};

/**
 * Professional Toast Notification System
 * Provides sleek, consistent notifications that can be customized to match your website.
 */

interface ThemeColors {
  background: string;
  textColor: string;
  successColor: string;
  errorColor: string;
  infoColor: string;
  warningColor: string;
  borderRadius: string;
  boxShadow: string;
  fontFamily: string;
}

interface ThemeConfig {
  light: ThemeColors;
  dark: ThemeColors;
}

type ToastType = 'success' | 'error' | 'info' | 'warning';

const themeConfig: ThemeConfig = {
  light: {
    background: '#ffffff',
    textColor: '#1a202c',
    successColor: '#0070f3',  // Adjust to match your brand's primary color
    errorColor: '#e53e3e',
    infoColor: '#3182ce',
    warningColor: '#dd6b20',
    borderRadius: '8px',
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.08)',
    fontFamily: 'inherit',  // Will inherit from your website
  },
  dark: {
    background: '#1a202c',
    textColor: '#f7fafc',
    successColor: '#38b2ac',
    errorColor: '#fc8181',
    infoColor: '#63b3ed',
    warningColor: '#fbd38d',
    borderRadius: '8px',
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)',
    fontFamily: 'inherit',
  }
};

const activeTheme: 'light' | 'dark' = 'light'; // or 'dark'
const theme = themeConfig[activeTheme];

const baseToastStyle: React.CSSProperties = {
  borderRadius: theme.borderRadius,
  padding: '12px 16px',
  fontWeight: '500',
  boxShadow: theme.boxShadow,
  fontFamily: theme.fontFamily,
  display: 'flex',
  alignItems: 'center',
  fontSize: '14px',
  letterSpacing: '0.2px',
};

const toastStyles: Record<ToastType, React.CSSProperties> = {
  success: {
    ...baseToastStyle,
    background: theme.background,
    color: theme.textColor,
    borderLeft: `4px solid ${theme.successColor}`,
  },
  error: {
    ...baseToastStyle,
    background: theme.background,
    color: theme.textColor,
    borderLeft: `4px solid ${theme.errorColor}`,
  },
  info: {
    ...baseToastStyle,
    background: theme.background,
    color: theme.textColor,
    borderLeft: `4px solid ${theme.infoColor}`,
  },
  warning: {
    ...baseToastStyle,
    background: theme.background,
    color: theme.textColor,
    borderLeft: `4px solid ${theme.warningColor}`,
  },
};

const toastConfig: ToastOptions = {
  position: "top-right",
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
};

interface ToastCustomOptions extends ToastOptions {
  style?: React.CSSProperties;
}

/**
 * Show a toast notification
 * @param message - The message to display
 * @param type - The type of notification: 'success', 'error', 'info', 'warning'
 * @param options - Optional override configuration
 */
export const showToast = (
  message: string, 
  type: ToastType = 'success', 
  options: ToastCustomOptions = {}
): void => {
  const style = toastStyles[type] || toastStyles.info;
  const iconColor = theme[`${type}Color` as keyof ThemeColors];
  
  const icons: Record<ToastType, string> = {
    success: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
    error: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,
    info: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`,
    warning: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
  };
  
  toast[type](
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <div 
        style={{ marginRight: '12px' }} 
        dangerouslySetInnerHTML={{ __html: icons[type] || icons.info }}
      />
      <div>{message}</div>
    </div>,
    { 
      ...toastConfig, 
      ...options, 
      style: { ...style, ...options.style }
    }
  );
};

export const showSuccess = (message: string, options: ToastCustomOptions = {}): void => 
  showToast(message, 'success', options);

export const showError = (message: string, options: ToastCustomOptions = {}): void => 
  showToast(message, 'error', options);

export const showInfo = (message: string, options: ToastCustomOptions = {}): void => 
  showToast(message, 'info', options);

export const showWarning = (message: string, options: ToastCustomOptions = {}): void => 
  showToast(message, 'warning', options);
