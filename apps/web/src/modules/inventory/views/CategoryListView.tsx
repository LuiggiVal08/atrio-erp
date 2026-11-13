import { useState } from 'react';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { Check, Pencil, Trash2, X } from 'lucide-react';
import { useCategories } from '@/shared/hooks/useCategories';
import { useCreateCategory } from '../hooks/useCreateCategory';
import { useUpdateCategory } from '../hooks/useUpdateCategory';
import { useDeleteCategory } from '../hooks/useDeleteCategory';
import { VirtualGrid, type GridColumn } from '@/core/components/VirtualGrid';
import { ListPage } from '@/core/components/ListPage';
import { ListPagination } from '@/core/components/ListPagination';
import { usePagination } from '@/shared/hooks/usePagination';

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

const inputClass =
  'w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none';

export function CategoryListView() {
  const { t } = useTranslation();
  const { data: categories = [], isLoading, refetch, isFetching } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newParentId, setNewParentId] = useState('');
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const categoryMap = new Map<string, CategoryRow>(
    categories.map((c): [string, CategoryRow] => [c.id, c]),
  );

  const closeForm = () => {
    setShowForm(false);
    setNewName('');
    setNewParentId('');
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    createCategory.mutate(
      { name: newName.trim(), parentId: newParentId || undefined },
      {
        onSuccess: () => {
          closeForm();
          setError(null);
        },
        onError: (err: any) => {
          const message =
            err?.response?.data?.message || err?.message || t('inventory.categoryView.createError');
          setError(Array.isArray(message) ? message.join(' ') : message);
        },
      },
    );
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

  const handleDelete = (row: CategoryRow) => {
    if (!window.confirm(t('inventory.categoryView.deleteConfirm').replace('{name}', row.name)))
      return;
    deleteCategory.mutate(row.id, {
      onError: (err: any) => {
        const message =
          err?.response?.data?.message || err?.message || t('inventory.categoryView.deleteError');
        setError(Array.isArray(message) ? message.join(' ') : message);
      },
    });
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
              onClick={() => handleDelete(row)}
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
          onClick={() => (showForm ? closeForm() : setShowForm(true))}
          className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover"
        >
          + {t('common.create')}
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
        <div className="mb-4 grid shrink-0 grid-cols-1 items-end gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          <div>
            <label
              htmlFor="category-name"
              className="mb-1 block text-xs font-medium text-text-secondary"
            >
              {t('inventory.categoryView.name')}
            </label>
            <input
              id="category-name"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t('inventory.categoryView.namePlaceholder')}
              className={inputClass}
            />
          </div>
          <div>
            <label
              htmlFor="category-parent"
              className="mb-1 block text-xs font-medium text-text-secondary"
            >
              {t('inventory.categoryView.parent')}
            </label>
            <select
              id="category-parent"
              value={newParentId}
              onChange={(e) => setNewParentId(e.target.value)}
              className={inputClass}
            >
              <option value="">{t('inventory.categoryView.noParent')}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={closeForm}
              className="rounded-lg px-3 py-2 text-xs text-text-secondary hover:text-text-primary"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleCreate}
              disabled={createCategory.isPending || !newName.trim()}
              className="rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
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
        emptyMessage={t('inventory.categoryView.empty')}
      />
    </ListPage>
  );
}
