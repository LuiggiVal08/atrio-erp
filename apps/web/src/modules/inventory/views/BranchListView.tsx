import { useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import { Building2 } from 'lucide-react';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { useBranches, useCreateBranch, useUpdateBranch, type Branch } from '../hooks/useBranches';
import { useWarehouses } from '../hooks/useWarehouses';
import { VirtualGrid, type GridColumn } from '@/core/components/VirtualGrid';
import { ListPage } from '@/core/components/ListPage';
import { ListPagination } from '@/core/components/ListPagination';
import { usePagination } from '@/shared/hooks/usePagination';

export function BranchListView() {
  const { t } = useTranslation();
  const { data: branches = [], isLoading, refetch, isFetching } = useBranches();
  const { data: warehouses = [] } = useWarehouses();
  const createBranch = useCreateBranch();
  const updateBranch = useUpdateBranch();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [search, setSearch] = useState('');

  const serverMessage = isAxiosError(createBranch.error)
    ? createBranch.error.response?.data?.message
    : undefined;
  const errorMessage = Array.isArray(serverMessage)
    ? serverMessage.join(' ')
    : typeof serverMessage === 'string'
      ? serverMessage
      : t('common.saveUnconfirmed');

  const handleCreate = () => {
    if (!name.trim() || createBranch.isPending) return;
    createBranch.mutate(
      {
        name: name.trim(),
        code: code.trim() || undefined,
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
      },
      {
        onSuccess: () => {
          setName('');
          setCode('');
          setAddress('');
          setPhone('');
          setShowForm(false);
        },
      },
    );
  };

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

  const pagination = usePagination(filteredBranches, { resetKey: search });

  const columns: GridColumn<Branch>[] = [
    {
      key: 'name',
      label: t('inventory.branchView.name'),
      sortable: true,
      render: (_value, row) => (
        <span className="flex items-center gap-2">
          <Building2 size={15} aria-hidden="true" className="text-accent" />
          {row.name}
        </span>
      ),
    },
    {
      key: 'code',
      label: t('inventory.branchView.code'),
      width: 100,
      render: (value) => String(value || '—'),
    },
    {
      key: 'address',
      label: t('inventory.branchView.address'),
      render: (value) => String(value || '—'),
    },
    {
      key: 'warehouses',
      label: t('inventory.branchView.warehouses'),
      width: 120,
      render: (_value, row) =>
        String(warehouses.filter((warehouse) => warehouse.branchId === row.id).length),
    },
    {
      key: 'isActive',
      label: t('inventory.product.isActive'),
      width: 120,
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
            {t('inventory.branchView.createTitle')}
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t('inventory.branchView.namePlaceholder')}
              aria-label={t('inventory.branchView.name')}
              className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none"
            />
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder={t('inventory.branchView.codePlaceholder')}
              aria-label={t('inventory.branchView.code')}
              className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none"
            />
            <input
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder={t('inventory.branchView.addressPlaceholder')}
              aria-label={t('inventory.branchView.address')}
              className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none"
            />
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder={t('inventory.branchView.phonePlaceholder')}
              aria-label={t('inventory.branchView.phone')}
              className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none"
            />
          </div>
          {createBranch.isError && (
            <p role="alert" className="mt-3 text-sm text-error">
              {errorMessage}
            </p>
          )}
          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="rounded-lg px-3 py-2 text-xs text-text-secondary hover:text-text-primary"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleCreate}
              disabled={!name.trim() || createBranch.isPending}
              className="rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
            >
              {t('common.save')}
            </button>
          </div>
        </div>
      )}
      <VirtualGrid
        data={pagination.pageItems}
        columns={columns}
        loading={isLoading}
        emptyMessage={t('inventory.branchView.empty')}
      />
    </ListPage>
  );
}
