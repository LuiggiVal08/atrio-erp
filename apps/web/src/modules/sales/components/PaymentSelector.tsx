import { useTranslation } from '@/shared/hooks/useTranslation';
import { usePOSStore, type PaymentMethod, type PaymentAllocation } from '@/modules/sales/store/pos-store';
import { Banknote, CreditCard, Smartphone, CircleEllipsis, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface PaymentSelectorProps {
  onConfirm: () => void;
  onClose: () => void;
}

const methods: { key: PaymentMethod; icon: typeof Banknote; label: string }[] = [
  { key: 'cash', icon: Banknote, label: 'Efectivo' },
  { key: 'digital', icon: Smartphone, label: 'Digital' },
  { key: 'card', icon: CreditCard, label: 'Punto / tarjeta' },
  { key: 'other', icon: CircleEllipsis, label: 'Otro' },
];

interface PaymentRow {
  id: string;
  method: PaymentMethod;
  amount: string;
  currency: string;
  exchangeRate: string;
  bankName: string;
  reference: string;
  details: string;
}

export function PaymentSelector({ onConfirm, onClose }: PaymentSelectorProps) {
  const { t } = useTranslation();
  const { paymentMethod, setPaymentMethod, setPaymentAllocations, total } = usePOSStore();
  const [payments, setPayments] = useState<PaymentRow[]>([]);

  const addPayment = () => {
    if (!paymentMethod) return;
    setPayments((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        method: paymentMethod,
        amount: '',
        currency: 'VED',
        exchangeRate: '1',
        bankName: '',
        reference: '',
        details: '',
      },
    ]);
  };

  const updatePayment = (id: string, patch: Partial<PaymentRow>) => {
    setPayments((current) => current.map((payment) => payment.id === id ? { ...payment, ...patch } : payment));
  };

  const removePayment = (id: string) => {
    setPayments((current) => current.filter((payment) => payment.id !== id));
  };

  const confirm = () => {
    if (payments.length === 0) return;
    const allocations: PaymentAllocation[] = payments.map((payment) => ({
      method: payment.method,
      amount: Number(payment.amount) || 0,
      currency: payment.currency,
      exchangeRate: Number(payment.exchangeRate) || 1,
      bankName: payment.method === 'digital' ? payment.bankName.trim() || undefined : undefined,
      reference: payment.method === 'digital' ? payment.reference.trim() || undefined : undefined,
      details: payment.method === 'other' ? payment.details.trim() || undefined : undefined,
    }));
    setPaymentAllocations(allocations);
    onConfirm();
  };

  const toBaseCurrency = (payment: PaymentRow) => (Number(payment.amount) || 0) * (Number(payment.exchangeRate) || 1);
  const paidTotal = payments.reduce((sum, payment) => sum + toBaseCurrency(payment), 0);
  const paymentsValid =
    payments.length > 0 &&
    payments.every((payment) => Number(payment.amount) > 0 && Number(payment.exchangeRate) > 0) &&
    Math.abs(paidTotal - total) < 0.01;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-2xl rounded-xl border border-border bg-surface p-6 shadow-2xl">
        <h2 className="mb-4 text-lg font-bold text-text-primary">{t('sales.pos.selectPayment')}</h2>

        <div className="mb-6 text-center">
          <p className="text-xs text-text-secondary">{t('sales.pos.total')}</p>
          <p className="text-3xl font-bold text-text-primary">
            {total.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="mb-4 grid grid-cols-4 gap-2">
          {methods.map((m) => (
            <button
              key={m.key}
              onClick={() => setPaymentMethod(m.key)}
              className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border p-2 text-center transition-colors ${
                paymentMethod === m.key
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border text-text-secondary hover:border-accent/50 hover:text-text-primary'
              }`}
            >
              <m.icon className="h-5 w-5" />
              <span className="text-xs font-medium">{m.label}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={addPayment}
          disabled={!paymentMethod}
          className="mb-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-xs font-medium text-text-secondary hover:border-accent hover:text-accent disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
          Agregar pago
        </button>

        <div className="max-h-72 space-y-3 overflow-y-auto">
          {payments.map((payment, index) => (
            <div key={payment.id} className="rounded-xl border border-border p-3">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-text-primary">Pago {index + 1} · {methods.find((item) => item.key === payment.method)?.label}</span>
                <button type="button" onClick={() => removePayment(payment.id)} className="rounded-md p-1 text-text-secondary hover:bg-surface-hover hover:text-red-400" aria-label="Eliminar pago">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <label className="grid gap-1 text-[11px] font-medium text-text-secondary">Monto
                  <input type="number" min="0.01" step="0.01" value={payment.amount} onChange={(e) => updatePayment(payment.id, { amount: e.target.value })} className="rounded-lg border border-border bg-bg px-2 py-2 text-sm text-text-primary" />
                </label>
                <label className="grid gap-1 text-[11px] font-medium text-text-secondary">Moneda
                  <select value={payment.currency} onChange={(e) => updatePayment(payment.id, { currency: e.target.value })} className="rounded-lg border border-border bg-bg px-2 py-2 text-sm text-text-primary">
                    <option value="VED">VES</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </label>
                <label className="grid gap-1 text-[11px] font-medium text-text-secondary">Tasa
                  <input type="number" min="0" step="0.000001" value={payment.exchangeRate} onChange={(e) => updatePayment(payment.id, { exchangeRate: e.target.value })} className="rounded-lg border border-border bg-bg px-2 py-2 text-sm text-text-primary" />
                </label>
              </div>
              {payment.method === 'digital' && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <input value={payment.bankName} onChange={(e) => updatePayment(payment.id, { bankName: e.target.value })} placeholder="Banco receptor" className="rounded-lg border border-border bg-bg px-2 py-2 text-sm text-text-primary" />
                  <input value={payment.reference} onChange={(e) => updatePayment(payment.id, { reference: e.target.value })} placeholder="Nro. de referencia" className="rounded-lg border border-border bg-bg px-2 py-2 text-sm text-text-primary" />
                </div>
              )}
              {payment.method === 'other' && (
                <input value={payment.details} onChange={(e) => updatePayment(payment.id, { details: e.target.value })} placeholder="Detalle del pago" className="mt-2 w-full rounded-lg border border-border bg-bg px-2 py-2 text-sm text-text-primary" />
              )}
            </div>
          ))}
        </div>

        {payments.length > 0 && (
          <div className="mt-3 flex items-center justify-between rounded-lg bg-surface-hover px-3 py-2 text-xs">
            <span className={paymentsValid ? 'text-emerald-400' : 'text-red-400'}>
              Pagado: {paidTotal.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-text-secondary">Total: {total.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-hover"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={confirm}
            disabled={!paymentsValid}
            className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t('sales.pos.confirmPayment')}
          </button>
        </div>
      </div>
    </div>
  );
}
