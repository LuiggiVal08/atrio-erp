import { useState } from 'react';
import { useForm, useStore } from '@tanstack/react-form';
import { isAxiosError } from 'axios';
import { usePermission } from '@/core/auth/usePermission';
import { useAuthStore } from '@/core/auth/store';
import { useTenantStore } from '@/core/tenant/store';
import { useTenant } from '@/modules/settings/hooks/useTenant';
import { FormInput, FormCombobox, FormSelect, applyServerErrors, resolveServerErrorMessage } from '@/shared/form';
import { FormCheckbox } from '@/shared/form/form-checkbox';
import { productDefaults, productFormSchema, productPayload } from '@/shared/validation/product';
import { createPortal } from 'react-dom';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Minus, Plus } from 'lucide-react';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { toastService } from '@/core/services/toast-service';
import { Skeleton } from '@/core/components/Skeleton';
import { useProduct, useGenerateProductBarcode, useProductBalances, useProductSuppliers } from '../hooks/useProduct';
import { useUpdateProduct } from '../hooks/useUpdateProduct';
import { ProductImageGallery } from '../components/ProductImageGallery';
import { ProductBarcodeLabel } from '../components/ProductBarcodeLabel';
import { useCategories } from '@/shared/hooks/useCategories';
import { useBrands } from '../hooks/useBrands';
import { useTaxes } from '../hooks/useTaxes';

const readClass = 'mt-1 font-medium text-text-primary';
const dataReadClass = 'mt-1 font-mono font-medium tabular-nums text-text-primary';

const MIN_COPIES = 1;
const MAX_COPIES = 100;

