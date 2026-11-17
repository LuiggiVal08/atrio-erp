import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, FileDown, Pencil, X } from 'lucide-react';
import {
  FormInput,
  FormSelect,
  applyServerErrors,
  resolveServerErrorMessage,
} from '@/shared/form';
import {
  payrollAdjustmentSchema,
  type PayrollAdjustmentValues,
} from '@/shared/validation/payroll-adjustment';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { useCashRegisters } from '@/modules/cash/hooks/useCashRegisters';
import { useBankAccounts } from '@/modules/cash/hooks/useBankAccounts';
import {
  useAddPayrollInput,
  useClosePeriod,
  useDownloadPayslipReceipt,
  useGeneratePayslips,
  usePayrollConcepts,
  usePayrollEmployees,
  usePayrollInputs,
  usePayrollPeriod,
  usePayslips,
  usePayPeriod,
  useUpdatePayrollInput,
} from '../hooks/usePayrolls';

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-amber-500/10 text-amber-500',
  CALCULATING: 'bg-blue-500/10 text-blue-500',
  LOCKED: 'bg-purple-500/10 text-purple-500',
  PAID: 'bg-emerald-500/10 text-emerald-500',
  CLOSED: 'bg-gray-500/10 text-gray-400',
};

const fieldClass = 'w-full rounded-lg border border-border bg-canvas px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none';

