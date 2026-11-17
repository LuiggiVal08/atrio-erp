import { useId, type InputHTMLAttributes, type KeyboardEventHandler } from 'react';
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
  maxLength?: number;
  multiline?: boolean;
  rows?: number;
  autoFocus?: boolean;
  onKeyDown?: KeyboardEventHandler<HTMLInputElement | HTMLTextAreaElement>;
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
  maxLength,
  multiline = false,
  rows = 3,
  autoFocus,
  onKeyDown,
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
              aria-label={ariaLabel ?? label}
              aria-required={required}
              value={field.state.value ?? ''}
              onChange={(event) => field.handleChange(event.target.value)}
              onBlur={field.handleBlur}
              onKeyDown={onKeyDown}
              disabled={disabled}
              placeholder={placeholder}
              rows={rows}
              autoFocus={autoFocus}
              className={controlClass}
            />
          ) : (
            <input
              id={inputId}
              aria-label={ariaLabel ?? label}
              aria-required={required}
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
              onKeyDown={onKeyDown}
              disabled={disabled}
              placeholder={placeholder}
              autoComplete={autoComplete}
              autoFocus={autoFocus}
              inputMode={inputMode}
              min={min}
              max={max}
              step={step}
              maxLength={maxLength}
              className={controlClass}
            />
          )}
        </FormField>
      )}
    </form.Field>
  );
}
