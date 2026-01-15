import React from 'react';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import AnimatedSection from '../AnimatedSection';
import SectionHeader from '../../SectionHeader';
import UploadMultimedia from '../../UploadMultimedia';
import NavigationButtons from '../NavigationButtons';

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
}) => (
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
        onClick: onNext,
        className:
          'bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all',
        icon: <FaArrowRight />,
        iconPosition: 'right',
      }}
    />
  </AnimatedSection>
);

export default SectionFour;
