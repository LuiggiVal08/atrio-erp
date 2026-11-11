import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('@/shared/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
      'localization.title': 'Localización',
      'localization.taxes': 'Impuestos',
      'localization.currencyRates': 'Tasas de cambio',
      };
      return translations[key] ?? key;
    },
  }),
}));

vi.mock('@/modules/inventory/views/FiscalConfigView', () => ({
  FiscalConfigView: () => <div>Tax configuration view</div>,
}));

vi.mock('@/modules/inventory/views/CurrencyRateListView', () => ({
  CurrencyRateListView: () => <div>Currency rates view</div>,
}));

import { LocalizationModule } from '@/modules/localization';

describe('LocalizationModule', () => {
  it('keeps taxes and currency rates under the localization route', () => {
    render(
      <MemoryRouter initialEntries={['/localization/currency-rates']}>
        <Routes>
          <Route path="/localization/*" element={<LocalizationModule />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('navigation', { name: 'Localización' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Impuestos' }).getAttribute('href')).toBe('/localization/taxes');
    expect(screen.getByRole('link', { name: 'Tasas de cambio' }).getAttribute('href')).toBe('/localization/currency-rates');
    expect(screen.getByText('Currency rates view')).toBeTruthy();
  });
});
