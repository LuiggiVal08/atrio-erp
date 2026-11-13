import type { ReactFormExtendedApi } from '@tanstack/react-form';

export type AnyReactForm = ReactFormExtendedApi<
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any
>;

export interface FormControlBaseProps {
  form: AnyReactForm;
  name: string;
  label?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
}
