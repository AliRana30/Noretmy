import React from 'react';

interface InputFieldProps {
  label: string;
  placeholder: string;
  keyboardType?: 'text' | 'email' | 'numeric' | 'password'; // Optional prop for keyboard type
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  placeholder,
  keyboardType = 'text',
}) => {
  return (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
      </label>
      <input
        type={keyboardType === 'password' ? 'password' : 'text'}
        placeholder={placeholder}
        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
      />
    </div>
  );
};

export default InputField;
