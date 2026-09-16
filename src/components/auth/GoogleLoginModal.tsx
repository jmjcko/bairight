"use client";

import React from "react";
import { X, Sparkles, Shield, Database, LogIn } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useI18n } from "@/lib/i18n/I18nContext";

interface GoogleLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleLoginModal: React.FC<GoogleLoginModalProps> = ({ isOpen, onClose }) => {
  const { loginWithGoogle, isLoading } = useAuth();
  const { t } = useI18n();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md p-6 sm:p-8 rounded-2xl bg-[#09111e]/95 border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.15)] text-slate-100 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition-colors"
          title="Zavřít"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600/30 to-teal-500/30 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-md">
            <LogIn className="w-6 h-6 text-cyan-400" />
          </div>
          <h2 className="text-xl font-bold font-sans text-slate-100">
            Přihlášení do bAIright
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Odemkněte plný potenciál AI nákupního poradce
          </p>
        </div>

        {/* Key Benefits */}
        <div className="space-y-3 bg-[#060c18] p-4 rounded-xl border border-slate-800/80 text-xs">
          <div className="flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200">Persistovaný výzkum Luke</span>
              <p className="text-slate-400 text-[11px]">Ukládejte si nalezené parametry a vygenerované prompty do svého profilu.</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Database className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200">Osobní RAG Paměť</span>
              <p className="text-slate-400 text-[11px]">Synchroizujte své preference, velikosti a biomechanická data.</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200">Ochrana soukromí & BYOK</span>
              <p className="text-slate-400 text-[11px]">Klíče API jsou bezpečně uchovávány a nikdy neuniknou do bundle.</p>
            </div>
          </div>
        </div>

        {/* Google OAuth Login Button */}
        <div className="space-y-3">
          <button
            onClick={() => loginWithGoogle()}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700 hover:border-cyan-400/60 text-slate-100 font-medium text-sm transition-all shadow-md group cursor-pointer hover:shadow-[0_0_20px_rgba(6,182,212,0.25)]"
          >
            {/* Google Icon SVG */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.29v3.15C3.26 21.3 7.31 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.29C.47 8.21 0 10.05 0 12s.47 3.79 1.29 5.42l3.99-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.58l3.99 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>{isLoading ? "Přihlašování..." : "Pokračovat přes Google"}</span>
          </button>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-slate-500">
          Přihlášením souhlasíte s podmínkami použití bAIright a zásadami ochrany osobních údajů.
        </p>
      </div>
    </div>
  );
};
