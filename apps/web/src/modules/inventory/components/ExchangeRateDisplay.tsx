import { useTranslation } from '@/shared/hooks/useTranslation';
import { useFiscalConfigStore } from '../store/fiscal-config-store';

export function ExchangeRateDisplay() {
  const { t } = useTranslation();
  const { taxRules } = useFiscalConfigStore();

  const rate = taxRules.length > 0
    ? taxRules.filter((r) => !r.isExempt).reduce((s, r) => s + r.rate, 0)
    : 0;

  return (
    <div className="flex items-center gap-2 text-xs text-text-secondary">
      <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
      <span>{t('localization.exchangeRate')}: {(rate || 1).toFixed(2)}</span>
    </div>
  );
}
