import { useMemo, useState } from 'react';
import { useForm } from '@tanstack/react-form';
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
import { applyServerErrors, resolveServerErrorMessage, clearServerErrors, FormInput, FormSelect } from '@/shared/form';
import { warehouseFormSchema, type WarehouseFormValues } from '@/shared/validation/warehouse';

export function WarehouseListView() {
  const { t } = useTranslation();
  const { data: warehouses, isLoading, refetch, isFetching } = useWarehouses();
  const { data: branches = [] } = useBranches();
  const createWarehouse = useCreateWarehouse();
  const updateWarehouse = useUpdateWarehouse();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [serverError, setServerError] = useState('');

  const form = useForm({
    defaultValues: {
      name: '',
      code: '',
      branchId: '',
      aisle: '',
      shelf: '',
      level: '',
      bin: '',
    } satisfies WarehouseFormValues,
    validators: { onSubmit: warehouseFormSchema },
    onSubmit: async ({ value }) => {
      setServerError('');
      try {
        await createWarehouse.mutateAsync({
          name: value.name.trim(),
          code: value.code.trim() || undefined,
          branchId: value.branchId || undefined,
          aisle: value.aisle || undefined,
          shelf: value.shelf || undefined,
          level: value.level || undefined,
          bin: value.bin || undefined,
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
            {t('inventory.warehouseView.createTitle')}
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <FormInput
              form={form}
              name="name"
              placeholder={t('inventory.warehouseView.namePlaceholder')}
              ariaLabel={t('inventory.warehouseView.name')}
            />
            <FormInput
              form={form}
              name="code"
              placeholder={t('inventory.warehouseView.codePlaceholder')}
              ariaLabel={t('inventory.warehouseView.code')}
            />
            <FormSelect
              form={form}
              name="branchId"
              ariaLabel={t('inventory.warehouseView.branch')}
              placeholder={t('inventory.warehouseView.noBranch')}
              options={branches.map((branch) => ({ value: branch.id, label: branch.name }))}
            />
            <FormInput
              form={form}
              name="aisle"
              placeholder={t('inventory.warehouseView.aisle')}
              ariaLabel={t('inventory.warehouseView.aisle')}
            />
            <FormInput
              form={form}
              name="shelf"
              placeholder={t('inventory.warehouseView.shelf')}
              ariaLabel={t('inventory.warehouseView.shelf')}
            />
            <FormInput
              form={form}
              name="level"
              placeholder={t('inventory.warehouseView.level')}
              ariaLabel={t('inventory.warehouseView.level')}
            />
            <FormInput
              form={form}
              name="bin"
              placeholder={t('inventory.warehouseView.bin')}
              ariaLabel={t('inventory.warehouseView.bin')}
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createWarehouse.isPending}
                className="rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                {t('common.save')}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg px-3 py-2 text-xs text-text-secondary hover:text-text-primary"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
          {serverError && (
            <p role="alert" className="mt-3 text-sm text-error">
              {serverError}
            </p>
          )}
        </form>
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
