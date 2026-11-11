import { usePosStore } from '../store/pos-store';
import { focusManager, FocusTargets } from '../focus/focus-manager';
import { formatMoney } from '../lib/format';

const ROW_GRID = 'grid grid-cols-[6.5rem_minmax(0,1fr)_5.5rem_6rem_1.5rem] items-center gap-3';

export function CartPanel() {
  const cart = usePosStore((s) => s.cart);
  const selectedLineIndex = usePosStore((s) => s.ui.selectedLineIndex);
  const updateQuantity = usePosStore((s) => s.updateQuantity);
  const removeLine = usePosStore((s) => s.removeLine);
  const setSelectedLineIndex = usePosStore((s) => s.setSelectedLineIndex);
  const selectNextLine = usePosStore((s) => s.selectNextLine);
  const selectPrevLine = usePosStore((s) => s.selectPrevLine);

  if (cart.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
        <span aria-hidden className="text-4xl">🛒</span>
        <p className="text-sm font-medium text-text-secondary">El carrito está vacío</p>
        <p className="max-w-xs text-xs text-text-muted">
          Busca un producto con F2 o escanea un código para iniciar la venta.
        </p>
      </div>
    );
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const sel = usePosStore.getState().ui.selectedLineIndex;
    if (sel < 0 || sel >= cart.length) return;

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectPrevLine();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectNextLine();
      return;
    }
    if (e.key === 'Home') {
      e.preventDefault();
      usePosStore.getState().selectFirstLine();
      return;
    }
    if (e.key === 'End') {
      e.preventDefault();
      usePosStore.getState().selectLastLine();
      return;
    }
    if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      const line = cart[sel];
      if (line) updateQuantity(line.id, line.quantity + 1);
      return;
    }
    if (e.key === '-') {
      e.preventDefault();
      const line = cart[sel];
      if (line && line.quantity > 1) updateQuantity(line.id, line.quantity - 1);
      return;
    }
    if (e.key === 'Delete' || e.key === 'Supr') {
      e.preventDefault();
      const line = cart[sel];
      if (line) {
        removeLine(line.id);
        const newLen = cart.length - 1;
        if (newLen === 0) {
          setSelectedLineIndex(-1);
          focusManager.requestFocus(FocusTargets.SEARCH);
        } else {
          setSelectedLineIndex(Math.min(sel, newLen - 1));
        }
      }
      return;
    }
  };

  return (
    <div
      role="list"
      aria-label="Carrito de compras"
      className="flex flex-col"
      onKeyDown={handleKeyDown}
    >
      <div
        className={`${ROW_GRID} sticky top-0 z-10 border-b border-border bg-surface-hover px-4 py-2 text-[11px] font-medium uppercase tracking-wider text-text-secondary`}
      >
        <span>Cant.</span>
        <span>Producto</span>
        <span className="text-right">P. unit.</span>
        <span className="text-right">Subtotal</span>
        <span />
      </div>

      {cart.map((line, idx) => (
        <div
          key={line.id}
          role="listitem"
          onClick={() => setSelectedLineIndex(idx)}
          className={`${ROW_GRID} cursor-pointer border-b border-border px-4 py-2.5 transition-colors ${
            idx === selectedLineIndex ? 'bg-accent-alpha shadow-[inset_3px_0_0_0_var(--accent-main)]' : 'hover:bg-surface-hover'
          }`}
        >
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); updateQuantity(line.id, line.quantity - 1); }}
              className="flex h-7 w-7 items-center justify-center rounded text-sm font-medium text-text-secondary hover:bg-surface-hover"
              aria-label="Disminuir cantidad"
            >
              −
            </button>
            <span className="w-8 text-center text-sm font-medium tabular-nums text-text-primary">
              {line.quantity}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); updateQuantity(line.id, line.quantity + 1); }}
              className="flex h-7 w-7 items-center justify-center rounded text-sm font-medium text-text-secondary hover:bg-surface-hover"
              aria-label="Aumentar cantidad"
            >
              +
            </button>
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-text-primary">{line.name}</p>
            <p className="text-xs text-text-muted">{line.sku}</p>
          </div>

          <div className="text-right text-sm tabular-nums text-text-secondary">
            ${formatMoney(line.price)}
          </div>
          <div className="text-right text-sm font-semibold tabular-nums text-text-primary">
            ${formatMoney(line.subtotal)}
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); removeLine(line.id); }}
            className="flex h-7 w-7 items-center justify-center rounded text-text-muted hover:bg-error/10 hover:text-error"
            aria-label="Eliminar"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
