import { useTranslation } from '@/shared/hooks/useTranslation';
import { usePaymentMethods, type PaymentMethod } from '@/modules/cash/hooks/usePaymentMethods';
import { VirtualGrid, type GridColumn } from '@/core/components/VirtualGrid';

export function PaymentMethodListView() {
  const { t } = useTranslation();
  const { data: methods, isLoading } = usePaymentMethods();

  const columns: GridColumn<PaymentMethod>[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'type', label: 'Type', width: 100 },
    { key: 'commissionRate', label: 'Commission', width: 100, align: 'right',
      render: (v) => v ? `${((v as number) * 100).toFixed(2)}%` : '-' },
    { key: 'isActive', label: 'Active', width: 70, render: (v) => v ? 'Yes' : 'No' },
  ];

  return (
    <div className="flex h-full flex-col p-6">
      <h1 className="mb-4 text-lg font-bold text-text-primary">{t('cash.paymentMethods')}</h1>
      <VirtualGrid data={methods ?? []} columns={columns} loading={isLoading} emptyMessage="No payment methods" />
    </div>
  );
}
