import React from 'react';

const SingleGigSkeleton = () => {
  return (
    <div className="bg-gray-50 py-10 px-6 lg:px-16 space-y-8 animate-pulse">
      {/* Feature Highlights Skeleton */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="h-8 w-32 bg-gray-300 rounded-full" />
        <div className="h-8 w-32 bg-gray-300 rounded-full" />
        <div className="h-8 w-32 bg-gray-300 rounded-lg" />
        <div className="h-8 w-32 bg-gray-300 rounded-lg" />
      </div>

      {/* Main Content Section Skeleton */}
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Left Section Skeleton */}
        <div className="lg:w-1/2 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-300 rounded-full" />
            <div>
              <div className="h-5 w-40 bg-gray-300 rounded" />
              <div className="h-4 w-24 bg-gray-300 rounded mt-2" />
            </div>
          </div>
          <div className="h-8 w-3/4 bg-gray-300 rounded" />
          <div className="h-20 w-full bg-gray-300 rounded" />
          <div className="h-10 w-40 bg-gray-300 rounded" />
        </div>

        {/* Right Section - Image Carousel Skeleton */}
        <div className="lg:w-1/2 relative">
          <div className="h-80 w-full bg-gray-300 rounded-lg" />
        </div>
      </div>

      {/* Pricing Plans Skeleton */}
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <div className="h-10 w-64 bg-gray-300 rounded mx-auto" />
          <div className="h-6 w-80 bg-gray-300 rounded mt-4 mx-auto" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[1, 2, 3].map((_, index) => (
            <div
              key={index}
              className="p-8 bg-white rounded-2xl shadow-md animate-pulse"
            >
              <div className="h-6 w-40 bg-gray-300 rounded mb-4" />
              <div className="h-6 w-24 bg-gray-300 rounded mb-6" />
              <div className="h-12 w-32 bg-gray-300 rounded mb-6" />
              <div className="h-10 w-full bg-gray-300 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SingleGigSkeleton;
