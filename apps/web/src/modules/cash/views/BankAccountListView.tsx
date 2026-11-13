import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { useBankAccounts, type BankAccount } from '@/modules/cash/hooks/useBankAccounts';
import { useCreateBankAccount } from '@/modules/cash/hooks/useCreateBankAccount';
import { VirtualGrid, type GridColumn } from '@/core/components/VirtualGrid';
import { ListPage } from '@/core/components/ListPage';
import { ListPagination } from '@/core/components/ListPagination';
import { usePagination } from '@/shared/hooks/usePagination';
import { applyServerErrors, resolveServerErrorMessage, clearServerErrors, FormInput, FormSelect } from '@/shared/form';
import {
  bankAccountFormSchema,
  type BankAccountFormValues,
} from '@/shared/validation/bank-account';

const defaultValues: BankAccountFormValues = {
  name: '',
  accountNumber: '',
  bankName: '',
  accountType: 'checking',
};

export function BankAccountListView() {
  const { t } = useTranslation();
  const { data: accounts, isLoading, refetch, isFetching } = useBankAccounts();
  const createAccount = useCreateBankAccount();
  const [showForm, setShowForm] = useState(false);
  const [serverError, setServerError] = useState('');

  const form = useForm({
    defaultValues,
    validators: { onSubmit: bankAccountFormSchema },
    onSubmit: async ({ value }) => {
      setServerError('');
      try {
        await createAccount.mutateAsync({
          name: value.name.trim(),
          accountNumber: value.accountNumber.trim(),
          bankName: value.bankName.trim(),
          accountType: value.accountType,
        });
        form.reset();
        setShowForm(false);
      } catch (error) {
        const result = applyServerErrors(form, error);
        setServerError(resolveServerErrorMessage(result, t('common.saveUnconfirmed')));
      }
    },
  });

  const toggleForm = () => {
    clearServerErrors(form);
    setServerError('');
    setShowForm((visible) => !visible);
  };

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
          onClick={toggleForm}
          className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover"
        >
          + {t('common.create')}
        </button>
      }
    >
      {showForm && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
          className="shrink-0 rounded-lg border border-border bg-surface p-4"
        >
          <div className="mb-3 grid grid-cols-2 gap-3">
            <FormInput
              form={form}
              name="name"
              label={t('cash.bankAccounts.name')}
              required
            />
            <FormInput
              form={form}
              name="accountNumber"
              label={t('cash.bankAccounts.accountNumber')}
              required
            />
            <FormInput
              form={form}
              name="bankName"
              label={t('cash.bankAccounts.bank')}
              required
            />
            <FormSelect
              form={form}
              name="accountType"
              label={t('cash.bankAccounts.type')}
              options={[
                { value: 'checking', label: t('cash.bankAccounts.types.checking') },
                { value: 'savings', label: t('cash.bankAccounts.types.savings') },
                { value: 'cash', label: t('cash.bankAccounts.types.cash') },
              ]}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createAccount.isPending}
              className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
            >
              {t('common.save')}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary"
            >
              {t('common.cancel')}
            </button>
          </div>
          {serverError && (
            <p role="alert" className="mt-2 text-xs text-red-500">
              {serverError}
            </p>
          )}
        </form>
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
