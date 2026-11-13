import { PhoneInput } from '@/shared/ui/PhoneInput';
import { FormField } from './form-field';
import type { FormControlBaseProps } from './types';

export interface FormPhoneInputProps extends FormControlBaseProps {
  defaultCountry?: string;
}

export function FormPhoneInput({
  form,
  name,
  label,
  description,
  required,
  disabled,
  className,
  defaultCountry,
}: FormPhoneInputProps) {
  return (
    <form.Field name={name}>
      {(field) => (
        <FormField
          label={label}
          description={description}
          required={required}
          errors={field.state.meta.errors}
          className={className}
        >
          <div onBlur={field.handleBlur}>
            <PhoneInput
              value={field.state.value ?? ''}
              onChange={field.handleChange}
              disabled={disabled}
              defaultCountry={defaultCountry}
            />
          </div>
        </FormField>
      )}
    </form.Field>
  );
}
