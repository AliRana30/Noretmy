import React from 'react';
import GigCardSkeleton from '../GigCard';

const SearchPageSkeleton = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Skeleton */}
        <div className="mb-6 animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded mb-2"></div>
          <div className="h-5 w-32 bg-gray-200 rounded"></div>
        </div>

        {/* Search Type Toggle Skeleton */}
        <div className="flex gap-2 mb-6 animate-pulse">
          <div className="h-10 w-28 bg-gray-200 rounded-full"></div>
          <div className="h-10 w-32 bg-gray-200 rounded-full"></div>
        </div>

        {/* Filters Skeleton */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 animate-pulse">
          <div className="flex flex-wrap gap-4">
            <div className="h-10 w-40 bg-gray-200 rounded-lg"></div>
            <div className="h-10 w-32 bg-gray-200 rounded-lg"></div>
            <div className="h-10 w-48 bg-gray-200 rounded-lg"></div>
            <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
          </div>
        </div>

        {/* Grid of Gig Card Skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, index) => (
            <GigCardSkeleton key={index} />
          ))}
        </div>

        {/* Pagination Skeleton */}
        <div className="flex justify-center mt-8 animate-pulse">
          <div className="flex gap-2">
            <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
            <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
            <div className="h-10 w-10 bg-gray-300 rounded-lg"></div>
            <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
            <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPageSkeleton;
