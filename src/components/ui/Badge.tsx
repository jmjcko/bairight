import React from 'react';

export interface BadgeProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  active = false,
  onClick,
  className = '',
}) => {
  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full transition-all duration-200 cursor-pointer select-none ${
        active
          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
          : 'bg-slate-800/60 text-slate-300 border border-slate-700/50 hover:border-slate-500 hover:text-white'
      } ${className}`}
    >
      {label}
    </span>
  );
};
