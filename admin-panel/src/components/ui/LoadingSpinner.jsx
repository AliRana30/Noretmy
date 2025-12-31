import React, { useContext } from 'react';
import { DarkModeContext } from '../../context/darkModeContext';

/**
 * Reusable LoadingSpinner component with dark mode support
 */
const LoadingSpinner = ({ 
  message = "Loading...", 
  size = "medium", 
  fullScreen = false,
  className = "" 
}) => {
  const { darkMode } = useContext(DarkModeContext);
  
  const sizeClasses = {
    small: "w-6 h-6 border-2",
    medium: "w-12 h-12 border-4", 
    large: "w-16 h-16 border-4"
  };

  const containerClass = fullScreen 
    ? `fixed inset-0 flex justify-center items-center z-[9999] ${
        darkMode ? 'bg-[#0f0f23]/90' : 'bg-white/90'
      } backdrop-blur-sm ${className}` 
    : `flex justify-center items-center min-h-[300px] rounded-2xl my-5 ${
        darkMode ? 'bg-[#1a1a2e]/80 border border-white/10' : 'bg-white border border-gray-100 shadow-lg'
      } ${className}`;

  return (
    <div className={containerClass}>
      <div className="text-center">
        <div className={`
          border-4 rounded-full animate-spin mx-auto mb-4
          ${sizeClasses[size]}
          ${darkMode 
            ? 'border-white/10 border-t-orange-500' 
            : 'border-gray-200 border-t-orange-500'
          }
        `}></div>
        <p className={`text-base font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {message}
        </p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
