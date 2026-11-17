import { useState, useRef, useEffect, useDeferredValue } from 'react';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { useNavigate } from 'react-router-dom';
import { useForm, useStore } from '@tanstack/react-form';
import { useCreatePurchaseOrder } from '@/modules/purchases/hooks/usePurchaseOrders';
import { useVendors } from '@/shared/hooks/useVendors';
import { useInventoryProducts } from '@/modules/inventory/hooks/useInventoryList';
import { useCategories } from '@/shared/hooks/useCategories';
import {
  FormInput,
  applyServerErrors,
  fieldErrorMessages,
  resolveServerErrorMessage,
} from '@/shared/form';
import {
  purchaseOrderFormSchema,
  type PurchaseOrderFormValues,
} from '@/shared/validation/purchase-order';

export function PurchaseOrderFormView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createMutation = useCreatePurchaseOrder();
  const { data: vendors } = useVendors();
  const { data: categories } = useCategories();
  const { data: products = [] } = useInventoryProducts();

  const [vendorSearch, setVendorSearch] = useState('');
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);
  const [expectedDateDirty, setExpectedDateDirty] = useState(false);
  const [suggestedDays, setSuggestedDays] = useState<number | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [serverError, setServerError] = useState('');
  const deferredVendorSearch = useDeferredValue(vendorSearch);
  const deferredProductSearch = useDeferredValue(productSearch);
  const [suggestedCategoryId, setSuggestedCategoryId] = useState<string | null>(null);
  const vendorRef = useRef<HTMLDivElement>(null);

  const form = useForm({
    defaultValues: {
      vendorId: '',
      expectedDate: '',
      subtotal: 0,
      taxAmount: 0,
      notes: '',
    } as PurchaseOrderFormValues,
    validators: { onSubmit: purchaseOrderFormSchema },
    onSubmit: async ({ value }) => {
      setServerError('');
      try {
        await createMutation.mutateAsync({
          vendorId: value.vendorId,
          subtotal: value.subtotal ?? 0,
          taxAmount: value.taxAmount ?? 0,
          total: (value.subtotal ?? 0) + (value.taxAmount ?? 0),
          expectedDate: value.expectedDate,
          notes: value.notes.trim() || undefined,
        });
        navigate('/purchasing');
      } catch (error) {
        const result = applyServerErrors(form, error);
        setServerError(resolveServerErrorMessage(result, 'No se pudo crear la orden de compra.'));
      }
    },
  });

  const vendorId = useStore(form.store, (state) => state.values.vendorId);
  const subtotal = useStore(form.store, (state) => state.values.subtotal);
  const taxAmount = useStore(form.store, (state) => state.values.taxAmount);
  const vendorErrors = useStore(form.store, (state) =>
    fieldErrorMessages(state.fieldMeta.vendorId?.errors),
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (vendorRef.current && !vendorRef.current.contains(e.target as Node)) {
        setShowVendorDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredVendors = (vendors ?? []).filter((v: any) =>
    v.legalName.toLowerCase().includes(deferredVendorSearch.toLowerCase()) ||
    v.taxId.toLowerCase().includes(deferredVendorSearch.toLowerCase())
  );

  const filteredProducts = (products ?? []).filter((p) =>
    p.name.toLowerCase().includes(deferredProductSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(deferredProductSearch.toLowerCase())
  );

  const formatDateInput = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const selectVendor = (v: any) => {
    form.setFieldValue('vendorId', v.id);
    setVendorSearch(v.legalName);
    setShowVendorDropdown(false);
    if (v.deliveryDays != null && !expectedDateDirty) {
      const d = new Date();
      d.setDate(d.getDate() + v.deliveryDays);
      form.setFieldValue('expectedDate', formatDateInput(d));
    }
    setSuggestedDays(v.deliveryDays ?? null);
  };

  const suggestVendorsForProduct = (product: { category?: string }) => {
    const category = (categories ?? []).find((c: any) => c.name === product.category);
    setSuggestedCategoryId(category?.id ?? null);
  };

  const suggestedVendors = suggestedCategoryId
    ? (vendors ?? []).filter((v: any) => Array.isArray(v.categoryIds) && v.categoryIds.includes(suggestedCategoryId))
    : [];

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <h1 className="text-lg font-bold text-text-primary">{t('purchasing.createOrder')}</h1>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
          className="space-y-4"
        >
        <div ref={vendorRef} className="relative">
          <label className="mb-1 block text-xs font-medium text-text-secondary">{t('purchasing.vendor')}</label>
          <input
            type="text"
            value={vendorSearch}
            onChange={(e) => { setVendorSearch(e.target.value); setShowVendorDropdown(true); }}
            onFocus={() => setShowVendorDropdown(true)}
            placeholder="Buscar proveedor..."
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none"
          />
          {vendorErrors.length > 0 && (
            <p role="alert" className="mt-1 text-xs text-error">{vendorErrors.join(' · ')}</p>
          )}
          {showVendorDropdown && vendorSearch && (
            <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-border bg-surface shadow-lg">
              {filteredVendors.length === 0 ? (
                <div className="px-3 py-2 text-xs text-text-secondary">Sin resultados</div>
              ) : (
                filteredVendors.map((v: any) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => selectVendor(v)}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-border ${v.id === vendorId ? 'bg-border' : ''}`}
                  >
                    <span className="text-text-primary">{v.legalName}</span>
                    <span className="ml-2 text-xs text-text-secondary">{v.taxId}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div onChange={() => setExpectedDateDirty(true)}>
          <FormInput
            form={form}
            name="expectedDate"
            label={t('purchasing.expectedDate')}
            type="date"
            required
          />
          {suggestedDays != null && !expectedDateDirty && (
            <p className="mt-1 text-xs text-text-secondary">
              {t('purchasing.expectedDateSuggested').replace('{days}', String(suggestedDays))}
            </p>
          )}
        </div>

        {/* Product browser */}
        <div className="rounded-lg border border-border bg-surface p-3">
          <label className="mb-2 block text-xs font-medium text-text-secondary">Productos de referencia</label>
          <input
            type="text"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            placeholder="Buscar producto (SKU o nombre)..."
            className="mb-2 w-full rounded-lg border border-border bg-canvas px-3 py-1.5 text-xs text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none"
          />
          <div className="max-h-36 overflow-y-auto">
            {filteredProducts.length === 0 ? (
              <div className="py-2 text-center text-xs text-text-secondary">Sin resultados</div>
            ) : (
              filteredProducts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => suggestVendorsForProduct(p)}
                  className="flex w-full items-center justify-between border-b border-border py-1.5 text-left last:border-0 hover:bg-surface-hover"
                >
                  <div>
                    <span className="text-xs font-mono text-text-secondary">{p.sku}</span>
                    <span className="ml-2 text-xs text-text-primary">{p.name}</span>
                  </div>
                  <span className="text-xs text-text-secondary">Stock: {p.stock} | ${p.unitPrice.toFixed(2)}</span>
                </button>
              ))
            )}
          </div>
        </div>

        {suggestedCategoryId && (
          <div className="rounded-lg border border-accent/40 bg-accent/5 p-3">
            <label className="mb-2 block text-xs font-medium text-text-secondary">Proveedores sugeridos para esta categoría</label>
            {suggestedVendors.length === 0 ? (
              <p className="text-xs text-text-secondary">No hay proveedores registrados en esta categoría.</p>
            ) : (
              <div className="space-y-1">
                {suggestedVendors.map((v: any) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => selectVendor(v)}
                    className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs hover:bg-surface-hover"
                  >
                    <span className="text-text-primary">{v.legalName}</span>
                    <span className="text-text-secondary">
                      {v.deliveryDays != null ? `${v.deliveryDays} días` : 'Entrega sin definir'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <FormInput
            form={form}
            name="subtotal"
            label={t('sales.pos.subtotal')}
            type="number"
            min={0}
            step={0.01}
          />
          <FormInput
            form={form}
            name="taxAmount"
            label={t('localization.taxes')}
            type="number"
            min={0}
            step={0.01}
          />
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary">{t('sales.pos.total')}</label>
            <input
              type="number" readOnly
              value={((subtotal ?? 0) + (taxAmount ?? 0)).toFixed(2)}
              className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm font-semibold text-text-primary"
            />
          </div>
        </div>

        <FormInput
          form={form}
          name="notes"
          label={t('purchasing.notes')}
          multiline
          rows={3}
        />

        {serverError && (
          <p role="alert" className="rounded-lg border border-error/30 bg-error-alpha px-3 py-2 text-sm text-error">
            {serverError}
          </p>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={createMutation.isPending}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
            {createMutation.isPending ? t('common.loading') : t('common.create')}
          </button>
          <button type="button" onClick={() => navigate('/purchasing')}
            className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:text-text-primary">
            {t('common.cancel')}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}
