'use client';

import React, { useState, useEffect } from "react";
import { 
  SUPPORTED_AI_PROVIDERS, 
  AIProviderId, 
  AIProviderConfig 
} from "@/lib/agent/engine-config";
import { VaultService } from "@/lib/auth/VaultService";
import { useI18n } from "@/lib/i18n/I18nContext";

interface AIEngineSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProviderId: AIProviderId;
  onSaveProvider: (providerId: AIProviderId, apiKeys: Record<string, string>) => void;
  currentApiKeys?: Record<string, string>;
  demoRunsRemaining?: number;
}

const EMPTY_KEYS: Record<string, string> = {};

export const AIEngineSubscriptionModal: React.FC<AIEngineSubscriptionModalProps> = ({
  isOpen,
  onClose,
  activeProviderId,
  onSaveProvider,
  currentApiKeys = EMPTY_KEYS,
  demoRunsRemaining = 3,
}) => {
  const { locale } = useI18n();
  const isEn = locale === 'en';

  const [activeId, setActiveId] = useState<AIProviderId>(activeProviderId);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [testStatus, setTestStatus] = useState<Record<string, { loading: boolean; ok?: boolean; message?: string }>>({});
  const [verificationStatuses, setVerificationStatuses] = useState<Record<string, any>>({});
  const [isSaved, setIsSaved] = useState<boolean>(false);

  useEffect(() => {
    setActiveId(activeProviderId);
  }, [activeProviderId]);

  const currentKeysString = JSON.stringify(currentApiKeys);
  useEffect(() => {
    const vaultKeys = VaultService.getAllKeys();
    setApiKeys({ ...currentApiKeys, ...vaultKeys });
    setVerificationStatuses(VaultService.getAllVerificationStatuses());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentKeysString, isOpen]);

  if (!isOpen) return null;

  const handleRemoveKey = (providerId: string) => {
    VaultService.removeApiKey(providerId);
    setApiKeys((prev) => {
      const next = { ...prev };
      delete next[providerId];
      return next;
    });
    setTestStatus((prev) => {
      const next = { ...prev };
      delete next[providerId];
      return next;
    });
    setVerificationStatuses(VaultService.getAllVerificationStatuses());
  };

  const handleKeyChange = (providerId: string, val: string) => {
    setApiKeys((prev) => ({
      ...prev,
      [providerId]: val,
    }));
    setTestStatus((prev) => {
      const next = { ...prev };
      delete next[providerId];
      return next;
    });
    setVerificationStatuses((prev) => {
      const next = { ...prev };
      delete next[providerId];
      return next;
    });
    VaultService.clearKeyVerificationStatus(providerId);
  };

  const toggleShowKey = (providerId: string) => {
    setShowKey((prev) => ({
      ...prev,
      [providerId]: !prev[providerId],
    }));
  };

  const handleTestKey = async (providerId: string) => {
    const key = apiKeys[providerId];
    if (!key) {
      setTestStatus((prev) => ({
        ...prev,
        [providerId]: {
          loading: false,
          ok: false,
          message: isEn ? 'Please enter an API key first' : 'Nejprve zadejte API klíč',
        },
      }));
      return;
    }

    setTestStatus((prev) => ({
      ...prev,
      [providerId]: { loading: true },
    }));

    try {
      const res = await fetch("/api/agent/test-key", {

        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId, apiKey: key }),
      });
      const data = await res.json();
      const isValid = Boolean(data.ok || data.valid);

      VaultService.setKeyVerificationStatus(providerId, isValid, data.error, data.model);
      setVerificationStatuses(VaultService.getAllVerificationStatuses());

      setTestStatus((prev) => ({
        ...prev,
        [providerId]: {
          loading: false,
          ok: isValid,
          message: isValid 
            ? (data.message || (isEn ? 'API key is valid & working!' : 'API klíč je plně funkční a ověřen!'))
            : (data.error || (isEn ? 'Verification failed' : 'Ověření selhalo')),
        },
      }));
    } catch {
      setTestStatus((prev) => ({
        ...prev,
        [providerId]: {
          loading: false,
          ok: false,
          message: isEn ? 'Network error during verification' : 'Chyba sítě při ověřování',
        },
      }));
    }
  };

  const selectedProvider = SUPPORTED_AI_PROVIDERS.find((p) => p.id === activeId) || SUPPORTED_AI_PROVIDERS[0];
  const selectedTest = testStatus[activeId];
  const selectedVerif = verificationStatuses[activeId];
  const isSelectedKeyFailed = Boolean(
    selectedProvider.requiresKey &&
    apiKeys[activeId]?.trim() &&
    (selectedTest ? (!selectedTest.ok && !selectedTest.loading) : (selectedVerif && !selectedVerif.isValid))
  );

  const handleSave = () => {
    if (isSelectedKeyFailed) return;

    Object.entries(apiKeys).forEach(([pid, k]) => {
      VaultService.saveApiKey(pid, k);
    });

    onSaveProvider(activeId, apiKeys);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 450);
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div 
        className="w-full max-w-2xl bg-[#070d18] border border-cyan-500/40 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col relative text-left my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Monospace Tag */}
        <div className="p-5 sm:p-6 border-b border-cyan-500/20 bg-[#091424] relative">
          <button
            onClick={onClose}
            className="absolute right-5 top-5 w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-cyan-400/50 flex items-center justify-center transition-colors cursor-pointer font-mono text-xs"
            aria-label={isEn ? 'Close' : 'Zavřít'}
          >
            ✕
          </button>

          <div>
            <span className="inline-block text-[10px] font-mono font-bold tracking-widest text-cyan-400 uppercase bg-cyan-950/80 px-2.5 py-0.5 rounded border border-cyan-500/30 mb-2">
              {isEn ? 'BYOK VAULT • CLIENT-SIDE SECURITY' : 'BYOK VAULT • LOKÁLNÍ BEZPEČNOST'}
            </span>
            <h2 className="text-lg sm:text-xl font-black font-sans text-white tracking-tight">
              {isEn ? 'AI Engine & Provider Vault (BYOK)' : 'AI Engine & Provider Vault (BYOK)'}
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              {isEn 
                ? 'Select your AI model and connect your own API key for direct chat' 
                : 'Vyberte AI model a propojte svůj vlastní API klíč pro přímý chat'}
            </p>
          </div>
        </div>

        {/* Zero-Knowledge Security Notice (Zero Cloud Sync Mandate) */}
        <div className="mx-5 sm:mx-6 mt-4 p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 text-slate-300 space-y-1.5 font-sans">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-400 uppercase bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
              {isEn ? 'ZERO-KNOWLEDGE SECURITY POLICY' : 'BEZPEČNOSTNÍ ZÁRUKA (ZERO-KNOWLEDGE VAULT)'}
            </span>
            <span className="text-[10px] font-mono text-cyan-400/80">
              {isEn ? 'LOCAL ONLY' : 'POUZE LOKÁLNĚ'}
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {isEn
              ? 'For your protection, your personal API keys are NEVER synchronized to our database or cloud. They are stored strictly within this browser’s encrypted local Vault. When accessing bAIright from a new device (e.g. mobile or another computer), you will need to re-enter your API key.'
              : 'Z bezpečnostních důvodů (Zero-Knowledge) se vaše API klíče NIKDY neukládají do naší databáze ani do cloudu. Jsou uloženy výhradně v šifrovaném Vaultu tohoto prohlížeče. Pokud se přihlásíte na novém zařízení (např. mobil nebo jiný počítač), bude potřeba API klíč pro přímý chat zadat znovu.'}
          </p>
        </div>

        {/* Modal Body - Provider Cards */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-3 max-h-[50vh]">
          {SUPPORTED_AI_PROVIDERS.map((provider: AIProviderConfig) => {
            const isSelected = provider.id === activeId;
            const hasKey = Boolean(apiKeys[provider.id]?.trim());

            return (
              <div
                key={provider.id}
                onClick={() => setActiveId(provider.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#091322] border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.1)]"
                    : "bg-[#070d18] border-slate-800 hover:border-slate-700 hover:bg-slate-900/40"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="provider"
                      checked={isSelected}
                      onChange={() => setActiveId(provider.id)}
                      className="w-4 h-4 text-cyan-500 bg-slate-900 border-slate-700 focus:ring-cyan-500 cursor-pointer"
                    />
                    <span className="font-extrabold text-sm text-white">
                      {provider.name}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${provider.badgeColor}`}>
                      {provider.tag}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                    <span>{isEn ? `Memory: ${provider.contextWindow}` : `Paměť: ${provider.contextWindow}`}</span>
                    {provider.requiresKey && (() => {
                      const test = testStatus[provider.id];
                      const storedVerif = verificationStatuses[provider.id];
                      const isTesting = test?.loading;
                      const isFailed = test ? (!test.ok && !test.loading) : (storedVerif && !storedVerif.isValid);
                      const isVerified = test ? (test.ok && !test.loading) : (storedVerif && storedVerif.isValid);

                      if (!hasKey) {
                        return (
                          <span className="px-2 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700/50">
                            {isEn ? "Key Required" : "Vyžaduje klíč"}
                          </span>
                        );
                      }

                      if (isTesting) {
                        return (
                          <span className="px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 animate-pulse font-mono">
                            {isEn ? "Testing..." : "Testuji..."}
                          </span>
                        );
                      }

                      if (isFailed) {
                        return (
                          <span className="px-2 py-0.5 rounded bg-rose-950/90 text-rose-300 border border-rose-500/60 font-semibold tracking-wide animate-in fade-in">
                            {isEn ? "! Invalid Key" : "! Neplatný klíč"}
                          </span>
                        );
                      }

                      if (isVerified) {
                        return (
                          <span className="px-2 py-0.5 rounded bg-emerald-950/70 text-emerald-300 border border-emerald-500/50 font-medium">
                            {isEn ? "Verified ✓" : "Ověřeno ✓"}
                          </span>
                        );
                      }

                      return (
                        <span className="px-2 py-0.5 rounded bg-cyan-950/40 text-cyan-300 border border-cyan-500/30">
                          {isEn ? "Key Entered" : "Klíč zadán"}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed pl-6">
                  {provider.description}
                </p>

                {isSelected && provider.requiresKey && (
                  <div 
                    className="mt-3.5 pl-6 pt-3 border-t border-cyan-500/15 space-y-2.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-cyan-300 font-mono">
                        <span>{isEn ? `Your ${provider.provider} API Key:` : `Váš ${provider.provider} API Klíč:`}</span>
                      </label>
                      {provider.apiKeyHelpUrl && (
                        <a
                          href={provider.apiKeyHelpUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-cyan-400 hover:text-cyan-300 underline font-mono"
                        >
                          <span>{isEn ? 'Get API Key →' : 'Získat klíč →'}</span>
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative flex-1 flex items-center">
                        <input
                          type={showKey[provider.id] ? "text" : "password"}
                          value={apiKeys[provider.id] || ""}
                          onChange={(e) => handleKeyChange(provider.id, e.target.value)}
                          placeholder={provider.placeholderKey || (isEn ? "Enter API key..." : "Zadejte API klíč...")}
                          className="w-full bg-[#050a14] border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 outline-none pr-14 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => toggleShowKey(provider.id)}
                          className="absolute right-3 text-[11px] font-mono text-slate-400 hover:text-slate-200 cursor-pointer"
                        >
                          {showKey[provider.id] ? (isEn ? 'HIDE' : 'SKRÝT') : (isEn ? 'SHOW' : 'UKÁZAT')}
                        </button>
                      </div>

                      {apiKeys[provider.id] && (
                        <button
                          type="button"
                          onClick={() => handleRemoveKey(provider.id)}
                          title={isEn ? "Remove key from Vault" : "Odstranit klíč z Vaultu"}
                          className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 hover:text-white transition-all flex items-center gap-1 shrink-0 cursor-pointer font-mono"
                        >
                          <span>{isEn ? 'Delete' : 'Odstranit'}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleTestKey(provider.id)}
                        disabled={testStatus[provider.id]?.loading}
                        className="px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 hover:text-white transition-all flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50 font-mono"
                      >
                        <span>{testStatus[provider.id]?.loading ? (isEn ? 'Testing...' : 'Testuji...') : (isEn ? 'Test Key' : 'Test klíče')}</span>
                      </button>
                    </div>

                    {testStatus[provider.id]?.message && (
                      <div
                        className={`p-2.5 rounded-xl text-xs flex items-center gap-2 animate-in fade-in duration-200 border ${
                          testStatus[provider.id]?.ok
                            ? "bg-emerald-950/80 border-emerald-500/60 text-emerald-300 font-medium"
                            : "bg-rose-950/80 border-rose-500/60 text-rose-300 font-medium"
                        }`}
                      >
                        <span className="font-mono font-bold">{testStatus[provider.id]?.ok ? '✓' : '!'}</span>
                        <span className="leading-tight">{testStatus[provider.id]?.message}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-[#081222] flex items-center justify-between">
          <div className="text-xs text-slate-400 font-mono">
            {isEn ? 'Active Selection: ' : 'Aktivní volba: '}<strong className="text-cyan-300">{selectedProvider.name}</strong>
          </div>

          <div className="flex items-center gap-3 font-mono">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all cursor-pointer"
            >
              {isEn ? 'Cancel' : 'Zrušit'}
            </button>
            <div className="flex items-center gap-2.5">
              {isSelectedKeyFailed && (
                <span className="text-[11px] text-rose-400 font-mono font-medium">
                  {isEn ? "! Cannot activate with invalid key" : "! Nelze aktivovat s neplatným klíčem"}
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={isSelectedKeyFailed}
                className={`flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isSelectedKeyFailed
                    ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60"
                    : "bg-gradient-to-r from-cyan-500 to-teal-500 hover:brightness-110 text-slate-950 cursor-pointer shadow-lg shadow-cyan-950/50"
                }`}
              >
                <span>{isSaved ? (isEn ? "Activated!" : "Aktivováno!") : (isEn ? "Activate & Save Vault" : "Aktivovat & Uložit Vault")}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
