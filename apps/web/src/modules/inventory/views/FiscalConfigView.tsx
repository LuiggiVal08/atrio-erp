import { useState } from 'react';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { useTaxes, useCreateTax } from '../hooks/useTaxes';
import { VirtualGrid, type GridColumn } from '@/core/components/VirtualGrid';
import type { Tax } from '../hooks/useTaxes';

export function FiscalConfigView() {
  const { t } = useTranslation();
  const { data: taxes = [], isLoading } = useTaxes();
  const createTax = useCreateTax();

  const [name, setName] = useState('');
  const [rate, setRate] = useState('');
  const [category, setCategory] = useState('general');
  const [isExempt, setIsExempt] = useState(false);

  const handleAdd = () => {
    if (!name.trim() || !rate) return;
    createTax.mutate({ name: name.trim(), rate: Number(rate) / 100, category, isExempt });
    setName('');
    setRate('');
    setIsExempt(false);
  };

  const columns: GridColumn<Tax>[] = [
    { key: 'name', label: t('localization.tax.name'), sortable: true },
    { key: 'rate', label: t('localization.tax.rate'), width: 100, align: 'right', render: (v) => `${(Number(v) * 100).toFixed(2)}%` },
    { key: 'category', label: t('localization.tax.category'), width: 120 },
    {
      key: 'isExempt', label: t('localization.tax.exempt'), width: 100,
      render: (v) => (v ? '✓' : '—'),
    },
  ];

  if (isLoading) {
    return <div className="flex h-full items-center justify-center text-text-secondary">{t('common.loading')}</div>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-lg font-bold text-text-primary">{t('localization.title')}</h1>

      <div className="rounded-lg border border-border bg-surface p-6">
        <h2 className="mb-4 text-sm font-bold text-text-primary">{t('localization.tax.create')}</h2>
        <div className="grid grid-cols-5 gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('localization.tax.name')}
            className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
          />
          <input
            type="number"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            placeholder={t('localization.tax.rate')}
            className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
          >
            <option value="general">General</option>
            <option value="reduced">Reduced</option>
            <option value="luxury">Luxury</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-text-secondary">
            <input type="checkbox" checked={isExempt} onChange={(e) => setIsExempt(e.target.checked)} />
            {t('localization.tax.exempt')}
          </label>
          <button
            onClick={handleAdd}
            disabled={createTax.isPending}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50"
          >
            {t('common.create')}
          </button>
        </div>
      </div>

      <VirtualGrid columns={columns} data={taxes} loading={isLoading} emptyMessage={t('common.noResults')} />
    </div>
  );
}
