import { useState } from 'react';
import { useTranslation } from '@/shared/hooks/useTranslation';
import {
  useTransfers,
  useCreateTransfer,
  useCompleteTransfer,
  useCancelTransfer,
  type StockTransfer,
} from '@/modules/inventory/hooks/useTransfers';
import { useWarehouses } from '@/modules/inventory/hooks/useWarehouses';
import { useInventoryList } from '@/modules/inventory/hooks/useInventoryList';
import { useInventoryStore } from '@/modules/inventory/store/inventory-store';
import { VirtualGrid, type GridColumn } from '@/core/components/VirtualGrid';
import { toastService } from '@/core/services/toast-service';

const inputClass =
  'w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none';

export function TransferListView() {
  const { t } = useTranslation();
  const { data: transfers, isLoading } = useTransfers();
  const createMutation = useCreateTransfer();
  const completeMutation = useCompleteTransfer();
  const cancelMutation = useCancelTransfer();
  const { data: warehouses } = useWarehouses();
  useInventoryList();
  const { products } = useInventoryStore();
  const [showForm, setShowForm] = useState(false);
  const [productId, setProductId] = useState('');
  const [fromWarehouseId, setFromWarehouseId] = useState('');
  const [toWarehouseId, setToWarehouseId] = useState('');
  const [quantity, setQuantity] = useState('1');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !fromWarehouseId || !toWarehouseId) return;
    try {
      await createMutation.mutateAsync({ productId, fromWarehouseId, toWarehouseId, quantity: parseInt(quantity) || 1 });
      toastService.success(
        t('inventory.transfer.createdSuccessTitle'),
        t('inventory.transfer.createdSuccessBody'),
      );
      setProductId(''); setFromWarehouseId(''); setToWarehouseId(''); setQuantity('1');
      setShowForm(false);
    } catch {
      toastService.error(t('inventory.transfer.createErrorTitle'), t('inventory.transfer.createErrorBody'));
    }
  };

  const handleComplete = async (transfer: StockTransfer) => {
    const confirmed = window.confirm(
      t('inventory.transfer.completeConfirm')
        .replace('{quantity}', String(transfer.quantity))
        .replace('{product}', productName(transfer.productId)),
    );
    if (!confirmed) return;
    try {
      await completeMutation.mutateAsync(transfer.id);
      toastService.success(
        t('inventory.transfer.completeSuccessTitle'),
        t('inventory.transfer.completeSuccessBody'),
      );
    } catch {
      toastService.error(t('inventory.transfer.completeErrorTitle'), t('inventory.transfer.completeErrorBody'));
    }
  };

  const handleCancel = async (transfer: StockTransfer) => {
    if (!window.confirm(t('inventory.transfer.cancelConfirm'))) return;
    try {
      await cancelMutation.mutateAsync(transfer.id);
      toastService.success(t('inventory.transfer.cancelSuccessTitle'), '');
    } catch {
      toastService.error(t('inventory.transfer.cancelErrorTitle'), t('common.saveUnconfirmed'));
    }
  };

  const warehouseName = (warehouseId: unknown) =>
    warehouses?.find((warehouse) => warehouse.id === warehouseId)?.name ?? String(warehouseId ?? '');
  const productName = (productId: unknown) =>
    products.find((product) => product.id === productId)?.name ?? String(productId ?? '');

  const statusLabel = (status: string) => {
    switch (status) {
      case 'pending': return t('inventory.transfer.status.pending');
      case 'processing': return t('inventory.transfer.status.processing');
      case 'completed': return t('inventory.transfer.status.completed');
      case 'cancelled': return t('inventory.transfer.status.cancelled');
      default: return status;
    }
  };

  const columns: GridColumn<StockTransfer>[] = [
    { key: 'productId', label: t('inventory.transfer.product'), sortable: true, render: (value) => productName(value) },
    { key: 'fromWarehouseId', label: t('inventory.transfer.from'), render: (value) => warehouseName(value) },
    { key: 'toWarehouseId', label: t('inventory.transfer.to'), render: (value) => warehouseName(value) },
    { key: 'quantity', label: t('inventory.transfer.quantity'), width: 90, align: 'right' },
    { key: 'status', label: t('inventory.transfer.statusLabel'), width: 110, render: (value) => {
      const status = String(value);
      const classes = status === 'completed'
        ? 'bg-success/10 text-success'
        : status === 'cancelled'
          ? 'bg-error/10 text-error'
          : status === 'processing'
            ? 'bg-info/10 text-info'
            : 'bg-warning/10 text-warning';
      return <span className={`rounded-full px-2 py-1 text-xs font-medium ${classes}`}>{statusLabel(status)}</span>;
    } },
    { key: 'createdAt', label: t('inventory.stockView.date'), width: 130,
      render: (v) => new Date(v as string).toLocaleDateString() },
    { key: 'actions', label: t('common.actions'), width: 180, align: 'center', render: (_value, transfer) => (
      transfer.status === 'pending' ? (
        <div className="flex justify-center gap-2">
          <button
            type="button"
            onClick={(event) => { event.stopPropagation(); void handleComplete(transfer); }}
            disabled={completeMutation.isPending}
            className="rounded-lg bg-accent px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
          >
            {t('inventory.transfer.complete')}
          </button>
          <button
            type="button"
            onClick={(event) => { event.stopPropagation(); void handleCancel(transfer); }}
            disabled={cancelMutation.isPending}
            className="rounded-lg border border-border px-3 py-1 text-xs text-text-secondary hover:text-error disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>
        </div>
      ) : <span className="text-xs text-text-secondary">—</span>
    ) },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-3">
        <div>
          <h1 className="text-lg font-bold text-text-primary">{t('inventory.transfer.title')}</h1>
          <p className="mt-0.5 text-xs text-text-secondary">{t('inventory.transfer.subtitle')}</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} aria-expanded={showForm}
          className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover">
          + {t('inventory.transfer.create')}
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-6">
      {showForm && (
        <form onSubmit={handleCreate} className="mb-4 grid grid-cols-1 items-end gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="sm:col-span-2 lg:col-span-1">
            <label htmlFor="transfer-product" className="mb-1 block text-xs text-text-secondary">{t('inventory.transfer.product')}</label>
            <select id="transfer-product" value={productId} onChange={e => setProductId(e.target.value)} required className={inputClass}>
              <option value="">{t('inventory.transfer.selectProduct')}</option>
              {products.map((product) => <option key={product.id} value={product.id}>{product.sku} — {product.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="transfer-from" className="mb-1 block text-xs text-text-secondary">{t('inventory.transfer.from')}</label>
            <select id="transfer-from" value={fromWarehouseId} onChange={e => setFromWarehouseId(e.target.value)} required className={inputClass}>
              <option value="">{t('inventory.transfer.selectOrigin')}</option>
              {(warehouses ?? []).map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="transfer-to" className="mb-1 block text-xs text-text-secondary">{t('inventory.transfer.to')}</label>
            <select id="transfer-to" value={toWarehouseId} onChange={e => setToWarehouseId(e.target.value)} required className={inputClass}>
              <option value="">{t('inventory.transfer.selectDestination')}</option>
              {(warehouses ?? []).map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="transfer-quantity" className="mb-1 block text-xs text-text-secondary">{t('inventory.transfer.quantity')}</label>
            <input id="transfer-quantity" type="number" min={1} value={quantity} onChange={e => setQuantity(e.target.value)} className={inputClass} />
          </div>
          <button type="submit" disabled={createMutation.isPending} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50">{t('common.create')}</button>
        </form>
      )}

      <VirtualGrid
        data={transfers ?? []}
        columns={columns}
        loading={isLoading}
        emptyMessage={t('inventory.transfer.empty')}
        emptyActionLabel={t('inventory.transfer.create')}
        emptyAction={() => setShowForm(true)}
      />
      </div>
    </div>
  );
}
