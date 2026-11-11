import { useState, useEffect } from 'react';
import { useSidebarStore } from '@/core/store/sidebar-store';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { Bell, Settings, User } from 'lucide-react';
import { ThemeSwitcher } from './ThemeSwitcher';
import { SearchModal } from './SearchModal';
import { Logo } from './Logo';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/core/auth/store';
import { UserCircle, LogOut } from 'lucide-react';
import api from '@/shared/lib/api/client';


export function Header() {
  const { modules, setActiveModule } = useSidebarStore();

  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const primaryModuleIds = ['reports', 'pos', 'purchasing', 'inventory', 'clients', 'rbac', 'users'];
  const headerModules = modules
    .filter((mod) => primaryModuleIds.includes(mod.id))
    .sort((a, b) => primaryModuleIds.indexOf(a.id) - primaryModuleIds.indexOf(b.id));
  const currentModule = headerModules
    .filter((mod) => location.pathname === mod.route || location.pathname.startsWith(`${mod.route}/`))
    .sort((a, b) => b.route.length - a.route.length)[0];

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
    logout();
    setProfileOpen(false);
  };

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === '/' && !searchOpen) {
        const isInput = (e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA';
        if (!isInput) {
          e.preventDefault();
          setSearchOpen(true);
        }
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [searchOpen]);

  useEffect(() => {
    const openSearch = () => setSearchOpen(true);
    window.addEventListener('atrio:open-search', openSearch);
    return () => window.removeEventListener('atrio:open-search', openSearch);
  }, []);

  return (
    <>
    <div className="col-start-1 row-start-1 z-40 flex h-14 items-center justify-center gap-2 self-start px-1">
      <Logo variant="isologo" className="h-9 w-9" />
      <Logo variant="logotipo" className="h-8 max-w-[84px]" />
    </div>
    <header
      className="col-start-2 row-start-1 z-40 flex h-14 min-w-0 justify-center"
    >
      <nav className="flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-[28px] border border-white/10 bg-overlay/85 px-2 shadow-[0_12px_40px_rgba(0,0,0,0.22)] backdrop-blur-xl">
        {headerModules.map((mod) => {
          const Icon = mod.icon;
          const isActive = currentModule?.id === mod.id || location.pathname.startsWith(mod.route);
          return (
            <NavLink
              key={mod.id}
              to={mod.route}
              onClick={() => setActiveModule(mod.id)}
              className={`flex h-10 shrink-0 items-center gap-2 rounded-[14px] px-3 text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-surface-active text-text-primary shadow-sm'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
              }`}
            >
              <Icon size={14} />
              <span className="hidden xl:inline">
                {mod.label.startsWith('sidebar.') ? t(mod.label) : mod.label}
              </span>
            </NavLink>
          );
        })}
      </nav>
    </header>

      <div className="col-start-3 row-start-1 z-40 flex h-14 items-center justify-end gap-2 pr-2">
        <button
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border/80 bg-overlay/85 text-text-secondary shadow-[0_12px_40px_rgba(0,0,0,0.22)] backdrop-blur-xl hover:bg-surface-hover hover:text-text-primary"
          aria-label="Notifications"
        >
          <Bell size={17} />
        </button>
        <ThemeSwitcher compact />
        <div className="relative">
          <button
            onClick={() => setProfileOpen((open) => !open)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-border/80 bg-overlay/85 text-text-primary shadow-[0_12px_40px_rgba(0,0,0,0.22)] backdrop-blur-xl hover:bg-surface-hover"
            aria-label="Profile menu"
            aria-expanded={profileOpen}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border-light bg-surface-active">
              <User size={18} />
            </span>
          </button>
          {profileOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
              <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-border/80 bg-overlay/95 py-1 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-alpha text-accent">
                    <User size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text-primary">{user?.name ?? 'User'}</p>
                    <p className="truncate text-xs text-text-muted">{user?.email ?? ''}</p>
                  </div>
                </div>
                <button onClick={() => { navigate('/profile'); setProfileOpen(false); }} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary">
                  <UserCircle size={16} />{t('sidebar.profile.label')}
                </button>
                <button onClick={() => { navigate('/settings'); setProfileOpen(false); }} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary">
                  <Settings size={16} />{t('sidebar.settings.label')}
                </button>
                <button onClick={handleLogout} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-hover hover:text-error">
                  <LogOut size={16} />{t('auth.logout')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
