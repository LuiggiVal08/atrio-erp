import { useTranslation } from '@/shared/hooks/useTranslation';
import { useCashAuditStore, type ExpectedAmounts } from '@/modules/cash/store/cash-audit-store';
import { AuditFormView } from '@/modules/cash/components/AuditFormView';
import { CashDashboard } from '@/modules/cash/components/CashDashboard';

export function CashAuditView() {
  const { t } = useTranslation();
  const { startAudit, isAuditing } = useCashAuditStore();

  const handleStartAudit = () => {
    const expected: ExpectedAmounts = { cash: 500, card: 300, transfer: 200 };
    startAudit('reg-1', expected);
  };

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-text-primary">{t('cash.audit.title')}</h1>
        {!isAuditing && (
          <button
            onClick={handleStartAudit}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            {t('cash.audit.start')}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <CashDashboard />
        <div>
          {isAuditing ? (
            <AuditFormView />
          ) : (
            <div className="flex h-full items-center justify-center rounded-xl border border-border bg-surface">
              <p className="text-sm text-text-secondary">{t('cash.audit.noRegister')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
