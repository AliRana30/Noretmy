import React from 'react';

/**
 * Admin Panel Skeleton Loader Components
 * Consistent skeleton loaders for all admin data loading states
 */

// Base skeleton component
export const Skeleton = ({ className = '', style = {} }) => {
  return (
    <div 
      className={`skeleton ${className}`} 
      style={{ height: '1rem', ...style }}
    />
  );
};

// Text skeleton
export const SkeletonText = ({ lines = 1, className = '' }) => {
  return (
    <div className={className}>
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i} 
          className="skeleton mb-2 last:mb-0" 
          style={{ 
            height: '0.875rem',
            width: i === lines - 1 && lines > 1 ? '60%' : '100%' 
          }}
        />
      ))}
    </div>
  );
};

// Avatar skeleton
export const SkeletonAvatar = ({ size = 'md' }) => {
  const sizes = {
    sm: '32px',
    md: '40px',
    lg: '48px',
    xl: '64px'
  };
  
  return (
    <div 
      className="skeleton rounded-full" 
      style={{ width: sizes[size], height: sizes[size] }}
    />
  );
};

// Button skeleton
export const SkeletonButton = ({ width = '100px' }) => {
  return (
    <div 
      className="skeleton" 
      style={{ height: '40px', width, borderRadius: '0.75rem' }}
    />
  );
};

// Stats card skeleton
export const SkeletonStatsCard = () => {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="skeleton" style={{ width: '48px', height: '48px', borderRadius: '0.75rem' }} />
        <div className="skeleton" style={{ width: '60px', height: '20px' }} />
      </div>
      <div className="skeleton mb-2" style={{ width: '80px', height: '0.75rem' }} />
      <div className="skeleton mb-2" style={{ width: '100px', height: '1.75rem' }} />
      <div className="skeleton" style={{ width: '60px', height: '0.625rem' }} />
    </div>
  );
};

// Stats grid skeleton
export const SkeletonStatsGrid = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonStatsCard key={i} />
      ))}
    </div>
  );
};

// Table row skeleton
export const SkeletonTableRow = ({ columns = 5 }) => {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4 border-b border-[var(--border-color)]">
          <div 
            className="skeleton" 
            style={{ 
              height: '0.875rem',
              width: `${50 + Math.random() * 50}%` 
            }}
          />
        </td>
      ))}
    </tr>
  );
};

// Table skeleton
export const SkeletonTable = ({ rows = 5, columns = 6 }) => {
  return (
    <div className="table-container">
      <table className="admin-table w-full">
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="p-4 text-left bg-[var(--gray-50)] border-b border-[var(--border-color)]">
                <div className="skeleton" style={{ width: '80px', height: '0.75rem' }} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonTableRow key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

// User list item skeleton
export const SkeletonUserItem = () => {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-[var(--border-color)]">
      <SkeletonAvatar size="md" />
      <div className="flex-1">
        <div className="skeleton mb-1" style={{ width: '120px', height: '0.875rem' }} />
        <div className="skeleton" style={{ width: '160px', height: '0.75rem' }} />
      </div>
      <div className="skeleton" style={{ width: '80px', height: '24px', borderRadius: '9999px' }} />
      <div className="skeleton" style={{ width: '60px', height: '32px', borderRadius: '0.5rem' }} />
    </div>
  );
};

// User list skeleton
export const SkeletonUserList = ({ count = 5 }) => {
  return (
    <div className="card">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonUserItem key={i} />
      ))}
    </div>
  );
};

// Order card skeleton
export const SkeletonOrderCard = () => {
  return (
    <div className="card p-4">
      <div className="flex items-start gap-4">
        <div className="skeleton" style={{ width: '80px', height: '80px', borderRadius: '0.5rem' }} />
        <div className="flex-1">
          <div className="skeleton mb-2" style={{ width: '70%', height: '1rem' }} />
          <div className="skeleton mb-2" style={{ width: '50%', height: '0.75rem' }} />
          <div className="flex gap-2">
            <div className="skeleton" style={{ width: '60px', height: '20px', borderRadius: '9999px' }} />
            <div className="skeleton" style={{ width: '80px', height: '20px', borderRadius: '9999px' }} />
          </div>
        </div>
        <div className="text-right">
          <div className="skeleton mb-2" style={{ width: '60px', height: '1.25rem' }} />
          <div className="skeleton" style={{ width: '80px', height: '0.625rem' }} />
        </div>
      </div>
    </div>
  );
};

// Orders list skeleton
export const SkeletonOrdersList = ({ count = 5 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonOrderCard key={i} />
      ))}
    </div>
  );
};

