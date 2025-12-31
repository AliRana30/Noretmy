import React from 'react';

const FreelancerCardSkeleton = () => {
  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100 animate-pulse">
      {/* Cover/Banner Skeleton */}
      <div className="h-24 bg-gradient-to-r from-gray-200 to-gray-300"></div>
      
      {/* Profile Section */}
      <div className="px-4 -mt-10 relative">
        {/* Avatar */}
        <div className="w-20 h-20 bg-gray-300 rounded-full border-4 border-white shadow-md"></div>
        
        {/* Badge */}
        <div className="absolute top-12 left-20 h-5 w-16 bg-gray-200 rounded-full"></div>
      </div>
      
      {/* Content */}
      <div className="p-4 pt-2">
        {/* Name */}
        <div className="h-5 w-32 bg-gray-200 rounded mb-1"></div>
        
        {/* Title */}
        <div className="h-4 w-40 bg-gray-200 rounded mb-3"></div>
        
        {/* Rating */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-4 h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-4 w-16 bg-gray-200 rounded"></div>
        </div>
        
        {/* Skills */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
          <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
          <div className="h-6 w-14 bg-gray-200 rounded-full"></div>
        </div>
        
        {/* Stats */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="h-5 w-8 bg-gray-300 rounded mb-1"></div>
              <div className="h-3 w-10 bg-gray-200 rounded"></div>
            </div>
            <div className="text-center">
              <div className="h-5 w-8 bg-gray-300 rounded mb-1"></div>
              <div className="h-3 w-10 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div className="h-4 w-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
};

export default FreelancerCardSkeleton;
