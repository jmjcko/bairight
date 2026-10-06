'use client';
import { useI18n } from '@/lib/i18n/I18nContext';

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { AIProviderConfig } from "@/lib/agent/engine-config";
import { useAuth } from "@/lib/auth/AuthContext";
import { GoogleLoginModal } from "@/components/auth/GoogleLoginModal";
import { GoogleClientIdModal } from "@/components/auth/GoogleClientIdModal";

interface UserProfileCapsuleProps {
  userName?: string;
  demoRunsRemaining?: number;
  activeProvider?: AIProviderConfig;
  onOpenSubscriptionModal?: () => void;
  onOpenMemoryModal: () => void;
  onOpenPurchaseHistory?: () => void;
}

export const UserProfileCapsule: React.FC<UserProfileCapsuleProps> = ({
  onOpenMemoryModal,
  onOpenPurchaseHistory,
}) => {
  const { user, logout, isLoginModalOpen, setIsLoginModalOpen, isClientIdModalOpen, setIsClientIdModalOpen } = useAuth();
  const { locale } = useI18n();
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
        className="hidden md:flex items-center gap-1.5 px-3 h-8 rounded-lg bg-[#f4f6f8] hover:bg-[#eceff1] border border-slate-200 text-xs transition-all cursor-pointer group shadow-xs text-[#263238] hover:text-[#0099cc]"
        title={locale === "en" ? "Show personal AI memory, biometrics and history" : "Zobrazit osobní paměť AI, biometrii a historii posudků"}
      >
        <span className="text-xs font-mono font-medium">{locale === "en" ? "AI Memory" : "Paměť AI"}</span>
      </button>

      {/* User Login Button or Profile Capsule */}
      {!user ? (
        <button
          onClick={() => setIsLoginModalOpen(true)}
          className="flex items-center gap-2 px-3 h-8 rounded-lg bg-white hover:bg-[#f4f6f8] border border-slate-200 text-xs font-medium text-[#263238] transition-all cursor-pointer shadow-xs"
          title={locale === "en" ? "Sign in with Google" : "Přihlásit se přes Google"}
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
          <span className="font-semibold text-[#0099cc] font-bold">{locale === "en" ? "Sign in" : "Přihlásit se"}</span>
        </button>
      ) : (
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-2 h-8 rounded-lg bg-[#f4f6f8] hover:bg-[#eceff1] border border-slate-200 transition-all cursor-pointer group text-[#263238]"
            title={`Profil: ${user.name}`}
          >
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-5 h-5 rounded-md object-cover border border-cyan-400/40"
              />
            ) : (
              <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-cyan-600 to-teal-500 flex items-center justify-center text-slate-950 font-bold text-[10px] shadow-sm">
                <span>{user.name.charAt(0).toUpperCase()}</span>
              </div>
            )}
            <span className="hidden lg:inline text-xs font-semibold group-hover:text-cyan-300 transition-colors">
              {user.name.split(" ")[0]}
            </span>
            <ChevronDown className="w-3 h-3 text-[#607d8b] group-hover:text-cyan-300 transition-colors" />
          </button>

          {/* User Profile Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 p-3 rounded-xl bg-white border border-slate-200 shadow-xl z-50 text-[#263238] space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* User Identity Box */}
              <div className="p-3 rounded-xl bg-[#f4f6f8] border border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#e1f5fe] border border-[#b3e5fc] flex items-center justify-center text-[#01579b] font-bold text-xs shrink-0 shadow-xs">
                    {user.name.charAt(0)}
                  </div>
                  <div className="overflow-hidden min-w-0">
                    <p className="text-xs font-bold text-[#263238] truncate">{user.name}</p>
                    <p className="text-[11px] text-[#607d8b] font-mono truncate">{user.email}</p>
                  </div>
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px]">
                  <span className="text-[#546e7a] flex items-center gap-1">
                    Metoda: Google Auth
                  </span>
                  <span className="text-[#0277bd] font-mono font-bold">{locale === "en" ? "Active" : "Aktivní"}</span>
                </div>
              </div>

              {/* Menu Actions */}
              <div className="space-y-1 text-xs">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onOpenMemoryModal();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-[#f4f6f8] text-[#263238] hover:text-[#0277bd] font-medium transition-colors cursor-pointer"
                >
                  <span>{locale === "en" ? "AI Memory & History" : "Paměť AI & Historie"}</span>
                </button>

                {onOpenPurchaseHistory && (
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onOpenPurchaseHistory();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-[#f4f6f8] text-[#263238] hover:text-[#0277bd] font-medium transition-colors cursor-pointer"
                  >
                    <span>{locale === "en" ? "Purchase History" : "Historie nákupů"}</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-rose-50 text-rose-700 hover:text-rose-800 font-medium transition-colors cursor-pointer"
                >
                  <span>{locale === "en" ? "Sign out" : "Odhlásit se"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Login Modal */}
      <GoogleLoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      <GoogleClientIdModal isOpen={isClientIdModalOpen} onClose={() => setIsClientIdModalOpen(false)} />
    </div>
  );
};
