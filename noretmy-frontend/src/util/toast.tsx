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
