import { useLowStock } from '../hooks/useDashboard';

export function LowStockTable() {
  const { data, isLoading } = useLowStock();

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-text-secondary">
        No hay productos con stock bajo
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs font-medium text-text-secondary">
            <th className="pb-2 pr-4">Producto</th>
            <th className="pb-2 pr-4">SKU</th>
            <th className="pb-2 pr-4">Almacén</th>
            <th className="pb-2 text-right">Stock</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, i) => (
            <tr
              key={`${item.sku}-${item.warehouse}-${i}`}
              className="border-b border-border/50 text-text-primary transition-colors hover:bg-surface-hover"
            >
              <td className="py-2 pr-4 font-medium">{item.product}</td>
              <td className="py-2 pr-4 text-text-secondary">{item.sku}</td>
              <td className="py-2 pr-4 text-text-secondary">{item.warehouse}</td>
              <td className={`py-2 text-right font-medium ${item.quantity <= 3 ? 'text-error' : 'text-warning'}`}>
                {item.quantity}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
