import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { FormField } from '@/shared/form';

afterEach(cleanup);

describe('FormField', () => {
  it('renders the label and joined error messages', () => {
    render(
      <FormField label="Nombre" required errors={['Requerido', { message: 'Muy largo' }]}>
        <input aria-label="nombre" />
      </FormField>,
    );

    expect(screen.getByText('Nombre')).toBeDefined();
    expect(screen.getByRole('alert').textContent).toBe('Requerido · Muy largo');
  });

  it('does not render an alert when there are no errors', () => {
    render(
      <FormField label="Nombre">
        <input aria-label="nombre" />
      </FormField>,
    );

    expect(screen.queryByRole('alert')).toBeNull();
  });
});
