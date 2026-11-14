import { memo } from 'react';
import type { InventoryProduct } from '../store/inventory-store';
import { DocumentStateBadge } from '@/core/components/DocumentStateBadge';
import type { DocumentAction } from '@/core/components/DocumentStateBadge';

interface KardexRowProps {
  product: InventoryProduct;
  onApprove?: (id: string) => void;
  onCancel?: (id: string) => void;
}

export const KardexRow = memo(function KardexRow({ product, onApprove, onCancel }: KardexRowProps) {
  const handleAction = (action: DocumentAction) => {
    if (action.type === 'approve') onApprove?.(product.id);
    if (action.type === 'cancel') onCancel?.(product.id);
  };

  return (
    <div className="flex items-center gap-4 px-4 py-2 text-sm">
      <div className="w-24 font-mono text-[12px] text-text-secondary">{product.sku}</div>
      <div className="flex-1 text-text-primary font-medium">{product.name}</div>
      <div className="w-24 text-right text-text-secondary">{product.category}</div>
      <div className="w-20 text-right font-mono text-text-primary">{product.stock}</div>
      <div className="w-24 text-right font-mono text-text-secondary">
        ${product.averageCost.toFixed(2)}
      </div>
      <div className="w-24 text-right font-mono text-text-primary">
        ${product.unitPrice.toFixed(2)}
      </div>
      <div className="w-32">
        <DocumentStateBadge
          status={product.status}
          size="sm"
          allowedActions={[
            ...(product.status === 'draft' ? [{ type: 'approve' as const, label: 'Aprobar', requiresConfirmation: false }] : []),
            ...(product.status !== 'cancelled' ? [{ type: 'cancel' as const, label: 'Anular', requiresConfirmation: true }] : []),
          ]}
          onAction={handleAction}
        />
      </div>
    </div>
  );
});
