import { useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import { Trash2 } from 'lucide-react';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { VirtualGrid, type GridColumn } from '@/core/components/VirtualGrid';
import { ListPage } from '@/core/components/ListPage';
import { ListPagination } from '@/core/components/ListPagination';
import { usePagination } from '@/shared/hooks/usePagination';
import { Modal } from '@/core/components/Modal';
import { toastService } from '@/core/services/toast-service';
import { useInventoryProducts } from '../hooks/useInventoryList';
import { useWarehouses } from '../hooks/useWarehouses';
import {
  useDeleteReorderPoint,
  useLowStock,
  useReorderPoints,
  useSetReorderPoint,
  type ReorderPoint,
} from '../hooks/useReorderPoints';

const inputClass =
  'w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none';

export function ReorderPointListView() {
  const { t } = useTranslation();
  const { data: products = [] } = useInventoryProducts();
  const { data: warehouses } = useWarehouses();
  const { data: reorderPoints = [], isLoading, refetch, isFetching } = useReorderPoints();
  const { data: lowStock = [] } = useLowStock();
  const setReorderPoint = useSetReorderPoint();
  const deleteReorderPoint = useDeleteReorderPoint();

  const [showForm, setShowForm] = useState(false);
  const [productId, setProductId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [minQuantity, setMinQuantity] = useState('0');
  const [maxQuantity, setMaxQuantity] = useState('');

  const productMap = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );
  const warehouseMap = useMemo(
    () => new Map((warehouses ?? []).map((warehouse) => [warehouse.id, warehouse])),
    [warehouses],
  );

  const resetForm = () => {
    setProductId('');
    setWarehouseId('');
    setMinQuantity('0');
    setMaxQuantity('');
  };

  const handleCreate = async () => {
    if (!productId || !warehouseId || !maxQuantity || setReorderPoint.isPending) return;
    try {
      await setReorderPoint.mutateAsync({
        productId,
        warehouseId,
        minQuantity: Number(minQuantity) || 0,
        maxQuantity: Number(maxQuantity),
      });
      toastService.success(
        t('inventory.reorderPoint.createSuccessTitle'),
        t('inventory.reorderPoint.createSuccessBody'),
      );
      resetForm();
      setShowForm(false);
    } catch (error) {
      const serverMessage = isAxiosError(error) ? error.response?.data?.message : undefined;
      const message = Array.isArray(serverMessage)
        ? serverMessage.join(' ')
        : typeof serverMessage === 'string'
          ? serverMessage
          : t('inventory.reorderPoint.createErrorBody');
      toastService.error(t('inventory.reorderPoint.createErrorTitle'), message);
    }
  };

  const handleDelete = async (point: ReorderPoint) => {
    const product = productMap.get(point.productId);
    const warehouse = warehouseMap.get(point.warehouseId);
    const confirmed = window.confirm(
      t('inventory.reorderPoint.deleteConfirm')
        .replace('{product}', product?.name ?? point.productId)
        .replace('{warehouse}', warehouse?.name ?? point.warehouseId),
    );
    if (!confirmed) return;
    try {
      await deleteReorderPoint.mutateAsync(point.id);
      toastService.success(t('inventory.reorderPoint.deleteSuccessTitle'), '');
    } catch {
      toastService.error(t('inventory.reorderPoint.deleteErrorTitle'), t('common.saveUnconfirmed'));
    }
  };

  const pagination = usePagination(reorderPoints);

  const columns: GridColumn<ReorderPoint>[] = [
    {
      key: 'productId',
      label: t('inventory.reorderPoint.product'),
      sortable: true,
      render: (_v, row) => {
        const product = productMap.get(row.productId);
        return (
          <div>
            <div className="font-medium text-text-primary">{product?.name ?? row.productId}</div>
            {product?.sku && <div className="text-xs text-text-secondary">{product.sku}</div>}
          </div>
        );
      },
    },
    {
      key: 'warehouseId',
      label: t('inventory.reorderPoint.warehouse'),
      render: (_v, row) => warehouseMap.get(row.warehouseId)?.name ?? row.warehouseId,
    },
    {
      key: 'minQuantity',
      label: t('inventory.reorderPoint.minimum'),
      width: 100,
      align: 'right',
      sortable: true,
    },
    {
      key: 'maxQuantity',
      label: t('inventory.reorderPoint.maximum'),
      width: 100,
      align: 'right',
      sortable: true,
    },
    {
      key: 'createdAt',
      label: t('inventory.reorderPoint.createdAt'),
      width: 130,
      render: (v) => new Date(v as string).toLocaleDateString(),
    },
    {
      key: 'actions',
      label: '',
      width: 60,
      align: 'right',
      render: (_v, row) => (
        <button
          type="button"
          onClick={() => void handleDelete(row)}
          aria-label={t('inventory.reorderPoint.delete')}
          className="rounded-md p-1.5 text-text-secondary hover:bg-error/10 hover:text-error"
        >
          <Trash2 size={14} aria-hidden="true" />
        </button>
      ),
    },
  ];

  const noOptions = !products.length || !(warehouses ?? []).length;

  return (
    <>
      <ListPage
        title={t('inventory.reorderPoints')}
        subtitle={t('inventory.reorderPoint.subtitle')}
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
          <>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                lowStock.length ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
              }`}
            >
              {lowStock.length
                ? t('inventory.reorderPoint.lowStock').replace('{count}', String(lowStock.length))
                : t('inventory.reorderPoint.lowStockNone')}
            </span>
            <button
              onClick={() => setShowForm(true)}
              disabled={noOptions}
              className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              + {t('inventory.reorderPoint.create')}
            </button>
          </>
        }
      >
        <VirtualGrid
          data={pagination.pageItems}
          columns={columns}
          loading={isLoading}
          emptyMessage={t('inventory.reorderPoint.empty')}
          emptyActionLabel={noOptions ? undefined : t('inventory.reorderPoint.create')}
          emptyAction={noOptions ? undefined : () => setShowForm(true)}
        />
      </ListPage>

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={t('inventory.reorderPoint.create')}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleCreate();
          }}
          className="space-y-4"
        >
          <div>
            <label
              htmlFor="reorder-product"
              className="mb-1 block text-xs font-medium text-text-secondary"
            >
              {t('inventory.reorderPoint.product')}
            </label>
            <select
              id="reorder-product"
              value={productId}
              onChange={(event) => setProductId(event.target.value)}
              required
              className={inputClass}
            >
              <option value="">-- {t('common.select')} --</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.sku} · {product.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="reorder-warehouse"
              className="mb-1 block text-xs font-medium text-text-secondary"
            >
              {t('inventory.reorderPoint.warehouse')}
            </label>
            <select
              id="reorder-warehouse"
              value={warehouseId}
              onChange={(event) => setWarehouseId(event.target.value)}
              required
              className={inputClass}
            >
              <option value="">-- {t('common.select')} --</option>
              {(warehouses ?? []).map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="reorder-min"
                className="mb-1 block text-xs font-medium text-text-secondary"
              >
                {t('inventory.reorderPoint.minimum')}
              </label>
              <input
                id="reorder-min"
                type="number"
                min="0"
                step="0.01"
                value={minQuantity}
                onChange={(event) => setMinQuantity(event.target.value)}
                className={inputClass}
              />
              <p className="mt-1 text-[11px] text-text-muted">
                {t('inventory.reorderPoint.minHint')}
              </p>
            </div>
            <div>
              <label
                htmlFor="reorder-max"
                className="mb-1 block text-xs font-medium text-text-secondary"
              >
                {t('inventory.reorderPoint.maximum')}
              </label>
              <input
                id="reorder-max"
                type="number"
                min="0"
                step="0.01"
                required
                value={maxQuantity}
                onChange={(event) => setMaxQuantity(event.target.value)}
                className={inputClass}
              />
              <p className="mt-1 text-[11px] text-text-muted">
                {t('inventory.reorderPoint.maxHint')}
              </p>
            </div>
          </div>
          {setReorderPoint.isError && (
            <p role="alert" className="text-sm text-error">
              {t('inventory.reorderPoint.createErrorBody')}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={setReorderPoint.isPending}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
            >
              {t('inventory.reorderPoint.save')}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
