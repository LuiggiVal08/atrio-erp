import { useState } from 'react';
import { DocumentStateBadge } from '@/core/components/DocumentStateBadge';
import { DocumentTimeline } from '@/core/components/DocumentTimeline';
import type { DocumentAction } from '@/core/components/DocumentStateBadge';
import type { TimelineEntry } from '@/core/components/DocumentTimeline';
import type { DocumentStatus } from '@/core/components/DocumentStateBadge';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { useKeyboardNav } from '@/core/hooks/useKeyboardNav';

interface InventoryFormData {
  productId: string;
  quantity: number;
  reason: string;
}

export function InventoryFormView() {
  const { t } = useTranslation();
  const { handleKeyDown } = useKeyboardNav({ backRoute: '/inventory' });
  const [status, setStatus] = useState<DocumentStatus>('draft');
  const [timeline, setTimeline] = useState<TimelineEntry[]>([
    { fromStatus: null, toStatus: 'draft', timestamp: new Date().toISOString(), userId: '1', userName: 'Current User' },
  ]);
  const [form, setForm] = useState<InventoryFormData>({ productId: '', quantity: 0, reason: '' });

  const handleAction = (action: DocumentAction) => {
    if (action.type === 'approve') {
      setStatus('approved');
      setTimeline((prev) => [
        ...prev,
        { fromStatus: 'draft', toStatus: 'approved', timestamp: new Date().toISOString(), userId: '1', userName: 'Current User' },
      ]);
    }
    if (action.type === 'cancel') {
      setStatus('cancelled');
      setTimeline((prev) => [
        ...prev,
        { fromStatus: status as DocumentStatus, toStatus: 'cancelled', timestamp: new Date().toISOString(), userId: '1', userName: 'Current User', reason: form.reason || 'Manual cancellation' },
      ]);
    }
  };

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col" onKeyDown={handleKeyDown}>
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <h1 className="text-lg font-bold text-text-primary">{t('inventory.product.edit')}</h1>
        <DocumentStateBadge
          status={status}
          allowedActions={[
            { type: 'approve', label: t('document.actions.approve'), requiresConfirmation: false },
            { type: 'cancel', label: t('document.actions.cancel'), requiresConfirmation: true },
          ]}
          onAction={handleAction}
          size="lg"
        />
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-4 rounded-lg border border-border bg-surface p-6">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary">{t('inventory.product.sku')}</label>
          <input
            className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none"
            value={form.productId}
            onChange={(e) => setForm({ ...form, productId: e.target.value })}
            placeholder="SKU-001"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary">{t('inventory.stock')}</label>
          <input
            type="number"
            className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
            value={form.quantity || ''}
            onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary">{t('common.save')}</label>
          <textarea
            className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            rows={3}
          />
        </div>
      </div>

      <div className="mt-6">
        <DocumentTimeline entries={timeline} />
      </div>
      </div>
    </div>
  );
}
