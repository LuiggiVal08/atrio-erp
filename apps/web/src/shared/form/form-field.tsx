import type { ReactNode } from 'react';
import { FieldLabel } from '@/shared/ui/FieldLabel';
import { fieldErrorMessages } from './errors';

interface FormFieldProps {
  label?: string;
  description?: string;
  required?: boolean;
  htmlFor?: string;
  errors?: unknown[];
  className?: string;
  children: ReactNode;
}

export function FormField({
  label,
  description,
  required,
  htmlFor,
  errors,
  className = '',
  children,
}: FormFieldProps) {
  const messages = fieldErrorMessages(errors);

  return (
    <div className={className}>
      {label && (
        <FieldLabel
          label={label}
          description={description}
          required={required}
          htmlFor={htmlFor}
        />
      )}
      {children}
      {messages.length > 0 && (
        <p role="alert" className="mt-1 text-xs text-red-500">
          {messages.join(' · ')}
        </p>
      )}
    </div>
  );
}
