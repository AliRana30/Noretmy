import React, { useContext } from 'react';
import { DarkModeContext } from '../../context/darkModeContext';

/**
 * Skeleton loader for data tables in admin panel
 */
const TableSkeleton = ({ 
  rows = 8, 
  columns = 5,
  showHeader = true,
  showSearch = true,
  className = "" 
}) => {
  const { darkMode } = useContext(DarkModeContext);
  
  const skeletonBg = darkMode ? 'bg-white/10' : 'bg-gray-200';
  const containerBg = darkMode ? 'bg-[#1a1a2e]' : 'bg-white';
  const borderColor = darkMode ? 'border-white/10' : 'border-gray-100';

  return (
    <div className={`rounded-2xl ${containerBg} border ${borderColor} shadow-sm overflow-hidden ${className}`}>
      {/* Header with title and search */}
      {showHeader && (
        <div className="p-4 border-b border-inherit">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Title skeleton */}
            <div className={`h-8 w-40 ${skeletonBg} rounded-lg animate-pulse`}></div>
            
            {/* Search and filters skeleton */}
            {showSearch && (
              <div className="flex items-center gap-3">
                <div className={`h-10 w-64 ${skeletonBg} rounded-lg animate-pulse`}></div>
                <div className={`h-10 w-24 ${skeletonBg} rounded-lg animate-pulse`}></div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Table header */}
      <div className="px-4 py-3 border-b border-inherit">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <div 
              key={`header-${i}`} 
              className={`h-4 ${skeletonBg} rounded animate-pulse`}
              style={{ width: `${100 / columns}%` }}
            ></div>
          ))}
        </div>
      </div>

      {/* Table rows */}
      <div className="divide-y divide-inherit">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="px-4 py-4">
            <div className="flex gap-4 items-center">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div 
                  key={`cell-${rowIndex}-${colIndex}`}
                  className={`h-4 ${skeletonBg} rounded animate-pulse`}
                  style={{ 
                    width: colIndex === 0 ? '15%' : `${85 / (columns - 1)}%`,
                    animationDelay: `${(rowIndex * columns + colIndex) * 50}ms`
                  }}
                ></div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination skeleton */}
      <div className="p-4 border-t border-inherit">
        <div className="flex items-center justify-between">
          <div className={`h-4 w-32 ${skeletonBg} rounded animate-pulse`}></div>
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div 
                key={`page-${i}`} 
                className={`h-8 w-8 ${skeletonBg} rounded-lg animate-pulse`}
              ></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Card-based skeleton loader for profile/detail pages
 */
export const CardSkeleton = ({ 
  showAvatar = true,
  lines = 4,
  className = "" 
}) => {
  const { darkMode } = useContext(DarkModeContext);
  
  const skeletonBg = darkMode ? 'bg-white/10' : 'bg-gray-200';
  const containerBg = darkMode ? 'bg-[#1a1a2e]' : 'bg-white';
  const borderColor = darkMode ? 'border-white/10' : 'border-gray-100';

  return (
    <div className={`rounded-2xl ${containerBg} border ${borderColor} shadow-sm p-6 ${className}`}>
      <div className="flex items-start gap-4">
        {showAvatar && (
          <div className={`w-16 h-16 ${skeletonBg} rounded-full animate-pulse flex-shrink-0`}></div>
        )}
        <div className="flex-1 space-y-3">
          <div className={`h-6 w-48 ${skeletonBg} rounded animate-pulse`}></div>
          <div className={`h-4 w-32 ${skeletonBg} rounded animate-pulse`}></div>
        </div>
      </div>
      <div className="mt-6 space-y-4">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className={`h-4 w-24 ${skeletonBg} rounded animate-pulse`}></div>
            <div 
              className={`h-4 ${skeletonBg} rounded animate-pulse`}
              style={{ width: `${40 + Math.random() * 30}%` }}
            ></div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Stats card skeleton for dashboard
 */
export const StatsSkeleton = ({ count = 4, className = "" }) => {
  const { darkMode } = useContext(DarkModeContext);
  
  const skeletonBg = darkMode ? 'bg-white/10' : 'bg-gray-200';
  const containerBg = darkMode ? 'bg-[#1a1a2e]' : 'bg-white';
  const borderColor = darkMode ? 'border-white/10' : 'border-gray-100';

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i}
          className={`rounded-2xl ${containerBg} border ${borderColor} shadow-sm p-6`}
        >
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className={`h-4 w-20 ${skeletonBg} rounded animate-pulse`}></div>
              <div className={`h-8 w-16 ${skeletonBg} rounded animate-pulse`}></div>
            </div>
            <div className={`w-12 h-12 ${skeletonBg} rounded-xl animate-pulse`}></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TableSkeleton;
