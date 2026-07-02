import { useTranslation } from '@/shared/hooks/useTranslation';
import { DocumentStateBadge } from '@/core/components/DocumentStateBadge';
import type { DocumentStatus } from '@/core/components/DocumentStateBadge';

interface Movement {
  id: string;
  type: 'sale' | 'payment' | 'expense' | 'transfer';
  amount: number;
  description: string;
  createdAt: string;
}

const mockMovements: Movement[] = [
  { id: 'm-1', type: 'sale', amount: 150.00, description: 'Venta POS #001', createdAt: '2026-07-01T10:30:00' },
  { id: 'm-2', type: 'payment', amount: 50.00, description: 'Pago factura #F-100', createdAt: '2026-07-01T11:00:00' },
  { id: 'm-3', type: 'expense', amount: 25.00, description: 'Gasto operativo', createdAt: '2026-07-01T11:30:00' },
  { id: 'm-4', type: 'sale', amount: 320.00, description: 'Venta POS #002', createdAt: '2026-07-01T12:00:00' },
];

export function CashDashboard() {
  const { t } = useTranslation();

  const totals = {
    sale: mockMovements.filter((m) => m.type === 'sale').reduce((a, m) => a + m.amount, 0),
    payment: mockMovements.filter((m) => m.type === 'payment').reduce((a, m) => a + m.amount, 0),
    expense: mockMovements.filter((m) => m.type === 'expense').reduce((a, m) => a + m.amount, 0),
    transfer: mockMovements.filter((m) => m.type === 'transfer').reduce((a, m) => a + m.amount, 0),
  };

  const balance = totals.sale + totals.payment - totals.expense;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        {(['sale', 'payment', 'expense', 'transfer'] as const).map((type) => (
          <div key={type} className="rounded-lg border border-border bg-surface p-3">
            <p className="text-xs text-text-secondary">{t(`cash.movementTypes.${type}`)}</p>
            <p className={`mt-1 text-lg font-bold ${type === 'expense' ? 'text-red-400' : 'text-emerald-400'}`}>
              {type === 'expense' ? '-' : '+'}
              {totals[type].toLocaleString('es-VE', { minimumFractionDigits: 2 })}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border bg-surface p-3">
        <span className="text-sm font-semibold text-text-primary">{t('register.name')}</span>
        <DocumentStateBadge status={'draft' as DocumentStatus} size="sm" />
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border bg-surface p-3">
        <span className="text-sm text-text-secondary">{t('register.balance')}</span>
        <span className={`text-lg font-bold ${balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {balance.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
        </span>
      </div>

      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
          {t('cash.audit.summary')}
        </h4>
        <div className="max-h-48 overflow-auto space-y-1">
          {mockMovements.length === 0 ? (
            <p className="py-4 text-center text-sm text-text-secondary">{t('cash.empty')}</p>
          ) : (
            mockMovements.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2">
                <div>
                  <p className="text-xs text-text-primary">{m.description}</p>
                  <p className="text-[10px] text-text-secondary">{new Date(m.createdAt).toLocaleString()}</p>
                </div>
                <span className={`text-xs font-medium ${m.type === 'expense' ? 'text-red-400' : 'text-emerald-400'}`}>
                  {m.type === 'expense' ? '-' : '+'}{m.amount.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
