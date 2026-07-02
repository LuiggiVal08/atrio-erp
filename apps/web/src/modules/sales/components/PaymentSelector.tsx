import { useTranslation } from '@/shared/hooks/useTranslation';
import { usePOSStore, type PaymentMethod } from '@/modules/sales/store/pos-store';

interface PaymentSelectorProps {
  onConfirm: () => void;
  onClose: () => void;
}

const methods: { key: PaymentMethod; icon: string }[] = [
  { key: 'cash', icon: '💵' },
  { key: 'card', icon: '💳' },
  { key: 'transfer', icon: '🏦' },
  { key: 'mixed', icon: '🔄' },
];

export function PaymentSelector({ onConfirm, onClose }: PaymentSelectorProps) {
  const { t } = useTranslation();
  const { paymentMethod, setPaymentMethod, total } = usePOSStore();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-2xl">
        <h2 className="mb-4 text-lg font-bold text-text-primary">{t('sales.pos.selectPayment')}</h2>

        <div className="mb-6 text-center">
          <p className="text-xs text-text-secondary">{t('sales.pos.total')}</p>
          <p className="text-3xl font-bold text-text-primary">
            {total.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3">
          {methods.map((m) => (
            <button
              key={m.key}
              onClick={() => setPaymentMethod(m.key)}
              className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-colors ${
                paymentMethod === m.key
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border text-text-secondary hover:border-accent/50 hover:text-text-primary'
              }`}
            >
              <span className="text-2xl">{m.icon}</span>
              <span className="text-sm font-medium">{t(`sales.pos.paymentMethods.${m.key}`)}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-hover"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={!paymentMethod}
            className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t('sales.pos.confirmPayment')}
          </button>
        </div>
      </div>
    </div>
  );
}
