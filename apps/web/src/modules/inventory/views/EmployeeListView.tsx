import { useTranslation } from '@/shared/hooks/useTranslation';
import { useEmployeeStore, type Employee } from '../store/employee-store';
import { VirtualGrid, type GridColumn } from '@/core/components/VirtualGrid';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const branches = [
  { id: '', label: 'Todos' },
  { id: 'branch-1', label: 'Sucursal Centro' },
  { id: 'branch-2', label: 'Sucursal Este' },
];

export function EmployeeListView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { filteredEmployees, branchFilter, setBranchFilter } = useEmployeeStore();
  const [search, setSearch] = useState('');

  const displayed = search
    ? filteredEmployees.filter((e) =>
        e.name.toLowerCase().includes(search.toLowerCase()) || e.email.toLowerCase().includes(search.toLowerCase()),
      )
    : filteredEmployees;

  const columns: GridColumn<Employee>[] = [
    { key: 'name', label: t('hr.employee.name'), sortable: true },
    { key: 'email', label: t('hr.employee.email'), width: 220 },
    { key: 'role', label: t('hr.employee.role'), width: 140, sortable: true },
    { key: 'branchId', label: t('hr.employee.branch'), width: 160, sortable: true },
    {
      key: 'isActive',
      label: t('hr.employee.status'),
      width: 100,
      render: (v) => (
        <span className={v ? 'text-emerald-500' : 'text-text-secondary'}>
          {v ? t('hr.employee.active') : t('hr.employee.inactive')}
        </span>
      ),
    },
  ];

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-text-primary">{t('hr.title')}</h1>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('common.search')}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none"
          />
          <select
            value={branchFilter ?? ''}
            onChange={(e) => setBranchFilter(e.target.value || null)}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-text-primary focus:border-accent focus:outline-none"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.label}</option>
            ))}
          </select>
          <button
            onClick={() => navigate('/inventory/employees/new')}
            className="rounded-lg bg-accent px-4 py-1.5 text-xs font-medium text-white hover:bg-accent/90"
          >
            {t('hr.employee.create')}
          </button>
        </div>
      </div>
      <VirtualGrid
        data={displayed}
        columns={columns}
        emptyMessage={t('common.noResults')}
        onRowClick={(row) => navigate(`/inventory/employees/${row.id}/edit`)}
      />
    </div>
  );
}
