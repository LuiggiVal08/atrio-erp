import { useTranslation } from '@/shared/hooks/useTranslation';

export interface TransactionSummary {
  id: string;
  date: string;
  type: 'invoice' | 'payment' | 'credit_note' | 'debit_note';
  amount: number;
  balance: number;
}

export interface DocumentReference {
  id: string;
  type: string;
  number: string;
  status: string;
  total: number;
  date: string;
}

export interface FichaTercero {
  id: string;
  type: 'customer' | 'vendor' | 'both';
  legalName: string;
  taxId: string;
  phone: string;
  email: string;
  creditLimit: number;
  currentBalance: number;
  currencyCode: string;
  creditExceeded: boolean;
  transactions: TransactionSummary[];
  recentDocuments: DocumentReference[];
}

interface CreditAlertBannerProps {
  ficha: FichaTercero;
}

export function CreditAlertBanner({ ficha }: CreditAlertBannerProps) {
  const { t } = useTranslation();
  if (!ficha.creditExceeded) return null;

  const exceededAmount = ficha.currentBalance - ficha.creditLimit;

  return (
    <div
      role="alert"
      className="flex items-center gap-3 rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error"
    >
      <span className="font-medium">{t('crm.creditAlert.exceeded')}</span>
      <span className="font-mono font-bold" data-testid="exceeded-amount">
        {ficha.currencyCode} {exceededAmount.toLocaleString()}
      </span>
    </div>
  );
}
