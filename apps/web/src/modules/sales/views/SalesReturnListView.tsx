import { useState } from 'react';
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

export function SalesReturnListView() {
  const { data: returns = [], isLoading, refetch, isFetching } = useSalesReturns();
  const { data: invoices = [] } = useSalesInvoices();
  const { data: warehouses = [] } = useWarehouses();
  const { data: registers = [] } = useCashRegisters();
  const createReturn = useCreateSalesReturn();
  const updateStatus = useUpdateSalesReturnStatus();
  const [open, setOpen] = useState(false);
  const [invoiceId, setInvoiceId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [reasonCode, setReasonCode] = useState('factory_defect');
  const [condition, setCondition] = useState<'saleable' | 'repair' | 'damaged'>('saleable');
  const [resolution, setResolution] = useState<
    'credit_note' | 'refund_cash' | 'refund_card' | 'exchange'
  >('credit_note');
  const [cashRegisterId, setCashRegisterId] = useState('');
  const [reason, setReason] = useState('');
  const [total, setTotal] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [productSearch, setProductSearch] = useState('');
  const { data: products = [] } = useProductSearch(productSearch);

  const destination =
    condition === 'saleable' ? 'sellable_stock' : condition === 'repair' ? 'repair' : 'scrap';

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

  const handleCreate = async () => {
    const amount = Number(total);
    if (
      !invoiceId ||
      !warehouseId ||
      !reason.trim() ||
      amount < 0 ||
      !productId ||
      Number(quantity) <= 0
    )
      return;
    try {
      await createReturn.mutateAsync({
        invoiceId,
        warehouseId,
        reason: reason.trim(),
        reasonCode,
        productCondition: condition,
        destination,
        resolution,
        cashRegisterId: resolution === 'refund_cash' ? cashRegisterId || undefined : undefined,
        subtotal: amount,
        taxAmount: 0,
        total: amount,
        lines: [
          {
            productId,
            warehouseId,
            quantity: Number(quantity),
            unitPrice: amount / Number(quantity),
          },
        ],
      });
      toastService.success(
        'Devolución creada',
        'La devolución quedó registrada y puede procesarse.',
      );
      setOpen(false);
      setReason('');
      setTotal('');
      setProductId('');
      setQuantity('1');
    } catch {
      toastService.error(
        'No se pudo crear la devolución',
        'Verifique la factura, almacén y datos de la línea.',
      );
    }
  };

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
        <div className="grid gap-4">
          <label className="grid gap-1 text-xs font-medium text-text-secondary">
            Factura
            <select
              value={invoiceId}
              onChange={(e) => setInvoiceId(e.target.value)}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary"
            >
              <option value="">Seleccionar factura</option>
              {invoices.map((invoice) => (
                <option key={invoice.id} value={invoice.id}>
                  {invoice.documentId || invoice.id}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs font-medium text-text-secondary">
            Buscar producto
            <input
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Nombre o SKU"
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary"
            />
          </label>
          <label className="grid gap-1 text-xs font-medium text-text-secondary">
            Producto devuelto
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary"
            >
              <option value="">Seleccionar producto</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.sku} - {product.name}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1 text-xs font-medium text-text-secondary">
              Almacén
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary"
              >
                <option value="">Seleccionar</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-xs font-medium text-text-secondary">
              Cantidad
              <input
                type="number"
                min="0.000001"
                step="0.000001"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary"
              />
            </label>
          </div>
          <label className="grid gap-1 text-xs font-medium text-text-secondary">
            Motivo
            <select
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value)}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary"
            >
              <option value="factory_defect">Defecto de fábrica</option>
              <option value="dispatch_error">Error de despacho</option>
              <option value="expired">Producto vencido</option>
              <option value="change_of_mind">Cambio de opinión</option>
              <option value="damaged">Producto dañado</option>
              <option value="other">Otro</option>
            </select>
          </label>
          <label className="grid gap-1 text-xs font-medium text-text-secondary">
            Detalle
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Descripción de la devolución"
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1 text-xs font-medium text-text-secondary">
              Condición
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as typeof condition)}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary"
              >
                <option value="saleable">Buen estado</option>
                <option value="repair">Revisión técnica</option>
                <option value="damaged">Merma / pérdida</option>
              </select>
            </label>
            <label className="grid gap-1 text-xs font-medium text-text-secondary">
              Resolución
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value as typeof resolution)}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary"
              >
                <option value="credit_note">Nota de crédito</option>
                <option value="refund_cash">Reembolso efectivo</option>
                <option value="refund_card">Reembolso tarjeta</option>
                <option value="exchange">Cambio</option>
              </select>
            </label>
          </div>
          {resolution === 'refund_cash' && (
            <label className="grid gap-1 text-xs font-medium text-text-secondary">
              Caja
              <select
                value={cashRegisterId}
                onChange={(e) => setCashRegisterId(e.target.value)}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary"
              >
                <option value="">Seleccionar caja</option>
                {registers.map((register) => (
                  <option key={register.id} value={register.id}>
                    {register.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="grid gap-1 text-xs font-medium text-text-secondary">
            Monto devuelto
            <input
              type="number"
              min="0"
              step="0.01"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary"
            />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              disabled={createReturn.isPending}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {createReturn.isPending ? 'Guardando...' : 'Crear devolución'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
