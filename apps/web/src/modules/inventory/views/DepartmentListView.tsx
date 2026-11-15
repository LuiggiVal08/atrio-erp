import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { useDepartments, useCreateDepartment } from '../hooks/useDepartments';
import { applyServerErrors, resolveServerErrorMessage, FormInput } from '@/shared/form';
import {
  departmentFormSchema,
  type DepartmentFormValues,
} from '@/shared/validation/department';
import { VirtualGrid, type GridColumn } from '@/core/components/VirtualGrid';
import { ListPagination } from '@/core/components/ListPagination';
import { usePagination } from '@/shared/hooks/usePagination';
import { RotateCw } from 'lucide-react';
import type { Department } from '../hooks/useDepartments';

const defaultValues: DepartmentFormValues = { name: '' };

export function DepartmentListView() {
  const { t } = useTranslation();
  const { data: departments = [], isLoading, refetch, isFetching } = useDepartments();
  const createDept = useCreateDepartment();
  const [serverError, setServerError] = useState('');

  const form = useForm({
    defaultValues,
    validators: { onSubmit: departmentFormSchema },
    onSubmit: async ({ value }) => {
      setServerError('');
      try {
        await createDept.mutateAsync({ name: value.name.trim() });
        form.reset();
      } catch (error) {
        const result = applyServerErrors(form, error);
        setServerError(resolveServerErrorMessage(result, t('common.saveUnconfirmed')));
      }
    },
  });

  const pagination = usePagination(departments);

  const columns: GridColumn<Department>[] = [
    { key: 'name', label: t('hr.department.name'), sortable: true },
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
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void form.handleSubmit();
            }}
          >
            <div className="flex gap-3">
              <FormInput
                form={form}
                name="name"
                placeholder={t('hr.department.name')}
                className="flex-1"
              />
              <button
                type="submit"
                disabled={createDept.isPending}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50"
              >
                {t('common.create')}
              </button>
            </div>
            {serverError && (
              <p role="alert" className="mt-2 text-xs text-red-500">
                {serverError}
              </p>
            )}
          </form>
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
