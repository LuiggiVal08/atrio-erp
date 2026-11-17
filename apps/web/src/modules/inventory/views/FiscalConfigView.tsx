import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { applyServerErrors, clearServerErrors, FormInput, FormSelect, resolveServerErrorMessage } from '@/shared/form';
import { taxFormSchema, type TaxFormValues } from '@/shared/validation/tax';
import { useTaxes, useCreateTax } from '../hooks/useTaxes';
import { VirtualGrid, type GridColumn } from '@/core/components/VirtualGrid';
import { ModuleSkeleton } from '@/core/components/ModuleSkeleton';
import { ReadErrorAlert } from '@/core/components/ReadErrorAlert';
import type { Tax } from '../hooks/useTaxes';

export function FiscalConfigView() {
  const { t } = useTranslation();
  const { data: taxes = [], isLoading, isError, error, refetch, isFetching } = useTaxes();
  const createTax = useCreateTax();

  const [formError, setFormError] = useState('');

  const form = useForm({
    defaultValues: {
      name: '',
      rate: '',
      type: 'percentage',
    } as TaxFormValues,
    validators: { onSubmit: taxFormSchema },
    onSubmit: async ({ value }) => {
      setFormError('');
      const rate = Number(value.rate);
      try {
        await createTax.mutateAsync({
          name: value.name.trim(),
          rate: value.type === 'percentage' ? rate / 100 : rate,
          type: value.type,
        });
        clearServerErrors(form);
        form.reset();
      } catch (error) {
        const result = applyServerErrors(form, error);
        setFormError(resolveServerErrorMessage(result, t('common.saveUnconfirmed')));
      }
    },
  });

  const columns: GridColumn<Tax>[] = [
    { key: 'name', label: t('localization.tax.name'), sortable: true },
    {
      key: 'rate', label: t('localization.tax.rate'), width: 120, align: 'right',
      render: (v, row) => row.type === 'fixed'
        ? Number(v).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
        : `${(Number(v) * 100).toFixed(2)}%`,
    },
    { key: 'type', label: 'Tipo', width: 120 },
    {
      key: 'isActive', label: 'Activo', width: 80,
      render: (v) => (v ? '✓' : '—'),
    },
  ];

  if (isLoading) {
    return <ModuleSkeleton moduleName={t('localization.title')} />;
  }
  if (isError && taxes.length === 0) {
    return <div className="p-6"><ReadErrorAlert error={error} onRetry={() => void refetch()} retrying={isFetching} /></div>;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <h1 className="text-lg font-bold text-text-primary">{t('localization.title')}</h1>
      </div>
      <div className="flex-1 overflow-auto space-y-6 p-6">
        <div className="rounded-lg border border-border bg-surface p-6">
        <h2 className="mb-4 text-sm font-bold text-text-primary">{t('localization.tax.create')}</h2>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
          className="grid grid-cols-4 items-start gap-3"
        >
          <FormInput
            form={form}
            name="name"
            ariaLabel={t('localization.tax.name')}
            placeholder={t('localization.tax.name')}
            required
          />
          <FormInput
            form={form}
            name="rate"
            ariaLabel={t('localization.tax.rate')}
            placeholder={t('localization.tax.rate')}
            inputMode="decimal"
            required
          />
          <FormSelect
            form={form}
            name="type"
            ariaLabel="Tipo"
            options={[
              { value: 'percentage', label: 'Porcentaje' },
              { value: 'fixed', label: 'Monto fijo' },
            ]}
          />
          <button
            type="submit"
            disabled={createTax.isPending}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50"
          >
            {t('common.create')}
          </button>
        </form>
        {formError && (
          <p role="alert" className="mt-3 text-xs text-red-500">{formError}</p>
        )}
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <VirtualGrid columns={columns} data={taxes} loading={isLoading} emptyMessage={t('common.noResults')} />
      </div>
      </div>
    </div>
  );
}
