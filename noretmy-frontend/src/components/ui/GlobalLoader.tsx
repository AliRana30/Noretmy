'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';

/**
 * Global Loader System
 * =====================
 * Premium, subtle, light-theme compatible loader system
 * Features:
 * - No full-screen blocking loaders
 * - Skeleton-based loading states
 * - Keeps previous content visible
 * - Smooth fade-in transitions
 * - Top progress bar for navigation
 */

// ================== CONTEXT ==================
interface LoaderContextType {
  isNavigating: boolean;
  setNavigating: (value: boolean) => void;
  scopedLoaders: Record<string, boolean>;
  setLoading: (scope: string, isLoading: boolean) => void;
  isLoading: (scope: string) => boolean;
}

const LoaderContext = createContext<LoaderContextType | null>(null);

export const useLoader = () => {
  const context = useContext(LoaderContext);
  if (!context) {
    throw new Error('useLoader must be used within LoaderProvider');
  }
  return context;
};

// ================== PROVIDER ==================
export const LoaderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isNavigating, setNavigating] = useState(false);
  const [scopedLoaders, setScopedLoaders] = useState<Record<string, boolean>>({});

  const setLoading = useCallback((scope: string, isLoading: boolean) => {
    setScopedLoaders(prev => ({ ...prev, [scope]: isLoading }));
  }, []);

  const isLoading = useCallback((scope: string) => {
    return scopedLoaders[scope] ?? false;
  }, [scopedLoaders]);

  return (
    <LoaderContext.Provider value={{ isNavigating, setNavigating, scopedLoaders, setLoading, isLoading }}>
      <TopProgressBar isLoading={isNavigating} />
      {children}
    </LoaderContext.Provider>
  );
};

// ================== TOP PROGRESS BAR ==================
export const TopProgressBar: React.FC<{ isLoading: boolean }> = ({ isLoading }) => {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setVisible(true);
      setProgress(0);
      
      // Animate progress
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
    <div className="fixed top-0 left-0 right-0 z-[9999] h-0.5 bg-gray-100">
      <div
        className="h-full bg-gradient-to-r from-orange-400 via-orange-500 to-orange-400 transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

// ================== CONTENT OVERLAY LOADER ==================
/**
 * Overlay loader that keeps content visible with a subtle loading indicator
 * Use this to wrap content that should stay visible during loading
 */
export const ContentOverlay: React.FC<{
  isLoading: boolean;
  children: React.ReactNode;
  className?: string;
  blur?: boolean;
}> = ({ isLoading, children, className, blur = false }) => (
  <div className={cn('relative', className)}>
    {children}
    <div
      className={cn(
        'absolute inset-0 bg-white/40 flex items-center justify-center transition-all duration-200 pointer-events-none',
        blur && 'backdrop-blur-[1px]',
        isLoading ? 'opacity-100' : 'opacity-0'
      )}
    >
      {isLoading && (
        <div className="flex flex-col items-center gap-2">
          <SubtleSpinner size="lg" />
        </div>
      )}
    </div>
  </div>
);

// ================== SUBTLE SPINNER ==================
export const SubtleSpinner: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ size = 'md', className }) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-[3px]',
  };

  return (
    <div
      className={cn(
        'rounded-full border-gray-200 border-t-orange-500 animate-spin',
        sizes[size],
        className
      )}
    />
  );
};

// ================== SKELETON BASE ==================
export const Skeleton: React.FC<{
  className?: string;
  style?: React.CSSProperties;
}> = ({ className, style }) => (
  <div className={cn('animate-pulse bg-gray-200 rounded', className)} style={style} />
);

// ================== GIG CARD SKELETON ==================
export const GigCardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100', className)}>
    <Skeleton className="h-48 w-full rounded-none" />
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-3/4" />
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-5 w-20" />
      </div>
    </div>
  </div>
);

// ================== ORDER CARD SKELETON ==================
export const OrderCardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('bg-white rounded-xl shadow-sm border border-gray-100 p-4', className)}>
    <div className="flex gap-4">
      <Skeleton className="w-24 h-24 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      </div>
      <div className="text-right">
        <Skeleton className="h-6 w-16 ml-auto" />
        <Skeleton className="h-4 w-20 mt-2 ml-auto" />
      </div>
    </div>
  </div>
);

// ================== CHAT LIST SKELETON ==================
export const ChatListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div className="space-y-0 divide-y divide-gray-100">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 p-4">
        <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-12" />
          </div>
          <Skeleton className="h-3 w-3/4" />
        </div>
      </div>
    ))}
  </div>
);

