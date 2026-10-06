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
  let borderStyle = 'border-slate-200/80 hover:border-slate-300 bg-white shadow-xs text-[#263238]';

  if (error) {
    borderStyle = 'border-red-500/50 bg-red-950/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]';
  } else if (active) {
    borderStyle =
      'border-[#0099cc] bg-[#f0f9ff] shadow-xs text-[#263238]';
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
