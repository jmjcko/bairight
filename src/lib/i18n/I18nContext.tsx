'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SupportedLocale, Translations, translations } from './translations';

interface I18nContextType {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: Translations;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<SupportedLocale>('cs');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('bairight_locale') as SupportedLocale;
      if (stored === 'cs' || stored === 'en') {
        setLocaleState(stored);
        document.documentElement.lang = stored;
      }
    } catch {}
  }, []);

  const setLocale = (newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem('bairight_locale', newLocale);
      document.documentElement.lang = newLocale;
    } catch {}
  };

  const t = translations[locale] || translations.cs;

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    // Graceful fallback for components tested in isolation
    return {
      locale: 'cs',
      setLocale: () => {},
      t: translations.cs,
    };
  }
  return context;
};
