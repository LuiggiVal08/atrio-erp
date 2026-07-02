import { useTranslation } from '@/shared/hooks/useTranslation';
import { usePOSStore } from '@/modules/sales/store/pos-store';
import { DocumentStateBadge } from '@/core/components/DocumentStateBadge';

export function CartView() {
  const { t } = useTranslation();
  const { items, total, discountTotal, removeItem, updateQuantity } = usePOSStore();

  if (items.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m-10 0a2 2 0 100 4 2 2 0 000-4zm10 0a2 2 0 100 4 2 2 0 000-4z" />
          </svg>
          <p className="mt-2 text-sm text-text-secondary">{t('sales.pos.emptyCart')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wider text-text-secondary">
              <th className="px-3 py-2 text-left font-medium">{t('sales.pos.quantity')}</th>
              <th className="px-3 py-2 text-left font-medium">{t('inventory.product.name')}</th>
              <th className="px-3 py-2 text-right font-medium">{t('sales.pos.price')}</th>
              <th className="px-3 py-2 text-right font-medium">{t('sales.pos.subtotal')}</th>
              <th className="w-10 px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-border hover:bg-surface-hover">
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.id, Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 rounded border border-border bg-surface px-2 py-1 text-center text-sm text-text-primary focus:border-accent focus:outline-none"
                  />
                </td>
                <td className="px-3 py-2">
                  <p className="text-sm font-medium text-text-primary">{item.productName}</p>
                  <p className="text-xs text-text-secondary">{item.sku}</p>
                </td>
                <td className="px-3 py-2 text-right text-sm text-text-primary">
                  {item.unitPrice.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-3 py-2 text-right text-sm font-medium text-text-primary">
                  {item.subtotal.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-text-secondary hover:text-red-400"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-border bg-surface px-4 py-3">
        {discountTotal > 0 && (
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-text-secondary">{t('sales.pos.discount')}</span>
            <span className="text-red-400">-{discountTotal.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-bold">
          <span className="text-text-primary">{t('sales.pos.total')}</span>
          <span className="text-text-primary">{total.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="mt-3">
          <DocumentStateBadge
            status="draft"
            size="sm"
            allowedActions={[
              { type: 'approve', label: t('document.actions.approve'), shortcut: 'F10', requiresConfirmation: false },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
