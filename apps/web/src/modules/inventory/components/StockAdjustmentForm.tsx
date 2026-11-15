import { useRef, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { applyServerErrors, clearServerErrors, FormInput, FormSelect, resolveServerErrorMessage } from '@/shared/form';
import { stockAdjustmentSchema, type StockAdjustmentValues } from '@/shared/validation/stock-adjustment';
import { useAdjustStock, type StockBalance } from '../hooks/useStockMovements';

interface Props {
  balance: StockBalance | null;
  balances: StockBalance[];
  products: Array<{ id: string; sku: string; name: string }>;
  warehouses: Array<{ id: string; name: string }>;
  onSaved: () => void;
  onClose: () => void;
}

export function StockAdjustmentForm({ balance, balances, products, warehouses, onSaved, onClose }: Props) {
  const { t, locale } = useTranslation();
  const mutation = useAdjustStock();
  const [serverError, setServerError] = useState('');
  const operation = useRef<{ fingerprint: string; id: string } | null>(null);
  const defaultValues: StockAdjustmentValues = {
    productId: balance?.productId ?? '', warehouseId: balance?.warehouseId ?? '',
    mode: 'in', quantity: 1, reason: '', lotNumber: '', serialNumber: '', expirationDate: '',
  };
  const currentBalance = (value: StockAdjustmentValues) => balance ?? balances.find(
    (row) => row.productId === value.productId && row.warehouseId === value.warehouseId,
  );
  const form = useForm({
    defaultValues,
    validators: { onSubmit: stockAdjustmentSchema },
    onSubmit: async ({ value }) => {
      clearServerErrors(form);
      setServerError('');
      const before = Number(currentBalance(value)?.quantity ?? 0);
      const delta = value.mode === 'count' ? value.quantity - before : (value.mode === 'in' ? value.quantity : -value.quantity);
      if (delta === 0) {
        setServerError(t('inventory.stockView.unchangedCount'));
        return;
      }
      if (before + delta < 0) {
        setServerError(t('inventory.stockView.insufficient').replace('{count}', String(before)));
        return;
      }
      const body = {
        productId: value.productId, warehouseId: value.warehouseId,
        type: delta > 0 ? 'in' as const : 'out' as const, quantity: Math.abs(delta), reason: value.reason.trim(),
        expectedQuantity: value.mode === 'count' ? before : undefined,
        lotNumber: value.lotNumber.trim() || undefined,
        serialNumber: value.serialNumber.trim() || undefined,
        expirationDate: value.expirationDate || undefined,
      };
      const fingerprint = JSON.stringify(body);
      if (operation.current?.fingerprint !== fingerprint) operation.current = { fingerprint, id: crypto.randomUUID() };
      try {
        await mutation.mutateAsync({ ...body, operationId: operation.current.id });
        onSaved();
      } catch (error) {
        setServerError(resolveServerErrorMessage(applyServerErrors(form, error), t('common.saveUnconfirmed')));
      }
    },
  });
  const number = (value: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 6 }).format(value);

  return (
    <form onSubmit={(event) => { event.preventDefault(); void form.handleSubmit(); }} className="space-y-4">
      {balance ? (
        <div className="rounded-lg bg-surface px-4 py-3">
          <div className="font-medium">{balance.product.name}</div>
          <div className="text-sm text-text-secondary">{balance.warehouse.name} · {t('inventory.stockView.currentStock')}: {number(balance.quantity)} {balance.product.baseUnit}</div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <FormSelect form={form} name="productId" label={t('inventory.stockView.product')} required placeholder={t('common.select')} options={products.map((product) => ({ value: product.id, label: `${product.sku} · ${product.name}` }))} disabled={mutation.isPending} />
          <FormSelect form={form} name="warehouseId" label={t('inventory.stockView.warehouse')} required placeholder={t('common.select')} options={warehouses.map((warehouse) => ({ value: warehouse.id, label: warehouse.name }))} disabled={mutation.isPending} />
        </div>
      )}
      <FormSelect form={form} name="mode" label={t('inventory.stockView.type')} options={[
        { value: 'in', label: t('inventory.stockView.entry') },
        { value: 'out', label: t('inventory.stockView.exit') },
        ...(balance ? [{ value: 'count', label: t('inventory.stockView.physicalCount') }] : []),
      ]} disabled={mutation.isPending} />
      <form.Subscribe selector={(state) => state.values}>
        {(values) => {
          const before = Number(currentBalance(values)?.quantity ?? 0);
          const after = values.mode === 'count' ? values.quantity : before + (values.mode === 'in' ? values.quantity : -values.quantity);
          return (
            <>
              <FormInput form={form} name="quantity" type="number" min={values.mode === 'count' ? 0 : 0.000001} step="any" label={t(values.mode === 'count' ? 'inventory.stockView.countedQuantity' : 'inventory.stockView.amount')} required disabled={mutation.isPending} />
              <p className={`text-xs ${after < 0 ? 'text-error' : 'text-text-secondary'}`} role={after < 0 ? 'alert' : 'status'}>
                {t('inventory.stockView.newBalance')}: {number(before)} → {Number.isFinite(after) ? number(after) : '—'}
              </p>
              {values.mode === 'count' && <p className="text-xs text-text-secondary">{t('inventory.stockView.countConcurrency')}</p>}
            </>
          );
        }}
      </form.Subscribe>
      <FormInput form={form} name="reason" label={t('inventory.stockView.reason')} placeholder={t('inventory.stockView.reasonPlaceholder')} required disabled={mutation.isPending} />
      <div className="grid gap-3 sm:grid-cols-2">
        <FormInput form={form} name="lotNumber" label={t('inventory.stockView.lot')} disabled={mutation.isPending} />
        <FormInput form={form} name="serialNumber" label={t('inventory.stockView.serial')} disabled={mutation.isPending} />
      </div>
      <FormInput form={form} name="expirationDate" type="date" label={t('inventory.stockView.expiration')} disabled={mutation.isPending} />
      {serverError && <p role="alert" className="text-sm text-error">{serverError}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" disabled={mutation.isPending} onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-50">{t('common.cancel')}</button>
        <button type="submit" disabled={mutation.isPending} aria-busy={mutation.isPending} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{t(mutation.isPending ? 'common.saving' : 'inventory.stockView.registerAdjustment')}</button>
      </div>
    </form>
  );
}
