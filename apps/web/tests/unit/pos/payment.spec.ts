import { describe, expect, it } from 'vitest';
import {
  createPaymentRow,
  paymentBaseAmount,
  summarizePayments,
  type PaymentDraft,
} from '@/modules/pos/lib/payment';

const row = (overrides: Partial<PaymentDraft>): PaymentDraft => ({
  ...createPaymentRow(),
  ...overrides,
});

describe('mixed payment summary', () => {
  it('accepts an exact cash payment', () => {
    const summary = summarizePayments([row({ method: 'CASH', amount: '116' })], 116);

    expect(summary.valid).toBe(true);
    expect(summary.paid).toBe(116);
    expect(summary.change).toBe(0);
    expect(summary.remaining).toBe(0);
  });

  it('gives change when cash exceeds the total', () => {
    const summary = summarizePayments([row({ method: 'CASH', amount: '120' })], 116);

    expect(summary.valid).toBe(true);
    expect(summary.change).toBe(4);
  });

  it('rejects a card payment that exceeds the total', () => {
    const summary = summarizePayments([row({ method: 'CARD', amount: '120' })], 116);

    expect(summary.valid).toBe(false);
    expect(summary.nonCashOverpay).toBe(true);
  });

  it('accepts a card and cash split without change', () => {
    const summary = summarizePayments(
      [row({ method: 'CARD', amount: '100' }), row({ method: 'CASH', amount: '16' })],
      116,
    );

    expect(summary.valid).toBe(true);
    expect(summary.paid).toBe(116);
    expect(summary.change).toBe(0);
  });

  it('gives change only from the cash portion of a split payment', () => {
    const summary = summarizePayments(
      [row({ method: 'TRANSFER', amount: '100' }), row({ method: 'CASH', amount: '20' })],
      116,
    );

    expect(summary.valid).toBe(true);
    expect(summary.nonCashOverpay).toBe(false);
    expect(summary.change).toBe(4);
  });

  it('reports the missing amount when underpaid', () => {
    const summary = summarizePayments([row({ method: 'CASH', amount: '50' })], 116);

    expect(summary.valid).toBe(false);
    expect(summary.covered).toBe(false);
    expect(summary.remaining).toBe(66);
  });

  it('rejects rows without amount or rate', () => {
    const summary = summarizePayments(
      [row({ method: 'CASH', amount: '0' }), row({ method: 'CARD', amount: '10', exchangeRate: '0' })],
      116,
    );

    expect(summary.rowsValid).toBe(false);
    expect(summary.valid).toBe(false);
  });

  it('converts foreign currency amounts to the base total', () => {
    const foreign = row({ method: 'CARD', amount: '10', currency: 'USD', exchangeRate: '40' });

    expect(paymentBaseAmount(foreign)).toBe(400);

    const summary = summarizePayments([foreign], 400);
    expect(summary.valid).toBe(true);
    expect(summary.paid).toBe(400);
  });
});
