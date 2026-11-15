import { useId } from 'react';
import { FormField } from './form-field';
import type { FormControlBaseProps } from './types';

export function FormCheckbox({ form, name, label, disabled, id, className }: FormControlBaseProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return <form.Field name={name}>{(field) => (
    <FormField errors={field.state.meta.errors} className={className}>
      <label htmlFor={inputId} className="flex cursor-pointer items-center gap-2 py-2 text-sm text-text-secondary">
        <input id={inputId} type="checkbox" checked={field.state.value ?? false} onChange={(event) => field.handleChange(event.target.checked)} onBlur={field.handleBlur} disabled={disabled} className="rounded border-border accent-accent" />
        {label}
      </label>
    </FormField>
  )}</form.Field>;
}
