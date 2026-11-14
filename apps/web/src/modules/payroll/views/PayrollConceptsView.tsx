import { useState } from 'react';
import { useForm, useStore } from '@tanstack/react-form';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { applyServerErrors, resolveServerErrorMessage, FormInput, FormSelect } from '@/shared/form';
import {
  payrollConceptFormSchema,
  type PayrollConceptFormValues,
} from '@/shared/validation/payroll-concept';
import {
  useCreatePayrollConcept,
  usePayrollConcepts,
  useUpdatePayrollConcept,
} from '../hooks/usePayrolls';

const defaultValues: PayrollConceptFormValues = {
  code: '',
  name: '',
  type: 'EARNING',
  calculationMode: 'FIXED',
  amount: undefined as unknown as number,
  currency: 'VED',
  recurring: false,
};

export function PayrollConceptsView() {
  const { t } = useTranslation();
  const conceptsQuery = usePayrollConcepts();
  const createConcept = useCreatePayrollConcept();
  const updateConcept = useUpdatePayrollConcept();
  const [serverError, setServerError] = useState('');

  const form = useForm({
    defaultValues,
    validators: { onSubmit: payrollConceptFormSchema },
    onSubmit: async ({ value }) => {
      setServerError('');
      try {
        await createConcept.mutateAsync({
          code: value.code.trim().toUpperCase(),
          name: value.name.trim(),
          type: value.type,
          calculationMode: value.calculationMode,
          amount: value.amount,
          currency: value.currency.trim().toUpperCase(),
          recurring: value.recurring,
        });
        form.reset();
      } catch (error) {
        const result = applyServerErrors(form, error);
        setServerError(resolveServerErrorMessage(result, t('common.saveUnconfirmed')));
      }
    },
  });

  const calculationMode = useStore(form.store, (state) => state.values.calculationMode);
  const recurring = useStore(form.store, (state) => state.values.recurring);

  if (conceptsQuery.isLoading) {
    return <div className="p-6 text-sm text-text-secondary">{t('common.loading')}</div>;
  }

  if (conceptsQuery.isError) {
    return <p role="alert" className="p-6 text-sm text-error">{t('payroll.loadError')}</p>;
  }

  const concepts = conceptsQuery.data ?? [];
  const mutationFailed = updateConcept.isError;

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h2 className="text-lg font-bold text-text-primary">{t('payroll.conceptsTitle')}</h2>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-text-secondary">{t('payroll.conceptsDescription')}</p>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
          className="grid gap-3 border-b border-border pb-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          <FormInput form={form} name="code" label={t('payroll.code')} required />
          <FormInput form={form} name="name" label={t('payroll.conceptName')} required />
          <FormSelect
            form={form}
            name="type"
            label={t('payroll.conceptType')}
            options={[
              { value: 'EARNING', label: t('payroll.earning') },
              { value: 'DEDUCTION', label: t('payroll.deduction') },
            ]}
          />
          <FormSelect
            form={form}
            name="calculationMode"
            label={t('payroll.calculationMode')}
            options={[
              { value: 'FIXED', label: t('payroll.fixedAmount') },
              { value: 'BASE_PERCENTAGE', label: t('payroll.basePercentage') },
            ]}
          />
          <FormInput
            form={form}
            name="amount"
            type="number"
            min={0}
            step={0.01}
            label={
              calculationMode === 'BASE_PERCENTAGE'
                ? t('payroll.percentage')
                : t('payroll.amount')
            }
            required
          />
          <FormInput form={form} name="currency" label={t('payroll.currency')} required />
          <label className="flex items-center gap-2 self-end pb-2 text-xs text-text-secondary">
            <input
              type="checkbox"
              checked={recurring}
              onChange={(event) => form.setFieldValue('recurring', event.target.checked)}
              className="accent-accent"
            />
            {t('payroll.recurring')}
          </label>
          <button
            type="submit"
            disabled={createConcept.isPending}
            className="self-end rounded-lg bg-accent px-4 py-2 text-xs font-medium text-white hover:bg-accent/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50"
          >
            {createConcept.isPending ? t('common.loading') : t('payroll.createConcept')}
          </button>
          {serverError && (
            <p role="alert" className="text-xs text-error sm:col-span-2 lg:col-span-4">
              {serverError}
            </p>
          )}
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
