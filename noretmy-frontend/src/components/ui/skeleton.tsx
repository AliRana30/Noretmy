'use client';

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Base Skeleton Component
 * Premium marketplace-level skeleton loading states
 * Light-theme friendly with subtle animations
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-gray-200', className)}
      {...props}
    />
  );
}

/**
 * Card Skeleton - For gig cards, order cards, etc.
 */
const CardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('bg-white rounded-xl border border-gray-100 overflow-hidden', className)}>
    {/* Image placeholder */}
    <Skeleton className="w-full h-48" />
    
    {/* Content */}
    <div className="p-4 space-y-3">
      {/* Title */}
      <Skeleton className="h-5 w-3/4" />
      
      {/* Description */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-6 w-16" />
      </div>
    </div>
  </div>
);

/**
 * Profile Skeleton - For user profiles, seller cards
 */
const ProfileSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('flex items-center gap-4', className)}>
    <Skeleton className="w-12 h-12 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-24" />
    </div>
  </div>
);

/**
 * Table Row Skeleton
 */
const TableRowSkeleton: React.FC<{ columns?: number; className?: string }> = ({ 
  columns = 4,
  className 
}) => (
  <div className={cn('flex items-center gap-4 p-4 border-b border-gray-100', className)}>
    {Array.from({ length: columns }).map((_, i) => (
      <Skeleton key={i} className="h-4 flex-1" />
    ))}
  </div>
);

/**
 * List Item Skeleton
 */
const ListItemSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('flex items-center gap-3 p-3', className)}>
    <Skeleton className="w-10 h-10 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  </div>
);

/**
 * Inline Loader - Small spinner for buttons and inline loading
 */
const InlineLoader: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md',
  className,
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-5 h-5 border-2',
    lg: 'w-6 h-6 border-[3px]',
  };

  return (
    <div
      className={cn(
        'rounded-full border-gray-300 border-t-orange-500 animate-spin',
        sizeClasses[size],
        className
      )}
    />
  );
};

/**
 * Page Loader - For initial page loads (use sparingly)
 */
const PageLoader: React.FC<{ message?: string }> = ({ message }) => (
  <div className="min-h-[400px] flex flex-col items-center justify-center">
    <div className="relative">
      <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-orange-500 animate-spin" />
    </div>
    {message && (
      <p className="mt-4 text-gray-500 text-sm font-medium">{message}</p>
    )}
  </div>
);

/**
 * Content Loader - Keeps previous content visible with overlay
 */
const ContentLoader: React.FC<{ 
  isLoading: boolean; 
  children: React.ReactNode;
  className?: string;
}> = ({ isLoading, children, className }) => (
  <div className={cn('relative', className)}>
    {children}
    {isLoading && (
      <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10 transition-opacity duration-200">
        <InlineLoader size="lg" />
      </div>
    )}
  </div>
);

/**
 * Progress Bar Loader - Top of page loading indicator
 */
const ProgressBar: React.FC<{ isLoading: boolean }> = ({ isLoading }) => {
  if (!isLoading) return null;
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-100 overflow-hidden">
      <div 
        className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-r-full"
        style={{ 
          width: '30%',
          animation: 'progress 1.5s ease-in-out infinite'
        }}
      />
    </div>
  );
};

/**
 * Gig Grid Skeleton - For gig listing pages
 */
const GigGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);

export { 
  Skeleton, 
  CardSkeleton, 
  ProfileSkeleton, 
  TableRowSkeleton, 
  ListItemSkeleton,
  InlineLoader,
  PageLoader,
  ContentLoader,
  ProgressBar,
  GigGridSkeleton
};
