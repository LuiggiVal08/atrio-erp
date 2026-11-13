import { DocumentInput } from '@/shared/ui/DocumentInput';
import { FormField } from './form-field';
import type { FormControlBaseProps } from './types';

export interface FormDocumentInputProps extends FormControlBaseProps {
  identificationTypeName: string;
  country?: string;
  placeholder?: string;
  allowedGroups?: string[];
}

export function FormDocumentInput({
  form,
  name,
  identificationTypeName,
  label,
  description,
  required,
  disabled,
  className,
  country,
  placeholder,
  allowedGroups,
}: FormDocumentInputProps) {
  return (
    <form.Field name={name}>
      {(valueField) => (
        <form.Field name={identificationTypeName}>
          {(typeField) => (
            <FormField
              label={label}
              description={description}
              required={required}
              errors={[...typeField.state.meta.errors, ...valueField.state.meta.errors]}
              className={className}
            >
              <div
                onBlur={() => {
                  valueField.handleBlur();
                  typeField.handleBlur();
                }}
              >
                <DocumentInput
                  value={valueField.state.value ?? ''}
                  onChange={valueField.handleChange}
                  identificationType={typeField.state.value ?? ''}
                  onIdentificationTypeChange={typeField.handleChange}
                  country={country}
                  placeholder={placeholder}
                  disabled={disabled}
                  allowedGroups={allowedGroups}
                />
              </div>
            </FormField>
          )}
        </form.Field>
      )}
    </form.Field>
  );
}
