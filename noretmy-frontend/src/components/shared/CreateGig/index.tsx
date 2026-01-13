'use client';

import React, { useState } from 'react';
import SectionOne from './Sections/Section1';
import SectionTwo from './Sections/Section2';
import SectionThree from './Sections/Section3';
import SectionFour from './Sections/Section4';
import SectionFive from './Sections/Section5';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { showError, showSuccess } from '@/util/toast';

interface UpgradeOptionType {
  title: string;
  price: number;
  description: string;
  colors: string[];
  value: string;
}

const AddJobScreen: React.FC = () => {

  // State for various inputs
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [whyChooseMe, setWhyChooseMe] = useState<string[]>([]);
  const [pricingPlan, setPricingPlan] = useState('Basic');
  const [addons, setAddons] = useState<
    { title: string; price: string; description: string }[]
  >([]);
  const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [jobStatus, setJobStatus] = useState('Available');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [currentSection, setCurrentSection] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  type PlanType = 'basic' | 'premium' | 'pro';

  interface PlanData {
    title: string;
    description: string;
    price: string;
    deliveryTime: string;
  }

  const [pricingPlanData, setPricingPlanData] = useState<Record<PlanType, PlanData>>({
    basic: { title: '', description: '', price: '', deliveryTime: '1' },
    premium: { title: '', description: '', price: '', deliveryTime: '1' },
    pro: { title: '', description: '', price: '', deliveryTime: '1' },
  });

  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

  const router = useRouter();

  const upgradeOptions: UpgradeOptionType[] = [
    {
      title: 'Featured',
      value: 'featured',
      price: 10,
      description: 'Featured ads are highlighted in search results.',
      colors: ['#f97316', '#ea580c'],
    },
    {
      title: 'Sponsored',
      value: 'sponsored',
      price: 30,
      description: 'Sponsored ads appear at the top of search results.',
      colors: ['#3b82f6', '#1d4ed8'],
    },
    {
      title: 'Homepage',
      value: 'homepage',
      price: 50,
      description: 'Your ad appears on the homepage.',
      colors: ['#f97316', '#c2410c'],
    },
    {
      title: 'Free',
      value: 'free',
      price: 0,
      description: 'Free ads are displayed after Featured Ads.',
      colors: ['#64748b', '#475569'],
    },
  ];

  const handleSectionChange = (direction: 'next' | 'back') => {
    setCurrentSection((prev) => {
      if (direction === 'next') return prev < 5 ? prev + 1 : prev;
      if (direction === 'back') return prev > 1 ? prev - 1 : prev;
      return prev;
    });
  };

  const handleSubmit = async () => {
    if (!title || title.trim().length < 10) {
      showError('Title is required and must be at least 10 characters long.');
      return;
    }

    if (!description || description.trim().length < 100) {
      showError('Description is required and must be at least 100 characters long.');
      return;
    }

    if (!keywords || keywords.length === 0) {
      showError('Please enter at least one keyword.');
      return;
    }

    if (!whyChooseMe || !Array.isArray(whyChooseMe) || whyChooseMe.length === 0) {
      showError('"Why Choose Me" section must have at least one entry.');
      return;
    }

    if (!pricingPlan || pricingPlan.length === 0) {
      showError('Please add all pricing plans.');
      return;
    }

    if (!jobStatus) {
      showError('Job status is required.');
      return;
    }

    if (!category || category.trim().length === 0) {
      showError('Please select a category.');
      return;
    }

    if (!subcategory || subcategory.trim().length === 0) {
      showError('Please select a subcategory.');
      return;
    }

    if (selectedOption === null) {
      showError('Please select a promotion type.');
      return;
    }

    if (!photos || photos.length === 0) {
      showError('Please upload at least one photo.');
      return;
    }

    setIsLoading(true);
    try {
      // ⏳ PREPARE FORM DATA
      const formData = new FormData();
      formData.append('title', title);
      formData.append('cat', category);
      formData.append('subCat', subcategory);
      formData.append('description', description);
      formData.append('whyChooseMe', JSON.stringify(whyChooseMe));
      formData.append('keywords', keywords);
      formData.append('pricingPlan', JSON.stringify(pricingPlanData));
      formData.append('jobStatus', jobStatus);

      if (faqs && faqs.length > 0) {
        formData.append('faqs', JSON.stringify(faqs));
      }

      if (photos && photos.length > 0) {
        photos.forEach(photo => formData.append('images', photo));
      }

      // 📡 SEND REQUEST
      const response = await axios.post(`${BACKEND_URL}/job/add-job`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
      });

      // ✅ CLEAR ONLY ON SUCCESS
      setTitle('');
      setCategory('');
      setSubcategory('');
      setDescription('');
      setWhyChooseMe([]);
      setKeywords('');
      setPricingPlan('');
      setFaqs([]);
      setPhotos([]);
      setJobStatus('');
      setAddons([]);

      showSuccess('Gig created successfully!');

      // 🚀 REDIRECT BASED ON PLAN
      if (selectedOption !== 3) {
        const sPlan = upgradeOptions[selectedOption];
        const query = new URLSearchParams({
          gigId: String(response.data.data._id),
          promotionalPlan: String(sPlan.value),
          title: String(sPlan.title),
          price: String(sPlan.price),
          description: String(sPlan.description),
          payment_type: 'gig_promotion',
        }).toString();

        router.push(`/checkout?${query}`);
      } else {
        // Redirect to gigs page for free plan
        router.push('/dashboard/gigs');
      }
    } catch (error) {
      console.error('Error posting job:', error);
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || 'Server returned an error.';
        showError(message);
      } else {
        showError('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Tooltip content for each section
  const tooltipContent: { [key: number]: { title: string; tips: string[] } } = {
    1: {
      title: 'Title & Category',
      tips: [
        'Keep the title clear and concise.',
        'Choose the right category for better visibility.',
        'Use relevant subcategories.',
      ],
    },
    2: {
      title: 'Description & Keywords',
      tips: [
        'Write a detailed and engaging description.',
        'Use bullet points for clarity.',
        'Add relevant keywords for search optimization.',
      ],
    },
    3: {
      title: 'Pricing & Add-ons',
      tips: [
        'Set competitive yet fair prices.',
        'Offer multiple pricing plans.',
        'Include useful add-ons to increase value.',
      ],
    },
    4: {
      title: 'Images & Media',
      tips: [
        'Use high-quality images.',
        'Add a short video for better engagement.',
        'Showcase previous work samples.',
      ],
    },
    5: {
      title: 'Ad Promotion',
      tips: [
        'Use Featured Ads for better exposure.',
        'Sponsored Ads appear at the top.',
        'Homepage Ads increase visibility.',
      ],
    },
  };

  return (
    <div className="container mx-auto p-4 max-w-screen-lg md:flex md:gap-8 text-center md:text-left">
      {/* <div className="relative w-full">
        <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
          <div
            className="h-2 bg-blue-500 transition-all duration-300"
            style={{ width: `${(currentSection / 5) * 100}%` }}
          ></div>
        </div>
        <div className="absolute w-full flex justify-between text-xs font-semibold text-gray-600 top-3">
          {[1, 2, 3, 4, 5].map((step) => (
            <div key={step} className={`w-6 h-6 flex items-center justify-center rounded-full ${step <= currentSection ? "bg-blue-500 text-white" : "bg-gray-300 text-gray-700"}`}>
              {step}
            </div>
          ))}
        </div>
      </div> */}

      {/* Left Side - Form Sections */}
      <div className="w-full md:w-3/4 mx-auto">
        <SectionOne
          isVisible={currentSection === 1}
          title={title}
          setTitle={setTitle}
          selectedCategory={category}
          selectedSubcategory={subcategory}
          onCategoryChange={(newCategory) => {
            setCategory(newCategory);
            setSubcategory('');
          }}
          onSubcategoryChange={setSubcategory}
          onNext={() => handleSectionChange('next')}
        />
        <SectionTwo
          isVisible={currentSection === 2}
          description={description}
          setDescription={setDescription}
          keywords={keywords}
          setKeywords={setKeywords}
          whyChooseMe={whyChooseMe}
          setWhyChooseMe={setWhyChooseMe}
          onBack={() => handleSectionChange('back')}
          onNext={() => handleSectionChange('next')}
        />
        <SectionThree
          isVisible={currentSection === 3}
          pricingPlan={pricingPlan}
          setPricingPlan={setPricingPlan}
          addons={addons}
          setAddons={setAddons}
          faqs={faqs}
          setFaqs={setFaqs}
          onBack={() => handleSectionChange('back')}
          onNext={() => handleSectionChange('next')}
          pricingData={pricingPlanData}
          setPricingData={setPricingPlanData}
        />
        <SectionFour
          isVisible={currentSection === 4}
          photos={photos}
          onAddPhoto={(files) => setPhotos(files)}
          onBack={() => handleSectionChange('back')}
          onNext={() => handleSectionChange('next')}
        />
        <SectionFive
          isVisible={currentSection === 5}
          upgradeOptions={upgradeOptions}
          selectedOption={selectedOption}
          setSelectedOption={setSelectedOption}
          jobStatus={jobStatus}
          setJobStatus={setJobStatus}
          onBack={() => handleSectionChange('back')}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </div>

      {/* Right Side - Tooltip Section */}
      <div className="w-1/4 sticky top-10 hidden md:block">
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-lg">
          {/* Tooltip Header with Icon */}
          <div className="flex items-center gap-2 mb-3">
            <svg
              className="w-6 h-6 text-orange-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 16h-1v-4h-1m1-4h.01M12 20h.01M12 4h.01M12 12h.01"
              ></path>
            </svg>
            <h3 className="font-semibold text-slate-800 text-lg">
              {tooltipContent[currentSection].title}
            </h3>
          </div>

          {/* Divider Line */}
          <div className="border-t border-slate-200 mb-3"></div>

          {/* Tooltip Tips List */}
          <ul className="text-sm text-slate-600 space-y-2">
            {tooltipContent[currentSection].tips.map((tip, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-orange-500">✔</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AddJobScreen;
