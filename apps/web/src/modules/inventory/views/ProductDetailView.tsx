import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { toastService } from '@/core/services/toast-service';
import { Combobox } from '@/core/components/Combobox';
import { useProduct } from '../hooks/useProduct';
import { useUpdateProduct } from '../hooks/useUpdateProduct';
import { ProductImageGallery } from '../components/ProductImageGallery';
import { ProductBarcodeLabel } from '../components/ProductBarcodeLabel';
import { useCategories } from '@/shared/hooks/useCategories';
import { useBrands } from '../hooks/useBrands';
import { useTaxes } from '../hooks/useTaxes';

interface FormData {
  sku: string;
  name: string;
  description: string;
  categoryId: string;
  brandId: string;
  unitPrice: string;
  costPrice: string;
  taxId: string;
  isService: boolean;
  isActive: boolean;
  barcode: string;
  baseUnit: string;
  purchaseUnit: string;
  conversionFactor: string;
  minStock: string;
  maxStock: string;
  reorderPoint: string;
  supplierSku: string;
}

const inputClass =
  'mt-0.5 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none';

const MIN_COPIES = 1;
const MAX_COPIES = 100;

function clampCopies(value: number) {
  if (!Number.isFinite(value)) return MIN_COPIES;
  return Math.min(MAX_COPIES, Math.max(MIN_COPIES, Math.round(value)));
}

function toNumberOrNull(value: string) {
  const trimmed = value.trim();
  return trimmed === '' ? null : Number(trimmed);
}

function BrandChip({ name, logoUrl }: { name?: string | null; logoUrl?: string | null }) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name ?? ''}
        className="h-7 max-w-[110px] shrink-0 rounded-md object-contain"
      />
    );
  }
  if (!name) return null;
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent-alpha text-sm font-bold text-accent">
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

