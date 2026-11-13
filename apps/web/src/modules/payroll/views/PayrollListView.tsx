import { useState } from 'react';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Plus, RotateCw } from 'lucide-react';
import { ListPagination } from '@/core/components/ListPagination';
import { usePagination } from '@/shared/hooks/usePagination';
import {
  usePayrolls,
  useCreatePeriod,
  usePayrollEmployees,
  type PayrollPeriod,
} from '../hooks/usePayrolls';

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-amber-500/10 text-amber-500',
  CALCULATING: 'bg-blue-500/10 text-blue-500',
  LOCKED: 'bg-purple-500/10 text-purple-500',
  PAID: 'bg-emerald-500/10 text-emerald-500',
  CLOSED: 'bg-gray-500/10 text-gray-400',
};

export function PayrollListView({ mode = 'process' }: { mode?: 'process' | 'history' }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: periods = [], isLoading, isError, refetch, isFetching } = usePayrolls();
  const employeesQuery = usePayrollEmployees();
  const employees = employeesQuery.data ?? [];
  const createPeriod = useCreatePeriod();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [frequency, setFrequency] = useState<PayrollPeriod['frequency']>('MONTHLY');
  const [showCreate, setShowCreate] = useState(false);

  const visiblePeriods = periods.filter((period) =>
    mode === 'history'
      ? period.status === 'PAID' || period.status === 'CLOSED'
      : period.status !== 'PAID' && period.status !== 'CLOSED',
  );
  const pagination = usePagination(visiblePeriods);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-text-secondary">
        {t('common.loading')}
      </div>
    );
  }

  if (isError) {
    return (
      <div role="alert" className="p-6 text-sm text-error">
        {t('payroll.loadError')}
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="ml-2 underline underline-offset-2 disabled:opacity-50"
        >
          {t('payroll.retry')}
        </button>
      </div>
    );
  }

  const activeEmployeeCount = employees.length;
  const reviewPeriodCount = periods.filter(
    (period) =>
      period.status === 'OPEN' || period.status === 'CALCULATING' || period.status === 'LOCKED',
  ).length;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <h2 className="text-lg font-bold text-text-primary">
          {mode === 'history' ? t('payroll.historyTitle') : t('payroll.processTitle')}
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
            aria-label={t('common.refresh')}
            title={t('common.refresh')}
            className="rounded-lg border border-border p-1.5 text-text-secondary transition-colors hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCw size={14} aria-hidden="true" className={isFetching ? 'animate-spin' : ''} />
          </button>
          {mode === 'process' && (
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="rounded-lg bg-accent px-4 py-1.5 text-xs font-medium text-white hover:bg-accent/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <Plus size={14} className="inline mr-1" />
              {t('payroll.createPeriod')}
            </button>
          )}
        </div>
      </div>

      {mode === 'process' && (
        <dl className="grid shrink-0 grid-cols-2 divide-x divide-border border-b border-border bg-surface/40 px-6 py-3 sm:grid-cols-3">
          <div className="pr-4">
            <dt className="text-[11px] text-text-secondary">{t('payroll.activeEmployees')}</dt>
            <dd className="mt-1 font-mono text-sm text-text-primary">
              {employeesQuery.isError ? t('payroll.employeeCountUnavailable') : activeEmployeeCount}
            </dd>
          </div>
          <div className="px-4">
            <dt className="text-[11px] text-text-secondary">{t('payroll.periodsToReview')}</dt>
            <dd className="mt-1 font-mono text-sm text-text-primary">{reviewPeriodCount}</dd>
          </div>
          <div className="hidden pl-4 sm:block">
            <dt className="text-[11px] text-text-secondary">{t('payroll.calculationScope')}</dt>
            <dd className="mt-1 text-xs text-text-primary">{t('payroll.calculationAvailable')}</dd>
          </div>
        </dl>
      )}

      {mode === 'process' && showCreate && (
        <div className="border-b border-border bg-surface/50 px-6 py-4">
          <div className="grid max-w-4xl grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]">
            <div className="space-y-1 flex-1">
              <label
                htmlFor="payroll-start-date"
                className="text-xs font-medium text-text-secondary"
              >
                {t('payroll.startDate')}
              </label>
              <input
                id="payroll-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-border bg-canvas px-3 py-1.5 text-xs text-text-primary focus:border-accent focus:outline-none"
              />
            </div>
            <div className="space-y-1 flex-1">
              <label htmlFor="payroll-end-date" className="text-xs font-medium text-text-secondary">
                {t('payroll.endDate')}
              </label>
              <input
                id="payroll-end-date"
                type="date"
                min={startDate || undefined}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-border bg-canvas px-3 py-1.5 text-xs text-text-primary focus:border-accent focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="payroll-frequency"
                className="text-xs font-medium text-text-secondary"
              >
                {t('payroll.frequency')}
              </label>
              <select
                id="payroll-frequency"
                value={frequency}
                onChange={(event) => setFrequency(event.target.value as PayrollPeriod['frequency'])}
                className="w-full rounded-lg border border-border bg-canvas px-3 py-1.5 text-xs text-text-primary focus:border-accent focus:outline-none"
              >
                {(['WEEKLY', 'BIWEEKLY', 'SEMI_MONTHLY', 'MONTHLY', 'CUSTOM'] as const).map(
                  (value) => (
                    <option key={value} value={value}>
                      {t(`payroll.frequencies.${value}`)}
                    </option>
                  ),
                )}
              </select>
            </div>
            <button
              disabled={!startDate || !endDate || createPeriod.isPending}
              onClick={() => {
                if (!startDate || !endDate || endDate < startDate) return;
                createPeriod.mutate(
                  { startDate, endDate, frequency },
                  {
                    onSuccess: () => {
                      setStartDate('');
                      setEndDate('');
                      setFrequency('MONTHLY');
                      setShowCreate(false);
                    },
                  },
                );
              }}
              className="rounded-lg bg-accent px-4 py-1.5 text-xs font-medium text-white hover:bg-accent/90 disabled:opacity-50"
            >
              {t('common.save')}
            </button>
          </div>
          {createPeriod.isError && (
            <p role="alert" className="mt-3 text-xs text-error">
              {t('payroll.createPeriodError')}
            </p>
          )}
        </div>
      )}

      <div className="flex-1 overflow-auto p-6">
        <div className="rounded-xl border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-semibold text-text-secondary">
                <th className="px-4 py-3">{t('payroll.period')}</th>
                <th className="px-4 py-3">{t('payroll.status')}</th>
                <th className="px-4 py-3">{t('payroll.notes')}</th>
                <th className="px-4 py-3 text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {pagination.total === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-text-secondary">
                    {mode === 'history' ? t('payroll.noHistory') : t('payroll.noPeriods')}
                  </td>
                </tr>
              ) : (
                pagination.pageItems.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-border last:border-b-0 hover:bg-bg/50 cursor-pointer"
                    onClick={() => navigate(`/employees/process/${p.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <CalendarDays size={16} className="text-accent shrink-0" />
                        <span className="text-text-primary">
                          {new Date(p.startDate).toLocaleDateString()} -{' '}
                          {new Date(p.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[p.status] || ''}`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-secondary truncate max-w-[200px]">
                      {p.notes || '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div
                        className="flex items-center justify-end gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {p.status !== 'CLOSED' && (
                          <button
                            onClick={() => navigate(`/employees/process/${p.id}`)}
                            className="rounded-lg border border-border px-2.5 py-1 text-[10px] font-medium text-text-secondary hover:bg-surface-hover disabled:opacity-50"
                          >
                            {t('payroll.review')}
                          </button>
                        )}
                        {p.status === 'CLOSED' && (
                          <span className="text-[10px] text-text-muted italic">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-3">
          <ListPagination
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            totalPages={pagination.totalPages}
            onPageChange={pagination.setPage}
            onPageSizeChange={pagination.setPageSize}
          />
        </div>
      </div>
    </div>
  );
}
