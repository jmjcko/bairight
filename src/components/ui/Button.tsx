import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  disabled = false,
  children,
  className = '',
  ...props
}) => {
  const baseStyle =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed select-none px-4 py-2 text-sm';

  const variants = {
    primary:
      'bg-[#0099cc] hover:bg-[#0088b8] text-white font-bold shadow-xs focus:ring-[#0099cc]/30 cursor-pointer',
    secondary:
      'bg-white hover:bg-slate-50 text-[#37474f] border border-slate-200 focus:ring-slate-300 cursor-pointer',
    ghost:
      'bg-transparent hover:bg-slate-800/60 text-slate-300 hover:text-white border border-transparent focus:ring-slate-500/50',
    danger:
      'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 focus:ring-red-400/50',
  };

  return (
    <button
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
