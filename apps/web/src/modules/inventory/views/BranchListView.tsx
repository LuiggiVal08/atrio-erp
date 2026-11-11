import { useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import { Building2, Search } from 'lucide-react';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { useBranches, useCreateBranch, useUpdateBranch, type Branch } from '../hooks/useBranches';
import { useWarehouses } from '../hooks/useWarehouses';
import { VirtualGrid, type GridColumn } from '@/core/components/VirtualGrid';

export function BranchListView() {
  const { t } = useTranslation();
  const { data: branches = [], isLoading } = useBranches();
  const { data: warehouses = [] } = useWarehouses();
  const createBranch = useCreateBranch();
  const updateBranch = useUpdateBranch();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [search, setSearch] = useState('');

  const serverMessage = isAxiosError(createBranch.error) ? createBranch.error.response?.data?.message : undefined;
  const errorMessage = Array.isArray(serverMessage) ? serverMessage.join(' ') : typeof serverMessage === 'string' ? serverMessage : t('common.saveUnconfirmed');

  const handleCreate = () => {
    if (!name.trim() || createBranch.isPending) return;
    createBranch.mutate({
      name: name.trim(),
      code: code.trim() || undefined,
      address: address.trim() || undefined,
      phone: phone.trim() || undefined,
    }, {
      onSuccess: () => {
        setName('');
        setCode('');
        setAddress('');
        setPhone('');
        setShowForm(false);
      },
    });
  };

  const filteredBranches = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return branches;
    return branches.filter((branch) =>
      branch.name.toLowerCase().includes(needle)
      || branch.code?.toLowerCase().includes(needle)
      || branch.address?.toLowerCase().includes(needle));
  }, [branches, search]);

  const columns: GridColumn<Branch>[] = [
    { key: 'name', label: t('inventory.branchView.name'), sortable: true, render: (_value, row) =>
      <span className="flex items-center gap-2"><Building2 size={15} aria-hidden="true" className="text-accent" />{row.name}</span> },
    { key: 'code', label: t('inventory.branchView.code'), width: 100, render: (value) => String(value || '—') },
    { key: 'address', label: t('inventory.branchView.address'), render: (value) => String(value || '—') },
    { key: 'warehouses', label: t('inventory.branchView.warehouses'), width: 120, render: (_value, row) =>
      String(warehouses.filter((warehouse) => warehouse.branchId === row.id).length) },
    { key: 'isActive', label: t('inventory.product.isActive'), width: 120, render: (_value, row) =>
      <button
        onClick={() => updateBranch.mutate({ id: row.id, data: { isActive: !row.isActive } })}
        aria-label={row.isActive ? t('inventory.branchView.inactive') : t('inventory.branchView.active')}
        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${row.isActive ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}
      >
        {row.isActive ? t('inventory.branchView.active') : t('inventory.branchView.inactive')}
      </button> },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <div>
          <h1 className="text-lg font-bold text-text-primary">{t('inventory.branches')}</h1>
          <p className="mt-0.5 text-xs text-text-secondary">{t('inventory.branchView.subtitle')}</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover">
          + {t('common.create')}
        </button>
      </div>
      <div className="flex-1 overflow-auto p-6">
        {showForm && (
          <div className="mb-4 rounded-xl border border-border bg-surface p-4">
            <div className="mb-3 text-sm font-semibold text-text-primary">{t('inventory.branchView.createTitle')}</div>
            <div className="grid gap-3 md:grid-cols-4">
              <input value={name} onChange={(event) => setName(event.target.value)}
                placeholder={t('inventory.branchView.namePlaceholder')}
                aria-label={t('inventory.branchView.name')}
                className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none" />
              <input value={code} onChange={(event) => setCode(event.target.value)}
                placeholder={t('inventory.branchView.codePlaceholder')}
                aria-label={t('inventory.branchView.code')}
                className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none" />
              <input value={address} onChange={(event) => setAddress(event.target.value)}
                placeholder={t('inventory.branchView.addressPlaceholder')}
                aria-label={t('inventory.branchView.address')}
                className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none" />
              <input value={phone} onChange={(event) => setPhone(event.target.value)}
                placeholder={t('inventory.branchView.phonePlaceholder')}
                aria-label={t('inventory.branchView.phone')}
                className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none" />
            </div>
            {createBranch.isError && <p role="alert" className="mt-3 text-sm text-error">{errorMessage}</p>}
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={() => setShowForm(false)}
                className="rounded-lg px-3 py-2 text-xs text-text-secondary hover:text-text-primary">{t('common.cancel')}</button>
              <button onClick={handleCreate} disabled={!name.trim() || createBranch.isPending}
                className="rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{t('common.save')}</button>
            </div>
          </div>
        )}
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
          <Search size={14} aria-hidden="true" className="text-text-secondary" />
          <input value={search} onChange={(event) => setSearch(event.target.value)}
            placeholder={t('inventory.branchView.searchPlaceholder')}
            aria-label={t('inventory.branchView.searchPlaceholder')}
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-secondary focus:outline-none" />
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <VirtualGrid data={filteredBranches} columns={columns} loading={isLoading} emptyMessage={t('inventory.branchView.empty')} />
        </div>
      </div>
    </div>
  );
}
