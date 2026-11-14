import { useMemo, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { Building2 } from 'lucide-react';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { useBranches, useCreateBranch, useUpdateBranch, type Branch } from '../hooks/useBranches';
import { useWarehouses } from '../hooks/useWarehouses';
import { VirtualGrid, type GridColumn } from '@/core/components/VirtualGrid';
import { ListPage } from '@/core/components/ListPage';
import { ListPagination } from '@/core/components/ListPagination';
import { usePagination } from '@/shared/hooks/usePagination';
import { applyServerErrors, resolveServerErrorMessage, clearServerErrors, FormInput } from '@/shared/form';
import { branchFormSchema, type BranchFormValues } from '@/shared/validation/branch';

export function BranchListView() {
  const { t } = useTranslation();
  const { data: branches = [], isLoading, refetch, isFetching } = useBranches();
  const { data: warehouses = [] } = useWarehouses();
  const createBranch = useCreateBranch();
  const updateBranch = useUpdateBranch();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [serverError, setServerError] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof Branch | 'warehouses' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const form = useForm({
    defaultValues: { name: '', code: '', address: '', phone: '' } satisfies BranchFormValues,
    validators: { onSubmit: branchFormSchema },
    onSubmit: async ({ value }) => {
      setServerError('');
      try {
        await createBranch.mutateAsync({
          name: value.name.trim(),
          code: value.code.trim() || undefined,
          address: value.address.trim() || undefined,
          phone: value.phone.trim() || undefined,
        });
        form.reset();
        setShowForm(false);
      } catch (error) {
        const result = applyServerErrors(form, error);
        setServerError(resolveServerErrorMessage(result, t('common.saveUnconfirmed')));
      }
    },
  });

  const toggleForm = () => {
    clearServerErrors(form);
    setServerError('');
    setShowForm((visible) => !visible);
  };

  const warehouseCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const warehouse of warehouses) {
      if (warehouse.branchId) {
        counts.set(warehouse.branchId, (counts.get(warehouse.branchId) ?? 0) + 1);
      }
    }
    return counts;
  }, [warehouses]);

  const filteredBranches = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return branches;
    return branches.filter(
      (branch) =>
        branch.name.toLowerCase().includes(needle) ||
        branch.code?.toLowerCase().includes(needle) ||
        branch.address?.toLowerCase().includes(needle),
    );
  }, [branches, search]);

  const sortedBranches = useMemo(() => {
    if (!sortColumn) return filteredBranches;
    const value = (branch: Branch): string | number => {
      if (sortColumn === 'warehouses') return warehouseCounts.get(branch.id) ?? 0;
      const raw = branch[sortColumn];
      if (typeof raw === 'number') return raw;
      if (typeof raw === 'boolean') return raw ? 1 : 0;
      return String(raw ?? '').toLowerCase();
    };
    const direction = sortDirection === 'asc' ? 1 : -1;
    return [...filteredBranches].sort((a, b) => {
      const left = value(a);
      const right = value(b);
      if (left < right) return -direction;
      if (left > right) return direction;
      return 0;
    });
  }, [filteredBranches, sortColumn, sortDirection, warehouseCounts]);

  const pagination = usePagination(sortedBranches, {
    resetKey: `${search}|${sortColumn ?? ''}|${sortDirection}`,
  });

  const handleSort = (column: keyof Branch | string, direction: 'asc' | 'desc') => {
    setSortColumn(column as keyof Branch | 'warehouses');
    setSortDirection(direction);
  };

  const columns: GridColumn<Branch>[] = [
    {
      key: 'name',
      label: t('inventory.branchView.name'),
      width: '26%',
      minWidth: 160,
      sortable: true,
      render: (_value, row) => (
        <span className="flex min-w-0 items-center gap-2">
          <Building2 size={15} aria-hidden="true" className="shrink-0 text-accent" />
          <span className="truncate">{row.name}</span>
        </span>
      ),
    },
    {
      key: 'code',
      label: t('inventory.branchView.code'),
      width: '12%',
      minWidth: 90,
      sortable: true,
      render: (value) => (
        <span className="font-mono text-xs tabular-nums">{String(value || '—')}</span>
      ),
    },
    {
      key: 'address',
      label: t('inventory.branchView.address'),
      width: '34%',
      minWidth: 180,
      sortable: true,
      render: (value) => <span className="block truncate">{String(value || '—')}</span>,
    },
    {
      key: 'warehouses',
      label: t('inventory.branchView.warehouses'),
      width: '14%',
      minWidth: 100,
      align: 'right',
      sortable: true,
      render: (_value, row) => (
        <span className="font-mono text-xs tabular-nums text-text-secondary">
          {warehouseCounts.get(row.id) ?? 0}
        </span>
      ),
    },
    {
      key: 'isActive',
      label: t('inventory.product.isActive'),
      width: '14%',
      minWidth: 100,
      align: 'center',
      render: (_value, row) => (
        <button
          onClick={() => updateBranch.mutate({ id: row.id, data: { isActive: !row.isActive } })}
          aria-label={
            row.isActive ? t('inventory.branchView.inactive') : t('inventory.branchView.active')
          }
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${row.isActive ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}
        >
          {row.isActive ? t('inventory.branchView.active') : t('inventory.branchView.inactive')}
        </button>
      ),
    },
  ];

  return (
    <ListPage
      title={t('inventory.branches')}
      subtitle={t('inventory.branchView.subtitle')}
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
            placeholder={t('inventory.branchView.searchPlaceholder')}
            aria-label={t('inventory.branchView.searchPlaceholder')}
            className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none sm:w-56"
          />
          <button
            onClick={toggleForm}
            className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover"
          >
            + {t('common.create')}
          </button>
        </>
      }
    >
      {showForm && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
          className="mb-4 shrink-0 rounded-xl border border-border bg-surface p-4"
        >
          <div className="mb-3 text-sm font-semibold text-text-primary">
            {t('inventory.branchView.createTitle')}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <FormInput
              form={form}
              name="name"
              label={t('inventory.branchView.name')}
              placeholder={t('inventory.branchView.namePlaceholder')}
              ariaLabel={t('inventory.branchView.name')}
            />
            <FormInput
              form={form}
              name="code"
              label={t('inventory.branchView.code')}
              placeholder={t('inventory.branchView.codePlaceholder')}
              ariaLabel={t('inventory.branchView.code')}
            />
            <FormInput
              form={form}
              name="address"
              label={t('inventory.branchView.address')}
              placeholder={t('inventory.branchView.addressPlaceholder')}
              ariaLabel={t('inventory.branchView.address')}
            />
            <FormInput
              form={form}
              name="phone"
              label={t('inventory.branchView.phone')}
              placeholder={t('inventory.branchView.phonePlaceholder')}
              ariaLabel={t('inventory.branchView.phone')}
            />
          </div>
          {serverError && (
            <p role="alert" className="mt-3 text-sm text-error">
              {serverError}
            </p>
          )}
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg px-3 py-2 text-xs text-text-secondary hover:text-text-primary"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={createBranch.isPending}
              className="rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
            >
              {t('common.save')}
            </button>
          </div>
        </form>
      )}
      <VirtualGrid
        data={pagination.pageItems}
        columns={columns}
        loading={isLoading}
        onSort={handleSort}
        sortColumn={sortColumn ?? undefined}
        sortDirection={sortDirection}
        emptyMessage={t('inventory.branchView.empty')}
        emptyActionLabel={branches.length === 0 ? t('common.create') : undefined}
        emptyAction={branches.length === 0 ? () => setShowForm(true) : undefined}
      />
    </ListPage>
  );
}
