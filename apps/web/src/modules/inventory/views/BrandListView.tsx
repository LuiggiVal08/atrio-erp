import { useRef, useState } from 'react';
import { Check, ImagePlus, Pencil, Plus, RotateCw, X } from 'lucide-react';
import { CardSkeleton } from '@/core/components/CardSkeleton';
import { EmptyState } from '@/core/components/EmptyState';
import { ListPagination } from '@/core/components/ListPagination';
import { usePagination } from '@/shared/hooks/usePagination';
import { usePermission } from '@/core/auth/usePermission';
import { useTranslation } from '@/shared/hooks/useTranslation';
import {
  useCreateBrand,
  useBrands,
  useUpdateBrand,
  useUploadBrandLogo,
  type ProductBrand,
} from '../hooks/useBrands';

function serverMessage(err: any, fallback: string): string {
  const message = err?.response?.data?.message;
  if (Array.isArray(message)) return message.join(' · ');
  return typeof message === 'string' && message ? message : fallback;
}

export function BrandListView() {
  const { t } = useTranslation();
  const canCreate = usePermission('inventory:brand:create');
  const canUpdate = usePermission('inventory:brand:update');
  const { data: brands = [], isLoading, refetch, isFetching } = useBrands();
  const createBrand = useCreateBrand();
  const updateBrand = useUpdateBrand();
  const uploadLogo = useUploadBrandLogo();
  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState<ProductBrand | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logoTarget, setLogoTarget] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const createInputRef = useRef<HTMLInputElement>(null);
  const pagination = usePagination(brands);

  const submitCreate = () => {
    if (!newName.trim() || !canCreate) return;
    setError(null);
    createBrand.mutate(
      { name: newName.trim() },
      {
        onSuccess: () => {
          setNewName('');
          setError(null);
        },
        onError: (err: any) =>
          setError(serverMessage(err, t('inventory.brandView.createError'))),
      },
    );
  };

  const saveEdit = () => {
    if (!editing?.name.trim() || !canUpdate) return;
    setError(null);
    updateBrand.mutate(
      { id: editing.id, name: editing.name.trim() },
      {
        onSuccess: () => {
          setEditing(null);
          setError(null);
        },
        onError: (err: any) =>
          setError(serverMessage(err, t('inventory.brandView.updateError'))),
      },
    );
  };

  const chooseLogo = (brandId: string) => {
    if (!canUpdate) return;
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
          setError(serverMessage(err, t('inventory.brandView.logoError'))),
      },
    );
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-3">
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-text-primary">{t('inventory.brands')}</h1>
          <p className="mt-0.5 text-xs text-text-secondary">{t('inventory.brandView.subtitle')}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
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
          {!isLoading && (
            <span className="whitespace-nowrap rounded-full bg-accent-alpha px-2.5 py-1 font-mono text-xs font-semibold tabular-nums text-accent">
              {t('inventory.brandView.count').replace('{count}', String(pagination.total))}
            </span>
          )}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-6">
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
        {canCreate && <div className="mb-5 flex max-w-xl items-center gap-2 rounded-xl border border-border bg-surface p-3">
          <input
            ref={createInputRef}
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
        </div>}
        <input
          ref={logoInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            uploadSelectedLogo(event.target.files?.[0]);
            event.target.value = '';
          }}
        />
        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <CardSkeleton key={index} />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pagination.pageItems.map((brand) => (
              <article
                key={brand.id}
                className="rounded-xl border border-border bg-surface p-4 transition-colors hover:border-accent/50"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => chooseLogo(brand.id)}
                    disabled={!canUpdate}
                    className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-canvas text-text-muted hover:border-accent disabled:cursor-default"
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
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') saveEdit();
                          if (event.key === 'Escape') setEditing(null);
                        }}
                        aria-label={t('inventory.brandView.namePlaceholder')}
                        className="w-full rounded border border-border bg-canvas px-2 py-1 text-sm text-text-primary focus:border-accent focus:outline-none"
                      />
                    ) : (
                      <h2 className="truncate text-sm font-semibold text-text-primary">
                        {brand.name}
                      </h2>
                    )}
                    <p className="mt-1">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          brand.isActive ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                        }`}
                      >
                        {brand.isActive
                          ? t('inventory.brandView.active')
                          : t('inventory.brandView.inactive')}
                      </span>
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
                  ) : canUpdate ? (
                    <button
                      onClick={() => setEditing(brand)}
                      className="rounded p-1.5 text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
                      aria-label={t('common.edit')}
                    >
                      <Pencil size={16} aria-hidden="true" />
                    </button>
                  ) : null}
                </div>
                {canUpdate && <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
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
                            setError(serverMessage(err, t('inventory.brandView.updateError'))),
                        },
                      );
                    }}
                    className="text-xs font-medium text-text-secondary hover:text-text-primary"
                  >
                    {brand.isActive
                      ? t('inventory.brandView.deactivate')
                      : t('inventory.brandView.activate')}
                  </button>
                </div>}
              </article>
            ))}
          </div>
        )}
        {!isLoading && !pagination.total && (
          <EmptyState
            message={t('inventory.brandView.empty')}
            actionLabel={canCreate ? t('common.create') : undefined}
            onAction={canCreate ? () => createInputRef.current?.focus() : undefined}
          />
        )}
      </div>
      {!isLoading && (
        <div className="shrink-0 border-t border-border px-6 py-2">
          <ListPagination
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            totalPages={pagination.totalPages}
            onPageChange={pagination.setPage}
            onPageSizeChange={pagination.setPageSize}
          />
        </div>
      )}
    </div>
  );
}