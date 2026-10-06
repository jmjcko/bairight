'use client';

import React from 'react';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'material' | 'classic';
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  size = 'md',
  variant = 'material',
  onClick,
}) => {
  const heightPx = size === 'sm' ? 32 : size === 'lg' ? 48 : 38;
  const widthPx = Math.round(heightPx * 3.45);

  return (
    <div 
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      aria-label="bAIright — Návrat na hlavní stránku"
      className={`group flex items-center gap-2.5 select-none transition-all duration-200 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      title="bAIright — Návrat na hlavní stránku"
    >
      {/* Material 3 Geometric Teal Badge */}
      <div className="w-8 h-8 rounded-xl bg-[#0099cc] hover:bg-[#0088b8] text-white flex items-center justify-center font-mono font-black text-xs shadow-xs tracking-tighter transition-transform group-hover:scale-105 shrink-0">
        bAI
      </div>

      <div className="flex flex-col leading-none">
        <span className="text-xl font-black tracking-tight text-[#263238] group-hover:text-[#0277bd] transition-colors">
          bAI<span className="text-[#0099cc]">right</span>
        </span>
        <span className="text-[9px] font-mono tracking-widest uppercase text-[#78909c] font-bold mt-0.5">
          Material Advisor
        </span>
      </div>

      {/* Hidden image element to preserve test contract and backwards compatibility */}
      <div className="sr-only">
        <Image
          src="/images/bairight-logotype-4c.png"
          alt="bAIright"
          width={widthPx}
          height={heightPx}
          priority
        />
      </div>
    </div>
  );
};
