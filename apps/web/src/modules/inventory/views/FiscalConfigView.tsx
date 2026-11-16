import { useState } from 'react';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { useTaxes, useCreateTax } from '../hooks/useTaxes';
import { VirtualGrid, type GridColumn } from '@/core/components/VirtualGrid';
import { ModuleSkeleton } from '@/core/components/ModuleSkeleton';
import { ReadErrorAlert } from '@/core/components/ReadErrorAlert';
import type { Tax } from '../hooks/useTaxes';

export function FiscalConfigView() {
  const { t } = useTranslation();
  const { data: taxes = [], isLoading, isError, error, refetch, isFetching } = useTaxes();
  const createTax = useCreateTax();

  const [name, setName] = useState('');
  const [rate, setRate] = useState('');
  const [type, setType] = useState<'percentage' | 'fixed'>('percentage');
  const [formError, setFormError] = useState('');

  const handleAdd = async () => {
    const value = Number(rate);
    if (!name.trim() || !rate || !Number.isFinite(value) || value <= 0) return;
    setFormError('');
    try {
      await createTax.mutateAsync({
        name: name.trim(),
        rate: type === 'percentage' ? value / 100 : value,
        type,
      });
      setName('');
      setRate('');
      setType('percentage');
    } catch (error: any) {
      const message = error?.response?.data?.message;
      setFormError(typeof message === 'string' ? message : t('common.saveUnconfirmed'));
    }
  };

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
        <div className="grid grid-cols-4 gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label={t('localization.tax.name')}
            placeholder={t('localization.tax.name')}
            className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
          />
          <input
            type="number"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            aria-label={t('localization.tax.rate')}
            placeholder={t('localization.tax.rate')}
            className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
          />
          <select
            value={type}
            aria-label="Tipo"
            onChange={(e) => setType(e.target.value as 'percentage' | 'fixed')}
            className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
          >
            <option value="percentage">Porcentaje</option>
            <option value="fixed">Monto fijo</option>
          </select>
          <button
            onClick={handleAdd}
            disabled={createTax.isPending}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50"
          >
            {t('common.create')}
          </button>
        </div>
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
