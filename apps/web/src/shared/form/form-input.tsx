import { useId, type InputHTMLAttributes } from 'react';
import { FormField } from './form-field';
import { controlClass } from './styles';
import type { FormControlBaseProps } from './types';

export interface FormInputProps extends FormControlBaseProps {
  type?: 'text' | 'number' | 'date' | 'email' | 'tel' | 'password' | 'url';
  placeholder?: string;
  autoComplete?: string;
  inputMode?: InputHTMLAttributes<HTMLInputElement>['inputMode'];
  min?: number | string;
  max?: number | string;
  step?: number | string;
  multiline?: boolean;
  rows?: number;
}

export function FormInput({
  form,
  name,
  label,
  description,
  required,
  disabled,
  className,
  id,
  ariaLabel,
  type = 'text',
  placeholder,
  autoComplete,
  inputMode,
  min,
  max,
  step,
  multiline = false,
  rows = 3,
}: FormInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <form.Field name={name}>
      {(field) => (
        <FormField
          label={label}
          description={description}
          required={required}
          htmlFor={inputId}
          errors={field.state.meta.errors}
          className={className}
        >
          {multiline ? (
            <textarea
              id={inputId}
              aria-label={ariaLabel}
              value={field.state.value ?? ''}
              onChange={(event) => field.handleChange(event.target.value)}
              onBlur={field.handleBlur}
              disabled={disabled}
              placeholder={placeholder}
              rows={rows}
              className={controlClass}
            />
          ) : (
            <input
              id={inputId}
              aria-label={ariaLabel}
              type={type}
              value={field.state.value ?? ''}
              onChange={(event) => {
                if (type === 'number') {
                  field.handleChange(
                    event.target.value === '' ? undefined : Number(event.target.value),
                  );
                  return;
                }
                field.handleChange(event.target.value);
              }}
              onBlur={field.handleBlur}
              disabled={disabled}
              placeholder={placeholder}
              autoComplete={autoComplete}
              inputMode={inputMode}
              min={min}
              max={max}
              step={step}
              className={controlClass}
            />
          )}
        </FormField>
      )}
    </form.Field>
  );
}
