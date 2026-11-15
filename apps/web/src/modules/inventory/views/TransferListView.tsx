import { useState } from 'react';
import { Plus } from 'lucide-react';
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
import { useInventoryProducts } from '@/modules/inventory/hooks/useInventoryList';
import { VirtualGrid, type GridColumn } from '@/core/components/VirtualGrid';
import { ListPage } from '@/core/components/ListPage';
import { ListPagination } from '@/core/components/ListPagination';
import { usePagination } from '@/shared/hooks/usePagination';
import { Modal } from '@/core/components/Modal';
import { toastService } from '@/core/services/toast-service';

const inputClass =
  'w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none';

export function TransferListView() {
  const { t, locale } = useTranslation();
  const { data: transfers, isLoading, refetch, isFetching } = useTransfers();
  const createMutation = useCreateTransfer();
  const completeMutation = useCompleteTransfer();
  const cancelMutation = useCancelTransfer();
  const { data: warehouses } = useWarehouses();
  useInventoryList();
  const { data: products = [] } = useInventoryProducts();
  const [showForm, setShowForm] = useState(false);
  const [productId, setProductId] = useState('');
  const [fromWarehouseId, setFromWarehouseId] = useState('');
  const [toWarehouseId, setToWarehouseId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [formError, setFormError] = useState('');
  const [confirm, setConfirm] = useState<{
    action: 'complete' | 'cancel';
    transfer: StockTransfer;
  } | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !fromWarehouseId || !toWarehouseId) return;
    if (fromWarehouseId === toWarehouseId) {
      setFormError(t('inventory.transfer.sameWarehouse'));
      return;
    }
    const parsedQuantity = Number(quantity);
    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      setFormError(t('inventory.transfer.invalidQuantity'));
      return;
    }
    setFormError('');
    try {
      await createMutation.mutateAsync({
        productId,
        fromWarehouseId,
        toWarehouseId,
        quantity: parsedQuantity,
      });
      toastService.success(
        t('inventory.transfer.createdSuccessTitle'),
        t('inventory.transfer.createdSuccessBody'),
      );
      setProductId('');
      setFromWarehouseId('');
      setToWarehouseId('');
      setQuantity('1');
      setShowForm(false);
    } catch {
      toastService.error(
        t('inventory.transfer.createErrorTitle'),
        t('inventory.transfer.createErrorBody'),
      );
    }
  };

  const handleConfirm = async () => {
    if (!confirm) return;
    const { action, transfer } = confirm;
    if (action === 'complete') {
      try {
        await completeMutation.mutateAsync(transfer.id);
        toastService.success(
          t('inventory.transfer.completeSuccessTitle'),
          t('inventory.transfer.completeSuccessBody'),
        );
        setConfirm(null);
      } catch {
        toastService.error(
          t('inventory.transfer.completeErrorTitle'),
          t('inventory.transfer.completeErrorBody'),
        );
      }
    } else {
      try {
        await cancelMutation.mutateAsync(transfer.id);
        toastService.success(t('inventory.transfer.cancelSuccessTitle'), '');
        setConfirm(null);
      } catch {
        toastService.error(t('inventory.transfer.cancelErrorTitle'), t('common.saveUnconfirmed'));
      }
    }
  };

  const warehouseName = (warehouseId: unknown) =>
    warehouses?.find((warehouse) => warehouse.id === warehouseId)?.name ??
    String(warehouseId ?? '');
  const productName = (productId: unknown) =>
    products.find((product) => product.id === productId)?.name ?? String(productId ?? '');

  const statusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return t('inventory.transfer.status.pending');
      case 'processing':
        return t('inventory.transfer.status.processing');
      case 'completed':
        return t('inventory.transfer.status.completed');
      case 'cancelled':
        return t('inventory.transfer.status.cancelled');
      default:
        return status;
    }
  };

  const pagination = usePagination(transfers ?? []);

  const columns: GridColumn<StockTransfer>[] = [
    {
      key: 'productId',
      label: t('inventory.transfer.product'),
      sortable: true,
      render: (value) => productName(value),
    },
    {
      key: 'fromWarehouseId',
      label: t('inventory.transfer.from'),
      render: (value) => warehouseName(value),
    },
    {
      key: 'toWarehouseId',
      label: t('inventory.transfer.to'),
      render: (value) => warehouseName(value),
    },
    {
      key: 'quantity',
      label: t('inventory.transfer.quantity'),
      width: 90,
      align: 'right',
      render: (value) => (
        <span className="font-mono tabular-nums">{Number(value).toLocaleString(locale)}</span>
      ),
    },
    {
      key: 'status',
      label: t('inventory.transfer.statusLabel'),
      width: 110,
      render: (value) => {
        const status = String(value);
        const classes =
          status === 'completed'
            ? 'bg-success/10 text-success'
            : status === 'cancelled'
              ? 'bg-error/10 text-error'
              : status === 'processing'
                ? 'bg-info/10 text-info'
                : 'bg-warning/10 text-warning';
        return (
          <span className={`rounded-full px-2 py-1 text-xs font-medium ${classes}`}>
            {statusLabel(status)}
          </span>
        );
      },
    },
    {
      key: 'createdAt',
      label: t('inventory.stockView.date'),
      width: 130,
      render: (v) => new Date(v as string).toLocaleDateString(locale),
    },
    {
      key: 'actions',
      label: t('common.actions'),
      width: 220,
      align: 'center',
      render: (_value, transfer) =>
        transfer.status === 'pending' ? (
          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setConfirm({ action: 'complete', transfer });
              }}
              disabled={completeMutation.isPending}
              className="rounded-lg bg-accent px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
            >
              {t('inventory.transfer.complete')}
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setConfirm({ action: 'cancel', transfer });
              }}
              disabled={cancelMutation.isPending}
              className="rounded-lg border border-border px-3 py-1 text-xs text-text-secondary hover:text-error disabled:opacity-50"
            >
              {t('inventory.transfer.cancelAction')}
            </button>
          </div>
        ) : (
          <span className="text-xs text-text-secondary">—</span>
        ),
    },
  ];

  return (
    <ListPage
      title={t('inventory.transfer.title')}
      subtitle={t('inventory.transfer.subtitle')}
      onRefresh={refetch}
      refreshing={isFetching}
      pagination={
        <ListPagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={pagination.total}
          totalPages={pagination.totalPages}
          onPageChange={pagination.setPage}
          onPageSizeChange={pagination.setPageSize}
        />
      }
      actions={
        <button
          onClick={() => setShowForm(!showForm)}
          aria-expanded={showForm}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover"
        >
          <Plus size={14} aria-hidden="true" />
          {t('inventory.transfer.create')}
        </button>
      }
    >
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-4 grid shrink-0 grid-cols-1 items-end gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-5"
        >
          <div className="sm:col-span-2 lg:col-span-1">
            <label htmlFor="transfer-product" className="mb-1 block text-xs text-text-secondary">
              {t('inventory.transfer.product')}
            </label>
            <select
              id="transfer-product"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              required
              className={inputClass}
            >
              <option value="">{t('inventory.transfer.selectProduct')}</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.sku} — {product.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="transfer-from" className="mb-1 block text-xs text-text-secondary">
              {t('inventory.transfer.from')}
            </label>
            <select
              id="transfer-from"
              value={fromWarehouseId}
              onChange={(e) => {
                setFromWarehouseId(e.target.value);
                if (e.target.value && e.target.value === toWarehouseId) setToWarehouseId('');
                setFormError('');
              }}
              required
              className={inputClass}
            >
              <option value="">{t('inventory.transfer.selectOrigin')}</option>
              {(warehouses ?? [])
                .filter((warehouse) => warehouse.id !== toWarehouseId)
                .map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label htmlFor="transfer-to" className="mb-1 block text-xs text-text-secondary">
              {t('inventory.transfer.to')}
            </label>
            <select
              id="transfer-to"
              value={toWarehouseId}
              onChange={(e) => {
                setToWarehouseId(e.target.value);
                if (e.target.value && e.target.value === fromWarehouseId) setFromWarehouseId('');
                setFormError('');
              }}
              required
              className={inputClass}
            >
              <option value="">{t('inventory.transfer.selectDestination')}</option>
              {(warehouses ?? [])
                .filter((warehouse) => warehouse.id !== fromWarehouseId)
                .map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label htmlFor="transfer-quantity" className="mb-1 block text-xs text-text-secondary">
              {t('inventory.transfer.quantity')}
            </label>
            <input
              id="transfer-quantity"
              type="number"
              min="0.01"
              step="0.01"
              required
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value);
                setFormError('');
              }}
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
          >
            {t('common.create')}
          </button>
          {formError && (
            <p role="alert" className="text-sm text-error sm:col-span-2 lg:col-span-5">
              {formError}
            </p>
          )}
        </form>
      )}

      <VirtualGrid
        data={pagination.pageItems}
        columns={columns}
        loading={isLoading}
        emptyMessage={t('inventory.transfer.empty')}
        emptyActionLabel={t('inventory.transfer.create')}
        emptyAction={() => setShowForm(true)}
      />

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={
          confirm?.action === 'complete'
            ? t('inventory.transfer.completeTitle')
            : t('inventory.transfer.cancelTitle')
        }
        size="sm"
      >
        <p className="text-sm text-text-secondary">
          {confirm?.action === 'complete'
            ? t('inventory.transfer.completeConfirm')
                .replace('{quantity}', String(confirm.transfer.quantity))
                .replace('{product}', productName(confirm.transfer.productId))
            : t('inventory.transfer.cancelConfirm')}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setConfirm(null)}
            className="rounded-lg px-3 py-2 text-xs text-text-secondary hover:text-text-primary"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={completeMutation.isPending || cancelMutation.isPending}
            className={`rounded-lg px-3 py-2 text-xs font-semibold text-white disabled:opacity-50 ${
              confirm?.action === 'complete' ? 'bg-accent hover:bg-accent-hover' : 'bg-error'
            }`}
          >
            {confirm?.action === 'complete'
              ? t('inventory.transfer.complete')
              : t('inventory.transfer.cancelAction')}
          </button>
        </div>
      </Modal>
    </ListPage>
  );
}
