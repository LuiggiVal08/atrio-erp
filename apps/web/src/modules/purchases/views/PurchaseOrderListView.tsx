import { useTranslation } from '@/shared/hooks/useTranslation';
import { usePurchaseStore, type PurchaseOrder } from '@/modules/purchases/store/purchase-store';
import { VirtualGrid, type GridColumn } from '@/core/components/VirtualGrid';
import { DocumentStateBadge } from '@/core/components/DocumentStateBadge';

export function PurchaseOrderListView() {
  const { t } = useTranslation();
  const orders = usePurchaseStore((s) => s.orders);

  const columns: GridColumn<PurchaseOrder>[] = [
    { key: 'orderNumber', label: t('purchasing.orderNumber'), width: 120, sortable: true },
    { key: 'vendorName', label: t('purchasing.vendor'), sortable: true },
    { key: 'expectedDate', label: t('purchasing.expectedDate'), width: 130, sortable: true },
    {
      key: 'status',
      label: 'Status',
      width: 130,
      sortable: true,
      render: (_, row) => (
        <DocumentStateBadge
          status={row.status}
          size="sm"
          allowedActions={
            row.status === 'draft'
              ? [
                  { type: 'approve' as const, label: t('document.actions.approve'), requiresConfirmation: true },
                  { type: 'cancel' as const, label: t('document.actions.cancel'), requiresConfirmation: true },
                ]
              : row.status === 'approved'
                ? [
                    { type: 'receive' as const, label: t('document.actions.receive'), requiresConfirmation: false },
                  ]
                : undefined
          }
        />
      ),
    },
  ];

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-text-primary">{t('purchasing.title')}</h1>
        <span className="text-xs text-text-secondary">
          {orders.length} {t('purchasing.orders')}
        </span>
      </div>
      <VirtualGrid
        data={orders}
        columns={columns}
        emptyMessage={t('purchasing.emptyList')}
      />
    </div>
  );
}
