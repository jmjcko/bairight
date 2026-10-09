'use client';

import React from 'react';
import { SupportedLocale } from '@/lib/i18n/translations';

interface HowItWorksFloatingButtonProps {
  onClick: () => void;
  locale: SupportedLocale;
}

export const HowItWorksFloatingButton: React.FC<HowItWorksFloatingButtonProps> = ({
  onClick,
  locale,
}) => {
  const isEn = locale === 'en';

  return (
    <div
      aria-label="How it works guide"
      className="fixed bottom-[124px] sm:bottom-[66px] right-4 sm:right-6 z-40 print:hidden pointer-events-auto bg-transparent border-0 shadow-none p-0 m-0"
    >
      <button
        type="button"
        onClick={onClick}
        aria-label={isEn ? 'How it works • Interactive Product Guide' : 'Jak to funguje • Interaktivní průvodce'}
        className="group flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--md-surface)] hover:bg-[var(--md-surface-dim)] active:scale-95 text-[var(--md-on-surface)] border border-[var(--md-outline)] shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--md-primary)]/40"
      >
        {/* Material Design minimal outline info icon */}
        <svg
          className="w-4 h-4 text-[var(--md-primary)] transition-transform duration-200 group-hover:scale-110 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
        <span className="text-xs font-bold tracking-tight text-[var(--md-on-surface)] whitespace-nowrap">
          {isEn ? 'How it works' : 'Jak to funguje'}
        </span>
      </button>
    </div>
  );
};
