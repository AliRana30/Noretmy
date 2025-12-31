'use client';

import React, { useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail } from 'lucide-react';

export interface EmailFieldProps {
  id: string;
  placeholder: string;
  label?: string;
  required?: boolean;
  onValueChange: (value: string) => void;
  isFocused: boolean;
  onFocus: () => void;
  onBlur: () => void;
}

const EmailField = ({
  id,
  placeholder,
  label,
  required = false,
  onValueChange,
  isFocused,
  onFocus,
  onBlur,
}: EmailFieldProps) => {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onValueChange(e.target.value);
  }, [onValueChange]);

  return (
    <div className="space-y-1.5">
      {label && (
        <Label htmlFor={id} className="text-sm font-medium text-gray-700 ml-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Mail size={18} className="text-gray-500" />
        </div>
        
        <Input
          id={id}
          type="email"
          onChange={handleChange}
          className={`w-full h-12 pl-11 pr-4 rounded-xl border transition-all text-gray-800 placeholder-gray-400 shadow-sm ${
            isFocused
              ? 'border-neutral-900 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900'
              : 'border-gray-200 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900'
          }`}
          placeholder={placeholder}
          onFocus={onFocus}
          onBlur={onBlur}
          required={required}
        />
      </div>
    </div>
  );
};

export default EmailField;
