'use client';
import { useI18n } from '@/lib/i18n/I18nContext';
import { useTheme } from '@/lib/theme/ThemeContext';

import React, { useState, useEffect, useRef } from "react";
import { 
  ChevronDown, 
  Sparkles, 
  Key, 
  Check, 
  AlertCircle, 
  ShieldCheck, 
  Zap, 
  Cpu, 
  Sliders
} from "lucide-react";
import { 
  SUPPORTED_AI_PROVIDERS, 
  AIProviderId, 
  AIProviderConfig 
} from "@/lib/agent/engine-config";
import { VaultService } from "@/lib/auth/VaultService";

interface HeaderEngineSwitcherProps {
  activeProviderId: AIProviderId;
  onSelectProvider: (providerId: AIProviderId) => void;
  onOpenVaultModal: () => void;
  currentApiKeys?: Record<string, string>;
}

export const HeaderEngineSwitcher: React.FC<HeaderEngineSwitcherProps> = ({
  activeProviderId,
  onSelectProvider,
  onOpenVaultModal,
  currentApiKeys = {},
}) => {
  const { locale } = useI18n();
  const { themeStyle, setThemeStyle } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [keysState, setKeysState] = useState<Record<string, string>>(currentApiKeys);
  const [verificationStatuses, setVerificationStatuses] = useState<Record<string, any>>({});

  const currentKeysString = JSON.stringify(currentApiKeys);
  useEffect(() => {
    const vaultKeys = VaultService.getAllKeys();
    setKeysState((prev) => {
      const merged = { ...currentApiKeys, ...vaultKeys };
      if (JSON.stringify(prev) === JSON.stringify(merged)) return prev;
      return merged;
    });
    const verifs = VaultService.getAllVerificationStatuses();
    setVerificationStatuses((prev) => {
      if (JSON.stringify(prev) === JSON.stringify(verifs)) return prev;
      return verifs;
    });
  }, [activeProviderId, isOpen, currentKeysString]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("mousedown", handleClickOutside);
      return () => window.removeEventListener("mousedown", handleClickOutside);
    }
  }, []);

  const activeProvider = SUPPORTED_AI_PROVIDERS.find((p) => p.id === activeProviderId) || SUPPORTED_AI_PROVIDERS[0];
  const hasKeyForActive = Boolean(keysState[activeProvider.id]?.trim());
  const activeVerif = verificationStatuses[activeProvider.id];
  const isActiveInvalid = Boolean(hasKeyForActive && activeVerif && !activeVerif.isValid);



  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button Capsule */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 h-8 rounded-lg text-xs font-medium border transition-all cursor-pointer shadow-sm backdrop-blur-md ${
          !hasKeyForActive
            ? "bg-amber-950/40 border-amber-500/50 text-amber-200 hover:border-amber-400"
            : isActiveInvalid
            ? "bg-rose-950/50 border-rose-500/60 text-rose-200 hover:border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.2)]"
            : "bg-[#081224]/90 border-cyan-500/30 text-slate-200 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(6,182,212,0.25)]"
        }`}
        title={locale === "en" ? "Switch AI Engine & Manage Keys (BYOK)" : "Přepnout AI Engine & Správu Klíčů (BYOK)"}
      >
        {/* Status Dot */}
        <span className="relative flex h-2 w-2 shrink-0">
          {!hasKeyForActive ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
            </>
          ) : isActiveInvalid ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-400"></span>
            </>
          ) : (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
            </>
          )}
        </span>

        {/* Provider Short Title & BYOK Badge */}
        <div className="flex items-center gap-1.5 font-mono">
          <span className="truncate max-w-[130px] font-semibold">
            {activeProvider.provider}
          </span>
          {!hasKeyForActive ? (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-500/60 text-amber-300 font-mono font-semibold tracking-wide">
              {locale === "en" ? "No key" : "Bez klíče"}
            </span>
          ) : isActiveInvalid ? (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950/90 border border-rose-500/70 text-rose-300 font-mono font-bold tracking-wide">
              {locale === "en" ? "! Invalid key" : "! Neplatný klíč"}
            </span>
          ) : (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#08101d]/98 border border-cyan-500/40 text-cyan-400 font-mono font-medium">
              BYOK
            </span>
          )}
        </div>

        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-[#08101d]/98 border border-cyan-500/40 shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-[120] p-2 space-y-1 backdrop-blur-xl animate-in fade-in duration-150">
          <div className="px-3 py-2 border-b border-slate-800/80 flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 font-semibold tracking-wider uppercase">
              {locale === "en" ? "Select AI Model (BYOK)" : "Výběr AI Modelu (BYOK)"}
            </span>
            <span className="text-[10px] text-cyan-400 font-mono">Real-Time Proxy</span>
          </div>

          <div className="space-y-0.5 max-h-[280px] overflow-y-auto py-1">
            {SUPPORTED_AI_PROVIDERS.map((provider: AIProviderConfig) => {
              const isSelected = provider.id === activeProviderId;
              const hasKey = Boolean(keysState[provider.id]?.trim());

              return (
                <button
                  key={provider.id}
                  onClick={() => {
                    onSelectProvider(provider.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-all cursor-pointer ${
                    isSelected
                      ? "bg-cyan-950/60 border border-cyan-500/50 text-cyan-200 shadow-sm"
                      : "hover:bg-slate-900/80 border border-transparent text-slate-300 hover:text-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="min-w-0">
                      <div className="font-semibold truncate text-slate-200">
                        {provider.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">
                        {provider.modelName}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 pl-2">
                    {(() => {
                      const verif = verificationStatuses[provider.id];
                      if (!hasKey) {
                        return (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-mono bg-amber-950/50 border border-amber-500/30 px-1.5 py-0.5 rounded">
                            <AlertCircle className="w-3 h-3" /> {locale === "en" ? "No Key" : "Bez klíče"}
                          </span>
                        );
                      }
                      if (verif && !verif.isValid) {
                        return (
                          <span className="inline-flex items-center gap-1 text-[10px] text-rose-400 font-mono bg-rose-950/70 border border-rose-500/50 px-1.5 py-0.5 rounded font-semibold">
                            ! {locale === "en" ? "Invalid" : "Neplatný"}
                          </span>
                        );
                      }
                      if (verif && verif.isValid) {
                        return (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-mono bg-emerald-950/50 border border-emerald-500/30 px-1.5 py-0.5 rounded font-medium">
                            <Check className="w-3 h-3" /> OK
                          </span>
                        );
                      }
                      return (
                        <span className="inline-flex items-center gap-1 text-[10px] text-cyan-300 font-mono bg-cyan-950/40 border border-cyan-500/30 px-1.5 py-0.5 rounded">
                          {locale === "en" ? "Entered" : "Zadán"}
                        </span>
                      );
                    })()}
                  </div>
                </button>
              );
            })}
          </div>



          <div className="pt-1.5 border-t border-slate-800/80">
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenVaultModal();
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-[#1d4ed8] to-[#1e345e] hover:from-[#2563eb] hover:to-[#1d4ed8] border border-[#2563eb] text-[#dbeafe] font-semibold text-xs transition-all shadow-sm"
            >
              <span>{locale === "en" ? "Manage API Keys & Vault" : "Správa API klíčů & Vault"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
