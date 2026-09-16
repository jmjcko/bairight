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
      'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold shadow-[0_0_15px_rgba(6,182,212,0.4)] focus:ring-cyan-400/50',
    secondary:
      'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-500 focus:ring-slate-500/50',
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
