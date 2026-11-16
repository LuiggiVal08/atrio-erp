import { useTranslation } from '@/shared/hooks/useTranslation';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, CalendarDays, BadgeCheck } from 'lucide-react';
import { useEmployee } from '../hooks/useEmployees';
import { ModuleSkeleton } from '@/core/components/ModuleSkeleton';

export function EmployeeDetailView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: employee, isLoading } = useEmployee(id!);

  if (isLoading) {
    return <ModuleSkeleton moduleName={t('hr.employees')} />;
  }

  if (!employee) {
    return (
      <div className="flex h-full items-center justify-center text-text-secondary">
        {t('common.notFound')}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/employees')}
            className="rounded p-1 text-text-secondary hover:bg-surface-hover"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-lg font-bold text-text-primary">
            {employee.firstName} {employee.lastName}
          </h1>
          <span className={`rounded px-2 py-0.5 text-[10px] font-medium ${
            employee.status === 'active'
              ? 'bg-emerald-500/10 text-emerald-500'
              : 'bg-gray-500/10 text-gray-400'
          }`}>
            {employee.status === 'active' ? 'Activo' : 'Inactivo'}
          </span>
        </div>
        <Link
          to={`/employees/${employee.id}/edit`}
          className="rounded-lg bg-accent px-4 py-1.5 text-xs font-medium text-white hover:bg-accent/90"
        >
          {t('common.edit')}
        </Link>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Personal Info */}
          <div className="space-y-4 rounded-xl border border-border bg-surface p-6">
            <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <BadgeCheck size={16} className="text-accent" />
              Información Personal
            </h2>
            <div className="space-y-3">
              <div>
                <span className="text-xs font-medium text-text-secondary">Nombre Completo</span>
                <p className="mt-0.5 text-sm text-text-primary">
                  {employee.firstName} {employee.middleName ? `${employee.middleName} ` : ''}
                  {employee.lastName} {employee.secondLastName || ''}
                </p>
              </div>
              <div>
                <span className="text-xs font-medium text-text-secondary">Documento de Identidad</span>
                <p className="mt-0.5 text-sm text-text-primary">{employee.identityDoc}</p>
              </div>
              {employee.taxIdentifier && (
                <div>
                  <span className="text-xs font-medium text-text-secondary">{t('hr.employee.taxIdentifier')}</span>
                  <p className="mt-0.5 text-sm text-text-primary">{employee.taxIdentifier}</p>
                </div>
              )}
              {employee.phone && (
                <div>
                  <span className="text-xs font-medium text-text-secondary">{t('hr.employee.phone')}</span>
                  <p className="mt-0.5 text-sm text-text-primary">{employee.phone}</p>
                </div>
              )}
              {employee.email && (
                <div>
                  <span className="text-xs font-medium text-text-secondary">{t('hr.employee.email')}</span>
                  <p className="mt-0.5 text-sm text-text-primary">{employee.email}</p>
                </div>
              )}
              {employee.address && (
                <div>
                  <span className="text-xs font-medium text-text-secondary">{t('hr.employee.address')}</span>
                  <p className="mt-0.5 whitespace-pre-wrap text-sm text-text-primary">{employee.address}</p>
                </div>
              )}
              {(employee.emergencyContactName || employee.emergencyContactPhone) && (
                <div>
                  <span className="text-xs font-medium text-text-secondary">{t('hr.employee.emergencyContact')}</span>
                  <p className="mt-0.5 text-sm text-text-primary">
                    {[employee.emergencyContactName, employee.emergencyContactPhone].filter(Boolean).join(' · ')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Employment Info */}
          <div className="space-y-4 rounded-xl border border-border bg-surface p-6">
            <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <CalendarDays size={16} className="text-accent" />
              Datos Laborales
            </h2>
            <div className="space-y-3">
              <div>
                <span className="text-xs font-medium text-text-secondary">Departamento</span>
                <p className="mt-0.5 text-sm text-text-primary">{employee.department}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-text-secondary">Cargo</span>
                <p className="mt-0.5 text-sm text-text-primary">{employee.position}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-text-secondary">Salario Base</span>
                <p className="mt-0.5 text-sm font-mono text-text-primary">
                  ${Number(employee.baseSalary).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-xs font-medium text-text-secondary">Fecha de Ingreso</span>
                <p className="mt-0.5 text-sm text-text-primary">
                  {new Date(employee.hireDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
