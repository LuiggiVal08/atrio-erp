import { useState } from 'react';
import { useForm, useStore } from '@tanstack/react-form';
import { useQueryClient, useIsFetching } from '@tanstack/react-query';
import { FormInput, FormSelect, FormCombobox, applyServerErrors, resolveServerErrorMessage } from '@/shared/form';
import { FormCheckbox } from '@/shared/form/form-checkbox';
import { productFormSchema, productDefaults, productPayload } from '@/shared/validation/product';
import { brandFormSchema } from '@/shared/validation/brand';
import { categoryFormSchema } from '@/shared/validation/category';
import { usePermission } from '@/core/auth/usePermission';
import { useAuthStore } from '@/core/auth/store';
import { useTenantStore } from '@/core/tenant/store';
import { useTenant } from '@/modules/settings/hooks/useTenant';
import { useProductSuppliers } from '../hooks/useProduct';
import { useInventoryStore, type InventoryProduct } from '../store/inventory-store';
import { useInventoryList } from '../hooks/useInventoryList';
import { useCreateProduct } from '../hooks/useCreateProduct';
import { useCategories } from '@/shared/hooks/useCategories';
import { useCreateCategory } from '../hooks/useCreateCategory';
import { useTaxes } from '../hooks/useTaxes';
import { useBrands, useCreateBrand } from '../hooks/useBrands';
import { Drawer } from '@heroui/react';
import { VirtualGrid, type GridColumn } from '@/core/components/VirtualGrid';
import { ListPage } from '@/core/components/ListPage';
import { ListPagination } from '@/core/components/ListPagination';
import { InventorySummaryCards } from '../components/InventorySummaryCards';
import { ProductImagePicker } from '../components/ProductImagePicker';
import { useUploadProductImages } from '../hooks/useProductImage';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { toastService } from '@/core/services/toast-service';
import { ChevronRight, Plus, Tags, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function InventoryListView() {
  const { t, locale } = useTranslation();
  const client = useQueryClient();
  const refreshing = useIsFetching({ queryKey: ['inventory'] }) > 0;
  const canCreate = usePermission('inventory:product:create');
  const canCreateCategory = usePermission('inventory:category:create');
  const canCreateBrand = usePermission('inventory:brand:create');
  const tenantId = useTenantStore((state) => state.activeTenantId);
  const authTenantId = useAuthStore((state) => state.user?.tenantId);
  const { data: tenant } = useTenant(tenantId ?? authTenantId ?? null);
  const currency = tenant?.baseCurrency === 'VED' ? 'VES' : tenant?.baseCurrency;
  const suppliers = useProductSuppliers();
  const {
    filter,
    setFilter,
    sortColumn,
    sortDirection,
    setSort,
    page,
    pageSize,
    setPage,
    setPageSize,
  } = useInventoryStore();
  const {
    items: products,
    total,
    isLoading: loading,
    isError: listError,
    refetch: refetchInventory,
  } = useInventoryList();
  const createProduct = useCreateProduct();
  const uploadProductImages = useUploadProductImages();
  const { data: categories } = useCategories();
  const createCategory = useCreateCategory();
  const { data: taxes } = useTaxes();
  const { data: brands } = useBrands();
  const createBrand = useCreateBrand();

  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [showCatForm, setShowCatForm] = useState(false);
  const [groupByCategory, setGroupByCategory] = useState(false);
  const [showBrandForm, setShowBrandForm] = useState(false);
  const [productImages, setProductImages] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const form = useForm({
    defaultValues: { ...productDefaults },
    validators: { onSubmit: productFormSchema },
    onSubmit: async ({ value }) => {
      if (!canCreate || createProduct.isPending || uploadProductImages.isPending) return;
      setError(null);
      try {
        const created = await createProduct.mutateAsync(productPayload(value));
        if (productImages.length && created?.id) {
          try {
            await uploadProductImages.mutateAsync({ id: created.id, files: productImages });
          } catch {
            toastService.error(t('inventory.product.imageUploadError'));
            navigate(`/inventory/${created.id}`);
          }
        }
        form.reset();
        categoryForm.reset();
        brandForm.reset();
        setShowCatForm(false);
        setShowBrandForm(false);
        setProductImages([]);
        setShowForm(false);
      } catch (err) {
        setError(resolveServerErrorMessage(applyServerErrors(form, err), t('common.saveUnconfirmed')));
      }
    },
  });
  const values = useStore(form.store, (state) => state.values);
  const submitting = useStore(form.store, (state) => state.isSubmitting);
  const categoryForm = useForm({
    defaultValues: { name: '', parentId: '' },
    validators: { onSubmit: categoryFormSchema },
    onSubmit: async ({ value }) => {
      if (!canCreateCategory) return;
      setInlineError(null);
      try {
        const created = await createCategory.mutateAsync({ name: value.name.trim() });
        form.setFieldValue('categoryId', created.id);
        categoryForm.reset();
        setShowCatForm(false);
      } catch (err) {
        setInlineError(resolveServerErrorMessage(applyServerErrors(categoryForm, err), t('inventory.categoryView.createError')));
      }
    },
  });
  const brandForm = useForm({
    defaultValues: { name: '' },
    validators: { onSubmit: brandFormSchema },
    onSubmit: async ({ value }) => {
      if (!canCreateBrand) return;
      setInlineError(null);
      try {
        const created = await createBrand.mutateAsync({ name: value.name.trim() });
        form.setFieldValue('brandId', created.id);
        brandForm.reset();
        setShowBrandForm(false);
      } catch (err) {
        setInlineError(resolveServerErrorMessage(applyServerErrors(brandForm, err), t('inventory.brandView.createError')));
      }
    },
  });

  const columns: GridColumn<InventoryProduct>[] = [
    { key: 'sku', label: t('inventory.product.sku'), width: 120, sortable: true },
    { key: 'name', label: t('inventory.product.name'), sortable: true },
    { key: 'category', label: t('inventory.categories'), width: 140 },
    { key: 'stock', label: t('inventory.stock'), width: 100, align: 'right' },
    {
      key: 'averageCost',
      label: t('inventory.product.cost'),
      width: 120,
      align: 'right',
      sortable: true,
      render: (value) => `${Number(value).toLocaleString(locale, { minimumFractionDigits: 2 })} ${currency ?? ''}`,
    },
    {
      key: 'unitPrice',
      label: t('inventory.product.price'),
      width: 120,
      align: 'right',
      sortable: true,
      render: (value) => `${Number(value).toLocaleString(locale, { minimumFractionDigits: 2 })} ${currency ?? ''}`,
    },
    {
      key: 'isActive',
      label: t('inventory.product.isActive'),
      width: 100,
      render: (_v, row) => (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            row.isActive ? 'bg-success/10 text-success' : 'bg-text-muted/10 text-text-secondary'
          }`}
        >
          {row.isActive
            ? t('inventory.product.statusActive')
            : t('inventory.product.statusInactive')}
        </span>
      ),
    },
  ];

  const handleCreate = () => void form.handleSubmit();

  const productFields = (
    <form id="create-product" noValidate onSubmit={(event) => { event.preventDefault(); handleCreate(); }} className="space-y-6">
      <fieldset disabled={submitting} className="space-y-4">
        <legend className="mb-1 text-xs font-semibold uppercase tracking-wider text-text-secondary">{t('inventory.product.groupIdentity')}</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormInput form={form} name="sku" label={t('inventory.product.sku')} id="product-sku" required />
          <div><FormInput form={form} name="barcode" label={t('inventory.product.barcode')} id="product-barcode" description={t('inventory.product.barcodeHint')} placeholder={t('inventory.product.barcodePlaceholder')} />
            <button type="button" disabled={!values.sku.trim()} onClick={() => form.setFieldValue('barcode', values.sku.trim())} className="mt-1 text-xs text-accent hover:underline disabled:opacity-50">{t('inventory.product.generateFromSku')}</button>
          </div>
          <FormInput form={form} name="name" label={t('inventory.product.name')} id="product-name" required />
          <FormInput form={form} name="supplierSku" label={t('inventory.product.supplierRef')} id="product-supplier-ref" />
          <FormCombobox form={form} name="primarySupplierId" label={t('inventory.product.supplier')} options={(suppliers.data ?? []).map((supplier) => ({ id: supplier.id, name: supplier.legalName }))} className="sm:col-span-2" />
          <div className="sm:col-span-2">
            <div className="flex items-end gap-2"><FormCombobox form={form} name="categoryId" label={t('inventory.categories')} id="product-category" options={(categories ?? []).map((category) => ({ id: category.id, name: category.name }))} placeholder={t('common.select')} className="flex-1" />
              {canCreateCategory && <button type="button" onClick={() => setShowCatForm(!showCatForm)} aria-label={t('inventory.product.newCategoryPlaceholder')} aria-expanded={showCatForm} className="rounded-lg bg-accent px-3 py-2 text-white hover:bg-accent-hover"><Plus size={16} aria-hidden="true" /></button>}
            </div>
            {showCatForm && <div className="mt-2 flex items-start gap-2"><FormInput form={categoryForm} name="name" ariaLabel={t('inventory.product.newCategoryPlaceholder')} placeholder={t('inventory.product.newCategoryPlaceholder')} className="flex-1" /><button type="button" onClick={() => void categoryForm.handleSubmit()} disabled={createCategory.isPending} className="rounded-lg bg-accent px-3 py-2 text-sm text-white disabled:opacity-50">{t('common.save')}</button></div>}
          </div>
          <div className="sm:col-span-2">
            <div className="flex items-end gap-2"><FormCombobox form={form} name="brandId" label={t('inventory.product.brand')} id="product-brand" options={(brands ?? []).map((brand) => ({ id: brand.id, name: brand.name }))} placeholder={t('common.select')} className="flex-1" />
              {canCreateBrand && <button type="button" onClick={() => setShowBrandForm(!showBrandForm)} aria-label={t('inventory.product.newBrand')} aria-expanded={showBrandForm} className="rounded-lg bg-accent px-3 py-2 text-white hover:bg-accent-hover"><Plus size={16} aria-hidden="true" /></button>}
            </div>
            {showBrandForm && <div className="mt-2 flex items-start gap-2"><div className="flex-1"><FormInput form={brandForm} name="name" ariaLabel={t('inventory.product.newBrand')} placeholder={t('inventory.product.newBrand')} /></div><button type="button" onClick={() => void brandForm.handleSubmit()} disabled={createBrand.isPending} className="rounded-lg bg-accent px-3 py-2 text-sm text-white disabled:opacity-50">{t('common.save')}</button></div>}
          </div>
          <FormInput form={form} name="description" label={t('inventory.product.description')} id="product-description" className="sm:col-span-2" />
        </div>
      </fieldset>
      <fieldset disabled={submitting} className="space-y-4">
        <legend className="mb-1 text-xs font-semibold uppercase tracking-wider text-text-secondary">{t('inventory.product.groupPricing')}</legend>
        <p className="text-xs text-text-secondary">{currency ?? '—'} · {t('inventory.product.salePrice')}/{values.baseUnit} · {t('inventory.product.purchaseCost')}/{values.baseUnit} · 1 {values.purchaseUnit || values.baseUnit} = {values.conversionFactor} {values.baseUnit}</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormInput form={form} name="costPrice" label={t('inventory.product.purchaseCost')} id="product-cost" type="number" min={0} step={0.01} required />
          <FormInput form={form} name="unitPrice" label={t('inventory.product.salePrice')} id="product-price" type="number" min={0} step={0.01} required />
          <FormSelect form={form} name="taxId" label={t('inventory.tax')} id="product-tax" placeholder={t('common.select')} options={(taxes ?? []).map((tax) => ({ value: tax.id, label: `${tax.name} (${tax.type === 'fixed' ? `${tax.rate} ${currency ?? '—'}` : `${tax.rate * 100}%`})` }))} />
          <FormCheckbox form={form} name="isService" label={t('inventory.product.isService')} />
        </div>
      </fieldset>
      <fieldset disabled={submitting} className="space-y-4">
        <legend className="mb-1 text-xs font-semibold uppercase tracking-wider text-text-secondary">{t('inventory.product.groupUnits')}</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormSelect form={form} name="baseUnit" label={t('inventory.product.baseUnit')} id="product-base-unit" options={['unidad', 'metro', 'gramo', 'litro', 'caja'].map((unit) => ({ value: unit, label: t(`inventory.units.${unit}`) }))} />
          <FormInput form={form} name="purchaseUnit" label={t('inventory.product.purchaseUnit')} id="product-purchase-unit" placeholder={t('inventory.product.purchaseUnitPlaceholder')} />
          <FormInput form={form} name="conversionFactor" label={t('inventory.product.conversionFactor')} id="product-conversion" type="number" min={0.000001} step={0.000001} />
          <FormInput form={form} name="reorderPoint" label={t('inventory.product.reorderPoint')} id="product-reorder" type="number" min={0} step={0.01} />
          <FormInput form={form} name="minStock" label={t('inventory.product.minStock')} id="product-min-stock" type="number" min={0} step={0.01} />
          <FormInput form={form} name="maxStock" label={t('inventory.product.maxStock')} id="product-max-stock" type="number" min={0} step={0.01} />
        </div>
      </fieldset>
    </form>
  );

  const productActions = (
    <div className="flex justify-end gap-3">
      <button
        onClick={() => setShowForm(false)}
        className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:text-text-primary"
      >
        {t('common.cancel')}
      </button>
      <button
        onClick={handleCreate}
        disabled={submitting}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
      >
        {t('common.save')}
      </button>
    </div>
  );

  return (
    <>
      <ListPage
        title={t('inventory.products')}
        subtitle={t('inventory.productsSubtitle')}
        contentClassName="m-6 gap-4 overflow-y-auto"
        contentPadding={false}
        onRefresh={() => Promise.all([refetchInventory(), client.invalidateQueries({ queryKey: ['inventory', 'summary'] })])}
        refreshing={refreshing}
        pagination={
          <ListPagination
            page={page}
            pageSize={pageSize}
            total={total}
            totalPages={Math.max(1, Math.ceil(total / pageSize))}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        }
      >
        <div className="shrink-0">
          <InventorySummaryCards />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={t('common.search')}
            aria-label={t('common.search')}
            className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none sm:w-64"
          />
          <div className="ml-auto flex flex-wrap items-center gap-3">
            <span className="text-xs text-text-secondary">
              {t('inventory.productsCount').replace('{count}', String(total))}
            </span>
            <button
              onClick={() => setGroupByCategory(!groupByCategory)}
              aria-pressed={groupByCategory}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                groupByCategory
                  ? 'bg-accent-alpha text-accent'
                  : 'border border-border text-text-secondary hover:text-text-primary'
              }`}
            >
              {t('inventory.groupByCategory')}
            </button>
            <button
              onClick={() => navigate('/inventory/categories')}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors"
            >
              <Tags size={14} aria-hidden="true" />
              {t('inventory.categories')}
            </button>
            {canCreate && <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover"
            >
              <Plus size={14} aria-hidden="true" />
              {t('inventory.product.create')}
            </button>}
          </div>
        </div>
        {listError && <p role="alert" className="text-sm text-error">{t('inventory.product.loadError')} <button type="button" onClick={() => void refetchInventory()} className="underline">{t('common.retry')}</button></p>}
        <div className="flex shrink-0 flex-col">
          {groupByCategory &&
            (() => {
              const categories = new Map<string, InventoryProduct[]>();
              for (const p of products) {
                const cat = p.category || t('inventory.summary.uncategorized');
                if (!categories.has(cat)) categories.set(cat, []);
                categories.get(cat)!.push(p);
              }
              return (
                <div className="space-y-1">
                  {Array.from(categories.entries()).map(([cat, items]) => (
                    <CategorySection key={cat} name={cat} count={items.length}>
                      <div className="px-2 pb-3 pt-1">
                        <VirtualGrid
                          data={items}
                          columns={columns}
                          loading={loading}
                          onRowClick={(row) => navigate(`/inventory/${row.id}`)}
                          emptyMessage=""
                          scrollable={false}
                        />
                      </div>
                    </CategorySection>
                  ))}
                </div>
              );
            })()}
          {!groupByCategory && (
            <VirtualGrid
              data={products}
              columns={columns}
              loading={loading}
              sortColumn={sortColumn as keyof InventoryProduct | undefined}
              sortDirection={sortDirection}
              onSort={(col) => setSort(col as keyof InventoryProduct)}
              onRowClick={(row) => navigate(`/inventory/${row.id}`)}
              emptyMessage={filter ? t('common.noResults') : t('inventory.summary.emptyProducts')}
              scrollable={false}
            />
          )}
        </div>
      </ListPage>

      <Drawer.Root isOpen={showForm} onOpenChange={setShowForm}>
        <Drawer.Backdrop isDismissable>
          <Drawer.Content placement="right">
            <Drawer.Dialog className="flex h-full w-full flex-col bg-overlay p-0 sm:w-[480px]">
              <Drawer.Header className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
                <Drawer.Heading className="font-brand text-base font-extrabold text-text-primary">
                  {t('inventory.product.create')}
                </Drawer.Heading>
                <Drawer.CloseTrigger
                  aria-label={t('common.close')}
                  className="rounded-md p-1.5 text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                >
                  <X size={16} aria-hidden="true" />
                </Drawer.CloseTrigger>
              </Drawer.Header>
              <Drawer.Body className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                <ProductImagePicker files={productImages} onChange={setProductImages} />
                <div className="mt-4">{productFields}</div>
                {error && <p role="alert" className="mt-4 text-sm text-error">{error}</p>}
                {inlineError && <p role="alert" className="mt-4 text-sm text-error">{inlineError}</p>}
              </Drawer.Body>
              <Drawer.Footer className="shrink-0 border-t border-border px-6 py-4">
                {productActions}
              </Drawer.Footer>
            </Drawer.Dialog>
          </Drawer.Content>
        </Drawer.Backdrop>
      </Drawer.Root>
    </>
  );
}

function CategorySection({
  name,
  count,
  children,
}: {
  name: string;
  count: number;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(true);
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 bg-surface-hover px-3 py-2 text-left text-sm font-medium text-text-primary hover:bg-border"
      >
        <ChevronRight
          size={14}
          aria-hidden="true"
          className={`shrink-0 transition-transform ${open ? 'rotate-90' : ''}`}
        />
        {name}
        <span className="ml-auto text-xs text-text-secondary">
          {t('inventory.productsCount').replace('{count}', String(count))}
        </span>
      </button>
      {open && children}
    </div>
  );
}
