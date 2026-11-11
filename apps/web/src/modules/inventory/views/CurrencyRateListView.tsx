import { useState } from 'react';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { useCurrencyRates, useCreateCurrencyRate, useSyncCurrencyRate } from '../hooks/useCurrencyRates';
import { VirtualGrid, type GridColumn } from '@/core/components/VirtualGrid';
import type { CurrencyRate } from '../hooks/useCurrencyRates';

export function CurrencyRateListView() {
  const { t } = useTranslation();
  const { data: rates = [], isLoading } = useCurrencyRates();
  const createRate = useCreateCurrencyRate();
  const syncRate = useSyncCurrencyRate();

  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('VES');
  const [rate, setRate] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [providerChain, setProviderChain] = useState('automatic');

  const handleAdd = () => {
    const parsedRate = Number(rate);
    if (!rate || !date || !Number.isFinite(parsedRate) || parsedRate <= 0 || fromCurrency === toCurrency) return;
    createRate.mutate({
      fromCurrency,
      toCurrency,
      rate: parsedRate,
      date,
    });
    setRate('');
  };

  const handleSync = () => {
    if (fromCurrency === toCurrency) return;
    syncRate.mutate({
      fromCurrency,
      toCurrency,
      providerIds: providerChain === 'automatic'
        ? undefined
        : providerChain === 'open-er-api'
          ? ['open-er-api', 'frankfurter']
          : providerChain === 'custom'
            ? undefined
          : ['frankfurter', 'open-er-api'],
    });
  };

  const isValid = Boolean(rate && date && Number(rate) > 0 && fromCurrency !== toCurrency);

  const columns: GridColumn<CurrencyRate>[] = [
    { key: 'fromCurrency', label: t('localization.currencyRate.from'), width: 100 },
    { key: 'toCurrency', label: t('localization.currencyRate.to'), width: 100 },
    { key: 'rate', label: t('localization.currencyRate.rate'), width: 120, align: 'right' },
    { key: 'date', label: t('localization.currencyRate.date'), width: 140, sortable: true },
  ];

  if (isLoading) {
    return <div className="flex h-full items-center justify-center text-text-secondary">{t('common.loading')}</div>;
  }

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <h1 className="text-lg font-bold text-text-primary">{t('localization.currencyRates')}</h1>
      </div>
      <div className="flex-1 overflow-auto space-y-6 p-6">
        <div className="rounded-lg border border-border bg-surface p-6">
        <h2 className="mb-4 text-sm font-bold text-text-primary">{t('localization.currencyRate.create')}</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <label className="space-y-1 text-xs font-medium text-text-secondary">
            <span>{t('localization.currencyRate.from')}</span>
          <select
            value={fromCurrency}
            onChange={(e) => setFromCurrency(e.target.value)}
            className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            <option value="USD">USD</option>
            <option value="VES">VES</option>
            <option value="EUR">EUR</option>
            <option value="COP">COP</option>
          </select>
          </label>
          <label className="space-y-1 text-xs font-medium text-text-secondary">
            <span>{t('localization.currencyRate.to')}</span>
          <select
            value={toCurrency}
            onChange={(e) => setToCurrency(e.target.value)}
            className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            <option value="VES">VES</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="COP">COP</option>
          </select>
          </label>
          <label className="space-y-1 text-xs font-medium text-text-secondary">
            <span>{t('localization.currencyRate.rate')}</span>
          <input
            type="number"
            min="0.000001"
            step="any"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            placeholder={t('localization.currencyRate.rate')}
            className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
          </label>
          <label className="space-y-1 text-xs font-medium text-text-secondary">
            <span>{t('localization.currencyRate.date')}</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
          </label>
          <button
            onClick={handleAdd}
            disabled={createRate.isPending || !isValid}
            className="mt-auto rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('common.create')}
          </button>
        </div>
        {fromCurrency === toCurrency && (
          <p className="mt-3 text-sm text-error">Selecciona dos monedas diferentes.</p>
        )}
        {createRate.isError && (
          <p className="mt-3 text-sm text-error">No se pudo registrar la tasa. Verifica los datos y vuelve a intentar.</p>
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
              <option value="automatic">Automático</option>
              <option value="open-er-api">Open ER API primero</option>
              <option value="frankfurter">Frankfurter primero</option>
              <option value="custom">Proveedores personalizados</option>
            </select>
          </label>
          <button
            type="button"
            onClick={handleSync}
            disabled={syncRate.isPending || fromCurrency === toCurrency}
            className="rounded-lg border border-accent px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent-alpha disabled:cursor-not-allowed disabled:opacity-50"
          >
            {syncRate.isPending ? 'Consultando proveedores...' : 'Actualizar automáticamente'}
          </button>
        </div>
        {syncRate.isSuccess && (
          <p className="mt-3 text-sm text-success">
            Tasa actualizada desde {syncRate.data.provider}: 1 {syncRate.data.fromCurrency} = {syncRate.data.rate} {syncRate.data.toCurrency}.
          </p>
        )}
        {syncRate.isError && (
          <p className="mt-3 text-sm text-error">
            Ningún proveedor respondió. Puedes registrar la tasa manualmente o probar otro proveedor.
          </p>
        )}
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <VirtualGrid columns={columns} data={rates} loading={isLoading} emptyMessage={t('common.noResults')} />
      </div>
      </div>
    </div>
  );
}
