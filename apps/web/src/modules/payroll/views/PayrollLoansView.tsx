import { useState, type FormEvent } from 'react';
import { HandCoins } from 'lucide-react';
import { useTranslation } from '@/shared/hooks/useTranslation';
import {
  useCreateEmployeeLoan,
  useEmployeeLoans,
  usePayrollEmployees,
} from '../hooks/usePayrolls';

const fieldClass = 'w-full rounded-lg border border-border bg-canvas px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none';

export function PayrollLoansView() {
  const { t } = useTranslation();
  const employeesQuery = usePayrollEmployees();
  const loansQuery = useEmployeeLoans();
  const createLoan = useCreateEmployeeLoan();
  const [relationshipId, setRelationshipId] = useState('');
  const [principal, setPrincipal] = useState('');
  const [installmentCount, setInstallmentCount] = useState('1');
  const [currency, setCurrency] = useState('VED');
  const [reason, setReason] = useState('');
  const employees = employeesQuery.data ?? [];
  const loans = loansQuery.data ?? [];
  const employeeNames = new Map(employees.map((employee) => [employee.relationshipId, employee.employeeName]));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createLoan.mutate({
      relationshipId,
      principal: Number(principal),
      installmentCount: Number(installmentCount),
      currency: currency.trim().toUpperCase(),
      reason: reason.trim(),
    }, {
      onSuccess: () => {
        setPrincipal('');
        setInstallmentCount('1');
        setReason('');
      },
    });
  };

  if (employeesQuery.isLoading || loansQuery.isLoading) {
    return <div className="p-6 text-sm text-text-secondary">{t('common.loading')}</div>;
  }

  if (employeesQuery.isError || loansQuery.isError) {
    return <p role="alert" className="p-6 text-sm text-error">{t('payroll.loadError')}</p>;
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-text-primary">
            <HandCoins size={18} className="text-accent" aria-hidden="true" />
            {t('payroll.loansTitle')}
          </h2>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-text-secondary">{t('payroll.loansDescription')}</p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-3 border-b border-border pb-6 sm:grid-cols-2 lg:grid-cols-5">
          <label className="space-y-1 lg:col-span-2">
            <span className="text-xs font-medium text-text-secondary">{t('payroll.employee')}</span>
            <select
              required
              value={relationshipId}
              onChange={(event) => {
                const selected = employees.find((employee) => employee.relationshipId === event.target.value);
                setRelationshipId(event.target.value);
                if (selected) setCurrency(selected.currency);
              }}
              className={fieldClass}
            >
              <option value="">{t('payroll.selectEmployee')}</option>
              {employees.map((employee) => (
                <option key={employee.relationshipId} value={employee.relationshipId}>{employee.employeeName}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-text-secondary">{t('payroll.amount')}</span>
            <input required type="number" min="0.01" step="0.01" value={principal} onChange={(event) => setPrincipal(event.target.value)} className={fieldClass} />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-text-secondary">{t('payroll.installments')}</span>
            <input required type="number" min="1" max="1000" step="1" value={installmentCount} onChange={(event) => setInstallmentCount(event.target.value)} className={fieldClass} />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-text-secondary">{t('payroll.currency')}</span>
            <input required minLength={3} maxLength={3} value={currency} onChange={(event) => setCurrency(event.target.value.toUpperCase())} className={fieldClass} />
          </label>
          <label className="space-y-1 sm:col-span-2 lg:col-span-4">
            <span className="text-xs font-medium text-text-secondary">{t('payroll.reason')}</span>
            <input required maxLength={240} value={reason} onChange={(event) => setReason(event.target.value)} className={fieldClass} />
          </label>
          <button
            type="submit"
            disabled={!employees.length || createLoan.isPending}
            className="self-end rounded-lg bg-accent px-4 py-2 text-xs font-medium text-white hover:bg-accent/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50"
          >
            {createLoan.isPending ? t('common.loading') : t('payroll.registerLoan')}
          </button>
        </form>

        {createLoan.isError && <p role="alert" className="text-xs text-error">{t('payroll.saveError')}</p>}

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-surface/60 text-text-secondary">
                <th className="px-4 py-3">{t('payroll.employee')}</th>
                <th className="px-4 py-3 text-right">{t('payroll.principal')}</th>
                <th className="px-4 py-3 text-right">{t('payroll.installment')}</th>
                <th className="px-4 py-3">{t('payroll.installmentsPaid')}</th>
                <th className="px-4 py-3 text-right">{t('payroll.balance')}</th>
                <th className="px-4 py-3">{t('payroll.reason')}</th>
                <th className="px-4 py-3">{t('payroll.status')}</th>
              </tr>
            </thead>
            <tbody>
              {loans.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-text-secondary">{t('payroll.noLoans')}</td></tr>
              ) : loans.map((loan) => (
                <tr key={loan.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-text-primary">{employeeNames.get(loan.relationshipId) ?? loan.relationshipId}</td>
                  <td className="px-4 py-3 text-right font-mono text-text-primary">{loan.currency} {loan.principal.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-mono text-text-secondary">{loan.currency} {loan.installmentAmount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-text-secondary">{loan.paidInstallments} / {loan.installmentCount}</td>
                  <td className="px-4 py-3 text-right font-mono text-text-primary">{loan.currency} {loan.outstandingBalance.toLocaleString()}</td>
                  <td className="max-w-64 truncate px-4 py-3 text-text-secondary" title={loan.reason}>{loan.reason}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-1 text-[10px] ${loan.isActive ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                      {loan.isActive ? t('payroll.active') : t('payroll.settled')}
                    </span>
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
