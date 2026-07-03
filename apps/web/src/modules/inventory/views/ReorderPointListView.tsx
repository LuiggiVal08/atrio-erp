import { useTranslation } from '@/shared/hooks/useTranslation';
import { useReorderPoints, type ReorderPoint } from '@/modules/inventory/hooks/useReorderPoints';
import { VirtualGrid, type GridColumn } from '@/core/components/VirtualGrid';

export function ReorderPointListView() {
  const { t } = useTranslation();
  const { data: reorderPoints, isLoading } = useReorderPoints();

  const columns: GridColumn<ReorderPoint>[] = [
    { key: 'productId', label: 'Product', sortable: true },
    { key: 'warehouseId', label: 'Warehouse' },
    { key: 'minQuantity', label: 'Min', width: 80, align: 'right' },
    { key: 'maxQuantity', label: 'Max', width: 80, align: 'right' },
    { key: 'createdAt', label: t('reports.history.date'), width: 130,
      render: (v) => new Date(v as string).toLocaleDateString() },
  ];

  return (
    <div className="flex h-full flex-col p-6">
      <h1 className="mb-4 text-lg font-bold text-text-primary">Reorder Points</h1>
      <VirtualGrid data={reorderPoints ?? []} columns={columns} loading={isLoading} emptyMessage="No reorder points" />
    </div>
  );
}
