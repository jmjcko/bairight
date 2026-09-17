"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Key, ExternalLink, Check, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";

interface GoogleClientIdModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleClientIdModal: React.FC<GoogleClientIdModalProps> = ({ isOpen, onClose }) => {
  const { googleClientId, setGoogleClientId, loginWithGoogle } = useAuth();
  const [inputVal, setInputVal] = useState(googleClientId);
  const [mounted, setMounted] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [currentOrigin, setCurrentOrigin] = useState("http://localhost:3000");

  useEffect(() => {
    setMounted(true);
    setInputVal(googleClientId);
    if (typeof window !== "undefined") {
      setCurrentOrigin(window.location.origin);
    }
  }, [googleClientId]);

  if (!isOpen || !mounted) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim()) {
      setGoogleClientId(inputVal.trim());
      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
        onClose();
        loginWithGoogle();
      }, 600);
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto my-auto p-6 sm:p-8 rounded-2xl bg-[#09111e]/95 border border-cyan-500/40 shadow-[0_0_50px_rgba(6,182,212,0.25)] text-slate-100 space-y-6"
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

        {/* Modal Header */}
        <div className="space-y-2">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-md">
            <Key className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold font-sans text-slate-100">
            Nastavení Reálného Google Client ID
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Pro přihlášení přes váš osobní/firemní Google účet zadejte Client ID z Google Cloud Console.
          </p>
        </div>

        {/* Quick Instructions */}
        <div className="space-y-2.5 bg-[#060c18] p-4 rounded-xl border border-slate-800 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-cyan-300">Stručný návod ke zprovoznění (1 minutu):</span>
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono hover:underline"
            >
              Google Console <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed">
            <li>V Google Console zvolte <strong>Credentials ➔ Create Credentials ➔ OAuth client ID</strong>.</li>
            <li>Vyberte typ <strong>Web Application</strong>.</li>
            <li>Přidat Authorized JavaScript origin: <code className="bg-slate-900 px-1.5 py-0.5 rounded text-cyan-300">{currentOrigin}</code></li>
            <li>Zkopírujte vygenerované Client ID (končící na <code className="bg-slate-900 px-1 py-0.5 rounded text-slate-400">.apps.googleusercontent.com</code>).</li>
          </ol>
          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 leading-normal">
            💡 <strong>Pro produkční nasazení (Vercel):</strong> Vložte vytvořené Client ID do Vercel projektového nastavení (<em>Project Settings ➔ Environment Variables</em>) pod klíčem <code className="text-cyan-400 bg-slate-900 px-1 py-0.5 rounded">GOOGLE_CLIENT_ID</code>.
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5">
              Google OAuth Client ID:
            </label>
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="např. 1234567890-abc123xyz.apps.googleusercontent.com"
              className="w-full bg-[#050b14] border border-cyan-500/30 focus:border-cyan-400 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder:text-slate-600 outline-none font-mono"
              required
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-100 transition-colors"
            >
              Zrušit
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:brightness-110 text-slate-950 font-bold text-xs transition-all cursor-pointer shadow-md shadow-cyan-950/50"
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4" /> Uloženo!
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Uložit & Spustit Google Přihlášení
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
