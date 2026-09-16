import React from 'react';

export interface CardProps {
  active?: boolean;
  error?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  active = false,
  error = false,
  onClick,
  children,
  className = '',
}) => {
  let borderStyle = 'border-slate-800 hover:border-slate-600 bg-slate-900/60';

  if (error) {
    borderStyle = 'border-red-500/50 bg-red-950/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]';
  } else if (active) {
    borderStyle =
      'border-cyan-500/60 bg-cyan-950/20 shadow-[0_0_20px_rgba(6,182,212,0.25)]';
  }

  return (
    <div
      onClick={onClick}
      className={`rounded-xl border p-4 backdrop-blur-md transition-all duration-200 ${
        onClick ? 'cursor-pointer select-none' : ''
      } ${borderStyle} ${className}`}
    >
      {children}
    </div>
  );
};
