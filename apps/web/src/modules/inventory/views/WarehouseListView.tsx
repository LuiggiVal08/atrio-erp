import { useTranslation } from '@/shared/hooks/useTranslation';
import { useWarehouses, type Warehouse } from '@/modules/inventory/hooks/useWarehouses';
import { VirtualGrid, type GridColumn } from '@/core/components/VirtualGrid';

export function WarehouseListView() {
  const { t } = useTranslation();
  const { data: warehouses, isLoading } = useWarehouses();

  const columns: GridColumn<Warehouse>[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'isActive', label: 'Active', width: 80,
      render: (v) => v ? 'Yes' : 'No' },
    { key: 'createdAt', label: t('reports.history.date'), width: 130,
      render: (v) => new Date(v as string).toLocaleDateString() },
  ];

  return (
    <div className="flex h-full flex-col p-6">
      <h1 className="mb-4 text-lg font-bold text-text-primary">{t('inventory.warehouses')}</h1>
      <VirtualGrid data={warehouses ?? []} columns={columns} loading={isLoading} emptyMessage="No warehouses" />
    </div>
  );
}
