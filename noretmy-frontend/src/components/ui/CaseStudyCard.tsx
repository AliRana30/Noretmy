// components/CaseStudyCard.tsx
import Image from 'next/image';
import React from 'react';

interface CaseStudyCardProps {
  imageSrc: string;
  title: string;
  description: string;
  revenueIncrease: string;
  creativityIncrease: string;
}

export const CaseStudyCard: React.FC<CaseStudyCardProps> = ({
  imageSrc,
  title,
  description,
  revenueIncrease,
  creativityIncrease,
}) => {
  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <Image
        width={30}
        height={30}
        src={imageSrc}
        alt={title}
        className="rounded-lg mb-4"
      />
      <div className="space-y-2">
        <span className="bg-gray-200 text-gray-600 px-2 py-1 text-sm rounded-full">
          Generative AI
        </span>
        <h3 className="font-bold text-xl">{title}</h3>
        <p className="text-gray-600">{description}</p>
        <div className="mt-4">
          <p className="text-orange-500 font-bold">
            {revenueIncrease}% Increase in revenue
          </p>
          <p className="text-gray-500">
            {creativityIncrease}% Enhanced employee Creativity
          </p>
        </div>
        <button className="mt-4 underline text-orange-600 hover:text-orange-800 transition">
          Read the case study
        </button>
      </div>
    </div>
  );
};
