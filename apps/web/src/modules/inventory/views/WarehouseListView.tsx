import { useMemo, useState } from 'react';
import { Warehouse as WarehouseIcon } from 'lucide-react';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { useWarehouses, type Warehouse } from '@/modules/inventory/hooks/useWarehouses';
import { useCreateWarehouse } from '@/modules/inventory/hooks/useCreateWarehouse';
import { useUpdateWarehouse } from '@/modules/inventory/hooks/useUpdateWarehouse';
import { useBranches } from '../hooks/useBranches';
import { VirtualGrid, type GridColumn } from '@/core/components/VirtualGrid';
import { ListPage } from '@/core/components/ListPage';
import { ListPagination } from '@/core/components/ListPagination';
import { usePagination } from '@/shared/hooks/usePagination';

export function WarehouseListView() {
  const { t } = useTranslation();
  const { data: warehouses, isLoading, refetch, isFetching } = useWarehouses();
  const { data: branches = [] } = useBranches();
  const createWarehouse = useCreateWarehouse();
  const updateWarehouse = useUpdateWarehouse();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [branchId, setBranchId] = useState('');
  const [search, setSearch] = useState('');
  const [aisle, setAisle] = useState('');
  const [shelf, setShelf] = useState('');
  const [level, setLevel] = useState('');
  const [bin, setBin] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) return;
    await createWarehouse.mutateAsync({
      name: name.trim(),
      code: code.trim() || undefined,
      branchId: branchId || undefined,
      aisle: aisle || undefined,
      shelf: shelf || undefined,
      level: level || undefined,
      bin: bin || undefined,
    });
    setName('');
    setCode('');
    setBranchId('');
    setAisle('');
    setShelf('');
    setLevel('');
    setBin('');
    setShowForm(false);
  };

  const filteredWarehouses = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return warehouses ?? [];
    return (warehouses ?? []).filter((warehouse) => {
      const branchName = branches.find((branch) => branch.id === warehouse.branchId)?.name ?? '';
      return (
        warehouse.name.toLowerCase().includes(needle) ||
        warehouse.code?.toLowerCase().includes(needle) ||
        branchName.toLowerCase().includes(needle)
      );
    });
  }, [warehouses, branches, search]);

  const pagination = usePagination(filteredWarehouses, { resetKey: search });

  const columns: GridColumn<Warehouse>[] = [
    {
      key: 'name',
      label: t('inventory.warehouseView.name'),
      sortable: true,
      render: (_value, row) => (
        <span className="flex items-center gap-2">
          <WarehouseIcon size={15} aria-hidden="true" className="text-accent" />
          {row.name}
        </span>
      ),
    },
    {
      key: 'code',
      label: t('inventory.warehouseView.code'),
      width: 110,
      render: (value) => String(value || '—'),
    },
    {
      key: 'branchId',
      label: t('inventory.warehouseView.branch'),
      render: (value) =>
        branches.find((branch) => branch.id === String(value))?.name ||
        t('inventory.warehouseView.noBranch'),
    },
    {
      key: 'location',
      label: t('inventory.warehouseView.location'),
      render: (_value, row) =>
        [
          row.aisle && `${t('inventory.warehouseView.aisle')} ${row.aisle}`,
          row.shelf && `${t('inventory.warehouseView.shelf')} ${row.shelf}`,
          row.level && `${t('inventory.warehouseView.level')} ${row.level}`,
          row.bin && `${t('inventory.warehouseView.bin')} ${row.bin}`,
        ]
          .filter(Boolean)
          .join(' · ') || t('inventory.warehouseView.noLocation'),
    },
    {
      key: 'isActive',
      label: t('inventory.product.isActive'),
      width: 120,
      render: (_value, row) => (
        <button
          onClick={() => updateWarehouse.mutate({ id: row.id, data: { isActive: !row.isActive } })}
          aria-label={
            row.isActive
              ? t('inventory.warehouseView.inactive')
              : t('inventory.warehouseView.active')
          }
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${row.isActive ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}
        >
          {row.isActive
            ? t('inventory.warehouseView.active')
            : t('inventory.warehouseView.inactive')}
        </button>
      ),
    },
  ];

  return (
    <ListPage
      title={t('inventory.warehouses')}
      subtitle={t('inventory.warehouseView.subtitle')}
      onRefresh={refetch}
      refreshing={isFetching}
      pagination={
        <ListPagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={pagination.total}
          totalPages={pagination.totalPages}
          onPageChange={pagination.setPage}
          onPageSizeChange={pagination.setPageSize}
        />
      }
      actions={
        <>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('inventory.warehouseView.searchPlaceholder')}
            aria-label={t('inventory.warehouseView.searchPlaceholder')}
            className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none sm:w-56"
          />
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover"
          >
            + {t('common.create')}
          </button>
        </>
      }
    >
      {showForm && (
        <div className="mb-4 shrink-0 rounded-xl border border-border bg-surface p-4">
          <div className="mb-3 text-sm font-semibold text-text-primary">
            {t('inventory.warehouseView.createTitle')}
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t('inventory.warehouseView.namePlaceholder')}
              aria-label={t('inventory.warehouseView.name')}
              className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none"
            />
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder={t('inventory.warehouseView.codePlaceholder')}
              aria-label={t('inventory.warehouseView.code')}
              className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none"
            />
            <select
              value={branchId}
              onChange={(event) => setBranchId(event.target.value)}
              aria-label={t('inventory.warehouseView.branch')}
              className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
            >
              <option value="">{t('inventory.warehouseView.noBranch')}</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
            <input
              value={aisle}
              onChange={(e) => setAisle(e.target.value)}
              placeholder={t('inventory.warehouseView.aisle')}
              aria-label={t('inventory.warehouseView.aisle')}
              className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none"
            />
            <input
              value={shelf}
              onChange={(e) => setShelf(e.target.value)}
              placeholder={t('inventory.warehouseView.shelf')}
              aria-label={t('inventory.warehouseView.shelf')}
              className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none"
            />
            <input
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              placeholder={t('inventory.warehouseView.level')}
              aria-label={t('inventory.warehouseView.level')}
              className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none"
            />
            <input
              value={bin}
              onChange={(e) => setBin(e.target.value)}
              placeholder={t('inventory.warehouseView.bin')}
              aria-label={t('inventory.warehouseView.bin')}
              className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={!name.trim() || createWarehouse.isPending}
                className="rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                {t('common.save')}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg px-3 py-2 text-xs text-text-secondary hover:text-text-primary"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
      <VirtualGrid
        data={pagination.pageItems}
        columns={columns}
        loading={isLoading}
        emptyMessage={t('inventory.warehouseView.empty')}
      />
    </ListPage>
  );
}
