import { useTranslation } from '@/shared/hooks/useTranslation';
import { useNavigate } from 'react-router-dom';
import { usePurchaseOrders, useApprovePurchaseOrder, useDeletePurchaseOrder, type PurchaseOrder } from '@/modules/purchases/hooks/usePurchaseOrders';
import { VirtualGrid, type GridColumn } from '@/core/components/VirtualGrid';
import { DocumentStateBadge } from '@/core/components/DocumentStateBadge';

export function PurchaseOrderListView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: orders, isLoading } = usePurchaseOrders();
  const approveMutation = useApprovePurchaseOrder();
  const deleteMutation = useDeletePurchaseOrder();

  const columns: GridColumn<PurchaseOrder>[] = [
    { key: 'documentId', label: t('purchasing.orderNumber'), width: 140, sortable: true },
    { key: 'vendorId', label: t('purchasing.vendor'), sortable: true },
    { key: 'expectedDate', label: t('purchasing.expectedDate'), width: 130, sortable: true,
      render: (v) => v ? new Date(v as string).toLocaleDateString() : '-' },
    { key: 'total', label: t('purchasing.totalCost'), width: 120, sortable: true, align: 'right',
      render: (v) => (v as number).toLocaleString('es-VE', { minimumFractionDigits: 2 }) },
    {
      key: 'status',
      label: 'Status',
      width: 150,
      sortable: true,
      render: (_, row) => (
        <DocumentStateBadge
          status={row.status as any}
          size="sm"
          allowedActions={
            row.status === 'draft' || row.status === 'pending'
              ? [
                  { type: 'approve', label: t('document.actions.approve'), requiresConfirmation: true },
                  { type: 'edit', label: t('common.edit'), requiresConfirmation: false },
                  { type: 'delete', label: t('common.delete'), requiresConfirmation: true },
                ]
              : row.status === 'approved'
                ? [
                    { type: 'receive', label: t('document.actions.receive'), requiresConfirmation: false },
                  ]
                : row.status === 'partial'
                  ? [
                      { type: 'complete', label: t('document.actions.complete'), requiresConfirmation: false },
                    ]
                  : undefined
          }
          onAction={(action) => {
            if (action.type === 'approve') approveMutation.mutate(row.id);
            if (action.type === 'edit') navigate(`/purchasing/${row.id}`);
            if (action.type === 'delete') deleteMutation.mutate(row.id);
            if (action.type === 'receive') navigate(`/purchasing/${row.id}`);
            if (action.type === 'complete') navigate(`/purchasing/${row.id}`);
          }}
        />
      ),
    },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <h1 className="text-lg font-bold text-text-primary">{t('purchasing.title')}</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-text-secondary">
            {orders?.length ?? 0} {t('purchasing.orders')}
          </span>
          <button
            onClick={() => navigate('/purchasing/new')}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            {t('purchasing.createOrder')}
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-6">
      <VirtualGrid
        data={orders ?? []}
        columns={columns}
        loading={isLoading}
        emptyMessage={t('purchasing.emptyList')}
        onRowClick={(row) => navigate(`/purchasing/${row.id}`)}
      />
      </div>
    </div>
  );
}
