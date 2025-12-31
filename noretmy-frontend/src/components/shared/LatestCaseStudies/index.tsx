import React from 'react';
import Paragraph from '@/components/ui/Paragraph';
import Image from 'next/image';

const latestcasestudies = [
  {
    description:
      'Noretmy partnered with a leading e-commerce platform to implement AI-driven product recommendations.',
    image: '/images/casestudy1.jpg',
    figure1_value: '29%',
    figure1: 'Enhanced User Experience',
    figure2_value: '120%',
    figure2: 'Increased conversion rates',
    tags: ['201-500', 'Environmental services'],
  },
  {
    description:
      'Noretmydeveloped a custom ERP solution for a global manufacturing firm, optimizing their supply chain.',
    image: '/images/casestudy2.jpg',
    figure1_value: '23%',
    figure1: 'Enhanced workflow',
    figure2_value: '13%',
    figure2: 'Reduced operational costs',
    tags: ['11-50 employees', 'Renewable Energy'],
  },
  {
    description:
      'Noretmyintegrated IoT devices for a healthcare provider, enhancing remote patient monitoring and data management.',
    image: '/images/casestudy3.jpg',
    figure1_value: '$60,000',
    figure1: 'Total cost of deals in 3 months',
    figure2_value: '72',
    figure2: 'Appointments Booked',
    tags: ['51-200 employees', 'Health care'],
  },
  {
    description:
      'Noretmydeveloped a blockchain platform for a financial institution, ensuring secure and transparent transactions.',
    image: '/images/casestudy4.jpg',
    figure1_value: '0%',
    figure1: 'Security Risk',
    figure2_value: '20%',
    figure2: 'Increase Transactions',
    tags: ['11-50 employees', 'Media Production'],
  },
];

export const LatestCaseStudies = () => {
  return (
    <div className="w-full px-10 sm:px-16 md:px-20 mt-8 mb-20">
      <p className="text-5xl font-bold mb-10">Latest case studies</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {latestcasestudies.map((caseStudy, index) => (
          <div key={index} className="bg-white rounded-2xl shadow-lg">
            <div className="max-h-[210px] md:max-h-[180px] lg:max-h-[260px] xl:max-h-[320px] overflow-hidden">
              <Image
                src={caseStudy.image}
                alt={`Case Study ${index + 1}`}
                width={638}
                height={320}
                className="w-full h-auto rounded-2xl"
              />
            </div>

            <div className="p-7 space-y-6">
              <div>
                <Image
                  src="/logo/openai.png"
                  alt="openai"
                  width={87}
                  height={36}
                />
              </div>
              <p className="text-black text-2xl font-bold">
                {caseStudy.description}
              </p>
              <div className="flex">
                <div className="flex flex-col w-1/2 text-left">
                  <p className="text-2xl font-bold text-orange-button mb-1">
                    {caseStudy.figure1_value}
                  </p>
                  <Paragraph color={'dark-ceoclr'} title={caseStudy.figure1} />
                </div>
                <div className="flex flex-col w-1/2 text-left">
                  <p className="text-2xl font-bold text-orange-button mb-1">
                    {caseStudy.figure2_value}
                  </p>
                  <Paragraph color={'dark-ceoclr'} title={caseStudy.figure2} />
                </div>
              </div>
              <div className="flex flex-wrap space-x-4 text-end">
                {caseStudy.tags.map((tag, index2) => (
                  <p
                    key={index2}
                    className="px-3 text-dark-p4 text-xs font-medium bg-light-Noretmyrounded-[48px] p-2 inline-block"
                  >
                    {tag}
                  </p>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="text-center mt-16">
        <button className="bg-transparent border-2 border-dark-secondary text-dark-secondary text-lg font-semibold px-6 py-3 rounded-xl">
          Load More
        </button>
      </div>
    </div>
  );
};
