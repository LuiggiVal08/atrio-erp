import { useState } from 'react';
import { useForm, useStore } from '@tanstack/react-form';
import { useTranslation } from '@/shared/hooks/useTranslation';
import {
  useCurrencyRates,
  useCreateCurrencyRate,
  useSyncCurrencyRate,
} from '../hooks/useCurrencyRates';
import { VirtualGrid, type GridColumn } from '@/core/components/VirtualGrid';
import { ListPagination } from '@/core/components/ListPagination';
import { usePagination } from '@/shared/hooks/usePagination';
import { RotateCw } from 'lucide-react';
import type { CurrencyRate } from '../hooks/useCurrencyRates';
import {
  applyServerErrors,
  FormInput,
  FormSelect,
  resolveServerErrorMessage,
} from '@/shared/form';
import {
  currencyRateFormSchema,
  type CurrencyRateFormValues,
} from '@/shared/validation/currency-rate';

export function CurrencyRateListView() {
  const { t } = useTranslation();
  const { data: rates = [], isLoading, refetch, isFetching } = useCurrencyRates();
  const createRate = useCreateCurrencyRate();
  const syncRate = useSyncCurrencyRate();

  const [providerChain, setProviderChain] = useState('automatic');
  const [serverError, setServerError] = useState('');
  const [confirmSync, setConfirmSync] = useState(false);

  const defaultValues: CurrencyRateFormValues = {
    fromCurrency: 'USD',
    toCurrency: 'VES',
    rate: undefined,
    date: new Date().toISOString().slice(0, 10),
  };

  const form = useForm({
    defaultValues,
    validators: { onSubmit: currencyRateFormSchema },
    onSubmit: async ({ value }) => {
      setServerError('');
      try {
        await createRate.mutateAsync({
          fromCurrency: value.fromCurrency,
          toCurrency: value.toCurrency,
          rate: value.rate as number,
          date: value.date,
        });
        form.setFieldValue('rate', undefined);
      } catch (error) {
        const result = applyServerErrors(form, error);
        setServerError(
          resolveServerErrorMessage(
            result,
            'No se pudo registrar la tasa. Verifica los datos y vuelve a intentar.',
          ),
        );
      }
    },
  });

  const fromCurrency = useStore(form.store, (state) => state.values.fromCurrency);
  const toCurrency = useStore(form.store, (state) => state.values.toCurrency);
  const rate = useStore(form.store, (state) => state.values.rate);
  const date = useStore(form.store, (state) => state.values.date);

  const handleSync = () => {
    if (fromCurrency === toCurrency) return;
    syncRate.mutate({
      fromCurrency,
      toCurrency,
      providerIds:
        providerChain === 'automatic'
          ? undefined
          : providerChain === 'open-er-api'
            ? ['open-er-api', 'frankfurter']
            : ['frankfurter', 'open-er-api'],
    });
    setConfirmSync(false);
  };

  const pagination = usePagination(rates);

  const columns: GridColumn<CurrencyRate>[] = [
    { key: 'fromCurrency', label: t('localization.currencyRate.from'), width: 100 },
    { key: 'toCurrency', label: t('localization.currencyRate.to'), width: 100 },
    { key: 'rate', label: t('localization.currencyRate.rate'), width: 120, align: 'right' },
    { key: 'date', label: t('localization.currencyRate.date'), width: 140, sortable: true },
  ];

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-text-secondary">
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <h1 className="text-lg font-bold text-text-primary">{t('localization.currencyRates')}</h1>
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
      </div>
      <div className="flex-1 overflow-auto space-y-6 p-6">
        <div className="rounded-lg border border-border bg-surface p-6">
          <h2 className="mb-4 text-sm font-bold text-text-primary">
            {t('localization.currencyRate.create')}
          </h2>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void form.handleSubmit();
            }}
            className="grid gap-3 md:grid-cols-2 xl:grid-cols-5"
          >
            <FormSelect
              form={form}
              name="fromCurrency"
              label={t('localization.currencyRate.from')}
              options={['USD', 'VES', 'EUR', 'COP'].map((value) => ({ value, label: value }))}
            />
            <FormSelect
              form={form}
              name="toCurrency"
              label={t('localization.currencyRate.to')}
              options={['VES', 'USD', 'EUR', 'COP'].map((value) => ({ value, label: value }))}
            />
            <FormInput
              form={form}
              name="rate"
              type="number"
              min="0.000001"
              step="any"
              label={t('localization.currencyRate.rate')}
              placeholder={t('localization.currencyRate.rate')}
            />
            <FormInput
              form={form}
              name="date"
              type="date"
              label={t('localization.currencyRate.date')}
            />
            <button
              type="submit"
              disabled={createRate.isPending || !rate || !date || fromCurrency === toCurrency}
              className="mt-auto rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('common.create')}
            </button>
          </form>
          {fromCurrency === toCurrency && (
            <p role="alert" className="mt-3 text-sm text-error">
              Selecciona dos monedas diferentes.
            </p>
          )}
          {serverError && (
            <p role="alert" className="mt-3 text-sm text-error">
              {serverError}
            </p>
          )}
        </div>

        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <label className="w-full max-w-sm space-y-1 text-xs font-medium text-text-secondary">
              <span>Proveedor y orden de respaldo</span>
              <select
                value={providerChain}
                onChange={(e) => setProviderChain(e.target.value)}
                className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
              >
                <option value="automatic">Automático (incluye proveedores configurados)</option>
                <option value="open-er-api">Open ER API primero</option>
                <option value="frankfurter">Frankfurter primero</option>
              </select>
            </label>
            <button
              type="button"
              onClick={() => setConfirmSync(true)}
              disabled={syncRate.isPending || fromCurrency === toCurrency}
              className="rounded-lg border border-accent px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent-alpha disabled:cursor-not-allowed disabled:opacity-50"
            >
              {syncRate.isPending ? 'Consultando proveedores...' : 'Actualizar automáticamente'}
            </button>
          </div>
          {confirmSync && (
            <div role="alertdialog" aria-label="Confirmar actualización de tasa" className="mt-3 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-text-primary">
              <p>
                Se consultará el proveedor y, si ya existe una tasa para la fecha devuelta, se
                reemplazará. Los documentos ya emitidos conservan su tasa registrada.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleSync}
                  disabled={syncRate.isPending}
                  className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
                >
                  Confirmar actualización
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmSync(false)}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
          {syncRate.isSuccess && (
            <p className="mt-3 text-sm text-success">
              Tasa actualizada desde {syncRate.data.provider}: 1 {syncRate.data.fromCurrency} ={' '}
              {syncRate.data.rate} {syncRate.data.toCurrency}.
            </p>
          )}
          {syncRate.isError && (
            <p className="mt-3 text-sm text-error">
              Ningún proveedor respondió. Puedes registrar la tasa manualmente o probar otro
              proveedor.
            </p>
          )}
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="mb-3 text-xs text-text-secondary">
            Las tasas se guardan por moneda y fecha. La lista no conserva el proveedor de origen de
            cada fila; la confirmación de sincronización indica el proveedor que respondió.
          </p>
          <VirtualGrid
            columns={columns}
            data={pagination.pageItems}
            loading={isLoading}
            emptyMessage={t('common.noResults')}
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
    </div>
  );
}
