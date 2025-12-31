'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Search, Sparkles, Users, Briefcase } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';

import Gig from '../Gig';
import { fetchGigs } from '@/store/gigSlice';
import { useAppDispatch } from '@/hooks/redux';
import { useTranslations } from '@/hooks/useTranslations';
import SearchFilters from './gigFilters';
import { ContentOverlay, GigGridSkeleton, Skeleton } from '@/components/ui/GlobalLoader';
import SearchPageSkeleton from '@/skelton/SearchPage';
import { FiverrCategories } from '@/util/data';

// Map URL slugs to category names for the carousel links
const slugToCategoryMap: Record<string, string> = {
  'web-development': 'Web development',
  'ui-ux-design': 'UX/UI',
  'digital-marketing': 'Digital Marketing',
  'graphic-design': 'Graphic design and digital design',
  'photography': 'Photography',
  'video-animation': 'Video Editing',
  'seo-analytics': 'SEO',
  'audio-production': 'Audio Production',
};

interface GigData {
  _id: number;
  title: string;
  photos: string[];
  profileUrl: string;
  totalStars: number;
  price: string;
  category?: string;
  seller?: {
    name: string;
    level?: 'Basic' | 'Pro' | 'Elite';
  };
  sellerBadge?: {
    level: 'new' | 'level_1' | 'level_2' | 'top_rated';
    trustScore: number;
    isVerified?: boolean;
  } | null;
  deliveryTime?: number;
  reviews?: number;
  upgradeOption: string;
  discount: number;
}

interface FreelancerResult {
  _id: string;
  fullName: string;
  username: string;
  profilePicture: string | null;
  profileHeadline: string | null;
}

