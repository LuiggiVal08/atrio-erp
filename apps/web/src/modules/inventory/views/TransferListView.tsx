import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { ReadErrorAlert } from '@/core/components/ReadErrorAlert';
import {
  useTransfers,
  useCreateTransfer,
  useDispatchTransfer,
  useReceiveTransfer,
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
  const { data: transfers, isLoading, isError, error, refetch, isFetching } = useTransfers();
  const createMutation = useCreateTransfer();
  const dispatchMutation = useDispatchTransfer();
  const receiveMutation = useReceiveTransfer();
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
    action: 'dispatch' | 'receive' | 'cancel';
    transfer: StockTransfer;
  } | null>(null);
  const [receiveQuantity, setReceiveQuantity] = useState('');
  const [closeShortage, setCloseShortage] = useState(false);
  const [confirmError, setConfirmError] = useState('');

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

  const pendingQuantity = (transfer: StockTransfer) =>
    Number(transfer.quantity) - Number(transfer.receivedQuantity ?? 0) - Number(transfer.shortageQuantity ?? 0);

  const openConfirm = (action: 'dispatch' | 'receive' | 'cancel', transfer: StockTransfer) => {
    setConfirm({ action, transfer });
    setConfirmError('');
    if (action === 'receive') {
      setReceiveQuantity(String(pendingQuantity(transfer)));
      setCloseShortage(false);
    }
  };

  const handleConfirm = async () => {
    if (!confirm) return;
    const { action, transfer } = confirm;
    if (action === 'dispatch') {
      try {
        await dispatchMutation.mutateAsync(transfer.id);
        toastService.success(
          t('inventory.transfer.dispatchSuccessTitle'),
          t('inventory.transfer.dispatchSuccessBody'),
        );
        setConfirm(null);
      } catch {
        toastService.error(
          t('inventory.transfer.dispatchErrorTitle'),
          t('inventory.transfer.dispatchErrorBody'),
        );
      }
      return;
    }
    if (action === 'receive') {
      const pending = pendingQuantity(transfer);
      const parsed = Number(receiveQuantity);
      if (!Number.isFinite(parsed) || parsed < 0 || parsed > pending) {
        setConfirmError(t('inventory.transfer.receiveInvalidQuantity'));
        return;
      }
      if (parsed <= 0 && !closeShortage) {
        setConfirmError(t('inventory.transfer.receivePositiveQuantity'));
        return;
      }
      try {
        await receiveMutation.mutateAsync({
          id: transfer.id,
          quantity: parsed,
          closeShortage: parsed < pending ? closeShortage : undefined,
        });
        toastService.success(
          t('inventory.transfer.receiveSuccessTitle'),
          t('inventory.transfer.receiveSuccessBody'),
        );
        setConfirm(null);
      } catch {
        toastService.error(
          t('inventory.transfer.receiveErrorTitle'),
          t('inventory.transfer.receiveErrorBody'),
        );
      }
      return;
    }
    try {
      await cancelMutation.mutateAsync(transfer.id);
      toastService.success(t('inventory.transfer.cancelSuccessTitle'), '');
      setConfirm(null);
    } catch {
      toastService.error(t('inventory.transfer.cancelErrorTitle'), t('common.saveUnconfirmed'));
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
      case 'in_transit':
        return t('inventory.transfer.status.inTransit');
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
      key: 'receivedQuantity',
      label: t('inventory.transfer.received'),
      width: 90,
      align: 'right',
      render: (value) => (
        <span className="font-mono tabular-nums">{Number(value ?? 0).toLocaleString(locale)}</span>
      ),
    },
    {
      key: 'shortageQuantity',
      label: t('inventory.transfer.shortage'),
      width: 90,
      align: 'right',
      render: (value) => (
        <span className="font-mono tabular-nums text-warning">
          {Number(value ?? 0).toLocaleString(locale)}
        </span>
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
              : status === 'in_transit'
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
      width: 230,
      align: 'center',
      render: (_value, transfer) => {
        if (transfer.status === 'pending') {
          return (
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  openConfirm('dispatch', transfer);
                }}
                disabled={dispatchMutation.isPending}
                className="rounded-lg bg-accent px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
              >
                {t('inventory.transfer.dispatch')}
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  openConfirm('cancel', transfer);
                }}
                disabled={cancelMutation.isPending}
                className="rounded-lg border border-border px-3 py-1 text-xs text-text-secondary hover:text-error disabled:opacity-50"
              >
                {t('inventory.transfer.cancelAction')}
              </button>
            </div>
          );
        }
        if (transfer.status === 'in_transit') {
          return (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                openConfirm('receive', transfer);
              }}
              disabled={receiveMutation.isPending}
              className="rounded-lg bg-accent px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
            >
              {t('inventory.transfer.receive')}
            </button>
          );
        }
        return <span className="text-xs text-text-secondary">—</span>;
      },
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

      {isError && <ReadErrorAlert error={error} onRetry={() => void refetch()} retrying={isFetching} className="mb-3" />}
      {!(isError && (transfers?.length ?? 0) === 0) && (
        <VirtualGrid
          data={pagination.pageItems}
          columns={columns}
          loading={isLoading}
          emptyMessage={t('inventory.transfer.empty')}
          emptyActionLabel={t('inventory.transfer.create')}
          emptyAction={() => setShowForm(true)}
        />
      )}

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={
          confirm?.action === 'dispatch'
            ? t('inventory.transfer.dispatchTitle')
            : confirm?.action === 'receive'
              ? t('inventory.transfer.receiveTitle')
              : t('inventory.transfer.cancelTitle')
        }
        size="sm"
      >
        <p className="text-sm text-text-secondary">
          {confirm?.action === 'dispatch'
            ? t('inventory.transfer.dispatchConfirm')
                .replace('{quantity}', String(confirm.transfer.quantity))
                .replace('{product}', productName(confirm.transfer.productId))
            : confirm?.action === 'receive'
              ? t('inventory.transfer.receiveConfirm')
                  .replace('{quantity}', String(pendingQuantity(confirm.transfer)))
                  .replace('{product}', productName(confirm.transfer.productId))
              : t('inventory.transfer.cancelConfirm')}
        </p>
        {confirm?.action === 'receive' && (
          <div className="mt-4 space-y-3">
            <div>
              <label htmlFor="receive-quantity" className="mb-1 block text-xs text-text-secondary">
                {t('inventory.transfer.receiveQuantity')}
              </label>
              <input
                id="receive-quantity"
                type="number"
                min="0"
                max={pendingQuantity(confirm.transfer)}
                step="0.01"
                value={receiveQuantity}
                onChange={(event) => {
                  setReceiveQuantity(event.target.value);
                  setConfirmError('');
                }}
                className={inputClass}
              />
            </div>
            {Number(receiveQuantity) < pendingQuantity(confirm.transfer) && (
              <label className="flex items-center gap-2 text-xs text-text-secondary">
                <input
                  type="checkbox"
                  checked={closeShortage}
                  onChange={(event) => setCloseShortage(event.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                {t('inventory.transfer.closeShortage')}
              </label>
            )}
            {confirmError && (
              <p role="alert" className="text-xs text-error">
                {confirmError}
              </p>
            )}
          </div>
        )}
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
            disabled={dispatchMutation.isPending || receiveMutation.isPending || cancelMutation.isPending}
            className={`rounded-lg px-3 py-2 text-xs font-semibold text-white disabled:opacity-50 ${
              confirm?.action === 'cancel' ? 'bg-error' : 'bg-accent hover:bg-accent-hover'
            }`}
          >
            {confirm?.action === 'dispatch'
              ? t('inventory.transfer.dispatch')
              : confirm?.action === 'receive'
                ? t('inventory.transfer.receive')
                : t('inventory.transfer.cancelAction')}
          </button>
        </div>
      </Modal>
    </ListPage>
  );
}
