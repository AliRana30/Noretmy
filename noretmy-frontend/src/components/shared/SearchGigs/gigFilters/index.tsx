import React, { useState } from 'react';
import { Search, ChevronDown, X, Check, ChevronRight, ArrowLeft, Filter, Sliders } from 'lucide-react';
import { FiverrCategories } from '@/util/data';

const priceRanges = ['Under $100', '$100 - $500', '$500 - $1000', 'Over $1000'];
const deliveryTimes = ['24 Hours', '3 Days', '7 Days', '14 Days', '1 Month'];
const sellerLevels = ['New Seller', 'Level 1', 'Level 2', 'Top Rated'];
const languages = [
  'English',
  'Spanish',
  'French',
  'German',
  'Chinese',
  'Japanese',
];

interface SearchFiltersProps {
  searchText: string;
  handleSearch: (text: string) => void;
  selectedFilters: string[];
  setSelectedFilters: React.Dispatch<React.SetStateAction<string[]>>;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({
  searchText,
  handleSearch,
  selectedFilters,
  setSelectedFilters,
}) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [showAllFilters, setShowAllFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [mobileFiltersVisible, setMobileFiltersVisible] = useState(false);

  const transformedCategories: Record<string, string[]> = FiverrCategories.reduce(
    (acc, category) => {
      acc[category.name] = category.subcategories;
      return acc;
    },
    {} as Record<string, string[]>
  );

  const toggleDropdown = (dropdown: string) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
    if (activeDropdown !== dropdown && dropdown === 'categories') {
      setSelectedCategory(null);
    }
  };

  const toggleFilter = (filter: string) => {
    setSelectedFilters((prev) =>
      prev.includes(filter)
        ? prev.filter((f) => f !== filter)
        : [...prev, filter],
    );
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
  };

  const toggleMobileFilters = () => {
    setMobileFiltersVisible(!mobileFiltersVisible);
    if (mobileFiltersVisible) {
      setActiveDropdown(null);
      setShowAllFilters(false);
      setSelectedCategory(null);
    }
  };

  return (
    <div className="w-full bg-gradient-to-b from-white to-gray-50 rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-5">
      <div className="p-3">
        {/* Modern Search Row */}
        <div className="flex items-center gap-2">
          {/* Search Input with Pill Shape */}
          <div className="relative flex-1">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchText}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search for gigs..."
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-200 transition-colors text-gray-800 placeholder:text-gray-400 text-sm"
              autoComplete="new-password"
              data-form-type="other"
              data-lpignore="true"
              name="gig_search_input_field"
            />
          </div>

