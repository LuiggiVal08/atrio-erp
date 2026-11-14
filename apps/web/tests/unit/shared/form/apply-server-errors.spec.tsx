import { useForm } from '@tanstack/react-form';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { AxiosError } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyServerErrors, FormInput, type ApplyServerErrorsResult } from '@/shared/form';

function httpError(data: unknown): AxiosError {
  const error = new AxiosError('Request failed with status code 400');
  (error as { response?: unknown }).response = { status: 400, data };
  return error;
}

function Harness({
  error,
  onApply,
}: {
  error: unknown;
  onApply?: (result: ApplyServerErrorsResult) => void;
}) {
  const form = useForm({ defaultValues: { name: '', legalName: '' } });

  return (
    <>
      <FormInput form={form} name="name" label="Nombre" />
      <FormInput form={form} name="legalName" label="Razón social" />
      <button type="button" onClick={() => {
        const result = applyServerErrors(form, error);
        onApply?.(result);
      }}>
        Aplicar
      </button>
    </>
  );
}

afterEach(cleanup);

describe('applyServerErrors', () => {
  it('maps API field errors onto their form fields', () => {
    const error = httpError({
      errors: [
        { field: 'name', message: 'El nombre es obligatorio' },
        { field: 'legalName', message: 'La razón social es obligatoria' },
      ],
      message: ['El nombre es obligatorio', 'La razón social es obligatoria'],
    });

    render(<Harness error={error} />);
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

    expect(screen.getAllByRole('alert').map((alert) => alert.textContent)).toEqual([
      'El nombre es obligatorio',
      'La razón social es obligatoria',
    ]);
  });

  it('reports messages without a field as unmapped', () => {
    const error = httpError({ message: ['No se pudo guardar el cliente'] });
    const onApply = vi.fn();

    render(<Harness error={error} onApply={onApply} />);
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

    expect(onApply).toHaveBeenCalledWith({
      applied: [],
      unmapped: ['No se pudo guardar el cliente'],
    });
    expect(screen.queryAllByRole('alert')).toHaveLength(0);
  });

  it('accepts plain error payloads and returns unmapped messages', () => {
    const error = { message: ['Servicio no disponible'] };
    const onApply = vi.fn();

    render(<Harness error={error} onApply={onApply} />);
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

    expect(onApply).toHaveBeenCalledWith({
      applied: [],
      unmapped: ['Servicio no disponible'],
    });
    expect(screen.queryAllByRole('alert')).toHaveLength(0);
  });

  it('clears stale server errors on the next application', () => {
    const first = httpError({
      errors: [{ field: 'name', message: 'El nombre es obligatorio' }],
    });
    const second = httpError({
      errors: [{ field: 'legalName', message: 'La razón social es obligatoria' }],
    });

    const { rerender } = render(<Harness error={first} />);
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));
    expect(screen.getByRole('alert').textContent).toBe('El nombre es obligatorio');

    rerender(<Harness error={second} />);
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

    expect(screen.getAllByRole('alert').map((alert) => alert.textContent)).toEqual([
      'La razón social es obligatoria',
    ]);
  });
});
