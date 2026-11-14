import type { ReactFormExtendedApi } from '@tanstack/react-form';

type FormApi = ReactFormExtendedApi<
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

/**
 * The wrappers only need the field/subscription surface. Picking these
 * members keeps render-prop inference while avoiding concrete form generics
 * (for example array fields) leaking into every wrapper signature.
 */
export type AnyReactForm = Pick<FormApi, 'Field' | 'Subscribe' | 'setFieldMeta' | 'reset'>;

export interface FormControlBaseProps {
  form: AnyReactForm;
  name: string;
  label?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
  ariaLabel?: string;
}
