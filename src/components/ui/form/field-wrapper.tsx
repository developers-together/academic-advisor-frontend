import * as React from 'react';
import { type FieldError } from 'react-hook-form';

import { Error } from './error';
import { Label } from './label';

type FieldWrapperProps = {
  label?: string;
  className?: string;
  children: React.ReactNode;
  error?: FieldError | undefined;
};

export type FieldWrapperPassThroughProps = Omit<
  FieldWrapperProps,
  'className' | 'children'
>;

type FieldElementProps = {
  id?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
};

export const FieldWrapper = (props: FieldWrapperProps) => {
  const { label, error, children } = props;
  const generatedId = React.useId();
  const errorId = React.useId();

  const isFieldElement = React.isValidElement<FieldElementProps>(children);
  const fieldId = isFieldElement
    ? (children.props.id ?? generatedId)
    : generatedId;
  const describedBy = isFieldElement
    ? [children.props['aria-describedby'], error ? errorId : undefined]
        .filter(Boolean)
        .join(' ') || undefined
    : undefined;
  const field = isFieldElement
    ? React.cloneElement(children, {
        id: fieldId,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
      })
    : children;

  return (
    <div>
      {label ? <Label htmlFor={fieldId}>{label}</Label> : null}
      <div className="mt-1">{field}</div>
      <Error errorMessage={error?.message} id={errorId} />
    </div>
  );
};
