"use client";

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
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [keysState, setKeysState] = useState<Record<string, string>>(currentApiKeys);

  useEffect(() => {
    const vaultKeys = VaultService.getAllKeys();
    setKeysState((prev) => {
      const merged = { ...currentApiKeys, ...vaultKeys };
      if (JSON.stringify(prev) === JSON.stringify(merged)) return prev;
      return merged;
    });
  }, [activeProviderId, isOpen, currentApiKeys]);

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

  const getProviderIcon = (id: AIProviderId) => {
    switch (id) {
      case "anthropic_claude":
        return <Cpu className="w-3.5 h-3.5 text-purple-400" />;
      case "google_gemini":
        return <Zap className="w-3.5 h-3.5 text-sky-400" />;
      case "openai_gpt4o":
        return <Sparkles className="w-3.5 h-3.5 text-teal-400" />;
      default:
        return <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button Capsule */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer shadow-sm backdrop-blur-md ${
          hasKeyForActive
            ? "bg-[#081224]/90 border-cyan-500/40 text-slate-200 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(6,182,212,0.25)]"
            : "bg-amber-950/40 border-amber-500/50 text-amber-200 hover:border-amber-400"
        }`}
        title="Přepnout AI Engine & Správu Klíčů (BYOK)"
      >
        {/* Status Dot */}
        <span className="relative flex h-2 w-2 shrink-0">
          {hasKeyForActive ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
            </>
          ) : (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
            </>
          )}
        </span>

        {/* Provider Icon & Short Title */}
        <div className="flex items-center gap-1.5 font-mono">
          {getProviderIcon(activeProvider.id)}
          <span className="truncate max-w-[130px] font-semibold">
            {activeProvider.provider}
          </span>
          <span className="text-[10px] px-1 py-0.2 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 font-mono">
            BYOK
          </span>
        </div>

        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-[#08101d]/98 border border-cyan-500/40 shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-[120] p-2 space-y-1 backdrop-blur-xl animate-in fade-in duration-150">
          <div className="px-3 py-2 border-b border-slate-800/80 flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 font-semibold tracking-wider uppercase">
              Výběr AI Modelu (BYOK)
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
                    <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                      {getProviderIcon(provider.id)}
                    </div>
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
                    {hasKey ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-mono bg-emerald-950/50 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                        <Check className="w-3 h-3" /> OK
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-mono bg-amber-950/50 border border-amber-500/30 px-1.5 py-0.5 rounded">
                        <AlertCircle className="w-3 h-3" /> Bez klíče
                      </span>
                    )}
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
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-950 to-teal-950 hover:from-cyan-900 hover:to-teal-900 border border-cyan-500/40 text-cyan-300 font-semibold text-xs transition-all shadow-sm"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Spravovat API klíče & Vault</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
