'use client';

import { useState, useRef } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { useTranslations } from '@/hooks/useTranslations';

interface SearchGigsRedirectionProps {
  navigateWithTransition: (path: string) => void;
}

type SearchType = 'jobs' | 'freelancers';

export default function SearchGigRedirection({ navigateWithTransition }: SearchGigsRedirectionProps) {
  const { t } = useTranslations();
  const [searchValue, setSearchValue] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('jobs');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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

  const handleTypeChange = (type: SearchType) => {
    setSearchType(type);
    setIsDropdownOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Upwork-Style Search Bar - Single Horizontal Container */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <div className="flex items-center bg-white rounded-full border-2 border-slate-200 hover:border-slate-300 focus-within:border-orange-500 transition-all duration-200 shadow-lg overflow-hidden">
          
          {/* Left Side: Search Icon + Input */}
          <div className="flex items-center flex-1 pl-5 pr-4">
            <Search className="w-5 h-5 text-slate-400 mr-3 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={t('home:searchSection.placeholder') || 'Search'}
              className="flex-1 py-3.5 text-slate-900 placeholder-slate-400 bg-transparent outline-none text-base"
            />
          </div>

          {/* Vertical Divider */}
          <div className="h-8 w-px bg-slate-200"></div>

          {/* Right Side: Dropdown Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-6 py-3.5 text-slate-700 hover:text-slate-900 font-medium transition-colors"
            >
              <span>{searchType === 'jobs' ? (t('home:searchSection.jobs') || 'Jobs') : (t('home:searchSection.freelancers') || 'Freelancers')}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <>
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsDropdownOpen(false)}
                ></div>
                
                {/* Dropdown Options */}
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-20">
                  <button
                    type="button"
                    onClick={() => handleTypeChange('jobs')}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      searchType === 'jobs'
                        ? 'bg-orange-50 text-orange-600 font-medium'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {t('home:searchSection.jobs') || 'Jobs'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTypeChange('freelancers')}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      searchType === 'freelancers'
                        ? 'bg-orange-50 text-orange-600 font-medium'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {t('home:searchSection.freelancers') || 'Freelancers'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </form>

      {/* Popular Searches */}
      <div className="flex flex-wrap items-center gap-2 mt-4 px-2">
        <span className="text-slate-500 text-sm">{t('home:searchSection.popular') || 'Popular'}:</span>
        {['Web Development', 'Logo Design', 'Content Writing', 'Mobile App'].map((term, index) => (
          <button
            key={index}
            onClick={() => {
              setSearchValue(term);
              const path = searchType === 'jobs' 
                ? `/search-gigs?q=${encodeURIComponent(term)}`
                : `/freelancer?q=${encodeURIComponent(term)}`;
              navigateWithTransition(path);
            }}
            className="px-3 py-1.5 text-sm text-slate-700 bg-slate-100 hover:bg-orange-100 hover:text-orange-600 rounded-lg transition-colors"
          >
            {term}
          </button>
        ))}
      </div>
    </div>
  );
}
