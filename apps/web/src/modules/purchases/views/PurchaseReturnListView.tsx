import { useTranslation } from '@/shared/hooks/useTranslation';
import {
  usePurchaseReturns,
  useDeletePurchaseReturn,
  type PurchaseReturn,
} from '@/modules/purchases/hooks/usePurchaseReturns';
import { VirtualGrid, type GridColumn } from '@/core/components/VirtualGrid';
import { DocumentStateBadge } from '@/core/components/DocumentStateBadge';
import { useState } from 'react';
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

export function PurchaseReturnListView() {
  const { t } = useTranslation();
  const { data: returns, isLoading, refetch, isFetching } = usePurchaseReturns();
  const deleteMutation = useDeletePurchaseReturn();
  const { data: orders = [] } = usePurchaseOrders();
  const { data: warehouses = [] } = useWarehouses();
  const createMutation = useCreatePurchaseReturn();
  const updateStatusMutation = useUpdatePurchaseReturnStatus();
  const [open, setOpen] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [reasonCode, setReasonCode] = useState('factory_defect');
  const [reason, setReason] = useState('');
  const [total, setTotal] = useState('');
  const [supplierCreditNo, setSupplierCreditNo] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const { data: products = [] } = useProductSearch(productSearch);

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

  const handleCreate = async () => {
    const amount = Number(total);
    if (
      !orderId ||
      !warehouseId ||
      !productId ||
      !reason.trim() ||
      Number(quantity) <= 0 ||
      amount < 0
    )
      return;
    try {
      await createMutation.mutateAsync({
        orderId,
        warehouseId,
        reason: reason.trim(),
        reasonCode,
        resolution: supplierCreditNo ? 'supplier_credit' : 'supplier_replacement',
        supplierCreditNo: supplierCreditNo || undefined,
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
        'La devolución quedó registrada para procesamiento.',
      );
      setOpen(false);
      setReason('');
      setTotal('');
      setProductId('');
      setProductSearch('');
    } catch {
      toastService.error(
        'No se pudo crear la devolución',
        'Verifique la orden, el almacén y los datos de la línea.',
      );
    }
  };

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
        <div className="grid gap-4">
          <label className="grid gap-1 text-xs font-medium text-text-secondary">
            Orden recibida
            <select
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary"
            >
              <option value="">Seleccionar orden</option>
              {orders
                .filter((order) => order.status === 'received' || order.status === 'partial')
                .map((order) => (
                  <option key={order.id} value={order.id}>
                    {order.documentId || order.id}
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
            Producto
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
                {warehouses
                  .filter((warehouse) => warehouse.isActive)
                  .map((warehouse) => (
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
              <option value="wrong_item">Artículo incorrecto</option>
              <option value="excess">Mercancía sobrante</option>
              <option value="expired">Producto vencido</option>
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
              Valor devuelto
              <input
                type="number"
                min="0"
                step="0.01"
                value={total}
                onChange={(e) => setTotal(e.target.value)}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary"
              />
            </label>
            <label className="grid gap-1 text-xs font-medium text-text-secondary">
              Nota/crédito proveedor
              <input
                value={supplierCreditNo}
                onChange={(e) => setSupplierCreditNo(e.target.value)}
                placeholder="Opcional"
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary"
              />
            </label>
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
              type="button"
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {createMutation.isPending ? 'Guardando...' : 'Crear devolución'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
