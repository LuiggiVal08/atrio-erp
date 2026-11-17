import { useTranslation } from '@/shared/hooks/useTranslation';
import {
  usePurchaseReturns,
  useDeletePurchaseReturn,
  type PurchaseReturn,
} from '@/modules/purchases/hooks/usePurchaseReturns';
import { VirtualGrid, type GridColumn } from '@/core/components/VirtualGrid';
import { DocumentStateBadge } from '@/core/components/DocumentStateBadge';
import { useDeferredValue, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { Plus, RotateCcw, CheckCircle2, RotateCw } from 'lucide-react';
import { Modal } from '@/core/components/Modal';
import { usePurchaseOrders } from '@/modules/purchases/hooks/usePurchaseOrders';
import { useWarehouses } from '@/modules/inventory/hooks/useWarehouses';
import {
  useCreatePurchaseReturn,
  useUpdatePurchaseReturnStatus,
} from '@/modules/purchases/hooks/usePurchaseReturns';
import { useProductSearch } from '@/modules/sales/hooks/useProductSearch';
import { toastService } from '@/core/services/toast-service';
import { ListPagination } from '@/core/components/ListPagination';
import { usePagination } from '@/shared/hooks/usePagination';
import { FormInput, FormSelect } from '@/shared/form';
import {
  purchaseReturnSchema,
  type PurchaseReturnValues,
} from '@/shared/validation/purchase-return';

export function PurchaseReturnListView() {
  const { t } = useTranslation();
  const { data: returns, isLoading, refetch, isFetching } = usePurchaseReturns();
  const deleteMutation = useDeletePurchaseReturn();
  const { data: orders = [] } = usePurchaseOrders();
  const { data: warehouses = [] } = useWarehouses();
  const createMutation = useCreatePurchaseReturn();
  const updateStatusMutation = useUpdatePurchaseReturnStatus();
  const [open, setOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const deferredProductSearch = useDeferredValue(productSearch);
  const { data: products = [] } = useProductSearch(deferredProductSearch);

  const form = useForm({
    defaultValues: {
      orderId: '',
      warehouseId: '',
      productId: '',
      quantity: 1,
      reasonCode: 'factory_defect',
      reason: '',
      total: undefined,
      supplierCreditNo: '',
    } as PurchaseReturnValues,
    validators: { onSubmit: purchaseReturnSchema },
    onSubmit: async ({ value }) => {
      const amount = value.total ?? 0;
      const quantity = value.quantity ?? 0;
      try {
        await createMutation.mutateAsync({
          orderId: value.orderId,
          warehouseId: value.warehouseId,
          reason: value.reason.trim(),
          reasonCode: value.reasonCode,
          resolution: value.supplierCreditNo ? 'supplier_credit' : 'supplier_replacement',
          supplierCreditNo: value.supplierCreditNo || undefined,
          subtotal: amount,
          taxAmount: 0,
          total: amount,
          lines: [
            {
              productId: value.productId,
              warehouseId: value.warehouseId,
              quantity,
              unitPrice: amount / quantity,
            },
          ],
        });
        toastService.success(
          'Devolución creada',
          'La devolución quedó registrada para procesamiento.',
        );
        setOpen(false);
        form.reset(
          {
            ...value,
            reason: '',
            total: undefined,
            productId: '',
            supplierCreditNo: '',
            quantity: 1,
          },
          { keepDefaultValues: true },
        );
        setProductSearch('');
      } catch {
        toastService.error(
          'No se pudo crear la devolución',
          'Verifique la orden, el almacén y los datos de la línea.',
        );
      }
    },
  });

  const pagination = usePagination(returns ?? []);

  const columns: GridColumn<PurchaseReturn>[] = [
    { key: 'id', label: 'ID', width: 280 },
    {
      key: 'reasonCode',
      label: 'Motivo',
      width: 160,
      render: (value) => String(value || 'other').replaceAll('_', ' '),
    },
    { key: 'reason', label: t('purchasing.returnReason'), sortable: true },
    {
      key: 'total',
      label: t('purchasing.returnTotal'),
      width: 120,
      align: 'right',
      render: (v) => (v as number).toLocaleString('es-VE', { minimumFractionDigits: 2 }),
    },
    {
      key: 'returnedAt',
      label: t('purchasing.returnDate'),
      width: 140,
      render: (v) => new Date(v as string).toLocaleDateString(),
    },
    {
      key: 'status',
      label: t('purchasing.returnStatus'),
      width: 130,
      render: (_, row) => (
        <DocumentStateBadge
          status={row.status as any}
          size="sm"
          allowedActions={[
            { type: 'delete', label: t('common.delete'), requiresConfirmation: true },
          ]}
          onAction={() => deleteMutation.mutate(row.id)}
        />
      ),
    },
    {
      key: 'actions',
      label: '',
      width: 130,
      align: 'right',
      render: (_value, row) =>
        row.status === 'draft' || row.status === 'pending' ? (
          <button
            type="button"
            disabled={updateStatusMutation.isPending}
            onClick={() => updateStatusMutation.mutate({ id: row.id, status: 'approved' })}
            className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:border-accent hover:text-accent"
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Procesar
          </button>
        ) : null,
    },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-accent/10 p-2 text-accent">
            <RotateCcw className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-text-primary">{t('purchasing.returns')}</h1>
            <p className="text-sm text-text-secondary">
              {pagination.total} devoluciones registradas
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
            aria-label={t('common.refresh')}
            title={t('common.refresh')}
            className="rounded-lg border border-border p-1.5 text-text-secondary transition-colors hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCw size={14} aria-hidden="true" className={isFetching ? 'animate-spin' : ''} />
          </button>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white"
          >
            <Plus className="h-4 w-4" /> Nueva devolución
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <VirtualGrid
          data={pagination.pageItems}
          columns={columns}
          loading={isLoading}
          emptyMessage={t('purchasing.returnsEmpty')}
        />
        <div className="mt-3 border-t border-border pt-3">
          <ListPagination
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            totalPages={pagination.totalPages}
            onPageChange={pagination.setPage}
            onPageSizeChange={pagination.setPageSize}
          />
        </div>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Nueva devolución a proveedor">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
          className="grid gap-4"
        >
          <FormSelect
            form={form}
            name="orderId"
            label="Orden recibida"
            placeholder="Seleccionar orden"
            required
            options={orders
              .filter((order) => order.status === 'received' || order.status === 'partial')
              .map((order) => ({
                value: order.id,
                label: order.documentId || order.id,
              }))}
          />
          <label className="grid gap-1 text-xs font-medium text-text-secondary">
            Buscar producto
            <input
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Nombre o SKU"
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary"
            />
          </label>
          <FormSelect
            form={form}
            name="productId"
            label="Producto"
            placeholder="Seleccionar producto"
            required
            options={products.map((product) => ({
              value: product.id,
              label: `${product.sku} - ${product.name}`,
            }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <FormSelect
              form={form}
              name="warehouseId"
              label="Almacén"
              placeholder="Seleccionar"
              required
              options={warehouses
                .filter((warehouse) => warehouse.isActive)
                .map((warehouse) => ({
                  value: warehouse.id,
                  label: warehouse.name,
                }))}
            />
            <FormInput
              form={form}
              name="quantity"
              label="Cantidad"
              type="number"
              min="0.000001"
              step="0.000001"
              required
            />
          </div>
          <FormSelect
            form={form}
            name="reasonCode"
            label="Motivo"
            options={[
              { value: 'factory_defect', label: 'Defecto de fábrica' },
              { value: 'wrong_item', label: 'Artículo incorrecto' },
              { value: 'excess', label: 'Mercancía sobrante' },
              { value: 'expired', label: 'Producto vencido' },
              { value: 'damaged', label: 'Producto dañado' },
              { value: 'other', label: 'Otro' },
            ]}
          />
          <FormInput
            form={form}
            name="reason"
            label="Detalle"
            placeholder="Descripción de la devolución"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <FormInput
              form={form}
              name="total"
              label="Valor devuelto"
              type="number"
              min="0"
              step="0.01"
            />
            <FormInput
              form={form}
              name="supplierCreditNo"
              label="Nota/crédito proveedor"
              placeholder="Opcional"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {createMutation.isPending ? 'Guardando...' : 'Crear devolución'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
