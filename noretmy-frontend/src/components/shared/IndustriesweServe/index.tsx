'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FaHospital,
  FaShoppingCart,
  FaPlane,
  FaBuilding,
  FaFilm,
  FaUtensils,
} from 'react-icons/fa';
import { useTranslations } from '@/hooks/useTranslations';

interface IndustriesWeServeProps {
  id: string;
}

const IndustriesWeServe: React.FC<IndustriesWeServeProps> = ({ id }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const { t } = useTranslations();

  // Using the same gradients as the reference design
  const gradients = [
    ['#064153', '#186b89', '#12647f'],
    ['#45a4b6', '#93d9e5', '#45a6b7'],
    ['#f27c78', '#d64c59', '#be1939'],
    ['#feb800', '#f9a427', '#faa032', '#f58961'],
    ['#343ea0', '#3d5daa', '#4b80b4', '#5cacc3'],
    ['#bc1437', '#88235b', '#732a71', '#423898'],
  ];

  const industryIcons = [
    <FaHospital key="healthcare" size={24} />,
    <FaShoppingCart key="retail" size={24} />,
    <FaPlane key="travel" size={24} />,
    <FaBuilding key="realestate" size={24} />,
    <FaFilm key="entertainment" size={24} />,
    <FaUtensils key="food" size={24} />,
  ];

  const industries = t('home:industries.items', { returnObjects: true }) as Array<{
    title: string;
    description: string;
  }>;

  return (
    <section id={id} className="container mx-auto py-12 px-6">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-3">
          {t('home:industries.header.title')}
        </h2>
        <div className="w-24 h-1 bg-blue-600 mx-auto mb-6"></div>
        <p className="text-gray-700 max-w-3xl mx-auto">
          {t('home:industries.header.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {industries.map((industry, index) => (
          <div
            key={index}
            className="group relative overflow-hidden rounded-lg shadow-md transition-all duration-300 hover:shadow-xl"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {/* Card Background with Gradient */}
            <div
              className="absolute inset-0 z-0"
              style={{
                background: `linear-gradient(135deg, ${gradients[index % gradients.length].join(', ')})`,
                opacity: 0.95,
              }}
            ></div>

            {/* Card Content */}
            <div className="relative z-10 p-6">
              <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <div className="text-white w-8 h-8">{industryIcons[index]}</div>
              </div>

              <h3 className="text-xl font-semibold text-white mb-3">
                {industry.title}
              </h3>

              <p className="text-white/90 text-sm leading-relaxed mb-4">
                {industry.description}
              </p>

              <div className="flex items-center pt-2 border-t border-white/20">
                <span 
                  className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center"
                  aria-label={t('home:industries.aria.learnMore', { industry: industry.title })}
                >
                  {t('home:industries.cta')}
                  <svg
                    className="w-4 h-4 ml-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full bg-white opacity-10 transition-transform duration-300 group-hover:scale-110"></div>
            <div className="absolute top-6 right-6 w-2 h-2 rounded-full bg-white opacity-70"></div>
            <div className="absolute top-12 right-12 w-1 h-1 rounded-full bg-white opacity-70"></div>
          </div>
        ))}
      </div>

      {/* Explore Button */}
      <div className="mt-12 text-center">
        <Link href="/industry">
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors">
            {t('home:industries.cta')}
          </button>
        </Link>
      </div>
    </section>
  );
};

export default IndustriesWeServe;