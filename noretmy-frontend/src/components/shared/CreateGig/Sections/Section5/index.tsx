import React from 'react';
import { FaArrowLeft, FaCheck } from 'react-icons/fa';
import AnimatedSection from '../AnimatedSection';
import SectionHeader from '../../SectionHeader';
import UpgradeOption from '../../upgradeOption';
import NavigationButtons from '../NavigationButtons';

interface UpgradeOptionType {
  title: string;
  price: number;
  description: string;
  colors: string[];
}

interface SectionFiveProps {
  isVisible: boolean;
  upgradeOptions: UpgradeOptionType[];
  selectedOption: number | null;
  setSelectedOption: (index: number | null) => void;
  jobStatus: string;
  setJobStatus: (status: string) => void;
  onBack: () => void;
  onSubmit: () => void;
}

const SectionFive: React.FC<SectionFiveProps> = ({
  isVisible,
  upgradeOptions,
  selectedOption,
  setSelectedOption,
  jobStatus,
  setJobStatus,
  onBack,
  onSubmit,
}) => (
  <AnimatedSection isVisible={isVisible}>
    <SectionHeader
      number="05"
      title="Upgrade Your Gig"
      colors={['#f97316', '#ea580c']}
    />

    {/* Upgrade Options */}
    <div className="space-y-4 mb-6">
      {upgradeOptions.map((option, index) => (
        <div
          key={index}
          className="transition-all duration-200 hover:shadow-md rounded-lg"
        >
          <UpgradeOption
            title={option.title}
            price={option.price}
            description={option.description}
            colors={option.colors}
            isSelected={selectedOption === index}
            onPress={() => setSelectedOption(index)}
          />
        </div>
      ))}
    </div>

    {/* Job Availability */}
    <div className="mb-6">
      <h2 className="text-xl font-semibold text-slate-800 mb-3">
        Select Gig Availability
      </h2>
      <p className="text-sm text-slate-600 mb-4">
        Choose whether this gig is available or not.
      </p>
      <div className="flex justify-center gap-4">
        <button
          onClick={() => setJobStatus('Available')}
          className={`px-6 py-3 rounded-lg flex items-center gap-2 transition-all duration-300 ${jobStatus === 'Available'
              ? 'bg-orange-500 text-white shadow-lg'
              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
        >
          <span className="text-sm font-semibold">Available</span>
        </button>
        <button
          onClick={() => setJobStatus('Not Available')}
          className={`px-6 py-3 rounded-lg flex items-center gap-2 transition-all duration-300 ${jobStatus === 'Not Available'
              ? 'bg-red-500 text-white shadow-lg'
              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
        >
          <span className="text-sm font-semibold">Not Available</span>
        </button>
      </div>
    </div>

    <NavigationButtons
      leftButton={{
        text: 'Back',
        onClick: onBack,
        className:
          'bg-slate-200 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-300 transition-all',
        icon: <FaArrowLeft />,
        iconPosition: 'left',
      }}
      rightButton={{
        text: 'Submit',
        onClick: onSubmit,
        className:
          'bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 shadow-lg hover:from-orange-600 hover:to-orange-700 transition-all',
        icon: <FaCheck />,
        iconPosition: 'right',
      }}
    />
  </AnimatedSection>
);

export default SectionFive;
