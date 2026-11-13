import { useRef, useState } from 'react';
import { Check, ImagePlus, Pencil, Plus, RotateCw, X } from 'lucide-react';
import { ListPagination } from '@/core/components/ListPagination';
import { usePagination } from '@/shared/hooks/usePagination';
import { useTranslation } from '@/shared/hooks/useTranslation';
import {
  useCreateBrand,
  useBrands,
  useUpdateBrand,
  useUploadBrandLogo,
  type ProductBrand,
} from '../hooks/useBrands';

export function BrandListView() {
  const { t } = useTranslation();
  const { data: brands = [], isLoading, refetch, isFetching } = useBrands();
  const createBrand = useCreateBrand();
  const updateBrand = useUpdateBrand();
  const uploadLogo = useUploadBrandLogo();
  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState<ProductBrand | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logoTarget, setLogoTarget] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const pagination = usePagination(brands);

  const submitCreate = () => {
    if (!newName.trim()) return;
    setError(null);
    createBrand.mutate(
      { name: newName.trim() },
      {
        onSuccess: () => {
          setNewName('');
          setError(null);
        },
        onError: (err: any) =>
          setError(err?.response?.data?.message ?? t('inventory.brandView.createError')),
      },
    );
  };

  const saveEdit = () => {
    if (!editing?.name.trim()) return;
    setError(null);
    updateBrand.mutate(
      { id: editing.id, name: editing.name.trim() },
      {
        onSuccess: () => {
          setEditing(null);
          setError(null);
        },
        onError: (err: any) =>
          setError(err?.response?.data?.message ?? t('inventory.brandView.updateError')),
      },
    );
  };

  const chooseLogo = (brandId: string) => {
    setLogoTarget(brandId);
    logoInputRef.current?.click();
  };

  const uploadSelectedLogo = (file?: File) => {
    if (!file || !logoTarget || !file.type.startsWith('image/')) return;
    setError(null);
    uploadLogo.mutate(
      { id: logoTarget, file },
      {
        onSuccess: () => {
          setLogoTarget(null);
          setError(null);
        },
        onError: (err: any) =>
          setError(err?.response?.data?.message ?? t('inventory.brandView.logoError')),
      },
    );
  };

  if (isLoading)
    return (
      <div className="flex h-full items-center justify-center text-text-secondary">
        {t('common.loading')}
      </div>
    );

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <div>
          <h1 className="text-lg font-bold text-text-primary">{t('inventory.brands')}</h1>
          <p className="mt-0.5 text-xs text-text-secondary">{t('inventory.brandView.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
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
          <span className="rounded-full bg-accent-alpha px-2.5 py-1 text-xs font-semibold text-accent">
            {t('inventory.brandView.count').replace('{count}', String(pagination.total))}
          </span>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-6">
        {error && (
          <div
            role="alert"
            className="mb-4 flex items-center gap-2 rounded-lg border border-error/30 bg-error/10 px-4 py-2 text-sm text-error"
          >
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} aria-label={t('common.close')}>
              <X size={14} aria-hidden="true" />
            </button>
          </div>
        )}
        <div className="mb-5 flex max-w-xl items-center gap-2 rounded-xl border border-border bg-surface p-3">
          <input
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && submitCreate()}
            placeholder={t('inventory.brandView.namePlaceholder')}
            aria-label={t('inventory.brandView.namePlaceholder')}
            className="min-w-0 flex-1 rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none"
          />
          <button
            onClick={submitCreate}
            disabled={!newName.trim() || createBrand.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
          >
            <Plus size={14} aria-hidden="true" /> {t('common.create')}
          </button>
        </div>
        <input
          ref={logoInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => uploadSelectedLogo(event.target.files?.[0])}
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pagination.pageItems.map((brand) => (
            <article
              key={brand.id}
              className="group rounded-xl border border-border bg-surface p-4 transition-colors hover:border-accent/50"
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => chooseLogo(brand.id)}
                  className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-canvas text-text-muted hover:border-accent"
                  aria-label={t('inventory.brandView.changeLogo')}
                >
                  {brand.logoUrl ? (
                    <img src={brand.logoUrl} alt="" className="h-full w-full object-contain" />
                  ) : (
                    <ImagePlus size={18} aria-hidden="true" />
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  {editing?.id === brand.id ? (
                    <input
                      autoFocus
                      value={editing.name}
                      onChange={(event) => setEditing({ ...editing, name: event.target.value })}
                      className="w-full rounded border border-border bg-canvas px-2 py-1 text-sm text-text-primary focus:border-accent focus:outline-none"
                    />
                  ) : (
                    <h2 className="truncate text-sm font-semibold text-text-primary">
                      {brand.name}
                    </h2>
                  )}
                  <p className="mt-1 text-xs text-text-secondary">
                    {brand.isActive
                      ? t('inventory.brandView.active')
                      : t('inventory.brandView.inactive')}
                  </p>
                </div>
                {editing?.id === brand.id ? (
                  <div className="flex gap-1">
                    <button
                      onClick={saveEdit}
                      disabled={updateBrand.isPending}
                      className="rounded p-1.5 text-success hover:bg-success/10"
                      aria-label={t('common.save')}
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={() => setEditing(null)}
                      className="rounded p-1.5 text-text-secondary hover:bg-surface-hover"
                      aria-label={t('common.cancel')}
                    >
                      <X size={16} aria-hidden="true" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditing(brand)}
                    className="rounded p-1.5 text-text-secondary opacity-0 transition-opacity hover:bg-surface-hover hover:text-text-primary group-hover:opacity-100"
                    aria-label={t('common.edit')}
                  >
                    <Pencil size={16} aria-hidden="true" />
                  </button>
                )}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <button
                  onClick={() => chooseLogo(brand.id)}
                  className="text-xs font-medium text-accent hover:underline"
                >
                  {brand.logoFile
                    ? t('inventory.brandView.changeLogo')
                    : t('inventory.brandView.addLogo')}
                </button>
                <button
                  onClick={() => {
                    setError(null);
                    updateBrand.mutate(
                      { id: brand.id, isActive: !brand.isActive },
                      {
                        onError: (err: any) =>
                          setError(
                            err?.response?.data?.message ?? t('inventory.brandView.updateError'),
                          ),
                      },
                    );
                  }}
                  className="text-xs text-text-secondary hover:text-text-primary"
                >
                  {brand.isActive
                    ? t('inventory.brandView.deactivate')
                    : t('inventory.brandView.activate')}
                </button>
              </div>
            </article>
          ))}
        </div>
        {!pagination.total && (
          <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-text-secondary">
            {t('inventory.brandView.empty')}
          </div>
        )}
        <div className="mt-4 border-t border-border pt-3">
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
