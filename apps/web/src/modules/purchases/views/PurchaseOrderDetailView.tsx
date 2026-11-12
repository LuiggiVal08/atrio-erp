import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { usePurchaseOrder, useApprovePurchaseOrder, useReceivePurchaseOrder, useCompleteReceivePurchaseOrder, useDeletePurchaseOrder, useUpdatePurchaseOrder } from '@/modules/purchases/hooks/usePurchaseOrders';
import { DocumentStateBadge } from '@/core/components/DocumentStateBadge';
import { DocumentTimeline } from '@/core/components/DocumentTimeline';

const toDateInput = (value: string) => value.slice(0, 10);

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

  useEffect(() => {
    if (!editingExpectedDate) {
      setExpectedDate(order?.expectedDate ? toDateInput(order.expectedDate) : '');
    }
  }, [order?.id, order?.expectedDate, editingExpectedDate]);

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

  const handleApprove = () => approveMutation.mutate(order.id);
  const handleReceive = () => receiveMutation.mutate({ id: order.id, lines: [] });
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
        {order.status === 'approved' && (
          <button
            onClick={handleReceive}
            disabled={receiveMutation.isPending}
            className="rounded-lg bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-400 hover:bg-violet-500/20 disabled:opacity-50"
          >
            {t('document.actions.receive')}
          </button>
        )}
        {order.status === 'partial' && (
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
