"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  Key, 
  Zap, 
  ExternalLink, 
  Check, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Sparkles, 
  Eye, 
  EyeOff, 
  Loader2,
  Trash2,
  CreditCard,
  Lock,
  Cpu
} from "lucide-react";
import { 
  SUPPORTED_AI_PROVIDERS, 
  AIProviderId, 
  AIProviderConfig 
} from "@/lib/agent/engine-config";
import { VaultService } from "@/lib/auth/VaultService";

interface AIEngineSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProviderId: AIProviderId;
  onSaveProvider: (providerId: AIProviderId, apiKeys: Record<string, string>) => void;
  currentApiKeys?: Record<string, string>;
  demoRunsRemaining?: number;
}

export const AIEngineSubscriptionModal: React.FC<AIEngineSubscriptionModalProps> = ({
  isOpen,
  onClose,
  activeProviderId,
  onSaveProvider,
  currentApiKeys = {},
}) => {
  const [activeId, setActiveId] = useState<AIProviderId>(activeProviderId);
  const [activeTab, setActiveTab] = useState<"api_keys" | "subscriptions">("api_keys");
  const [apiKeys, setApiKeys] = useState<Record<string, string>>(currentApiKeys);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [testStatus, setTestStatus] = useState<Record<string, { loading: boolean; ok?: boolean; message?: string }>>({});
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setActiveId(activeProviderId);
  }, [activeProviderId]);

  useEffect(() => {
    const vaultKeys = VaultService.getAllKeys();
    setApiKeys({ ...currentApiKeys, ...vaultKeys });
  }, [currentApiKeys, isOpen]);

  if (!isOpen) return null;

  const handleRemoveKey = (providerId: string) => {
    VaultService.removeApiKey(providerId);
    setApiKeys((prev) => {
      const next = { ...prev };
      delete next[providerId];
      return next;
    });
    setTestStatus((prev) => ({ ...prev, [providerId]: { loading: false } }));
  };

  const handleKeyChange = (providerId: string, val: string) => {
    const next = { ...apiKeys, [providerId]: val };
    setApiKeys(next);
    setTestStatus((prev) => ({ ...prev, [providerId]: { loading: false } }));
  };

  const toggleShowKey = (providerId: string) => {
    setShowKey((prev) => ({ ...prev, [providerId]: !prev[providerId] }));
  };

  const handleTestKey = async (providerId: string) => {
    const key = apiKeys[providerId]?.trim();
    if (!key) {
      setTestStatus((prev) => ({
        ...prev,
        [providerId]: { loading: false, ok: false, message: "Prosím nejprve vložte API klíč." },
      }));
      return;
    }

    setTestStatus((prev) => ({ ...prev, [providerId]: { loading: true } }));

    try {
      const res = await fetch("/api/agent/test-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId, apiKey: key }),
      });
      const data = await res.json();

      if (res.ok && data.valid) {
        setTestStatus((prev) => ({
          ...prev,
          [providerId]: { loading: false, ok: true, message: data.message || "Klíč je platný a ověřený! 🎉" },
        }));
      } else {
        setTestStatus((prev) => ({
          ...prev,
          [providerId]: { loading: false, ok: false, message: data.error || data.message || "Ověření klíče selhalo." },
        }));
      }
    } catch {
      setTestStatus((prev) => ({
        ...prev,
        [providerId]: { loading: false, ok: false, message: "Chyba sítě při testu klíče." },
      }));
    }
  };

  const handleSave = () => {
    // Save to VaultService
    Object.entries(apiKeys).forEach(([pid, k]) => {
      VaultService.saveApiKey(pid, k);
    });

    onSaveProvider(activeId, apiKeys);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 600);
  };

  const selectedProvider = SUPPORTED_AI_PROVIDERS.find((p) => p.id === activeId) || SUPPORTED_AI_PROVIDERS[0];

  return (
    <div 
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col my-auto rounded-3xl bg-[#070e1b]/98 border border-cyan-500/40 shadow-[0_0_60px_rgba(6,182,212,0.25)] text-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-cyan-500/20 bg-[#091325] relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-md">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-sans text-white">
                AI Engine & Provider Vault (BYOK)
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Vyberte AI model a propojte své vlastní předplatné nebo API klíče
              </p>
            </div>
          </div>

          {/* Connection Tabs */}
          <div className="flex items-center gap-2 mt-4 pt-2 border-t border-slate-800/80 font-mono text-xs">
            <button
              onClick={() => setActiveTab("api_keys")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                activeTab === "api_keys"
                  ? "bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-sm"
                  : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>API Klíče (Developer)</span>
            </button>
            <button
              onClick={() => setActiveTab("subscriptions")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                activeTab === "subscriptions"
                  ? "bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-sm"
                  : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>OAuth Předplatné (ChatGPT / Claude / Gemini)</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 max-h-[55vh]">
          {activeTab === "subscriptions" ? (
            /* Subscriptions Tab */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#060c18] border border-cyan-500/30 space-y-3 text-xs">
                <div className="flex items-center gap-2 text-cyan-300 font-semibold font-mono">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Propojení Zákaznického Předplatného (ChatGPT Plus, Claude Pro, Gemini Advanced)</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11.5px]">
                  Pokud nemáte vývojářský API klíč, můžete si aplikaci bAIright propojit se svým účtem u OpenAI, Anthropic nebo Google. Květnové aktualizace API umožňují ověřit aktivní Plus/Pro tarif.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5 text-center">
                    <span className="font-bold text-slate-200 block text-xs">ChatGPT Plus / Team</span>
                    <button 
                      onClick={() => alert("Pro OAuth propojení s ChatGPT Plus zadejte vývojářský API klíč v záložce API Klíče, nebo se přihlaste přes OpenAI OAuth.")}
                      className="w-full py-1.5 px-2 rounded-lg bg-teal-950 border border-teal-500/40 text-teal-300 text-[10.5px] font-mono hover:bg-teal-900 cursor-pointer"
                    >
                      Propojit OpenAI
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5 text-center">
                    <span className="font-bold text-slate-200 block text-xs">Claude Pro / Max</span>
                    <button 
                      onClick={() => alert("Pro propojení s Claude Pro zadejte váš Anthropic API klíč v záložce API Klíče.")}
                      className="w-full py-1.5 px-2 rounded-lg bg-purple-950 border border-purple-500/40 text-purple-300 text-[10.5px] font-mono hover:bg-purple-900 cursor-pointer"
                    >
                      Propojit Claude
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5 text-center">
                    <span className="font-bold text-slate-200 block text-xs">Gemini Advanced</span>
                    <button 
                      onClick={() => alert("V Google AI Studio je k dispozici velkorysý bezplatný tier bez nutnosti kreditní karty!")}
                      className="w-full py-1.5 px-2 rounded-lg bg-sky-950 border border-sky-500/40 text-sky-300 text-[10.5px] font-mono hover:bg-sky-900 cursor-pointer"
                    >
                      Získat Google Key
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 font-mono text-center">
                💡 Tip: Nejrychlejší spuštění bezplatného vlastního modelu nabízí <strong>Google AI Studio</strong> (100% zdarma).
              </p>
            </div>
          ) : (
            /* API Keys Tab */
            <div className="space-y-3.5">
              {SUPPORTED_AI_PROVIDERS.map((provider: AIProviderConfig) => {
                const isSelected = provider.id === activeId;
                const hasKey = Boolean(apiKeys[provider.id]?.trim());

                return (
                  <div
                    key={provider.id}
                    onClick={() => setActiveId(provider.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#0b162a] border-cyan-400 shadow-lg shadow-cyan-950/40"
                        : "bg-[#060c18] border-slate-800 hover:border-slate-700 hover:bg-[#081020]"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          checked={isSelected}
                          onChange={() => setActiveId(provider.id)}
                          className="w-4 h-4 text-cyan-500 bg-slate-900 border-slate-700 focus:ring-cyan-500"
                        />
                        <span className="font-extrabold text-sm text-white">
                          {provider.name}
                        </span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${provider.badgeColor}`}>
                          {provider.tag}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                        <span>Paměť: {provider.contextWindow}</span>
                        {provider.requiresKey && (
                          <span className={`px-1.5 py-0.5 rounded ${hasKey ? "bg-cyan-950 text-cyan-300 border border-cyan-500/40" : "bg-slate-800 text-slate-400"}`}>
                            {hasKey ? "✓ Klíč zadán" : "Vyžaduje klíč"}
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed pl-6">
                      {provider.description}
                    </p>

                    {isSelected && provider.requiresKey && (
                      <div 
                        className="mt-3.5 pl-6 pt-3 border-t border-cyan-500/15 space-y-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
                            <Key className="w-3.5 h-3.5" />
                            <span>Váš {provider.provider} API Klíč:</span>
                          </label>
                          {provider.apiKeyHelpUrl && (
                            <a
                              href={provider.apiKeyHelpUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-cyan-400 hover:text-cyan-300 underline flex items-center gap-1 font-mono"
                            >
                              <span>Získat klíč</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="relative flex-1 flex items-center">
                            <input
                              type={showKey[provider.id] ? "text" : "password"}
                              value={apiKeys[provider.id] || ""}
                              onChange={(e) => handleKeyChange(provider.id, e.target.value)}
                              placeholder={provider.placeholderKey || "Zadejte API klíč..."}
                              className="w-full bg-[#050a14] border border-cyan-500/30 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 outline-none pr-10 font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => toggleShowKey(provider.id)}
                              className="absolute right-3 text-slate-400 hover:text-slate-200 cursor-pointer"
                            >
                              {showKey[provider.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>

                          {apiKeys[provider.id] && (
                            <button
                              type="button"
                              onClick={() => handleRemoveKey(provider.id)}
                              title="Odstranit klíč z Vaultu"
                              className="px-2.5 py-2.5 rounded-xl text-xs font-semibold bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 hover:text-white transition-all flex items-center gap-1 shrink-0 cursor-pointer font-mono"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Odstranit</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleTestKey(provider.id)}
                            disabled={testStatus[provider.id]?.loading}
                            className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 hover:text-white transition-all flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50 font-mono"
                          >
                            {testStatus[provider.id]?.loading ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Testuji...</span>
                              </>
                            ) : (
                              <>
                                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                                <span>Test klíče</span>
                              </>
                            )}
                          </button>
                        </div>

                        {testStatus[provider.id]?.message && (
                          <div
                            className={`p-2.5 rounded-xl text-xs flex items-center gap-2 animate-in fade-in duration-200 border ${
                              testStatus[provider.id]?.ok
                                ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
                                : "bg-rose-950/60 border-rose-500/40 text-rose-300"
                            }`}
                          >
                            {testStatus[provider.id]?.ok ? (
                              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                            ) : (
                              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                            )}
                            <span className="leading-tight">{testStatus[provider.id]?.message}</span>
                          </div>
                        )}

                        <p className="text-[10px] text-slate-400 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span>Klíč se ukládá výhradně šifrovaně v Client Vault úložišti vašeho prohlížeče.</span>
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-cyan-500/20 bg-[#081222] flex items-center justify-between">
          <div className="text-xs text-slate-400 font-mono">
            Aktivní volba: <strong className="text-cyan-300">{selectedProvider.name}</strong>
          </div>

          <div className="flex items-center gap-3 font-mono">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all cursor-pointer"
            >
              Zrušit
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:brightness-110 text-slate-950 font-bold text-xs transition-all cursor-pointer shadow-lg shadow-cyan-950/50"
            >
              {isSaved ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              <span>{isSaved ? "Aktivováno!" : "Aktivovat & Uložit Vault"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
