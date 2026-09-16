"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, LogIn } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";

interface GoogleLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleLoginModal: React.FC<GoogleLoginModalProps> = ({ isOpen, onClose }) => {
  const {
    loginWithGoogle,
    isLoading,
    googleClientId,
    handleGoogleCredentialResponse,
  } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [hasRenderedGis, setHasRenderedGis] = useState(false);
  const gisButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize native Google GIS Sign-In button
  useEffect(() => {
    if (!isOpen || !mounted || !googleClientId) return;

    const timer = setTimeout(() => {
      if (typeof window !== "undefined" && (window as any).google?.accounts?.id && gisButtonRef.current) {
        const google = (window as any).google;
        google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (response: any) => {
            if (response.credential) {
              handleGoogleCredentialResponse(response.credential);
            }
          },
        });

        gisButtonRef.current.innerHTML = "";
        google.accounts.id.renderButton(gisButtonRef.current, {
          theme: "filled_blue",
          size: "large",
          width: 320,
          text: "continue_with",
          shape: "pill",
        });
        setHasRenderedGis(true);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isOpen, mounted, googleClientId, handleGoogleCredentialResponse]);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-sm max-h-[90vh] overflow-y-auto my-auto p-6 sm:p-8 rounded-2xl bg-[#09111e]/95 border border-cyan-500/40 shadow-[0_0_50px_rgba(6,182,212,0.25)] text-slate-100 space-y-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition-colors cursor-pointer"
          title="Zavřít"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Minimal Header */}
        <div className="space-y-2 pt-2">
          <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600/30 to-teal-500/30 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-md">
            <LogIn className="w-6 h-6 text-cyan-400" />
          </div>
          <h2 className="text-xl font-bold font-sans text-slate-100">
            Přihlášení do bAIright
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Pokračujte pomocí vašeho Google účtu
          </p>
        </div>

        {/* Clean Single Google Sign-In Container */}
        <div className="py-2 flex flex-col items-center justify-center min-h-[50px]">
          {/* Native Google GIS Button Container */}
          <div 
            ref={gisButtonRef} 
            className={`flex justify-center w-full min-h-[44px] ${hasRenderedGis ? "block" : "hidden"}`}
          ></div>

          {/* Fallback button rendered ONLY if native GIS button hasn't rendered */}
          {!hasRenderedGis && (
            <button
              onClick={() => loginWithGoogle()}
              disabled={isLoading}
              className="w-full max-w-[320px] flex items-center justify-center gap-3 px-5 py-3 rounded-full bg-slate-900 hover:bg-slate-850 border border-cyan-500/40 hover:border-cyan-400 text-slate-100 font-semibold text-sm transition-all shadow-md cursor-pointer hover:shadow-[0_0_20px_rgba(6,182,212,0.25)]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.29v3.15C3.26 21.3 7.31 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.29C.47 8.21 0 10.05 0 12s.47 3.79 1.29 5.42l3.99-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.58l3.99 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span>Pokračovat pomocí Googlu</span>
            </button>
          )}
        </div>

        {/* Footer info */}
        <p className="text-[11px] text-slate-500 pt-2">
          Přihlášením souhlasíte s podmínkami použití bAIright a zásadami ochrany osobních údajů.
        </p>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
