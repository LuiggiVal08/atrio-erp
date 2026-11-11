import { useState } from 'react';
import { Palette, Monitor } from 'lucide-react';
import { useThemeStore, themeOptions, type ThemeMode } from '@/core/store/theme-store';
import { Tooltip } from '@heroui/react';

interface ThemeSwitcherProps {
  compact?: boolean;
}

export function ThemeSwitcher({ compact = false }: ThemeSwitcherProps) {
  const [open, setOpen] = useState(false);
  const { mode, current, setTheme, setMode } = useThemeStore();

  const currentTheme = themeOptions.find((t) => t.id === current);

  const groups = [
    { label: 'Dark', key: 'dark' as const, themes: themeOptions.filter((t) => t.group === 'dark') },
    { label: 'Light', key: 'light' as const, themes: themeOptions.filter((t) => t.group === 'light') },
  ];

  const handleModeClick = (newMode: ThemeMode, themeId?: string) => {
    if (themeId) {
      setTheme(themeId as any);
    } else {
      setMode(newMode);
    }
    setOpen(false);
  };

  return (
    <div className="relative">
      <Tooltip delay={0}>
        <Tooltip.Trigger>
          <button
            onClick={() => setOpen(!open)}
            className={
              compact
                ? 'flex h-11 w-11 items-center justify-center rounded-full border border-border/80 bg-overlay/85 text-text-secondary shadow-[0_12px_40px_rgba(0,0,0,0.22)] backdrop-blur-xl hover:bg-surface-hover hover:text-text-primary'
                : 'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors'
            }
          >
            <Palette size={16} />
            {!compact && currentTheme && <span className="hidden sm:inline">{currentTheme.label}</span>}
            {!compact && mode === 'system' && <span className="hidden sm:inline text-text-muted">· Sist.</span>}
          </button>
        </Tooltip.Trigger>
        <Tooltip.Content showArrow offset={4}>
          <Tooltip.Arrow />
          <span className="text-xs">Cambiar tema</span>
        </Tooltip.Content>
      </Tooltip>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-1 w-52 rounded-xl border border-border bg-overlay py-2 shadow-2xl">
            <button
              onClick={() => handleModeClick('system')}
              className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors ${
                mode === 'system'
                  ? 'bg-accent-alpha text-accent'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
              }`}
            >
              <Monitor size={16} className="shrink-0" />
              <span>System</span>
              {mode === 'system' && (
                <span className="ml-auto text-[10px] uppercase tracking-wider text-accent">Activo</span>
              )}
            </button>
            <div className="mx-3 my-1.5 border-t border-border" />
            {groups.map((group) => (
              <div key={group.key}>
                <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                  {group.label}
                </div>
                {group.themes.map((t) => {
                  const Icon = t.icon;
                  const isActive = current === t.id && mode !== 'system';
                  return (
                    <button
                      key={t.id}
                      onClick={() => handleModeClick(group.key, t.id)}
                      className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors ${
                        isActive
                          ? 'bg-accent-alpha text-accent'
                          : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                      }`}
                    >
                      <Icon size={16} className="shrink-0" />
                      <span className="flex-1">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
