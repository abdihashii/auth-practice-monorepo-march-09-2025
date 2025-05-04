import { useCallback, useEffect, useMemo, useState } from 'react';

import type { Theme } from '@/contexts/theme-context';

import { ThemeProviderContext } from '@/contexts/theme-context';
import { useAuthContext } from '@/hooks/use-auth-context';

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'vite-ui-theme',
  ...props
}: ThemeProviderProps) {
  const { user } = useAuthContext();

  const [theme, setThemeState] = useState<Theme>(
    () => user?.settings?.theme
      ?? (localStorage.getItem(storageKey) as Theme)
      ?? defaultTheme,
  );

  // Effect to apply the theme class to the root element
  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light';

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  // Renamed original setTheme to avoid conflict in useEffect below
  const setTheme = useCallback((newTheme: Theme) => {
    localStorage.setItem(storageKey, newTheme);
    setThemeState(newTheme);
  }, [storageKey]);

  // Effect to synchronize theme with user settings from context
  useEffect(() => {
    const userTheme = user?.settings?.theme;
    if (userTheme && userTheme !== theme) {
      setTheme(userTheme); // Use the combined setter
    }
    // Intentionally only run when user object changes,
    // specifically when theme setting might update after login or profile fetch/update.
    // Avoid dependency on `theme` state itself to prevent potential loops if user setting causes context update -> state update -> effect re-run.
  }, [user?.settings?.theme, theme, setTheme]); // Now includes theme state and setTheme setter

  const value = useMemo(() => ({
    theme,
    setTheme,
  }), [theme, setTheme]);

  return (
    <ThemeProviderContext {...props} value={value}>
      {children}
    </ThemeProviderContext>
  );
}
