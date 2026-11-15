import { useEffect, useMemo, useState } from 'react';
import { useForm, useStore } from '@tanstack/react-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, Plus, Star, Trash2, Warehouse as WarehouseIcon } from 'lucide-react';
import { useTranslation } from '@/shared/hooks/useTranslation';
import {
  useDefaultWarehouse,
  useDeleteWarehouse,
  useSetDefaultWarehouse,
  useWarehouses,
  type Warehouse,
} from '@/modules/inventory/hooks/useWarehouses';
import { useCreateWarehouse } from '@/modules/inventory/hooks/useCreateWarehouse';
import { useUpdateWarehouse } from '@/modules/inventory/hooks/useUpdateWarehouse';
import { useBranches } from '../hooks/useBranches';
import { VirtualGrid, type GridColumn } from '@/core/components/VirtualGrid';
import { ListPage } from '@/core/components/ListPage';
import { ListPagination } from '@/core/components/ListPagination';
import { Modal } from '@/core/components/Modal';
import { usePagination } from '@/shared/hooks/usePagination';
import { applyServerErrors, resolveServerErrorMessage, clearServerErrors, FormInput, FormSelect } from '@/shared/form';
import { warehouseFormSchema, type WarehouseFormValues } from '@/shared/validation/warehouse';

export function WarehouseListView() {
  const { t, locale } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialBranch = searchParams.get('branch') ?? '';
  const { data: warehouses = [], isLoading, isError, refetch, isFetching } = useWarehouses(true);
  const branchesQuery = useBranches(true);
  const { data: branches = [] } = branchesQuery;
  const defaultQuery = useDefaultWarehouse();
  const { data: defaultWarehouse } = defaultQuery;
  const createWarehouse = useCreateWarehouse();
  const updateWarehouse = useUpdateWarehouse();
  const setDefaultWarehouse = useSetDefaultWarehouse();
  const deleteWarehouse = useDeleteWarehouse();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState(initialBranch);
  const [sortColumn, setSortColumn] = useState<keyof Warehouse | null>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [deleteTarget, setDeleteTarget] = useState<Warehouse | null>(null);
  const [serverError, setServerError] = useState('');
  const [actionError, setActionError] = useState('');
  const runAction = async (action: () => Promise<unknown>) => {
    setActionError('');
    try { await action(); } catch (error) {
      setActionError(resolveServerErrorMessage(applyServerErrors(form, error), t('common.saveUnconfirmed')));
    }
  };
  const branchAllowed = (branchId: string | null) => !branchId || branches.some((branch) => branch.id === branchId && branch.isActive);

  const form = useForm({
    defaultValues: {
      name: '',
      code: '',
      branchId: initialBranch,
    } satisfies WarehouseFormValues,
    validators: { onSubmit: warehouseFormSchema },
    onSubmit: async ({ value }) => {
      setServerError('');
      try {
        await createWarehouse.mutateAsync({
          name: value.name.trim(),
          code: value.code.trim() || undefined,
          branchId: value.branchId || undefined,
        });
        form.reset();
        setShowForm(false);
      } catch (error) {
        const result = applyServerErrors(form, error);
        setServerError(resolveServerErrorMessage(result, t('common.saveUnconfirmed')));
      }
    },
  });

  const selectedBranchId = useStore(form.store, (state) => state.values.branchId);

  useEffect(() => {
    setBranchFilter(initialBranch);
  }, [initialBranch]);

  const toggleForm = () => {
    clearServerErrors(form);
    setServerError('');
    if (!showForm) form.reset({ name: '', code: '', branchId: branchAllowed(branchFilter) ? branchFilter : '' }, { keepDefaultValues: true });
    setShowForm(!showForm);
  };

  const filteredWarehouses = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return warehouses.filter((warehouse) => {
      if (branchFilter && warehouse.branchId !== branchFilter) return false;
      if (!needle) return true;
      const branchName = branches.find((branch) => branch.id === warehouse.branchId)?.name ?? '';
      return (
        warehouse.name.toLowerCase().includes(needle) ||
        warehouse.code?.toLowerCase().includes(needle) ||
        branchName.toLowerCase().includes(needle)
      );
    });
  }, [warehouses, branches, search, branchFilter]);

  const sortedWarehouses = useMemo(() => {
    if (!sortColumn) return filteredWarehouses;
    const value = (warehouse: Warehouse): string | number => {
      const raw = warehouse[sortColumn];
      if (typeof raw === 'number') return raw;
      if (typeof raw === 'boolean') return raw ? 1 : 0;
      if (sortColumn === 'branchId') {
        return (branches.find((branch) => branch.id === warehouse.branchId)?.name ?? '').toLowerCase();
      }
      return String(raw ?? '').toLowerCase();
    };
    const direction = sortDirection === 'asc' ? 1 : -1;
    return [...filteredWarehouses].sort((a, b) => {
      const left = value(a);
      const right = value(b);
      if (left < right) return -direction;
      if (left > right) return direction;
      return 0;
    });
  }, [filteredWarehouses, sortColumn, sortDirection, branches]);

  const pagination = usePagination(sortedWarehouses, {
    resetKey: `${search}|${branchFilter}|${sortColumn ?? ''}|${sortDirection}`,
  });

  const handleSort = (column: keyof Warehouse | string, direction: 'asc' | 'desc') => {
    setSortColumn(column as keyof Warehouse);
    setSortDirection(direction);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setServerError('');
    try {
      await deleteWarehouse.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (error) {
      setServerError(resolveServerErrorMessage(applyServerErrors(form, error), t('common.saveUnconfirmed')));
    }
  };

  const metrics = useMemo(
    () => ({
      total: warehouses.length,
      active: warehouses.filter((warehouse) => warehouse.isActive).length,
      inactive: warehouses.filter((warehouse) => !warehouse.isActive).length,
      defaultName: defaultWarehouse?.name ?? null,
    }),
    [warehouses, defaultWarehouse],
  );

  const columns: GridColumn<Warehouse>[] = [
    {
      key: 'name',
      label: t('inventory.warehouseView.name'),
      minWidth: 180,
      sortable: true,
      render: (_value, row) => (
        <span className="flex min-w-0 items-center gap-2">
          <WarehouseIcon size={15} aria-hidden="true" className="shrink-0 text-accent" />
          <span className="truncate">{row.name}</span>
          {defaultWarehouse?.id === row.id && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent-alpha px-2 py-0.5 text-[10px] font-semibold text-accent">
              <Star size={10} aria-hidden="true" />
              {t('inventory.warehouseView.defaultBadge')}
            </span>
          )}
        </span>
      ),
    },
    {
      key: 'code',
      label: t('inventory.warehouseView.code'),
      width: 110,
      sortable: true,
      render: (value) => <span className="font-mono text-xs">{String(value || '—')}</span>,
    },
    {
      key: 'branchId',
      label: t('inventory.warehouseView.branch'),
      minWidth: 150,
      sortable: true,
      render: (value) =>
        branches.find((branch) => branch.id === String(value))?.name ||
        t('inventory.warehouseView.noBranch'),
    },
    {
      key: 'isActive',
      label: t('inventory.product.isActive'),
      width: 120,
      sortable: true,
      render: (_value, row) => (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            void runAction(() => updateWarehouse.mutateAsync({ id: row.id, data: { isActive: !row.isActive } }));
          }}
          disabled={updateWarehouse.isPending || setDefaultWarehouse.isPending || defaultQuery.isPending || defaultQuery.isError || (row.isActive ? defaultWarehouse?.id === row.id : !branchAllowed(row.branchId) || branchesQuery.isPending || branchesQuery.isError)}
          aria-busy={updateWarehouse.isPending && updateWarehouse.variables?.id === row.id}
          aria-label={
            row.isActive
              ? t('inventory.warehouseView.deactivate')
              : t('inventory.warehouseView.reactivate')
          }
          title={
            row.isActive
              ? t('inventory.warehouseView.deactivate')
              : t('inventory.warehouseView.reactivate')
          }
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${row.isActive ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}
        >
          {row.isActive ? t('inventory.warehouseView.active') : t('inventory.warehouseView.inactive')}
        </button>
      ),
    },
    {
      key: 'actions',
      label: t('inventory.warehouseView.actions'),
      width: 132,
      align: 'right',
      render: (_value, row) => (
        <span className="flex items-center justify-end gap-1">
          <Link
            to={`/inventory/warehouses/${row.id}`}
            onClick={(event) => event.stopPropagation()}
            aria-label={t('inventory.warehouseView.view')}
            title={t('inventory.warehouseView.view')}
            className="rounded-md p-1.5 text-text-secondary hover:bg-surface-hover hover:text-text-primary"
          >
            <Eye size={15} aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              void runAction(() => setDefaultWarehouse.mutateAsync(row.id));
            }}
            disabled={!row.isActive || !branchAllowed(row.branchId) || defaultWarehouse?.id === row.id || defaultQuery.isPending || defaultQuery.isError || branchesQuery.isPending || branchesQuery.isError || setDefaultWarehouse.isPending || updateWarehouse.isPending}
            aria-busy={setDefaultWarehouse.isPending && setDefaultWarehouse.variables === row.id}
            aria-label={t('inventory.warehouseView.setDefault')}
            title={t('inventory.warehouseView.setDefault')}
            className="rounded-md p-1.5 text-text-secondary hover:bg-surface-hover hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Star size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setServerError('');
              setDeleteTarget(row);
            }}
            disabled={!row.isActive || defaultWarehouse?.id === row.id || defaultQuery.isPending || defaultQuery.isError || deleteWarehouse.isPending}
            aria-label={t('inventory.warehouseView.delete')}
            title={t('inventory.warehouseView.delete')}
            className="rounded-md p-1.5 text-text-secondary hover:bg-error/10 hover:text-error"
          >
            <Trash2 size={15} aria-hidden="true" />
          </button>
        </span>
      ),
    },
  ];

  return (
    <ListPage
      title={t('inventory.warehouses')}
      subtitle={t('inventory.warehouseView.subtitle')}
      onRefresh={() => { void refetch(); void branchesQuery.refetch(); void defaultQuery.refetch(); }}
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
      toolbar={
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border px-6 py-2">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('inventory.warehouseView.searchPlaceholder')}
            aria-label={t('inventory.warehouseView.searchPlaceholder')}
            className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none sm:w-64"
          />
          <select
            value={branchFilter}
            onChange={(event) => {
              const value = event.target.value;
              setBranchFilter(value);
              setSearchParams(value ? { branch: value } : {}, { replace: true });
            }}
            aria-label={t('inventory.warehouseView.filterBranch')}
            className="max-w-[10rem] rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-text-primary focus:border-accent focus:outline-none"
          >
            <option value="">{t('inventory.warehouseView.allBranches')}</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
          <button
            onClick={toggleForm}
            className="ml-auto inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover"
          >
            <Plus size={14} aria-hidden="true" />
            {t('inventory.warehouseView.createTitle')}
          </button>
        </div>
      }
    >
      {(isError || branchesQuery.isError || defaultQuery.isError) && <div role="alert" className="mb-4 text-sm text-error">
        {locale === 'en' ? 'Could not load warehouse data. Existing data may be outdated.' : 'No se pudieron cargar los datos de almacenes. Los datos visibles pueden estar desactualizados.'}
        <button type="button" onClick={() => { void refetch(); void branchesQuery.refetch(); void defaultQuery.refetch(); }} disabled={isFetching || branchesQuery.isFetching || defaultQuery.isFetching} className="ml-3 font-semibold text-accent disabled:opacity-50">{t('common.retry')}</button>
      </div>}
      {actionError && <p role="alert" className="mb-4 text-sm text-error">{actionError}</p>}
      <div className="mb-4 grid shrink-0 grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
        <SummaryCell
          label={t('inventory.warehouseView.metricsTotal')}
          value={isLoading || (isError && warehouses.length === 0) ? '—' : metrics.total}
          emphasis
        />
        <SummaryCell
          label={t('inventory.warehouseView.metricsActive')}
          value={isLoading || (isError && warehouses.length === 0) ? '—' : metrics.active}
          dot="var(--status-success)"
        />
        <SummaryCell
          label={t('inventory.warehouseView.metricsInactive')}
          value={isLoading || (isError && warehouses.length === 0) ? '—' : metrics.inactive}
          dot="var(--status-error)"
        />
        <SummaryCell
          label={t('inventory.warehouseView.metricsDefault')}
          value={defaultQuery.isPending || defaultQuery.isError ? '—' : metrics.defaultName ?? t('inventory.warehouseView.noDefault')}
          muted={!metrics.defaultName}
          icon={!!metrics.defaultName}
        />
      </div>

      {showForm && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
          className="mb-4 shrink-0 overflow-hidden rounded-xl border border-border bg-surface"
        >
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-text-primary">
              {t('inventory.warehouseView.createTitle')}
            </h2>
          </div>
          <div className="grid gap-3 p-4 md:grid-cols-3">
            <FormInput
              form={form}
              name="name"
              label={t('inventory.warehouseView.name')}
              placeholder={t('inventory.warehouseView.namePlaceholder')}
              ariaLabel={t('inventory.warehouseView.name')}
            />
            <FormInput
              form={form}
              name="code"
              label={t('inventory.warehouseView.code')}
              placeholder={t('inventory.warehouseView.codePlaceholder')}
              ariaLabel={t('inventory.warehouseView.code')}
            />
            <FormSelect
              form={form}
              name="branchId"
              label={t('inventory.warehouseView.branch')}
              ariaLabel={t('inventory.warehouseView.branch')}
              placeholder={t('inventory.warehouseView.noBranch')}
              disabled={branchesQuery.isPending || branchesQuery.isError || createWarehouse.isPending}
              options={branches.map((branch) => ({ value: branch.id, label: `${branch.name}${branch.isActive ? '' : ` (${t('inventory.branchView.inactive')})`}`, disabled: !branch.isActive }))}
            />
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
            <div className="min-w-0 flex-1">
              {serverError && (
                <p role="alert" className="text-sm text-error">
                  {serverError}
                </p>
              )}
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg px-3 py-2 text-xs text-text-secondary hover:text-text-primary"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={createWarehouse.isPending || branchesQuery.isPending || branchesQuery.isError || !branchAllowed(selectedBranchId)}
                aria-busy={createWarehouse.isPending}
                className="rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                {t('common.save')}
              </button>
            </div>
          </div>
        </form>
      )}

      {!(isError && warehouses.length === 0) && <VirtualGrid
        data={pagination.pageItems}
        columns={columns}
        loading={isLoading}
        onSort={handleSort}
        sortColumn={sortColumn ?? undefined}
        sortDirection={sortDirection}
        onRowClick={(row) => navigate(`/inventory/warehouses/${row.id}`)}
        emptyMessage={t('inventory.warehouseView.empty')}
        emptyActionLabel={warehouses.length === 0 ? t('common.create') : undefined}
        emptyAction={warehouses.length === 0 ? toggleForm : undefined}
      />}

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={t('inventory.warehouseView.deleteTitle')}
        size="sm"
      >
        <p className="text-sm text-text-secondary">
          {t('inventory.warehouseView.deleteConfirm').replace('{name}', deleteTarget?.name ?? '')}
        </p>
        {serverError && (
          <p role="alert" className="mt-3 text-sm text-error">
            {serverError}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setDeleteTarget(null)}
            className="rounded-lg px-3 py-2 text-xs text-text-secondary hover:text-text-primary"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={() => void confirmDelete()}
            disabled={deleteWarehouse.isPending}
            className="rounded-lg bg-error px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            {t('inventory.warehouseView.delete')}
          </button>
        </div>
      </Modal>
    </ListPage>
  );
}

function SummaryCell({
  label,
  value,
  emphasis = false,
  muted = false,
  dot,
  icon = false,
}: {
  label: string;
  value: string | number;
  emphasis?: boolean;
  muted?: boolean;
  dot?: string;
  icon?: boolean;
}) {
  return (
    <div className="min-w-0 bg-surface px-4 py-2.5">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
        {label}
      </div>
      <div
        className={`mt-0.5 flex min-w-0 items-center gap-1.5 font-mono tabular-nums ${
          emphasis
            ? 'text-lg font-semibold text-text-primary'
            : muted
              ? 'text-xs font-medium text-text-muted'
              : 'text-sm font-semibold text-text-primary'
        }`}
      >
        {dot && (
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: dot }}
            aria-hidden="true"
          />
        )}
        {icon && <Star size={12} aria-hidden="true" className="shrink-0 text-accent" />}
        <span className="truncate" title={String(value)}>
          {value}
        </span>
      </div>
    </div>
  );
}
