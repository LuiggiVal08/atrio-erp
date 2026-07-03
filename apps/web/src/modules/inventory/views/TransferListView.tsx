import { useState } from 'react';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { useTransfers, useCreateTransfer, type StockTransfer } from '@/modules/inventory/hooks/useTransfers';
import { VirtualGrid, type GridColumn } from '@/core/components/VirtualGrid';

export function TransferListView() {
  const { t } = useTranslation();
  const { data: transfers, isLoading } = useTransfers();
  const createMutation = useCreateTransfer();
  const [showForm, setShowForm] = useState(false);
  const [productId, setProductId] = useState('');
  const [fromWarehouseId, setFromWarehouseId] = useState('');
  const [toWarehouseId, setToWarehouseId] = useState('');
  const [quantity, setQuantity] = useState('1');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !fromWarehouseId || !toWarehouseId) return;
    await createMutation.mutateAsync({ productId, fromWarehouseId, toWarehouseId, quantity: parseInt(quantity) || 1 });
    setProductId(''); setFromWarehouseId(''); setToWarehouseId(''); setQuantity('1');
    setShowForm(false);
  };

  const columns: GridColumn<StockTransfer>[] = [
    { key: 'productId', label: 'Product', sortable: true },
    { key: 'fromWarehouseId', label: 'From' },
    { key: 'toWarehouseId', label: 'To' },
    { key: 'quantity', label: 'Qty', width: 80, align: 'right' },
    { key: 'status', label: 'Status', width: 100 },
    { key: 'createdAt', label: t('reports.history.date'), width: 130,
      render: (v) => new Date(v as string).toLocaleDateString() },
  ];

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-text-primary">Stock Transfers</h1>
        <button onClick={() => setShowForm(!showForm)} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90">
          New transfer
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-4 flex items-end gap-3 rounded-xl border border-border bg-surface p-4">
          <div><label className="mb-1 block text-xs text-text-secondary">Product ID</label><input type="text" value={productId} onChange={e => setProductId(e.target.value)} required className="w-full rounded border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none" /></div>
          <div><label className="mb-1 block text-xs text-text-secondary">From</label><input type="text" value={fromWarehouseId} onChange={e => setFromWarehouseId(e.target.value)} required className="w-full rounded border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none" /></div>
          <div><label className="mb-1 block text-xs text-text-secondary">To</label><input type="text" value={toWarehouseId} onChange={e => setToWarehouseId(e.target.value)} required className="w-full rounded border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none" /></div>
          <div className="w-20"><label className="mb-1 block text-xs text-text-secondary">Qty</label><input type="number" min={1} value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full rounded border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none" /></div>
          <button type="submit" disabled={createMutation.isPending} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">{t('common.create')}</button>
        </form>
      )}

      <VirtualGrid data={transfers ?? []} columns={columns} loading={isLoading} emptyMessage="No transfers" />
    </div>
  );
}
