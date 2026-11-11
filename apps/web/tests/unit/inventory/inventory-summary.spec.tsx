import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import api from '@/shared/lib/api/client';
import { useAuthStore } from '@/core/auth/store';
import { InventorySummaryCards } from '@/modules/inventory/components/InventorySummaryCards';
import type { InventorySummary } from '@/modules/inventory/hooks/useInventorySummary';

vi.mock('@/shared/lib/api/client', () => ({ default: { get: vi.fn() } }));

const summary: InventorySummary = {
  totalProducts: 2486,
  stockHealth: { healthy: 1846, low: 444, out: 6, overstock: 190 },
  valuation: {
    currency: 'USD', totalValue: 45000,
    categories: [
      { categoryId: 'tools', name: 'Herramientas', value: 30000 },
      { categoryId: 'plumbing', name: 'Plomería', value: 10000 },
      { categoryId: null, name: null, value: 5000 },
    ],
  },
  coverage: { periodDays: 30, medianDays: 24.5, under7: 40, from7to30: 100, over30: 200, noSales: 2146 },
};

function renderCards() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><InventorySummaryCards /></QueryClientProvider>);
  return client;
}

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  useAuthStore.setState({ user: null });
});

describe('inventory summary cards', () => {
  it('shows proportional stock segments and counts with labels', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: summary });
    renderCards();
    const card = await screen.findByRole('region', { name: 'Salud del stock' });
    for (const label of ['Saludable', 'Bajo', 'Sin stock', 'Sobrestock']) {
      expect(within(card).getByText(label)).toBeTruthy();
    }
    expect(within(card).getByText('1.846')).toBeTruthy();
    expect(within(card).getByText('444')).toBeTruthy();
    expect(within(card).getByText('6')).toBeTruthy();
    expect(within(card).getByText('190')).toBeTruthy();
    expect(within(card).getByText('74% Saludable')).toBeTruthy();
    const bar = within(card).getByRole('img', { name: /Saludable: 74/ });
    const segments = Array.from(bar.children) as HTMLElement[];
    expect(segments).toHaveLength(4);
    expect(parseFloat(segments[0].style.width)).toBeCloseTo(1846 / 2486 * 100);
    expect(parseFloat(segments[2].style.width)).toBeCloseTo(6 / 2486 * 100);
    expect(api.get).toHaveBeenCalledWith('/inventory/products/summary');
  });

  it('displays category values in descending order and relative bar widths', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: summary });
    renderCards();
    const card = await screen.findByRole('region', { name: 'Valor por categoría' });
    const rows = within(card).getAllByRole('listitem');
    expect(rows.map((row) => row.textContent)).toEqual([
      expect.stringContaining('Herramientas'), expect.stringContaining('Plomería'), expect.stringContaining('Sin categoría'),
    ]);
    const bars = within(card).getAllByRole('img');
    expect((bars[0].firstElementChild as HTMLElement).style.width).toBe('100%');
    expect(parseFloat((bars[1].firstElementChild as HTMLElement).style.width)).toBeCloseTo(100 / 3);
  });

  it('shows median coverage and sales period without mixing stock units', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: summary });
    renderCards();
    const card = await screen.findByRole('region', { name: 'Días de cobertura' });
    expect(within(card).getByText('24,5')).toBeTruthy();
    expect(within(card).getByText('días')).toBeTruthy();
    expect(within(card).getByText('Mediana · ventas aprobadas de los últimos 30 días')).toBeTruthy();
    expect(within(card).getByText('Sin ventas')).toBeTruthy();
    expect(within(card).getByText('2.146')).toBeTruthy();
  });

  it('shows empty valuation and unavailable coverage without fabricated data', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: {
      totalProducts: 0, stockHealth: { healthy: 0, low: 0, out: 0, overstock: 0 },
      valuation: { currency: 'VED', totalValue: 0, categories: [] },
      coverage: { periodDays: 30, medianDays: null, under7: 0, from7to30: 0, over30: 0, noSales: 0 },
    } });
    renderCards();
    expect(await screen.findByText('Sin productos activos')).toBeTruthy();
    expect(screen.getByText('Sin existencias para valorar')).toBeTruthy();
    expect(screen.getByText('Sin ventas recientes para estimar cobertura')).toBeTruthy();
  });

  it('reserves space while loading', () => {
    vi.mocked(api.get).mockReturnValue(new Promise(() => {}));
    renderCards();
    expect(screen.getByRole('status').textContent).toBe('Cargando resumen de inventario');
    expect(screen.queryByText('0')).toBeNull();
  });

  it('allows retrying a failed summary request', async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error('offline'));
    renderCards();
    expect(await screen.findByRole('alert')).toBeTruthy();
    vi.mocked(api.get).mockResolvedValueOnce({ data: summary });
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByRole('region', { name: 'Salud del stock' })).toBeTruthy();
    expect(api.get).toHaveBeenCalledTimes(2);
  });

  it('uses English translations and number formatting for English users', async () => {
    useAuthStore.setState({ user: { id: 'user', email: '', name: '', locale: 'en', tenantId: 'tenant', enabledModules: [] } });
    vi.mocked(api.get).mockResolvedValue({ data: summary });
    renderCards();
    expect(await screen.findByText('1,846')).toBeTruthy();
    expect(screen.getByText('On hand at cost')).toBeTruthy();
    expect(screen.getByText('24.5')).toBeTruthy();
  });

  it('refreshes when inventory mutations invalidate inventory queries', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: summary });
    const client = renderCards();
    await screen.findByRole('region', { name: 'Salud del stock' });
    await client.invalidateQueries({ queryKey: ['inventory'] });
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2));
  });
});
