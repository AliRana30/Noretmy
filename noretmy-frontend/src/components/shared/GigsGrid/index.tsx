'use client';
import React, { useEffect, useState } from 'react';
import Gig from '../Gig';
import Loader from '../Loader';
import axios from 'axios';
import { useTranslations } from '@/hooks/useTranslations';
import { ArrowRight, TrendingUp, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface GigType {
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

const HomeGigs = () => {
  const [gigs, setGigs] = useState<GigType[]>([]);
  const [loading, setLoading] = useState(true);
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;
  const { getCurrentLanguage } = useTranslations();

  const currentLanguage = getCurrentLanguage();

  useEffect(() => {
    const fetchGigs = async () => {
      try {
        const params = new URLSearchParams();
        if (currentLanguage) {
          params.append('lang', currentLanguage);
        }

        const response = await axios.get<GigType[]>(
          `${BACKEND_URL}/job/feature?${params.toString()}`,
        );
        setGigs(response.data);
      } catch (error) {
        console.error('Failed to fetch gigs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGigs();
  }, [currentLanguage, BACKEND_URL]);

  if (loading) {
    return (
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Loader />
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-white relative overflow-hidden">
      {/* Subtle background */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-slate-50 to-white"></div>
      <div className="absolute top-40 right-0 w-80 h-80 bg-orange-50 rounded-full blur-3xl opacity-60"></div>
      <div className="absolute bottom-40 left-0 w-80 h-80 bg-blue-50 rounded-full blur-3xl opacity-60"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full px-4 py-1.5 mb-4 shadow-lg shadow-orange-500/25">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-semibold">Top Rated</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-3">
              Featured Services
            </h2>
            <p className="text-slate-600 text-lg max-w-2xl">
              Hand-picked professionals delivering exceptional results for businesses worldwide
            </p>
          </div>

          <Link
            href="/search-gigs"
            className="group inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-semibold transition-colors"
          >
            View All Services
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 p-6 border border-black rounded-2xl shadow-xl">
          {[
            { value: '500+', label: 'Expert Sellers' },
            { value: '50K+', label: 'Projects Completed' },
            { value: '4.9/5', label: 'Average Rating' },
            { value: '24h', label: 'Avg Response Time' },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">{stat.value}</div>
              <div className="text-sm text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Gigs Grid */}
        {gigs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {gigs.map((gig) => (
              <Gig key={gig._id} gig={gig} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-slate-50 rounded-2xl">
            <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No services available yet</h3>
            <p className="text-slate-500">Check back soon for amazing services!</p>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-8 sm:px-12 relative overflow-hidden">
            {/* Background accents */}
            <div className="absolute top-0 left-0 w-40 h-40 bg-orange-500/20 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-blue-500/20 rounded-full blur-2xl"></div>

            <div className="text-white text-center sm:text-left relative z-10">
              <p className="font-bold text-xl mb-1">Can&apos;t find what you need?</p>
              <p className="text-slate-300">Post a custom request and get offers from experts</p>
            </div>
            <Link
              href="/order-request"
              className="relative z-10 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-3 px-8 rounded-xl transition-all whitespace-nowrap shadow-lg shadow-orange-500/25"
            >
              Post a Request
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeGigs;
