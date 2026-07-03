import { useTranslation } from '@/shared/hooks/useTranslation';
import { useNavigate } from 'react-router-dom';
import { usePurchaseReturns, useDeletePurchaseReturn, type PurchaseReturn } from '@/modules/purchases/hooks/usePurchaseReturns';
import { VirtualGrid, type GridColumn } from '@/core/components/VirtualGrid';
import { DocumentStateBadge } from '@/core/components/DocumentStateBadge';

export function PurchaseReturnListView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: returns, isLoading } = usePurchaseReturns();
  const deleteMutation = useDeletePurchaseReturn();

  const columns: GridColumn<PurchaseReturn>[] = [
    { key: 'id', label: 'ID', width: 280 },
    { key: 'reason', label: t('purchasing.returnReason'), sortable: true },
    { key: 'total', label: t('purchasing.returnTotal'), width: 120, align: 'right',
      render: (v) => (v as number).toLocaleString('es-VE', { minimumFractionDigits: 2 }) },
    { key: 'returnedAt', label: t('purchasing.returnDate'), width: 140,
      render: (v) => new Date(v as string).toLocaleDateString() },
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
  ];

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-text-primary">{t('purchasing.returns')}</h1>
        <span className="text-xs text-text-secondary">
          {returns?.length ?? 0} {t('purchasing.returns')}
        </span>
      </div>
      <VirtualGrid
        data={returns ?? []}
        columns={columns}
        loading={isLoading}
        emptyMessage="No returns"
        onRowClick={(row) => navigate(`/purchasing/returns/${row.id}`)}
      />
    </div>
  );
}
