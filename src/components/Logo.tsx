'use client';

import React from 'react';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'material' | 'classic' | 'neural';
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  size = 'md',
  variant = 'material',
  onClick,
}) => {
  const heightPx = size === 'sm' ? 40 : size === 'lg' ? 60 : 52;
  const widthPx = Math.round(heightPx * (926 / 381));

  return (
    <div 
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      aria-label="bAIright — Návrat na hlavní stránku"
      className={`group flex items-center select-none transition-all duration-200 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      title="bAIright — Návrat na hlavní stránku"
    >
      {/* bAIright Capsule Brand Logo */}
      <div 
        className="relative shrink-0 transition-transform group-hover:scale-105" 
        style={{ height: `${heightPx}px`, width: `${widthPx}px` }}
      >
        <Image
          src="/images/bairight-shopping-bag-logo.png"
          alt="bAIright"
          width={926}
          height={381}
          className="object-contain w-full h-full"
          priority
        />
      </div>
    </div>
  );
};
