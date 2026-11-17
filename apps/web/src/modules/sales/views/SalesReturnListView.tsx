import { useState } from 'react';
import { useForm, useStore } from '@tanstack/react-form';
import { RotateCcw, Plus, CheckCircle2, RotateCw } from 'lucide-react';
import { Modal } from '@/core/components/Modal';
import { VirtualGrid, type GridColumn } from '@/core/components/VirtualGrid';
import { ListPagination } from '@/core/components/ListPagination';
import { usePagination } from '@/shared/hooks/usePagination';
import { toastService } from '@/core/services/toast-service';
import { useSalesInvoices } from '../hooks/useSalesInvoices';
import {
  useSalesReturns,
  useCreateSalesReturn,
  useUpdateSalesReturnStatus,
} from '../hooks/useSalesReturns';
import { useWarehouses } from '@/modules/inventory/hooks/useWarehouses';
import { useCashRegisters } from '@/modules/cash/hooks/useCashRegisters';
import { useProductSearch } from '../hooks/useProductSearch';
import { FormInput, FormSelect } from '@/shared/form';
import { salesReturnSchema, type SalesReturnValues } from '@/shared/validation/sales-return';

export function SalesReturnListView() {
  const { data: returns = [], isLoading, refetch, isFetching } = useSalesReturns();
  const { data: invoices = [] } = useSalesInvoices();
  const { data: warehouses = [] } = useWarehouses();
  const { data: registers = [] } = useCashRegisters();
  const createReturn = useCreateSalesReturn();
  const updateStatus = useUpdateSalesReturnStatus();
  const [open, setOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const { data: products = [] } = useProductSearch(productSearch);

  const form = useForm({
    defaultValues: {
      invoiceId: '',
      warehouseId: '',
      productId: '',
      quantity: 1,
      reasonCode: 'factory_defect',
      reason: '',
      condition: 'saleable',
      resolution: 'credit_note',
      cashRegisterId: '',
      total: undefined,
    } as SalesReturnValues,
    validators: { onSubmit: salesReturnSchema },
    onSubmit: async ({ value }) => {
      const destination =
        value.condition === 'saleable'
          ? 'sellable_stock'
          : value.condition === 'repair'
            ? 'repair'
            : 'scrap';
      const amount = value.total ?? 0;
      const quantity = value.quantity ?? 0;
      try {
        await createReturn.mutateAsync({
          invoiceId: value.invoiceId,
          warehouseId: value.warehouseId,
          reason: value.reason.trim(),
          reasonCode: value.reasonCode,
          productCondition: value.condition,
          destination,
          resolution: value.resolution,
          cashRegisterId:
            value.resolution === 'refund_cash' ? value.cashRegisterId || undefined : undefined,
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
          'La devolución quedó registrada y puede procesarse.',
        );
        setOpen(false);
        form.reset(
          {
            ...value,
            reason: '',
            total: undefined,
            productId: '',
            quantity: 1,
          },
          { keepDefaultValues: true },
        );
      } catch {
        toastService.error(
          'No se pudo crear la devolución',
          'Verifique la factura, almacén y datos de la línea.',
        );
      }
    },
  });

  const resolution = useStore(form.store, (state) => state.values.resolution);

  const pagination = usePagination(returns);

  const columns: GridColumn<(typeof returns)[number]>[] = [
    { key: 'id', label: 'Devolución', width: 220 },
    { key: 'invoiceId', label: 'Factura', width: 220 },
    {
      key: 'reasonCode',
      label: 'Motivo',
      render: (value) => String(value || 'other').replaceAll('_', ' '),
    },
    {
      key: 'productCondition',
      label: 'Condición',
      width: 130,
      render: (value) => {
        const map: Record<string, string> = {
          saleable: 'Disponible',
          repair: 'Revisión',
          damaged: 'Desecho',
        };
        return map[String(value)] ?? 'Disponible';
      },
    },
    {
      key: 'resolution',
      label: 'Resolución',
      width: 150,
      render: (value) => String(value || 'credit_note').replaceAll('_', ' '),
    },
    {
      key: 'total',
      label: 'Total',
      width: 120,
      align: 'right',
      render: (value) => Number(value).toLocaleString('es-VE', { minimumFractionDigits: 2 }),
    },
    { key: 'status', label: 'Estado', width: 120 },
    {
      key: 'actions',
      label: '',
      width: 130,
      align: 'right',
      render: (_v, row) =>
        row.status === 'draft' || row.status === 'pending' ? (
          <button
            type="button"
            disabled={updateStatus.isPending}
            onClick={() => updateStatus.mutate({ id: row.id, status: 'approved' })}
            className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:border-accent hover:text-accent"
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Procesar
          </button>
        ) : null,
    },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-accent/10 p-2 text-accent">
            <RotateCcw className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-text-primary">Devoluciones de clientes</h1>
            <p className="text-sm text-text-secondary">
              Nota de crédito, reembolso, stock y cuarentena
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
            aria-label="Recargar datos"
            title="Recargar datos"
            className="rounded-lg border border-border p-1.5 text-text-secondary transition-colors hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCw size={14} aria-hidden="true" className={isFetching ? 'animate-spin' : ''} />
          </button>
          <button
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
          emptyMessage="No hay devoluciones registradas"
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
      <Modal open={open} onClose={() => setOpen(false)} title="Nueva devolución de cliente">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
          className="grid gap-4"
        >
          <FormSelect
            form={form}
            name="invoiceId"
            label="Factura"
            placeholder="Seleccionar factura"
            required
            options={invoices.map((invoice) => ({
              value: invoice.id,
              label: invoice.documentId || invoice.id,
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
            label="Producto devuelto"
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
              options={warehouses.map((warehouse) => ({
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
              { value: 'dispatch_error', label: 'Error de despacho' },
              { value: 'expired', label: 'Producto vencido' },
              { value: 'change_of_mind', label: 'Cambio de opinión' },
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
            <FormSelect
              form={form}
              name="condition"
              label="Condición"
              options={[
                { value: 'saleable', label: 'Buen estado' },
                { value: 'repair', label: 'Revisión técnica' },
                { value: 'damaged', label: 'Merma / pérdida' },
              ]}
            />
            <FormSelect
              form={form}
              name="resolution"
              label="Resolución"
              options={[
                { value: 'credit_note', label: 'Nota de crédito' },
                { value: 'refund_cash', label: 'Reembolso efectivo' },
                { value: 'refund_card', label: 'Reembolso tarjeta' },
                { value: 'exchange', label: 'Cambio' },
              ]}
            />
          </div>
          {resolution === 'refund_cash' && (
            <FormSelect
              form={form}
              name="cashRegisterId"
              label="Caja"
              placeholder="Seleccionar caja"
              required
              options={registers.map((register) => ({
                value: register.id,
                label: register.name,
              }))}
            />
          )}
          <FormInput
            form={form}
            name="total"
            label="Monto devuelto"
            type="number"
            min="0"
            step="0.01"
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createReturn.isPending}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {createReturn.isPending ? 'Guardando...' : 'Crear devolución'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
