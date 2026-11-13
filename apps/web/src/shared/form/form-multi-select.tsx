import { MultiSelect, type MultiSelectOption } from '@/shared/ui/MultiSelect';
import { FormField } from './form-field';
import type { FormControlBaseProps } from './types';

export interface FormMultiSelectProps extends FormControlBaseProps {
  options: MultiSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
}

export function FormMultiSelect({
  form,
  name,
  label,
  description,
  required,
  disabled,
  className,
  options,
  placeholder,
  searchPlaceholder,
  emptyMessage,
}: FormMultiSelectProps) {
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
            <MultiSelect
              options={options}
              value={Array.isArray(field.state.value) ? field.state.value : []}
              onChange={field.handleChange}
              ariaLabel={label ?? name}
              placeholder={placeholder}
              searchPlaceholder={searchPlaceholder}
              emptyMessage={emptyMessage}
              disabled={disabled}
            />
          </div>
        </FormField>
      )}
    </form.Field>
  );
}
