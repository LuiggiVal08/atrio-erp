import { useTranslation } from '@/shared/hooks/useTranslation';
import { useCashRegisterDetail } from '@/modules/cash/hooks/useCashRegisterDetail';

interface CashDashboardProps {
  registerName?: string;
  registerBalance?: number;
  registerId?: string;
  showMovements?: boolean;
}

export function CashDashboard({ registerName, registerBalance, registerId, showMovements = true }: CashDashboardProps) {
  const { t } = useTranslation();
  const { data: detail, isLoading } = useCashRegisterDetail(registerId || null);
  const balance = detail?.totals.currentBalance ?? registerBalance ?? 0;
  const normalizeCurrency = (currency: string) => currency === 'VED' ? 'VES' : currency;
  const formatAmount = (amount: number, currency = 'VES') =>
    `${amount.toLocaleString('es-VE', { minimumFractionDigits: 2 })} ${normalizeCurrency(currency)}`;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-border bg-surface p-3">
          <p className="text-xs text-text-secondary">Caja</p>
          <p className="mt-1 text-sm font-semibold text-text-primary">{detail?.register.name || registerName || t('cash.register.name')}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-3">
          <p className="text-xs text-text-secondary">Ubicación</p>
          <p className="mt-1 text-sm font-semibold text-text-primary">{detail?.register.location || 'Sin ubicación'}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-3">
          <p className="text-xs text-text-secondary">Responsable</p>
          <p className="mt-1 text-sm font-semibold text-text-primary">
            {detail?.session?.user?.name || detail?.session?.user?.email || 'Caja cerrada'}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-3">
          <p className="text-xs text-text-secondary">Estado</p>
          <p className={`mt-1 text-sm font-semibold ${detail?.session ? 'text-emerald-400' : 'text-text-secondary'}`}>
            {detail?.session ? 'Turno abierto' : 'Sin turno abierto'}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border bg-surface p-3">
        <span className="text-sm text-text-secondary">{t('cash.register.balance')}</span>
        <span className={`text-lg font-bold ${balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {formatAmount(balance)}
        </span>
      </div>

      {detail && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-surface p-3">
              <p className="text-xs text-text-secondary">Fondo inicial</p>
              <p className="mt-1 text-sm font-semibold text-text-primary">{formatAmount(detail.totals.openingBalance)}</p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-3">
              <p className="text-xs text-text-secondary">Efectivo esperado</p>
              <p className="mt-1 text-sm font-semibold text-emerald-400">{formatAmount(detail.totals.expectedCash)}</p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-3">
              <p className="text-xs text-text-secondary">Ingresos en efectivo</p>
              {detail.totals.cashPaymentsByCurrency?.length ? (
                <div className="mt-1 space-y-0.5">
                  {detail.totals.cashPaymentsByCurrency.map((cash) => (
                    <p key={cash.currency} className="text-sm font-semibold text-text-primary">
                      {formatAmount(cash.amount, cash.currency)}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-sm font-semibold text-text-primary">{formatAmount(0)}</p>
              )}
            </div>
            <div className="rounded-lg border border-border bg-surface p-3">
              <p className="text-xs text-text-secondary">Salidas de efectivo</p>
              {detail.totals.cashOutByCurrency?.length ? (
                <div className="mt-1 space-y-0.5">
                  {detail.totals.cashOutByCurrency.map((cash) => (
                    <p key={cash.currency} className="text-sm font-semibold text-red-400">
                      {formatAmount(cash.amount, cash.currency)}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-sm font-semibold text-red-400">{formatAmount(0)}</p>
              )}
            </div>
          </div>

          {detail.totals.cashByCurrency?.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">Efectivo por moneda</h4>
              <div className="grid grid-cols-2 gap-2">
                {detail.totals.cashByCurrency.map((cash) => (
                  <div key={cash.currency} className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2">
                    <span className="text-xs text-text-secondary">{cash.currency === 'VED' ? 'VES' : cash.currency}</span>
                    <span className="text-xs font-semibold text-text-primary">{formatAmount(cash.amount, cash.currency)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {detail.totals.payments.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">Otros medios de pago</h4>
              <div className="space-y-1">
                {detail.totals.payments.map((payment) => (
                  <div key={`${payment.method}:${payment.currency}`} className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2">
                    <span className="text-xs text-text-secondary">{payment.method}</span>
                    <span className="text-xs font-semibold text-text-primary">{formatAmount(payment.amount, payment.currency)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {showMovements && (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
            {t('cash.audit.summary')}
          </h4>
          <div className="max-h-48 overflow-auto space-y-1">
            {!registerId && <p className="py-4 text-center text-sm text-text-secondary">Seleccione una caja.</p>}
            {registerId && isLoading && <p className="py-4 text-center text-sm text-text-secondary">Cargando...</p>}
            {registerId && !isLoading && detail?.movements.length === 0 && (
              <p className="py-4 text-center text-sm text-text-secondary">{t('cash.empty')}</p>
            )}
            {detail?.movements.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2">
                <div>
                  <p className="text-xs text-text-primary">{m.description}</p>
                  <p className="text-[10px] text-text-secondary">{new Date(m.createdAt).toLocaleString()}</p>
                </div>
                <span className={`text-xs font-medium ${m.type === 'out' ? 'text-red-400' : 'text-emerald-400'}`}>
                  {m.type === 'out' ? '-' : '+'}{m.amount.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                  {' '}{m.currency === 'VED' ? 'VES' : m.currency}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