// ================== MESSAGE SKELETON ==================
export const MessageSkeleton: React.FC<{ isOwn?: boolean }> = ({ isOwn = false }) => (
  <div className={cn('flex gap-3 mb-4', isOwn && 'flex-row-reverse')}>
    <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
    <div className={cn('max-w-[70%]', isOwn ? 'items-end' : 'items-start')}>
      <Skeleton 
        className={cn('h-12 rounded-2xl', isOwn ? 'rounded-br-sm' : 'rounded-bl-sm')}
        style={{ width: `${150 + Math.random() * 100}px` }}
      />
      <Skeleton className="h-2 w-12 mt-1" />
    </div>
  </div>
);

// ================== DASHBOARD STATS SKELETON ==================
export const DashboardStatsSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-4 w-16 rounded-full" />
        </div>
        <Skeleton className="h-7 w-20 mb-1" />
        <Skeleton className="h-4 w-24" />
      </div>
    ))}
  </div>
);

// ================== TABLE SKELETON ==================
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 5,
}) => (
  <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
    {/* Header */}
    <div className="flex items-center gap-4 p-4 bg-gray-50 border-b border-gray-100">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-4 border-b border-gray-100 last:border-0">
        {Array.from({ length: columns }).map((_, j) => (
          <Skeleton key={j} className="h-4 flex-1" />
        ))}
      </div>
    ))}
  </div>
);

// ================== PROFILE SKELETON ==================
export const ProfileSkeleton: React.FC = () => (
  <div className="flex items-center gap-4">
    <Skeleton className="w-16 h-16 rounded-full" />
    <div className="flex-1">
      <Skeleton className="h-5 w-32 mb-2" />
      <Skeleton className="h-4 w-24 mb-1" />
      <Skeleton className="h-3 w-48" />
    </div>
  </div>
);

// ================== GRID SKELETONS ==================
export const GigGridSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <GigCardSkeleton key={i} />
    ))}
  </div>
);

export const OrderListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <OrderCardSkeleton key={i} />
    ))}
  </div>
);

// ================== FADE IN WRAPPER ==================
/**
 * Wraps content with a smooth fade-in animation when loading completes
 */
export const FadeIn: React.FC<{
  children: React.ReactNode;
  delay?: number;
  className?: string;
}> = ({ children, delay = 0, className }) => (
  <div
    className={cn('animate-in fade-in duration-300', className)}
    style={{ animationDelay: `${delay}ms` }}
  >
    {children}
  </div>
);

// ================== SEARCH RESULTS SKELETON ==================
export const SearchResultsSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div>
        <Skeleton className="h-7 w-48 mb-2" />
        <Skeleton className="h-5 w-32" />
      </div>
      <Skeleton className="h-10 w-32 rounded-lg" />
    </div>
    
    {/* Filters */}
    <div className="flex gap-3 flex-wrap">
      <Skeleton className="h-10 w-28 rounded-full" />
      <Skeleton className="h-10 w-32 rounded-full" />
      <Skeleton className="h-10 w-24 rounded-full" />
    </div>
    
    {/* Grid */}
    <GigGridSkeleton count={8} />
  </div>
);

// ================== BUTTON LOADING STATE ==================
export const ButtonLoader: React.FC<{
  isLoading: boolean;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
}> = ({ isLoading, children, className, disabled, onClick, type = 'button' }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled || isLoading}
    className={cn(
      'relative inline-flex items-center justify-center transition-all',
      isLoading && 'cursor-wait',
      className
    )}
  >
    <span className={cn(isLoading && 'opacity-0')}>{children}</span>
    {isLoading && (
      <div className="absolute inset-0 flex items-center justify-center">
        <SubtleSpinner size="sm" />
      </div>
    )}
  </button>
);

// ================== SCOPED LOADER HOOK ==================
/**
 * Hook for managing scoped loading states
 * Usage: const { isLoading, startLoading, stopLoading } = useScopedLoader('search');
 */
export const useScopedLoader = (scope: string) => {
  const { setLoading, isLoading: checkLoading } = useLoader();
  
  return {
    isLoading: checkLoading(scope),
    startLoading: () => setLoading(scope, true),
    stopLoading: () => setLoading(scope, false),
    setLoading: (value: boolean) => setLoading(scope, value),
  };
};

export default {
  LoaderProvider,
  TopProgressBar,
  ContentOverlay,
  SubtleSpinner,
  Skeleton,
  GigCardSkeleton,
  OrderCardSkeleton,
  ChatListSkeleton,
  MessageSkeleton,
  DashboardStatsSkeleton,
  TableSkeleton,
  ProfileSkeleton,
  GigGridSkeleton,
  OrderListSkeleton,
  FadeIn,
  SearchResultsSkeleton,
  ButtonLoader,
  useLoader,
  useScopedLoader,
};
