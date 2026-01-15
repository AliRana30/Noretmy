'use client';
import Agencies from '@/components/svg/Agencies';
import Construction from '@/components/svg/Construction';
import Consulting from '@/components/svg/Consulting';
import Financial from '@/components/svg/Financial';
import Healthcare from '@/components/svg/Healthcare';
import InformationTechnologies from '@/components/svg/InformationTechnologies';
import Logistics from '@/components/svg/Logistics';
import Manufacturing from '@/components/svg/Manufacturing';
import MediaProduction from '@/components/svg/MediaProduction';
import Recruitement from '@/components/svg/Recruitement';
import Saas from '@/components/svg/Saas';
import React, { useState } from 'react';

const IndustriesServeCards = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const gradients = [
    ['#064153', '#186b89', '#12647f'],
    ['#45a4b6', '#93d9e5', '#45a6b7'],
    ['#f27c78', '#d64c59', '#be1939'],
    ['#feb800', '#f9a427', '#faa032', '#f58961'],
    ['#343ea0', '#3d5daa', '#4b80b4', '#5cacc3'],
    ['#bc1437', '#88235b', '#732a71', '#423898'],
    ['#064153', '#186b89', '#12647f'],
    ['#45a4b6', '#93d9e5', '#45a6b7'],
    ['#f27c78', '#d64c59', '#be1939'],
    ['#feb800', '#f9a427', '#faa032', '#f58961'],
    ['#343ea0', '#3d5daa', '#4b80b4', '#5cacc3'],
  ];

  const cards = [
    {
      icon: <Agencies />,
      title: 'Agencies',
      description:
        'We help marketing and creative agencies ditch the busywork and focus on building client relationships.',
    },
    {
      icon: <Consulting />,
      title: 'Consulting',
      description:
        'We make the value prop of consultants clear and captivating, securing more meetings with key decision-makers.',
    },
    {
      icon: <Financial />,
      title: 'Financial Services',
      description:
        'We know how to craft and present your unique value proposition to make it resonate with your prospects.',
    },
    {
      icon: <Healthcare />,
      title: 'Healthcare',
      description:
        'Get up to 30 monthly appointments with decision-makers in the health and medical sectors.',
    },
    {
      icon: <InformationTechnologies />,
      title: 'Information Technologies',
      description:
        'Secure a predictable flow of appointments with prospects and scale your business even in the tightest market.',
    },
    {
      icon: <Logistics />,
      title: 'Logistics',
      description:
        'We handpick perfect-fit leads for your complex offerings, filling your pipeline with quality meetings.',
    },
    {
      icon: <Manufacturing />,
      title: 'Manufacturing',
      description:
        'We handpick perfect-fit leads for your complex offerings, filling your pipeline with quality meetings.',
    },
    {
      icon: <MediaProduction />,
      title: 'Media Production',
      description:
        'Fill your sales pipeline with selected media production leads and get dozens of appointments with our smart outreach.',
    },
    {
      icon: <Recruitement />,
      title: 'Recruitment & Staffing',
      description:
        'We attract the perfect clients and candidates for your agency, saving you precious time and doubling ROI.',
    },
    {
      icon: <Saas />,
      title: 'SaaS Services',
      description:
        'Enhance your sales pipeline with our expertise in generating high-quality prospects in the SaaS field.',
    },
    {
      icon: <Construction />,
      title: 'Digital Marketing',
      description:
        'Boost your software business with proven digital marketing and SEO strategies to drive traffic and double your growth.',
    },
  ];

  return (
    <div className="container mx-auto py-12 px-6">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-3">Industries We Serve</h2>
        <div className="w-24 h-1 bg-blue-600 mx-auto mb-6"></div>
        <p className="text-gray-700 max-w-3xl mx-auto">
          Our specialized expertise spans across multiple industries, delivering
          tailored solutions that drive growth and success.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, index) => (
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
                background: `linear-gradient(135deg, ${gradients[index].join(', ')})`,
                opacity: 0.95,
              }}
            ></div>

            {/* Card Content */}
            <div className="relative z-10 p-6">
              <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <div className="text-white w-8 h-8">{card.icon}</div>
              </div>

              <h3 className="text-xl font-semibold text-white mb-3">
                {card.title}
              </h3>

              <p className="text-white/90 text-sm leading-relaxed mb-4">
                {card.description}
              </p>

              <div className="flex items-center pt-2 border-t border-white/20">
                <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center">
                  Learn more
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
    </div>
  );
};

export default IndustriesServeCards;
