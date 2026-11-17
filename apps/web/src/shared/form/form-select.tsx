import { useId } from 'react';
import { FormField } from './form-field';
import { controlClass } from './styles';
import type { FormControlBaseProps } from './types';

export interface FormSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface FormSelectProps extends FormControlBaseProps {
  options: FormSelectOption[];
  placeholder?: string;
  onValueChange?: (value: string) => void;
}

export function FormSelect({
  form,
  name,
  label,
  description,
  required,
  disabled,
  className,
  id,
  ariaLabel,
  options,
  placeholder,
  onValueChange,
}: FormSelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <form.Field name={name}>
      {(field) => (
        <FormField
          label={label}
          description={description}
          required={required}
          htmlFor={selectId}
          errors={field.state.meta.errors}
          className={className}
        >
          <select
            id={selectId}
            aria-label={ariaLabel}
            value={field.state.value ?? ''}
            onChange={(event) => {
              field.handleChange(event.target.value);
              onValueChange?.(event.target.value);
            }}
            onBlur={field.handleBlur}
            disabled={disabled}
            className={controlClass}
          >
            {placeholder !== undefined && <option value="">{placeholder}</option>}
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>
      )}
    </form.Field>
  );
}
