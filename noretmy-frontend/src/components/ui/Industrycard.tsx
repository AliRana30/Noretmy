import React from 'react';
import Nextarrow from '../svg/Nextarrow';

interface CardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string[];
}

const Industrycard: React.FC<CardProps> = ({
  title,
  description,
  icon,
  gradient,
}) => {
  return (
    <div className="relative bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 overflow-hidden w-full max-w-md">
      {/* Gradient Background Section */}
      <div
        className="absolute top-50 left-0 w-full h-2/5"
        style={{
          background: `linear-gradient(135deg, ${gradient.join(', ')})`,
          clipPath: 'ellipse(120% 75% at 50% -10%)',
        }}
      ></div>

      {/* Icon Section */}
      <div className="relative z-10 flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg -translate-y-0 translate-x-10">
        {icon}
      </div>

      {/* Content Section */}
      <div className="p-8">
        <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
        <p className="text-gray-600 text-sm mt-2">{description}</p>
      </div>

      {/* Footer CTA */}
      <div className="flex justify-end items-center px-8 py-4">
        <button className="flex items-center text-gray-700 hover:text-gray-900 transition-colors">
          {/* <span className="font-medium mr-2">Learn More</span> */}
          <Nextarrow className="w-5 h-5 transition-transform transform hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
};

export default Industrycard;
