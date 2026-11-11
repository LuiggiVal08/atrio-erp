import { useTranslation } from '@/shared/hooks/useTranslation';
import { useCashAuditStore } from '@/modules/cash/store/cash-audit-store';
import { Modal } from '@/core/components/Modal';
import { useState } from 'react';

export function AuditFormView({ onApprove }: { onApprove?: () => void }) {
  const { t } = useTranslation();
  const { audit, setCounted, approve, reject, setClosingNote, setClosingDenominations } = useCashAuditStore();
  const [showDenominations, setShowDenominations] = useState(false);

  if (!audit) return null;

  const denominationOptions: Record<string, number[]> = {
    VES: [1000, 500, 100, 50, 20, 10, 5, 2, 1],
    USD: [100, 50, 20, 10, 5, 2, 1],
    EUR: [500, 200, 100, 50, 20, 10, 5],
  };
  const currencies = ['VES', 'USD', 'EUR'];

  const handleCountedChange = (field: string, value: string) => {
    const num = parseFloat(value) || 0;
    setCounted({
      cash: field === 'cash' ? num : (audit.countedCash ?? 0),
      card: field === 'card' ? num : (audit.countedCard ?? 0),
      transfer: field === 'transfer' ? num : (audit.countedTransfer ?? 0),
    });
  };

  const handleDenomination = (currency: string, denomination: number, value: string) => {
    const counts = { ...(audit.closingDenominations || {}) };
    counts[currency] = { ...(counts[currency] || {}) };
    counts[currency][String(denomination)] = Math.max(0, parseInt(value, 10) || 0);
    setClosingDenominations(counts);
  };

  const physicalCash = Object.entries(audit.closingDenominations?.VES || {}).reduce(
    (sum, [denomination, quantity]) => sum + Number(denomination) * Number(quantity),
    0,
  );
  const cashDifference = physicalCash - (audit.expectedCashByCurrency.VES ?? audit.expectedCash);
  const hasCashDifference = ['VES', 'USD', 'EUR'].some((currency) => {
    const counted = audit.countedCashByCurrency[currency] ?? 0;
    const expected = audit.expectedCashByCurrency[currency] ?? 0;
    return counted !== expected;
  });
  const needsNote = hasCashDifference && !audit.closingNote.trim();

  const currencyRows = ['VES', 'USD', 'EUR']
    .filter((currency) =>
      Object.prototype.hasOwnProperty.call(audit.expectedCashByCurrency, currency) ||
      Object.prototype.hasOwnProperty.call(audit.countedCashByCurrency, currency),
    )
    .map((currency) => ({ key: `cash:${currency}`, label: `Efectivo ${currency}` }));
  const fields = [
    ...currencyRows,
    { key: 'card', label: t('cash.audit.card') },
    { key: 'transfer', label: t('cash.audit.transfer') },
  ];

  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <h3 className="mb-4 text-sm font-semibold text-text-primary">{t('cash.audit.title')}</h3>

      <div className="mb-5 flex items-center justify-between rounded-lg border border-border px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-text-primary">Conteo físico por billetes</p>
          <p className="mt-0.5 text-xs text-text-secondary">Registra cuántas piezas hay por denominación</p>
        </div>
        <button
          type="button"
          onClick={() => setShowDenominations(true)}
          className="shrink-0 rounded-lg border border-border px-3 py-2 text-xs font-medium text-text-primary hover:border-accent hover:text-accent"
        >
          Contar billetes
        </button>
      </div>

      <Modal
        open={showDenominations}
        onClose={() => setShowDenominations(false)}
        title="Desglose físico de billetes"
        size="xl"
      >
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-3">
          {currencies.map((currency) => (
            <div key={currency} className="rounded-lg border border-border p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-text-primary">{currency}</span>
                <span className="text-xs tabular-nums text-text-secondary">
                  {Object.entries(audit.closingDenominations?.[currency] || {}).reduce(
                    (sum, [den, quantity]) => sum + Number(den) * Number(quantity),
                    0,
                  ).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(62px,1fr))] gap-2">
                {denominationOptions[currency].map((denomination) => (
                  <label key={denomination} className="grid gap-1 text-[11px] text-text-secondary">
                    {denomination.toLocaleString('es-VE')}
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={audit.closingDenominations?.[currency]?.[String(denomination)] || ''}
                      onChange={(event) => handleDenomination(currency, denomination, event.target.value)}
                      className="min-w-0 w-full rounded border border-border bg-canvas px-1.5 py-1 text-right text-sm tabular-nums text-text-primary"
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={() => setShowDenominations(false)}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white"
          >
            Aplicar conteo
          </button>
        </div>
      </Modal>

      <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wider text-text-secondary">
            <th className="px-3 py-2 text-left font-medium">{t('cash.audit.cash')}</th>
            <th className="px-3 py-2 text-right font-medium">{t('cash.audit.expected')}</th>
            <th className="px-3 py-2 text-right font-medium">{t('cash.audit.counted')}</th>
            <th className="px-3 py-2 text-right font-medium">{t('cash.audit.difference')}</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((f) => {
            const cashCurrency = f.key.startsWith('cash:')
              ? f.key.slice(5)
              : null;
            const expected = cashCurrency
              ? (audit.expectedCashByCurrency[cashCurrency] ?? 0)
              : f.key === 'card'
                ? audit.expectedCard
                : audit.expectedTransfer;
            const counted = cashCurrency
              ? (audit.countedCashByCurrency[cashCurrency] ?? 0)
              : f.key === 'card'
                ? (audit.countedCard ?? 0)
                : (audit.countedTransfer ?? 0);
            const diff = counted - expected;
            return (
              <tr key={f.key} className="border-b border-border">
                <td className="px-3 py-2 text-sm text-text-primary">{f.label}</td>
                <td className="px-3 py-2 text-right text-sm text-text-secondary">
                  {expected.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={counted || ''}
                    readOnly={!!cashCurrency}
                    disabled={!!cashCurrency && counted === 0}
                    onChange={(e) => handleCountedChange(f.key, e.target.value)}
                    className="ml-auto block w-full max-w-32 min-w-0 rounded border border-border bg-canvas px-2 py-1 text-right text-sm tabular-nums text-text-primary focus:border-accent focus:outline-none"
                  />
                </td>
                <td className={`px-3 py-2 text-right text-sm font-medium ${
                  diff === 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {diff >= 0 ? '+' : ''}{diff.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-border font-bold">
            <td className="px-3 py-2 text-sm text-text-primary">{t('cash.audit.difference')}</td>
            <td colSpan={2} />
            <td className={`px-3 py-2 text-right text-sm ${
              (audit.isBalanced ?? false) ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {audit.difference !== null
                ? `${audit.difference >= 0 ? '+' : ''}${audit.difference.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`
                : '—'}
            </td>
          </tr>
        </tfoot>
      </table>
      </div>

      <div className="mt-4 rounded-lg border border-border p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-secondary">Diferencia física de efectivo</span>
          <span className={`text-sm font-semibold ${cashDifference === 0 ? 'text-emerald-400' : cashDifference > 0 ? 'text-amber-400' : 'text-red-400'}`}>
            {cashDifference >= 0 ? '+' : ''}{cashDifference.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
          </span>
        </div>
        {cashDifference !== 0 && (
          <label className="mt-3 grid gap-1 text-xs font-medium text-text-secondary">
            Justificación obligatoria
            <textarea
              rows={2}
              value={audit.closingNote}
              onChange={(event) => setClosingNote(event.target.value)}
              placeholder={cashDifference > 0 ? 'Ej. Sobrante por propina no registrada' : 'Ej. Faltó cambio al dar vuelto'}
              className="resize-none rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary"
            />
          </label>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div>
          {audit.isBalanced === true && (
            <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
              {t('cash.audit.balanced')}
            </span>
          )}
          {audit.isBalanced === false && (
            <span className="rounded bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400">
              {t('cash.audit.unbalanced')}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={reject}
            className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-text-secondary hover:bg-surface-hover"
          >
            {t('cash.audit.reject')}
          </button>
          <button
            onClick={async () => {
              await onApprove?.();
              approve();
            }}
            disabled={audit.countedCash === null || needsNote}
            className="rounded-lg bg-accent px-4 py-2 text-xs font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t('cash.audit.approve')}
          </button>
        </div>
      </div>
    </div>
  );
}
