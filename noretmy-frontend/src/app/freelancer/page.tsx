'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';
import {
  Search,
  MapPin,
  Star,
  Briefcase,
  Filter,
  X,
  Users,
  ChevronDown,
  Quote
} from 'lucide-react';
import { useTranslations } from '@/hooks/useTranslations';

interface Freelancer {
  _id: string;
  fullName: string;
  username: string;
  profilePicture: string | null;
  profileHeadline: string | null;
  skills: string[];
  country: string | null;
  averageRating: number;
  totalReviews: number;
  completedOrders: number;
  totalGigs: number;
  recentReviews?: {
    _id: string;
    star: number;
    desc: string;
  }[];
}

function FreelancerSearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useTranslations();

  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [skillFilter, setSkillFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

  const fetchFreelancers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (skillFilter) params.append('skill', skillFilter);

      const response = await axios.get(
        `${BACKEND_URL}/users/search/freelancers?${params.toString()}`
      );
      setFreelancers(response.data.freelancers || response.data || []);
    } catch (error) {
      console.error('Error fetching freelancers:', error);
      setFreelancers([]);
    } finally {
      setLoading(false);
    }
  }, [BACKEND_URL, searchQuery, skillFilter]);

  useEffect(() => {
    fetchFreelancers();
  }, [fetchFreelancers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.append('q', searchQuery);
    router.push(`/freelancer?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-orange-500/20 text-orange-400 rounded-full px-4 py-1.5 mb-4">
              <Users className="w-4 h-4" />
              <span className="text-sm font-semibold">Find Talent</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              {t('Browse Freelancers')}
            </h1>
            <p className="text-slate-300 max-w-2xl mx-auto">
              {t('Connect with skilled professionals ready to bring your projects to life')}
            </p>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="flex items-center bg-white rounded-xl shadow-lg">
              <div className="pl-4">
                <Search className="w-5 h-5 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('freelancers:searchPlaceholder') || 'Search by name, skill, or keyword...'}
                className="flex-1 py-4 px-4 text-slate-900 placeholder-slate-400 bg-transparent outline-none"
              />
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="p-3 text-slate-500 hover:text-slate-700 transition-colors"
              >
                <Filter className="w-5 h-5" />
              </button>
              <button
                type="submit"
                className="m-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg transition-all"
              >
                Search
              </button>
            </div>
          </form>

          {/* Filters */}
          {showFilters && (
            <div className="max-w-2xl mx-auto mt-4 p-4 bg-white/10 rounded-xl">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm text-slate-300 mb-1">Skill</label>
                  <input
                    type="text"
                    value={skillFilter}
                    onChange={(e) => setSkillFilter(e.target.value)}
                    placeholder="e.g. React, Python, Design"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-slate-600">
            {loading ? 'Searching...' : `${freelancers.length} freelancer${freelancers.length !== 1 ? 's' : ''} found`}
          </p>
        </div>

        {/* Freelancer Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
                <div className="w-20 h-20 bg-slate-200 rounded-full mx-auto mb-4"></div>
                <div className="h-4 bg-slate-200 rounded w-3/4 mx-auto mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2 mx-auto"></div>
              </div>
            ))}
          </div>
        ) : freelancers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {freelancers.map((freelancer) => (
              <Link
                key={freelancer._id}
                href={`/freelancer/${freelancer.username}`}
                className="group bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-100"
              >
                {/* Profile Picture */}
                <div className="relative w-20 h-20 mx-auto mb-4">
                  <Image
                    src={freelancer.profilePicture || '/images/default-avatar.png'}
                    alt={freelancer.fullName}
                    fill
                    className="rounded-full object-cover border-2 border-slate-100 group-hover:border-orange-200 transition-colors"
                  />
                </div>

                {/* Name & Headline */}
                <div className="text-center mb-4">
                  <h3 className="font-semibold text-slate-900 group-hover:text-orange-600 transition-colors">
                    {freelancer.fullName}
                  </h3>
                  <p className="text-sm text-slate-500 line-clamp-1">
                    @{freelancer.username}
                  </p>
                  {freelancer.profileHeadline && (
                    <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                      {freelancer.profileHeadline}
                    </p>
                  )}
                </div>

                {/* Rating */}
                <div className="flex items-center justify-center gap-1 mb-4">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="font-medium text-slate-900">
                    {freelancer.averageRating?.toFixed(1) || '0.0'}
                  </span>
                  <span className="text-sm text-slate-500">
                    ({freelancer.totalReviews || 0} reviews)
                  </span>
                </div>

                {/* Stats */}
                <div className="flex justify-center gap-4 text-sm text-slate-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    <span>{freelancer.completedOrders || 0} orders</span>
                  </div>
                  {freelancer.country && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{freelancer.country}</span>
                    </div>
                  )}
                </div>

                {/* Skills */}
                {freelancer.skills && freelancer.skills.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-1">
                    {freelancer.skills.slice(0, 3).map((skill, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-[10px] bg-slate-100 text-slate-600 rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                    {freelancer.skills.length > 3 && (
                      <span className="px-2 py-1 text-[10px] bg-slate-100 text-slate-600 rounded-full">
                        +{freelancer.skills.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Recent Review Snippet */}
                {freelancer.recentReviews && freelancer.recentReviews.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-50 text-left">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Quote className="w-3 h-3 text-orange-400 rotate-180" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recent Feedback</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <p className="text-xs text-slate-600 italic line-clamp-2 leading-relaxed">
                        "{freelancer.recentReviews[0].desc}"
                      </p>
                    </div>
                  </div>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">
              {t('freelancers:noResults') || 'No freelancers found'}
            </h3>
            <p className="text-slate-500">
              {t('freelancers:noResultsHint') || 'Try adjusting your search or filters'}
            </p>
          </div>
        )}
      </div>
    </div >
  );
}

export default function FreelancerSearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <div className="text-slate-600 font-medium">Loading freelancers...</div>
        </div>
      </div>
    }>
      <FreelancerSearchContent />
    </Suspense>
  );
}
