import { useState } from 'react';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { useBankAccounts, type BankAccount } from '@/modules/cash/hooks/useBankAccounts';
import { useCreateBankAccount } from '@/modules/cash/hooks/useCreateBankAccount';
import { VirtualGrid, type GridColumn } from '@/core/components/VirtualGrid';
import { ListPage } from '@/core/components/ListPage';
import { ListPagination } from '@/core/components/ListPagination';
import { usePagination } from '@/shared/hooks/usePagination';

export function BankAccountListView() {
  const { t } = useTranslation();
  const { data: accounts, isLoading, refetch, isFetching } = useBankAccounts();
  const createAccount = useCreateBankAccount();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountType, setAccountType] = useState<'checking' | 'savings' | 'cash'>('checking');

  const pagination = usePagination(accounts ?? []);

  const columns: GridColumn<BankAccount>[] = [
    { key: 'bankName', label: t('cash.bankAccounts.bank'), sortable: true },
    { key: 'accountNumber', label: t('cash.bankAccounts.accountNumber') },
    {
      key: 'accountType',
      label: t('cash.bankAccounts.type'),
      width: 100,
      render: (value) => t(`cash.bankAccounts.types.${String(value).toLowerCase()}`),
    },
    { key: 'currency', label: t('purchasing.priceListCurrency'), width: 80 },
    {
      key: 'isActive',
      label: t('cash.bankAccounts.active'),
      width: 70,
      render: (value) => (value ? t('common.yes') : t('common.no')),
    },
  ];

  const handleCreate = async () => {
    if (!name.trim() || !accountNumber.trim() || !bankName.trim()) return;
    await createAccount.mutateAsync({
      name: name.trim(),
      accountNumber: accountNumber.trim(),
      bankName: bankName.trim(),
      accountType,
    });
    setName('');
    setAccountNumber('');
    setBankName('');
    setAccountType('checking');
    setShowForm(false);
  };

  return (
    <ListPage
      title={t('cash.bankAccounts.title')}
      subtitle={t('cash.bankAccounts.subtitle')}
      contentClassName="gap-4"
      onRefresh={refetch}
      refreshing={isFetching}
      pagination={
        <ListPagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={pagination.total}
          totalPages={pagination.totalPages}
          onPageChange={pagination.setPage}
          onPageSizeChange={pagination.setPageSize}
        />
      }
      actions={
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover"
        >
          + {t('common.create')}
        </button>
      }
    >
      {showForm && (
        <div className="shrink-0 rounded-lg border border-border bg-surface p-4">
          <div className="mb-3 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">
                {t('cash.bankAccounts.name')}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded border border-border bg-bg px-2 py-1.5 text-xs text-text-primary focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">
                {t('cash.bankAccounts.accountNumber')}
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full rounded border border-border bg-bg px-2 py-1.5 text-xs text-text-primary focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">
                {t('cash.bankAccounts.bank')}
              </label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full rounded border border-border bg-bg px-2 py-1.5 text-xs text-text-primary focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">
                {t('cash.bankAccounts.type')}
              </label>
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value as any)}
                className="w-full rounded border border-border bg-bg px-2 py-1.5 text-xs text-text-primary focus:border-accent focus:outline-none"
              >
                <option value="checking">{t('cash.bankAccounts.types.checking')}</option>
                <option value="savings">{t('cash.bankAccounts.types.savings')}</option>
                <option value="cash">{t('cash.bankAccounts.types.cash')}</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={createAccount.isPending}
              className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
            >
              {t('common.save')}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-lg px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}
      <VirtualGrid
        data={pagination.pageItems}
        columns={columns}
        loading={isLoading}
        emptyMessage="No hay cuentas bancarias"
      />
    </ListPage>
  );
}
