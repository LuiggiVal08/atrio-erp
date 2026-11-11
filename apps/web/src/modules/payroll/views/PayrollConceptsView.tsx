import { useState, type FormEvent } from 'react';
import { useTranslation } from '@/shared/hooks/useTranslation';
import {
  useCreatePayrollConcept,
  usePayrollConcepts,
  useUpdatePayrollConcept,
} from '../hooks/usePayrolls';

const fieldClass = 'w-full rounded-lg border border-border bg-canvas px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none';

export function PayrollConceptsView() {
  const { t } = useTranslation();
  const conceptsQuery = usePayrollConcepts();
  const createConcept = useCreatePayrollConcept();
  const updateConcept = useUpdatePayrollConcept();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<'EARNING' | 'DEDUCTION'>('EARNING');
  const [calculationMode, setCalculationMode] = useState<'FIXED' | 'BASE_PERCENTAGE'>('FIXED');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('VED');
  const [recurring, setRecurring] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createConcept.mutate({
      code: code.trim().toUpperCase(),
      name: name.trim(),
      type,
      calculationMode,
      amount: Number(amount),
      currency: currency.trim().toUpperCase(),
      recurring,
    }, {
      onSuccess: () => {
        setCode('');
        setName('');
        setAmount('');
        setRecurring(false);
      },
    });
  };

  if (conceptsQuery.isLoading) {
    return <div className="p-6 text-sm text-text-secondary">{t('common.loading')}</div>;
  }

  if (conceptsQuery.isError) {
    return <p role="alert" className="p-6 text-sm text-error">{t('payroll.loadError')}</p>;
  }

  const concepts = conceptsQuery.data ?? [];
  const mutationFailed = createConcept.isError || updateConcept.isError;

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h2 className="text-lg font-bold text-text-primary">{t('payroll.conceptsTitle')}</h2>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-text-secondary">{t('payroll.conceptsDescription')}</p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-3 border-b border-border pb-6 sm:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-1">
            <span className="text-xs font-medium text-text-secondary">{t('payroll.code')}</span>
            <input required minLength={2} maxLength={30} value={code} onChange={(event) => setCode(event.target.value)} className={fieldClass} />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-text-secondary">{t('payroll.conceptName')}</span>
            <input required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} className={fieldClass} />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-text-secondary">{t('payroll.conceptType')}</span>
            <select value={type} onChange={(event) => setType(event.target.value as typeof type)} className={fieldClass}>
              <option value="EARNING">{t('payroll.earning')}</option>
              <option value="DEDUCTION">{t('payroll.deduction')}</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-text-secondary">{t('payroll.calculationMode')}</span>
            <select value={calculationMode} onChange={(event) => setCalculationMode(event.target.value as typeof calculationMode)} className={fieldClass}>
              <option value="FIXED">{t('payroll.fixedAmount')}</option>
              <option value="BASE_PERCENTAGE">{t('payroll.basePercentage')}</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-text-secondary">
              {calculationMode === 'BASE_PERCENTAGE' ? t('payroll.percentage') : t('payroll.amount')}
            </span>
            <input required type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} className={fieldClass} />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-text-secondary">{t('payroll.currency')}</span>
            <input required minLength={3} maxLength={3} value={currency} onChange={(event) => setCurrency(event.target.value.toUpperCase())} className={fieldClass} />
          </label>
          <label className="flex items-center gap-2 self-end pb-2 text-xs text-text-secondary">
            <input type="checkbox" checked={recurring} onChange={(event) => setRecurring(event.target.checked)} className="accent-accent" />
            {t('payroll.recurring')}
          </label>
          <button
            type="submit"
            disabled={createConcept.isPending}
            className="self-end rounded-lg bg-accent px-4 py-2 text-xs font-medium text-white hover:bg-accent/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50"
          >
            {createConcept.isPending ? t('common.loading') : t('payroll.createConcept')}
          </button>
        </form>

        {mutationFailed && (
          <p role="alert" className="text-xs text-error">{t('payroll.saveError')}</p>
        )}

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-surface/60 text-text-secondary">
                <th className="px-4 py-3">{t('payroll.code')}</th>
                <th className="px-4 py-3">{t('payroll.conceptName')}</th>
                <th className="px-4 py-3">{t('payroll.conceptType')}</th>
                <th className="px-4 py-3">{t('payroll.calculationMode')}</th>
                <th className="px-4 py-3 text-right">{t('payroll.amount')}</th>
                <th className="px-4 py-3">{t('payroll.status')}</th>
              </tr>
            </thead>
            <tbody>
              {concepts.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-text-secondary">{t('payroll.noConcepts')}</td></tr>
              ) : concepts.map((concept) => (
                <tr key={concept.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-mono text-text-primary">{concept.code}</td>
                  <td className="px-4 py-3 text-text-primary">
                    {concept.name}
                    {concept.recurring && <span className="ml-2 text-[10px] text-text-muted">{t('payroll.recurring')}</span>}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{t(`payroll.${concept.type === 'EARNING' ? 'earning' : 'deduction'}`)}</td>
                  <td className="px-4 py-3 text-text-secondary">{t(`payroll.${concept.calculationMode === 'FIXED' ? 'fixedAmount' : 'basePercentage'}`)}</td>
                  <td className="px-4 py-3 text-right font-mono text-text-primary">
                    {concept.calculationMode === 'BASE_PERCENTAGE'
                      ? `${concept.amount}%`
                      : `${concept.currency} ${Number(concept.amount).toLocaleString()}`}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      aria-pressed={concept.isActive}
                      disabled={updateConcept.isPending}
                      onClick={() => updateConcept.mutate({ id: concept.id, isActive: !concept.isActive })}
                      className={`rounded px-2 py-1 text-[10px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50 ${
                        concept.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-surface-hover text-text-secondary'
                      }`}
                    >
                      {concept.isActive ? t('payroll.active') : t('payroll.inactive')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
