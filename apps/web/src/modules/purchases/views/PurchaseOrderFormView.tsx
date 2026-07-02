import { useState } from 'react';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { usePurchaseStore, type NationalizationCosts } from '@/modules/purchases/store/purchase-store';
import { DocumentStateBadge } from '@/core/components/DocumentStateBadge';
import { DocumentTimeline } from '@/core/components/DocumentTimeline';

export function PurchaseOrderFormView() {
  const { t } = useTranslation();
  const { createOrder, orders, updateNationalization, approveOrder, receiveOrder } = usePurchaseStore();
  const [vendorName, setVendorName] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [natCosts, setNatCosts] = useState<NationalizationCosts>({
    freight: 0, insurance: 0, customs: 0, otherCosts: 0,
  });

  const latestOrder = orders[orders.length - 1];
  const totalNatCost = natCosts.freight + natCosts.insurance + natCosts.customs + natCosts.otherCosts;

  const handleCreate = () => {
    if (!vendorName.trim() || !expectedDate) return;
    createOrder({
      vendorId: vendorName.toLowerCase().replace(/\s+/g, '-'),
      vendorName: vendorName.trim(),
      expectedDate,
    });
    setVendorName('');
    setExpectedDate('');
  };

  const handleNatChange = (key: keyof NationalizationCosts, value: string) => {
    const num = parseFloat(value) || 0;
    setNatCosts((prev) => ({ ...prev, [key]: num }));
    if (latestOrder) {
      updateNationalization(latestOrder.id, { [key]: num });
    }
  };

  return (
    <div className="flex h-full flex-col p-6">
      <h1 className="mb-4 text-lg font-bold text-text-primary">
        {latestOrder ? `${t('purchasing.createOrder')} — ${latestOrder.orderNumber}` : t('purchasing.createOrder')}
      </h1>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">{t('purchasing.vendor')}</label>
          <input
            type="text"
            value={vendorName}
            onChange={(e) => setVendorName(e.target.value)}
            placeholder={t('purchasing.vendorPlaceholder')}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">{t('purchasing.expectedDate')}</label>
          <input
            type="date"
            value={expectedDate}
            onChange={(e) => setExpectedDate(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
          />
        </div>
      </div>

      <button
        onClick={handleCreate}
        className="mb-6 self-start rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        {t('common.create')}
      </button>

      {latestOrder && (
        <>
          <div className="mb-4 flex items-center gap-3">
            <DocumentStateBadge status={latestOrder.status} size="md" />
            <div className="flex gap-2">
              {latestOrder.status === 'draft' && (
                <>
                  <button
                    onClick={() => approveOrder(latestOrder.id)}
                    className="rounded bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20"
                  >
                    {t('document.actions.approve')}
                  </button>
                </>
              )}
              {latestOrder.status === 'approved' && (
                <button
                  onClick={() => receiveOrder(latestOrder.id)}
                  className="rounded bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-400 hover:bg-violet-500/20"
                >
                  {t('document.actions.receive')}
                </button>
              )}
            </div>
          </div>

          <div className="mb-6 rounded-xl border border-border bg-surface p-4">
            <h3 className="mb-3 text-sm font-semibold text-text-primary">{t('purchasing.nationalization')}</h3>
            <div className="grid grid-cols-4 gap-3">
              {(['freight', 'insurance', 'customs', 'otherCosts'] as const).map((key) => (
                <div key={key}>
                  <label className="mb-1 block text-[11px] text-text-secondary">
                    {t(`purchasing.${key}`)}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={natCosts[key]}
                    onChange={(e) => handleNatChange(key, e.target.value)}
                    className="w-full rounded border border-border bg-canvas px-2 py-1.5 text-sm text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-between border-t border-border pt-3 text-sm font-semibold">
              <span className="text-text-secondary">{t('purchasing.totalCost')}</span>
              <span className="text-text-primary">
                {totalNatCost.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4">
            <h3 className="mb-2 text-sm font-semibold text-text-primary">{t('document.timeline.title')}</h3>
            <DocumentTimeline
              entries={[
                { fromStatus: null, toStatus: latestOrder.status, timestamp: latestOrder.createdAt, userId: 'user', userName: 'Current User' },
              ]}
            />
          </div>
        </>
      )}
    </div>
  );
}
