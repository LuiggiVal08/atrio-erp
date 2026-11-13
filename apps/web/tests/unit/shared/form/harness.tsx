import { useForm } from '@tanstack/react-form';
import type { ReactNode } from 'react';
import type { AnyReactForm } from '@/shared/form';

export function FormHarness({
  defaultValues,
  children,
}: {
  defaultValues: Record<string, unknown>;
  children: (form: AnyReactForm) => ReactNode;
}) {
  const form = useForm({ defaultValues });
  return <>{children(form)}</>;
}

export function FieldProbe({ form, name }: { form: AnyReactForm; name: string }) {
  return (
    <form.Subscribe
      selector={(state) => ({
        value: state.values[name],
        blurred: Boolean(state.fieldMeta[name]?.isBlurred),
      })}
    >
      {(state) => (
        <>
          <span data-testid={`value-${name}`}>{JSON.stringify(state.value ?? null)}</span>
          <span data-testid={`blur-${name}`}>{state.blurred ? 'blurred' : 'not-blurred'}</span>
        </>
      )}
    </form.Subscribe>
  );
}
