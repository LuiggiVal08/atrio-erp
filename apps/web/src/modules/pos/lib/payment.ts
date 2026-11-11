import type { PaymentMethod } from '../store/pos-store';

export interface PaymentDraft {
  id: string;
  method: PaymentMethod;
  amount: string;
  currency: string;
  exchangeRate: string;
  bankName: string;
  reference: string;
  details: string;
}

export interface PaymentSummary {
  paid: number;
  cashPaid: number;
  nonCashPaid: number;
  remaining: number;
  change: number;
  rowsValid: boolean;
  covered: boolean;
  nonCashOverpay: boolean;
  valid: boolean;
}

export const PAYMENT_METHODS: Array<{ id: PaymentMethod; label: string }> = [
  { id: 'CASH', label: 'Efectivo' },
  { id: 'CARD', label: 'Tarjeta' },
  { id: 'TRANSFER', label: 'Transferencia' },
  { id: 'MOBILE_PAYMENT', label: 'Pago Móvil' },
];

export const PAYMENT_CURRENCIES = [
  { value: 'VED', label: 'VES - Bolívares' },
  { value: 'USD', label: 'USD - Dólares' },
  { value: 'EUR', label: 'EUR - Euros' },
  { value: 'COP', label: 'COP - Pesos' },
  { value: 'BRL', label: 'BRL - Reales' },
];

const EPSILON = 0.01;

const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export function createPaymentRow(
  method: PaymentMethod = 'CASH',
  amount = '',
  currency = 'VED',
): PaymentDraft {
  return {
    id: crypto.randomUUID(),
    method,
    amount,
    currency,
    exchangeRate: '1',
    bankName: '',
    reference: '',
    details: '',
  };
}

export function paymentBaseAmount(row: PaymentDraft): number {
  const amount = Number(row.amount) || 0;
  const rate = Number(row.exchangeRate) || 0;
  return amount * rate;
}

export function summarizePayments(rows: PaymentDraft[], total: number): PaymentSummary {
  let paid = 0;
  let cashPaid = 0;
  let nonCashPaid = 0;

  for (const row of rows) {
    const base = paymentBaseAmount(row);
    paid += base;
    if (row.method === 'CASH') cashPaid += base;
    else nonCashPaid += base;
  }

  const rowsValid =
    rows.length > 0 &&
    rows.every((row) => Number(row.amount) > 0 && Number(row.exchangeRate) > 0);

  const covered = paid + EPSILON >= total;
  const nonCashOverpay = nonCashPaid > total + EPSILON;

  return {
    paid: round2(paid),
    cashPaid: round2(cashPaid),
    nonCashPaid: round2(nonCashPaid),
    remaining: round2(Math.max(0, total - paid)),
    change: round2(Math.max(0, paid - total)),
    rowsValid,
    covered,
    nonCashOverpay,
    valid: rowsValid && covered && !nonCashOverpay,
  };
}
