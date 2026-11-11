import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { toastService } from '@/core/services/toast-service';
import { useProduct } from '../hooks/useProduct';
import { useUpdateProduct } from '../hooks/useUpdateProduct';
import { ProductImageUploader } from '../components/ProductImageUploader';
import { useCategories } from '@/shared/hooks/useCategories';
import { useTaxes } from '../hooks/useTaxes';
import api from '@/shared/lib/api/client';
import { ProductBarcodeLabel } from '../components/ProductBarcodeLabel';

interface FormData {
  name: string;
  description: string;
  categoryId: string;
  unitPrice: string;
  costPrice: string;
  taxId: string;
  isService: boolean;
  isActive: boolean;
  barcode: string;
}

export function ProductDetailView() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading } = useProduct(id!);
  const { data: categories } = useCategories();
  const { data: taxes } = useTaxes();
  const updateProduct = useUpdateProduct();
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState(false);

  const [form, setForm] = useState<FormData>({
    name: '',
    description: '',
    categoryId: '',
    unitPrice: '',
    costPrice: '',
    taxId: '',
    isService: false,
    isActive: true,
    barcode: '',
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-text-secondary">
        {t('common.loading')}
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex h-full items-center justify-center text-text-secondary">
        {t('inventory.product.notFound')}
      </div>
    );
  }

  const enterEdit = () => {
    setForm({
      name: product.name ?? '',
      description: product.description ?? '',
      categoryId: product.categoryId ?? '',
      unitPrice: product.unitPrice != null ? String(product.unitPrice) : '',
      costPrice: product.costPrice != null ? String(product.costPrice) : '',
      taxId: product.taxId ?? '',
      isService: product.isService ?? false,
      isActive: product.isActive ?? true,
      barcode: product.barcode ?? '',
    });
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
  };

  const handleSave = async () => {
    if (!id) return;
    try {
      await updateProduct.mutateAsync({
      id,
      name: form.name.trim() || undefined,
      description: form.description.trim() || undefined,
      categoryId: form.categoryId || undefined,
      unitPrice: form.unitPrice ? Number(form.unitPrice) : undefined,
      costPrice: form.costPrice ? Number(form.costPrice) : undefined,
      taxId: form.taxId || undefined,
      isService: form.isService,
      isActive: form.isActive,
        barcode: form.barcode.trim() || null,
      });
      toastService.success(t('inventory.product.saveSuccessTitle'));
      setEditing(false);
    } catch {
      toastService.error(t('inventory.product.saveErrorTitle'), t('common.saveUnconfirmed'));
    }
  };

  const generateBarcode = async () => {
    if (!id) return;
    try {
      await api.post(`/inventory/products/${id}/barcode`);
      await queryClient.invalidateQueries({ queryKey: ['product', id] });
      toastService.success(t('inventory.product.barcodeSuccessTitle'));
    } catch {
      toastService.error(t('inventory.product.barcodeErrorTitle'), t('common.saveUnconfirmed'));
    }
  };

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-3">
          <Link to="/inventory/products" className="text-sm text-accent hover:underline">
            &larr; {t('inventory.products')}
          </Link>
          <h1 className="text-lg font-bold text-text-primary">{product.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          {editing ? (
            <>
              <button
                onClick={cancelEdit}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={updateProduct.isPending}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
              >
                {t('common.save')}
              </button>
            </>
          ) : (
            <button
              onClick={enterEdit}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
            >
              {t('common.edit')}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto space-y-6 p-6">
        <div className="rounded-lg border border-border bg-surface p-6">
          <div className="grid grid-cols-1 gap-x-8 gap-y-5 text-sm sm:grid-cols-2">
            <div>
              <span className="text-xs text-text-secondary">{t('inventory.product.sku')}</span>
              <p className="mt-0.5 font-medium text-text-primary">{product.sku}</p>
            </div>
            <div>
              <span className="text-xs text-text-secondary">{t('inventory.product.barcode')}</span>
              {editing ? (
                <input
                  type="text"
                  value={form.barcode}
                  onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                  placeholder={t('inventory.product.barcodePlaceholder')}
                  aria-label={t('inventory.product.barcode')}
                  className="mt-0.5 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
                />
              ) : (
                <p className="mt-0.5 font-medium text-text-primary">{product.barcode || '—'}</p>
              )}
            </div>
            <div>
              <span className="text-xs text-text-secondary">{t('inventory.product.name')}</span>
              {editing ? (
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-0.5 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
                />
              ) : (
                <p className="mt-0.5 font-medium text-text-primary">{product.name}</p>
              )}
            </div>

            <div className="col-span-2">
              <span className="text-xs text-text-secondary">{t('common.notes')}</span>
              {editing ? (
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="mt-0.5 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
                />
              ) : (
                <p className="mt-0.5 font-medium text-text-primary">{product.description || '—'}</p>
              )}
            </div>
            <div>
              <span className="text-xs text-text-secondary">{t('inventory.categories')}</span>
              {editing ? (
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="mt-0.5 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
                >
                  <option value="">—</option>
                  {(categories ?? []).map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              ) : (
                <p className="mt-0.5 font-medium text-text-primary">
                  {product.category ?? (categories ?? []).find((c: any) => c.id === product.categoryId)?.name ?? '—'}
                </p>
              )}
            </div>
            <div>
              <span className="text-xs text-text-secondary">{t('inventory.product.cost')}</span>
              {editing ? (
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.costPrice}
                  onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                  className="mt-0.5 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
                />
              ) : (
                <p className="mt-0.5 font-medium text-text-primary">
                  {product.costPrice != null ? Number(product.costPrice).toFixed(2) : '—'}
                </p>
              )}
            </div>
            <div>
              <span className="text-xs text-text-secondary">{t('inventory.product.price')}</span>
              {editing ? (
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.unitPrice}
                  onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
                  className="mt-0.5 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
                />
              ) : (
                <p className="mt-0.5 font-medium text-text-primary">
                  {product.unitPrice != null ? Number(product.unitPrice).toFixed(2) : '—'}
                </p>
              )}
            </div>
            <div>
              <span className="text-xs text-text-secondary">{t('inventory.tax')}</span>
              {editing ? (
                <select
                  value={form.taxId}
                  onChange={(e) => setForm({ ...form, taxId: e.target.value })}
                  className="mt-0.5 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
                >
                  <option value="">—</option>
                  {(taxes ?? []).map((tx: any) => (
                    <option key={tx.id} value={tx.id}>{tx.name}</option>
                  ))}
                </select>
              ) : (
                <p className="mt-0.5 font-medium text-text-primary">
                  {product.taxName ?? (taxes ?? []).find((tx: any) => tx.id === product.taxId)?.name ?? '—'}
                </p>
              )}
            </div>
            <div>
              <span className="text-xs text-text-secondary">{t('inventory.product.isService')}</span>
              {editing ? (
                <label className="mt-0.5 flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isService}
                    onChange={(e) => setForm({ ...form, isService: e.target.checked })}
                    className="rounded border-border"
                  />
                  <span className="text-sm text-text-secondary">{form.isService ? t('common.yes') : t('common.no')}</span>
                </label>
              ) : (
                <p className="mt-0.5 font-medium text-text-primary">
                  {product.isService ? t('common.yes') : t('common.no')}
                </p>
              )}
            </div>
            <div>
              <span className="text-xs text-text-secondary">{t('inventory.product.isActive')}</span>
              {editing ? (
                <label className="mt-0.5 flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="rounded border-border"
                  />
                  <span className="text-sm text-text-secondary">{form.isActive ? t('common.yes') : t('common.no')}</span>
                </label>
              ) : (
                <p className="mt-0.5 font-medium text-text-primary">
                  {product.isActive ? t('common.yes') : t('common.no')}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-text-primary">{t('inventory.product.label')}</h2>
            <div className="flex gap-2">
              {!product.barcode && (
                <button onClick={generateBarcode} className="rounded-lg border border-border px-3 py-2 text-sm text-text-primary hover:bg-canvas">
                  {t('inventory.product.generateInternal')}
                </button>
              )}
              {product.barcode && (
                <button onClick={() => window.print()} className="rounded-lg bg-accent px-3 py-2 text-sm text-white hover:bg-accent-hover">
                  {t('inventory.product.printLabel')}
                </button>
              )}
            </div>
          </div>
          {product.barcode ? (
            <ProductBarcodeLabel name={product.name} price={Number(product.unitPrice ?? 0)} sku={product.sku} barcode={product.barcode} />
          ) : (
            <p className="text-sm text-text-secondary">{t('inventory.product.labelHint')}</p>
          )}
        </div>

        {id && (
          <ProductImageUploader
            productId={id}
            fallbackImageUrl={product.imageUrl}
            productName={product.name}
            editable={editing}
          />
        )}
      </div>
    </div>
  );
}
