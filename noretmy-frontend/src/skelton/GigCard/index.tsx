import React from 'react';

const GigCardSkeleton = () => {
  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100 animate-pulse">
      {/* Image Skeleton */}
      <div className="relative h-48 bg-gray-200">
        <div className="absolute top-3 left-3 h-6 w-20 bg-gray-300 rounded-full"></div>
        <div className="absolute top-3 right-3 h-8 w-8 bg-gray-300 rounded-full"></div>
      </div>
      
      {/* Content Skeleton */}
      <div className="p-4">
        {/* Seller Info */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 w-24 bg-gray-200 rounded mb-1"></div>
            <div className="h-3 w-16 bg-gray-200 rounded"></div>
          </div>
        </div>
        
        {/* Title */}
        <div className="h-5 w-full bg-gray-200 rounded mb-2"></div>
        <div className="h-5 w-3/4 bg-gray-200 rounded mb-3"></div>
        
        {/* Rating & Price */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-gray-200 rounded"></div>
            <div className="h-4 w-10 bg-gray-200 rounded"></div>
          </div>
          <div className="text-right">
            <div className="h-3 w-12 bg-gray-200 rounded mb-1"></div>
            <div className="h-5 w-16 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GigCardSkeleton;
