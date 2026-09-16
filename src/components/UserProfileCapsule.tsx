"use client";

import React, { useState, useRef, useEffect } from "react";
import { Database, User, LogOut, Shield, ChevronDown, Sparkles } from "lucide-react";
import { AIProviderConfig } from "@/lib/agent/engine-config";
import { useAuth } from "@/lib/auth/AuthContext";
import { GoogleLoginModal } from "@/components/auth/GoogleLoginModal";

interface UserProfileCapsuleProps {
  userName?: string;
  demoRunsRemaining?: number;
  activeProvider?: AIProviderConfig;
  onOpenSubscriptionModal?: () => void;
  onOpenMemoryModal: () => void;
  onOpenPaletteModal?: () => void;
}

export const UserProfileCapsule: React.FC<UserProfileCapsuleProps> = ({
  onOpenMemoryModal,
}) => {
  const { user, logout, isLoginModalOpen, setIsLoginModalOpen } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 relative" ref={dropdownRef}>
      {/* RAG Memory Quick Button */}
      <button
        onClick={onOpenMemoryModal}
        className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#06101e] hover:bg-cyan-950/60 border border-cyan-500/25 hover:border-cyan-400/50 text-xs transition-all cursor-pointer group shadow-sm text-slate-300 hover:text-cyan-300"
        title="Zobrazit uložená fakta a paměť (RAG kontext)"
      >
        <Database className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
        <span className="text-xs font-mono font-medium">RAG</span>
      </button>

      {/* User Login Button or Profile Capsule */}
      {!user ? (
        <button
          onClick={() => setIsLoginModalOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 hover:border-cyan-400 text-xs font-medium text-slate-100 transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]"
          title="Přihlásit se přes Google"
        >
          {/* Google Icon SVG */}
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
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
          <span className="font-semibold text-cyan-300">Přihlásit se</span>
        </button>
      ) : (
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 p-1 pr-2.5 rounded-lg bg-[#060c18] border border-cyan-500/30 hover:border-cyan-400/60 transition-all cursor-pointer group text-slate-200"
            title={`Profil: ${user.name}`}
          >
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-6 h-6 rounded-md object-cover border border-cyan-400/40"
              />
            ) : (
              <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-cyan-600 to-teal-500 flex items-center justify-center text-slate-950 font-bold text-xs shadow-sm">
                <User className="w-3.5 h-3.5 text-slate-950" />
              </div>
            )}
            <span className="hidden lg:inline text-xs font-semibold group-hover:text-cyan-300 transition-colors">
              {user.name.split(" ")[0]}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-cyan-300 transition-colors" />
          </button>

          {/* User Profile Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 p-3 rounded-xl bg-[#09111e]/95 border border-cyan-500/30 shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-xl z-50 text-slate-100 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* User Identity */}
              <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold text-xs">
                    {user.name.charAt(0)}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-slate-100 truncate">{user.name}</p>
                    <p className="text-[11px] text-slate-400 font-mono truncate">{user.email}</p>
                  </div>
                </div>
                <div className="mt-2 pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Shield className="w-3 h-3 text-teal-400" /> Metoda: Google Auth
                  </span>
                  <span className="text-cyan-400 font-mono">Aktivní</span>
                </div>
              </div>

              {/* Menu Actions */}
              <div className="space-y-1 text-xs">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onOpenMemoryModal();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-slate-850 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Spravovat RAG paměť</span>
                </button>

                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-rose-950/50 text-rose-300 hover:text-rose-200 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>Odhlásit se</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Login Modal */}
      <GoogleLoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </div>
  );
};
