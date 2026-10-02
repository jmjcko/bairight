'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '@/lib/i18n/I18nContext';
import { SupportedLocale } from '@/lib/i18n/translations';
import { X } from 'lucide-react';

interface LanguageSwitcherProps {
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className = '' }) => {
  const { locale, setLocale } = useI18n();
  const [noticeLocale, setNoticeLocale] = useState<SupportedLocale | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSwitch = (target: SupportedLocale) => {
    if (target === locale) return;
    setLocale(target);
    setNoticeLocale(target);
  };

  const modalContent = noticeLocale ? (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      onClick={() => setNoticeLocale(null)}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#070d18] border-2 border-cyan-500/40 rounded-3xl p-6 sm:p-7 shadow-[0_20px_60px_rgba(6,182,212,0.25)] relative text-left space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Monospace Tag */}
        <div className="flex items-start justify-between gap-3 border-b border-cyan-500/20 pb-4">
          <div>
            <span className="inline-block text-[10px] font-mono font-bold tracking-widest text-cyan-400 uppercase bg-cyan-950/80 px-2.5 py-0.5 rounded border border-cyan-500/30 mb-1.5">
              SYSTEM NOTIFICATION • JAZYKOVÝ REŽIM
            </span>
            <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
              {noticeLocale === 'cs'
                ? 'Jazyk přepnut: 100% Český režim'
                : 'Language Switched: 100% English Mode'}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setNoticeLocale(null)}
            className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-cyan-400/50 transition-colors cursor-pointer shrink-0"
            aria-label={noticeLocale === 'cs' ? 'Zavřít oznámení' : 'Close notification'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Information Points: Clean typography & Cyber-glass accents */}
        <div className="space-y-3 text-xs text-slate-300 leading-relaxed font-sans">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
            <span className="font-bold text-cyan-300 block">
              {noticeLocale === 'cs' ? '1. Rozhraní aplikace & Navigace' : '1. Application UI & Navigation'}
            </span>
            <p className="text-slate-400">
              {noticeLocale === 'cs'
                ? 'Veškeré ovládací prvky, dotazníky, nákupní filtry a systémové hlášky jsou nyní v češtině.'
                : 'All controls, questionnaires, shopping filters, and system messages are now fully in English.'}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
            <span className="font-bold text-cyan-300 block">
              {noticeLocale === 'cs' ? '2. Nový výzkum (Agent Luke) & Stažení (.md)' : '2. New Research (Agent Luke) & Downloads (.md)'}
            </span>
            <p className="text-slate-400">
              {noticeLocale === 'cs'
                ? 'Každá nově zadaná kategorie zboží bude analyzována v češtině a vytvoří plně českého agenta včetně českého systémového promptu a českého souboru .agent.md ke stažení.'
                : 'Any newly researched product category will be analyzed in English and will generate a fully English agent including prompt directives and downloadable .agent.md.'}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 space-y-1">
            <span className="font-bold text-cyan-200 block">
              {noticeLocale === 'cs' ? '3. Ochrana rozpracovaného agenta' : '3. Active Agent Protection'}
            </span>
            <p className="text-slate-300">
              {noticeLocale === 'cs'
                ? 'Pokud máte právě otevřeného agenta, který byl dříve vygenerován v jiném jazyce, jeho parametry a volby zůstávají v původním znění, aby se neztratily vaše dosud naklikané odpovědi. Pro českou verzi stačí zadat kategorii znovu v češtině.'
                : 'If you currently have an open agent generated in a different language, its parameters and options remain in their original wording to protect your selected answers. For an English version, simply research the category again in English.'}
            </p>
          </div>

          <div className="pt-1 text-[11px] font-mono text-cyan-400/80">
            {noticeLocale === 'cs'
              ? 'Trvalé uložení: Vaše volba byla zapsána do cookies, localStorage i uživatelského profilu pro všechna příští přihlášení.'
              : 'Persistent storage: Your preference has been saved to cookies, localStorage, and your account profile for future logins.'}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end pt-1">
          <button
            type="button"
            onClick={() => setNoticeLocale(null)}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 hover:brightness-110 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all cursor-pointer"
          >
            <span>{noticeLocale === 'cs' ? 'Rozumím' : 'Dismiss'}</span>
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <div
        className={`inline-flex items-center gap-1 p-0.5 h-8 rounded-lg bg-[#070d18] border border-cyan-500/25 shadow-sm text-xs font-mono select-none overflow-hidden ${className}`}
        role="group"
        aria-label="Language Switcher"
      >
        <button
          type="button"
          onClick={() => handleSwitch('cs')}
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
          onClick={() => handleSwitch('en')}
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

      {/* Cyber-glass System Notification on Language Switch via Portal to document.body */}
      {modalContent && mounted && typeof document !== 'undefined'
        ? createPortal(modalContent, document.body)
        : null}
    </>
  );
};
