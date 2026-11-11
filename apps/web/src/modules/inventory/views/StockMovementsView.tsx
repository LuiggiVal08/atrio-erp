import { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, PackageSearch, SlidersHorizontal } from 'lucide-react';
import { VirtualGrid, type GridColumn } from '@/core/components/VirtualGrid';
import { Modal } from '@/core/components/Modal';
import { toastService } from '@/core/services/toast-service';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { useTenantStore } from '@/core/tenant/store';
import { useTenant } from '@/modules/settings/hooks/useTenant';
import { useBranches } from '../hooks/useBranches';
import { useWarehouses } from '../hooks/useWarehouses';
import {
  useAdjustStock,
  useAllStockMovements,
  useStockBalances,
  type StockBalance,
} from '../hooks/useStockMovements';

export function StockMovementsView() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'balances' | 'movements'>('balances');
  const [branchId, setBranchId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [search, setSearch] = useState('');
  const [adjusting, setAdjusting] = useState<StockBalance | null>(null);
  const [adjustType, setAdjustType] = useState<'in' | 'out'>('in');
  const [adjustQuantity, setAdjustQuantity] = useState('1');
  const [reason, setReason] = useState('');
  const [lotNumber, setLotNumber] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [expirationDate, setExpirationDate] = useState('');

  const tenantId = useTenantStore((state) => state.activeTenantId);
  const { data: tenant } = useTenant(tenantId);
  const currency = tenant?.baseCurrency === 'VED' ? 'VES' : (tenant?.baseCurrency || 'VES');
  const formatMoney = useMemo(
    () => (value: number) => new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value),
    [currency],
  );

  const { data: branches } = useBranches();
  const { data: warehouses } = useWarehouses();
  const { data: balances = [], isLoading: loadingBalances } = useStockBalances();
  const { data: movements = [], isLoading: loadingMovements } = useAllStockMovements();
  const adjustStock = useAdjustStock();

  const warehouseOptions = (warehouses ?? []).filter(
    (warehouse) => !branchId || warehouse.branchId === branchId,
  );

  const filteredBalances = balances.filter((row) => {
    const matchesWarehouse = !warehouseId || row.warehouseId === warehouseId;
    const matchesBranch = !branchId || row.warehouse.branchId === branchId;
    const needle = search.trim().toLowerCase();
    const matchesSearch = !needle ||
      row.product.name.toLowerCase().includes(needle) ||
      row.product.sku.toLowerCase().includes(needle);
    return matchesWarehouse && matchesBranch && matchesSearch;
  });

  const filteredMovements = movements.filter((row) => {
    const matchesWarehouse = !warehouseId || row.warehouseId === warehouseId;
    const matchesBranch = !branchId || row.warehouse?.branchId === branchId;
    const needle = search.trim().toLowerCase();
    const matchesSearch = !needle ||
      row.product?.name?.toLowerCase().includes(needle) ||
      row.product?.sku?.toLowerCase().includes(needle) ||
      row.referenceId?.toLowerCase().includes(needle);
    return matchesWarehouse && matchesBranch && matchesSearch;
  });

  const handleAdjust = async () => {
    if (!adjusting || !reason.trim() || Number(adjustQuantity) <= 0) return;
    try {
      await adjustStock.mutateAsync({
        productId: adjusting.productId,
        warehouseId: adjusting.warehouseId,
        type: adjustType,
        quantity: Number(adjustQuantity),
        reason: reason.trim(),
        lotNumber: lotNumber || undefined,
        serialNumber: serialNumber || undefined,
        expirationDate: expirationDate || undefined,
      });
      toastService.success(t('inventory.stockView.adjustSuccessTitle'), t('inventory.stockView.adjustSuccessBody'));
      setAdjusting(null);
      setReason('');
      setAdjustQuantity('1');
      setLotNumber(''); setSerialNumber(''); setExpirationDate('');
    } catch {
      toastService.error(t('inventory.stockView.adjustErrorTitle'), t('inventory.stockView.adjustErrorBody'));
    }
  };

  const balanceColumns: GridColumn<StockBalance>[] = [
    { key: 'product', label: t('inventory.stockView.product'), sortable: true, render: (_v, row) => (
      <div><div className="font-medium text-text-primary">{row.product.name}</div><div className="text-xs text-text-secondary">{row.product.sku}</div></div>
    ) },
    { key: 'warehouse', label: t('inventory.stockView.warehouse'), sortable: true, render: (_v, row) => (
      <div><div className="font-medium">{row.warehouse.name}</div><div className="text-xs text-text-secondary">{row.warehouse.code || '—'}</div></div>
    ) },
    { key: 'quantity', label: t('inventory.stockView.quantity'), width: 110, align: 'right', render: (value, row) => {
      const quantity = Number(value);
      const low = quantity <= Number(row.product.minStock ?? 0);
      const over = row.product.maxStock != null && quantity > Number(row.product.maxStock);
      return <span className={low ? 'font-semibold text-error' : over ? 'font-semibold text-warning' : 'font-semibold text-text-primary'}>
        {quantity} <span className="font-normal text-text-secondary">{row.product.baseUnit || 'unidad'}</span>
      </span>;
    } },
    { key: 'limits', label: t('inventory.stockView.limits'), width: 160, align: 'right', render: (_v, row) =>
      <span className="text-xs text-text-secondary">
        {Number(row.product.minStock ?? 0)} / {row.product.maxStock ?? '—'} / {Number(row.product.reorderPoint ?? 0)}
      </span>,
    },
    { key: 'cost', label: t('inventory.stockView.totalCost'), width: 120, align: 'right', render: (_v, row) =>
      formatMoney(Number(row.quantity) * Number(row.product.costPrice ?? 0)),
    },
    { key: 'updatedAt', label: t('inventory.stockView.updatedAt'), width: 150, render: (value) =>
      new Date(value as string).toLocaleString(),
    },
    { key: 'actions', label: '', width: 130, align: 'right', render: (_v, row) => (
      <button type="button" onClick={(event) => { event.stopPropagation(); setAdjusting(row); }}
        className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:border-accent hover:text-accent">
        <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" /> {t('inventory.stockView.adjust')}
      </button>
    ) },
  ];

  const movementColumns: GridColumn<(typeof movements)[number]>[] = [
    { key: 'createdAt', label: t('inventory.stockView.date'), width: 150, render: (value) => new Date(value as string).toLocaleString() },
    { key: 'product', label: t('inventory.stockView.product'), render: (_v, row) => `${row.product?.sku ? `${row.product.sku} · ` : ''}${row.product?.name ?? row.productId}` },
    { key: 'warehouse', label: t('inventory.stockView.warehouse'), render: (_v, row) => row.warehouse?.name ?? row.warehouseId },
    { key: 'type', label: t('inventory.stockView.type'), width: 120, render: (value) => {
      const isIn = value === 'in';
      return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${isIn ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
        {isIn ? <ArrowDownLeft className="h-3 w-3" aria-hidden="true" /> : <ArrowUpRight className="h-3 w-3" aria-hidden="true" />}
        {isIn ? t('inventory.stockView.entry') : value === 'out' ? t('inventory.stockView.exit') : String(value)}
      </span>;
    } },
    { key: 'quantity', label: t('inventory.stockView.amount'), width: 100, align: 'right' },
    { key: 'referenceId', label: t('inventory.stockView.reference'), render: (value, row) => String(value || row.referenceType || '—') },
    { key: 'balanceAfter', label: t('inventory.stockView.balance'), width: 120, align: 'right', render: (_v, row) =>
      row.balanceBefore != null && row.balanceAfter != null
        ? `${row.balanceBefore} → ${row.balanceAfter}`
        : '—',
    },
    { key: 'userName', label: t('inventory.stockView.user'), width: 140, render: (value) => String(value || t('inventory.stockView.systemUser')) },
  ];

  const emptyMessage = search.trim()
    ? tab === 'balances' ? t('inventory.stockView.noMatchBalances') : t('inventory.stockView.noMatchMovements')
    : tab === 'balances' ? t('inventory.stockView.emptyBalances') : t('inventory.stockView.emptyMovements');

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-accent/10 p-2 text-accent"><PackageSearch className="h-5 w-5" aria-hidden="true" /></div>
          <div>
            <h1 className="text-lg font-semibold text-text-primary">{t('inventory.stockView.title')}</h1>
            <p className="text-sm text-text-secondary">{t('inventory.stockView.subtitle')}</p>
          </div>
        </div>
      </div>
      <div role="tablist" aria-label={t('inventory.stockView.title')} className="flex items-center gap-2 border-b border-border px-6">
        <button role="tab" aria-selected={tab === 'balances'} onClick={() => setTab('balances')} className={`border-b-2 px-1 py-3 text-sm font-medium ${tab === 'balances' ? 'border-accent text-accent' : 'border-transparent text-text-secondary'}`}>{t('inventory.stockView.tabBalances')}</button>
        <button role="tab" aria-selected={tab === 'movements'} onClick={() => setTab('movements')} className={`border-b-2 px-1 py-3 text-sm font-medium ${tab === 'movements' ? 'border-accent text-accent' : 'border-transparent text-text-secondary'}`}>{t('inventory.stockView.tabMovements')}</button>
      </div>
      <div className="flex flex-wrap items-center gap-3 border-b border-border bg-surface/40 px-6 py-3">
        <select
          value={branchId}
          onChange={(e) => { setBranchId(e.target.value); setWarehouseId(''); }}
          aria-label={t('inventory.stockView.branch')}
          className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm"
        >
          <option value="">{t('inventory.stockView.allBranches')}</option>
          {(branches ?? []).map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
        </select>
        <select
          value={warehouseId}
          onChange={(e) => setWarehouseId(e.target.value)}
          aria-label={t('inventory.stockView.warehouse')}
          className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm"
        >
          <option value="">{t('inventory.stockView.allWarehouses')}</option>
          {warehouseOptions.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
        </select>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('inventory.stockView.searchPlaceholder')}
          aria-label={t('inventory.stockView.searchPlaceholder')}
          className="min-w-52 flex-1 rounded-lg border border-border bg-canvas px-3 py-2 text-sm"
        />
      </div>
      <div className="min-h-0 flex-1 p-6">
        {tab === 'balances' ? (
          <VirtualGrid columns={balanceColumns} data={filteredBalances} loading={loadingBalances} emptyMessage={emptyMessage} />
        ) : (
          <VirtualGrid columns={movementColumns} data={filteredMovements} loading={loadingMovements} emptyMessage={emptyMessage} />
        )}
      </div>
      <Modal open={!!adjusting} onClose={() => setAdjusting(null)} title={t('inventory.stockView.adjustTitle')}>
        {adjusting && (
          <form onSubmit={(e) => { e.preventDefault(); void handleAdjust(); }} className="space-y-4">
            <div className="rounded-lg bg-surface px-4 py-3">
              <div className="font-medium">{adjusting.product.name}</div>
              <div className="text-sm text-text-secondary">{adjusting.warehouse.name} · {t('inventory.stockView.currentStock')}: {adjusting.quantity}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setAdjustType('in')} className={`rounded-lg border px-3 py-2 text-sm ${adjustType === 'in' ? 'border-success bg-success/10 text-success' : 'border-border'}`}><ArrowDownLeft className="mr-1 inline h-4 w-4" aria-hidden="true" /> {t('inventory.stockView.entry')}</button>
              <button type="button" onClick={() => setAdjustType('out')} className={`rounded-lg border px-3 py-2 text-sm ${adjustType === 'out' ? 'border-error bg-error/10 text-error' : 'border-border'}`}><ArrowUpRight className="mr-1 inline h-4 w-4" aria-hidden="true" /> {t('inventory.stockView.exit')}</button>
            </div>
            <div><label htmlFor="adjust-quantity" className="mb-1 block text-xs font-medium">{t('inventory.stockView.amount')}</label><input id="adjust-quantity" type="number" min="0.01" step="0.01" required value={adjustQuantity} onChange={(e) => setAdjustQuantity(e.target.value)} className="w-full rounded-lg border border-border bg-canvas px-3 py-2" /></div>
            <div><label htmlFor="adjust-reason" className="mb-1 block text-xs font-medium">{t('inventory.stockView.reason')}</label><input id="adjust-reason" required value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t('inventory.stockView.reasonPlaceholder')} className="w-full rounded-lg border border-border bg-canvas px-3 py-2" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label htmlFor="adjust-lot" className="mb-1 block text-xs font-medium">{t('inventory.stockView.lot')}</label><input id="adjust-lot" value={lotNumber} onChange={(e) => setLotNumber(e.target.value)} placeholder={t('inventory.stockView.optional')} className="w-full rounded-lg border border-border bg-canvas px-3 py-2" /></div>
              <div><label htmlFor="adjust-serial" className="mb-1 block text-xs font-medium">{t('inventory.stockView.serial')}</label><input id="adjust-serial" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} placeholder={t('inventory.stockView.optional')} className="w-full rounded-lg border border-border bg-canvas px-3 py-2" /></div>
            </div>
            <div><label htmlFor="adjust-expiration" className="mb-1 block text-xs font-medium">{t('inventory.stockView.expiration')}</label><input id="adjust-expiration" type="date" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} className="w-full rounded-lg border border-border bg-canvas px-3 py-2" /></div>
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setAdjusting(null)} className="rounded-lg border border-border px-4 py-2 text-sm">{t('common.cancel')}</button><button type="submit" disabled={adjustStock.isPending} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{t('inventory.stockView.registerAdjustment')}</button></div>
          </form>
        )}
      </Modal>
    </div>
  );
}
