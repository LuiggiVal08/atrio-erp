import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import api from '@/shared/lib/api/client';
import { useTenantStore } from '@/core/tenant/store';
import { WarehouseDetailView } from '@/modules/inventory/views/WarehouseDetailView';
import { BranchDetailView } from '@/modules/inventory/views/BranchDetailView';
import { WarehouseListView } from '@/modules/inventory/views/WarehouseListView';
import { BranchListView } from '@/modules/inventory/views/BranchListView';
import { StorageLocationTree } from '@/modules/inventory/components/StorageLocationTree';
import { WarehouseStockTab } from '@/modules/inventory/components/WarehouseStockTab';
import { useWarehouse, useWarehouses } from '@/modules/inventory/hooks/useWarehouses';
import { useBranches } from '@/modules/inventory/hooks/useBranches';
import { useStorageLocations } from '@/modules/inventory/hooks/useStorageLocations';
import { useUpdateWarehouse } from '@/modules/inventory/hooks/useUpdateWarehouse';

vi.mock('@/shared/lib/api/client', () => ({ default: { get: vi.fn(), patch: vi.fn(), post: vi.fn(), delete: vi.fn() } }));
vi.mock('@/core/services/toast-service', () => ({ toastService: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/core/components/AnimatedNumber', () => ({ AnimatedNumber: ({ value, format }: { value: number; format?: (n: number) => string }) => <span>{format ? format(value) : value}</span> }));
vi.mock('recharts', () => ({ ResponsiveContainer: () => null, PieChart: () => null, Pie: () => null, Cell: () => null, Tooltip: () => null }));
vi.mock('@/core/components/VirtualGrid', () => ({ VirtualGrid: ({ emptyMessage, data }: { emptyMessage: string; data: unknown[] }) => <div>{data.length ? 'rows' : emptyMessage}</div> }));
const warehouse = { id: 'w-1', tenantId: 't-1', name: 'Principal', code: 'ALM-1', branchId: 'b-1', isActive: true, createdAt: '' };
const branch = { id: 'b-1', name: 'Centro', code: 'CEN', address: null, city: null, state: null, phone: null, managerEmployeeId: null, isActive: true, createdAt: '' };
const summary = { warehouseId: 'w-1', skuCount: 2, totalUnits: 1.375, totalValue: 20, currency: 'USD', health: { healthy: 2, low: 0, out: 0, overstock: 0 }, categories: [{ categoryId: 'c-1', name: 'Mixta', units: 1.375, value: 20 }] };
function client() { return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } }); }
function mount(Component: () => ReactNode, path = '/inventory/warehouses/w-1', pattern = '/inventory/warehouses/:id') {
  const qc = client();
  render(<QueryClientProvider client={qc}><MemoryRouter initialEntries={[path]}><Routes><Route path={pattern} element={<Component />} /></Routes></MemoryRouter></QueryClientProvider>);
  return qc;
}
beforeEach(() => {
  useTenantStore.setState({ activeTenantId: 't-1' });
  vi.mocked(api.get).mockImplementation(async (url) => ({ data: url.endsWith('/summary') ? summary : url.endsWith('/default') ? warehouse : url.endsWith('/locations') ? [] : url === '/inventory/branches' ? [branch] : url === '/inventory/warehouses' ? [warehouse] : url.includes('/branches/') ? branch : url.includes('/warehouses/') ? warehouse : [] }));
  vi.mocked(api.patch).mockResolvedValue({ data: warehouse });
});
afterEach(() => { cleanup(); vi.resetAllMocks(); });

describe('warehouse edit lifecycle (real TanStack bindings)', () => {
  it('preloads every field, discards cancellation, saves without clearing code or branch', async () => {
    mount(WarehouseDetailView);
    fireEvent.click(await screen.findByRole('button', { name: 'Editar' }));
    await waitFor(() => expect(screen.getByLabelText('Nombre')).toHaveValue('Principal'));
    expect(screen.getByLabelText('Código')).toHaveValue('ALM-1');
    expect(screen.getByLabelText('Sucursal')).toHaveValue('b-1');
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Descartado' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    expect(screen.getByLabelText('Nombre')).toHaveValue('Principal');
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Nuevo' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/inventory/warehouses/w-1', { name: 'Nuevo', code: 'ALM-1', branchId: 'b-1' }));
  });
  it('supports arrow, home and end keys with roving tabs', async () => {
    mount(WarehouseDetailView);
    const general = await screen.findByRole('tab', { name: 'General' });
    general.focus(); fireEvent.keyDown(general, { key: 'ArrowRight' });
    const locations = screen.getByRole('tab', { name: 'Ubicaciones' });
    expect(locations).toHaveFocus(); expect(locations).toHaveAttribute('aria-selected', 'true');
    expect(general).toHaveAttribute('tabindex', '-1');
    fireEvent.keyDown(locations, { key: 'Home' }); expect(general).toHaveFocus();
    fireEvent.keyDown(general, { key: 'End' }); expect(locations).toHaveFocus();
  });
  it('does not deactivate the default warehouse', async () => {
    mount(WarehouseDetailView);
    expect(await screen.findByRole('button', { name: 'Desactivar' })).toBeDisabled();
  });
});

