import { forwardRef } from 'react';
import { usePosStore } from '../store/pos-store';
import { useCustomerSearch } from '../hooks/usePosSearch';

export const CustomerPanel = forwardRef<HTMLInputElement>(function CustomerPanel(_props, ref) {
  const customer = usePosStore((s) => s.customer);
  const setCustomer = usePosStore((s) => s.setCustomer);
  const customerSearchOpen = usePosStore((s) => s.ui.customerSearchOpen);
  const customerSearchQuery = usePosStore((s) => s.ui.customerSearchQuery);
  const setCustomerSearchOpen = usePosStore((s) => s.setCustomerSearchOpen);
  const setCustomerSearchQuery = usePosStore((s) => s.setCustomerSearchQuery);

  const { data: results = [] } = useCustomerSearch(customerSearchQuery);

  const label = customer ? `${customer.name} (${customer.taxId})` : 'Consumidor Final';

  const handleSelect = (c: { id: string; name: string; taxId: string }) => {
    setCustomer(c);
    setCustomerSearchOpen(false);
    setCustomerSearchQuery('');
  };

  const handleClear = () => {
    setCustomer(null);
    setCustomerSearchOpen(false);
    setCustomerSearchQuery('');
  };

  return (
    <div role="region" aria-label="Cliente" className="relative">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-text-secondary">Cliente:</span>
        <button
          onClick={() => setCustomerSearchOpen(!customerSearchOpen)}
          className="text-sm text-text-primary hover:text-accent"
        >
          {label}
        </button>
        {customer && (
          <button onClick={handleClear} className="text-xs text-text-muted hover:text-text-secondary">
            ✕
          </button>
        )}
      </div>

      {customerSearchOpen && (
        <div className="absolute bottom-full left-0 z-10 mb-1 w-72 rounded border border-border bg-surface shadow-sm">
          <div className="p-2">
            <input
              ref={ref}
              type="text"
              value={customerSearchQuery}
              onChange={(e) => setCustomerSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && results.length > 0) {
                  e.preventDefault();
                  handleSelect(results[0]);
                }
              }}
              placeholder="Buscar cliente (RIF, nombre, teléfono)..."
              className="w-full rounded border border-border-light px-2 py-1.5 text-sm outline-none focus:border-accent"
            />
          </div>
          <ul className="max-h-40 overflow-y-auto">
            <li
              onClick={handleClear}
              className={`cursor-pointer px-3 py-2 text-sm hover:bg-accent-alpha ${
                !customer ? 'font-medium text-accent' : 'text-text-secondary'
              }`}
            >
              {!customer && '✓ '}Consumidor Final
            </li>
            {results.map((c) => (
              <li
                key={c.id}
                onClick={() => handleSelect(c)}
                className="cursor-pointer px-3 py-2 text-sm text-text-primary hover:bg-accent-alpha"
              >
                {c.name} <span className="text-xs text-text-muted">({c.taxId})</span>
              </li>
            ))}
            {customerSearchQuery && results.length === 0 && (
              <li className="px-3 py-2 text-sm text-text-muted">
                Cliente no encontrado
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
});