function clampCopies(value: number) {
  if (!Number.isFinite(value)) return MIN_COPIES;
  return Math.min(MAX_COPIES, Math.max(MIN_COPIES, Math.round(value)));
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <span className="text-xs text-text-secondary">{label}</span>
      {children}
    </div>
  );
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
  const { t, locale } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading, isError, error: readError, refetch } = useProduct(id!);
  const canEdit = usePermission('inventory:product:update');
  const canReadStock = usePermission('inventory:stock:read');
  const generateBarcode = useGenerateProductBarcode();
  const balances = useProductBalances(id!);
  const suppliers = useProductSuppliers();
  const tenantId = useTenantStore((state) => state.activeTenantId);
  const authTenantId = useAuthStore((state) => state.user?.tenantId);
  const { data: tenant } = useTenant(tenantId ?? authTenantId ?? null);
  const currency = tenant?.baseCurrency === 'VED' ? 'VES' : tenant?.baseCurrency;
  const { data: categories } = useCategories();
  const { data: brands } = useBrands();
  const { data: taxes } = useTaxes();
  const updateProduct = useUpdateProduct();

  const [editing, setEditing] = useState(false);
  const [copies, setCopies] = useState(1);

  const [saveError, setSaveError] = useState<string | null>(null);
  const editor = useForm({
    defaultValues: { ...productDefaults },
    validators: { onSubmit: productFormSchema },
    onSubmit: async ({ value }) => {
      if (!id || !canEdit || updateProduct.isPending) return;
      setSaveError(null);
      try {
        await updateProduct.mutateAsync({ id, ...productPayload(value, true, product) });
        toastService.success(t('inventory.product.saveSuccessTitle'));
        setEditing(false);
      } catch (error) {
        const detail = resolveServerErrorMessage(applyServerErrors(editor, error), t('common.saveUnconfirmed'));
        setSaveError(detail);
        toastService.error(t('inventory.product.saveErrorTitle'), detail);
      }
    },
  });
  const form = useStore(editor.store, (state) => state.values);
  const submitting = useStore(editor.store, (state) => state.isSubmitting);

  if (isLoading) {
    return (
      <div role="status" aria-busy="true" className="mx-auto grid w-full max-w-5xl gap-4 p-6">
        <span className="sr-only">{t('common.loading')}</span>
        <Skeleton variant="rect" height={48} />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,320px)_1fr]">
          <Skeleton variant="rect" height={320} />
          <Skeleton variant="rect" height={320} />
        </div>
        <Skeleton variant="rect" height={160} />
      </div>
    );
  }

  const notFound = isAxiosError(readError) && readError.response?.status === 404;
  if (isError && !notFound && !product) {
    return (
      <div className="grid h-full place-content-center justify-items-center gap-3 p-10 text-center">
        <p className="text-sm text-text-secondary">{t('inventory.product.loadError')}</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void refetch()}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text-primary hover:bg-surface-hover"
          >
            {t('common.retry')}
          </button>
          <Link
            to="/inventory/products"
            className="text-xs font-semibold text-accent hover:underline"
          >
            {t('inventory.product.backToProducts')}
          </Link>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="grid h-full place-content-center justify-items-center gap-3 p-10 text-center">
        <p className="text-sm text-text-secondary">{t('inventory.product.notFound')}</p>
        <Link
          to="/inventory/products"
          className="text-xs font-semibold text-accent hover:underline"
        >
          {t('inventory.product.backToProducts')}
        </Link>
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
    if (!canEdit) return;
    editor.reset({
      sku: product.sku ?? '', name: product.name ?? '', description: product.description ?? '',
      categoryId: product.categoryId ?? '', brandId: product.brandId ?? '',
      unitPrice: Number(product.unitPrice ?? 0), costPrice: Number(product.costPrice ?? 0),
      taxId: product.taxId ?? '', isService: product.isService ?? false, isActive: product.isActive ?? true,
      barcode: product.barcode ?? '', baseUnit: product.baseUnit ?? 'unidad', purchaseUnit: product.purchaseUnit ?? '',
      conversionFactor: Number(product.conversionFactor ?? 1), minStock: Number(product.minStock ?? 0),
      maxStock: product.maxStock == null ? undefined : Number(product.maxStock), reorderPoint: Number(product.reorderPoint ?? 0),
      supplierSku: product.supplierSku ?? '', primarySupplierId: product.primarySupplierId ?? '',
    }, { keepDefaultValues: true });
    setSaveError(null);
    setEditing(true);
  };
  const handleSave = () => void editor.handleSubmit();

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
      : new Intl.NumberFormat(locale, { maximumFractionDigits: decimals ?? 6, minimumFractionDigits: decimals }).format(Number(value));
  const readMoney = (value: unknown) => currency
    ? new Intl.NumberFormat(locale, { style: 'currency', currency }).format(Number(value ?? 0))
    : readNumber(value, 2);
  const supplierOptions = (suppliers.data ?? []).map((supplier) => ({ id: supplier.id, name: supplier.legalName }));

  const categoryLabel =
    product.category ??
    categoryList.find((category: any) => category.id === product.categoryId)?.name ??
    '';

  return (
    <div className="mx-auto flex h-full max-w-5xl flex-col">
      <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to="/inventory/products"
            className="inline-flex shrink-0 items-center gap-1 text-sm text-accent hover:underline"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            {t('inventory.products')}
          </Link>
          <h1 className="truncate text-lg font-bold text-text-primary" title={product.name}>
            {product.name}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {editing ? (
            <>
              <button type="button" onClick={() => setEditing(false)} disabled={submitting}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary disabled:opacity-50">
                {t('common.cancel')}
              </button>
              <button type="button" onClick={handleSave} disabled={submitting} aria-busy={submitting}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50">
                {submitting ? t('common.loading') : t('common.save')}
              </button>
            </>
          ) : canEdit ? (
            <button type="button" onClick={enterEdit}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover">
              {t('common.edit')}
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex-1 space-y-6 overflow-auto p-6">
        {saveError && <p role="alert" className="text-sm text-danger">{saveError}</p>}
        {isError && <div role="alert" className="text-sm text-danger">{t('inventory.product.loadError')} <button type="button" onClick={() => void refetch()} className="underline">{t('common.retry')}</button></div>}
        <fieldset disabled={submitting} className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
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
          <div className="h-fit rounded-lg border border-border bg-surface p-6">
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-3">
              <Field label={t('inventory.product.price')}>
                {editing ? (
                  <FormInput form={editor} name="unitPrice" type="number" min={0} step={0.01} ariaLabel={t('inventory.product.price')} />
                ) : (
                  <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-text-primary">
                    {readMoney(product.unitPrice)}
                  </p>
                )}
              </Field>
              <Field label={t('inventory.product.cost')}>
                {editing ? (
                  <FormInput form={editor} name="costPrice" type="number" min={0} step={0.01} ariaLabel={t('inventory.product.cost')} />
                ) : (
                  <p className={dataReadClass}>{readMoney(product.costPrice)}</p>
                )}
              </Field>
              <Field label={t('inventory.tax')}>
                {editing ? (
                  <FormSelect form={editor} name="taxId" ariaLabel={t('inventory.tax')} placeholder="—" options={(taxes ?? []).map((tax) => ({ value: tax.id, label: tax.name }))} />
                ) : (
                  <p className={readClass}>
                    {product.taxName ??
                      (taxes ?? []).find((tx: any) => tx.id === product.taxId)?.name ??
                      '—'}
                  </p>
                )}
              </Field>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-x-6 gap-y-4 border-t border-border pt-5 text-sm sm:grid-cols-2">
              <Field label={t('inventory.product.sku')}>
                {editing ? (
                  <FormInput form={editor} name="sku" ariaLabel={t('inventory.product.sku')} />
                ) : (
                  <p className={dataReadClass}>{product.sku}</p>
                )}
              </Field>
              <Field label={t('inventory.product.barcode')}>
                {editing ? (
                  <FormInput form={editor} name="barcode" ariaLabel={t('inventory.product.barcode')} placeholder={t('inventory.product.barcodePlaceholder')} />
                ) : (
                  <p className={dataReadClass}>{product.barcode || '—'}</p>
                )}
              </Field>
              <Field label={t('inventory.product.name')}>
                {editing ? (
                  <FormInput form={editor} name="name" ariaLabel={t('inventory.product.name')} />
                ) : (
                  <p className={`${readClass} break-words`}>{product.name}</p>
                )}
              </Field>
              <Field label={t('inventory.product.supplier')}>
                {editing ? <>
                  <FormCombobox form={editor} name="primarySupplierId" options={supplierOptions} ariaLabel={t('inventory.product.supplier')} />
                  {suppliers.isError && <div role="alert" className="text-sm text-danger">{t('inventory.product.suppliersError')} <button type="button" onClick={() => void suppliers.refetch()} className="underline">{t('common.retry')}</button></div>}
                </> : <p className={readClass}>{supplierOptions.find((supplier) => supplier.id === product.primarySupplierId)?.name ?? readValue(product.primarySupplierId)}</p>}
              </Field>
              <Field label={t('inventory.product.supplierRef')}>
                {editing ? (
                  <FormInput form={editor} name="supplierSku" ariaLabel={t('inventory.product.supplierRef')} />
                ) : (
                  <p className={dataReadClass}>{readValue(product.supplierSku)}</p>
                )}
              </Field>
              <Field label={t('common.notes')} className="sm:col-span-2">
                {editing ? (
                  <FormInput form={editor} name="description" ariaLabel={t('common.notes')} />
                ) : (
                  <p className={`${readClass} break-words`}>{product.description || '—'}</p>
                )}
              </Field>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-x-6 gap-y-4 border-t border-border pt-5 text-sm sm:grid-cols-2">
              <Field label={t('inventory.product.brand')}>
                {editing ? (
                  <div className="mt-1 flex items-center gap-2">
                    <BrandChip name={brandName} logoUrl={brandLogoUrl} />
                    <div className="min-w-0 flex-1">
                      <FormCombobox form={editor} name="brandId" options={brandOptions} ariaLabel={t('inventory.product.brand')} />
                    </div>
                  </div>
                ) : (
                  <div className="mt-1 flex items-center gap-2">
                    <BrandChip name={brandName} logoUrl={brandLogoUrl} />
                    <p className="font-medium text-text-primary">{readValue(brandName)}</p>
                  </div>
                )}
              </Field>
              <Field label={t('inventory.categories')}>
                {editing ? (
                  <div className="mt-1">
                    <FormCombobox form={editor} name="categoryId" options={categoryOptions} ariaLabel={t('inventory.categories')} />
                  </div>
                ) : (
                  <p className={readClass}>{readValue(categoryLabel)}</p>
                )}
              </Field>
              <Field label={t('inventory.product.isService')}>
                {editing ? (
                  <FormCheckbox form={editor} name="isService" label={t('inventory.product.isService')} />
                ) : (
                  <p className={readClass}>{product.isService ? t('common.yes') : t('common.no')}</p>
                )}
              </Field>
              <Field label={t('inventory.product.isActive')}>
                {editing ? (
                  <FormCheckbox form={editor} name="isActive" label={t('inventory.product.isActive')} />
                ) : (
                  <p className={readClass}>{product.isActive ? t('common.yes') : t('common.no')}</p>
                )}
              </Field>
            </div>
          </div>
        </fieldset>

        <fieldset disabled={submitting} className="min-w-0 rounded-lg border border-border bg-surface p-6">
          <h2 className="mb-4 text-sm font-bold text-text-primary">
            {t('inventory.product.groupUnits')}
          </h2>
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-3">
            <Field label={t('inventory.product.baseUnit')}>
              {editing ? (
                <FormInput form={editor} name="baseUnit" ariaLabel={t('inventory.product.baseUnit')} />
              ) : (
                <p className={readClass}>{readValue(product.baseUnit)}</p>
              )}
            </Field>
            <Field label={t('inventory.product.purchaseUnit')}>
              {editing ? (
                <FormInput form={editor} name="purchaseUnit" ariaLabel={t('inventory.product.purchaseUnit')} placeholder={t('inventory.product.purchaseUnitPlaceholder')} />
              ) : (
                <p className={readClass}>{readValue(product.purchaseUnit)}</p>
              )}
            </Field>
            <Field label={t('inventory.product.conversionFactor')}>
              {editing ? (
                <FormInput form={editor} name="conversionFactor" type="number" min={0.000001} step="any" ariaLabel={t('inventory.product.conversionFactor')} />
              ) : (
                <p className={dataReadClass}>{readNumber(product.conversionFactor)}</p>
              )}
            </Field>
            <div aria-hidden className="hidden border-t border-border sm:col-span-3 sm:block" />
            <Field label={t('inventory.product.reorderPoint')}>
              {editing ? (
                <FormInput form={editor} name="reorderPoint" type="number" min={0} step="any" ariaLabel={t('inventory.product.reorderPoint')} />
              ) : (
                <p className={dataReadClass}>{readNumber(product.reorderPoint)}</p>
              )}
            </Field>
            <Field label={t('inventory.product.minStock')}>
              {editing ? (
                <FormInput form={editor} name="minStock" type="number" min={0} step="any" ariaLabel={t('inventory.product.minStock')} />
              ) : (
                <p className={dataReadClass}>{readNumber(product.minStock)}</p>
              )}
            </Field>
            <Field label={t('inventory.product.maxStock')}>
              {editing ? (
                <FormInput form={editor} name="maxStock" type="number" min={0} step="any" ariaLabel={t('inventory.product.maxStock')} />
              ) : (
                <p className={dataReadClass}>{readNumber(product.maxStock)}</p>
              )}
            </Field>
          </div>
        </fieldset>

        {canReadStock && !product.isService && <section className="rounded-lg border border-border bg-surface p-6">
          <h2 className="mb-4 text-sm font-bold text-text-primary">{t('inventory.product.stockByWarehouse')}</h2>
          {balances.isLoading ? <Skeleton variant="rect" height={80} /> : balances.isError ? (
            <div role="alert" className="text-sm text-danger">{t('inventory.stockView.loadError')} <button type="button" onClick={() => void balances.refetch()} className="underline">{t('common.retry')}</button></div>
          ) : balances.data?.length ? (
            <ul className="divide-y divide-border">
              {balances.data.map((balance) => <li key={balance.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <span>{balance.warehouse.name}</span>
                <span className="font-mono tabular-nums">{readNumber(balance.quantity)} {product.baseUnit}</span>
                <Link className="text-accent underline" to={`/inventory/stock?tab=movements&productId=${encodeURIComponent(id!)}&warehouseId=${encodeURIComponent(balance.warehouseId)}`}>{t('inventory.product.stockHistory')}</Link>
              </li>)}
            </ul>
          ) : <p className="text-sm text-text-secondary">{t('inventory.product.noStock')}</p>}
        </section>}

        <div className="rounded-lg border border-border bg-surface p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-text-primary">{t('inventory.product.label')}</h2>
            {product.barcode && (
              <div className="flex flex-wrap items-center gap-3">
                {copies > 1 && (
                  <span className="font-mono text-xs text-text-secondary">×{copies}</span>
                )}
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
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-primary hover:bg-surface-hover disabled:opacity-40"
                  >
                    <Minus size={14} aria-hidden="true" />
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
                    className="h-8 w-14 rounded-lg border border-border bg-canvas text-center font-mono text-sm tabular-nums text-text-primary focus:border-accent focus:outline-none"
                  />
                  <button
                    type="button"
                    aria-label={t('inventory.product.addCopy')}
                    disabled={copies >= MAX_COPIES}
                    onClick={() => setCopies((value) => clampCopies(value + 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-primary hover:bg-surface-hover disabled:opacity-40"
                  >
                    <Plus size={14} aria-hidden="true" />
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
            <div className="max-w-full overflow-x-auto">
              <ProductBarcodeLabel
                name={product.name}
                price={Number(product.unitPrice ?? 0)}
                sku={product.sku}
                barcode={product.barcode}
                currency={currency}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-text-secondary">{t('inventory.product.labelHint')}</p>
              {canEdit && <button type="button" disabled={generateBarcode.isPending || editing} aria-busy={generateBarcode.isPending}
                onClick={() => generateBarcode.mutate(id!)}
                className="rounded-lg border border-border px-3 py-2 text-sm text-text-primary hover:bg-surface-hover disabled:opacity-50">
                {generateBarcode.isPending ? t('common.loading') : t('inventory.product.generateBarcode')}
              </button>}
              {generateBarcode.isError && <p role="alert" className="text-sm text-danger">{t('inventory.product.barcodeError')}</p>}
            </div>
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
                currency={currency}
              />
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
