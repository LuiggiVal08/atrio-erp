import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ReportDefinitionsView } from '@/modules/reports/views/ReportDefinitionsView';

const spies = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
}));
const state = vi.hoisted(() => ({ definitions: [] as Array<Record<string, unknown>> }));

vi.mock('@/modules/reports/hooks/useReports', () => ({
  useDefinitions: () => ({ data: state.definitions, isLoading: false }),
  useCreateDefinition: () => ({ mutateAsync: spies.create, isPending: false }),
  useUpdateDefinition: () => ({ mutateAsync: spies.update, isPending: false }),
  useDeleteDefinition: () => ({ mutate: vi.fn(), isPending: false }),
  useExecuteDefinition: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

beforeEach(() => {
  spies.create.mockReset();
  spies.update.mockReset();
  state.definitions = [];
});
afterEach(cleanup);

describe('report definition form', () => {
  it('validates the name before creating a definition', async () => {
    render(<ReportDefinitionsView />);
    fireEvent.click(screen.getByRole('button', { name: 'Nueva Definición' }));
    fireEvent.click(screen.getByRole('button', { name: 'Crear' }));

    expect(await screen.findByText('El nombre es obligatorio')).toBeTruthy();
    expect(spies.create).not.toHaveBeenCalled();
  });

  it('creates a definition with normalized recipients', async () => {
    render(<ReportDefinitionsView />);
    fireEvent.click(screen.getByRole('button', { name: 'Nueva Definición' }));
    fireEvent.change(screen.getByLabelText('Nombre'), {
      target: { value: ' Ventas semanales ' },
    });
    fireEvent.change(screen.getByLabelText('Destinatarios (email, separados por coma)'), {
      target: { value: 'admin@ejemplo.com, gerente@ejemplo.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Crear' }));

    await waitFor(() =>
      expect(spies.create).toHaveBeenCalledWith({
        name: 'Ventas semanales',
        type: 'SALES',
        format: 'PDF',
        schedule: undefined,
        recipients: ['admin@ejemplo.com', 'gerente@ejemplo.com'],
      }),
    );
  });

  it('loads and updates an existing definition', async () => {
    state.definitions = [{
      id: 'def-1',
      tenantId: 'tenant-1',
      name: 'Inventario',
      type: 'INVENTORY',
      format: 'PDF',
      schedule: '0 7 * * *',
      recipients: ['admin@ejemplo.com'],
      enabled: true,
      createdById: 'user-1',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    }];
    render(<ReportDefinitionsView />);
    fireEvent.click(screen.getByTitle('Editar'));
    const nameInput = screen.getByLabelText('Nombre');
    await waitFor(() => expect((nameInput as HTMLInputElement).value).toBe('Inventario'));
    fireEvent.change(nameInput, { target: { value: 'Inventario diario' } });
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar' }));

    await waitFor(() =>
      expect(spies.update).toHaveBeenCalledWith({
        id: 'def-1',
        name: 'Inventario diario',
        type: 'INVENTORY',
        format: 'PDF',
        schedule: '0 7 * * *',
        recipients: ['admin@ejemplo.com'],
      }),
    );
  });
});
