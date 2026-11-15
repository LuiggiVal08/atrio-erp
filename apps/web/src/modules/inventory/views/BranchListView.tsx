import { useMemo, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Eye, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { useEmployees, employeeDisplayName } from '@/shared/hooks/useEmployees';
import {
  useBranches,
  useCreateBranch,
  useDeleteBranch,
  useUpdateBranch,
  type Branch,
} from '../hooks/useBranches';
import { useWarehouses } from '../hooks/useWarehouses';
import { VirtualGrid, type GridColumn } from '@/core/components/VirtualGrid';
import { ListPage } from '@/core/components/ListPage';
import { ListPagination } from '@/core/components/ListPagination';
import { Modal } from '@/core/components/Modal';
import { usePagination } from '@/shared/hooks/usePagination';
import { toastService } from '@/core/services/toast-service';
import {
  applyServerErrors,
  resolveServerErrorMessage,
  clearServerErrors,
  FormInput,
  FormPhoneInput,
  FormCombobox,
} from '@/shared/form';
import { branchFormSchema, type BranchFormValues } from '@/shared/validation/branch';

function serverMessage(error: unknown, fallback: string): string {
  const message = (error as { response?: { data?: { message?: unknown } } })?.response?.data
    ?.message;
  if (Array.isArray(message)) {
    return message.filter((entry): entry is string => typeof entry === 'string').join(' · ');
  }
  if (typeof message === 'string' && message) return message;
  return fallback;
}

export function BranchListView() {
  const { t, locale } = useTranslation();
  const navigate = useNavigate();
  const { data: branches = [], isLoading, isError, refetch, isFetching } = useBranches(true);
  const warehousesQuery = useWarehouses(true);
  const { data: warehouses = [] } = warehousesQuery;
  const employeesQuery = useEmployees();
  const { data: employees = [] } = employeesQuery;
  const createBranch = useCreateBranch();
  const updateBranch = useUpdateBranch();
  const deleteBranch = useDeleteBranch();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof Branch | 'warehouses' | 'manager' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [deleteTarget, setDeleteTarget] = useState<Branch | null>(null);
  const [serverError, setServerError] = useState('');

  const form = useForm({
    defaultValues: {
      name: '',
      code: '',
      address: '',
      city: '',
      state: '',
      phone: '',
      managerEmployeeId: '',
    } satisfies BranchFormValues,
    validators: { onSubmit: branchFormSchema },
    onSubmit: async ({ value }) => {
      setServerError('');
      try {
        await createBranch.mutateAsync({
          name: value.name.trim(),
          code: value.code.trim() || undefined,
          address: value.address.trim() || undefined,
          city: value.city.trim() || undefined,
          state: value.state.trim() || undefined,
          phone: value.phone.trim() || undefined,
          managerEmployeeId: value.managerEmployeeId || undefined,
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

  const employeeNames = useMemo(() => {
    const names = new Map<string, string>();
    for (const employee of employees) {
      names.set(employee.id, employeeDisplayName(employee));
    }
    return names;
  }, [employees]);

  const employeeOptions = useMemo(
    () =>
      employees.map((employee) => ({
        id: employee.id,
        name: employeeDisplayName(employee),
      })),
    [employees],
  );

  const warehouseCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const warehouse of warehouses) {
      if (warehouse.branchId) {
        counts.set(warehouse.branchId, (counts.get(warehouse.branchId) ?? 0) + 1);
      }
    }
    return counts;
  }, [warehouses]);

  const activeWarehouseCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const warehouse of warehouses) {
      if (warehouse.branchId && warehouse.isActive) {
        counts.set(warehouse.branchId, (counts.get(warehouse.branchId) ?? 0) + 1);
      }
    }
    return counts;
  }, [warehouses]);

  const filteredBranches = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return branches;
    return branches.filter((branch) => {
      const managerName = branch.managerEmployeeId
        ? (employeeNames.get(branch.managerEmployeeId) ?? '')
        : '';
      return (
        branch.name.toLowerCase().includes(needle) ||
        branch.code?.toLowerCase().includes(needle) ||
        branch.address?.toLowerCase().includes(needle) ||
        branch.city?.toLowerCase().includes(needle) ||
        branch.state?.toLowerCase().includes(needle) ||
        branch.phone?.toLowerCase().includes(needle) ||
        managerName.toLowerCase().includes(needle)
      );
    });
  }, [branches, employeeNames, search]);

  const sortedBranches = useMemo(() => {
    if (!sortColumn) return filteredBranches;
    const value = (branch: Branch): string | number => {
      if (sortColumn === 'warehouses') return warehouseCounts.get(branch.id) ?? 0;
      if (sortColumn === 'manager') {
        return branch.managerEmployeeId
          ? (employeeNames.get(branch.managerEmployeeId) ?? '').toLowerCase()
          : '';
      }
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
  }, [filteredBranches, sortColumn, sortDirection, warehouseCounts, employeeNames]);

  const pagination = usePagination(sortedBranches, {
    resetKey: `${search}|${sortColumn ?? ''}|${sortDirection}`,
  });

  const handleSort = (column: keyof Branch | string, direction: 'asc' | 'desc') => {
    setSortColumn(column as keyof Branch | 'warehouses' | 'manager');
    setSortDirection(direction);
  };

  const metrics = useMemo(
    () => ({
      total: branches.length,
      active: branches.filter((branch) => branch.isActive).length,
      inactive: branches.filter((branch) => !branch.isActive).length,
      warehouses: warehouses.length,
    }),
    [branches, warehouses],
  );

  const toggleActive = async (branch: Branch) => {
    try {
      await updateBranch.mutateAsync({ id: branch.id, data: { isActive: !branch.isActive } });
    } catch (error) {
      toastService.error(serverMessage(error, t('common.saveUnconfirmed')));
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setServerError('');
    try {
      await deleteBranch.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (error) {
      setServerError(serverMessage(error, t('common.saveUnconfirmed')));
    }
  };

  const columns: GridColumn<Branch>[] = [
    {
      key: 'name',
      label: t('inventory.branchView.name'),
      width: '24%',
      minWidth: 170,
      sortable: true,
      render: (_value, row) => {
        const managerName = row.managerEmployeeId
          ? employeeNames.get(row.managerEmployeeId)
          : null;
        return (
          <span className="flex min-w-0 items-start gap-2">
            <Building2 size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-accent" />
            <span className="min-w-0">
              <span className="block truncate">{row.name}</span>
              <span className="block truncate text-[11px] text-text-secondary">
                {managerName || t('inventory.branchView.noManager')}
              </span>
            </span>
          </span>
        );
      },
    },
    {
      key: 'code',
      label: t('inventory.branchView.code'),
      width: '10%',
      minWidth: 80,
      sortable: true,
      render: (value) => (
        <span className="font-mono text-xs tabular-nums">{String(value || '—')}</span>
      ),
    },
    {
      key: 'contact',
      label: t('inventory.branchView.contact'),
      width: '30%',
      minWidth: 200,
      render: (_value, row) => {
        const location = [row.city, row.state].filter(Boolean).join(', ');
        const lines = [row.address, location, row.phone].filter(
          (line): line is string => Boolean(line),
        );
        if (lines.length === 0) return <span className="text-text-muted">—</span>;
        return (
          <span className="flex min-w-0 flex-col leading-tight">
            {lines.map((line) => (
              <span key={line} className="truncate text-xs text-text-secondary" title={line}>
                {line}
              </span>
            ))}
          </span>
        );
      },
    },
    {
      key: 'warehouses',
      label: t('inventory.branchView.warehouses'),
      width: '10%',
      minWidth: 90,
      align: 'right',
      sortable: true,
      render: (_value, row) => (
        <Link
          to={`/inventory/branches/${row.id}?tab=warehouses`}
          onClick={(event) => event.stopPropagation()}
          className="font-mono text-xs tabular-nums text-accent hover:underline"
        >
          {warehousesQuery.isPending || (warehousesQuery.isError && warehouses.length === 0) ? '—' : warehouseCounts.get(row.id) ?? 0}
        </Link>
      ),
    },
    {
      key: 'isActive',
      label: t('inventory.product.isActive'),
      width: '11%',
      minWidth: 95,
      align: 'center',
      render: (_value, row) => {
        const hasActiveWarehouses = (activeWarehouseCounts.get(row.id) ?? 0) > 0;
        const blocked = row.isActive && (hasActiveWarehouses || warehousesQuery.isPending || warehousesQuery.isError);
        return (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              if (!blocked) void toggleActive(row);
            }}
            disabled={blocked || updateBranch.isPending}
            aria-busy={updateBranch.isPending && updateBranch.variables?.id === row.id}
            title={
              blocked
                ? t('inventory.branchView.deleteBlocked')
                : row.isActive
                  ? t('inventory.branchView.deactivate')
                  : t('inventory.branchView.reactivate')
            }
            aria-label={
              row.isActive
                ? t('inventory.branchView.deactivate')
                : t('inventory.branchView.reactivate')
            }
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              row.isActive ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {row.isActive ? t('inventory.branchView.active') : t('inventory.branchView.inactive')}
          </button>
        );
      },
    },
    {
      key: 'actions',
      label: t('inventory.branchView.actions'),
      width: '15%',
      minWidth: 105,
      align: 'right',
      render: (_value, row) => {
        const hasActiveWarehouses = (activeWarehouseCounts.get(row.id) ?? 0) > 0;
        return (
          <span className="flex items-center justify-end gap-1">
            <Link
              to={`/inventory/branches/${row.id}`}
              onClick={(event) => event.stopPropagation()}
              aria-label={t('inventory.branchView.view')}
              title={t('inventory.branchView.view')}
              className="rounded-md p-1.5 text-text-secondary hover:bg-surface-hover hover:text-text-primary"
            >
              <Eye size={15} aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setServerError('');
                setDeleteTarget(row);
              }}
              disabled={!row.isActive || hasActiveWarehouses || warehousesQuery.isPending || warehousesQuery.isError || deleteBranch.isPending}
              aria-label={t('inventory.branchView.delete')}
              title={
                hasActiveWarehouses
                  ? t('inventory.branchView.deleteBlocked')
                  : t('inventory.branchView.delete')
              }
              className="rounded-md p-1.5 text-text-secondary hover:bg-error/10 hover:text-error disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 size={15} aria-hidden="true" />
            </button>
          </span>
        );
      },
    },
  ];

  return (
    <ListPage
      title={t('inventory.branches')}
      subtitle={t('inventory.branchView.subtitle')}
      onRefresh={() => { void refetch(); void warehousesQuery.refetch(); void employeesQuery.refetch(); }}
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
            placeholder={t('inventory.branchView.searchPlaceholder')}
            aria-label={t('inventory.branchView.searchPlaceholder')}
            className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none sm:w-72"
          />
          <button
            onClick={toggleForm}
            className="ml-auto inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover"
          >
            <Plus size={14} aria-hidden="true" />
            {t('inventory.branchView.createTitle')}
          </button>
        </div>
      }
    >
      {(isError || warehousesQuery.isError || employeesQuery.isError) && <div role="alert" className="mb-4 text-sm text-error">
        {locale === 'en' ? 'Could not load branch data. Existing data may be outdated.' : 'No se pudieron cargar los datos de sucursales. Los datos visibles pueden estar desactualizados.'}
        <button type="button" onClick={() => { void refetch(); void warehousesQuery.refetch(); void employeesQuery.refetch(); }} disabled={isFetching || warehousesQuery.isFetching || employeesQuery.isFetching} className="ml-3 font-semibold text-accent disabled:opacity-50">{t('common.retry')}</button>
      </div>}
      <div className="mb-4 grid shrink-0 grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
        <SummaryCell
          label={t('inventory.branchView.metricsTotal')}
          value={isLoading || (isError && branches.length === 0) ? '—' : metrics.total}
          emphasis
        />
        <SummaryCell
          label={t('inventory.branchView.metricsActive')}
          value={isLoading || (isError && branches.length === 0) ? '—' : metrics.active}
          dot="var(--status-success)"
        />
        <SummaryCell
          label={t('inventory.branchView.metricsInactive')}
          value={isLoading || (isError && branches.length === 0) ? '—' : metrics.inactive}
          dot="var(--status-error)"
        />
        <SummaryCell
          label={t('inventory.branchView.metricsWarehouses')}
          value={warehousesQuery.isPending || (warehousesQuery.isError && warehouses.length === 0) ? '—' : metrics.warehouses}
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
              {t('inventory.branchView.createTitle')}
            </h2>
          </div>
          <div className="grid gap-3 p-4 md:grid-cols-3">
            <FormInput
              form={form}
              name="name"
              label={t('inventory.branchView.name')}
              placeholder={t('inventory.branchView.namePlaceholder')}
              ariaLabel={t('inventory.branchView.name')}
              className="md:col-span-2"
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
              name="city"
              label={t('inventory.branchView.city')}
              placeholder={t('inventory.branchView.cityPlaceholder')}
              ariaLabel={t('inventory.branchView.city')}
            />
            <FormInput
              form={form}
              name="state"
              label={t('inventory.branchView.state')}
              placeholder={t('inventory.branchView.statePlaceholder')}
              ariaLabel={t('inventory.branchView.state')}
            />
            <FormPhoneInput
              form={form}
              name="phone"
              label={t('inventory.branchView.phone')}
            />
            <FormInput
              form={form}
              name="address"
              label={t('inventory.branchView.address')}
              placeholder={t('inventory.branchView.addressPlaceholder')}
              ariaLabel={t('inventory.branchView.address')}
              className="md:col-span-2"
            />
            <FormCombobox
              form={form}
              name="managerEmployeeId"
              label={t('inventory.branchView.manager')}
              placeholder={t('inventory.branchView.managerPlaceholder')}
              options={employeeOptions}
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
                disabled={createBranch.isPending}
                aria-busy={createBranch.isPending}
                className="rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                {t('common.save')}
              </button>
            </div>
          </div>
        </form>
      )}

      {!(isError && branches.length === 0) && <VirtualGrid
        data={pagination.pageItems}
        columns={columns}
        loading={isLoading}
        onSort={handleSort}
        sortColumn={sortColumn ?? undefined}
        sortDirection={sortDirection}
        onRowClick={(row) => navigate(`/inventory/branches/${row.id}`)}
        emptyMessage={t('inventory.branchView.empty')}
        emptyActionLabel={branches.length === 0 ? t('common.create') : undefined}
        emptyAction={branches.length === 0 ? toggleForm : undefined}
      />}

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={t('inventory.branchView.deleteTitle')}
        size="sm"
      >
        <p className="text-sm text-text-secondary">
          {t('inventory.branchView.deleteConfirm').replace('{name}', deleteTarget?.name ?? '')}
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
            disabled={deleteBranch.isPending}
            className="rounded-lg bg-error px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            {t('inventory.branchView.delete')}
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
  dot,
}: {
  label: string;
  value: string | number;
  emphasis?: boolean;
  dot?: string;
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
        <span className="truncate" title={String(value)}>
          {value}
        </span>
      </div>
    </div>
  );
}
