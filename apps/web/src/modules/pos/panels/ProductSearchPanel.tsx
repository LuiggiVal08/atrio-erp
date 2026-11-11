import { forwardRef, useEffect, useRef } from 'react';
import { usePosStore } from '../store/pos-store';
import { focusManager, FocusTargets } from '../focus/focus-manager';
import { useProductSearch } from '../hooks/usePosSearch';
import { formatMoney } from '../lib/format';

export const ProductSearchPanel = forwardRef<HTMLInputElement>(function ProductSearchPanel(_props, ref) {
  const searchQuery = usePosStore((s) => s.ui.searchQuery);
  const setSearchQuery = usePosStore((s) => s.setSearchQuery);
  const addProduct = usePosStore((s) => s.addProduct);
  const setFocusedZone = usePosStore((s) => s.setFocusedZone);

  const { data: results = [], isLoading } = useProductSearch(searchQuery);
  const selectedRef = useRef<number>(-1);
  const listRef = useRef<HTMLUListElement>(null);
  const addedRef = useRef(false);

  useEffect(() => {
    selectedRef.current = -1;
  }, [results]);

  useEffect(() => {
    if (addedRef.current) {
      addedRef.current = false;
      focusManager.requestFocus(FocusTargets.SEARCH);
      setFocusedZone('search');
    }
  }, [searchQuery, setFocusedZone]);

  const selectProduct = (product: { id: string; name: string; sku: string; barcode: string; price: number }) => {
    addedRef.current = true;
    addProduct(product);
    setSearchQuery('');
  };

  useEffect(() => {
    if (results.length === 1 && searchQuery.length >= 2) {
      const p = results[0];
      const isExact = p.barcode === searchQuery || p.sku === searchQuery;
      if (isExact) {
        selectProduct(p);
      }
    }
  }, [results, searchQuery]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.min(selectedRef.current + 1, results.length - 1);
      selectedRef.current = next;
      scrollToItem(next);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = Math.max(selectedRef.current - 1, 0);
      selectedRef.current = prev;
      scrollToItem(prev);
      return;
    }
    if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault();
      const idx = selectedRef.current >= 0 ? selectedRef.current : 0;
      const product = results[idx];
      if (product) {
        selectProduct(product);
      }
      return;
    }
  };

  const scrollToItem = (index: number) => {
    const el = listRef.current?.children[index] as HTMLElement;
    el?.scrollIntoView({ block: 'nearest' });
  };

  return (
    <div role="search" aria-label="Buscar producto" className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-border p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
            Producto
          </span>
          <kbd className="rounded border border-border bg-surface-hover px-1.5 py-0.5 font-mono text-[10px] text-text-secondary">
            F2
          </kbd>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border-light bg-surface-hover px-3 focus-within:border-accent focus-within:bg-surface">
          <span aria-hidden className="text-text-muted">🔍</span>
          <input
            ref={ref}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar producto (F2)..."
            className="flex-1 bg-transparent py-2.5 text-base text-text-primary outline-none placeholder:text-text-muted"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-text-muted hover:text-text-secondary"
              aria-label="Limpiar búsqueda"
            >
              ✕
            </button>
          )}
        </div>
        <p className="mt-2 text-xs text-text-muted">
          Escanea un código o escribe nombre / SKU y presiona Enter.
        </p>
      </div>

      {searchQuery && isLoading && (
        <div className="flex items-center gap-2 px-4 py-3 text-sm text-text-muted">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          Buscando...
        </div>
      )}

      {searchQuery && !isLoading && results.length > 0 && (
        <ul ref={listRef} className="min-h-0 flex-1 overflow-y-auto py-1">
          {results.map((p, idx) => (
            <li
              key={p.id}
              onClick={() => selectProduct(p)}
              onMouseEnter={() => { selectedRef.current = idx; }}
              className={`flex cursor-pointer items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-accent-alpha ${
                idx === selectedRef.current ? 'bg-accent-alpha' : ''
              }`}
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-text-primary">{p.name}</p>
                <p className="text-xs text-text-muted">{p.sku}</p>
              </div>
              <span className="shrink-0 font-semibold tabular-nums text-accent">
                ${formatMoney(p.price)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {searchQuery && !isLoading && results.length === 0 && (
        <div className="px-4 py-3 text-sm text-text-muted">
          Producto no encontrado. Verifica el código o nombre.
        </div>
      )}

      {!searchQuery && (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
          <span aria-hidden className="text-3xl">⌨️</span>
          <p className="text-sm text-text-muted">
            El cursor vive aquí. Busca y agrega productos sin tocar el mouse.
          </p>
        </div>
      )}
    </div>
  );
});
