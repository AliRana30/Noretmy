import React, { useContext } from 'react';
import { DarkModeContext } from '../../context/darkModeContext';
import { AlertTriangle, RefreshCw, ShieldX, WifiOff, ServerCrash, Lock, AlertCircle } from 'lucide-react';

const ERROR_TYPES = {
  default: {
    icon: AlertTriangle,
    title: 'Something went wrong',
    color: 'red'
  },
  forbidden: {
    icon: ShieldX,
    title: 'Access Denied',
    color: 'orange'
  },
  network: {
    icon: WifiOff,
    title: 'Connection Error',
    color: 'blue'
  },
  server: {
    icon: ServerCrash,
    title: 'Server Error',
    color: 'red'
  },
  auth: {
    icon: Lock,
    title: 'Authentication Required',
    color: 'purple'
  },
  notFound: {
    icon: AlertCircle,
    title: 'Not Found',
    color: 'gray'
  }
};

/**
 * Professional ErrorMessage component with dark mode support
 * @param {string} message - Error message to display
 * @param {string} type - Error type: 'default' | 'forbidden' | 'network' | 'server' | 'auth' | 'notFound'
 * @param {function} onRetry - Retry callback function
 * @param {string} retryText - Text for retry button
 * @param {boolean} compact - Use compact mode
 */
const ErrorMessage = ({ 
  message = "We encountered an unexpected issue. Please try again.", 
  type = 'default',
  onRetry = null,
  retryText = "Try Again",
  className = "",
  compact = false
}) => {
  const { darkMode } = useContext(DarkModeContext);
  
  const errorType = message?.includes('403') || message?.toLowerCase().includes('forbidden') || message?.toLowerCase().includes('access denied') 
    ? 'forbidden' 
    : message?.toLowerCase().includes('network') || message?.toLowerCase().includes('connection')
    ? 'network'
    : message?.includes('500') || message?.toLowerCase().includes('server error')
    ? 'server'
    : message?.includes('401') || message?.toLowerCase().includes('unauthorized')
    ? 'auth'
    : message?.includes('404') || message?.toLowerCase().includes('not found')
    ? 'notFound'
    : type;
  
  const config = ERROR_TYPES[errorType] || ERROR_TYPES.default;
  const IconComponent = config.icon;
  
  const colorClasses = {
    red: {
      bg: darkMode ? 'bg-red-500/10' : 'bg-red-50',
      border: darkMode ? 'border-red-500/20' : 'border-red-100',
      iconBg: darkMode ? 'bg-red-500/20' : 'bg-red-100',
      iconColor: 'text-red-500',
      titleColor: 'text-red-500'
    },
    orange: {
      bg: darkMode ? 'bg-orange-500/10' : 'bg-orange-50',
      border: darkMode ? 'border-orange-500/20' : 'border-orange-100',
      iconBg: darkMode ? 'bg-orange-500/20' : 'bg-orange-100',
      iconColor: 'text-orange-500',
      titleColor: 'text-orange-500'
    },
    blue: {
      bg: darkMode ? 'bg-blue-500/10' : 'bg-blue-50',
      border: darkMode ? 'border-blue-500/20' : 'border-blue-100',
      iconBg: darkMode ? 'bg-blue-500/20' : 'bg-blue-100',
      iconColor: 'text-blue-500',
      titleColor: 'text-blue-500'
    },
    purple: {
      bg: darkMode ? 'bg-purple-500/10' : 'bg-purple-50',
      border: darkMode ? 'border-purple-500/20' : 'border-purple-100',
      iconBg: darkMode ? 'bg-purple-500/20' : 'bg-purple-100',
      iconColor: 'text-purple-500',
      titleColor: 'text-purple-500'
    },
    gray: {
      bg: darkMode ? 'bg-gray-500/10' : 'bg-gray-50',
      border: darkMode ? 'border-gray-500/20' : 'border-gray-100',
      iconBg: darkMode ? 'bg-gray-500/20' : 'bg-gray-100',
      iconColor: 'text-gray-500',
      titleColor: darkMode ? 'text-gray-300' : 'text-gray-700'
    }
  };
  
  const colors = colorClasses[config.color] || colorClasses.red;

  const getFriendlyMessage = (msg) => {
    if (msg?.includes('403') || msg?.toLowerCase().includes('forbidden')) {
      return "You don't have permission to access this resource. Please contact your administrator if you believe this is an error.";
    }
    if (msg?.includes('401') || msg?.toLowerCase().includes('unauthorized')) {
      return "Your session has expired. Please log in again to continue.";
    }
    if (msg?.includes('404') || msg?.toLowerCase().includes('not found')) {
      return "The requested resource could not be found. It may have been moved or deleted.";
    }
    if (msg?.includes('500') || msg?.toLowerCase().includes('server')) {
      return "Our servers are experiencing issues. Please try again in a few moments.";
    }
    if (msg?.toLowerCase().includes('network') || msg?.toLowerCase().includes('connection')) {
      return "Unable to connect to the server. Please check your internet connection and try again.";
    }
    return msg || "We encountered an unexpected issue. Please try again.";
  };
  
  if (compact) {
    return (
      <div className={`flex items-center gap-3 p-4 rounded-xl border ${colors.bg} ${colors.border} ${className}`}>
        <div className={`p-2 rounded-lg ${colors.iconBg}`}>
          <IconComponent className={`w-5 h-5 ${colors.iconColor}`} />
        </div>
        <div className="flex-1">
          <p className={`text-sm font-medium ${colors.titleColor}`}>{config.title}</p>
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {getFriendlyMessage(message)}
          </p>
        </div>
        {onRetry && (
          <button 
            onClick={onRetry}
            className="p-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }
  
  return (
    <div className={`flex justify-center items-center min-h-[300px] rounded-2xl border ${colors.bg} ${colors.border} ${className}`}>
      <div className="text-center p-8 max-w-md">
        <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${colors.iconBg}`}>
          <IconComponent className={`w-8 h-8 ${colors.iconColor}`} />
        </div>
        <h3 className={`text-xl font-bold mb-2 ${colors.titleColor}`}>
          {config.title}
        </h3>
        <p className={`text-sm mb-6 leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {getFriendlyMessage(message)}
        </p>
        {onRetry && (
          <button 
            onClick={onRetry} 
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl cursor-pointer text-sm font-semibold transition-all duration-200 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40"
          >
            <RefreshCw className="w-4 h-4" />
            {retryText}
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;
