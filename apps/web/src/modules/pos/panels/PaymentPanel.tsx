import { useEffect, useRef, useState } from 'react';
import { Banknote, CreditCard, Landmark, Plus, Smartphone, Trash2, X } from 'lucide-react';
import { usePosTotals, type PaymentMethod } from '../store/pos-store';
import type { PaymentAllocationInput } from '../hooks/usePosCheckout';
import {
  PAYMENT_CURRENCIES,
  PAYMENT_METHODS,
  createPaymentRow,
  paymentBaseAmount,
  summarizePayments,
  type PaymentDraft,
} from '../lib/payment';
import { formatMoney } from '../lib/format';

interface Props {
  onConfirm: (allocations: PaymentAllocationInput[], change: number) => void;
  onClose: () => void;
  isProcessing: boolean;
}

const API_METHOD: Record<PaymentMethod, string> = {
  CASH: 'cash',
  CARD: 'card',
  TRANSFER: 'transfer',
  MOBILE_PAYMENT: 'mobile_payment',
};

const METHOD_ICONS: Record<PaymentMethod, typeof Banknote> = {
  CASH: Banknote,
  CARD: CreditCard,
  TRANSFER: Landmark,
  MOBILE_PAYMENT: Smartphone,
};

export function PaymentPanel({ onConfirm, onClose, isProcessing }: Props) {
  const { total } = usePosTotals();
  const [rows, setRows] = useState<PaymentDraft[]>(() => [
    createPaymentRow('CASH', total.toFixed(2)),
  ]);
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const summary = summarizePayments(rows, total);

  useEffect(() => {
    firstInputRef.current?.focus();
    firstInputRef.current?.select();
  }, []);

  useEffect(() => {
    if (!lastAddedId) return;
    const input = inputRefs.current[lastAddedId];
    input?.focus();
    input?.select();
    setLastAddedId(null);
  }, [lastAddedId, rows.length]);

  const updateRow = (id: string, patch: Partial<PaymentDraft>) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const changeCurrency = (row: PaymentDraft, currency: string) => {
    updateRow(row.id, {
      currency,
      ...(currency === 'VED' ? { exchangeRate: '1' } : {}),
    });
  };

  const addRow = () => {
    const remaining = summarizePayments(rows, total).remaining;
    const row = createPaymentRow('CASH', remaining > 0 ? remaining.toFixed(2) : '');
    setRows((current) => [...current, row]);
    setLastAddedId(row.id);
  };

  const removeRow = (id: string) => {
    setRows((current) => (current.length === 1 ? current : current.filter((row) => row.id !== id)));
  };

  const confirm = () => {
    if (!summary.valid || isProcessing) return;
    onConfirm(
      rows.map((row) => ({
        method: API_METHOD[row.method],
        amount: Number(row.amount) || 0,
        currency: row.currency || 'VED',
        exchangeRate: Number(row.exchangeRate) || 1,
        bankName: row.bankName.trim() || undefined,
        reference: row.reference.trim() || undefined,
        details: row.details.trim() || undefined,
      })),
      summary.change,
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter' || e.shiftKey) return;
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'BUTTON' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    e.preventDefault();
    confirm();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pos-payment-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onKeyDown={handleKeyDown}
    >
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative z-10 mx-4 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-surface shadow-xl">
        <header className="flex items-start justify-between border-b border-border px-6 py-4">
          <div>
            <h3 id="pos-payment-title" className="text-lg font-semibold text-text-primary">
              Cobrar
            </h3>
            <p className="mt-0.5 text-xs text-text-secondary">
              Puedes dividir el pago en varios métodos. Solo el efectivo genera vuelto.
            </p>
          </div>
          <div className="flex items-start gap-4">
            <div className="text-right">
              <p className="text-[11px] font-medium uppercase tracking-wider text-text-muted">Total</p>
              <p className="text-2xl font-bold tabular-nums text-text-primary">${formatMoney(total)}</p>
            </div>
            <button
              onClick={onClose}
              disabled={isProcessing}
              aria-label="Cerrar cobro"
              className="rounded-lg p-1.5 text-text-muted hover:bg-surface-hover hover:text-text-primary disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-6 py-4">
          {rows.map((row, index) => {
            const base = paymentBaseAmount(row);
            const amount = Number(row.amount) || 0;
            const showBase = row.currency !== 'VED' || Number(row.exchangeRate) !== 1;

            return (
              <div key={row.id} className="rounded-xl border border-border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-text-primary">Pago {index + 1}</span>
                  {rows.length > 1 && (
                    <button
                      onClick={() => removeRow(row.id)}
                      className="rounded p-1 text-text-muted hover:bg-surface-hover hover:text-error"
                      aria-label={`Eliminar pago ${index + 1}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div
                  className="mb-3 grid grid-cols-4 gap-1.5"
                  role="group"
                  aria-label={`Método del pago ${index + 1}`}
                >
                  {PAYMENT_METHODS.map((method) => {
                    const Icon = METHOD_ICONS[method.id];
                    return (
                      <button
                        key={method.id}
                        onClick={() => updateRow(row.id, { method: method.id })}
                        aria-pressed={row.method === method.id}
                        className={`flex flex-col items-center justify-center gap-1 rounded-lg border px-1 py-2 text-[10px] font-medium leading-tight transition-colors ${
                          row.method === method.id
                            ? 'border-accent bg-accent-alpha text-accent'
                            : 'border-border text-text-secondary hover:border-accent hover:text-text-primary'
                        }`}
                      >
                        <Icon aria-hidden className="h-4 w-4" />
                        {method.label}
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_5.5rem] gap-2">
                  <label className="grid gap-1 text-[11px] font-medium text-text-secondary">
                    Monto recibido
                    <input
                      ref={(el) => {
                        inputRefs.current[row.id] = el;
                        if (index === 0) firstInputRef.current = el;
                      }}
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      value={row.amount}
                      onChange={(e) => updateRow(row.id, { amount: e.target.value })}
                      onFocus={(e) => e.target.select()}
                      placeholder="0.00"
                      className="w-full min-w-0 rounded-lg border border-border-light px-2 py-2 text-sm tabular-nums text-text-primary outline-none focus:border-accent"
                    />
                  </label>
                  <label className="grid gap-1 text-[11px] font-medium text-text-secondary">
                    Moneda
                    <select
                      value={row.currency}
                      onChange={(e) => changeCurrency(row, e.target.value)}
                      className="w-full min-w-0 rounded-lg border border-border-light px-2 py-2 text-sm text-text-primary outline-none focus:border-accent"
                    >
                      {PAYMENT_CURRENCIES.map((currency) => (
                        <option key={currency.value} value={currency.value}>
                          {currency.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1 text-[11px] font-medium text-text-secondary">
                    Tasa
                    <input
                      type="text"
                      inputMode="decimal"
                      value={row.exchangeRate}
                      onChange={(e) => updateRow(row.id, { exchangeRate: e.target.value })}
                      className="w-full min-w-0 rounded-lg border border-border-light px-2 py-2 text-sm tabular-nums text-text-primary outline-none focus:border-accent"
                    />
                  </label>
                </div>

                {showBase && amount > 0 && Number(row.exchangeRate) > 0 && (
                  <p className="mt-1 text-[11px] text-text-muted">
                    Equivale a{' '}
                    <span className="font-medium tabular-nums text-text-secondary">
                      ${formatMoney(base)}
                    </span>
                  </p>
                )}

                {row.method !== 'CASH' && (
                  <div
                    className={`mt-2 grid gap-2 ${
                      row.method === 'CARD' ? 'grid-cols-1' : 'grid-cols-2'
                    }`}
                  >
                    {row.method !== 'CARD' && (
                      <input
                        value={row.bankName}
                        onChange={(e) => updateRow(row.id, { bankName: e.target.value })}
                        placeholder="Banco receptor"
                        className="rounded-lg border border-border-light px-2 py-2 text-sm text-text-primary outline-none focus:border-accent"
                      />
                    )}
                    <input
                      value={row.reference}
                      onChange={(e) => updateRow(row.id, { reference: e.target.value })}
                      placeholder="Nro. de referencia"
                      className="rounded-lg border border-border-light px-2 py-2 text-sm text-text-primary outline-none focus:border-accent"
                    />
                  </div>
                )}

                {row.method === 'CARD' && (
                  <input
                    value={row.details}
                    onChange={(e) => updateRow(row.id, { details: e.target.value })}
                    placeholder="Detalle del pago (opcional)"
                    className="mt-2 w-full rounded-lg border border-border-light px-2 py-2 text-sm text-text-primary outline-none focus:border-accent"
                  />
                )}
              </div>
            );
          })}

          <button
            onClick={addRow}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border-light px-3 py-2 text-xs font-medium text-text-secondary hover:border-accent hover:text-accent"
          >
            <Plus className="h-3.5 w-3.5" />
            Agregar pago (pago mixto)
          </button>
        </div>

        <footer className="border-t border-border px-6 py-4">
          <div className="mb-3 space-y-1 rounded-lg bg-surface-hover px-3 py-2 text-xs">
            <div className="flex justify-between">
              <span
                className={
                  summary.covered && !summary.nonCashOverpay
                    ? 'font-medium text-success'
                    : 'font-medium text-error'
                }
              >
                Pagado: ${formatMoney(summary.paid)}
              </span>
              <span className="text-text-secondary">
                Total <span className="tabular-nums">${formatMoney(total)}</span>
              </span>
            </div>
            {summary.remaining > 0 && (
              <div className="flex justify-between text-error">
                <span>Falta</span>
                <span className="font-medium tabular-nums">${formatMoney(summary.remaining)}</span>
              </div>
            )}
            {summary.valid && summary.change > 0 && (
              <div className="flex justify-between text-text-secondary">
                <span>Cambio</span>
                <span className="font-medium tabular-nums text-text-primary">
                  ${formatMoney(summary.change)}
                </span>
              </div>
            )}
          </div>

          {!summary.rowsValid && (
            <p className="mb-3 text-xs text-error">
              Cada pago necesita un monto mayor a 0 y una tasa válida.
            </p>
          )}
          {summary.rowsValid && summary.nonCashOverpay && (
            <p className="mb-3 text-xs text-error">
              Solo el efectivo puede exceder el total. Ajusta los pagos con tarjeta, transferencia o
              pago móvil.
            </p>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="rounded-lg border border-border-light px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-hover disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={confirm}
              disabled={!summary.valid || isProcessing}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isProcessing ? 'Procesando...' : 'COBRAR'}
              {!isProcessing && (
                <kbd className="rounded bg-white/15 px-1.5 py-0.5 text-[10px] font-medium">Enter</kbd>
              )}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
