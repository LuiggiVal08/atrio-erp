import { useState, useRef, useEffect } from 'react';
import { useSidebarStore } from '@/core/store/sidebar-store';
import { useAuthStore } from '@/core/auth/store';
import { ChevronLeft, Building2, Search } from 'lucide-react';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { NavLink, useLocation } from 'react-router-dom';
import { Tooltip } from '@heroui/react';

export function Sidebar() {
  const { modules, setActiveModule } = useSidebarStore();
  const isCollapsed = true;
  const { token, user, tenants, switchTenant, fetchTenants } = useAuthStore();
  const { t } = useTranslation();
  const location = useLocation();
  const primaryModuleIds = new Set(['reports', 'pos', 'purchasing', 'inventory', 'clients', 'rbac', 'users']);
  const headerModuleIds = new Set(modules.filter((mod) => primaryModuleIds.has(mod.id)).map((mod) => mod.id));
  const sidebarModules = modules.filter((mod) => !headerModuleIds.has(mod.id));
  const currentModule = sidebarModules.find((mod) =>
    location.pathname === mod.route || location.pathname.startsWith(`${mod.route}/`)
  );
  const [tenantMenuOpen, setTenantMenuOpen] = useState(false);
  const tenantMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) return;
    fetchTenants();
  }, [fetchTenants, token]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (tenantMenuRef.current && !tenantMenuRef.current.contains(e.target as Node)) {
        setTenantMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const moduleLabel = (mod: (typeof modules)[number]) =>
    mod.label.startsWith('sidebar.') ? t(mod.label) : mod.label;
  const filteredModules = sidebarModules;

  const handleSwitchTenant = async (tenantId: string) => {
    try {
      setTenantMenuOpen(false);
      await switchTenant(tenantId);
      window.location.href = '/reports/dashboard';
    } catch {}
  };

  return (
    <aside
      className="z-50 my-auto ml-3 flex max-h-[calc(100vh-24px)] w-[49px] flex-col justify-self-start overflow-hidden rounded-[28px] border border-white/10 bg-overlay/85 shadow-[0_12px_40px_rgba(0,0,0,0.24)] backdrop-blur-xl"
    >
      <nav className="flex flex-col items-center space-y-0.5 overflow-y-auto p-1">
        {isCollapsed ? (
          <>
            <Tooltip delay={0}>
              <Tooltip.Trigger>
                <button
                  onClick={() => window.dispatchEvent(new Event('atrio:open-search'))}
                  className="flex h-10 w-10 items-center justify-center rounded-[14px] text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
                  aria-label={t('common.search')}
                >
                  <Search size={18} />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Content showArrow offset={4} placement="right">
                <Tooltip.Arrow />
                <span className="text-xs">{t('common.search')}</span>
              </Tooltip.Content>
            </Tooltip>
            <div className="mx-1.5 my-1 h-px w-8 bg-white/10" aria-hidden="true" />
          </>
        ) : (
          <button
            onClick={() => window.dispatchEvent(new Event('atrio:open-search'))}
            className="mb-2 flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
          >
            <Search size={18} />
            <span>{t('common.search')}</span>
            <kbd className="ml-auto rounded border border-border px-1.5 text-[10px]">/</kbd>
          </button>
        )}
        {filteredModules.length === 0 && !isCollapsed && (
          <p className="px-3 py-8 text-center text-xs text-text-secondary">
            {t('common.noResults')}
          </p>
        )}
        {filteredModules.map((mod) => {
          const Icon = mod.icon;
          const isActive = currentModule?.id === mod.id || location.pathname.startsWith(mod.route);
          const link = (
            <NavLink
              key={mod.id}
              to={mod.route}
              onClick={() => setActiveModule(mod.id)}
              className={`group relative flex h-10 w-10 items-center justify-center rounded-[14px] text-sm transition-colors ${
                isActive
                  ? 'bg-accent-alpha text-accent'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-sm bg-accent" />
              )}
              <Icon size={18} className="shrink-0" />
              {!isCollapsed && (
                <>
                  <span className="flex-1 truncate">{moduleLabel(mod)}</span>
                  {mod.badge !== undefined && mod.badge > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-white">
                      {mod.badge}
                    </span>
                  )}
                </>
              )}
              {isCollapsed && isActive && (
                <span className="absolute inset-0 rounded-md ring-1 ring-accent/30" />
              )}
            </NavLink>
          );

          if (!isCollapsed) return link;

          return (
            <Tooltip key={mod.id} delay={0}>
              <Tooltip.Trigger>
                {link}
              </Tooltip.Trigger>
              <Tooltip.Content showArrow offset={4} placement="right">
                <Tooltip.Arrow />
                <span className="text-xs">{moduleLabel(mod)}</span>
              </Tooltip.Content>
            </Tooltip>
          );
        })}
      </nav>

      {/* Tenant switcher */}
      <div className="border-t border-border">
        {/* Tenant switcher */}
        {tenants.length > 1 && (
          <div ref={tenantMenuRef} className="relative">
            <button
              onClick={() => setTenantMenuOpen(!tenantMenuOpen)}
              className={`flex h-10 w-full items-center justify-center px-0 text-xs text-text-muted hover:bg-surface-hover hover:text-text-secondary transition-colors ${
                isCollapsed ? 'justify-center' : ''
              }`}
            >
              <Building2 size={14} />
              {!isCollapsed && (
                <>
                  <span className="truncate flex-1 text-left">{tenants.find((t) => t.isHome)?.legalName || user?.tenantId?.slice(0, 8)}</span>
                  <ChevronLeft size={12} className={`transition-transform ${tenantMenuOpen ? '-rotate-90' : ''}`} />
                </>
              )}
            </button>
            {tenantMenuOpen && (
              <div className={`absolute ${isCollapsed ? 'bottom-0 left-full ml-2' : 'bottom-full left-0 right-0 mb-1'} z-50 w-56 overflow-hidden rounded-xl border border-border bg-overlay py-1 shadow-2xl`}>
                <div className="border-b border-border px-3 py-2 text-xs font-medium text-text-muted">
                  {t('sidebar.switchTenant')}
                </div>
                {tenants.map((tnt) => (
                  <button
                    key={tnt.id}
                    onClick={() => handleSwitchTenant(tnt.id)}
                    className={`flex w-full items-center gap-3 px-3 py-2 text-sm transition-colors hover:bg-surface-hover ${
                      tnt.isHome ? 'text-text-primary font-medium' : 'text-text-secondary'
                    }`}
                  >
                    <Building2 size={14} className="shrink-0 text-accent" />
                    <div className="min-w-0 text-left">
                      <p className="truncate">{tnt.legalName}</p>
                      <p className="truncate text-[10px] text-text-muted">{tnt.slug}</p>
                    </div>
                    {tnt.isHome && <span className="ml-auto text-[10px] text-accent">{t('sidebar.current')}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </aside>
  );
}
