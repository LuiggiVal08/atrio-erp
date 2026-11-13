import { useState } from 'react';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { useDepartments, useCreateDepartment } from '../hooks/useDepartments';
import { VirtualGrid, type GridColumn } from '@/core/components/VirtualGrid';
import { ListPagination } from '@/core/components/ListPagination';
import { usePagination } from '@/shared/hooks/usePagination';
import { RotateCw } from 'lucide-react';
import type { Department } from '../hooks/useDepartments';

export function DepartmentListView() {
  const { t } = useTranslation();
  const { data: departments = [], isLoading, refetch, isFetching } = useDepartments();
  const createDept = useCreateDepartment();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  const handleAdd = () => {
    if (!name.trim() || !code.trim()) return;
    createDept.mutate({ name: name.trim(), code: code.trim() });
    setName('');
    setCode('');
  };

  const pagination = usePagination(departments);

  const columns: GridColumn<Department>[] = [
    { key: 'name', label: t('hr.department.name'), sortable: true },
    { key: 'code', label: t('hr.department.code'), width: 120 },
    {
      key: 'isActive',
      label: t('hr.employee.status'),
      width: 100,
      render: (v) => (v ? t('hr.employee.active') : t('hr.employee.inactive')),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-text-secondary">
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <h1 className="text-lg font-bold text-text-primary">{t('hr.departments')}</h1>
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          aria-label={t('common.refresh')}
          title={t('common.refresh')}
          className="rounded-lg border border-border p-1.5 text-text-secondary transition-colors hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RotateCw size={14} aria-hidden="true" className={isFetching ? 'animate-spin' : ''} />
        </button>
      </div>
      <div className="flex-1 overflow-auto space-y-6 p-6">
        <div className="rounded-lg border border-border bg-surface p-6">
          <h2 className="mb-4 text-sm font-bold text-text-primary">{t('hr.department.create')}</h2>
          <div className="flex gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('hr.department.name')}
              className="flex-1 rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
            />
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={t('hr.department.code')}
              className="w-32 rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
            />
            <button
              onClick={handleAdd}
              disabled={createDept.isPending}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50"
            >
              {t('common.create')}
            </button>
          </div>
        </div>

        <VirtualGrid
          columns={columns}
          data={pagination.pageItems}
          loading={isLoading}
          emptyMessage={t('common.noResults')}
        />
        <div className="mt-3 border-t border-border pt-3">
          <ListPagination
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            totalPages={pagination.totalPages}
            onPageChange={pagination.setPage}
            onPageSizeChange={pagination.setPageSize}
          />
        </div>
      </div>
    </div>
  );
}
