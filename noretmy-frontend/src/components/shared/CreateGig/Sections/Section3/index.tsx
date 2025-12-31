// File: components/SectionThree.tsx
import React from 'react';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import AnimatedSection from '../AnimatedSection';
import SectionHeader from '../../SectionHeader';
import PricingPlan from '../../PricingPlan';
import AddonFaqItem from '../../AddonFaqItem';
import Faq from '../../FaqsItem';
import NavigationButtons from '../NavigationButtons';

interface Addon {
  title: string;
  price: string;
  description: string;
}

interface FaqItem {
  question: string;
  answer: string;
}

type PlanType = 'basic' | 'premium' | 'pro';

interface PlanData {
  title: string;
  description: string;
  price: string;
  deliveryTime: string;
}

interface SectionThreeProps {
  isVisible: boolean;
  pricingPlan: string;
  setPricingPlan: (plan: string) => void;
  addons: Addon[];
  setAddons: (addons: Addon[]) => void;
  faqs: FaqItem[];
  setFaqs: (faqs: FaqItem[]) => void;
  onBack: () => void;
  onNext: () => void;
  pricingData: Record<PlanType, PlanData>;
  setPricingData: React.Dispatch<React.SetStateAction<Record<PlanType, PlanData>>>;
}

const SectionThree: React.FC<SectionThreeProps> = ({
  isVisible,
  pricingPlan,
  setPricingPlan,
  addons,
  setAddons,
  faqs,
  setFaqs,
  onBack,
  onNext,
  setPricingData,
  pricingData
}) => (
  <AnimatedSection isVisible={isVisible}>
    <SectionHeader
      number="03"
      title="Create custom pricing plans"
      colors={['#f97316', '#ea580c']}
    />

    <PricingPlan selectPlan={pricingPlan} onSelectPlan={setPricingPlan} pricingData={pricingData}
      setPricingData={setPricingData} />

    <AddonFaqItem items={addons} setItems={setAddons} />

    <Faq items={faqs} setItems={setFaqs} />

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
          'bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg shadow-lg hover:from-orange-600 hover:to-orange-700 transition-all',
        icon: <FaArrowRight />,
        iconPosition: 'right',
      }}
    />
  </AnimatedSection>
);

export default SectionThree;
