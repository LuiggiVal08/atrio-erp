import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FormCombobox } from '@/shared/form';
import { FieldProbe, FormHarness } from './harness';

vi.mock('@/shared/hooks/useTranslation', () => ({
  useTranslation: () => ({ t: (key: string) => key, locale: 'es' }),
}));

afterEach(cleanup);

const options = [
  { id: 'cat-1', name: 'Categoría General' },
  { id: 'cat-2', name: 'Herramientas' },
];

describe('FormCombobox', () => {
  it('binds the selected option to the form field', async () => {
    const user = userEvent.setup();
    render(
      <FormHarness defaultValues={{ categoryId: '' }}>
        {(form) => (
          <>
            <FormCombobox form={form} name="categoryId" label="Categoría" options={options} />
            <FieldProbe form={form} name="categoryId" />
          </>
        )}
      </FormHarness>,
    );

    await user.click(screen.getByRole('combobox', { name: 'Categoría' }));
    await user.click(screen.getByRole('option', { name: 'Herramientas' }));

    expect(screen.getByTestId('value-categoryId').textContent).toBe('"cat-2"');
  });
});
