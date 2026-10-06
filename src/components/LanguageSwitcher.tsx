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
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-xl p-6 sm:p-7 shadow-[0_20px_60px_rgba(6,182,212,0.25)] relative text-left space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Monospace Tag */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <span className="inline-block text-[10px] font-mono font-bold tracking-widest text-[#01579b] uppercase bg-[#e1f5fe] px-2.5 py-0.5 rounded-md border border-[#b3e5fc] mb-1.5">
              SYSTEM NOTIFICATION • JAZYKOVÝ REŽIM
            </span>
            <h3 className="text-base sm:text-lg font-black text-[#263238] tracking-tight">
              {noticeLocale === 'cs'
                ? 'Jazyk přepnut: 100% Český režim'
                : 'Language Switched: 100% English Mode'}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setNoticeLocale(null)}
            className="p-1.5 rounded-lg bg-[#f4f6f8] hover:bg-[#eceff1] border border-slate-200 text-[#546e7a] hover:text-[#263238] transition-colors cursor-pointer shrink-0"
            aria-label={noticeLocale === 'cs' ? 'Zavřít oznámení' : 'Close notification'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Information Points: Clean typography & High Contrast Material Cards */}
        <div className="space-y-3 text-xs text-[#37474f] leading-relaxed font-sans">
          <div className="p-3.5 rounded-xl bg-[#f8fafc] border border-slate-200 space-y-1">
            <span className="font-bold text-[#01579b] text-xs block">
              {noticeLocale === 'cs' ? '1. Rozhraní aplikace & Navigace' : '1. Application UI & Navigation'}
            </span>
            <p className="text-[#455a64] leading-relaxed">
              {noticeLocale === 'cs'
                ? 'Veškeré ovládací prvky, dotazníky, nákupní filtry a systémové hlášky jsou nyní v češtině.'
                : 'All controls, questionnaires, shopping filters, and system messages are now fully in English.'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#f8fafc] border border-slate-200 space-y-1">
            <span className="font-bold text-[#01579b] text-xs block">
              {noticeLocale === 'cs' ? '2. Nový výzkum (Agent Luke) & Stažení (.md)' : '2. New Research (Agent Luke) & Downloads (.md)'}
            </span>
            <p className="text-[#455a64] leading-relaxed">
              {noticeLocale === 'cs'
                ? 'Každá nově zadaná kategorie zboží bude analyzována v češtině a vytvoří plně českého agenta včetně českého systémového promptu a českého souboru .agent.md ke stažení.'
                : 'Any newly researched product category will be analyzed in English and will generate a fully English agent including prompt directives and downloadable .agent.md.'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#e1f5fe]/40 border border-[#b3e5fc] space-y-1">
            <span className="font-bold text-[#014377] text-xs block">
              {noticeLocale === 'cs' ? '3. Ochrana rozpracovaného agenta' : '3. Active Agent Protection'}
            </span>
            <p className="text-[#37474f] leading-relaxed">
              {noticeLocale === 'cs'
                ? 'Pokud máte právě otevřeného agenta, který byl dříve vygenerován v jiném jazyce, jeho parametry a volby zůstávají v původním znění, aby se neztratily vaše dosud naklikané odpovědi. Pro českou verzi stačí zadat kategorii znovu v češtině.'
                : 'If you currently have an open agent generated in a different language, its parameters and options remain in their original wording to protect your selected answers. For an English version, simply research the category again in English.'}
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-[#f1f5f9] border border-slate-200 text-[11px] font-mono text-[#37474f] leading-relaxed">
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
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#0099cc] hover:bg-[#0088b8] text-white shadow-xs transition-all cursor-pointer"
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
        className={`inline-flex items-center gap-1 p-0.5 h-8 rounded-lg bg-[#f4f6f8] border border-slate-200 shadow-sm text-xs font-mono select-none overflow-hidden ${className}`}
        role="group"
        aria-label="Language Switcher"
      >
        <button
          type="button"
          onClick={() => handleSwitch('cs')}
          className={`h-7 px-2.5 rounded-md font-bold transition-all cursor-pointer flex items-center ${
            locale === 'cs'
              ? 'bg-[#0099cc] text-white shadow-xs'
              : 'text-[#546e7a] hover:text-[#263238] hover:bg-slate-200/60 font-semibold'
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
              ? 'bg-[#0099cc] text-white shadow-xs'
              : 'text-[#546e7a] hover:text-[#263238] hover:bg-slate-200/60 font-semibold'
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
