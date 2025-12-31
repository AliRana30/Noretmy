'use client';

import React, { useMemo } from 'react';
import { Control, UseFormWatch, FieldValues, FieldPath } from 'react-hook-form';
import { FieldSchema } from './schemas/fieldSchemas';
import DynamicFormField from './DynamicFormField';

interface DynamicFormProps<T extends FieldValues> {
  fields: (FieldSchema & { name: FieldPath<T> })[];
  control: Control<T>;
  watch: UseFormWatch<T>;
  className?: string;
}

const DynamicForm = <T extends FieldValues>({
  fields,
  control,
  watch,
  className = ''
}: DynamicFormProps<T>) => {
  const renderedFields = useMemo(() =>
    fields.map(field => (
      <DynamicFormField
        key={field.id}
        {...field}
        control={control}
      />
    )),
    [fields, control]
  );

  return <div className={`space-y-5 ${className}`}>{renderedFields}</div>;
};

export default DynamicForm;
export type { FieldSchema };
