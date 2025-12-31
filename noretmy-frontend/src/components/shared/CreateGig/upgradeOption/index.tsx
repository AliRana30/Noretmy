import React from 'react';

interface UpgradeOptionProps {
  title: string;
  price: number;
  description: string;
  colors: string[];
  isSelected: boolean;
  onPress: () => void;
}

const UpgradeOption: React.FC<UpgradeOptionProps> = ({
  title,
  price,
  description,
  colors,
  isSelected,
  onPress,
}) => {
  return (
    <button
      onClick={onPress}
      className={`relative flex flex-col items-start p-3 rounded-lg shadow-sm transition-transform transform hover:scale-105 hover:shadow-lg 
        ${isSelected ? 'ring-2 ring-blue-500' : 'ring-1 ring-gray-300'}`}
      style={{
        background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
      }}
      aria-pressed={isSelected}
    >
      {/* Badge for selected state */}
      {isSelected && (
        <span
          className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 bg-white-500 text-white text-xs font-bold rounded-full shadow"
          aria-label="Selected"
        >
          ✓
        </span>
      )}

      {/* Title and Price */}
      <div className="flex justify-between items-center w-full mb-2">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <p className="text-lg font-bold text-white">{`$${price}`}</p>
      </div>

      {/* Description */}
      <p className="text-xs text-white opacity-90">{description}</p>
    </button>
  );
};

export default UpgradeOption;
