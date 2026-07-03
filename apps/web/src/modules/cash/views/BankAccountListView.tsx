import { useTranslation } from '@/shared/hooks/useTranslation';
import { useBankAccounts, type BankAccount } from '@/modules/cash/hooks/useBankAccounts';
import { VirtualGrid, type GridColumn } from '@/core/components/VirtualGrid';

export function BankAccountListView() {
  const { t } = useTranslation();
  const { data: accounts, isLoading } = useBankAccounts();

  const columns: GridColumn<BankAccount>[] = [
    { key: 'bankName', label: 'Bank', sortable: true },
    { key: 'accountNumber', label: 'Account #' },
    { key: 'accountType', label: 'Type', width: 100 },
    { key: 'currency', label: t('purchasing.priceListCurrency'), width: 80 },
    { key: 'isActive', label: 'Active', width: 70, render: (v) => v ? 'Yes' : 'No' },
  ];

  return (
    <div className="flex h-full flex-col p-6">
      <h1 className="mb-4 text-lg font-bold text-text-primary">Bank Accounts</h1>
      <VirtualGrid data={accounts ?? []} columns={columns} loading={isLoading} emptyMessage="No bank accounts" />
    </div>
  );
}
