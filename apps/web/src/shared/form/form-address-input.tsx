import { AddressInput, type AddressValues } from '@/shared/ui/AddressInput';
import { FormField } from './form-field';
import type { FormControlBaseProps } from './types';

export type FormAddressInputProps = FormControlBaseProps;

const emptyAddress: AddressValues = {
  country: 'VE',
  state: '',
  city: '',
  addressLine: '',
  reference: '',
};

export function FormAddressInput({
  form,
  name,
  label,
  description,
  required,
  disabled,
  className,
}: FormAddressInputProps) {
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
            <AddressInput
              value={field.state.value ?? emptyAddress}
              onChange={field.handleChange}
              disabled={disabled}
            />
          </div>
        </FormField>
      )}
    </form.Field>
  );
}
