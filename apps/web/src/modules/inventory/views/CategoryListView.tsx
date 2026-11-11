import { useState } from 'react';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { Pencil, Trash2, X, Check } from 'lucide-react';
import { useCategories } from '@/shared/hooks/useCategories';
import { useCreateCategory } from '../hooks/useCreateCategory';
import { useUpdateCategory } from '../hooks/useUpdateCategory';
import { useDeleteCategory } from '../hooks/useDeleteCategory';

interface EditingState {
  id: string;
  name: string;
  parentId: string;
}

export function CategoryListView() {
  const { t } = useTranslation();
  const { data: categories = [], isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [newName, setNewName] = useState('');
  const [newParentId, setNewParentId] = useState('');
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const handleCreate = () => {
    if (!newName.trim()) return;
    createCategory.mutate(
      { name: newName.trim(), parentId: newParentId || undefined },
      {
        onSuccess: () => {
          setNewName('');
          setNewParentId('');
          setError(null);
        },
      },
    );
  };

  const handleStartEdit = (id: string) => {
    const cat = categoryMap.get(id);
    if (!cat) return;
    setEditing({ id, name: cat.name, parentId: cat.parentId ?? '' });
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
        onSuccess: () => setEditing(null),
      },
    );
  };

  const handleCancelEdit = () => setEditing(null);

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(t('inventory.categoryView.deleteConfirm').replace('{name}', name))) return;
    deleteCategory.mutate(id, {
      onError: (err: any) => {
        const message = err?.response?.data?.message || err?.message || t('inventory.categoryView.deleteError');
        setError(Array.isArray(message) ? message.join(' ') : message);
      },
    });
  };

  const parentOptions = categories.filter((c) => c.id !== editing?.id);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-text-secondary">
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-3">
        <div>
          <h1 className="text-lg font-bold text-text-primary">{t('inventory.categories')}</h1>
          <p className="mt-0.5 text-xs text-text-secondary">{t('inventory.categoryView.subtitle')}</p>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-6">
        {error && (
          <div role="alert" className="mb-4 flex items-center gap-2 rounded-lg border border-error/30 bg-error/10 px-4 py-2 text-sm text-error">
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} aria-label={t('common.close')} className="text-error hover:opacity-80">
              <X size={14} aria-hidden="true" />
            </button>
          </div>
        )}

        <div className="mb-4 flex items-center gap-2 rounded-lg border border-border bg-surface p-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t('inventory.categoryView.namePlaceholder')}
            aria-label={t('inventory.categoryView.name')}
            className="flex-1 rounded border border-border bg-canvas px-2 py-1.5 text-xs text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none"
          />
          <select
            value={newParentId}
            onChange={(e) => setNewParentId(e.target.value)}
            aria-label={t('inventory.categoryView.parent')}
            className="rounded border border-border bg-canvas px-2 py-1.5 text-xs text-text-primary focus:border-accent focus:outline-none"
          >
            <option value="">{t('inventory.categoryView.noParent')}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleCreate}
            disabled={createCategory.isPending || !newName.trim()}
            className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
          >
            + {t('common.create')}
          </button>
        </div>

        <div className="rounded-xl border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-semibold text-text-secondary">
                <th className="px-4 py-3">{t('inventory.categoryView.name')}</th>
                <th className="px-4 py-3">{t('inventory.categoryView.parent')}</th>
                <th className="px-4 py-3 text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-text-secondary">
                    {t('inventory.categoryView.empty')}
                  </td>
                </tr>
              ) : (
                categories.map((cat) => {
                  const isEditing = editing?.id === cat.id;
                  const parentName = cat.parentId ? categoryMap.get(cat.parentId)?.name : null;

                  return (
                    <tr key={cat.id} className="border-b border-border last:border-b-0 hover:bg-surface-hover">
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editing.name}
                            onChange={(e) =>
                              setEditing({ ...editing, name: e.target.value })
                            }
                            className="w-full rounded border border-border bg-canvas px-2 py-1 text-xs text-text-primary focus:border-accent focus:outline-none"
                            autoFocus
                          />
                        ) : (
                          <span className="text-text-primary">{cat.name}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <select
                            value={editing.parentId}
                            onChange={(e) =>
                              setEditing({ ...editing, parentId: e.target.value })
                            }
                            className="w-full rounded border border-border bg-canvas px-2 py-1 text-xs text-text-primary focus:border-accent focus:outline-none"
                          >
                            <option value="">{t('inventory.categoryView.noParent')}</option>
                            {parentOptions.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-text-secondary">
                            {parentName ?? '—'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isEditing ? (
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
                              onClick={handleCancelEdit}
                              className="rounded p-1 text-text-secondary hover:bg-canvas"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleStartEdit(cat.id)}
                              className="rounded p-1 text-text-secondary hover:bg-canvas"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(cat.id, cat.name)}
                              disabled={deleteCategory.isPending}
                              aria-label={t('common.delete')}
                              className="rounded p-1 text-text-secondary hover:bg-error/10 hover:text-error disabled:opacity-50"
                            >
                              <Trash2 size={16} aria-hidden="true" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
