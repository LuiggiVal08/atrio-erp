import { useState } from 'react';
import { isAxiosError } from 'axios';
import { useInventoryStore, type InventoryProduct } from '../store/inventory-store';
import { useInventoryList } from '../hooks/useInventoryList';
import { useCreateProduct } from '../hooks/useCreateProduct';
import { useCategories } from '@/shared/hooks/useCategories';
import { useCreateCategory } from '../hooks/useCreateCategory';
import { useTaxes, type Tax } from '../hooks/useTaxes';
import { useBrands, useCreateBrand } from '../hooks/useBrands';
import { Combobox } from '@/core/components/Combobox';
import { Drawer } from '@heroui/react';
import { VirtualGrid, type GridColumn } from '@/core/components/VirtualGrid';
import { ListPage } from '@/core/components/ListPage';
import { ListPagination } from '@/core/components/ListPagination';
import { InventorySummaryCards } from '../components/InventorySummaryCards';
import { ProductImagePicker } from '../components/ProductImagePicker';
import { useUploadProductImages } from '../hooks/useProductImage';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { ChevronRight, Tags } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const inputClass =
  'w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none';

export function InventoryListView() {
  const { t } = useTranslation();
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
    isFetching: isFetchingInventory,
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
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [pname, setPname] = useState('');
  const [desc, setDesc] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [catName, setCatName] = useState('');
  const [brandId, setBrandId] = useState('');
  const [brandName, setBrandName] = useState('');
  const [showBrandForm, setShowBrandForm] = useState(false);
  const [unitPrice, setUnitPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [taxId, setTaxId] = useState('');
  const [isService, setIsService] = useState(false);
  const [baseUnit, setBaseUnit] = useState('unidad');
  const [purchaseUnit, setPurchaseUnit] = useState('');
  const [conversionFactor, setConversionFactor] = useState('1');
  const [minStock, setMinStock] = useState('0');
  const [maxStock, setMaxStock] = useState('');
  const [reorderPoint, setReorderPoint] = useState('0');
  const [supplierSku, setSupplierSku] = useState('');
  const [productImages, setProductImages] = useState<File[]>([]);
  const [imageUploadError, setImageUploadError] = useState(false);

  const columns: GridColumn<InventoryProduct>[] = [
    { key: 'sku', label: t('inventory.product.sku'), width: 120, sortable: true },
    { key: 'name', label: t('inventory.product.name'), sortable: true },
    { key: 'category', label: t('inventory.categories'), width: 140, sortable: true },
    { key: 'stock', label: t('inventory.stock'), width: 100, align: 'right', sortable: true },
    {
      key: 'averageCost',
      label: t('inventory.product.cost'),
      width: 120,
      align: 'right',
      sortable: true,
    },
    {
      key: 'unitPrice',
      label: t('inventory.product.price'),
      width: 120,
      align: 'right',
      sortable: true,
    },
    {
      key: 'isActive',
      label: t('inventory.product.isActive'),
      width: 100,
      sortable: true,
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

  const serverMessage = isAxiosError(createProduct.error)
    ? createProduct.error.response?.data?.message
    : undefined;
  const errorMessage = Array.isArray(serverMessage)
    ? serverMessage.join(' ')
    : typeof serverMessage === 'string'
      ? serverMessage
      : t('common.saveUnconfirmed');

  const handleCreate = () => {
    if (!sku.trim() || !pname.trim() || !unitPrice || !costPrice || createProduct.isPending) return;
    createProduct.mutate(
      {
        sku: sku.trim(),
        barcode: barcode.trim() || undefined,
        name: pname.trim(),
        description: desc.trim() || undefined,
        categoryId: categoryId || undefined,
        brandId: brandId || undefined,
        unitPrice: Number(unitPrice),
        costPrice: Number(costPrice),
        taxId: taxId || undefined,
        isService,
        baseUnit,
        purchaseUnit: purchaseUnit || undefined,
        conversionFactor: Number(conversionFactor) || 1,
        minStock: Number(minStock) || 0,
        maxStock: maxStock ? Number(maxStock) : undefined,
        reorderPoint: Number(reorderPoint) || 0,
        supplierSku: supplierSku || undefined,
      },
      {
        onSuccess: async (createdProduct) => {
          if (productImages.length && createdProduct?.id) {
            try {
              await uploadProductImages.mutateAsync({
                id: createdProduct.id,
                files: productImages,
              });
            } catch {
              setImageUploadError(true);
              return;
            }
          }
          setSku('');
          setBarcode('');
          setPname('');
          setDesc('');
          setCategoryId('');
          setUnitPrice('');
          setCostPrice('');
          setTaxId('');
          setIsService(false);
          setBaseUnit('unidad');
          setPurchaseUnit('');
          setConversionFactor('1');
          setMinStock('0');
          setMaxStock('');
          setReorderPoint('0');
          setSupplierSku('');
          setBrandId('');
          setBrandName('');
          setShowBrandForm(false);
          setProductImages([]);
          setImageUploadError(false);
          setShowForm(false);
        },
      },
    );
  };

  const handleCreateCategory = async () => {
    if (!catName.trim()) return;
    await createCategory.mutateAsync({ name: catName.trim() });
    setCatName('');
    setShowCatForm(false);
  };

  const handleCreateBrand = async () => {
    if (!brandName.trim()) return;
    const created = await createBrand.mutateAsync({ name: brandName.trim() });
    setBrandId(created.id);
    setBrandName('');
    setShowBrandForm(false);
  };

  const productFields = (
    <div className="space-y-6">
      <fieldset className="space-y-4">
        <legend className="mb-1 text-xs font-semibold uppercase tracking-wider text-text-secondary">
          {t('inventory.product.groupIdentity')}
        </legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t('inventory.product.sku')} htmlFor="product-sku">
            <input
              id="product-sku"
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field
            label={t('inventory.product.barcode')}
            htmlFor="product-barcode"
            hint={t('inventory.product.barcodeHint')}
          >
            <input
              id="product-barcode"
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder={t('inventory.product.barcodePlaceholder')}
              className={inputClass}
            />
          </Field>
          <Field label={t('inventory.product.name')} htmlFor="product-name">
            <input
              id="product-name"
              type="text"
              value={pname}
              onChange={(e) => setPname(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label={t('inventory.product.supplierRef')} htmlFor="product-supplier-ref">
            <input
              id="product-supplier-ref"
              type="text"
              value={supplierSku}
              onChange={(e) => setSupplierSku(e.target.value)}
              className={inputClass}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label={t('inventory.categories')} htmlFor="product-category">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Combobox
                    id="product-category"
                    value={categoryId}
                    onChange={setCategoryId}
                    options={(categories ?? []).map((c: any) => ({ id: c.id, name: c.name }))}
                    placeholder={t('common.select')}
                    aria-label={t('inventory.categories')}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowCatForm(!showCatForm)}
                  aria-label={t('inventory.product.newCategoryPlaceholder')}
                  aria-expanded={showCatForm}
                  className="rounded-lg bg-accent px-3 text-sm text-white hover:bg-accent-hover"
                >
                  +
                </button>
              </div>
            </Field>
            {showCatForm && (
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  aria-label={t('inventory.product.newCategoryPlaceholder')}
                  placeholder={t('inventory.product.newCategoryPlaceholder')}
                  className={`flex-1 ${inputClass}`}
                />
                <button
                  onClick={handleCreateCategory}
                  disabled={createCategory.isPending}
                  className="rounded-lg bg-accent px-3 text-sm text-white disabled:opacity-50"
                >
                  {t('common.save')}
                </button>
              </div>
            )}
          </div>
          <div className="sm:col-span-2">
            <Field label={t('inventory.product.brand')} htmlFor="product-brand">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Combobox
                    id="product-brand"
                    value={brandId}
                    onChange={setBrandId}
                    options={(brands ?? []).map((b) => ({ id: b.id, name: b.name }))}
                    placeholder={t('common.select')}
                    aria-label={t('inventory.product.brand')}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowBrandForm(!showBrandForm)}
                  aria-label={t('inventory.product.newBrand')}
                  aria-expanded={showBrandForm}
                  className="rounded-lg bg-accent px-3 text-sm text-white hover:bg-accent-hover"
                >
                  +
                </button>
              </div>
            </Field>
            {showBrandForm && (
              <div className="mt-2 flex gap-2">
                <div className="flex-1">
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    aria-label={t('inventory.product.newBrand')}
                    placeholder={t('inventory.product.newBrand')}
                    className={inputClass}
                  />
                </div>
                <button
                  onClick={handleCreateBrand}
                  disabled={createBrand.isPending}
                  className="rounded-lg bg-accent px-3 text-sm text-white disabled:opacity-50"
                >
                  {t('common.save')}
                </button>
              </div>
            )}
          </div>
          <div className="sm:col-span-2">
            <Field label={t('inventory.product.description')} htmlFor="product-description">
              <input
                id="product-description"
                type="text"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-1 text-xs font-semibold uppercase tracking-wider text-text-secondary">
          {t('inventory.product.groupPricing')}
        </legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t('inventory.product.purchaseCost')} htmlFor="product-cost">
            <input
              id="product-cost"
              type="number"
              min="0"
              step="0.01"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label={t('inventory.product.salePrice')} htmlFor="product-price">
            <input
              id="product-price"
              type="number"
              min="0"
              step="0.01"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label={t('inventory.tax')} htmlFor="product-tax">
            <select
              id="product-tax"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              className={inputClass}
            >
              <option value="">-- {t('common.select')} --</option>
              {(taxes ?? []).map((tx: Tax) => (
                <option key={tx.id} value={tx.id}>
                  {tx.name} ({(tx.rate * 100).toFixed(0)}%)
                </option>
              ))}
            </select>
          </Field>
          <div className="flex items-end">
            <label className="flex cursor-pointer items-center gap-2 pb-2">
              <input
                type="checkbox"
                checked={isService}
                onChange={(e) => setIsService(e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-sm text-text-secondary">
                {t('inventory.product.isService')}
              </span>
            </label>
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-1 text-xs font-semibold uppercase tracking-wider text-text-secondary">
          {t('inventory.product.groupUnits')}
        </legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t('inventory.product.baseUnit')} htmlFor="product-base-unit">
            <select
              id="product-base-unit"
              value={baseUnit}
              onChange={(e) => setBaseUnit(e.target.value)}
              className={inputClass}
            >
              <option value="unidad">Unidad</option>
              <option value="metro">Metro</option>
              <option value="gramo">Gramo</option>
              <option value="litro">Litro</option>
              <option value="caja">Caja</option>
            </select>
          </Field>
          <Field label={t('inventory.product.purchaseUnit')} htmlFor="product-purchase-unit">
            <input
              id="product-purchase-unit"
              type="text"
              value={purchaseUnit}
              onChange={(e) => setPurchaseUnit(e.target.value)}
              placeholder={t('inventory.product.purchaseUnitPlaceholder')}
              className={inputClass}
            />
          </Field>
          <Field label={t('inventory.product.conversionFactor')} htmlFor="product-conversion">
            <input
              id="product-conversion"
              type="number"
              min="0.000001"
              step="0.000001"
              value={conversionFactor}
              onChange={(e) => setConversionFactor(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label={t('inventory.product.reorderPoint')} htmlFor="product-reorder">
            <input
              id="product-reorder"
              type="number"
              min="0"
              step="0.01"
              value={reorderPoint}
              onChange={(e) => setReorderPoint(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label={t('inventory.product.minStock')} htmlFor="product-min-stock">
            <input
              id="product-min-stock"
              type="number"
              min="0"
              step="0.01"
              value={minStock}
              onChange={(e) => setMinStock(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label={t('inventory.product.maxStock')} htmlFor="product-max-stock">
            <input
              id="product-max-stock"
              type="number"
              min="0"
              step="0.01"
              value={maxStock}
              onChange={(e) => setMaxStock(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
      </fieldset>
    </div>
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
        disabled={createProduct.isPending}
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
        onRefresh={refetchInventory}
        refreshing={isFetchingInventory}
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
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none"
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
            <button
              onClick={() => setShowForm(true)}
              className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover"
            >
              + {t('inventory.product.create')}
            </button>
          </div>
        </div>
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
                  ✕
                </Drawer.CloseTrigger>
              </Drawer.Header>
              <Drawer.Body className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                <ProductImagePicker files={productImages} onChange={setProductImages} />
                <div className="mt-4">{productFields}</div>
                {createProduct.isError && (
                  <p role="alert" className="mt-4 text-sm text-error">
                    {errorMessage}
                  </p>
                )}
                {imageUploadError && (
                  <p role="alert" className="mt-4 text-sm text-error">
                    {t('inventory.product.imageUploadError')}
                  </p>
                )}
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

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-xs font-medium text-text-secondary">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-text-muted">{hint}</p>}
    </div>
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
