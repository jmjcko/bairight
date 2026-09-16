import React from 'react';

export interface ToastProps {
  type?: 'success' | 'error' | 'info';
  message: string;
  onClose?: () => void;
  className?: string;
}

export const Toast: React.FC<ToastProps> = ({
  type = 'info',
  message,
  onClose,
  className = '',
}) => {
  const styles = {
    success:
      'bg-teal-950/80 border-teal-500/50 text-teal-200 shadow-[0_0_15px_rgba(20,184,166,0.3)]',
    error:
      'bg-red-950/80 border-red-500/50 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.3)]',
    info: 'bg-cyan-950/80 border-cyan-500/50 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.3)]',
  };

  return (
    <div
      className={`fixed bottom-5 right-5 z-50 flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm font-medium backdrop-blur-md transition-all duration-300 ${styles[type]} ${className}`}
    >
      <span>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-2 text-slate-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      )}
    </div>
  );
};
