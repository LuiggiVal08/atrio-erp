import { useState } from 'react';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { useParams, Link } from 'react-router-dom';
import { useSalaryHistory, useCreateSalaryEntry } from '../hooks/useSalaryHistory';
import { VirtualGrid, type GridColumn } from '@/core/components/VirtualGrid';
import type { SalaryEntry } from '../hooks/useSalaryHistory';

export function EmployeeDetailView() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data: salaryHistory = [], isLoading } = useSalaryHistory(id!);
  const createEntry = useCreateSalaryEntry();

  const [salary, setSalary] = useState('');
  const [currency, setCurrency] = useState('VES');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  const handleAdd = () => {
    if (!salary || !effectiveDate) return;
    createEntry.mutate({
      employeeId: id!,
      salary: Number(salary),
      currency,
      effectiveDate,
      notes: notes.trim() || undefined,
    });
    setSalary('');
    setNotes('');
  };

  const columns: GridColumn<SalaryEntry>[] = [
    { key: 'salary', label: t('hr.salary.amount'), width: 120, align: 'right' },
    { key: 'currency', label: t('hr.salary.currency'), width: 80 },
    { key: 'effectiveDate', label: t('hr.salary.effectiveDate'), width: 140, sortable: true },
    { key: 'notes', label: t('common.notes') },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Link to="/inventory/employees" className="text-sm text-accent hover:underline">&larr; {t('hr.employee.back')}</Link>
        <h1 className="text-lg font-bold text-text-primary">{t('hr.salary.title')}</h1>
      </div>

      <div className="rounded-lg border border-border bg-surface p-6">
        <h2 className="mb-4 text-sm font-bold text-text-primary">{t('hr.salary.create')}</h2>
        <div className="grid grid-cols-4 gap-3">
          <input
            type="number"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            placeholder={t('hr.salary.amount')}
            className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
          />
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
          >
            <option value="VES">VES</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
          <input
            type="date"
            value={effectiveDate}
            onChange={(e) => setEffectiveDate(e.target.value)}
            className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
          />
          <button
            onClick={handleAdd}
            disabled={createEntry.isPending}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50"
          >
            {t('common.create')}
          </button>
        </div>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('common.notes')}
          className="mt-3 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-text-secondary">{t('common.loading')}</div>
      ) : (
        <VirtualGrid columns={columns} data={salaryHistory} loading={isLoading} emptyMessage={t('common.noResults')} />
      )}
    </div>
  );
}