export function PayrollDetailView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id = '' } = useParams<{ id: string }>();
  const { data: period, isLoading: loadingPeriod, isError: periodError } = usePayrollPeriod(id);
  const { data: payslips = [], isLoading: loadingPayslips, isError: payslipsError } = usePayslips(id);
  const { data: employees = [] } = usePayrollEmployees();
  const { data: concepts = [] } = usePayrollConcepts();
  const { data: inputs = [], isError: inputsError } = usePayrollInputs(id);
  const { data: registers = [], isError: registersError } = useCashRegisters();
  const { data: bankAccounts = [], isError: bankAccountsError } = useBankAccounts();
  const genPayslips = useGeneratePayslips();
  const payPeriod = usePayPeriod();
  const closePeriod = useClosePeriod();
  const downloadReceipt = useDownloadPayslipReceipt();
  const addInput = useAddPayrollInput(id);
  const updateInput = useUpdatePayrollInput(id);
  const [editingInputId, setEditingInputId] = useState<string | null>(null);
  const [adjustmentError, setAdjustmentError] = useState('');
  const [cashRegisterId, setCashRegisterId] = useState('');
  const [bankAccountId, setBankAccountId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank'>('cash');
  const activeConcepts = concepts.filter((concept) => concept.isActive);
  const eligibleEmployees = employees;

  const adjustmentForm = useForm({
    defaultValues: {
      relationshipId: '',
      conceptId: '',
      amount: undefined,
      description: '',
    } as PayrollAdjustmentValues,
    validators: { onSubmit: payrollAdjustmentSchema },
    onSubmit: async ({ value }) => {
      setAdjustmentError('');
      try {
        if (editingInputId) {
          await updateInput.mutateAsync({
            id: editingInputId,
            amount: value.amount ?? 0,
            description: value.description.trim(),
          });
        } else {
          await addInput.mutateAsync({
            relationshipId: value.relationshipId,
            conceptId: value.conceptId,
            amount: value.amount ?? 0,
            description: value.description.trim() || undefined,
          });
        }
        adjustmentForm.setFieldValue('amount', undefined);
        adjustmentForm.setFieldValue('description', '');
        setEditingInputId(null);
      } catch (error) {
        const result = applyServerErrors(adjustmentForm, error);
        setAdjustmentError(resolveServerErrorMessage(result, 'No se pudo guardar el ajuste.'));
      }
    },
  });


  if (loadingPeriod) {
    return <div className="flex h-full items-center justify-center text-text-secondary">{t('common.loading')}</div>;
  }

  if (periodError || !period) {
    return <div role="alert" className="p-6 text-sm text-error">{t('common.notFound')}</div>;
  }

  const actionFailed = genPayslips.isError || payPeriod.isError || closePeriod.isError ||
    addInput.isError || updateInput.isError || downloadReceipt.isError;
  const currencyTotals = payslips.reduce((totals, payslip) => {
    totals.set(payslip.currency, (totals.get(payslip.currency) ?? 0) + payslip.netPay);
    return totals;
  }, new Map<string, number>());
  const currencyLabel = (currency: string, value: number) =>
    `${currency} ${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/employees/process')}
            aria-label={t('payroll.backToPeriods')}
            className="rounded p-1 text-text-secondary hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
          <h1 className="text-lg font-bold text-text-primary">{t('payroll.detail')}</h1>
          <span className={`rounded px-2 py-1 text-[10px] font-medium ${STATUS_COLORS[period.status] || ''}`}>
            {t(`payroll.statuses.${period.status}`)}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {period.status === 'OPEN' && (
            <button
              type="button"
              onClick={() => {
                if (confirm(t('payroll.confirmGenerate'))) genPayslips.mutate(period.id);
              }}
              disabled={genPayslips.isPending || inputsError}
              className="rounded-lg bg-accent px-4 py-2 text-xs font-medium text-white hover:bg-accent/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50"
            >
              {genPayslips.isPending ? t('common.loading') : t('payroll.generate')}
            </button>
          )}
          {period.status === 'LOCKED' && (
            <>
              <label className="sr-only" htmlFor="payroll-payment-method">{t('payroll.paymentMethod')}</label>
              <select
                id="payroll-payment-method"
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value as typeof paymentMethod)}
                className={fieldClass}
              >
                <option value="cash">{t('payroll.paymentMethods.cash')}</option>
                <option value="bank">{t('payroll.paymentMethods.bank')}</option>
              </select>
              {paymentMethod === 'cash' ? (
                <>
                  <label className="sr-only" htmlFor="payroll-cash-register">{t('payroll.cashRegister')}</label>
                  <select
                    id="payroll-cash-register"
                    value={cashRegisterId}
                    onChange={(event) => setCashRegisterId(event.target.value)}
                    className={fieldClass}
                    disabled={registersError}
                  >
                    <option value="">{t('payroll.selectCashRegister')}</option>
                    {registers.map((register) => (
                      <option key={register.id} value={register.id}>{register.name} · {register.currency}</option>
                    ))}
                  </select>
                </>
              ) : (
                <>
                  <label className="sr-only" htmlFor="payroll-bank-account">{t('payroll.bankAccount')}</label>
                  <select
                    id="payroll-bank-account"
                    value={bankAccountId}
                    onChange={(event) => setBankAccountId(event.target.value)}
                    className={fieldClass}
                    disabled={bankAccountsError}
                  >
                    <option value="">{t('payroll.selectBankAccount')}</option>
                    {bankAccounts.filter((account) => account.isActive).map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.bankName} · {account.accountNumber} · {account.currency}
                      </option>
                    ))}
                  </select>
                </>
              )}
              <button
                type="button"
                onClick={() => {
                  const destinationSelected = paymentMethod === 'cash' ? cashRegisterId : bankAccountId;
                  if (destinationSelected && confirm(t('payroll.confirmPay'))) {
                    if (paymentMethod === 'cash') {
                      payPeriod.mutate({ id: period.id, method: 'cash', cashRegisterId });
                    } else {
                      payPeriod.mutate({ id: period.id, method: 'bank', bankAccountId });
                    }
                  }
                }}
                disabled={
                  (paymentMethod === 'cash' ? !cashRegisterId : !bankAccountId) ||
                  (paymentMethod === 'cash' ? registersError : bankAccountsError) ||
                  payPeriod.isPending
                }
                className="rounded-lg bg-emerald-500/10 px-4 py-2 text-xs font-medium text-emerald-500 hover:bg-emerald-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:opacity-50"
              >
                {payPeriod.isPending ? t('common.loading') : t('payroll.pay')}
              </button>
            </>
          )}
          {period.status === 'PAID' && (
            <button
              type="button"
              onClick={() => {
                if (confirm(t('payroll.confirmClose'))) closePeriod.mutate(period.id);
              }}
              disabled={closePeriod.isPending}
              className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-text-secondary hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50"
            >
              {closePeriod.isPending ? t('common.loading') : t('payroll.close')}
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 space-y-6 overflow-auto p-6">
        {actionFailed && (
          <p role="alert" className="rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-xs text-error">
            {t('payroll.actionError')}
          </p>
        )}
        {registersError && period.status === 'LOCKED' && paymentMethod === 'cash' && (
          <p role="alert" className="text-xs text-error">{t('payroll.cashRegisterLoadError')}</p>
        )}
        {bankAccountsError && period.status === 'LOCKED' && paymentMethod === 'bank' && (
          <p role="alert" className="text-xs text-error">{t('payroll.bankAccountLoadError')}</p>
        )}
        {!registersError && registers.length === 0 && period.status === 'LOCKED' && paymentMethod === 'cash' && (
          <p role="status" className="text-xs text-text-secondary">{t('payroll.noCashRegisters')}</p>
        )}
        {period.status === 'LOCKED' && registers.length > 0 && (
          paymentMethod === 'cash' && (
            <p className="text-xs text-text-secondary">{t('payroll.cashSessionRequired')}</p>
          )
        )}
        {!bankAccountsError && bankAccounts.filter((account) => account.isActive).length === 0 &&
          period.status === 'LOCKED' && paymentMethod === 'bank' && (
            <p role="status" className="text-xs text-text-secondary">{t('payroll.noBankAccounts')}</p>
        )}

        <section className="grid gap-4 border-b border-border pb-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <span className="text-xs font-medium text-text-secondary">{t('payroll.period')}</span>
            <p className="mt-1 flex items-center gap-2 text-sm text-text-primary">
              <CalendarDays size={16} className="text-accent" aria-hidden="true" />
              {new Date(period.startDate).toLocaleDateString()} – {new Date(period.endDate).toLocaleDateString()}
            </p>
          </div>
          <div>
            <span className="text-xs font-medium text-text-secondary">{t('payroll.frequency')}</span>
            <p className="mt-1 text-sm text-text-primary">{t(`payroll.frequencies.${period.frequency}`)}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-text-secondary">{t('payroll.payslipCount')}</span>
            <p className="mt-1 text-sm text-text-primary">{payslips.length}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-text-secondary">{t('payroll.notes')}</span>
            <p className="mt-1 text-sm text-text-primary">{period.notes || '—'}</p>
          </div>
        </section>

        {period.status === 'OPEN' && (
          <section className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-text-primary">{t('payroll.addAdjustments')}</h2>
              <p className="mt-1 text-xs text-text-secondary">{t('payroll.adjustmentsHelp')}</p>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void adjustmentForm.handleSubmit();
              }}
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
            >
              <FormSelect
                form={adjustmentForm}
                name="relationshipId"
                label={t('payroll.employee')}
                placeholder={t('payroll.selectEmployee')}
                required
                options={eligibleEmployees.map((employee) => ({
                  value: employee.relationshipId,
                  label: employee.employeeName,
                }))}
              />
              <FormSelect
                form={adjustmentForm}
                name="conceptId"
                label={t('payroll.conceptName')}
                placeholder={t('payroll.selectConcept')}
                required
                options={activeConcepts.map((concept) => ({
                  value: concept.id,
                  label: `${concept.name} · ${t(`payroll.${concept.type === 'EARNING' ? 'earning' : 'deduction'}`)}`,
                }))}
              />
              <FormInput
                form={adjustmentForm}
                name="amount"
                label={t('payroll.amount')}
                type="number"
                min="0.01"
                step="0.01"
                required
              />
              <FormInput
                form={adjustmentForm}
                name="description"
                label={t('payroll.description')}
                maxLength={240}
              />
              <button
                type="submit"
                disabled={
                  addInput.isPending ||
                  updateInput.isPending ||
                  (editingInputId ? false : !eligibleEmployees.length || !activeConcepts.length)
                }
                className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-text-primary hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50 sm:col-span-2 lg:col-span-4 lg:justify-self-start"
              >
                {addInput.isPending || updateInput.isPending
                  ? t('common.loading')
                  : t(editingInputId ? 'payroll.saveAdjustment' : 'payroll.addAdjustment')}
              </button>
              {editingInputId && (
                <button
                  type="button"
                  onClick={() => {
                    adjustmentForm.setFieldValue('amount', undefined);
                    adjustmentForm.setFieldValue('description', '');
                    setEditingInputId(null);
                  }}
                  className="rounded-lg border border-border px-4 py-2 text-xs text-text-secondary hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent lg:col-start-2 lg:justify-self-start"
                >
                  {t('common.cancel')}
                </button>
              )}
            </form>

            {adjustmentError && <p role="alert" className="text-xs text-error">{adjustmentError}</p>}
            {inputsError && <p role="alert" className="text-xs text-error">{t('payroll.loadError')}</p>}
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[560px] text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-surface/60 text-text-secondary">
                    <th className="px-4 py-3">{t('payroll.employee')}</th>
                    <th className="px-4 py-3">{t('payroll.conceptName')}</th>
                    <th className="px-4 py-3">{t('payroll.description')}</th>
                    <th className="px-4 py-3 text-right">{t('payroll.amount')}</th>
                    <th className="px-4 py-3 text-right">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {inputs.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-6 text-center text-text-secondary">{t('payroll.noAdjustments')}</td></tr>
                  ) : inputs.map((input) => (
                    <tr key={input.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 text-text-primary">
                        {employees.find((employee) => employee.relationshipId === input.relationshipId)?.employeeName ?? input.relationshipId}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{input.concept?.name ?? input.conceptId}</td>
                      <td className="px-4 py-3 text-text-secondary">{input.description || '—'}</td>
                      <td className="px-4 py-3 text-right font-mono text-text-primary">
                        {currencyLabel(input.concept?.currency ?? '', input.amount)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          aria-label={`${t('payroll.editAdjustment')}: ${input.description || input.concept?.name || ''}`}
                          onClick={() => {
                            if (editingInputId === input.id) {
                              adjustmentForm.setFieldValue('amount', undefined);
                              adjustmentForm.setFieldValue('description', '');
                              setEditingInputId(null);
                              return;
                            }
                            setEditingInputId(input.id);
                            adjustmentForm.reset(
                              {
                                relationshipId: input.relationshipId,
                                conceptId: input.conceptId,
                                amount: input.amount,
                                description: input.description || '',
                              },
                              { keepDefaultValues: true },
                            );
                          }}
                          className="rounded p-1 text-text-secondary hover:bg-surface-hover hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                        >
                          {editingInputId === input.id
                            ? <X size={14} aria-hidden="true" />
                            : <Pencil size={14} aria-hidden="true" />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-text-primary">{t('payroll.payslips')}</h2>
              <p className="mt-1 text-xs text-text-secondary">{t('payroll.previewDescription')}</p>
            </div>
            <div className="flex flex-wrap gap-4">
              {Array.from(currencyTotals, ([currency, total]) => (
                <p key={currency} className="text-xs text-text-secondary">
                  {t('payroll.netTotal')}: <span className="font-mono font-medium text-text-primary">{currencyLabel(currency, total)}</span>
                </p>
              ))}
            </div>
          </div>

          {loadingPayslips ? (
            <div className="py-8 text-center text-text-secondary">{t('common.loading')}</div>
          ) : payslipsError ? (
            <p role="alert" className="text-xs text-error">{t('payroll.loadError')}</p>
          ) : payslips.length === 0 ? (
            <div className="py-8 text-center text-sm text-text-secondary">{t('payroll.noPayslips')}</div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[900px] text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-surface/60 text-text-secondary">
                    <th className="px-4 py-3">{t('payroll.employee')}</th>
                    <th className="px-4 py-3">{t('payroll.position')}</th>
                    <th className="px-4 py-3 text-right">{t('payroll.baseSalary')}</th>
                    <th className="px-4 py-3 text-right">{t('payroll.earnings')}</th>
                    <th className="px-4 py-3 text-right">{t('payroll.deductions')}</th>
                    <th className="px-4 py-3 text-right">{t('payroll.netPay')}</th>
                    <th className="px-4 py-3">{t('payroll.details')}</th>
                    <th className="px-4 py-3">{t('payroll.receipt')}</th>
                  </tr>
                </thead>
                <tbody>
                  {payslips.map((payslip) => (
                    <tr key={payslip.id} className="border-b border-border last:border-0 align-top">
                      <td className="px-4 py-3 text-text-primary">
                        <div>{payslip.employeeName}</div>
                        <div className="mt-1 text-[10px] text-text-muted">{payslip.departmentName || '—'}</div>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{payslip.positionName || '—'}</td>
                      <td className="px-4 py-3 text-right font-mono text-text-secondary">{currencyLabel(payslip.currency, payslip.baseEarnings)}</td>
                      <td className="px-4 py-3 text-right font-mono text-text-secondary">{currencyLabel(payslip.currency, payslip.otherEarnings)}</td>
                      <td className="px-4 py-3 text-right font-mono text-text-secondary">{currencyLabel(payslip.currency, payslip.totalDeductions)}</td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-text-primary">{currencyLabel(payslip.currency, payslip.netPay)}</td>
                      <td className="px-4 py-3">
                        <details className="group">
                          <summary className="cursor-pointer text-accent underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
                            {t('payroll.viewLines')}
                          </summary>
                          <ul className="mt-2 min-w-56 space-y-1 text-[10px] text-text-secondary">
                            {(payslip.lines ?? []).map((line) => (
                              <li key={line.id} className="flex justify-between gap-4">
                                <span>{line.description}</span>
                                <span className="shrink-0 font-mono">{line.type === 'DEDUCTION' ? '−' : ''}{currencyLabel(line.currency, line.amount)}</span>
                              </li>
                            ))}
                          </ul>
                        </details>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          aria-label={`${t('payroll.downloadReceipt')}: ${payslip.employeeName}`}
                          onClick={() => downloadReceipt.mutate(payslip.id)}
                          disabled={downloadReceipt.isPending}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-text-secondary hover:bg-surface-hover hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50"
                        >
                          <FileDown size={14} aria-hidden="true" />
                          {downloadReceipt.isPending && downloadReceipt.variables === payslip.id
                            ? t('common.loading')
                            : t('payroll.downloadReceipt')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