export function ProductDetailView() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading } = useProduct(id!);
  const { data: categories } = useCategories();
  const { data: brands } = useBrands();
  const { data: taxes } = useTaxes();
  const updateProduct = useUpdateProduct();

  const [editing, setEditing] = useState(false);
  const [copies, setCopies] = useState(1);

  const [form, setForm] = useState<FormData>({
    sku: '',
    name: '',
    description: '',
    categoryId: '',
    brandId: '',
    unitPrice: '',
    costPrice: '',
    taxId: '',
    isService: false,
    isActive: true,
    barcode: '',
    baseUnit: 'unidad',
    purchaseUnit: '',
    conversionFactor: '1',
    minStock: '',
    maxStock: '',
    reorderPoint: '',
    supplierSku: '',
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

  const brandList = brands ?? [];
  const categoryList = categories ?? [];

  const activeBrandId = editing ? form.brandId : (product.brandId ?? '');
  const selectedBrand = brandList.find((brand) => brand.id === activeBrandId);
  const brandName = selectedBrand?.name ?? product.brand ?? '';
  const brandLogoUrl = selectedBrand?.logoUrl ?? null;

  const enterEdit = () => {
    setForm({
      sku: product.sku ?? '',
      name: product.name ?? '',
      description: product.description ?? '',
      categoryId: product.categoryId ?? '',
      brandId: product.brandId ?? '',
      unitPrice: product.unitPrice != null ? String(product.unitPrice) : '',
      costPrice: product.costPrice != null ? String(product.costPrice) : '',
      taxId: product.taxId ?? '',
      isService: product.isService ?? false,
      isActive: product.isActive ?? true,
      barcode: product.barcode ?? '',
      baseUnit: product.baseUnit ?? 'unidad',
      purchaseUnit: product.purchaseUnit ?? '',
      conversionFactor: product.conversionFactor != null ? String(product.conversionFactor) : '1',
      minStock: product.minStock != null ? String(product.minStock) : '',
      maxStock: product.maxStock != null ? String(product.maxStock) : '',
      reorderPoint: product.reorderPoint != null ? String(product.reorderPoint) : '',
      supplierSku: product.supplierSku ?? '',
    });
    setEditing(true);
  };

  const handleSave = async () => {
    if (!id) return;
    try {
      await updateProduct.mutateAsync({
        id,
        sku: form.sku.trim(),
        name: form.name.trim(),
        description: form.description.trim() || null,
        barcode: form.barcode.trim() || null,
        categoryId: form.categoryId || null,
        brandId: form.brandId || null,
        taxId: form.taxId || null,
        unitPrice: form.unitPrice ? Number(form.unitPrice) : undefined,
        costPrice: form.costPrice ? Number(form.costPrice) : undefined,
        isService: form.isService,
        isActive: form.isActive,
        baseUnit: form.baseUnit.trim() || 'unidad',
        purchaseUnit: form.purchaseUnit.trim() || null,
        conversionFactor: Number(form.conversionFactor) || 1,
        minStock: toNumberOrNull(form.minStock),
        maxStock: toNumberOrNull(form.maxStock),
        reorderPoint: toNumberOrNull(form.reorderPoint),
        supplierSku: form.supplierSku.trim() || null,
      });
      toastService.success(t('inventory.product.saveSuccessTitle'));
      setEditing(false);
    } catch {
      toastService.error(t('inventory.product.saveErrorTitle'), t('common.saveUnconfirmed'));
    }
  };

  const categoryOptions = categoryList.map((category: any) => ({
    id: category.id,
    name: category.name,
  }));
  const brandOptions = brandList.map((brand) => ({ id: brand.id, name: brand.name }));

  const readValue = (value: unknown) =>
    value === null || value === undefined || value === '' ? '—' : String(value);
  const readNumber = (value: unknown, decimals?: number) =>
    value === null || value === undefined || value === ''
      ? '—'
      : decimals != null
        ? Number(value).toFixed(decimals)
        : String(value);

  const categoryLabel =
    product.category ??
    categoryList.find((category: any) => category.id === product.categoryId)?.name ??
    '';

  return (
    <div className="mx-auto flex h-full max-w-5xl flex-col">
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
                onClick={() => setEditing(false)}
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

      <div className="flex-1 space-y-6 overflow-auto p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
          {id && (
            <div className="h-fit lg:sticky lg:top-0">
              <ProductImageGallery
                productId={id}
                fallbackImageUrl={product.imageUrl}
                productName={product.name}
                editable={editing}
              />
            </div>
          )}
          <div className="rounded-lg border border-border bg-surface p-6">
            <div className="grid grid-cols-1 gap-x-8 gap-y-5 text-sm sm:grid-cols-2">
              <div>
                <span className="text-xs text-text-secondary">{t('inventory.product.sku')}</span>
                {editing ? (
                  <input
                    type="text"
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    aria-label={t('inventory.product.sku')}
                    className={inputClass}
                  />
                ) : (
                  <p className="mt-0.5 font-medium text-text-primary">{product.sku}</p>
                )}
              </div>
              <div>
                <span className="text-xs text-text-secondary">
                  {t('inventory.product.barcode')}
                </span>
                {editing ? (
                  <input
                    type="text"
                    value={form.barcode}
                    onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                    placeholder={t('inventory.product.barcodePlaceholder')}
                    aria-label={t('inventory.product.barcode')}
                    className={inputClass}
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
                    aria-label={t('inventory.product.name')}
                    className={inputClass}
                  />
                ) : (
                  <p className="mt-0.5 font-medium text-text-primary">{product.name}</p>
                )}
              </div>
              <div>
                <span className="text-xs text-text-secondary">
                  {t('inventory.product.supplierRef')}
                </span>
                {editing ? (
                  <input
                    type="text"
                    value={form.supplierSku}
                    onChange={(e) => setForm({ ...form, supplierSku: e.target.value })}
                    aria-label={t('inventory.product.supplierRef')}
                    className={inputClass}
                  />
                ) : (
                  <p className="mt-0.5 font-medium text-text-primary">
                    {readValue(product.supplierSku)}
                  </p>
                )}
              </div>

              <div className="col-span-2">
                <span className="text-xs text-text-secondary">{t('common.notes')}</span>
                <div className="mt-0.5 flex items-center gap-3">
                  <BrandChip name={brandName} logoUrl={brandLogoUrl} />
                  {editing ? (
                    <input
                      type="text"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      aria-label={t('common.notes')}
                      className={inputClass}
                    />
                  ) : (
                    <p className="font-medium text-text-primary">{product.description || '—'}</p>
                  )}
                </div>
              </div>

              <div>
                <span className="text-xs text-text-secondary">{t('inventory.product.brand')}</span>
                {editing ? (
                  <div className="mt-0.5">
                    <Combobox
                      value={form.brandId}
                      onChange={(brandId) => setForm({ ...form, brandId })}
                      options={brandOptions}
                      aria-label={t('inventory.product.brand')}
                    />
                  </div>
                ) : (
                  <p className="mt-0.5 font-medium text-text-primary">{readValue(brandName)}</p>
                )}
              </div>
              <div>
                <span className="text-xs text-text-secondary">{t('inventory.categories')}</span>
                {editing ? (
                  <div className="mt-0.5">
                    <Combobox
                      value={form.categoryId}
                      onChange={(categoryId) => setForm({ ...form, categoryId })}
                      options={categoryOptions}
                      aria-label={t('inventory.categories')}
                    />
                  </div>
                ) : (
                  <p className="mt-0.5 font-medium text-text-primary">{readValue(categoryLabel)}</p>
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
                    aria-label={t('inventory.product.cost')}
                    className={inputClass}
                  />
                ) : (
                  <p className="mt-0.5 font-medium text-text-primary">
                    {readNumber(product.costPrice, 2)}
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
                    aria-label={t('inventory.product.price')}
                    className={inputClass}
                  />
                ) : (
                  <p className="mt-0.5 font-medium text-text-primary">
                    {readNumber(product.unitPrice, 2)}
                  </p>
                )}
              </div>
              <div>
                <span className="text-xs text-text-secondary">{t('inventory.tax')}</span>
                {editing ? (
                  <select
                    value={form.taxId}
                    onChange={(e) => setForm({ ...form, taxId: e.target.value })}
                    aria-label={t('inventory.tax')}
                    className={inputClass}
                  >
                    <option value="">—</option>
                    {(taxes ?? []).map((tx: any) => (
                      <option key={tx.id} value={tx.id}>
                        {tx.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="mt-0.5 font-medium text-text-primary">
                    {product.taxName ??
                      (taxes ?? []).find((tx: any) => tx.id === product.taxId)?.name ??
                      '—'}
                  </p>
                )}
              </div>
              <div className="flex items-end gap-6">
                <div>
                  <span className="text-xs text-text-secondary">
                    {t('inventory.product.isService')}
                  </span>
                  {editing ? (
                    <label className="mt-0.5 flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.isService}
                        onChange={(e) => setForm({ ...form, isService: e.target.checked })}
                        aria-label={t('inventory.product.isService')}
                        className="rounded border-border"
                      />
                      <span className="text-sm text-text-secondary">
                        {form.isService ? t('common.yes') : t('common.no')}
                      </span>
                    </label>
                  ) : (
                    <p className="mt-0.5 font-medium text-text-primary">
                      {product.isService ? t('common.yes') : t('common.no')}
                    </p>
                  )}
                </div>
                <div>
                  <span className="text-xs text-text-secondary">
                    {t('inventory.product.isActive')}
                  </span>
                  {editing ? (
                    <label className="mt-0.5 flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.isActive}
                        onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                        aria-label={t('inventory.product.isActive')}
                        className="rounded border-border"
                      />
                      <span className="text-sm text-text-secondary">
                        {form.isActive ? t('common.yes') : t('common.no')}
                      </span>
                    </label>
                  ) : (
                    <p className="mt-0.5 font-medium text-text-primary">
                      {product.isActive ? t('common.yes') : t('common.no')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-6">
          <h2 className="mb-4 text-sm font-bold text-text-primary">
            {t('inventory.product.groupUnits')}
          </h2>
          <div className="grid grid-cols-1 gap-x-8 gap-y-5 text-sm sm:grid-cols-2">
            <div>
              <span className="text-xs text-text-secondary">{t('inventory.product.baseUnit')}</span>
              {editing ? (
                <input
                  type="text"
                  value={form.baseUnit}
                  onChange={(e) => setForm({ ...form, baseUnit: e.target.value })}
                  aria-label={t('inventory.product.baseUnit')}
                  className={inputClass}
                />
              ) : (
                <p className="mt-0.5 font-medium text-text-primary">
                  {readValue(product.baseUnit)}
                </p>
              )}
            </div>
            <div>
              <span className="text-xs text-text-secondary">
                {t('inventory.product.purchaseUnit')}
              </span>
              {editing ? (
                <input
                  type="text"
                  value={form.purchaseUnit}
                  onChange={(e) => setForm({ ...form, purchaseUnit: e.target.value })}
                  placeholder={t('inventory.product.purchaseUnitPlaceholder')}
                  aria-label={t('inventory.product.purchaseUnit')}
                  className={inputClass}
                />
              ) : (
                <p className="mt-0.5 font-medium text-text-primary">
                  {readValue(product.purchaseUnit)}
                </p>
              )}
            </div>
            <div>
              <span className="text-xs text-text-secondary">
                {t('inventory.product.conversionFactor')}
              </span>
              {editing ? (
                <input
                  type="number"
                  min="0.000001"
                  step="0.000001"
                  value={form.conversionFactor}
                  onChange={(e) => setForm({ ...form, conversionFactor: e.target.value })}
                  aria-label={t('inventory.product.conversionFactor')}
                  className={inputClass}
                />
              ) : (
                <p className="mt-0.5 font-medium text-text-primary">
                  {readNumber(product.conversionFactor)}
                </p>
              )}
            </div>
            <div>
              <span className="text-xs text-text-secondary">
                {t('inventory.product.reorderPoint')}
              </span>
              {editing ? (
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.reorderPoint}
                  onChange={(e) => setForm({ ...form, reorderPoint: e.target.value })}
                  aria-label={t('inventory.product.reorderPoint')}
                  className={inputClass}
                />
              ) : (
                <p className="mt-0.5 font-medium text-text-primary">
                  {readNumber(product.reorderPoint)}
                </p>
              )}
            </div>
            <div>
              <span className="text-xs text-text-secondary">{t('inventory.product.minStock')}</span>
              {editing ? (
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.minStock}
                  onChange={(e) => setForm({ ...form, minStock: e.target.value })}
                  aria-label={t('inventory.product.minStock')}
                  className={inputClass}
                />
              ) : (
                <p className="mt-0.5 font-medium text-text-primary">
                  {readNumber(product.minStock)}
                </p>
              )}
            </div>
            <div>
              <span className="text-xs text-text-secondary">{t('inventory.product.maxStock')}</span>
              {editing ? (
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.maxStock}
                  onChange={(e) => setForm({ ...form, maxStock: e.target.value })}
                  aria-label={t('inventory.product.maxStock')}
                  className={inputClass}
                />
              ) : (
                <p className="mt-0.5 font-medium text-text-primary">
                  {readNumber(product.maxStock)}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-text-primary">{t('inventory.product.label')}</h2>
            {product.barcode && (
              <div className="flex items-center gap-3">
                {copies > 1 && <span className="text-xs text-text-secondary">×{copies}</span>}
                <div
                  role="group"
                  aria-label={t('inventory.product.copies')}
                  className="flex items-center gap-1"
                >
                  <button
                    type="button"
                    aria-label={t('inventory.product.removeCopy')}
                    disabled={copies <= MIN_COPIES}
                    onClick={() => setCopies((value) => clampCopies(value - 1))}
                    className="h-8 w-8 rounded-lg border border-border text-sm text-text-primary hover:bg-surface-hover disabled:opacity-40"
                  >
                    −
                  </button>
                  <input
                    type="text"
                    inputMode="numeric"
                    aria-label={t('inventory.product.copies')}
                    value={String(copies)}
                    onChange={(e) => setCopies(clampCopies(Number(e.target.value)))}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setCopies((value) => clampCopies(value + 1));
                      } else if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setCopies((value) => clampCopies(value - 1));
                      }
                    }}
                    className="h-8 w-14 rounded-lg border border-border bg-canvas text-center text-sm text-text-primary focus:border-accent focus:outline-none"
                  />
                  <button
                    type="button"
                    aria-label={t('inventory.product.addCopy')}
                    disabled={copies >= MAX_COPIES}
                    onClick={() => setCopies((value) => clampCopies(value + 1))}
                    className="h-8 w-8 rounded-lg border border-border text-sm text-text-primary hover:bg-surface-hover disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="rounded-lg bg-accent px-3 py-2 text-sm text-white hover:bg-accent-hover"
                >
                  {t('inventory.product.printLabel')}
                </button>
              </div>
            )}
          </div>
          {product.barcode ? (
            <ProductBarcodeLabel
              name={product.name}
              price={Number(product.unitPrice ?? 0)}
              sku={product.sku}
              barcode={product.barcode}
            />
          ) : (
            <p className="text-sm text-text-secondary">{t('inventory.product.labelHint')}</p>
          )}
        </div>
      </div>

      {product.barcode &&
        createPortal(
          <div className="print-sheet">
            {Array.from({ length: copies }).map((_, index) => (
              <ProductBarcodeLabel
                key={index}
                name={product.name}
                price={Number(product.unitPrice ?? 0)}
                sku={product.sku}
                barcode={product.barcode}
              />
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