// Dashboard skeleton
export const SkeletonDashboard = () => {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <SkeletonStatsGrid count={4} />
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="skeleton mb-4" style={{ width: '120px', height: '1.25rem' }} />
          <div className="skeleton" style={{ width: '100%', height: '250px', borderRadius: '0.5rem' }} />
        </div>
        <div className="card p-6">
          <div className="skeleton mb-4" style={{ width: '120px', height: '1.25rem' }} />
          <div className="skeleton" style={{ width: '100%', height: '250px', borderRadius: '0.5rem' }} />
        </div>
      </div>
      
      {/* Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="skeleton mb-4" style={{ width: '150px', height: '1.25rem' }} />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <SkeletonAvatar size="sm" />
                <div className="flex-1">
                  <div className="skeleton mb-1" style={{ width: '80%', height: '0.875rem' }} />
                  <div className="skeleton" style={{ width: '50%', height: '0.625rem' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-6">
          <div className="skeleton mb-4" style={{ width: '150px', height: '1.25rem' }} />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <SkeletonAvatar size="sm" />
                <div className="flex-1">
                  <div className="skeleton mb-1" style={{ width: '80%', height: '0.875rem' }} />
                  <div className="skeleton" style={{ width: '50%', height: '0.625rem' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Withdrawal request skeleton
export const SkeletonWithdrawalCard = () => {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SkeletonAvatar size="md" />
          <div>
            <div className="skeleton mb-1" style={{ width: '120px', height: '0.875rem' }} />
            <div className="skeleton" style={{ width: '160px', height: '0.75rem' }} />
          </div>
        </div>
        <div className="text-right">
          <div className="skeleton mb-1" style={{ width: '80px', height: '1.25rem' }} />
          <div className="skeleton" style={{ width: '60px', height: '20px', borderRadius: '9999px' }} />
        </div>
        <div className="flex gap-2">
          <SkeletonButton width="80px" />
          <SkeletonButton width="80px" />
        </div>
      </div>
    </div>
  );
};

// Analytics card skeleton
export const SkeletonAnalyticsCard = () => {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="skeleton" style={{ width: '100px', height: '1rem' }} />
        <div className="skeleton" style={{ width: '80px', height: '24px', borderRadius: '0.375rem' }} />
      </div>
      <div className="skeleton" style={{ width: '100%', height: '200px', borderRadius: '0.5rem' }} />
    </div>
  );
};

// Content overlay loader - keeps content visible while loading
export const ContentOverlay = ({ isLoading, children, className = '' }) => {
  return (
    <div className={`relative ${className}`}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center z-10 transition-all duration-200 backdrop-blur-[1px]">
          <SubtleSpinner size="lg" />
        </div>
      )}
    </div>
  );
};

// Subtle spinner for inline loading
export const SubtleSpinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: { width: '16px', height: '16px', borderWidth: '2px' },
    md: { width: '24px', height: '24px', borderWidth: '2px' },
    lg: { width: '32px', height: '32px', borderWidth: '3px' },
  };

  return (
    <div
      className={`rounded-full animate-spin ${className}`}
      style={{
        ...sizes[size],
        borderColor: '#e5e7eb',
        borderTopColor: '#f97316',
        borderStyle: 'solid',
      }}
    />
  );
};

// Top progress bar for navigation
export const TopProgressBar = ({ isLoading }) => {
  const [progress, setProgress] = React.useState(0);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (isLoading) {
      setVisible(true);
      setProgress(0);
      const timer1 = setTimeout(() => setProgress(30), 100);
      const timer2 = setTimeout(() => setProgress(60), 500);
      const timer3 = setTimeout(() => setProgress(80), 1000);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    } else {
      setProgress(100);
      const timer = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-0.5 bg-gray-100 dark:bg-gray-800">
      <div
        className="h-full bg-gradient-to-r from-orange-400 via-orange-500 to-orange-400"
        style={{ 
          width: `${progress}%`,
          transition: 'width 0.3s ease-out'
        }}
      />
    </div>
  );
};

// Page loading wrapper
export const PageSkeleton = ({ children }) => {
  return (
    <div className="animate-pulse">
      {children}
    </div>
  );
};

export default {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonStatsCard,
  SkeletonStatsGrid,
  SkeletonTableRow,
  SkeletonTable,
  SkeletonUserItem,
  SkeletonUserList,
  SkeletonOrderCard,
  SkeletonOrdersList,
  SkeletonDashboard,
  SkeletonWithdrawalCard,
  SkeletonAnalyticsCard,
  ContentOverlay,
  SubtleSpinner,
  TopProgressBar,
  PageSkeleton
};
