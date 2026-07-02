import { useState, useRef, useEffect, Fragment } from 'react';
import { useHeaderStore } from '@/core/store/header-store';
import { useAuthStore } from '@/core/auth/store';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { Search, ChevronRight, LogOut, User } from 'lucide-react';
import { ThemeSwitcher } from './ThemeSwitcher';
import api from '@/shared/lib/api/client';

export function Header() {
  const { breadcrumbs, tenantName, branchName } = useHeaderStore();
  const { user, logout } = useAuthStore();
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-6">
      <div className="flex items-center gap-2 text-sm">
        {breadcrumbs.map((crumb, i) => (
          <Fragment key={crumb.label}>
            {i > 0 && <ChevronRight size={14} className="text-text-secondary" />}
            {crumb.href ? (
              <a href={crumb.href} className="text-text-secondary hover:text-text-primary">
                {t(crumb.label)}
              </a>
            ) : (
              <span className="text-text-primary font-medium">{t(crumb.label)}</span>
            )}
          </Fragment>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <ThemeSwitcher />
        <button className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary hover:bg-surface-hover">
          <Search size={14} />
          <span>{t('common.search')}</span>
          <kbd className="ml-1 rounded border border-border px-1 text-[10px]">/</kbd>
        </button>
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          {tenantName && (
            <span className="rounded bg-accent/10 px-2 py-0.5 text-accent">{tenantName}</span>
          )}
          {branchName && <span>{branchName}</span>}
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-text-secondary hover:bg-surface-hover"
            >
              <User size={16} />
              <span className="text-sm">{user?.name ?? user?.email ?? 'User'}</span>
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-xl border border-border bg-surface p-1 shadow-lg">
                <button
                  onClick={async () => {
                    try { await api.post('/auth/logout'); } catch {}
                    logout();
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-secondary hover:bg-surface-hover hover:text-error"
                >
                  <LogOut size={16} />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
