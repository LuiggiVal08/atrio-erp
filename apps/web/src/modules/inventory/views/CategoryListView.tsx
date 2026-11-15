import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useCategories } from '@/shared/hooks/useCategories';
import { useCreateCategory } from '../hooks/useCreateCategory';
import { useUpdateCategory } from '../hooks/useUpdateCategory';
import { useDeleteCategory } from '../hooks/useDeleteCategory';
import { VirtualGrid, type GridColumn } from '@/core/components/VirtualGrid';
import { ListPage } from '@/core/components/ListPage';
import { ListPagination } from '@/core/components/ListPagination';
import { usePagination } from '@/shared/hooks/usePagination';
import { Modal } from '@/core/components/Modal';
import { applyServerErrors, resolveServerErrorMessage, clearServerErrors, FormInput, FormSelect } from '@/shared/form';
import { categoryFormSchema, type CategoryFormValues } from '@/shared/validation/category';

interface CategoryRow {
  id: string;
  name: string;
  parentId?: string;
}

interface EditingState {
  id: string;
  name: string;
  parentId: string;
}

export function CategoryListView() {
  const { t } = useTranslation();
  const { data: categories = [], isLoading, refetch, isFetching } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryRow | null>(null);

  const form = useForm({
    defaultValues: { name: '', parentId: '' } satisfies CategoryFormValues,
    validators: { onSubmit: categoryFormSchema },
    onSubmit: async ({ value }) => {
      setError(null);
      try {
        await createCategory.mutateAsync({
          name: value.name.trim(),
          parentId: value.parentId || undefined,
        });
        form.reset();
        setShowForm(false);
      } catch (err) {
        const result = applyServerErrors(form, err);
        setError(resolveServerErrorMessage(result, t('inventory.categoryView.createError')));
      }
    },
  });

  const categoryMap = new Map<string, CategoryRow>(
    categories.map((c): [string, CategoryRow] => [c.id, c]),
  );

  const toggleForm = () => {
    if (showForm) {
      form.reset();
      setShowForm(false);
    } else {
      clearServerErrors(form);
      setError(null);
      setShowForm(true);
    }
  };

  const handleStartEdit = (row: CategoryRow) => {
    setEditing({ id: row.id, name: row.name, parentId: row.parentId ?? '' });
  };

  const handleSaveEdit = () => {
    if (!editing || !editing.name.trim()) return;
    updateCategory.mutate(
      {
        id: editing.id,
        name: editing.name.trim(),
        parentId: editing.parentId || undefined,
      },
      {
        onSuccess: () => {
          setEditing(null);
          setError(null);
        },
        onError: (err: any) => {
          const message =
            err?.response?.data?.message || err?.message || t('inventory.categoryView.updateError');
          setError(Array.isArray(message) ? message.join(' ') : message);
        },
      },
    );
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteCategory.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        setError(null);
      },
      onError: (err: any) => {
        const message =
          err?.response?.data?.message || err?.message || t('inventory.categoryView.deleteError');
        setError(Array.isArray(message) ? message.join(' ') : message);
        setDeleteTarget(null);
      },
    });
  };

  const handleEditKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSaveEdit();
    } else if (event.key === 'Escape') {
      setEditing(null);
    }
  };

  const pagination = usePagination(categories);

  const parentOptions = categories.filter((c) => c.id !== editing?.id);

  const columns: GridColumn<CategoryRow>[] = [
    {
      key: 'name',
      label: t('inventory.categoryView.name'),
      render: (_value, row) => {
        if (editing?.id === row.id) {
          return (
            <input
              type="text"
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              onKeyDown={handleEditKeyDown}
              aria-label={t('inventory.categoryView.name')}
              className="w-full rounded border border-border bg-canvas px-2 py-1 text-xs text-text-primary focus:border-accent focus:outline-none"
              autoFocus
            />
          );
        }
        return <span className="text-text-primary">{row.name}</span>;
      },
    },
    {
      key: 'parentId',
      label: t('inventory.categoryView.parent'),
      render: (_value, row) => {
        if (editing?.id === row.id) {
          return (
            <select
              value={editing.parentId}
              onChange={(e) => setEditing({ ...editing, parentId: e.target.value })}
              onKeyDown={handleEditKeyDown}
              aria-label={t('inventory.categoryView.parent')}
              className="w-full rounded border border-border bg-canvas px-2 py-1 text-xs text-text-primary focus:border-accent focus:outline-none"
            >
              <option value="">{t('inventory.categoryView.noParent')}</option>
              {parentOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          );
        }
        return (
          <span className="text-text-secondary">
            {row.parentId ? (categoryMap.get(row.parentId)?.name ?? '—') : '—'}
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: '',
      width: 110,
      align: 'right',
      render: (_value, row) => {
        if (editing?.id === row.id) {
          return (
            <div className="flex items-center justify-end gap-1">
              <button
                onClick={handleSaveEdit}
                disabled={updateCategory.isPending}
                aria-label={t('common.save')}
                className="rounded p-1 text-success hover:bg-success/10"
              >
                <Check size={16} aria-hidden="true" />
              </button>
              <button
                onClick={() => setEditing(null)}
                aria-label={t('common.cancel')}
                className="rounded p-1 text-text-secondary hover:bg-canvas"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          );
        }
        return (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => handleStartEdit(row)}
              aria-label={t('common.edit')}
              className="rounded p-1 text-text-secondary hover:bg-canvas"
            >
              <Pencil size={16} aria-hidden="true" />
            </button>
            <button
              onClick={() => setDeleteTarget(row)}
              disabled={deleteCategory.isPending}
              aria-label={t('common.delete')}
              className="rounded p-1 text-text-secondary hover:bg-error/10 hover:text-error disabled:opacity-50"
            >
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <ListPage
      title={t('inventory.categories')}
      subtitle={t('inventory.categoryView.subtitle')}
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
        <button
          onClick={toggleForm}
          aria-expanded={showForm}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover"
        >
          <Plus size={14} aria-hidden="true" />
          {t('inventory.categoryView.create')}
        </button>
      }
    >
      {error && (
        <div
          role="alert"
          className="mb-4 flex shrink-0 items-center gap-2 rounded-lg border border-error/30 bg-error/10 px-4 py-2 text-sm text-error"
        >
          <span className="flex-1">{error}</span>
          <button
            onClick={() => setError(null)}
            aria-label={t('common.close')}
            className="text-error hover:opacity-80"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      )}

      {showForm && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
          className="mb-4 grid shrink-0 grid-cols-1 items-end gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
        >
          <FormInput
            form={form}
            name="name"
            label={t('inventory.categoryView.name')}
            placeholder={t('inventory.categoryView.namePlaceholder')}
            required
          />
          <FormSelect
            form={form}
            name="parentId"
            label={t('inventory.categoryView.parent')}
            placeholder={t('inventory.categoryView.noParent')}
            options={categories.map((cat) => ({ value: cat.id, label: cat.name }))}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                form.reset();
                setShowForm(false);
              }}
              className="rounded-lg px-3 py-2 text-xs text-text-secondary hover:text-text-primary"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={createCategory.isPending}
              className="rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
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
        emptyMessage={t('inventory.categoryView.empty')}
        emptyActionLabel={t('inventory.categoryView.create')}
        emptyAction={() => setShowForm(true)}
      />

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={t('inventory.categoryView.deleteTitle')}
        size="sm"
      >
        <p className="text-sm text-text-secondary">
          {t('inventory.categoryView.deleteConfirm').replace('{name}', deleteTarget?.name ?? '')}
        </p>
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
            onClick={confirmDelete}
            disabled={deleteCategory.isPending}
            className="rounded-lg bg-error px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            {t('common.delete')}
          </button>
        </div>
      </Modal>
    </ListPage>
  );
}
