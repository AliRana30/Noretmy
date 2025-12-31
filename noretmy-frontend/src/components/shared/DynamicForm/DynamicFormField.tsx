'use client';

import React, { useState, useCallback } from 'react';
import { Controller, Control, FieldValues, FieldPath } from 'react-hook-form';
import { FieldSchema } from './schemas/fieldSchemas';
import {
  TextField,
  EmailField,
  PasswordField,
  NumberField,
  PhoneField,
} from './fields';

interface DynamicFormFieldProps<T extends FieldValues> extends FieldSchema {
  control: Control<T>;
  name: FieldPath<T>;
}

const DynamicFormField = <T extends FieldValues>({
  id,
  type,
  placeholder,
  label,
  required = false,
  control,
  name,
}: DynamicFormFieldProps<T>) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = useCallback(() => setIsFocused(true), []);
  const handleBlur = useCallback(() => setIsFocused(false), []);

  const commonProps = {
    id,
    placeholder,
    label,
    required,
    isFocused,
    onFocus: handleFocus,
    onBlur: handleBlur,
  };

  const renderField = (onValueChange: (value: string) => void, error?: string) => {
    switch (type) {
      case 'text':
        return <TextField key={id} {...commonProps} onValueChange={onValueChange} />;
      case 'email':
        return <EmailField key={id} {...commonProps} onValueChange={onValueChange} />;
      case 'password':
        return <PasswordField key={id} {...commonProps} onValueChange={onValueChange} />;
      case 'number':
        return <NumberField key={id} {...commonProps} onValueChange={onValueChange} />;
      case 'tel':
        return <PhoneField key={id} {...commonProps} onValueChange={onValueChange} />;
      default:
        return <TextField key={id} {...commonProps} onValueChange={onValueChange} />;
    }
  };

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <div className="space-y-1.5">
          {renderField(field.onChange, error?.message)}
          {error && <p className="text-sm text-red-500 ml-1 mt-1">{error.message}</p>}
        </div>
      )}
    />
  );
};

export default DynamicFormField;
