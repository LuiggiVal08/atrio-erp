import { useState } from 'react';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { useNavigate } from 'react-router-dom';
import { useCreatePurchaseOrder } from '@/modules/purchases/hooks/usePurchaseOrders';

export function PurchaseOrderFormView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createMutation = useCreatePurchaseOrder();
  const [vendorId, setVendorId] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [subtotal, setSubtotal] = useState('0');
  const [taxAmount, setTaxAmount] = useState('0');
  const [total, setTotal] = useState('0');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId.trim() || !expectedDate) return;

    await createMutation.mutateAsync({
      vendorId: vendorId.trim(),
      subtotal: parseFloat(subtotal) || 0,
      taxAmount: parseFloat(taxAmount) || 0,
      total: parseFloat(total) || 0,
      expectedDate,
      notes: notes.trim() || undefined,
    });
    navigate('/purchasing');
  };

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col p-6">
      <h1 className="mb-6 text-lg font-bold text-text-primary">{t('purchasing.createOrder')}</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">{t('purchasing.vendor')}</label>
          <input
            type="text"
            value={vendorId}
            onChange={(e) => setVendorId(e.target.value)}
            placeholder={t('purchasing.vendorPlaceholder')}
            required
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">{t('purchasing.expectedDate')}</label>
          <input
            type="date"
            value={expectedDate}
            onChange={(e) => setExpectedDate(e.target.value)}
            required
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary">{t('sales.pos.subtotal')}</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={subtotal}
              onChange={(e) => setSubtotal(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary">{t('localization.taxes')}</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={taxAmount}
              onChange={(e) => setTaxAmount(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary">{t('sales.pos.total')}</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-text-primary focus:border-accent focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">{t('purchasing.notes')}</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="rounded-lg bg-accent px-6 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {createMutation.isPending ? t('common.loading') : t('common.create')}
          </button>
          <button
            type="button"
            onClick={() => navigate('/purchasing')}
            className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:text-text-primary"
          >
            {t('common.cancel')}
          </button>
        </div>
      </form>
    </div>
  );
}
