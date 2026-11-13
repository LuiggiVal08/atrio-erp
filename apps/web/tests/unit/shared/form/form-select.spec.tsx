import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { FormSelect } from '@/shared/form';
import { FieldProbe, FormHarness } from './harness';

afterEach(cleanup);

const options = [
  { value: 'purchase', label: 'Compra' },
  { value: 'sale', label: 'Venta' },
];

describe('FormSelect', () => {
  it('binds the selected option to the form field', async () => {
    const user = userEvent.setup();
    render(
      <FormHarness defaultValues={{ type: 'purchase' }}>
        {(form) => (
          <>
            <FormSelect form={form} name="type" label="Tipo" options={options} />
            <FieldProbe form={form} name="type" />
          </>
        )}
      </FormHarness>,
    );

    await user.selectOptions(screen.getByLabelText('Tipo'), 'sale');

    expect(screen.getByTestId('value-type').textContent).toBe('"sale"');
  });

  it('renders a placeholder option when provided', () => {
    render(
      <FormHarness defaultValues={{ type: '' }}>
        {(form) => (
          <FormSelect form={form} name="type" label="Tipo" options={options} placeholder="Elegir" />
        )}
      </FormHarness>,
    );

    expect(screen.getByRole('option', { name: 'Elegir' })).toBeDefined();
  });
});
