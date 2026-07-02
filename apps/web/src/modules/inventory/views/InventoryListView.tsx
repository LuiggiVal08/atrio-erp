import { useInventoryStore, type InventoryProduct } from '../store/inventory-store';
import { useInventoryList } from '../hooks/useInventoryList';
import { VirtualGrid, type GridColumn } from '@/core/components/VirtualGrid';
import { KardexRow } from '../components/KardexRow';
import { useTranslation } from '@/shared/hooks/useTranslation';

export function InventoryListView() {
  const { t } = useTranslation();
  const { products, filter, setFilter, sortColumn, sortDirection, setSort, loading } = useInventoryStore();
  useInventoryList();

  const columns: GridColumn<InventoryProduct>[] = [
    { key: 'sku', label: t('inventory.product.sku'), width: 120, sortable: true },
    { key: 'name', label: t('inventory.product.name'), sortable: true },
    { key: 'category', label: t('inventory.categories'), width: 140, sortable: true },
    { key: 'stock', label: t('inventory.stock'), width: 100, align: 'right', sortable: true },
    { key: 'averageCost', label: t('inventory.product.cost'), width: 120, align: 'right', sortable: true },
    { key: 'unitPrice', label: t('inventory.product.price'), width: 120, align: 'right', sortable: true },
    {
      key: 'status',
      label: 'Status',
      width: 140,
      sortable: true,
      render: (_, row) => <KardexRow product={row} />,
    },
  ];

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-text-primary">{t('inventory.title')}</h1>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={t('common.search')}
            aria-label={t('common.search')}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none"
          />
          <span className="text-xs text-text-secondary">
            {products.length} {t('inventory.products')}
          </span>
        </div>
      </div>
      <VirtualGrid
        data={products}
        columns={columns}
        loading={loading}
        sortColumn={sortColumn as keyof InventoryProduct | undefined}
        sortDirection={sortDirection}
        onSort={(col) => setSort(col as keyof InventoryProduct)}
        emptyMessage={t('common.noResults')}
      />
    </div>
  );
}
