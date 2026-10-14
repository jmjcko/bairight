'use client';

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { SupportedLocale } from "@/lib/i18n/translations";

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  badge?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  locale: SupportedLocale;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  badge,
  message,
  confirmLabel,
  cancelLabel,
  isDestructive = true,
  locale = "cs",
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const isEn = locale === "en";
  const effectiveCancelLabel = cancelLabel || (isEn ? "Cancel" : "Zrušit");
  const effectiveConfirmLabel =
    confirmLabel ||
    (isDestructive
      ? isEn
        ? "Delete"
        : "Smazat"
      : isEn
      ? "Confirm"
      : "Potvrdit");

  const defaultBadge = isDestructive
    ? isEn
      ? "ACTION REQUIRED • CONFIRMATION"
      : "POTVRZENÍ AKCE"
    : isEn
    ? "NOTICE"
    : "UPOZORNĚNÍ";

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-description"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-[#1a1f24] border border-slate-200 dark:border-[#283038] rounded-2xl shadow-2xl p-6 relative text-left space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <span
              className={`inline-block text-[10px] font-mono font-bold tracking-widest uppercase px-2 py-0.5 rounded border mb-1.5 ${
                isDestructive
                  ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900/50"
                  : "bg-[#e1f5fe]/80 text-[#01579b] border-[#0099cc]/20 dark:bg-cyan-950/80 dark:text-cyan-300 dark:border-cyan-800/50"
              }`}
            >
              {badge || defaultBadge}
            </span>
            <h2
              id="confirm-modal-title"
              className="text-lg font-bold text-[#263238] dark:text-[#e3e7eb] tracking-tight leading-snug"
            >
              {title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#607d8b] dark:text-[#9ba6b0] hover:text-[#263238] dark:hover:text-white transition-colors cursor-pointer font-mono text-sm leading-none shrink-0"
            aria-label={isEn ? "Close" : "Zavřít"}
          >
            ✕
          </button>
        </div>

        {/* Message */}
        <p
          id="confirm-modal-description"
          className="text-sm text-[#607d8b] dark:text-[#9ba6b0] leading-relaxed whitespace-pre-line"
        >
          {message}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#283038]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-[#263238] dark:text-[#e3e7eb] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            {effectiveCancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 rounded-xl text-sm font-medium text-white shadow-sm transition-colors cursor-pointer ${
              isDestructive
                ? "bg-[#ef5350] hover:bg-[#e53935] dark:bg-rose-600 dark:hover:bg-rose-500"
                : "bg-[#0099cc] hover:bg-[#0088b8] dark:bg-cyan-600 dark:hover:bg-cyan-500"
            }`}
          >
            {effectiveConfirmLabel}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
