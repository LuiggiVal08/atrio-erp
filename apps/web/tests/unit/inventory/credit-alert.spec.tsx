import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { CreditAlertBanner, type FichaTercero } from '@/modules/inventory/components/CreditAlertBanner';

vi.mock('@/shared/hooks/useTranslation', () => ({
  useTranslation: () => ({ t: (key: string) => key, locale: 'es' }),
}));

afterEach(cleanup);

function makeFicha(overrides?: Partial<FichaTercero>): FichaTercero {
  return {
    id: 'tp-1',
    type: 'customer',
    legalName: 'Test Corp',
    taxId: 'J-12345678-9',
    phone: '+58 412 555 0000',
    email: 'test@corp.com',
    creditLimit: 10000,
    currentBalance: 5000,
    currencyCode: 'VES',
    creditExceeded: false,
    transactions: [],
    recentDocuments: [],
    ...overrides,
  };
}

describe('credit alert logic', () => {
  it('shows alert banner when currentBalance > creditLimit', () => {
    const ficha = makeFicha({ currentBalance: 15000, creditLimit: 10000, creditExceeded: true });
    render(<CreditAlertBanner ficha={ficha} />);
    expect(screen.getByRole('alert')).toBeTruthy();
  });

  it('hides alert banner when currentBalance <= creditLimit', () => {
    const ficha = makeFicha({ currentBalance: 5000, creditLimit: 10000, creditExceeded: false });
    render(<CreditAlertBanner ficha={ficha} />);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('displays the exceeded amount', () => {
    const ficha = makeFicha({ currentBalance: 12000, creditLimit: 10000, creditExceeded: true });
    render(<CreditAlertBanner ficha={ficha} />);
    expect(screen.getByTestId('exceeded-amount')).toBeTruthy();
  });
});
