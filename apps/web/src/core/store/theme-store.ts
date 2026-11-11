import { create } from 'zustand';
import type { LucideIcon } from 'lucide-react';
import { Moon, Sun, Eclipse, Lamp } from 'lucide-react';

export type ThemeId = 'premium-dark' | 'obsidian-emerald' | 'nordic-light' | 'warm-light';
export type ThemeMode = 'dark' | 'light' | 'system';

export interface ThemeConfig {
  id: ThemeId;
  label: string;
  icon: LucideIcon;
  group: 'dark' | 'light';
}

export const themeOptions: ThemeConfig[] = [
  { id: 'premium-dark', label: 'Atrium Dark', icon: Moon, group: 'dark' },
  { id: 'obsidian-emerald', label: 'Obsidian Emerald', icon: Eclipse, group: 'dark' },
  { id: 'nordic-light', label: 'Nordic Light', icon: Sun, group: 'light' },
  { id: 'warm-light', label: 'Warm Light', icon: Lamp, group: 'light' },
];

const DEFAULT_PRIMARY_DARK: ThemeId = 'premium-dark';
const DEFAULT_PRIMARY_LIGHT: ThemeId = 'nordic-light';

function getDeviceThemeGroup(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(mode: ThemeMode, primaryDark: ThemeId, primaryLight: ThemeId): ThemeId {
  if (mode === 'dark') return primaryDark;
  if (mode === 'light') return primaryLight;
  return getDeviceThemeGroup() === 'dark' ? primaryDark : primaryLight;
}

function getStored<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const val = localStorage.getItem(key);
    return val ? (JSON.parse(val) as T) : fallback;
  } catch {
    return fallback;
  }
}

function getInitialMode(): ThemeMode {
  return getStored<ThemeMode>('theme-mode', 'dark');
}

function getInitialPrimaryDark(): ThemeId {
  return getStored<ThemeId>('theme-primary-dark', DEFAULT_PRIMARY_DARK);
}

function getInitialPrimaryLight(): ThemeId {
  return getStored<ThemeId>('theme-primary-light', DEFAULT_PRIMARY_LIGHT);
}

function applyTheme(theme: ThemeId) {
  document.documentElement.setAttribute('data-theme', theme);
}

interface ThemeState {
  mode: ThemeMode;
  current: ThemeId;
  primaryDark: ThemeId;
  primaryLight: ThemeId;
  setMode: (mode: ThemeMode) => void;
  setTheme: (theme: ThemeId) => void;
  setPrimaryDark: (theme: ThemeId) => void;
  setPrimaryLight: (theme: ThemeId) => void;
}

const initialMode = getInitialMode();
const initialPrimaryDark = getInitialPrimaryDark();
const initialPrimaryLight = getInitialPrimaryLight();

applyTheme(resolveTheme(initialMode, initialPrimaryDark, initialPrimaryLight));

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: initialMode,
  current: resolveTheme(initialMode, initialPrimaryDark, initialPrimaryLight),
  primaryDark: initialPrimaryDark,
  primaryLight: initialPrimaryLight,

  setMode: (mode) => {
    localStorage.setItem('theme-mode', JSON.stringify(mode));
    const { primaryDark, primaryLight } = get();
    const theme = resolveTheme(mode, primaryDark, primaryLight);
    applyTheme(theme);
    set({ mode, current: theme });
  },

  setTheme: (theme) => {
    const config = themeOptions.find((t) => t.id === theme);
    if (!config) return;
    localStorage.setItem('theme', theme);
    const mode: ThemeMode = config.group === 'dark' ? 'dark' : 'light';
    localStorage.setItem('theme-mode', JSON.stringify(mode));
    applyTheme(theme);
    set({ mode, current: theme });
  },

  setPrimaryDark: (theme) => {
    localStorage.setItem('theme-primary-dark', JSON.stringify(theme));
    const state = get();
    if (state.mode === 'dark' || state.mode === 'system') {
      const resolved = resolveTheme(state.mode, theme, state.primaryLight);
      applyTheme(resolved);
      set({ primaryDark: theme, current: resolved });
    } else {
      set({ primaryDark: theme });
    }
  },

  setPrimaryLight: (theme) => {
    localStorage.setItem('theme-primary-light', JSON.stringify(theme));
    const state = get();
    if (state.mode === 'light' || state.mode === 'system') {
      const resolved = resolveTheme(state.mode, state.primaryDark, theme);
      applyTheme(resolved);
      set({ primaryLight: theme, current: resolved });
    } else {
      set({ primaryLight: theme });
    }
  },
}));

if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const state = useThemeStore.getState();
    if (state.mode === 'system') {
      const theme = resolveTheme('system', state.primaryDark, state.primaryLight);
      applyTheme(theme);
      useThemeStore.setState({ current: theme });
    }
  });
}
