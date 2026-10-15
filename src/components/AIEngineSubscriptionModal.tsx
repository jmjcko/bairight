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

interface ProviderGuideStep {
  step: string;
  prefix: string;
  prefixEn: string;
  linkText?: string;
  linkTextEn?: string;
  url?: string;
  suffix?: string;
  suffixEn?: string;
}

interface ProviderGuide {
  pricingNotice: string;
  pricingNoticeEn: string;
  isFree: boolean;
  steps: ProviderGuideStep[];
}

const PROVIDER_GUIDES: Record<AIProviderId, ProviderGuide> = {
  google_gemini: {
    pricingNotice: "100% ZDARMA bez platební karty (v Google AI Studio). Výchozí model: Gemini 2.5 Flash.",
    pricingNoticeEn: "100% FREE with no credit card required (in Google AI Studio). Default model: Gemini 2.5 Flash.",
    isFree: true,
    steps: [
      {
        step: "1",
        prefix: "Otevřete",
        prefixEn: "Open",
        linkText: "Google AI Studio →",
        linkTextEn: "Google AI Studio →",
        url: "https://aistudio.google.com/app/apikey",
        suffix: "a přihlaste se svým Google účtem.",
        suffixEn: "and sign in with your Google account.",
      },
      {
        step: "2",
        prefix: "Vytvořte API klíč kliknutím na 'Create API key' a zkopírujte vygenerovaný kód (AIzaSy...).",
        prefixEn: "Click 'Create API key' and copy your generated key string (AIzaSy...).",
      },
      {
        step: "3",
        prefix: "Vložte klíč do pole níže a klikněte na 'Test klíče'.",
        prefixEn: "Paste the key below and click 'Test Key'.",
      },
    ],
  },
  anthropic_claude: {
    pricingNotice: "POZOR: Předplatné Claude Pro neplatí pro API, je vyžadován předplacený kredit (min. $5). Pro úsporu či nízký kredit systém automaticky využívá Claude 3.5 Haiku.",
    pricingNoticeEn: "NOTE: Consumer Claude Pro does NOT apply to API. Prepaid credit (min. $5) is required. System automatically falls back to cost-effective Claude 3.5 Haiku on low balance.",
    isFree: false,
    steps: [
      {
        step: "1",
        prefix: "V",
        prefixEn: "In",
        linkText: "Anthropic Billing →",
        linkTextEn: "Anthropic Billing →",
        url: "https://console.anthropic.com/settings/plans",
        suffix: "dobijte počáteční kredit (min. 5 USD).",
        suffixEn: "add initial balance (min. $5).",
      },
      {
        step: "2",
        prefix: "V",
        prefixEn: "In",
        linkText: "API Keys →",
        linkTextEn: "API Keys →",
        url: "https://console.anthropic.com/settings/keys",
        suffix: "vytvořte klíč ('sk-ant-api03-...').",
        suffixEn: "create your key ('sk-ant-api03-...').",
      },
      {
        step: "3",
        prefix: "Zkopírujte klíč, vložte jej níže a klikněte na 'Test klíče'.",
        prefixEn: "Copy your key, paste below and click 'Test Key'.",
      },
    ],
  },
  openai_gpt4o: {
    pricingNotice: "POZOR: Spotřebitelské ChatGPT Plus ($20) neplatí pro API, na platformě je nutný kredit (min. $5). Pro bezplatné a zkušební účty systém automaticky využívá úsporný GPT-4o-mini.",
    pricingNoticeEn: "NOTE: Consumer ChatGPT Plus ($20) does NOT apply to API access. Prepaid balance (min. $5) is required. System automatically falls back to cost-effective GPT-4o-mini for trial/free tiers.",
    isFree: false,
    steps: [
      {
        step: "1",
        prefix: "V",
        prefixEn: "In",
        linkText: "OpenAI Billing →",
        linkTextEn: "OpenAI Billing →",
        url: "https://platform.openai.com/settings/organization/billing",
        suffix: "dobijte kredit (min. 5 USD).",
        suffixEn: "top up balance (min. $5).",
      },
      {
        step: "2",
        prefix: "V",
        prefixEn: "In",
        linkText: "API Keys →",
        linkTextEn: "API Keys →",
        url: "https://platform.openai.com/api-keys",
        suffix: "vytvořte Secret key ('sk-proj-...').",
        suffixEn: "create Secret key ('sk-proj-...').",
      },
      {
        step: "3",
        prefix: "Zkopírujte klíč, vložte jej níže a klikněte na 'Test klíče'.",
        prefixEn: "Copy your key, paste below and click 'Test Key'.",
      },
    ],
  },
};


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
  const [expandedGuides, setExpandedGuides] = useState<Record<string, boolean>>({
    google_gemini: false,
    anthropic_claude: false,
    openai_gpt4o: false,
  });
  const [isSaved, setIsSaved] = useState<boolean>(false);

  useEffect(() => {
    setActiveId(activeProviderId);
    setExpandedGuides({
      google_gemini: true,
      anthropic_claude: true,
      openai_gpt4o: true,
    });
  }, [activeProviderId, isOpen]);

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
    const key = apiKeys[providerId]?.trim();
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
      const isValid = Boolean(data.ok || data.valid || data.creditWarning);

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
      if (k && typeof k === "string") { VaultService.saveApiKey(pid, k.trim()); }
    });

    onSaveProvider(activeId, apiKeys);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 450);
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto overflow-x-hidden">
      <div 
        className="w-full max-w-[calc(100vw-20px)] sm:max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col relative text-left my-auto mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Monospace Tag */}
        <div className="p-5 sm:p-6 border-b border-slate-100 bg-white relative">
          <button
            onClick={onClose}
            className="absolute right-5 top-5 w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-[#607d8b] hover:text-[#263238] hover:border-cyan-400/50 flex items-center justify-center transition-colors cursor-pointer font-mono text-xs"
            aria-label={isEn ? 'Close' : 'Zavřít'}
          >
            ✕
          </button>

          <div>
            <span className="inline-block text-[10px] font-mono font-bold tracking-widest text-[#01579b] uppercase bg-[#e1f5fe] px-2.5 py-0.5 rounded-md border border-[#b3e5fc] font-bold mb-2">
              {isEn ? 'BYOK VAULT • CLIENT-SIDE SECURITY' : 'BYOK VAULT • LOKÁLNÍ BEZPEČNOST'}
            </span>
            <h2 className="text-lg sm:text-xl font-black font-sans text-[#263238] tracking-tight">
              {isEn ? 'AI Engine & Provider Vault (BYOK)' : 'AI Engine & Provider Vault (BYOK)'}
            </h2>
            <p className="text-xs text-[#607d8b] font-mono mt-0.5">
              {isEn 
                ? 'Select your AI model and connect your own API key for direct chat' 
                : 'Vyberte AI model a propojte svůj vlastní API klíč pro přímý chat'}
            </p>
          </div>
        </div>

        {/* Zero-Knowledge Security Notice (Dedicated Fixed Section with Clean Divider) */}
        <div className="px-5 sm:px-6 py-3 bg-[#f8fafc] dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1">
            <span className="text-[10px] font-mono font-bold tracking-wider text-[#01579b] dark:text-cyan-400 uppercase bg-[#e1f5fe] dark:bg-cyan-950/60 px-2 py-0.5 rounded border border-[#b3e5fc] dark:border-cyan-500/30">
              {isEn ? 'ZERO-KNOWLEDGE SECURITY POLICY' : 'BEZPEČNOSTNÍ ZÁRUKA (ZERO-KNOWLEDGE VAULT)'}
            </span>
            <span className="text-[10px] font-mono text-[#01579b] dark:text-cyan-400 font-bold">
              {isEn ? 'LOCAL ONLY' : 'POUZE LOKÁLNĚ'}
            </span>
          </div>
          <p className="text-[11px] text-[#455a64] dark:text-slate-400 leading-relaxed">
            {isEn
              ? 'For your protection, your personal API keys are NEVER synchronized to our database or cloud. They are stored strictly within this browser’s encrypted local Vault. When accessing bAIright from a new device, you will need to re-enter your API key.'
              : 'Z bezpečnostních důvodů (Zero-Knowledge) se vaše API klíče NIKDY neukládají do naší databáze ani do cloudu. Jsou uloženy výhradně v šifrovaném Vaultu tohoto prohlížeče. Pokud se přihlásíte na novém zařízení, bude potřeba API klíč pro přímý chat zadat znovu.'}
          </p>
        </div>

        {/* Modal Body - Provider Cards */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-3.5 max-h-[62vh]">
          {SUPPORTED_AI_PROVIDERS.map((provider: AIProviderConfig) => {
            const isSelected = provider.id === activeId;
            const hasKey = Boolean(apiKeys[provider.id]?.trim());

            return (
              <div
                key={provider.id}
                onClick={() => {
                  setActiveId(provider.id);
                  setExpandedGuides((prev) => ({ ...prev, [provider.id]: true }));
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#f0f9ff] border-[#0099cc] shadow-[0_0_20px_rgba(6,182,212,0.1)]"
                    : "bg-white border-slate-200 hover:border-slate-300 hover:bg-[#f8fafc]"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                    <input
                      type="radio"
                      name="provider"
                      checked={isSelected}
                      onChange={() => setActiveId(provider.id)}
                      className="w-4 h-4 text-cyan-500 bg-slate-900 border-slate-700 focus:ring-cyan-500 cursor-pointer shrink-0"
                    />
                    <span className="font-extrabold text-sm text-[#263238]">
                      {provider.name}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${provider.badgeColor}`}>
                      {isEn ? provider.tagEn : provider.tag}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] font-mono text-[#607d8b] flex-wrap">
                    <span>{isEn ? `Memory: ${provider.contextWindowEn}` : `Paměť: ${provider.contextWindow}`}</span>
                    {provider.requiresKey && (() => {
                      const test = testStatus[provider.id];
                      const storedVerif = verificationStatuses[provider.id];
                      const isTesting = test?.loading;
                      const isFailed = test ? (!test.ok && !test.loading) : (storedVerif && !storedVerif.isValid);
                      const isVerified = test ? (test.ok && !test.loading) : (storedVerif && storedVerif.isValid);

                      if (!hasKey) {
                        return (
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
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

                <p className="text-xs text-[#455a64] leading-relaxed pl-6">
                  {isEn ? provider.descriptionEn : provider.description}
                </p>

                {isSelected && provider.requiresKey && (
                  <div 
                    className="mt-3.5 pl-6 pt-3 border-t border-cyan-500/15 space-y-2.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 dark:text-cyan-300 font-mono">
                        <span>{isEn ? `Your ${provider.provider} API Key:` : `Váš ${provider.provider} API Klíč:`}</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setExpandedGuides((prev) => ({ ...prev, [provider.id]: !prev[provider.id] }))}
                        className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                      >
                        <span>{isEn ? "Step-by-step setup guide" : "Návod krok za krokem"}</span>
                        <span className="text-[10px]">{expandedGuides[provider.id] ? "▴" : "▾"}</span>
                      </button>
                    </div>

                    {/* Collapsible Step-by-Step Onboarding Guide */}
                    {expandedGuides[provider.id] && (() => {
                      const guide = PROVIDER_GUIDES[provider.id];
                      if (!guide) return null;
                      return (
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-cyan-500/20 space-y-2 text-xs animate-in fade-in duration-200">
                          {/* Pricing & Credit Notice */}
                          <div className={`px-2.5 py-1.5 rounded-lg font-mono text-[11px] border leading-normal ${
                            guide.isFree 
                              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                              : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300"
                          }`}>
                            <strong className="font-bold">{isEn ? "NOTE: " : "POZNÁMKA: "}</strong>
                            <span>{isEn ? guide.pricingNoticeEn : guide.pricingNotice}</span>
                          </div>

                          {/* Concise Steps List */}
                          <div className="space-y-1.5 pt-0.5">
                            {guide.steps.map((st) => (
                              <div key={st.step} className="flex items-center gap-2 py-1 px-2.5 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/50 text-[11px]">
                                <span className="px-1.5 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950/80 border border-cyan-200 dark:border-cyan-500/30 text-cyan-800 dark:text-cyan-300 font-mono text-[10px] font-bold shrink-0">
                                  [{st.step}]
                                </span>
                                <div className="text-slate-700 dark:text-slate-300 flex-1 min-w-0 flex items-center flex-wrap gap-1 leading-normal">
                                  <span>{isEn ? st.prefixEn : st.prefix}</span>
                                  {st.url && (
                                    <a
                                      href={st.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-cyan-600 dark:text-cyan-400 hover:underline font-mono font-bold inline-flex items-center"
                                    >
                                      {isEn ? st.linkTextEn : st.linkText}
                                    </a>
                                  )}
                                  {(isEn ? st.suffixEn : st.suffix) && (
                                    <span>{isEn ? st.suffixEn : st.suffix}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <div className="relative flex-1 flex items-center min-w-0">
                        <input
                          type={showKey[provider.id] ? "text" : "password"}
                          value={apiKeys[provider.id] || ""}
                          onChange={(e) => handleKeyChange(provider.id, e.target.value)}
                          placeholder={provider.placeholderKey || (isEn ? "Enter API key..." : "Zadejte API klíč...")}
                          className="w-full bg-[#f4f6f8] border border-slate-200 text-[#263238] focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-[#263238] placeholder:text-slate-600 outline-none pr-14 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => toggleShowKey(provider.id)}
                          className="absolute right-3 text-[11px] font-mono text-[#607d8b] hover:text-[#263238] cursor-pointer"
                        >
                          {showKey[provider.id] ? (isEn ? 'HIDE' : 'SKRÝT') : (isEn ? 'SHOW' : 'UKÁZAT')}
                        </button>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {apiKeys[provider.id] && (
                          <button
                            type="button"
                            onClick={() => handleRemoveKey(provider.id)}
                            title={isEn ? "Remove key from Vault" : "Odstranit klíč z Vaultu"}
                            className="flex-1 sm:flex-initial px-3 py-2.5 rounded-xl text-xs font-semibold bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 hover:text-[#263238] transition-all flex items-center justify-center gap-1 cursor-pointer font-mono"
                          >
                            <span>{isEn ? 'Delete' : 'Odstranit'}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleTestKey(provider.id)}
                          disabled={testStatus[provider.id]?.loading}
                          className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 hover:text-[#263238] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 font-mono"
                        >
                          <span>{testStatus[provider.id]?.loading ? (isEn ? 'Testing...' : 'Testuji...') : (isEn ? 'Test Key' : 'Test klíče')}</span>
                        </button>
                      </div>
                    </div>

                    {provider.id === "anthropic_claude" && (
                      <div className="text-[10px] text-[#607d8b] font-mono leading-tight">
                        {isEn
                          ? "Format: standard sk-ant-api03-... or user key sk-ant-usr-...:wrkspc_id"
                          : "Formát: standardní sk-ant-api03-... nebo user klíč sk-ant-usr-...:wrkspc_id"}
                      </div>
                    )}

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
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-[#f8fafc] flex items-center justify-between">
          <div className="text-xs text-[#607d8b] font-mono">
            {isEn ? 'Active Selection: ' : 'Aktivní volba: '}<strong className="text-cyan-300">{selectedProvider.name}</strong>
          </div>

          <div className="flex items-center gap-3 font-mono">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#455a64] hover:text-[#263238] hover:bg-slate-800/60 transition-all cursor-pointer"
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
