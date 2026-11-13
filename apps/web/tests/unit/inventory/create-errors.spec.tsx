import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import api from '@/shared/lib/api/client';
import { VendorListView } from '@/modules/inventory/views/VendorListView';
import { InventoryListView } from '@/modules/inventory/views/InventoryListView';
import { BranchListView } from '@/modules/inventory/views/BranchListView';

vi.mock('@/shared/lib/api/client', () => ({
  default: {
    get: vi.fn().mockImplementation((url: string) => Promise.resolve({
      data: url === '/inventory/products/summary'
        ? {
            totalProducts: 0,
            stockHealth: { healthy: 0, low: 0, out: 0, overstock: 0 },
            valuation: { currency: 'VED', totalValue: 0, categories: [] },
            coverage: { periodDays: 30, medianDays: null, under7: 0, from7to30: 0, over30: 0, noSales: 0 },
          }
        : [],
    })),
    post: vi.fn(),
  },
}));
vi.mock('@/core/components/VirtualGrid', () => ({ VirtualGrid: () => null }));
vi.mock('@/modules/inventory/hooks/useInventoryList', () => ({
  useInventoryList: () => ({ refetch: vi.fn(), isFetching: false, isLoading: false, items: [], total: 0 }),
  useInventoryProducts: () => ({ data: [] }),
}));
vi.mock('@/modules/inventory/store/inventory-store', () => ({
  useInventoryStore: () => ({ filter: '', setFilter: vi.fn(), setSort: vi.fn(), sortColumn: null, sortDirection: 'asc', page: 1, pageSize: 25, setPage: vi.fn(), setPageSize: vi.fn() }),
}));
vi.mock('@/shared/ui/DocumentInput', () => ({
  DocumentInput: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
    <input aria-label="Documento" value={value} onChange={(event) => onChange(event.target.value)} />
  ),
}));
vi.mock('@/shared/ui/PhoneInput', () => ({ PhoneInput: () => null }));
vi.mock('@/shared/ui/AddressInput', () => ({ AddressInput: () => null }));

const forms = [
  { name: 'vendor', Component: VendorListView, endpoint: '/client-vendor/vendors' },
  { name: 'product', Component: InventoryListView, endpoint: '/inventory/products' },
  { name: 'branch', Component: BranchListView, endpoint: '/inventory/branches' },
] as const;

function openForm(form: typeof forms[number]) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(
    <MemoryRouter>
      <QueryClientProvider client={client}><form.Component /></QueryClientProvider>
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByRole('button', { name: form.name === 'product' ? '+ Crear producto' : '+ Crear' }));
  const inputs = document.querySelectorAll('input');
  if (form.name === 'vendor') {
    fireEvent.change(inputs[1], { target: { value: 'Proveedor de prueba' } });
    fireEvent.change(screen.getAllByRole('textbox', { name: 'Documento' })[0], { target: { value: 'J123456789' } });
    return inputs[1];
  }
  if (form.name === 'product') {
    const sku = screen.getByLabelText('SKU');
    fireEvent.change(sku, { target: { value: 'TEST-SKU' } });
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Producto de prueba' } });
    fireEvent.change(screen.getByLabelText('Costo de compra'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Precio de venta'), { target: { value: '5' } });
    return sku;
  }
  const name = screen.getByPlaceholderText('Nombre de la sucursal');
  fireEvent.change(name, { target: { value: 'Sucursal de prueba' } });
  return name;
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe.each(forms)('$name creation error recovery', (form) => {
  it.each([
    { error: Object.assign(new AxiosError('Request failed with status code 400'), { response: { status: 400, data: { message: ['email must be an email'] } } }), message: 'email must be an email' },
    { error: new AxiosError('timeout of 15000ms exceeded', 'ECONNABORTED'), message: 'No se pudo confirmar el guardado' },
  ])('shows $message and retains input after failure', async ({ error, message }) => {
    vi.mocked(api.post).mockRejectedValueOnce(error);
    const field = openForm(form) as HTMLInputElement;
    const original = field.value;
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain(message));
    expect(field.value).toBe(original);
    expect(api.post).toHaveBeenCalledTimes(1);
    expect(api.post).toHaveBeenCalledWith(form.endpoint, expect.any(Object));
    expect((screen.getByRole('button', { name: 'Guardar' }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('closes the form only after a successful save', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { id: 'created' } });
    openForm(form);
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Guardar' })).toBeNull());
    expect(api.post).toHaveBeenCalledTimes(1);
  });
});
