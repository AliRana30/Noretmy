import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import AnimatedSection from '../AnimatedSection';
import SectionHeader from '../../SectionHeader';
import CategoryComponent from '../../CategoryComponent';
import NavigationButtons from '../NavigationButtons';
import { FaArrowRight } from 'react-icons/fa';

interface SectionOneProps {
  isVisible: boolean;
  title: string;
  setTitle: (title: string) => void;
  onNext: () => void;
  selectedCategory: string;
  selectedSubcategory: string;
  onCategoryChange: (category: string) => void;
  onSubcategoryChange: (subcategory: string) => void;
}

const SectionOne: React.FC<SectionOneProps> = ({
  isVisible,
  title,
  setTitle,
  onNext,
  selectedCategory,
  selectedSubcategory,
  onCategoryChange,
  onSubcategoryChange,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [titleStrength, setTitleStrength] = useState(0);

  // Auto-save effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (title) {
        setIsAutoSaving(true);
        setTimeout(() => {
          setIsAutoSaving(false);
          setLastSaved(new Date());
        }, 1000);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [title]);

  // Title strength checker
  useEffect(() => {
    let strength = 0;
    if (title.length > 20) strength += 33;
    if (title.includes(' ')) strength += 33;
    if (/\d/.test(title)) strength += 34;
    setTitleStrength(strength);
  }, [title]);

  return (
    <AnimatedSection isVisible={isVisible}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <SectionHeader
            number="01"
            title="Create a new gig"
            colors={['#f97316', '#ea580c']}
          />
          <div className="flex items-center gap-3">
            {isAutoSaving ? (
              <span className="flex items-center text-slate-500 text-sm">
                <Clock size={16} className="mr-1 animate-spin" />
                Saving...
              </span>
            ) : lastSaved ? (
              <span className="flex items-center text-slate-500 text-sm">
                <CheckCircle2 size={16} className="mr-1 text-orange-500" />
                Saved {lastSaved.toLocaleTimeString()}
              </span>
            ) : null}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-slate-500">
            <span>Step 1 of 4</span>
            <span>Basic Information</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${25 + titleStrength / 4}%` }}
            />
          </div>
        </div>

        {/* Title Input */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <label className="text-lg font-medium text-slate-800">
              Create a title for your gig
              <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="relative">
              <HelpCircle
                size={18}
                className="text-slate-400 cursor-pointer hover:text-orange-500 transition-colors"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              />
              {showTooltip && (
                <div className="absolute z-10 w-72 p-3 bg-slate-800 text-white text-sm rounded-lg shadow-xl -right-2 top-6">
                  <h4 className="font-medium mb-2">Tips for a great title:</h4>
                  <ul className="space-y-1 text-slate-200">
                    <li>• Be specific about what you offer</li>
                    <li>• Include your main skill/service</li>
                    <li>• Keep it clear and concise</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
          <div className="relative">
            <input
              value={title}
              maxLength={100}
              onChange={(e) => setTitle(e.target.value.trimStart())}
              placeholder="e.g. I will design a professional logo for your business"
              className="w-full p-4 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-lg transition-all"
            />
            <div className="absolute right-3 bottom-3 flex items-center gap-2">
              <div className="h-2 w-24 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${titleStrength > 66
                      ? 'bg-orange-500'
                      : titleStrength > 33
                        ? 'bg-orange-500'
                        : 'bg-red-500'
                    }`}
                  style={{ width: `${titleStrength}%` }}
                />
              </div>
              <span className="text-sm text-slate-400">{title.length}/100</span>
            </div>
          </div>
        </div>

        {/* Category Selection */}
        <CategoryComponent
          selectedCategory={selectedCategory}
          selectedSubcategory={selectedSubcategory}
          onCategoryChange={(newCategory) => {
            onCategoryChange(newCategory);
            onSubcategoryChange('');
          }}
          onSubcategoryChange={onSubcategoryChange}
        />

        {/* Quick Tips */}
        {title && (
          <div className="bg-gradient-to-r from-slate-50 to-orange-50 p-4 rounded-lg border border-orange-100">
            <div className="flex items-center gap-2 text-orange-700 mb-3">
              <CheckCircle2 size={20} />
              <span className="font-medium">Quick Tips</span>
            </div>
            <div className="space-y-2 text-sm text-slate-600">
              <p>• A clear title helps buyers find your gig easily</p>
              <p>• Include what makes your service unique</p>
              <p>• Be specific about what you'll deliver</p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <NavigationButtons
          rightButton={{
            text: 'Next',
            onClick: onNext,
            className: `bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg shadow-lg hover:from-orange-600 hover:to-orange-700 transition-all ${!title ? 'opacity-50 cursor-not-allowed' : ''
              }`,
            icon: <FaArrowRight />,
            iconPosition: 'right',
          }}
        />
      </div>
    </AnimatedSection>
  );
};

export default SectionOne;
