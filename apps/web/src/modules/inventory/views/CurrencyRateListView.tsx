import { useState } from 'react';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { useCurrencyRates, useCreateCurrencyRate } from '../hooks/useCurrencyRates';
import { VirtualGrid, type GridColumn } from '@/core/components/VirtualGrid';
import type { CurrencyRate } from '../hooks/useCurrencyRates';

export function CurrencyRateListView() {
  const { t } = useTranslation();
  const { data: rates = [], isLoading } = useCurrencyRates();
  const createRate = useCreateCurrencyRate();

  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('VES');
  const [rate, setRate] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const handleAdd = () => {
    if (!rate || !date) return;
    createRate.mutate({
      fromCurrency,
      toCurrency,
      rate: Number(rate),
      date,
    });
    setRate('');
  };

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
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-lg font-bold text-text-primary">{t('localization.currencyRates')}</h1>

      <div className="rounded-lg border border-border bg-surface p-6">
        <h2 className="mb-4 text-sm font-bold text-text-primary">{t('localization.currencyRate.create')}</h2>
        <div className="grid grid-cols-5 gap-3">
          <select
            value={fromCurrency}
            onChange={(e) => setFromCurrency(e.target.value)}
            className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
          >
            <option value="USD">USD</option>
            <option value="VES">VES</option>
            <option value="EUR">EUR</option>
            <option value="COP">COP</option>
          </select>
          <select
            value={toCurrency}
            onChange={(e) => setToCurrency(e.target.value)}
            className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
          >
            <option value="VES">VES</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="COP">COP</option>
          </select>
          <input
            type="number"
            step="0.01"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            placeholder={t('localization.currencyRate.rate')}
            className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
          />
          <button
            onClick={handleAdd}
            disabled={createRate.isPending}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50"
          >
            {t('common.create')}
          </button>
        </div>
      </div>

      <VirtualGrid columns={columns} data={rates} loading={isLoading} emptyMessage={t('common.noResults')} />
    </div>
  );
}
