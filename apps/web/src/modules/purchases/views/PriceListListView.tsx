import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { usePriceLists, useCreatePriceList, type PriceList } from '@/modules/purchases/hooks/usePriceLists';
import { VirtualGrid, type GridColumn } from '@/core/components/VirtualGrid';

export function PriceListListView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: priceLists, isLoading } = usePriceLists();
  const createMutation = useCreatePriceList();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('purchase');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await createMutation.mutateAsync({ name: name.trim(), type });
    setName('');
    setType('purchase');
    setShowForm(false);
  };

  const columns: GridColumn<PriceList>[] = [
    { key: 'name', label: t('purchasing.priceListName'), sortable: true },
    { key: 'type', label: t('purchasing.priceListType'), width: 100 },
    { key: 'currency', label: t('purchasing.priceListCurrency'), width: 80 },
    { key: 'isActive', label: 'Active', width: 70,
      render: (v) => v ? 'Yes' : 'No' },
    { key: 'createdAt', label: t('reports.history.date'), width: 130,
      render: (v) => new Date(v as string).toLocaleDateString() },
  ];

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-text-primary">{t('purchasing.priceLists')}</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          {t('purchasing.createPriceList')}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-4 flex items-end gap-3 rounded-xl border border-border bg-surface p-4">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-text-secondary">{t('purchasing.priceListName')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
            />
          </div>
          <div className="w-32">
            <label className="mb-1 block text-xs text-text-secondary">{t('purchasing.priceListType')}</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
            >
              <option value="purchase">Purchase</option>
              <option value="sale">Sale</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {t('common.create')}
          </button>
        </form>
      )}

      <VirtualGrid
        data={priceLists ?? []}
        columns={columns}
        loading={isLoading}
        emptyMessage="No price lists"
        onRowClick={(row) => navigate(`/purchasing/price-lists/${row.id}`)}
      />
    </div>
  );
}
