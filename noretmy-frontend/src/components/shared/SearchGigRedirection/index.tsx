'use client';

import { useState, useRef } from 'react';
import { Search, ArrowRight, Briefcase, Users } from 'lucide-react';
import { useTranslations } from '@/hooks/useTranslations';

interface SearchGigsRedirectionProps {
  navigateWithTransition: (path: string) => void;
}

type SearchType = 'gigs' | 'freelancers';

export default function SearchGigsRedirection({ navigateWithTransition }: SearchGigsRedirectionProps) {
  const { t } = useTranslations();
  const [searchValue, setSearchValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [searchType, setSearchType] = useState<SearchType>('gigs');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    let path: string;
    
    if (searchType === 'freelancers') {
      path = searchValue.trim()
        ? `/freelancer?q=${encodeURIComponent(searchValue.trim())}`
        : '/freelancer';
    } else {
      path = searchValue.trim()
        ? `/search-gigs?q=${encodeURIComponent(searchValue.trim())}`
        : '/search-gigs';
    }
    navigateWithTransition(path);
  };

  const popularSearches = [
    t('home:searchSection.popularSearches.webDevelopment') || 'Web Development',
    t('home:searchSection.popularSearches.logoDesign') || 'Logo Design',
    t('home:searchSection.popularSearches.contentWriting') || 'Content Writing',
    t('home:searchSection.popularSearches.mobileApp') || 'Mobile App',
  ];

  return (
    <div className="w-full">
      {/* Search Type Toggle */}
      <div className="flex justify-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => setSearchType('gigs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            searchType === 'gigs'
              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>{t('home:searchSection.searchGigs') || 'Services'}</span>
        </button>
        <button
          type="button"
          onClick={() => setSearchType('freelancers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            searchType === 'freelancers'
              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{t('home:searchSection.searchFreelancers') || 'Freelancers'}</span>
        </button>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <div
          className={`flex items-center bg-white rounded-2xl border-2 transition-all duration-300 shadow-lg ${isFocused
              ? 'border-orange-500 shadow-orange-100'
              : 'border-slate-200 hover:border-slate-300'
            }`}
        >
          {/* Search Icon */}
          <div className="pl-5 pr-3">
            <Search className={`w-5 h-5 transition-colors ${isFocused ? 'text-orange-500' : 'text-slate-400'}`} />
          </div>

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={
              searchType === 'freelancers'
                ? (t('home:searchSection.placeholderFreelancers') || 'Search for freelancers by skill or name...')
                : (t('home:searchSection.placeholder') || 'Search for any service...')
            }
            className="flex-1 py-4 pr-4 text-slate-900 placeholder-slate-400 bg-transparent outline-none text-base"
          />

          {/* Search Button */}
          <button
            type="submit"
            className="m-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl transition-all flex items-center gap-2 group shadow-lg shadow-orange-500/25"
          >
            <span className="hidden sm:inline">{t('home:searchSection.searchButton') || 'Search'}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </form>

      {/* Popular Searches - Only show for gigs search */}
      {searchType === 'gigs' && (
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <span className="text-slate-500 text-sm">{t('home:searchSection.popular') || 'Popular'}:</span>
          {popularSearches.map((term, index) => (
            <button
              key={index}
              onClick={() => {
                setSearchValue(term);
                const path = `/search-gigs?q=${encodeURIComponent(term)}`;
                navigateWithTransition(path);
              }}
              className="px-3 py-1.5 text-sm text-slate-700 bg-slate-100 hover:bg-orange-100 hover:text-orange-600 rounded-lg transition-colors"
            >
              {term}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}