import { useState } from 'react';
import { Palette } from 'lucide-react';
import { useThemeStore, themeOptions } from '@/core/store/theme-store';

export function ThemeSwitcher() {
  const [open, setOpen] = useState(false);
  const { current, setTheme } = useThemeStore();

  const currentTheme = themeOptions.find((t) => t.id === current);

  const groups = [
    { label: 'Dark', key: 'dark' as const, themes: themeOptions.filter((t) => t.group === 'dark') },
    { label: 'Light', key: 'light' as const, themes: themeOptions.filter((t) => t.group === 'light') },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
        title="Cambiar tema"
      >
        <Palette size={16} />
        {currentTheme && <span className="hidden sm:inline">{currentTheme.label}</span>}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-1 w-52 rounded-xl border border-border bg-overlay py-2 shadow-2xl">
            {groups.map((group) => (
              <div key={group.key}>
                <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                  {group.label}
                </div>
                {group.themes.map((t) => {
                  const Icon = t.icon;
                  const isActive = current === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setTheme(t.id);
                        setOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors ${
                        isActive
                          ? 'bg-accent-alpha text-accent'
                          : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                      }`}
                    >
                      <Icon size={16} className="shrink-0" />
                      <span className="flex-1">{t.label}</span>
                      <span className="text-[10px] uppercase tracking-wider text-text-muted">
                        {t.tier === 'primary' ? 'Primario' : 'Secundario'}
                      </span>
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
