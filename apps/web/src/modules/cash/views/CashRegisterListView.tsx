import { useTranslation } from '@/shared/hooks/useTranslation';
import { useCashRegisters, type CashRegister } from '@/modules/cash/hooks/useCashRegisters';
import { VirtualGrid, type GridColumn } from '@/core/components/VirtualGrid';

export function CashRegisterListView() {
  const { t } = useTranslation();
  const { data: registers, isLoading } = useCashRegisters();

  const columns: GridColumn<CashRegister>[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'currency', label: t('purchasing.priceListCurrency'), width: 80 },
    { key: 'balance', label: 'Balance', width: 120, align: 'right',
      render: (v) => (v as number).toLocaleString('es-VE', { minimumFractionDigits: 2 }) },
    { key: 'isActive', label: 'Active', width: 70, render: (v) => v ? 'Yes' : 'No' },
  ];

  return (
    <div className="flex h-full flex-col p-6">
      <h1 className="mb-4 text-lg font-bold text-text-primary">{t('cash.registers')}</h1>
      <VirtualGrid data={registers ?? []} columns={columns} loading={isLoading} emptyMessage="No registers" />
    </div>
  );
}
