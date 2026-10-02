'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SupportedLocale, Translations, translations } from './translations';

interface I18nContextType {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: Translations;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

/**
 * Resolves saved locale from Cookie, localStorage, or user account session.
 * Primary fallback is always English ('en').
 */
export function getSavedLocale(): SupportedLocale {
  if (typeof window !== 'undefined') {
    try {
      // 1. Check document.cookie
      if (typeof document !== 'undefined' && document.cookie) {
        const match = document.cookie.match(/(?:^|;\s*)bairight_locale=([^;]+)/);
        if (match && (match[1] === 'cs' || match[1] === 'en')) {
          return match[1] as SupportedLocale;
        }
      }

      // 2. Check localStorage
      const stored = localStorage.getItem('bairight_locale');
      if (stored === 'cs' || stored === 'en') {
        return stored as SupportedLocale;
      }

      // 3. Check user account profile in localStorage
      const userSession = localStorage.getItem('bairight_user_session');
      if (userSession) {
        const parsed = JSON.parse(userSession);
        if (parsed && (parsed.preferredLocale === 'cs' || parsed.preferredLocale === 'en')) {
          return parsed.preferredLocale as SupportedLocale;
        }
      }
    } catch {}
  }
  return 'en';
}

/**
 * Persists locale to localStorage, 1-year Cookie, and user account session.
 */
export function persistLocale(newLocale: SupportedLocale): void {
  if (typeof window !== 'undefined') {
    try {
      // 1. Persist to localStorage
      localStorage.setItem('bairight_locale', newLocale);

      // 2. Persist to Cookie (1 year duration, SameSite=Lax)
      if (typeof document !== 'undefined') {
        document.cookie = `bairight_locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
        document.documentElement.lang = newLocale;
      }

      // 3. Sync into user profile if logged in
      const userSession = localStorage.getItem('bairight_user_session');
      if (userSession) {
        const parsed = JSON.parse(userSession);
        if (parsed && typeof parsed === 'object') {
          parsed.preferredLocale = newLocale;
          localStorage.setItem('bairight_user_session', JSON.stringify(parsed));
        }
      }
    } catch {}
  }
}

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<SupportedLocale>(() => getSavedLocale());

  useEffect(() => {
    const saved = getSavedLocale();
    setLocaleState(saved);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = saved;
    }
  }, []);

  const setLocale = (newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    persistLocale(newLocale);
  };

  const t = translations[locale] || translations.en;

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    const fallbackLocale = getSavedLocale();
    return {
      locale: fallbackLocale,
      setLocale: () => {},
      t: translations[fallbackLocale] || translations.en,
    };
  }
  return context;
};
