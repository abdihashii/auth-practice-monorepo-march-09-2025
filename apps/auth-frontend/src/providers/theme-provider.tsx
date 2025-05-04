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
    // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
    setThemeState(newTheme);
  }, [storageKey]);

  // Effect to synchronize theme with user settings from context
  useEffect(() => {
    const userTheme = user?.settings?.theme;
    if (userTheme && userTheme !== theme) {
      setTheme(userTheme); // Use the combined setter
    }
    // Only run when user setting changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.settings?.theme]); // Only depend on user setting

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
