'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type AppThemeStyle = 'cyber-glass';
export type ColorMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  themeStyle: AppThemeStyle;
  setThemeStyle: (theme: AppThemeStyle) => void;
  isMaterialCobalt: boolean;
  colorMode: ColorMode;
  setColorMode: (mode: ColorMode) => void;
  resolvedMode: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorMode, setColorModeState] = useState<ColorMode>('system');
  const [systemDark, setSystemDark] = useState<boolean>(false);

  useEffect(() => {
    const saved = localStorage.getItem('bairight_color_mode') as ColorMode | null;
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      setColorModeState(saved);
    }

    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemDark(mql.matches);

    const handler = (e: MediaQueryListEvent) => {
      setSystemDark(e.matches);
    };

    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const resolvedMode: 'light' | 'dark' =
    colorMode === 'system' ? (systemDark ? 'dark' : 'light') : colorMode;

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-color-mode', resolvedMode);
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) {
        meta.setAttribute('content', resolvedMode === 'dark' ? '#0f1316' : '#f4f6f8');
      }
    }
  }, [resolvedMode]);

  const setColorMode = (mode: ColorMode) => {
    setColorModeState(mode);
    localStorage.setItem('bairight_color_mode', mode);
  };

  return (
    <ThemeContext.Provider
      value={{
        themeStyle: 'cyber-glass',
        setThemeStyle: () => {},
        isMaterialCobalt: false,
        colorMode,
        setColorMode,
        resolvedMode,
      }}
    >
      <div data-theme="google-material" className="theme-root">
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      themeStyle: 'cyber-glass' as AppThemeStyle,
      setThemeStyle: () => {},
      isMaterialCobalt: false,
      colorMode: 'system' as ColorMode,
      setColorMode: () => {},
      resolvedMode: 'light' as const,
    };
  }
  return context;
}
