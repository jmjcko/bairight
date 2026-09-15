'use client';

import React from 'react';
import { useI18n } from '@/lib/i18n/I18nContext';
import { Globe } from 'lucide-react';

interface LanguageSwitcherProps {
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className = '' }) => {
  const { locale, setLocale } = useI18n();

  return (
    <div
      className={`inline-flex items-center p-1 rounded-xl bg-slate-950/90 border border-cyan-500/25 shadow-sm text-xs font-mono select-none ${className}`}
      role="group"
      aria-label="Language Switcher"
    >
      <div className="pl-1.5 pr-1 text-cyan-400 hidden sm:block">
        <Globe className="w-3.5 h-3.5" />
      </div>

      <button
        type="button"
        onClick={() => setLocale('cs')}
        className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
          locale === 'cs'
            ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400/40'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
        }`}
        title="Přepnout do češtiny"
        aria-label="Přepnout do češtiny"
        aria-pressed={locale === 'cs'}
      >
        <span>🇨🇿</span>
        <span>CZ</span>
      </button>

      <button
        type="button"
        onClick={() => setLocale('en')}
        className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
          locale === 'en'
            ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400/40'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
        }`}
        title="Switch to English"
        aria-label="Switch to English"
        aria-pressed={locale === 'en'}
      >
        <span>🇬🇧</span>
        <span>EN</span>
      </button>
    </div>
  );
};
