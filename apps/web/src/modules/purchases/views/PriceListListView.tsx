import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from '@tanstack/react-form';
import { useTranslation } from '@/shared/hooks/useTranslation';
import {
  usePriceLists,
  useCreatePriceList,
  type PriceList,
} from '@/modules/purchases/hooks/usePriceLists';
import { VirtualGrid, type GridColumn } from '@/core/components/VirtualGrid';
import { ListPagination } from '@/core/components/ListPagination';
import { usePagination } from '@/shared/hooks/usePagination';
import { applyServerErrors, resolveServerErrorMessage, clearServerErrors, FormInput, FormSelect } from '@/shared/form';
import {
  priceListFormSchema,
  type PriceListFormValues,
} from '@/shared/validation/price-list';
import { RotateCw } from 'lucide-react';

const defaultValues: PriceListFormValues = { name: '', type: 'purchase' };

export function PriceListListView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: priceLists, isLoading, refetch, isFetching } = usePriceLists();
  const createMutation = useCreatePriceList();
  const [showForm, setShowForm] = useState(false);
  const [serverError, setServerError] = useState('');

  const form = useForm({
    defaultValues,
    validators: { onSubmit: priceListFormSchema },
    onSubmit: async ({ value }) => {
      setServerError('');
      try {
        await createMutation.mutateAsync({ name: value.name.trim(), type: value.type });
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

  const pagination = usePagination(priceLists ?? []);

  const columns: GridColumn<PriceList>[] = [
    { key: 'name', label: t('purchasing.priceListName'), sortable: true },
    { key: 'type', label: t('purchasing.priceListType'), width: 100 },
    { key: 'currency', label: t('purchasing.priceListCurrency'), width: 80 },
    {
      key: 'isActive',
      label: t('purchasing.priceListActive'),
      width: 70,
      render: (v) => (v ? t('common.yes') : t('common.no')),
    },
    {
      key: 'createdAt',
      label: t('reports.history.date'),
      width: 130,
      render: (v) => new Date(v as string).toLocaleDateString(),
    },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <h1 className="text-lg font-bold text-text-primary">{t('purchasing.priceLists')}</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
            aria-label={t('common.refresh')}
            title={t('common.refresh')}
            className="rounded-lg border border-border p-1.5 text-text-secondary transition-colors hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCw size={14} aria-hidden="true" className={isFetching ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={toggleForm}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            {t('purchasing.createPriceList')}
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-6">
        {showForm && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void form.handleSubmit();
            }}
            className="mb-4 rounded-xl border border-border bg-surface p-4"
          >
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <FormInput
                  form={form}
                  name="name"
                  label={t('purchasing.priceListName')}
                  required
                />
              </div>
              <div className="w-32">
                <FormSelect
                  form={form}
                  name="type"
                  label={t('purchasing.priceListType')}
                  options={[
                    { value: 'purchase', label: t('purchasing.priceListTypes.purchase') },
                    { value: 'sale', label: t('purchasing.priceListTypes.sale') },
                  ]}
                />
              </div>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                {t('common.create')}
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
          emptyMessage={t('purchasing.priceListEmpty')}
          onRowClick={(row) => navigate(`/purchasing/price-lists/${row.id}`)}
        />
        <div className="mt-3 border-t border-border pt-3">
          <ListPagination
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            totalPages={pagination.totalPages}
            onPageChange={pagination.setPage}
            onPageSizeChange={pagination.setPageSize}
          />
        </div>
      </div>
    </div>
  );
}