describe('recoverable reads and honest summaries', () => {
  it.each([WarehouseDetailView, BranchDetailView])('distinguishes server failure from not found', async (Component) => {
    vi.mocked(api.get).mockRejectedValue({ response: { status: 403 } });
    const isBranch = Component === BranchDetailView;
    mount(Component, isBranch ? '/inventory/branches/b-1' : undefined, isBranch ? '/inventory/branches/:id' : undefined);
    expect(await screen.findByRole('alert')).toBeVisible();
    const before = vi.mocked(api.get).mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    await waitFor(() => expect(vi.mocked(api.get).mock.calls.length).toBeGreaterThan(before));
  });
  it.each([WarehouseListView, BranchListView])('list failures are not empty success', async (Component) => {
    vi.mocked(api.get).mockRejectedValue({ response: { status: 500 } });
    mount(Component);
    expect((await screen.findAllByRole('alert')).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: 'Reintentar' }).length).toBeGreaterThan(0);
  });
  it('summary error has retry, not an endless skeleton; stale summary stays visible', () => {
    const retry = vi.fn();
    const { rerender } = render(<WarehouseStockTab isLoading={false} isError onRetry={retry} />);
    expect(screen.getByRole('alert')).toBeVisible(); expect(screen.queryByRole('status')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' })); expect(retry).toHaveBeenCalled();
    rerender(<WarehouseStockTab summary={summary} isLoading={false} isError onRetry={retry} />);
    expect(screen.getByText('Mixta')).toBeVisible();
  });
  it('keeps decimal precision and explicitly warns about mixed units', () => {
    render(<WarehouseStockTab summary={summary} isLoading={false} />);
    expect(screen.getAllByText('1,375')).toHaveLength(2);
    expect(screen.getByText(/no representa una cantidad física comparable/i)).toBeVisible();
  });
});

describe('storage directory invariants', () => {
  it('cannot reactivate or create a child beneath an inactive ancestor', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [
      { id: 'a', parentId: null, type: 'AISLE', path: 'A', code: 'A', isActive: false },
      { id: 's', parentId: 'a', type: 'SHELF', path: 'A/01', code: '01', isActive: false },
    ] });
    mount(() => <StorageLocationTree warehouseId="w-1" />);
    await screen.findByText('A');
    const reactivate = screen.getAllByRole('button', { name: 'Reactivar' });
    expect(reactivate[0]).not.toBeDisabled(); expect(reactivate[1]).toBeDisabled();
    for (const button of screen.getAllByRole('button', { name: 'Agregar hijo' })) expect(button).toBeDisabled();
  });
  it('directory read failure offers retry instead of an empty tree', async () => {
    vi.mocked(api.get).mockRejectedValue({ response: { status: 500 } });
    mount(() => <StorageLocationTree warehouseId="w-1" />);
    expect(await screen.findByRole('alert')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeVisible();
    expect(screen.queryByText('No hay ubicaciones configuradas')).toBeNull();
  });
});

describe('tenant scoped physical queries', () => {
  it('reacts to a tenant switch without reusing another tenant data', async () => {
    const qc = client();
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
    const { result } = renderHook(() => ({ warehouse: useWarehouse('w-1'), warehouses: useWarehouses(), branches: useBranches(), locations: useStorageLocations('w-1') }), { wrapper });
    await waitFor(() => expect(result.current.warehouse.isSuccess).toBe(true));
    useTenantStore.setState({ activeTenantId: 't-2' });
    await waitFor(() => expect(qc.getQueryData(['warehouses', 't-2', 'detail', 'w-1'])).toBeDefined());
    expect(qc.getQueryData(['warehouses', 't-1', 'detail', 'w-1'])).toBeDefined();
    expect(qc.getQueryData(['branches', 't-2', { includeInactive: false }])).toBeDefined();
    expect(qc.getQueryData(['warehouses', 't-2', 'locations', 'w-1'])).toBeDefined();
  });
  it('reassignment invalidates scoped warehouses, summaries, branch detail/lists and balances', async () => {
    const qc = client(); const invalidate = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(useUpdateWarehouse, { wrapper: ({ children }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider> });
    await result.current.mutateAsync({ id: 'w-1', data: { branchId: 'b-2' } });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['warehouses', 't-1'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['branches', 't-1'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['stock-balances'] });
  });
});
