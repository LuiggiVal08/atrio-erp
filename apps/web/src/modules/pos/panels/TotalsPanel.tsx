import { usePosStore, usePosTotals } from '../store/pos-store';
import { formatMoney } from '../lib/format';

export function TotalsPanel() {
  const cart = usePosStore((s) => s.cart);
  const { subtotal, taxTotal, total } = usePosTotals();

  if (cart.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Totales"
      className="border-t border-border bg-surface-hover px-4 py-3"
    >
      <div className="ml-auto w-full max-w-xs space-y-1">
        <div className="flex items-center justify-between text-sm text-text-secondary">
          <span>Subtotal</span>
          <span className="tabular-nums text-text-primary">{formatMoney(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-text-secondary">
          <span>IVA 16%</span>
          <span className="tabular-nums text-text-primary">{formatMoney(taxTotal)}</span>
        </div>
        <div className="flex items-center justify-between border-t border-border pt-1 text-base font-bold text-text-primary">
          <span>Total</span>
          <span className="tabular-nums">{formatMoney(total)}</span>
        </div>
      </div>
    </div>
  );
}
