import React from 'react';

const SingleOrderSkeleton = () => {
  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 animate-pulse">
      {/* Header Skeleton */}
      <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 via-white to-gray-50 p-6">
        <div className="flex justify-between">
          <div className="h-6 w-32 bg-gray-200 rounded"></div>
          <div className="h-6 w-20 bg-gray-200 rounded"></div>
        </div>
        <div className="h-4 w-64 bg-gray-200 rounded mt-2"></div>
      </div>

      {/* Navigation Tabs Skeleton */}
      <div className="flex border-t border-gray-200">
        <div className="flex-1 py-4 bg-gray-200 h-10"></div>
        <div className="flex-1 py-4 bg-gray-200 h-10"></div>
      </div>

      {/* Order Details Skeleton */}
      <div className="p-6">
        <div className="mb-8 p-6 border border-gray-200 rounded-xl shadow-md bg-white">
          <div className="h-6 w-40 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>

        {/* Order Timeline Skeleton */}
        <div className="mt-10">
          <div className="h-6 w-48 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-8">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="relative pl-16">
                <div className="absolute left-4 w-6 h-6 bg-gray-300 rounded-full"></div>
                <div className="p-5 border border-gray-200 rounded-xl bg-white">
                  <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 w-24 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Metrics Skeleton */}
        <div className="mt-10 p-5 border-t border-gray-200 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-b-lg">
          <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, index) => (
              <div
                key={index}
                className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg shadow-sm"
              >
                <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 w-16 bg-gray-300 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleOrderSkeleton;
