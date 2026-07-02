import { useTranslation } from '@/shared/hooks/useTranslation';
import { useFichaTercero } from '../hooks/useFichaTercero';
import { CreditAlertBanner, type FichaTercero } from '../components/CreditAlertBanner';
import { VirtualGrid, type GridColumn } from '@/core/components/VirtualGrid';

interface FichaTerceroViewProps {
  id: string;
}

export function FichaTerceroView({ id }: FichaTerceroViewProps) {
  const { t } = useTranslation();
  const { data: ficha, isLoading } = useFichaTercero(id);

  if (isLoading) {
    return <div className="flex h-full items-center justify-center text-text-secondary">{t('common.loading')}</div>;
  }
  if (!ficha) {
    return <div className="flex h-full items-center justify-center text-text-secondary">{t('common.noResults')}</div>;
  }

  const txColumns: GridColumn<FichaTercero['transactions'][number]>[] = [
    { key: 'date', label: t('crm.ficha.date'), width: 120 },
    { key: 'type', label: t('crm.ficha.type'), width: 120 },
    { key: 'amount', label: t('crm.ficha.amount'), width: 120, align: 'right' },
    { key: 'balance', label: t('crm.ficha.balance'), width: 120, align: 'right' },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="rounded-lg border border-border bg-surface p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-lg font-bold text-text-primary">{ficha.legalName}</h1>
            <p className="mt-1 text-xs text-text-secondary">{ficha.taxId}</p>
          </div>
          <CreditAlertBanner ficha={ficha} />
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-xs text-text-secondary">{t('crm.ficha.phone')}</span>
            <p className="font-medium text-text-primary">{ficha.phone}</p>
          </div>
          <div>
            <span className="text-xs text-text-secondary">{t('crm.ficha.email')}</span>
            <p className="font-medium text-text-primary">{ficha.email}</p>
          </div>
          <div>
            <span className="text-xs text-text-secondary">{t('crm.ficha.type')}</span>
            <p className="font-medium text-text-primary capitalize">{ficha.type}</p>
          </div>
          <div>
            <span className="text-xs text-text-secondary">{t('crm.ficha.creditLimit')}</span>
            <p className="font-mono font-medium text-text-primary">
              {ficha.currencyCode} {ficha.creditLimit.toLocaleString()}
            </p>
          </div>
          <div>
            <span className="text-xs text-text-secondary">{t('crm.ficha.currentBalance')}</span>
            <p className="font-mono font-medium text-text-primary">
              {ficha.currencyCode} {ficha.currentBalance.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-6">
        <h2 className="mb-4 text-sm font-bold text-text-primary">{t('crm.ficha.transactions')}</h2>
        <VirtualGrid
          data={ficha.transactions}
          columns={txColumns}
          emptyMessage={t('common.noResults')}
        />
      </div>
    </div>
  );
}
