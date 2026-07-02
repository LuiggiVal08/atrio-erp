import { useTranslation } from '@/shared/hooks/useTranslation';
import { useCashAuditStore, type CountedAmounts } from '@/modules/cash/store/cash-audit-store';

export function AuditFormView() {
  const { t } = useTranslation();
  const { audit, setCounted, approve, reject } = useCashAuditStore();

  if (!audit) return null;

  const handleCountedChange = (field: keyof CountedAmounts, value: string) => {
    const num = parseFloat(value) || 0;
    setCounted({
      cash: field === 'cash' ? num : (audit.countedCash ?? 0),
      card: field === 'card' ? num : (audit.countedCard ?? 0),
      transfer: field === 'transfer' ? num : (audit.countedTransfer ?? 0),
    });
  };

  const fields: { key: keyof CountedAmounts; label: string }[] = [
    { key: 'cash', label: t('cash.audit.cash') },
    { key: 'card', label: t('cash.audit.card') },
    { key: 'transfer', label: t('cash.audit.transfer') },
  ];

  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <h3 className="mb-4 text-sm font-semibold text-text-primary">{t('cash.audit.title')}</h3>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wider text-text-secondary">
            <th className="px-3 py-2 text-left font-medium">{t('cash.audit')}</th>
            <th className="px-3 py-2 text-right font-medium">{t('cash.audit.expected')}</th>
            <th className="px-3 py-2 text-right font-medium">{t('cash.audit.counted')}</th>
            <th className="px-3 py-2 text-right font-medium">{t('cash.audit.difference')}</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((f) => {
            const expected = f.key === 'cash' ? audit.expectedCash : f.key === 'card' ? audit.expectedCard : audit.expectedTransfer;
            const counted = f.key === 'cash' ? (audit.countedCash ?? 0) : f.key === 'card' ? (audit.countedCard ?? 0) : (audit.countedTransfer ?? 0);
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
                    onChange={(e) => handleCountedChange(f.key, e.target.value)}
                    className="ml-auto block w-32 rounded border border-border bg-canvas px-2 py-1 text-right text-sm text-text-primary focus:border-accent focus:outline-none"
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
            onClick={approve}
            disabled={audit.countedCash === null}
            className="rounded-lg bg-accent px-4 py-2 text-xs font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t('cash.audit.approve')}
          </button>
        </div>
      </div>
    </div>
  );
}
