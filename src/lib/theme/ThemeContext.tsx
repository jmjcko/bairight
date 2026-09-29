'use client';

import React, { createContext, useContext } from 'react';

export type AppThemeStyle = 'cyber-glass';

interface ThemeContextType {
  themeStyle: AppThemeStyle;
  setThemeStyle: (theme: AppThemeStyle) => void;
  isMaterialCobalt: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeContext.Provider value={{ themeStyle: 'cyber-glass', setThemeStyle: () => {}, isMaterialCobalt: false }}>
      <div data-theme="cyber-glass" className="theme-cyber-glass">
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
    };
  }
  return context;
}
