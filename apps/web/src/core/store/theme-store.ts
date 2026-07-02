import { create } from 'zustand';
import type { LucideIcon } from 'lucide-react';
import { Moon, Sun, Eclipse, Lamp } from 'lucide-react';

export type ThemeId = 'premium-dark' | 'obsidian-emerald' | 'nordic-light' | 'warm-light';

export interface ThemeConfig {
  id: ThemeId;
  label: string;
  icon: LucideIcon;
  group: 'dark' | 'light';
  tier: 'primary' | 'secondary';
}

export const themeOptions: ThemeConfig[] = [
  { id: 'premium-dark', label: 'Premium Dark', icon: Moon, group: 'dark', tier: 'primary' },
  { id: 'obsidian-emerald', label: 'Obsidian Emerald', icon: Eclipse, group: 'dark', tier: 'secondary' },
  { id: 'nordic-light', label: 'Nordic Light', icon: Sun, group: 'light', tier: 'primary' },
  { id: 'warm-light', label: 'Warm Light', icon: Lamp, group: 'light', tier: 'secondary' },
];

const primaryByGroup: Record<'dark' | 'light', ThemeId> = {
  dark: 'premium-dark',
  light: 'nordic-light',
};

interface ThemeState {
  current: ThemeId;
  setTheme: (theme: ThemeId) => void;
  themes: ThemeConfig[];
}

function getDeviceDefault(): ThemeId {
  if (typeof window === 'undefined') return 'premium-dark';
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return primaryByGroup[prefersDark ? 'dark' : 'light'];
}

function getInitialTheme(): ThemeId {
  if (typeof window === 'undefined') return 'premium-dark';
  const stored = localStorage.getItem('theme') as ThemeId | null;
  if (stored && themeOptions.some((t) => t.id === stored)) return stored;
  return getDeviceDefault();
}

export const useThemeStore = create<ThemeState>((set) => ({
  current: getInitialTheme(),
  themes: themeOptions,
  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    set({ current: theme });
  },
}));
