import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { usePOSStore, type ProductSearchResult } from '@/modules/sales/store/pos-store';
import { ProductSearch } from '@/modules/sales/components/ProductSearch';
import { CartView } from '@/modules/sales/components/CartView';
import { PaymentSelector } from '@/modules/sales/components/PaymentSelector';
import { offlineQueue } from '@/modules/sales/services/offline-queue';

export function POSTerminalView() {
  const { t } = useTranslation();
  const { addItem, clearCart, isBlockedByAudit, isOffline, items, paymentMethod, setSearchFocused } = usePOSStore();
  const [showPayment, setShowPayment] = useState(false);

  const handleSelectProduct = useCallback(
    (product: ProductSearchResult) => {
      addItem(product);
    },
    [addItem],
  );

  const handleConfirmPayment = useCallback(async () => {
    const tx = {
      id: crypto.randomUUID(),
      tenantId: 'tenant-id',
      branchId: 'branch-id',
      items: usePOSStore.getState().items.map((i) => ({
        id: i.id,
        productId: i.productId,
        productName: i.productName,
        sku: i.sku,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        subtotal: i.subtotal,
      })),
      total: usePOSStore.getState().total,
      paymentMethod: paymentMethod || 'cash',
      createdAt: new Date().toISOString(),
      syncedAt: null,
      retryCount: 0,
    };

    if (isOffline) {
      await offlineQueue.save(tx);
    }

    clearCart();
    setShowPayment(false);
  }, [paymentMethod, isOffline, clearCart]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F8') {
        e.preventDefault();
        if (items.length > 0 && !isBlockedByAudit) {
          setShowPayment(true);
        }
      }
      if (e.key === 'F10') {
        e.preventDefault();
        if (paymentMethod && items.length > 0 && !isBlockedByAudit) {
          handleConfirmPayment();
        }
      }
      if (e.key === 'Escape') {
        setShowPayment(false);
      }
      if (e.key === '/' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setSearchFocused(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [items.length, paymentMethod, isBlockedByAudit, handleConfirmPayment, setSearchFocused]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-text-primary">{t('sales.pos.terminal')}</h1>
          {isOffline && (
            <span className="rounded bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">
              {t('sales.pos.offline')}
            </span>
          )}
          {isBlockedByAudit && (
            <span className="rounded bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400">
              {t('sales.pos.blocked')}
            </span>
          )}
        </div>
        <span className="text-xs text-text-secondary">{t('sales.pos.shortcutHint')}</span>
      </div>

      {isBlockedByAudit ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <svg className="mx-auto h-16 w-16 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m0 0v2m0-2h2m-2 0H10m9-7a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="mt-3 text-lg font-medium text-text-primary">{t('sales.pos.blocked')}</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 gap-4 p-4">
          <div className="flex w-2/5 flex-col gap-4">
            <ProductSearch onSelect={handleSelectProduct} />
          </div>
          <div className="flex flex-1 flex-col rounded-xl border border-border bg-surface">
            <CartView />
          </div>
        </div>
      )}

      {showPayment && !isBlockedByAudit && (
        <PaymentSelector
          onConfirm={handleConfirmPayment}
          onClose={() => setShowPayment(false)}
        />
      )}
    </div>
  );
}
