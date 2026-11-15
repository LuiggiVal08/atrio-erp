import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { usePurchaseOrder, useApprovePurchaseOrder, useReceivePurchaseOrder, useCompleteReceivePurchaseOrder, useDeletePurchaseOrder, useUpdatePurchaseOrder } from '@/modules/purchases/hooks/usePurchaseOrders';
import type { PurchaseOrderLine, ReceivePurchaseOrderInput } from '@/modules/purchases/hooks/usePurchaseOrders';
import { DocumentStateBadge } from '@/core/components/DocumentStateBadge';
import { DocumentTimeline } from '@/core/components/DocumentTimeline';

const toDateInput = (value: string) => value.slice(0, 10);

type PendingReceipt = {
  operationId: string;
  lines: ReceivePurchaseOrderInput['lines'];
  values: Record<string, string>;
};

const pendingReceiptKey = (orderId: string) => `atrio-purchase-receipt:${orderId}`;

const readPendingReceipt = (orderId: string): PendingReceipt | null => {
  try {
    const raw = localStorage.getItem(pendingReceiptKey(orderId));
    return raw ? (JSON.parse(raw) as PendingReceipt) : null;
  } catch {
    return null;
  }
};

const remainingFor = (line: PurchaseOrderLine) => line.quantity - (line.receivedQuantity ?? 0);

