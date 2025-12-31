import React from 'react';

interface SectionHeaderProps {
  number?: string;
  title?: string;
  colors?: string[];
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  number,
  title,
  colors,
}) => {
  return (
    <div className={`p-6 rounded-lg `}>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        <span className="bg-orange-100 text-orange-600 text-sm font-medium px-3 py-1 rounded-full">
          Step {number}
        </span>
      </div>
    </div>
  );
};

export default SectionHeader;
