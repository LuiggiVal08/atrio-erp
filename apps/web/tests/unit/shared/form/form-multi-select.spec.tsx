import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { FormMultiSelect } from '@/shared/form';
import { FieldProbe, FormHarness } from './harness';

afterEach(cleanup);

const options = [
  { id: 'a', label: 'Alimentos' },
  { id: 'b', label: 'Bebidas' },
];

describe('FormMultiSelect', () => {
  it('adds and removes selections in the form field', async () => {
    const user = userEvent.setup();
    render(
      <FormHarness defaultValues={{ tags: [] }}>
        {(form) => (
          <>
            <FormMultiSelect form={form} name="tags" label="Etiquetas" options={options} />
            <FieldProbe form={form} name="tags" />
          </>
        )}
      </FormHarness>,
    );

    await user.click(screen.getByRole('button', { name: 'Etiquetas' }));
    await user.click(screen.getByRole('button', { name: 'Alimentos' }));

    expect(screen.getByTestId('value-tags').textContent).toBe('["a"]');

    await user.click(screen.getByRole('button', { name: 'Quitar Alimentos' }));

    expect(screen.getByTestId('value-tags').textContent).toBe('[]');
  });

  it('marks the field as blurred when focus leaves the control', async () => {
    const user = userEvent.setup();
    render(
      <FormHarness defaultValues={{ tags: [] }}>
        {(form) => (
          <>
            <FormMultiSelect form={form} name="tags" label="Etiquetas" options={options} />
            <button type="button">outside</button>
            <FieldProbe form={form} name="tags" />
          </>
        )}
      </FormHarness>,
    );

    await user.click(screen.getByRole('button', { name: 'Etiquetas' }));
    await user.click(screen.getByRole('button', { name: 'outside' }));

    expect(screen.getByTestId('blur-tags').textContent).toBe('blurred');
  });
});
