import { useForm } from '@tanstack/react-form';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { FormInput } from '@/shared/form';
import { FieldProbe, FormHarness } from './harness';

afterEach(cleanup);

describe('FormInput', () => {
  it('binds changes and blur to the form field', async () => {
    const user = userEvent.setup();
    render(
      <FormHarness defaultValues={{ name: '' }}>
        {(form) => (
          <>
            <FormInput form={form} name="name" label="Nombre" />
            <FieldProbe form={form} name="name" />
          </>
        )}
      </FormHarness>,
    );

    await user.type(screen.getByLabelText('Nombre'), 'ACME');

    expect(screen.getByTestId('value-name').textContent).toBe('"ACME"');
    expect(screen.getByTestId('blur-name').textContent).toBe('not-blurred');

    await user.tab();

    expect(screen.getByTestId('blur-name').textContent).toBe('blurred');
  });

  it('converts number inputs to numbers', async () => {
    const user = userEvent.setup();
    render(
      <FormHarness defaultValues={{ price: 0 }}>
        {(form) => (
          <>
            <FormInput form={form} name="price" label="Precio" type="number" />
            <FieldProbe form={form} name="price" />
          </>
        )}
      </FormHarness>,
    );

    const input = screen.getByLabelText('Precio');
    await user.clear(input);
    await user.type(input, '12');

    expect(screen.getByTestId('value-price').textContent).toBe('12');
  });

  it('shows validation errors from the form schema', async () => {
    const user = userEvent.setup();

    function ValidatedHarness() {
      const form = useForm({
        defaultValues: { name: '' },
        validators: {
          onChange: z.object({ name: z.string().min(1, 'Nombre requerido') }),
        },
      });

      return <FormInput form={form} name="name" label="Nombre" />;
    }

    render(<ValidatedHarness />);

    const input = screen.getByLabelText('Nombre');
    await user.type(input, 'a');
    await user.clear(input);

    expect(screen.getByRole('alert').textContent).toBe('Nombre requerido');
  });
});
