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
          ? 'bg-[#e1f5fe] text-[#01579b] border border-[#b3e5fc] font-bold shadow-xs'
          : 'bg-[#f4f6f8] text-[#607d8b] border border-slate-200 hover:bg-slate-200 hover:text-[#263238]'
      } ${className}`}
    >
      {label}
    </span>
  );
};
