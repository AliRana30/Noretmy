import React from 'react';
import { FaCheckSquare, FaSquare } from 'react-icons/fa'; // Using react-icons for the checkboxes

interface CheckboxOptionProps {
  label: string;
  isChecked: boolean;
  onPress: () => void;
}

const CheckboxOption: React.FC<CheckboxOptionProps> = ({
  label,
  isChecked,
  onPress,
}) => {
  return (
    <div className="flex items-center space-x-2" onClick={onPress}>
      <div
        className={`flex items-center justify-center w-6 h-6 border-2 rounded-md cursor-pointer ${
          isChecked
            ? 'bg-gradient-to-r from-teal-400 to-teal-200'
            : 'bg-white border-gray-300'
        }`}
      >
        {isChecked ? (
          <FaCheckSquare className="text-white text-lg" />
        ) : (
          <FaSquare className="text-gray-700 text-lg" />
        )}
      </div>
      <span className="text-sm text-gray-700">{label}</span>
    </div>
  );
};

export default CheckboxOption;
