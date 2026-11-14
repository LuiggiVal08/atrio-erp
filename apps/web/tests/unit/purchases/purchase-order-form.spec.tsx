import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PurchaseOrderFormView } from '@/modules/purchases/views/PurchaseOrderFormView';

const vendors = vi.hoisted(() => [
  { id: 'v1', legalName: 'Distribuidor Andino', taxId: 'J-111', deliveryDays: 5 },
  { id: 'v2', legalName: 'Importadora Caribe', taxId: 'J-222', deliveryDays: null },
  { id: 'v3', legalName: 'Insumos Rios', taxId: 'J-333', deliveryDays: 3 },
]);

vi.mock('@/shared/lib/api/client', () => ({
  default: {
    get: vi.fn().mockImplementation((url: string) =>
      Promise.resolve({ data: url === '/client-vendor/vendors' ? vendors : [] })),
    post: vi.fn(),
  },
}));
vi.mock('@/modules/inventory/hooks/useInventoryList', () => ({ useInventoryProducts: () => ({ data: [] }) }));

function dateIn(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function renderForm() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(
    <MemoryRouter>
      <QueryClientProvider client={client}><PurchaseOrderFormView /></QueryClientProvider>
    </MemoryRouter>,
  );
  return document.querySelector('input[type="date"]') as HTMLInputElement;
}

async function selectVendor(name: string) {
  fireEvent.change(screen.getByPlaceholderText('Buscar proveedor...'), { target: { value: name } });
  fireEvent.click(await screen.findByRole('button', { name: new RegExp(name) }, { timeout: 5000 }));
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('PurchaseOrderFormView expected date prefill from vendor delivery days', () => {
  it('prefills expected date as today + vendor delivery days and shows the suggestion hint', async () => {
    const dateInput = renderForm();
    await selectVendor('Distribuidor Andino');
    expect(dateInput.value).toBe(dateIn(5));
    expect(screen.getByText(/Sugerido según los 5 días de entrega del proveedor/)).toBeTruthy();
  });

  it('keeps a manual edit when switching vendors (delay scenario)', async () => {
    const dateInput = renderForm();
    await selectVendor('Distribuidor Andino');
    fireEvent.change(dateInput, { target: { value: '2030-01-15' } });
    await selectVendor('Insumos Rios');
    expect(dateInput.value).toBe('2030-01-15');
    expect(screen.queryByText(/Sugerido según/)).toBeNull();
  });

  it('recomputes the suggestion when switching vendors before any manual edit', async () => {
    const dateInput = renderForm();
    await selectVendor('Distribuidor Andino');
    expect(dateInput.value).toBe(dateIn(5));
    await selectVendor('Insumos Rios');
    expect(dateInput.value).toBe(dateIn(3));
  });

  it('leaves the expected date untouched when the vendor has no delivery days', async () => {
    const dateInput = renderForm();
    await selectVendor('Importadora Caribe');
    expect(dateInput.value).toBe('');
    expect(screen.queryByText(/Sugerido según/)).toBeNull();
  });
});
