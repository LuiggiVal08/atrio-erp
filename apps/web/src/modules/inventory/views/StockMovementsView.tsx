import { useDeferredValue, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useIsMutating } from '@tanstack/react-query';
import { usePermission } from '@/core/auth/usePermission';
import { useInventoryProducts } from '../hooks/useInventoryList';
import { StockAdjustmentForm } from '../components/StockAdjustmentForm';
import { ArrowDownLeft, ArrowUpRight, SlidersHorizontal } from 'lucide-react';
import { VirtualGrid, type GridColumn } from '@/core/components/VirtualGrid';
import { ListPage } from '@/core/components/ListPage';
import { ListPagination } from '@/core/components/ListPagination';
import { usePagination } from '@/shared/hooks/usePagination';
import { Modal } from '@/core/components/Modal';
import { toastService } from '@/core/services/toast-service';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { useTenantStore } from '@/core/tenant/store';
import { useTenant } from '@/modules/settings/hooks/useTenant';
import { useBranches } from '../hooks/useBranches';
import { useWarehouses } from '../hooks/useWarehouses';
import {
  useAllStockMovements,
  useStockBalances,
  type StockBalance,
} from '../hooks/useStockMovements';

export function StockMovementsView() {
  const { t, locale } = useTranslation();
  const [params] = useSearchParams();
  const [tab, setTab] = useState<'balances' | 'movements'>(params.get('tab') === 'movements' ? 'movements' : 'balances');
  const [branchId, setBranchId] = useState('');
  const [warehouseId, setWarehouseId] = useState(params.get('warehouseId') ?? '');
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const productId = params.get('productId') ?? '';
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [adjusting, setAdjusting] = useState<StockBalance | null>(null);
  const [showAdjustment, setShowAdjustment] = useState(false);
  const canAdjust = usePermission('inventory:stock:adjust');
  const productsQuery = useInventoryProducts();

  const tenantId = useTenantStore((state) => state.activeTenantId);
  const savingAdjustment = useIsMutating({ mutationKey: ['stock-adjustment', tenantId] }) > 0;
  const { data: tenant } = useTenant(tenantId);
  const currency = tenant?.baseCurrency === 'VED' ? 'VES' : tenant?.baseCurrency || 'VES';
  const formatMoney = useMemo(
    () => (value: number) =>
      new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value),
    [currency, locale],
  );
  const formatNumber = useMemo(
    () => (value: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 20 }).format(value),
    [locale],
  );
  const formatUnit = (unit?: string | null) => {
    const value = unit || 'unidad';
    const translated = t(`inventory.units.${value}`);
    return translated === `inventory.units.${value}` ? value : translated;
  };

  const { data: branches } = useBranches();
  const { data: warehouses } = useWarehouses();
  const {
    data: balances = [],
    isLoading: loadingBalances,
    refetch: refetchBalances,
    isFetching: isFetchingBalances,
    isError: balancesError,
  } = useStockBalances();
  const {
    data: movementPage,
    isLoading: loadingMovements,
    refetch: refetchMovements,
    isFetching: isFetchingMovements,
    isError: movementsError,
  } = useAllStockMovements({
    page, pageSize, search: deferredSearch || undefined,
    warehouseId: warehouseId || undefined, branchId: branchId || undefined,
    productId: productId || undefined, dateFrom: from || undefined, dateTo: to || undefined,
  });
  const movements = movementPage?.items ?? [];
  const activeError = tab === 'balances' ? balancesError : movementsError;
  const showGrid = !activeError || (tab === 'balances' ? balances.length : movements.length) > 0;

  const warehouseOptions = (warehouses ?? []).filter(
    (warehouse) => !branchId || warehouse.branchId === branchId,
  );

  const filteredBalances = balances.filter((row) => {
    const matchesWarehouse = !warehouseId || row.warehouseId === warehouseId;
    const matchesBranch = !branchId || row.warehouse.branchId === branchId;
    const needle = search.trim().toLowerCase();
    const matchesSearch =
      !needle ||
      row.product.name.toLowerCase().includes(needle) ||
      row.product.sku.toLowerCase().includes(needle);
    return matchesWarehouse && matchesBranch && matchesSearch && (!productId || row.productId === productId);
  });

  const filterKey = `${tenantId}|${branchId}|${warehouseId}|${search}|${productId}`;
  const balancePagination = usePagination(filteredBalances, {
    resetKey: `${filterKey}|balances`,
  });
  const movementPagination = {
    page, pageSize, total: movementPage?.total ?? 0,
    totalPages: Math.max(1, Math.ceil((movementPage?.total ?? 0) / pageSize)),
    pageItems: movements, setPage,
    setPageSize: (size: number) => { setPageSize(size); setPage(1); },
  };
  const activePagination = tab === 'balances' ? balancePagination : movementPagination;

  const balanceColumns: GridColumn<StockBalance>[] = [
    {
      key: 'product',
      label: t('inventory.stockView.product'),
      sortable: true,
      render: (_v, row) => (
        <div>
          <div className="font-medium text-text-primary">{row.product.name}</div>
          <div className="text-xs text-text-secondary">{row.product.sku}</div>
        </div>
      ),
    },
    {
      key: 'warehouse',
      label: t('inventory.stockView.warehouse'),
      sortable: true,
      render: (_v, row) => (
        <div>
          <div className="font-medium">{row.warehouse.name}</div>
          <div className="text-xs text-text-secondary">{row.warehouse.code || '—'}</div>
        </div>
      ),
    },
    {
      key: 'quantity',
      label: t('inventory.stockView.quantity'),
      width: 110,
      align: 'right',
      render: (value, row) => {
        const quantity = Number(value);
        const low = quantity <= Number(row.product.minStock ?? 0);
        const over = row.product.maxStock != null && quantity > Number(row.product.maxStock);
        return (
          <span
            className={`font-mono tabular-nums ${
              low
                ? 'font-semibold text-error'
                : over
                  ? 'font-semibold text-warning'
                  : 'font-semibold text-text-primary'
            }`}
          >
            {formatNumber(quantity)}{' '}
            <span className="font-sans font-normal text-text-secondary">
              {formatUnit(row.product.baseUnit)}
            </span>
          </span>
        );
      },
    },
    {
      key: 'committedQuantity',
      label: t('inventory.stockView.committed'),
      width: 110,
      align: 'right',
      render: (_value, row) => (
        <span className="font-mono tabular-nums text-text-secondary">
          {formatNumber(Number(row.committedQuantity ?? 0))}
        </span>
      ),
    },
    {
      key: 'availableQuantity',
      label: t('inventory.stockView.available'),
      width: 110,
      align: 'right',
      render: (_value, row) => {
        const available = Number(row.quantity) - Number(row.committedQuantity ?? 0);
        return (
          <span className={`font-mono tabular-nums ${available <= 0 ? 'font-semibold text-error' : 'font-semibold text-text-primary'}`}>
            {formatNumber(available)}
          </span>
        );
      },
    },
    {
      key: 'limits',
      label: t('inventory.stockView.limits'),
      width: 160,
      align: 'right',
      render: (_v, row) => (
        <span className="font-mono text-xs tabular-nums text-text-secondary">
          {formatNumber(Number(row.product.minStock ?? 0))} /{' '}
          {row.product.maxStock != null ? formatNumber(Number(row.product.maxStock)) : '—'} /{' '}
          {formatNumber(Number(row.product.reorderPoint ?? 0))}
        </span>
      ),
    },
    {
      key: 'cost',
      label: t('inventory.stockView.totalCost'),
      width: 120,
      align: 'right',
      render: (_v, row) => (
        <span className="font-mono tabular-nums">
          {formatMoney(Number(row.quantity) * Number(row.product.costPrice ?? 0))}
        </span>
      ),
    },
    {
      key: 'updatedAt',
      label: t('inventory.stockView.updatedAt'),
      width: 150,
      render: (value) => new Date(value as string).toLocaleString(locale),
    },
    {
      key: 'actions',
      label: '',
      width: 130,
      align: 'right',
      render: (_v, row) => canAdjust && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setAdjusting(row);
            setShowAdjustment(true);
          }}
          className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:border-accent hover:text-accent"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />{' '}
          {t('inventory.stockView.adjust')}
        </button>
      ),
    },
  ];

  const movementColumns: GridColumn<(typeof movements)[number]>[] = [
    {
      key: 'createdAt',
      label: t('inventory.stockView.date'),
      width: 150,
      render: (value) => new Date(value as string).toLocaleString(locale),
    },
    {
      key: 'product',
      label: t('inventory.stockView.product'),
      render: (_v, row) =>
        `${row.product?.sku ? `${row.product.sku} · ` : ''}${row.product?.name ?? row.productId}`,
    },
    {
      key: 'warehouse',
      label: t('inventory.stockView.warehouse'),
      render: (_v, row) => row.warehouse?.name ?? row.warehouseId,
    },
    {
      key: 'type',
      label: t('inventory.stockView.type'),
      width: 120,
      render: (value) => {
        const isIn = value === 'in';
        return (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${isIn ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}
          >
            {isIn ? (
              <ArrowDownLeft className="h-3 w-3" aria-hidden="true" />
            ) : (
              <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
            )}
            {isIn
              ? t('inventory.stockView.entry')
              : value === 'out'
                ? t('inventory.stockView.exit')
                : String(value)}
          </span>
        );
      },
    },
    {
      key: 'quantity',
      label: t('inventory.stockView.amount'),
      width: 100,
      align: 'right',
      render: (value) => (
        <span className="font-mono tabular-nums">{formatNumber(Number(value))}</span>
      ),
    },
    {
      key: 'referenceId',
      label: t('inventory.stockView.reference'),
      render: (value, row) => String(value || row.referenceType || '—'),
    },
    {
      key: 'balanceAfter',
      label: t('inventory.stockView.balance'),
      width: 120,
      align: 'right',
      render: (_v, row) =>
        row.balanceBefore != null && row.balanceAfter != null ? (
          <span className="font-mono tabular-nums">
            {formatNumber(Number(row.balanceBefore))} → {formatNumber(Number(row.balanceAfter))}
          </span>
        ) : (
          '—'
        ),
    },
    {
      key: 'userName',
      label: t('inventory.stockView.user'),
      width: 140,
      render: (value) => String(value || t('inventory.stockView.systemUser')),
    },
  ];

  const emptyMessage =
    search.trim() || branchId || warehouseId
      ? tab === 'balances'
        ? t('inventory.stockView.noMatchBalances')
        : t('inventory.stockView.noMatchMovements')
      : tab === 'balances'
        ? t('inventory.stockView.emptyBalances')
        : t('inventory.stockView.emptyMovements');

  return (
    <>
      <ListPage
        title={t('inventory.stockView.title')}
        subtitle={t('inventory.stockView.subtitle')}
        actions={canAdjust && <button type="button" onClick={() => { setAdjusting(null); setShowAdjustment(true); }} disabled={!productsQuery.data?.length || !warehouses?.length} className="rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{t('inventory.stockView.registerStock')}</button>}
        onRefresh={() => Promise.all([refetchBalances(), refetchMovements()])}
        refreshing={isFetchingBalances || isFetchingMovements}
        pagination={showGrid && (
          <ListPagination
            page={activePagination.page}
            pageSize={activePagination.pageSize}
            total={activePagination.total}
            totalPages={activePagination.totalPages}
            onPageChange={activePagination.setPage}
            onPageSizeChange={activePagination.setPageSize}
          />
        )}
        toolbar={
          <>
            <div
              role="tablist"
              aria-label={t('inventory.stockView.title')}
              className="flex items-center gap-2 border-b border-border px-6"
              onKeyDown={(event) => {
                if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
                event.preventDefault();
                const next = tab === 'balances' ? 'movements' : 'balances';
                setTab(next);
                event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next === 'balances' ? 0 : 1].focus();
              }}
            >
              <button
                role="tab"
                aria-selected={tab === 'balances'}
                tabIndex={tab === 'balances' ? 0 : -1}
                onClick={() => setTab('balances')}
                className={`border-b-2 px-1 py-3 text-sm font-medium ${tab === 'balances' ? 'border-accent text-accent' : 'border-transparent text-text-secondary'}`}
              >
                {t('inventory.stockView.tabBalances')}
              </button>
              <button
                role="tab"
                aria-selected={tab === 'movements'}
                tabIndex={tab === 'movements' ? 0 : -1}
                onClick={() => setTab('movements')}
                className={`border-b-2 px-1 py-3 text-sm font-medium ${tab === 'movements' ? 'border-accent text-accent' : 'border-transparent text-text-secondary'}`}
              >
                {t('inventory.stockView.tabMovements')}
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-3 border-b border-border bg-surface/40 px-6 py-3">
              <select
                value={branchId}
                onChange={(e) => {
                  setBranchId(e.target.value);
                  setWarehouseId('');
                  setPage(1);
                }}
                aria-label={t('inventory.stockView.branch')}
                className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm"
              >
                <option value="">{t('inventory.stockView.allBranches')}</option>
                {(branches ?? []).map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
              <select
                value={warehouseId}
                onChange={(e) => { setWarehouseId(e.target.value); setPage(1); }}
                aria-label={t('inventory.stockView.warehouse')}
                className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm"
              >
                <option value="">{t('inventory.stockView.allWarehouses')}</option>
                {warehouseOptions.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder={t('inventory.stockView.searchPlaceholder')}
                aria-label={t('inventory.stockView.searchPlaceholder')}
                className="min-w-52 flex-1 rounded-lg border border-border bg-canvas px-3 py-2 text-sm"
              />
              {tab === 'movements' && <>
                <label className="text-xs">{t('inventory.stockView.fromDate')}<input type="date" value={from} onChange={(event) => { setFrom(event.target.value); setPage(1); }} className="ml-2 rounded-lg border border-border bg-canvas px-3 py-2" /></label>
                <label className="text-xs">{t('inventory.stockView.toDate')}<input type="date" min={from} value={to} onChange={(event) => { setTo(event.target.value); setPage(1); }} className="ml-2 rounded-lg border border-border bg-canvas px-3 py-2" /></label>
              </>}
            </div>
          </>
        }
      >
        {activeError && <div role="alert" className="mb-3 flex items-center justify-between gap-3 text-sm text-error">{t('inventory.stockView.loadError')}<button type="button" onClick={() => void (tab === 'balances' ? refetchBalances() : refetchMovements())} className="rounded-lg border border-border px-3 py-2">{t('common.retry')}</button></div>}
        {showGrid && (tab === 'balances' ? (
          <VirtualGrid
            columns={balanceColumns}
            data={balancePagination.pageItems}
            loading={loadingBalances}
            emptyMessage={emptyMessage}
          />
        ) : (
          <VirtualGrid
            columns={movementColumns}
            data={movementPagination.pageItems}
            loading={loadingMovements}
            emptyMessage={emptyMessage}
          />
        ))}
      </ListPage>
      <Modal
        open={showAdjustment}
        dismissible={!savingAdjustment}
        onClose={() => { if (!savingAdjustment) setShowAdjustment(false); }}
        title={t(adjusting ? 'inventory.stockView.adjustTitle' : 'inventory.stockView.registerStock')}
      >
        {showAdjustment && <StockAdjustmentForm
          key={`${tenantId}|${adjusting?.id ?? 'new'}`}
          balance={adjusting}
          balances={balances}
          products={productsQuery.data ?? []}
          warehouses={warehouses ?? []}
          onClose={() => setShowAdjustment(false)}
          onSaved={() => {
            setShowAdjustment(false);
            toastService.success(t('inventory.stockView.adjustSuccessTitle'), t('inventory.stockView.adjustSuccessBody'));
          }}
        />}
      </Modal>
    </>
  );
}
