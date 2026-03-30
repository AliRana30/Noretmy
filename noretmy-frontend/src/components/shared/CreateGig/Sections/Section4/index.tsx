import React from 'react';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import AnimatedSection from '../AnimatedSection';
import SectionHeader from '../../SectionHeader';
import UploadMultimedia from '../../UploadMultimedia';
import NavigationButtons from '../NavigationButtons';
import { showError } from '@/util/toast';

interface SectionFourProps {
  isVisible: boolean;
  photos: File[];
  onAddPhoto: (files: File[]) => void;
  onBack: () => void;
  onNext: () => void;
}

const SectionFour: React.FC<SectionFourProps> = ({
  isVisible,
  photos,
  onAddPhoto,
  onBack,
  onNext,
}) => {
  const handleNext = () => {
    if (!photos || photos.length === 0) {
      showError('Please upload at least one photo for your gig.');
      return;
    }
    onNext();
  };

  return (
  <AnimatedSection isVisible={isVisible}>
    <SectionHeader
      number="04"
      title="Upload multimedia"
      colors={['#3b82f6', '#1d4ed8']}
    />

    <UploadMultimedia photos={photos} onAddPhoto={onAddPhoto} />

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
        onClick: handleNext,
        disabled: !photos || photos.length === 0,
        className:
          `bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all ${!photos || photos.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`,
        icon: <FaArrowRight />,
        iconPosition: 'right',
      }}
    />
  </AnimatedSection>
  );
};

export default SectionFour;
