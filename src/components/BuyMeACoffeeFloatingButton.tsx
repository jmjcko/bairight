'use client';

import React from 'react';
import { SupportedLocale } from '@/lib/i18n/translations';

interface BuyMeACoffeeFloatingButtonProps {
  onClick: () => void;
  locale: SupportedLocale;
}

export const BuyMeACoffeeFloatingButton: React.FC<BuyMeACoffeeFloatingButtonProps> = ({
  onClick,
  locale,
}) => {
  const isEn = locale === 'en';

  return (
    <div
      aria-label="Support bAIright"
      className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 print:hidden pointer-events-auto !bg-transparent !border-0 !shadow-none p-0 m-0"
    >
      <button
        type="button"
        onClick={onClick}
        aria-label={isEn ? 'Support bAIright on Buy Me a Coffee' : 'Pozvat bAIright na kávu (Buy Me a Coffee)'}
        className="group flex items-center gap-2 px-4 py-2 rounded-full bg-[#0099cc] hover:bg-[#0088b8] active:scale-95 text-white border border-[#33b5e5]/40 shadow-[0_4px_16px_rgba(0,153,204,0.35)] hover:shadow-[0_6px_22px_rgba(0,153,204,0.5)] transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0099cc]/50"
      >
        {/* Minimalist vector coffee cup SVG */}
        <svg
          className="w-4 h-4 text-white transition-transform duration-200 group-hover:scale-110 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
          <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
          <line x1="6" y1="2" x2="6" y2="4" />
          <line x1="10" y1="2" x2="10" y2="4" />
          <line x1="14" y1="2" x2="14" y2="4" />
        </svg>
        <span className="text-xs font-bold tracking-tight text-white whitespace-nowrap">
          {isEn ? 'Buy Me a Coffee' : 'Pozvat na kávu'}
        </span>
      </button>
    </div>
  );
};
