import { useSidebarStore } from '@/core/store/sidebar-store';
import { useAuthStore } from '@/core/auth/store';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { NavLink } from 'react-router-dom';

export function Sidebar() {
  const { isCollapsed, modules, activeModule, toggleCollapse, setActiveModule } = useSidebarStore();
  const { user } = useAuthStore();
  const { t } = useTranslation();

  const filteredModules = user?.enabledModules
    ? modules.filter((mod) => user.enabledModules?.includes(mod.id))
    : modules;

  return (
    <aside
      className={`flex flex-col border-r border-border bg-surface transition-all duration-200 ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      <div className="flex h-14 items-center justify-between border-b border-border px-4">
        {!isCollapsed && (
          <span className="text-sm font-bold tracking-tight text-text-primary">Atrio</span>
        )}
        <button
          onClick={toggleCollapse}
          className="rounded-md p-1.5 text-text-secondary hover:bg-surface-hover"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {filteredModules.length === 0 && !isCollapsed && (
          <p className="px-3 py-8 text-center text-xs text-text-secondary">
            {t('common.noResults')}
          </p>
        )}
        {filteredModules.map((mod) => {
          const Icon = mod.icon;
          const isActive = activeModule === mod.id;
          return (
            <NavLink
              key={mod.id}
              to={mod.route}
              onClick={() => setActiveModule(mod.id)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? 'bg-accent/10 text-accent'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
              }`}
            >
              <Icon size={18} className="shrink-0" />
              {!isCollapsed && (
                <>
                  <span className="flex-1 truncate">{t(`sidebar.${mod.id}.label`)}</span>
                  {mod.badge !== undefined && mod.badge > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-white">
                      {mod.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
