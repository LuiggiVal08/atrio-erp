import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StatusBar } from '@/core/components/StatusBar';

vi.mock('@/core/hooks/useOnlineStatus', () => ({
  useOnlineStatus: () => true,
}));

vi.mock('@/modules/inventory/hooks/useCurrencyRates', () => ({
  useCurrencyRates: () => ({
    data: [
      { id: '1', fromCurrency: 'USD', toCurrency: 'VES', rate: 850, date: '2026-10-30' },
      { id: '2', fromCurrency: 'USD', toCurrency: 'VES', rate: 885.74, date: '2026-11-01' },
    ],
    isLoading: false,
  }),
}));

vi.mock('@/core/tenant/store', () => ({
  useTenantStore: () => 'tenant-1',
}));

vi.mock('@/modules/settings/hooks/useTenant', () => ({
  useTenant: () => ({
    data: {
      baseCurrency: 'VES',
      settings: { foreignCurrency: 'USD' },
    },
  }),
}));

describe('StatusBar', () => {
  it('shows the latest USD to VES rate in a prominent status message', () => {
    render(<StatusBar />);

    expect(screen.getByText('1 USD = 885,74 VES')).toBeTruthy();
    expect(screen.getByText('Conectado')).toBeTruthy();
  });
});