export function PurchaseOrderDetailView() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: order, isLoading } = usePurchaseOrder(id);
  const approveMutation = useApprovePurchaseOrder();
  const receiveMutation = useReceivePurchaseOrder();
  const completeReceiveMutation = useCompleteReceivePurchaseOrder();
  const deleteMutation = useDeletePurchaseOrder();
  const updateMutation = useUpdatePurchaseOrder();
  const [editingExpectedDate, setEditingExpectedDate] = useState(false);
  const [expectedDate, setExpectedDate] = useState('');
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [pendingReceipt, setPendingReceipt] = useState<PendingReceipt | null>(null);

  useEffect(() => {
    if (!editingExpectedDate) {
      setExpectedDate(order?.expectedDate ? toDateInput(order.expectedDate) : '');
    }
  }, [order?.id, order?.expectedDate, editingExpectedDate]);

  useEffect(() => {
    if (!id) return;
    const pending = readPendingReceipt(id);
    setPendingReceipt(pending);
    setQuantities(pending?.values ?? {});
    setReceiptOpen(!!pending);
    setReceiptError(null);
  }, [id]);

  if (isLoading) return <div className="p-6 text-sm text-text-secondary">{t('common.loading')}</div>;
  if (!order) return <div className="p-6 text-sm text-text-secondary">{t('common.noResults')}</div>;

  const handleSaveExpectedDate = async () => {
    if (!expectedDate) return;
    await updateMutation.mutateAsync({ id: order.id, expectedDate });
    setEditingExpectedDate(false);
  };

  const handleCancelExpectedDate = () => {
    setExpectedDate(order.expectedDate ? toDateInput(order.expectedDate) : '');
    setEditingExpectedDate(false);
  };

  const clearPendingReceipt = () => {
    localStorage.removeItem(pendingReceiptKey(order.id));
    setPendingReceipt(null);
  };

  const buildReceiptLines = () => {
    const lines: ReceivePurchaseOrderInput['lines'] = [];
    const values: Record<string, string> = {};
    for (const line of order.lines ?? []) {
      if (remainingFor(line) <= 0) continue;
      const raw = (quantities[line.lineId] ?? '').trim().replace(',', '.');
      if (!raw) continue;
      const quantity = Number(raw);
      if (!Number.isFinite(quantity) || quantity <= 0 || !/^\d+(\.\d{1,4})?$/.test(raw)) {
        setReceiptError(t('purchasing.receiptInvalid'));
        return null;
      }
      if (quantity > remainingFor(line)) {
        setReceiptError(t('purchasing.receiptExcess'));
        return null;
      }
      values[line.lineId] = raw;
      lines.push({ lineId: line.lineId, productId: line.productId, warehouseId: line.warehouseId, quantity });
    }
    if (!lines.length) {
      setReceiptError(t('purchasing.receiptRequired'));
      return null;
    }
    return { lines, values };
  };

  const sendReceipt = async (payload: PendingReceipt) => {
    try {
      await receiveMutation.mutateAsync({ id: order.id, operationId: payload.operationId, lines: payload.lines });
      clearPendingReceipt();
      setReceiptOpen(false);
      setQuantities({});
      setReceiptError(null);
    } catch (error) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      if (!status || status >= 500) {
        localStorage.setItem(pendingReceiptKey(order.id), JSON.stringify(payload));
        setPendingReceipt(payload);
        setQuantities(payload.values);
        setReceiptError(null);
        return;
      }
      const message = axios.isAxiosError(error) ? error.response?.data?.message : null;
      setReceiptError(typeof message === 'string' ? message : t('common.error'));
    }
  };

  const handleApprove = () => approveMutation.mutate(order.id);
  const handleOpenReceipt = () => {
    setReceiptError(null);
    setReceiptOpen(true);
  };
  const handleConfirmReceipt = () => {
    const built = buildReceiptLines();
    if (!built) return;
    setReceiptError(null);
    void sendReceipt({ operationId: crypto.randomUUID(), lines: built.lines, values: built.values });
  };
  const handleRetryReceipt = () => {
    if (pendingReceipt) void sendReceipt(pendingReceipt);
  };
  const handleCancelReceipt = () => {
    if (pendingReceipt) return;
    setReceiptOpen(false);
    setReceiptError(null);
  };
  const handleCompleteReceive = () => completeReceiveMutation.mutate(order.id);
  const handleDelete = async () => {
    await deleteMutation.mutateAsync(order.id);
    navigate('/purchasing');
  };

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/purchasing')}
            className="text-sm text-text-secondary hover:text-text-primary"
          >
            &larr; {t('purchasing.orders')}
          </button>
          <h1 className="text-lg font-bold text-text-primary">{order.documentId}</h1>
          <DocumentStateBadge status={order.status as any} size="sm" />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDelete}
            className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary hover:text-red-400"
          >
            {t('common.delete')}
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div className="mb-6 grid grid-cols-2 gap-4 rounded-xl border border-border bg-surface p-4">
        <div>
          <span className="text-xs text-text-secondary">{t('purchasing.vendor')}</span>
          <p className="text-sm font-medium text-text-primary">{order.vendorId}</p>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary">{t('purchasing.expectedDate')}</span>
            {!editingExpectedDate && (
              <button
                type="button"
                onClick={() => setEditingExpectedDate(true)}
                className="text-xs text-accent hover:underline"
              >
                {t('common.edit')}
              </button>
            )}
          </div>
          {editingExpectedDate ? (
            <div className="mt-1 flex items-center gap-2">
              <input
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                className="rounded-lg border border-border bg-surface px-2 py-1 text-sm text-text-primary focus:border-accent focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSaveExpectedDate}
                disabled={!expectedDate || updateMutation.isPending}
                className="rounded-lg bg-accent px-2 py-1 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                {updateMutation.isPending ? t('common.loading') : t('common.save')}
              </button>
              <button
                type="button"
                onClick={handleCancelExpectedDate}
                className="rounded-lg border border-border px-2 py-1 text-xs text-text-secondary hover:text-text-primary"
              >
                {t('common.cancel')}
              </button>
            </div>
          ) : (
            <p className="text-sm font-medium text-text-primary">
              {order.expectedDate ? new Date(order.expectedDate).toLocaleDateString() : '-'}
            </p>
          )}
        </div>
        <div>
          <span className="text-xs text-text-secondary">{t('sales.pos.subtotal')}</span>
          <p className="text-sm font-medium text-text-primary">{order.subtotal.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
        </div>
        <div>
          <span className="text-xs text-text-secondary">{t('localization.taxes')}</span>
          <p className="text-sm font-medium text-text-primary">{order.taxAmount.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
        </div>
        <div>
          <span className="text-xs text-text-secondary">{t('sales.pos.total')}</span>
          <p className="text-sm font-bold text-text-primary">{order.total.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
        </div>
        <div>
          <span className="text-xs text-text-secondary">{t('purchasing.notes')}</span>
          <p className="text-sm text-text-primary">{order.notes || '-'}</p>
        </div>
      </div>

      {!!order.lines?.length && (
        <div className="mb-6 overflow-hidden rounded-xl border border-border">
          <div className="grid grid-cols-[1fr_repeat(4,auto)] gap-4 border-b border-border bg-surface px-4 py-2 text-xs font-medium text-text-secondary">
            <span>{t('purchasing.items')}</span>
            <span className="text-right">{t('purchasing.ordered')}</span>
            <span className="text-right">{t('purchasing.received')}</span>
            <span className="text-right">{t('purchasing.pending')}</span>
            <span className="text-right">{t('purchasing.costPerUnit')}</span>
          </div>
          {order.lines.map((line) => (
            <div key={line.lineId} className="grid grid-cols-[1fr_repeat(4,auto)] items-center gap-4 border-b border-border px-4 py-2 text-sm text-text-primary last:border-b-0">
              <span>{line.description}</span>
              <span className="text-right tabular-nums">{line.quantity}</span>
              <span className="text-right tabular-nums">{line.receivedQuantity ?? 0}</span>
              <span className="text-right tabular-nums">{remainingFor(line)}</span>
              <span className="text-right tabular-nums">
                {line.unitPrice.toLocaleString('es-VE', { minimumFractionDigits: 2 })} {order.currency}
              </span>
            </div>
          ))}
        </div>
      )}

      {receiptOpen && (
        <div role="region" aria-label={t('purchasing.receiptTitle')} className="mb-6 rounded-xl border border-border bg-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary">{t('purchasing.receiptTitle')}</h2>
            <span className="text-xs text-text-secondary">
              {t('purchasing.receiptCurrency')}: <span className="font-medium text-text-primary">{order.currency}</span>
            </span>
          </div>
          <div className="grid gap-3">
            {(order.lines ?? []).filter((line) => remainingFor(line) > 0).map((line) => (
              <div key={line.lineId} className="grid grid-cols-[1fr_8rem_7rem] items-center gap-3">
                <label htmlFor={`receipt-${line.lineId}`} className="text-sm text-text-primary">
                  {t('purchasing.receivedQuantity')} · {line.description}
                </label>
                <input
                  id={`receipt-${line.lineId}`}
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.0001"
                  value={quantities[line.lineId] ?? ''}
                  disabled={!!pendingReceipt || receiveMutation.isPending}
                  onChange={(event) => setQuantities((current) => ({ ...current, [line.lineId]: event.target.value }))}
                  className="rounded-lg border border-border bg-surface px-2 py-1 text-right text-sm text-text-primary focus:border-accent focus:outline-none disabled:opacity-60"
                />
                <span className="text-right text-xs text-text-secondary">
                  {remainingFor(line)} {t('purchasing.units')}
                </span>
              </div>
            ))}
          </div>
          {receiptError && (
            <p role="alert" className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {receiptError}
            </p>
          )}
          <div className="mt-4 flex gap-2">
            {pendingReceipt ? (
              <button
                type="button"
                onClick={handleRetryReceipt}
                disabled={receiveMutation.isPending}
                className="rounded-lg bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-400 hover:bg-violet-500/20 disabled:opacity-50"
              >
                {t('purchasing.retryReceipt')}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirmReceipt}
                disabled={receiveMutation.isPending}
                className="rounded-lg bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-400 hover:bg-violet-500/20 disabled:opacity-50"
              >
                {t('purchasing.confirmReceipt')}
              </button>
            )}
            <button
              type="button"
              onClick={handleCancelReceipt}
              disabled={!!pendingReceipt || receiveMutation.isPending}
              className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:text-text-primary disabled:opacity-50"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      <div className="mb-6 flex gap-2">
        {(order.status === 'draft' || order.status === 'pending') && (
          <>
            <button
              onClick={handleApprove}
              disabled={approveMutation.isPending}
              className="rounded-lg bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50"
            >
              {t('document.actions.approve')}
            </button>
          </>
        )}
        {(order.status === 'approved' || order.status === 'partial') && !receiptOpen && !pendingReceipt && (
          <button
            onClick={handleOpenReceipt}
            disabled={receiveMutation.isPending}
            className="rounded-lg bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-400 hover:bg-violet-500/20 disabled:opacity-50"
          >
            {t('document.actions.receive')}
          </button>
        )}
        {order.status === 'partial' && !receiptOpen && (
          <button
            onClick={handleCompleteReceive}
            disabled={completeReceiveMutation.isPending}
            className="rounded-lg bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-400 hover:bg-violet-500/20 disabled:opacity-50"
          >
            {t('document.actions.complete')}
          </button>
        )}
      </div>

      <DocumentTimeline
        entries={[
          {
            fromStatus: null,
            toStatus: order.status as any,
            timestamp: order.createdAt,
            userId: 'system',
            userName: 'System',
          },
        ]}
      />
      </div>
    </div>
  );
}
