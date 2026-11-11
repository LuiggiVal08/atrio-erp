import { CheckCircle2 } from 'lucide-react';
import { formatMoney } from '../lib/format';

interface Props {
  total: number;
  change: number;
  offline?: boolean;
  onNewSale: () => void;
  onClose: () => void;
}

export function ReceiptPanel({ total, change, offline = false, onNewSale, onClose }: Props) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Venta completada"
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-lg bg-surface p-8 text-center shadow-lg">
        <div className="mb-4 flex justify-center text-success">
          <CheckCircle2 className="h-14 w-14" aria-hidden />
        </div>
        <h2 className="mb-2 text-xl font-bold text-text-primary">Venta completada</h2>

        <div className="mb-6 space-y-1 text-sm text-text-secondary">
          <div className="text-lg font-semibold text-text-primary">
            Total: ${formatMoney(total)}
          </div>
          {change > 0 && (
            <div>
              Cambio: <span className="font-medium text-text-primary">${formatMoney(change)}</span>
            </div>
          )}
          {offline && (
            <div className="mt-2 rounded bg-warning/15 px-2 py-1.5 text-xs text-warning">
              Sin conexión: la venta quedó en cola y se sincronizará al recuperar la red.
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onNewSale}
            className="flex-1 rounded bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover"
          >
            Nueva Venta
          </button>
        </div>
      </div>
    </div>
  );
}
