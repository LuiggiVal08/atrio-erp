import { useId } from 'react';
import { Combobox, type ComboboxOption } from '@/core/components/Combobox';
import { FormField } from './form-field';
import type { FormControlBaseProps } from './types';

export interface FormComboboxProps extends FormControlBaseProps {
  options: ComboboxOption[];
  placeholder?: string;
}

export function FormCombobox({
  form,
  name,
  label,
  description,
  required,
  disabled,
  className,
  id,
  options,
  placeholder,
}: FormComboboxProps) {
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
          <div onBlur={field.handleBlur}>
            <Combobox
              id={inputId}
              value={field.state.value ?? ''}
              onChange={field.handleChange}
              options={options}
              placeholder={placeholder}
              disabled={disabled}
              aria-label={label ?? name}
            />
          </div>
        </FormField>
      )}
    </form.Field>
  );
}
