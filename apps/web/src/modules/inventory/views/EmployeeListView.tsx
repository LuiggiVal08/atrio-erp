import { useTranslation } from '@/shared/hooks/useTranslation';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { useEmployees, useDeleteEmployee } from '../hooks/useEmployees';
import { useTenantStore } from '@/core/tenant/store';

export function EmployeeListView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const tenantId = useTenantStore.getState().activeTenantId;
  const { data: employees = [], isLoading } = useEmployees();
  const deleteEmployee = useDeleteEmployee();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-text-secondary">
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <h1 className="text-lg font-bold text-text-primary">{t('hr.employees')}</h1>
        <button
          onClick={() => navigate('/employees/new')}
          className="rounded-lg bg-accent px-4 py-1.5 text-xs font-medium text-white hover:bg-accent/90"
        >
          <Plus size={14} className="inline mr-1" />
          {t('hr.employee.create')}
        </button>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div className="rounded-xl border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-semibold text-text-secondary">
                <th className="px-4 py-3">{t('hr.employee.name')}</th>
                <th className="px-4 py-3">{t('hr.employee.identityDoc')}</th>
                <th className="px-4 py-3">{t('hr.employee.department')}</th>
                <th className="px-4 py-3">{t('hr.employee.position')}</th>
                <th className="px-4 py-3">{t('hr.employee.baseSalary')}</th>
                <th className="px-4 py-3">{t('hr.employee.status')}</th>
                <th className="px-4 py-3 text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-text-secondary">
                    {t('hr.employee.empty')}
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr
                    key={emp.id}
                    className="border-b border-border last:border-b-0 hover:bg-bg/50 cursor-pointer"
                    onClick={() => navigate(`/employees/${emp.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                          {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                        </div>
                        <span className="text-text-primary">{emp.firstName} {emp.lastName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{emp.identityDoc}</td>
                    <td className="px-4 py-3 text-text-secondary">{emp.department}</td>
                    <td className="px-4 py-3 text-text-secondary">{emp.position}</td>
                    <td className="px-4 py-3 font-mono text-text-primary">
                      ${Number(emp.baseSalary).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${emp.status === 'active' ? 'text-emerald-500' : 'text-text-secondary'}`}>
                        {emp.status === 'active' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          if (confirm(t('hr.employee.confirmDelete'))) {
                            deleteEmployee.mutate({ tenantId: tenantId!, id: emp.id });
                          }
                        }}
                        disabled={deleteEmployee.isPending}
                        className="rounded p-1 text-red-500 hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