const SearchGigs: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchText, setSearchText] = useState(searchParams.get('q') || '');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [minBudget, setMinBudget] = useState<number | undefined>();
  const [maxBudget, setMaxBudget] = useState<number | undefined>();
  const [deliveryTime, setDeliveryTime] = useState<number | undefined>();
  const [searchType, setSearchType] = useState<'gigs' | 'freelancers'>('gigs');
  const [freelancers, setFreelancers] = useState<FreelancerResult[]>([]);
  const [freelancerLoading, setFreelancerLoading] = useState(false);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  const dispatch = useAppDispatch();
  const { t, getCurrentLanguage } = useTranslations();

  const { data: gigs, loading, error } = useSelector((state: any) => state.gigs);
  const currentLanguage = getCurrentLanguage();
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

  // Handle category from URL
  useEffect(() => {
    const categorySlug = searchParams.get('category');
    const query = searchParams.get('q');
    const type = searchParams.get('type');

    if (categorySlug) {
      // Map the slug to actual category name if it exists in our map
      const categoryName = slugToCategoryMap[categorySlug] || categorySlug;
      
      // Try to find a matching category in FiverrCategories
      let matchedFilter = categoryName;
      for (const cat of FiverrCategories) {
        // Check if it matches main category
        if (cat.name.toLowerCase() === categoryName.toLowerCase()) {
          matchedFilter = cat.name;
          break;
        }
        // Check if it matches any subcategory
        const matchedSubcat = cat.subcategories.find(
          sub => sub.toLowerCase() === categoryName.toLowerCase()
        );
        if (matchedSubcat) {
          matchedFilter = `${cat.name} › ${matchedSubcat}`;
          break;
        }
      }
      
      if (!selectedFilters.includes(matchedFilter)) {
        setSelectedFilters([matchedFilter]);
      }
    }
    if (query) {
      setSearchText(query);
    }
    if (type === 'freelancers') {
      setSearchType('freelancers');
    }
  }, [searchParams]);

  // Parse selectedFilters to extract categories, price ranges, and delivery times
  const parseFilters = (filters: string[]) => {
    const priceRangeMap: Record<string, { min?: number; max?: number }> = {
      'Under $100': { max: 100 },
      '$100 - $500': { min: 100, max: 500 },
      '$500 - $1000': { min: 500, max: 1000 },
      'Over $1000': { min: 1000 },
    };

    const deliveryTimeMap: Record<string, number> = {
      '24 Hours': 1,
      '3 Days': 3,
      '7 Days': 7,
      '14 Days': 14,
      '1 Month': 30,
    };

    const categories: string[] = [];
    let parsedMinBudget: number | undefined = minBudget;
    let parsedMaxBudget: number | undefined = maxBudget;
    let parsedDeliveryTime: number | undefined = deliveryTime;

    filters.forEach(filter => {
      if (priceRangeMap[filter]) {
        const range = priceRangeMap[filter];
        if (range.min !== undefined) parsedMinBudget = range.min;
        if (range.max !== undefined) parsedMaxBudget = range.max;
      } else if (deliveryTimeMap[filter]) {
        parsedDeliveryTime = deliveryTimeMap[filter];
      } else {
        // It's a category filter (contains › or is a main category)
        categories.push(filter);
      }
    });

    return { categories, parsedMinBudget, parsedMaxBudget, parsedDeliveryTime };
  };

  // Fetch gigs when filters change (with debounce for searchText)
  useEffect(() => {
    if (searchType === 'gigs') {
      const debounce = setTimeout(() => {
        const { categories, parsedMinBudget, parsedMaxBudget, parsedDeliveryTime } = parseFilters(selectedFilters);
        
        dispatch(
          fetchGigs({
            categories: categories,
            minBudget: parsedMinBudget,
            maxBudget: parsedMaxBudget,
            deliveryTime: parsedDeliveryTime,
            searchText,
            language: currentLanguage,
          }),
        );
      }, searchText ? 300 : 0); // Debounce only when typing

      return () => clearTimeout(debounce);
    }
  }, [searchText, selectedFilters, minBudget, maxBudget, deliveryTime, currentLanguage, dispatch, searchType]);

  // Fetch freelancers when searching
  useEffect(() => {
    const searchFreelancers = async () => {
      if (searchType !== 'freelancers' || searchText.length < 2) {
        setFreelancers([]);
        return;
      }

      try {
        setFreelancerLoading(true);
        const response = await axios.get(
          `${BACKEND_URL}/users/search/freelancers?q=${encodeURIComponent(searchText)}&limit=20`
        );
        setFreelancers(response.data);
      } catch (err) {
        console.error('Error searching freelancers:', err);
        setFreelancers([]);
      } finally {
        setFreelancerLoading(false);
      }
    };

    const debounce = setTimeout(searchFreelancers, 300);
    return () => clearTimeout(debounce);
  }, [searchText, searchType, BACKEND_URL]);

  const handleSearch = (text: string) => {
    setSearchText(text);
  };

  const isLoading = searchType === 'gigs' ? loading : freelancerLoading;
  
  // Track if we've had at least one successful load
  useEffect(() => {
    if (!loading && gigs.length >= 0) {
      setHasInitialLoad(true);
    }
  }, [loading, gigs]);

  // Show skeleton only on initial page load, not on filter changes
  const showInitialSkeleton = !hasInitialLoad && isLoading;

  if (error && searchType === 'gigs') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-red-500 mb-4">{t('search:error.prefix') || 'Error:'} {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            {searchText
              ? `Results for "${searchText}"`
              : searchType === 'gigs' ? 'Browse Services' : 'Find Freelancers'}
          </h1>
          <p className="text-slate-600">
            {searchType === 'gigs'
              ? `${gigs.length} ${gigs.length === 1 ? 'service' : 'services'} available`
              : `${freelancers.length} ${freelancers.length === 1 ? 'freelancer' : 'freelancers'} found`}
          </p>
        </div>

        {/* Search Type Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setSearchType('gigs')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-all ${searchType === 'gigs'
                ? 'bg-orange-500 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}
          >
            <Briefcase className="w-4 h-4" />
            Services
          </button>
          <button
            onClick={() => setSearchType('freelancers')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-all ${searchType === 'freelancers'
                ? 'bg-orange-500 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}
          >
            <Users className="w-4 h-4" />
            Freelancers
          </button>
        </div>

        {/* Filters - Only show for gigs */}
        {searchType === 'gigs' ? (
          <SearchFilters
            searchText={searchText}
            handleSearch={handleSearch}
            selectedFilters={selectedFilters}
            setSelectedFilters={setSelectedFilters}
          />
        ) : (
          /* Simple search for freelancers */
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-6">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search freelancers by name..."
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-200 transition-colors text-gray-800 placeholder:text-gray-400 text-sm"
              />
            </div>
          </div>
        )}

        {/* Results with overlay loading */}
        <ContentOverlay isLoading={isLoading && hasInitialLoad}>
          {showInitialSkeleton ? (
            <GigGridSkeleton count={8} />
          ) : searchType === 'gigs' ? (
            /* Gigs Grid */
            gigs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {gigs.map((gig: GigData) => (
                  <Gig gig={gig} key={gig._id} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-slate-400" />
                </div>
                <h2 className="text-xl font-semibold text-slate-800 mb-2">
                  {t('search:noResults.title') || 'No services found'}
                </h2>
                <p className="text-slate-600 mb-6 max-w-md">
                  {t('search:noResults.description') || 'Try adjusting your search or filters to find what you\'re looking for.'}
              </p>
              <button
                onClick={() => {
                  setSearchText('');
                  setSelectedFilters([]);
                }}
                className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )
        ) : (
          /* Freelancers Grid */
          freelancers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {freelancers.map((freelancer) => (
                <Link
                  href={`/freelancer/${freelancer.username}`}
                  key={freelancer._id}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow group"
                >
                  <div className="flex flex-col items-center text-center">
                    <Image
                      src={freelancer.profilePicture || '/images/placeholder-avatar.png'}
                      alt={freelancer.fullName}
                      width={80}
                      height={80}
                      className="w-20 h-20 rounded-full object-cover mb-4 group-hover:scale-105 transition-transform"
                    />
                    <h3 className="font-semibold text-slate-900 group-hover:text-orange-500 transition-colors">
                      {freelancer.fullName}
                    </h3>
                    <p className="text-sm text-slate-500 mb-2">@{freelancer.username}</p>
                    {freelancer.profileHeadline && (
                      <p className="text-sm text-slate-600 line-clamp-2">
                        {freelancer.profileHeadline}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : searchText.length >= 2 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-slate-400" />
              </div>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">
                No freelancers found
              </h2>
              <p className="text-slate-600 mb-6 max-w-md">
                Try searching with a different name or keyword.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-slate-400" />
              </div>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">
                Search for freelancers
              </h2>
              <p className="text-slate-600 max-w-md">
                Enter at least 2 characters to start searching for freelancers by name.
              </p>
            </div>
          )
        )}
        </ContentOverlay>
      </div>
    </div>
  );
};

export default SearchGigs;