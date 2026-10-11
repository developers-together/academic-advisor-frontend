import * as React from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';

import { cn } from '@/utils/cn';

import { FieldWrapper, FieldWrapperPassThroughProps } from './field-wrapper';

type Option = {
  label: React.ReactNode;
  value: string | number | string[];
};

type SelectFieldProps = FieldWrapperPassThroughProps & {
  options: Option[];
  className?: string;
  defaultValue?: string;
  disabled?: boolean;
  registration: Partial<UseFormRegisterReturn>;
};

export const Select = (props: SelectFieldProps) => {
  const {
    label,
    options,
    error,
    className,
    defaultValue,
    disabled,
    registration,
    ...rest
  } = props;
  return (
    <FieldWrapper label={label} error={error}>
      <select
        className={cn(
          'mt-1 block min-h-11 w-full rounded-md border-input bg-background py-2 ps-3 pe-10 text-base text-foreground focus:border-ring focus:ring-ring focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm [@media(pointer:fine)_and_(min-width:1024px)]:min-h-9',
          className,
        )}
        defaultValue={defaultValue}
        disabled={disabled}
        {...registration}
        {...rest}
      >
        {options.map(({ label, value }) => (
          <option key={label?.toString()} value={value}>
            {label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
};
