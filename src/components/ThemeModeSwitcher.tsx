'use client';

import React from 'react';
import { useTheme, ColorMode } from '@/lib/theme/ThemeContext';
import { useI18n } from '@/lib/i18n/I18nContext';

interface ThemeModeSwitcherProps {
  className?: string;
}

export const ThemeModeSwitcher: React.FC<ThemeModeSwitcherProps> = ({ className = '' }) => {
  const { colorMode, setColorMode } = useTheme();
  const { t } = useI18n();

  const options: { mode: ColorMode; label: string }[] = [
    { mode: 'light', label: t.theme.light },
    { mode: 'dark', label: t.theme.dark },
    { mode: 'system', label: t.theme.system },
  ];

  return (
    <div
      className={`inline-flex items-center gap-0.5 p-0.5 h-8 rounded-lg bg-[var(--md-background)] border border-[var(--md-outline)] shadow-xs text-xs font-sans select-none overflow-hidden ${className}`}
      role="group"
      aria-label={t.theme.mode}
      title={t.theme.mode}
    >
      {options.map(({ mode, label }) => {
        const isActive = colorMode === mode;
        return (
          <button
            key={mode}
            type="button"
            onClick={() => setColorMode(mode)}
            className={`h-7 px-2 sm:px-2.5 rounded-md font-bold text-[11px] transition-all cursor-pointer flex items-center ${
              isActive
                ? 'bg-[var(--md-primary)] text-[var(--md-on-primary)] shadow-xs'
                : 'text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)] hover:bg-[var(--md-state-hover)] font-medium'
            }`}
            aria-pressed={isActive}
            title={`${t.theme.mode}: ${label}`}
          >
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
};
