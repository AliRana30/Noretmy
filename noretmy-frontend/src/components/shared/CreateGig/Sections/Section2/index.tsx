import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import {
  HelpCircle,
  Tag,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import AnimatedSection from '../AnimatedSection';
import SectionHeader from '../../SectionHeader';
import NavigationButtons from '../NavigationButtons';

interface SectionTwoProps {
  isVisible: boolean;
  description: string;
  setDescription: (desc: string) => void;
  keywords: string;
  setKeywords: (keywords: string) => void;
  whyChooseMe: string[];
  setWhyChooseMe: (arr: string[]) => void;
  onBack: () => void;
  onNext: () => void;
}

const SectionTwo: React.FC<SectionTwoProps> = ({
  isVisible,
  description,
  setDescription,
  keywords,
  setKeywords,
  whyChooseMe,
  setWhyChooseMe,
  onBack,
  onNext,
}) => {
  const [showDescTooltip, setShowDescTooltip] = useState(false);
  const [showKeywordTooltip, setShowKeywordTooltip] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [descriptionStrength, setDescriptionStrength] = useState(0);
  const [suggestedKeywords, setSuggestedKeywords] = useState<string[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (description || keywords) {
        setIsAutoSaving(true);
        setTimeout(() => {
          setIsAutoSaving(false);
          setLastSaved(new Date());
        }, 1000);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [description, keywords]);

  useEffect(() => {
    let strength = 0;

    if (description.length >= 150) strength += 10;
    if (description.length >= 300) strength += 20;
    if (description.length >= 450) strength += 30;
    if (description.length >= 600) strength += 40;

    if (description.includes('.')) strength += 15;

    if (/\b(experience|skills|provide|deliver|expertise|professional|services|solutions)\b/i.test(description))
      strength += 25;

    if (strength > 100) strength = 100;

    setDescriptionStrength(strength);
  }, [description]);

  useEffect(() => {
    const words: string[] = description.toLowerCase().match(/\b\w+\b/g) || [];
    const common: string[] = [
      'wordpress',
      'development',
      'design',
      'seo',
      'marketing',
      'content',
    ];
    const suggested = common.filter((word: string) => words.includes(word));

    setSuggestedKeywords(suggested);
  }, [description]);

  const personalityTraits = [
    {
      id: 'Hard worker',
      description:
        'Consistently demonstrates dedication and goes above and beyond',
    },
    {
      id: 'Team Player',
      description: 'Collaborates effectively and supports team objectives',
    },
    {
      id: 'Creative',
      description: 'Brings innovative solutions and fresh perspectives',
    },
    {
      id: 'Organized',
      description: 'Maintains excellent structure and planning in work',
    },
    {
      id: 'Flexible',
      description: 'Adapts well to changing requirements and situations',
    },
    {
      id: 'Punctual',
      description: 'Consistently delivers work on time',
    },
    {
      id: 'Reliable',
      description: 'Dependable and consistent in quality and delivery',
    },
  ];

  return (
    <AnimatedSection isVisible={isVisible}>
      <div className="space-y-6">
        {/* Header with Auto-save Status */}
        <div className="flex items-center justify-between mb-4">
          <SectionHeader
            number="02"
            title="Description"
            colors={['#3b82f6', '#1d4ed8']}
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
            <span>Step 2 of 4</span>
            <span>Description & Keywords</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${50 + descriptionStrength / 4}%` }}
            />
          </div>
        </div>

        {/* Description Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <label className="text-lg font-medium text-slate-800">Description</label>
            <div className="relative">
              <HelpCircle
                size={18}
                className="text-slate-400 cursor-pointer hover:text-blue-500 transition-colors"
                onMouseEnter={() => setShowDescTooltip(true)}
                onMouseLeave={() => setShowDescTooltip(false)}
              />
              {showDescTooltip && (
                <div className="absolute z-10 w-72 p-3 bg-slate-800 text-white text-sm rounded-lg shadow-xl -right-2 top-6">
                  <h4 className="font-medium mb-2">
                    Tips for a great description:
                  </h4>
                  <ul className="space-y-1 text-slate-200">
                    <li>• Be specific about your expertise</li>
                    <li>• Mention years of experience</li>
                    <li>• Highlight unique selling points</li>
                    <li>• Include relevant achievements</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
          <div className="relative">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your expertise and what makes you stand out..."
              maxLength={600}
              className="w-full p-4 min-h-[120px] border border-slate-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
            />
            <div className="absolute right-3 bottom-3 flex items-center gap-2">
              <div className="h-2 w-24 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${descriptionStrength > 75
                      ? 'bg-orange-500'
                      : descriptionStrength > 50
                        ? 'bg-orange-500'
                        : 'bg-red-500'
                    }`}
                  style={{ width: `${descriptionStrength}%` }}
                />
              </div>
              <span className="text-sm text-slate-400">
                {600 - description.length} remaining
              </span>
            </div>
          </div>
        </div>

        {/* Keywords Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <label className="text-lg font-medium text-slate-800">Keywords</label>
            <div className="relative">
              <HelpCircle
                size={18}
                className="text-slate-400 cursor-pointer hover:text-blue-500 transition-colors"
                onMouseEnter={() => setShowKeywordTooltip(true)}
                onMouseLeave={() => setShowKeywordTooltip(false)}
              />
              {showKeywordTooltip && (
                <div className="absolute z-10 w-72 p-3 bg-slate-800 text-white text-sm rounded-lg shadow-xl -right-2 top-6">
                  <h4 className="font-medium mb-2">Keyword tips:</h4>
                  <ul className="space-y-1 text-slate-200">
                    <li>• Use relevant industry terms</li>
                    <li>• Include technical skills</li>
                    <li>• Add common search terms</li>
                    <li>• Separate with commas</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
          <input
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="e.g., WordPress, PHP, SEO, Web Design"
            className="w-full p-4 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg transition-all"
          />
          <p className="text-sm text-slate-500 flex items-center gap-1">
            <Tag size={14} />
            Separate each keyword with a comma
          </p>

          {/* Suggested Keywords */}
          {suggestedKeywords.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {suggestedKeywords.map((keyword) => (
                <button
                  key={keyword}
                  onClick={() =>
                    setKeywords(keywords ? `${keywords}, ${keyword}` : keyword)
                  }
                  className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-sm hover:bg-orange-100 transition-colors"
                >
                  + {keyword}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Why Choose Me Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-slate-800">Why choose me?</h3>
            <span className="text-sm text-slate-500">
              Selected: {whyChooseMe.length}/7
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {personalityTraits.map((trait) => (
              <div
                key={trait.id}
                className="flex items-start space-x-3 p-4 rounded-lg hover:bg-slate-50 border border-slate-200 transition-all ease-in-out duration-200"
              >
                <input
                  type="checkbox"
                  id={trait.id}
                  checked={whyChooseMe.includes(trait.id)}
                  onChange={() =>
                    setWhyChooseMe(
                      whyChooseMe.includes(trait.id)
                        ? whyChooseMe.filter((item) => item !== trait.id)
                        : [...whyChooseMe, trait.id],
                    )
                  }
                  className="h-5 w-5 mt-1 border-2 border-slate-300 rounded-md checked:bg-orange-500 checked:border-orange-500 transition-all duration-300 accent-orange-500"
                />
                <div className="space-y-1">
                  <label
                    htmlFor={trait.id}
                    className="block text-sm font-medium text-slate-800 hover:text-orange-600 cursor-pointer"
                  >
                    {trait.id}
                  </label>
                  <p className="text-xs text-slate-500">{trait.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Tips */}
        {description && (
          <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-4 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2 text-blue-700 mb-3">
              <CheckCircle2 size={20} />
              <span className="font-medium">Quick Tips</span>
            </div>
            <div className="space-y-2 text-sm text-slate-600">
              <p>• Your description could be more specific about technical skills</p>
              <p>• Consider adding examples of past successful projects</p>
              <p>• Mentioning industry-specific experience could help</p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <NavigationButtons
          leftButton={{
            text: 'Back',
            onClick: onBack,
            className:
              'bg-slate-200 text-slate-700 px-4 py-2 rounded-lg shadow hover:bg-slate-300 transition-all',
            icon: <FaArrowLeft />,
            iconPosition: 'left',
          }}
          rightButton={{
            text: 'Next',
            onClick: onNext,
            className: `bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all ${!description || !keywords || whyChooseMe.length === 0
                ? 'opacity-50 cursor-not-allowed'
                : ''
              }`,
            icon: <FaArrowRight />,
            iconPosition: 'right',
          }}
        />
      </div>
    </AnimatedSection>
  );
};

export default SectionTwo;
