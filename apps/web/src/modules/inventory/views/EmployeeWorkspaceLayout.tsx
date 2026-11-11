import { NavLink, Outlet } from 'react-router-dom';
import { Building2, Calculator, Clock3, HandCoins, Play, Users } from 'lucide-react';
import { useTranslation } from '@/shared/hooks/useTranslation';

const sections = [
  { to: '/employees', key: 'hr.employees', icon: Users, end: true },
  { to: '/employees/departments', key: 'hr.departments', icon: Building2 },
  { to: '/employees/concepts', key: 'payroll.tabs.concepts', icon: Calculator },
  { to: '/employees/process', key: 'payroll.tabs.process', icon: Play },
  { to: '/employees/history', key: 'payroll.tabs.history', icon: Clock3 },
  { to: '/employees/loans', key: 'payroll.tabs.loans', icon: HandCoins },
];

export function EmployeeWorkspaceLayout() {
  const { t } = useTranslation();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-border px-6 pt-4">
        <h1 className="text-lg font-bold text-text-primary">{t('hr.workspaceTitle')}</h1>
        <p className="mt-1 text-xs text-text-secondary">{t('hr.workspaceDescription')}</p>
        <nav
          aria-label={t('hr.sections')}
          className="mt-4 flex gap-1 overflow-x-auto"
        >
          {sections.map(({ to, key, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent ${
                  isActive
                    ? 'border-accent text-text-primary'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`
              }
            >
              <Icon size={14} aria-hidden="true" />
              {t(key)}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
