'use client';

import React from 'react';
import { SupportedLocale } from '@/lib/i18n/translations';

interface FeedbackFloatingButtonProps {
  onClick: () => void;
  locale: SupportedLocale;
}

export const FeedbackFloatingButton: React.FC<FeedbackFloatingButtonProps> = ({
  onClick,
  locale,
}) => {
  const isEn = locale === 'en';

  return (
    <div
      aria-label="Community Feedback"
      className="fixed bottom-[58px] sm:bottom-[70px] right-4 sm:right-6 z-40 print:hidden pointer-events-auto bg-transparent border-0 shadow-none p-0 m-0"
    >
      <button
        type="button"
        onClick={onClick}
        aria-label={isEn ? 'Send Feedback & Suggestions' : 'Zpětná vazba a náměty'}
        className="group flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--md-surface,#ffffff)] hover:bg-[var(--md-surface-dim,#f4f6f8)] active:scale-95 text-[#263238] dark:text-[#e4e4e7] border border-slate-200 dark:border-slate-800 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0099cc]/40"
      >
        {/* Minimalist Material Design Outline Message SVG */}
        <svg
          className="w-4 h-4 text-[#0099cc] transition-transform duration-200 group-hover:scale-110 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span className="text-xs font-bold tracking-tight text-[#263238] dark:text-[#e4e4e7] whitespace-nowrap">
          {isEn ? 'Feedback' : 'Zpětná vazba'}
        </span>
      </button>
    </div>
  );
};
