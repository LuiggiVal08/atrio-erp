import { cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import api from '@/shared/lib/api/client';
import { useTenantStore } from '@/core/tenant/store';
import { useSetupEmployee, useUpdateEmployee } from '@/modules/inventory/hooks/useEmployees';
import { EmployeeFormView } from '@/modules/inventory/views/EmployeeFormView';

vi.mock('@/shared/lib/api/client', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }));
vi.mock('@/shared/ui/DocumentInput', () => ({ DocumentInput: ({ value, onChange }: any) => <input aria-label="Documento" value={value} onChange={e => onChange(e.target.value)} /> }));
vi.mock('@/shared/ui/PhoneInput', () => ({ PhoneInput: () => null }));
const dept = '00000000-0000-4000-8000-000000000001';
const pos = '00000000-0000-4000-8000-000000000002';
const employee = { id: 'emp', firstName: 'Ana', lastName: 'Perez', identityDoc: '123', hireDate: '2026-01-01', baseSalary: 100 };
function fixture(path = '/employees/new') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const wrapper = ({ children }: any) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  const view = () => render(<MemoryRouter initialEntries={[path]}><Routes><Route path="/employees/new" element={<EmployeeFormView />} /><Route path="/employees/:id/edit" element={<EmployeeFormView />} /><Route path="/employees" element={<p>Saved</p>} /></Routes></MemoryRouter>, { wrapper });
  return { client, wrapper, view };
}
beforeEach(() => {
  useTenantStore.setState({ activeTenantId: 'tenant-a' });
  vi.mocked(api.get).mockImplementation(async url => {
    if (url.endsWith('/departments')) return { data: [{ id: dept, name: 'Ventas', isActive: true }] };
    if (url.endsWith('/positions')) return { data: [{ id: pos, name: 'Vendedor', departmentId: dept, active: true }] };
    if (url === '/employees/emp') return { data: employee };
    if (url.endsWith('/employment-relationships')) return { data: [{ id: 'rel', status: 'ACTIVE', startDate: '2026-01-01' }] };
    if (url.endsWith('/compensation/current')) return { data: { id: 'agreement', currency: 'EUR', effectiveDate: '2026-01-01', components: [{ type: 'SALARY', amount: 100 }] } };
    return { data: null };
  });
  vi.mocked(api.post).mockResolvedValue({ data: { employee: { id: 'created' }, relationshipId: 'rel' } });
  vi.mocked(api.patch).mockResolvedValue({ data: employee });
});
afterEach(() => { cleanup(); vi.clearAllMocks(); });
function fillCreate() {
  fireEvent.change(screen.getByLabelText('Primer Nombre'), { target: { value: 'Ana' } });
  fireEvent.change(screen.getByLabelText('Primer Apellido'), { target: { value: 'Perez' } });
  fireEvent.change(screen.getByLabelText('Documento'), { target: { value: '123' } });
  fireEvent.change(screen.getByLabelText('Fecha de Ingreso'), { target: { value: '2026-01-01' } });
  fireEvent.change(screen.getByLabelText('Salario Base'), { target: { value: '100' } });
}
describe('employee onboarding regressions', () => {
  it('uses one atomic request and preserves the caller ID on retry', async () => {
    const { wrapper } = fixture();
    const { result } = renderHook(() => useSetupEmployee(), { wrapper });
    const data = { employee: { ...employee, id: crypto.randomUUID() }, departmentId: dept, positionId: pos, employment: { startDate: '2026-01-01', reason: 'NEW_HIRE' }, contract: { contractType: 'FULL_TIME', startDate: '2026-01-01' }, compensation: { effectiveDate: '2026-01-01', currency: 'EUR', components: [{ type: 'SALARY', amount: 100 }] } };
    vi.mocked(api.post).mockRejectedValueOnce(new Error('network'));
    await expect(result.current.mutateAsync(data)).rejects.toThrow('network');
    await result.current.mutateAsync(data);
    expect(api.post).toHaveBeenCalledTimes(2);
    expect(api.post).toHaveBeenNthCalledWith(1, '/tenants/tenant-a/employees/setup', data);
    expect(api.post).toHaveBeenNthCalledWith(2, '/tenants/tenant-a/employees/setup', data);
  });
  it('passes existing selector IDs without creating departments or positions', async () => {
    fixture().view();
    await screen.findByRole('option', { name: 'Ventas' });
    fillCreate();
    fireEvent.change(screen.getByLabelText('Departamento *'), { target: { value: dept } });
    fireEvent.change(screen.getByLabelText('Cargo *'), { target: { value: pos } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(api.post).toHaveBeenCalledTimes(1));
    const [url, payload] = vi.mocked(api.post).mock.calls[0];
    expect(url).toBe('/tenants/tenant-a/employees/setup');
    expect(payload).toMatchObject({ departmentId: dept, positionId: pos, employee: { id: expect.stringMatching(/^[\da-f-]{36}$/) } });
    expect(payload).not.toHaveProperty('department');
    expect(payload).not.toHaveProperty('position');
  });
  it('sends explicit new structure in the atomic payload only', async () => {
    fixture().view();
    fillCreate();
    fireEvent.click(screen.getAllByRole('button', { name: '+ Nuevo' })[0]);
    fireEvent.change(screen.getByPlaceholderText('Nombre del nuevo departamento'), { target: { value: 'Nuevo' } });
    fireEvent.change(screen.getByPlaceholderText('Nombre del nuevo cargo'), { target: { value: 'Cargo nuevo' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(api.post).toHaveBeenCalledTimes(1));
    expect(vi.mocked(api.post).mock.calls[0][1]).toMatchObject({ department: { name: 'Nuevo' }, position: { name: 'Cargo nuevo' } });
  });
  it('blocks fixed contracts without a valid end date and zero salary before requests', async () => {
    fixture().view();
    await screen.findByRole('option', { name: 'Ventas' });
    fillCreate();
    fireEvent.change(screen.getByLabelText('Departamento *'), { target: { value: dept } });
    fireEvent.change(screen.getByLabelText('Cargo *'), { target: { value: pos } });
    fireEvent.change(screen.getByLabelText('Tipo de Contrato *'), { target: { value: 'FIXED_TERM' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByText('El contrato a plazo fijo requiere fecha de fin.')).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Fecha de Fin'), { target: { value: '2026-12-31' } });
    fireEvent.change(screen.getByLabelText('Salario Base'), { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByText('El salario base debe ser un valor mayor que cero.')).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });
  it('persists hireDate and invalidates both list and detail', async () => {
    const { wrapper, client } = fixture();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => useUpdateEmployee(), { wrapper });
    await result.current.mutateAsync({ id: 'emp', hireDate: '2026-02-01' });
    expect(api.patch).toHaveBeenCalledWith('/employees/emp', { hireDate: '2026-02-01' });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['employee', 'emp'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['employees'] });
  });
  it('edits salary through versioned compensation with date currency and reason, not identity salary', async () => {
    fixture('/employees/emp/edit').view();
    await waitFor(() => expect(screen.getByLabelText('Salario Base')).toHaveValue(100));
    fireEvent.change(screen.getByLabelText('Salario Base'), { target: { value: '150' } });
    fireEvent.change(screen.getByLabelText('Fecha Efectiva'), { target: { value: '2026-02-01' } });
    fireEvent.change(screen.getByLabelText('Motivo de Compensación *'), { target: { value: 'MERIT_INCREASE' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/employment-relationships/rel/compensation/agreement/adjust', { effectiveDate: '2026-02-01', currency: 'EUR', reason: 'MERIT_INCREASE', components: [{ type: 'SALARY', amount: 150 }] }));
    expect(vi.mocked(api.patch).mock.calls[0][1]).not.toHaveProperty('baseSalary');
    expect(vi.mocked(api.patch).mock.calls[0][1]).toHaveProperty('hireDate', '2026-01-01');
  });
});
