'use client';

import { Suspense } from 'react';
import SearchGigs from '@/components/shared/SearchGigs';
import { SkeletonGigGrid } from '@/components/shared/Skeletons';

function SearchGigsLoading() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Skeleton header */}
        <div className="mb-8">
          <div className="skeleton h-8 w-64 mb-2" />
          <div className="skeleton h-5 w-48" />
        </div>
        {/* Skeleton filters */}
        <div className="flex gap-3 mb-8">
          <div className="skeleton h-10 w-32 rounded-lg" />
          <div className="skeleton h-10 w-32 rounded-lg" />
          <div className="skeleton h-10 w-32 rounded-lg" />
        </div>
        {/* Skeleton grid */}
        <SkeletonGigGrid count={12} />
      </div>
    </div>
  );
}


const SearchGigsPage = () => {
  return (
    <main className="overflow-x-hidden">
      <Suspense fallback={<SearchGigsLoading />}>
        <SearchGigs />
      </Suspense>
    </main>
  );
};

export default SearchGigsPage;
