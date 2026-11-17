import { useMemo, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { VirtualGrid, type GridColumn } from '@/core/components/VirtualGrid';
import { ListPage } from '@/core/components/ListPage';
import { ListPagination } from '@/core/components/ListPagination';
import { usePagination } from '@/shared/hooks/usePagination';
import { Modal } from '@/core/components/Modal';
import { toastService } from '@/core/services/toast-service';
import { applyServerErrors, clearServerErrors, FormInput, FormSelect, resolveServerErrorMessage } from '@/shared/form';
import { reorderPointFormSchema, type ReorderPointFormValues } from '@/shared/validation/reorder-point';
import { useInventoryProducts } from '../hooks/useInventoryList';
import { useWarehouses } from '../hooks/useWarehouses';
import {
  useDeleteReorderPoint,
  useLowStock,
  useReorderPoints,
  useSetReorderPoint,
  type ReorderPoint,
} from '../hooks/useReorderPoints';

export function ReorderPointListView() {
  const { t } = useTranslation();
  const { data: products = [] } = useInventoryProducts();
  const { data: warehouses } = useWarehouses();
  const { data: reorderPoints = [], isLoading, refetch, isFetching } = useReorderPoints();
  const { data: lowStock = [], isLoading: lowStockLoading, isError: lowStockError, refetch: refetchLowStock } = useLowStock();
  const setReorderPoint = useSetReorderPoint();
  const deleteReorderPoint = useDeleteReorderPoint();

  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ReorderPoint | null>(null);
  const [serverError, setServerError] = useState('');

  const form = useForm({
    defaultValues: {
      productId: '',
      warehouseId: '',
      minQuantity: '0',
      maxQuantity: '',
    } satisfies ReorderPointFormValues,
    validators: { onSubmit: reorderPointFormSchema },
    onSubmit: async ({ value }) => {
      if (setReorderPoint.isPending) return;
      setServerError('');
      try {
        await setReorderPoint.mutateAsync({
          productId: value.productId,
          warehouseId: value.warehouseId,
          minQuantity: Number(value.minQuantity) || 0,
          maxQuantity: Number(value.maxQuantity),
        });
        toastService.success(
          t('inventory.reorderPoint.createSuccessTitle'),
          t('inventory.reorderPoint.createSuccessBody'),
        );
        clearServerErrors(form);
        form.reset();
        setShowForm(false);
      } catch (error) {
        const result = applyServerErrors(form, error);
        const message = resolveServerErrorMessage(
          result,
          t('inventory.reorderPoint.createErrorBody'),
        );
        setServerError(message);
        toastService.error(
          t('inventory.reorderPoint.createErrorTitle'),
          message || t('inventory.reorderPoint.createErrorBody'),
        );
      }
    },
  });

  const productMap = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );
  const warehouseMap = useMemo(
    () => new Map((warehouses ?? []).map((warehouse) => [warehouse.id, warehouse])),
    [warehouses],
  );

  const openForm = () => {
    setServerError('');
    clearServerErrors(form);
    form.reset();
    setShowForm(true);
  };

  const closeForm = () => {
    setServerError('');
    form.reset();
    setShowForm(false);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteReorderPoint.mutateAsync(deleteTarget.id);
      toastService.success(t('inventory.reorderPoint.deleteSuccessTitle'), '');
      setDeleteTarget(null);
    } catch {
      toastService.error(t('inventory.reorderPoint.deleteErrorTitle'), t('common.saveUnconfirmed'));
      setDeleteTarget(null);
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
      render: (value) => <span className="font-mono tabular-nums">{String(value)}</span>,
    },
    {
      key: 'maxQuantity',
      label: t('inventory.reorderPoint.maximum'),
      width: 100,
      align: 'right',
      sortable: true,
      render: (value) => <span className="font-mono tabular-nums">{String(value)}</span>,
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
          onClick={() => setDeleteTarget(row)}
          aria-label={t('inventory.reorderPoint.delete')}
          className="rounded-md p-1.5 text-text-secondary hover:bg-error/10 hover:text-error"
        >
          <Trash2 size={14} aria-hidden="true" />
        </button>
      ),
    },
  ];

  const noOptions = !products.length || !(warehouses ?? []).length;
  const noOptionsReason = !products.length
    ? t('inventory.reorderPoint.noProducts')
    : !(warehouses ?? []).length
      ? t('inventory.reorderPoint.noWarehouses')
      : undefined;

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
            {lowStockError ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-error/10 px-2.5 py-1 text-xs font-semibold text-error">
                <span>{t('inventory.reorderPoint.lowStockError')}</span>
                <button type="button" onClick={() => void refetchLowStock()} className="underline">
                  {t('common.retry')}
                </button>
              </span>
            ) : (
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  lowStockLoading
                    ? 'bg-surface text-text-secondary'
                    : lowStock.length
                      ? 'bg-warning/10 text-warning'
                      : 'bg-success/10 text-success'
                }`}
              >
                {lowStockLoading
                  ? t('inventory.reorderPoint.lowStockLoading')
                  : lowStock.length
                    ? t('inventory.reorderPoint.lowStock').replace('{count}', String(lowStock.length))
                    : t('inventory.reorderPoint.lowStockNone')}
              </span>
            )}
            <button
              onClick={openForm}
              disabled={noOptions}
              title={noOptionsReason}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={14} aria-hidden="true" />
              {t('inventory.reorderPoint.create')}
            </button>
          </>
        }
      >
        {!!lowStock.length && (
          <section aria-labelledby="low-stock-title" className="mb-4 shrink-0 rounded-xl border border-warning/30 bg-warning/5">
            <div className="flex items-center justify-between border-b border-warning/20 px-4 py-2">
              <h2 id="low-stock-title" className="text-xs font-semibold uppercase tracking-wide text-warning">
                {t('inventory.reorderPoint.lowStockTitle')}
              </h2>
              <span className="text-xs font-medium text-text-secondary">
                {t('inventory.reorderPoint.lowStock')}
              </span>
            </div>
            <ul className="divide-y divide-warning/10">
              {lowStock.map((row) => {
                const product = productMap.get(row.productId);
                const warehouse = warehouseMap.get(row.warehouseId);
                return (
                  <li key={`${row.productId}:${row.warehouseId}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 text-xs">
                    <span className="min-w-0 flex-1 font-medium text-text-primary">
                      {row.productName ?? product?.name ?? row.productId}
                      {row.productSku && <span className="ml-2 font-mono text-text-secondary">{row.productSku}</span>}
                    </span>
                    <span className="text-text-secondary">{row.warehouseName ?? warehouse?.name ?? row.warehouseId}</span>
                    <span className="tabular-nums text-text-secondary">
                      {t('inventory.reorderPoint.lowStockCurrent')}: <strong className="text-text-primary">{row.currentQuantity}</strong>
                    </span>
                    <span className="tabular-nums text-text-secondary">
                      {t('inventory.reorderPoint.minimum')}: {row.minQuantity}
                    </span>
                    <span className="rounded-full bg-warning/10 px-2 py-0.5 font-semibold tabular-nums text-warning">
                      {t('inventory.reorderPoint.lowStockSuggest')}: {row.suggestedQuantity ?? Math.max(0, (row.maxQuantity ?? 0) - row.currentQuantity)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <VirtualGrid
          data={pagination.pageItems}
          columns={columns}
          loading={isLoading}
          emptyMessage={noOptionsReason ?? t('inventory.reorderPoint.empty')}
          emptyActionLabel={noOptions ? undefined : t('inventory.reorderPoint.create')}
          emptyAction={noOptions ? undefined : openForm}
        />
      </ListPage>

      <Modal
        open={showForm}
        onClose={closeForm}
        title={t('inventory.reorderPoint.create')}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
          className="space-y-4"
        >
          <FormSelect
            form={form}
            name="productId"
            label={t('inventory.reorderPoint.product')}
            placeholder={`-- ${t('common.select')} --`}
            options={products.map((product) => ({
              value: product.id,
              label: `${product.sku} · ${product.name}`,
            }))}
            required
          />
          <FormSelect
            form={form}
            name="warehouseId"
            label={t('inventory.reorderPoint.warehouse')}
            placeholder={`-- ${t('common.select')} --`}
            options={(warehouses ?? []).map((warehouse) => ({
              value: warehouse.id,
              label: warehouse.name,
            }))}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <FormInput
              form={form}
              name="minQuantity"
              label={t('inventory.reorderPoint.minimum')}
              description={t('inventory.reorderPoint.minHint')}
              inputMode="decimal"
            />
            <FormInput
              form={form}
              name="maxQuantity"
              label={t('inventory.reorderPoint.maximum')}
              description={t('inventory.reorderPoint.maxHint')}
              inputMode="decimal"
              required
            />
          </div>
          {serverError && (
            <p role="alert" className="text-sm text-error">
              {serverError}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeForm}
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

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={t('inventory.reorderPoint.delete')}
        size="sm"
      >
        <p className="text-sm text-text-secondary">
          {t('inventory.reorderPoint.deleteConfirm')
            .replace(
              '{product}',
              deleteTarget
                ? (productMap.get(deleteTarget.productId)?.name ?? deleteTarget.productId)
                : '',
            )
            .replace(
              '{warehouse}',
              deleteTarget
                ? (warehouseMap.get(deleteTarget.warehouseId)?.name ?? deleteTarget.warehouseId)
                : '',
            )}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setDeleteTarget(null)}
            className="rounded-lg px-3 py-2 text-xs text-text-secondary hover:text-text-primary"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={() => void confirmDelete()}
            disabled={deleteReorderPoint.isPending}
            className="rounded-lg bg-error px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            {t('common.delete')}
          </button>
        </div>
      </Modal>
    </>
  );
}
