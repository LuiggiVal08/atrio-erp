import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { usePOSStore, type ProductSearchResult } from '@/modules/sales/store/pos-store';
import { ProductSearch } from '@/modules/sales/components/ProductSearch';
import { CartView } from '@/modules/sales/components/CartView';
import { PaymentSelector } from '@/modules/sales/components/PaymentSelector';
import { offlineQueue } from '@/modules/sales/services/offline-queue';
import { useCurrentSession } from '@/modules/sales/hooks/usePosSessions';
import { useQuickSale } from '@/modules/sales/hooks/useQuickSale';
import { useCashRegisters } from '@/modules/cash/hooks/useCashRegisters';
import { useNavigate } from 'react-router-dom';

export function POSTerminalView() {
  const { t } = useTranslation();
  const { addItem, clearCart, isBlockedByAudit, isOffline, items, paymentMethod, setSearchFocused } = usePOSStore();
  const [showPayment, setShowPayment] = useState(false);
  const [selectedRegister, setSelectedRegister] = useState<string>('');
  const [warehouseId] = useState('default-warehouse');
  const [clientId] = useState('default-client');

  const navigate = useNavigate();
  const { data: currentSession } = useCurrentSession(selectedRegister || null);
  const quickSaleMutation = useQuickSale();
  const { data: registers = [] } = useCashRegisters();

  const handleSelectProduct = useCallback(
    (product: ProductSearchResult) => {
      addItem(product);
    },
    [addItem],
  );

  const handleConfirmPayment = useCallback(async () => {
    if (!selectedRegister) return;
    const paymentAllocations = usePOSStore.getState().paymentAllocations;

    const saleItems = usePOSStore.getState().items.map((i) => ({
      productId: i.productId,
      warehouseId,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
    }));

    const tx = {
      id: crypto.randomUUID(),
      tenantId: 'tenant-id',
      branchId: 'branch-id',
      items: usePOSStore.getState().items.map((i) => ({ ...i })),
      total: usePOSStore.getState().total,
      paymentMethod: paymentMethod || 'cash',
      paymentAllocations,
      createdAt: new Date().toISOString(),
      syncedAt: null as string | null,
      retryCount: 0,
    };

    if (isOffline) {
      await offlineQueue.save(tx);
    } else {
      try {
        await quickSaleMutation.mutateAsync({
          clientId,
          cashRegisterId: selectedRegister,
          subtotal: usePOSStore.getState().subtotal,
          taxAmount: 0,
          total: usePOSStore.getState().total,
          paymentMethod: paymentMethod || 'cash',
          items: saleItems,
        });
      } catch {
        await offlineQueue.save(tx);
      }
    }

    clearCart();
    setShowPayment(false);
  }, [paymentMethod, isOffline, clearCart, selectedRegister, warehouseId, clientId, quickSaleMutation]);

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
          {currentSession ? (
            <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
              {t('sales.pos.sessionOpen')}
            </span>
          ) : selectedRegister ? (
            <span className="rounded bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">
              {t('sales.pos.noOpenSession')}
            </span>
          ) : null}
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
        <div className="flex items-center gap-2">
          <select
            value={selectedRegister}
            onChange={(e) => setSelectedRegister(e.target.value)}
            className="w-32 rounded border border-border bg-surface px-2 py-1 text-xs text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none"
          >
            <option value="">Caja</option>
            {registers.filter((register) => register.isActive).map((register) => (
              <option key={register.id} value={register.id}>{register.name}</option>
            ))}
          </select>
          {currentSession ? (
            <button
              onClick={() => navigate('/cash')}
              className="rounded border border-border px-2 py-1 text-xs text-text-secondary hover:text-text-primary"
            >
              Arqueo y cierre
            </button>
          ) : (
            <button
              onClick={() => navigate('/cash/registers')}
              className="rounded bg-accent/10 px-2 py-1 text-xs font-medium text-accent hover:bg-accent/20"
            >
              Revisar caja
            </button>
          )}
          <span className="text-xs text-text-secondary">{t('sales.pos.shortcutHint')}</span>
        </div>
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
