'use client';

import React from 'react';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  size = 'md',
  onClick,
}) => {
  // Dominant, high-impact sizing based on Concept 4C (aspect ratio ~3.45:1)
  const heightPx = size === 'sm' ? 34 : size === 'lg' ? 62 : 48;
  const widthPx = Math.round(heightPx * 3.45);

  return (
    <div 
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      aria-label="bAIright — Návrat na hlavní stránku"
      className={`group relative flex items-center select-none transition-all duration-300 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      title="bAIright — Návrat na hlavní stránku"
    >
      {/* Soft Ambient Neon Glow Behind the 3D AI Ribbon */}
      <div className="absolute inset-x-4 inset-y-1 bg-cyan-400/20 rounded-full blur-xl group-hover:bg-cyan-400/35 transition-all duration-500 pointer-events-none" />
      
      <div className="relative flex items-center">
        <Image
          src="/images/bairight-logotype-4c.png"
          alt="bAIright"
          width={widthPx}
          height={heightPx}
          className="w-auto object-contain drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)] group-hover:drop-shadow-[0_4px_22px_rgba(6,182,212,0.85)] transform group-hover:scale-105 transition-all duration-300 ease-out"
          style={{ height: `${heightPx}px`, width: 'auto' }}
          priority
        />
      </div>
    </div>
  );
};