          {/* Desktop Filter Pills - Hidden on Mobile */}
          <div className="hidden md:flex items-center gap-2">
            {/* Categories Pill */}
            <button
              onClick={() => toggleDropdown('categories')}
              className={`flex items-center gap-2 px-5 py-3 rounded-full text-sm font-medium transition-all ${activeDropdown === 'categories'
                  ? 'bg-orange-50 text-orange-600 border border-orange-200'
                  : 'bg-gray-50 text-gray-700 border border-gray-100 hover:border-gray-200'
                }`}
            >
              Categories
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === 'categories' ? 'rotate-180' : ''
                  }`}
              />
            </button>

            {/* Filters Pill */}
            <button
              onClick={() => setShowAllFilters(!showAllFilters)}
              className={`flex items-center gap-2 px-5 py-3 rounded-full text-sm font-medium transition-all ${showAllFilters
                  ? 'bg-orange-50 text-orange-600 border border-orange-200'
                  : 'bg-gray-50 text-gray-700 border border-gray-100 hover:border-gray-200'
                }`}
            >
              <Sliders className="w-4 h-4" />
              Filters
              {selectedFilters.length > 0 && (
                <span className="flex items-center justify-center w-5 h-5 bg-orange-500 rounded-full text-white text-xs font-bold">
                  {selectedFilters.length}
                </span>
              )}
            </button>
          </div>

          {/* Mobile Filter Button */}
          <button
            onClick={toggleMobileFilters}
            className="md:hidden flex items-center justify-center w-10 h-10 bg-gray-50 border border-gray-100 rounded-full hover:border-gray-200 transition-colors"
          >
            <Filter className={`w-4 h-4 ${mobileFiltersVisible || selectedFilters.length > 0 ? 'text-orange-500' : 'text-gray-500'}`} />
            {selectedFilters.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full text-white text-xs font-bold flex items-center justify-center">
                {selectedFilters.length}
              </span>
            )}
          </button>
        </div>

        {/* Selected Filters Tags */}
        {selectedFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {selectedFilters.map((filter) => (
              <span
                key={filter}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-100 text-gray-700 rounded-full text-xs font-medium shadow-sm hover:border-orange-200 transition-colors group"
              >
                {filter}
                <button
                  onClick={() => setSelectedFilters((prev) => prev.filter((f) => f !== filter))}
                  className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-orange-100 transition-colors"
                >
                  <X className="w-3 h-3 text-gray-500 group-hover:text-orange-500" />
                </button>
              </span>
            ))}

            {selectedFilters.length > 1 && (
              <button
                onClick={() => setSelectedFilters([])}
                className="px-3 py-1.5 text-xs text-orange-600 hover:text-orange-700 font-medium transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
        )}

        {/* Mobile Filter Options */}
        {mobileFiltersVisible && (
          <div className="md:hidden space-y-2 mt-3 pt-3 border-t border-gray-100">
            {/* Mobile Categories Button */}
            <button
              onClick={() => toggleDropdown('categories')}
              className={`flex items-center justify-between w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeDropdown === 'categories'
                  ? 'bg-orange-50 text-orange-600 border border-orange-200'
                  : 'bg-white border border-gray-100 text-gray-700 hover:border-gray-200'
                }`}
            >
              <span>Categories</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === 'categories' ? 'rotate-180' : ''
                  }`}
              />
            </button>

            {/* Mobile All Filters Button */}
            <button
              onClick={() => setShowAllFilters(!showAllFilters)}
              className={`flex items-center justify-between w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${showAllFilters
                  ? 'bg-orange-50 text-orange-600 border border-orange-200'
                  : 'bg-white border border-gray-100 text-gray-700 hover:border-gray-200'
                }`}
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4" />
                <span>Filters</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${showAllFilters ? 'rotate-180' : ''
                  }`}
              />
            </button>
          </div>
        )}
      </div>

      {/* Categories Panel */}
      {activeDropdown === 'categories' && (
        <div className="p-4 bg-white border-t border-gray-100">
          {selectedCategory === null ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {Object.keys(transformedCategories).map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryClick(category)}
                  className="flex items-center justify-between px-4 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-800 text-sm font-medium transition-all group"
                >
                  <span>{category}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-orange-500 transition-colors" />
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="flex items-center gap-1 text-orange-500 hover:text-orange-600 text-sm font-medium transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Back</span>
                </button>
                <span className="text-gray-400 hidden sm:inline">/</span>
                <h3 className="font-medium text-gray-900 text-sm truncate">{selectedCategory}</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {transformedCategories[selectedCategory].map((subcategory) => (
                  <button
                    key={subcategory}
                    onClick={() => toggleFilter(`${selectedCategory} › ${subcategory}`)}
                    className={`group flex items-center w-full gap-2 px-3 py-2 rounded-lg text-sm transition-all ${selectedFilters.includes(`${selectedCategory} › ${subcategory}`)
                        ? 'bg-orange-50 text-orange-600 border border-orange-100'
                        : 'hover:bg-gray-50 text-gray-600 border border-transparent'
                      }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-sm flex items-center justify-center transition-colors ${selectedFilters.includes(`${selectedCategory} › ${subcategory}`)
                          ? 'bg-orange-500'
                          : 'border border-gray-300 group-hover:border-orange-200'
                        }`}
                    >
                      {selectedFilters.includes(`${selectedCategory} › ${subcategory}`) && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <span className="truncate">{subcategory}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* All Filters Panel */}
      {showAllFilters && (
        <div className="p-4 bg-white border-t border-gray-100">
          {/* Price Range */}
          <div className="mb-5">
            <h3 className="font-medium text-gray-800 text-sm mb-3">Price Range</h3>
            <div className="flex flex-wrap gap-2">
              {priceRanges.map((price) => (
                <button
                  key={price}
                  onClick={() => toggleFilter(price)}
                  className={`px-4 py-2 rounded-full text-sm transition-all ${selectedFilters.includes(price)
                      ? 'bg-orange-50 text-orange-600 border border-orange-200'
                      : 'bg-gray-50 text-gray-700 border border-gray-100 hover:border-gray-200'
                    }`}
                >
                  {price}
                </button>
              ))}
            </div>
          </div>

          {/* Delivery Time */}
          <div>
            <h3 className="font-medium text-gray-800 text-sm mb-3">Delivery Time</h3>
            <div className="flex flex-wrap gap-2">
              {deliveryTimes.map((time) => (
                <button
                  key={time}
                  onClick={() => toggleFilter(time)}
                  className={`px-4 py-2 rounded-full text-sm transition-all ${selectedFilters.includes(time)
                      ? 'bg-orange-50 text-orange-600 border border-orange-200'
                      : 'bg-gray-50 text-gray-700 border border-gray-100 hover:border-gray-200'
                    }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchFilters;