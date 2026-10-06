import * as React from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';

import { cn } from '@/utils/cn';

import { FieldWrapper, FieldWrapperPassThroughProps } from './field-wrapper';

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> &
  FieldWrapperPassThroughProps & {
    className?: string;
    registration: Partial<UseFormRegisterReturn>;
  };

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, registration, ...props }, ref) => {
    return (
      <FieldWrapper label={label} error={error}>
        <textarea
          className={cn(
            'flex min-h-15 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm',
            className,
          )}
          ref={ref}
          {...registration}
          {...props}
        />
      </FieldWrapper>
    );
  },
);
Textarea.displayName = 'Textarea';

export { Textarea };
