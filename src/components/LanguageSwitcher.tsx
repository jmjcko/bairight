'use client';

import React from 'react';
import { useI18n } from '@/lib/i18n/I18nContext';

interface LanguageSwitcherProps {
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className = '' }) => {
  const { locale, setLocale } = useI18n();

  return (
    <div
      className={`inline-flex items-center gap-1 p-0.5 h-8 rounded-lg bg-[#070d18] border border-cyan-500/25 shadow-sm text-xs font-mono select-none overflow-hidden ${className}`}
      role="group"
      aria-label="Language Switcher"
    >
      <button
        type="button"
        onClick={() => setLocale('cs')}
        className={`h-7 px-2.5 rounded-md font-bold transition-all cursor-pointer flex items-center ${
          locale === 'cs'
            ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.25)]'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
        }`}
        title="Přepnout do češtiny"
        aria-label="Přepnout do češtiny"
        aria-pressed={locale === 'cs'}
      >
        <span>CZ</span>
      </button>

      <button
        type="button"
        onClick={() => setLocale('en')}
        className={`h-7 px-2.5 rounded-md font-bold transition-all cursor-pointer flex items-center ${
          locale === 'en'
            ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.25)]'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
        }`}
        title="Switch to English"
        aria-label="Switch to English"
        aria-pressed={locale === 'en'}
      >
        <span>EN</span>
      </button>
    </div>
  );
};
