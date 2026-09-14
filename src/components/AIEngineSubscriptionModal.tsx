'use client';

import React, { useState } from 'react';
import { X, Sparkles, Key, Check, ShieldCheck, ExternalLink, Zap, Eye, EyeOff, Bot, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { AIProviderConfig, AIProviderId, SUPPORTED_AI_PROVIDERS } from '@/lib/agent/engine-config';

interface AIEngineSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProviderId: AIProviderId;
  onSaveProvider: (providerId: AIProviderId, apiKeys: Record<string, string>) => void;
  currentApiKeys: Record<string, string>;
  demoRunsRemaining: number;
}

export const AIEngineSubscriptionModal: React.FC<AIEngineSubscriptionModalProps> = ({
  isOpen,
  onClose,
  selectedProviderId,
  onSaveProvider,
  currentApiKeys,
  demoRunsRemaining,
}) => {
  const [activeId, setActiveId] = useState<AIProviderId>(selectedProviderId);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>(currentApiKeys);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [isSaved, setIsSaved] = useState(false);
  const [testStatus, setTestStatus] = useState<Record<string, { loading: boolean; ok?: boolean; message?: string }>>({});

  if (!isOpen) return null;

  const handleKeyChange = (providerId: string, value: string) => {
    setApiKeys((prev) => ({ ...prev, [providerId]: value }));
    setIsSaved(false);
    setTestStatus((prev) => ({ ...prev, [providerId]: { loading: false } }));
  };

  const toggleShowKey = (providerId: string) => {
    setShowKey((prev) => ({ ...prev, [providerId]: !prev[providerId] }));
  };

  const handleTestKey = async (providerId: string) => {
    const key = apiKeys[providerId];
    if (!key || key.trim().length < 5) {
      setTestStatus((prev) => ({ ...prev, [providerId]: { loading: false, ok: false, message: 'Nejprve zadejte API klíč.' } }));
      return;
    }

    setTestStatus((prev) => ({ ...prev, [providerId]: { loading: true } }));
    try {
      const res = await fetch('/api/agent/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId, apiKey: key }),
      });
      const data = await res.json();
      if (data.ok) {
        setTestStatus((prev) => ({ ...prev, [providerId]: { loading: false, ok: true, message: data.message } }));
      } else {
        setTestStatus((prev) => ({ ...prev, [providerId]: { loading: false, ok: false, message: data.error || 'Test spojení selhal.' } }));
      }
    } catch (err: any) {
      setTestStatus((prev) => ({ ...prev, [providerId]: { loading: false, ok: false, message: 'Chyba sítě při testování klíče.' } }));
    }
  };

  const handleSave = () => {
    onSaveProvider(activeId, apiKeys);
    setIsSaved(true);
    setTimeout(() => {
      onClose();
    }, 800);
  };

  const selectedProvider = SUPPORTED_AI_PROVIDERS.find((p) => p.id === activeId) || SUPPORTED_AI_PROVIDERS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#060c18] border border-cyan-500/30 rounded-3xl shadow-2xl shadow-cyan-950/60 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-cyan-500/20 bg-[#081222] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-400 p-0.5 shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-[#070e1a] rounded-[14px] flex items-center justify-center text-cyan-300">
                <Bot className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-white">
                  Mozek Agenta & AI Předplatné (BYOK)
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold">
                  Workflow Orchestrátor
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Vyberte, který LLM model pohání uvažování agenta `bAIright`.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Freemium Motivation Card */}
        <div className="mx-5 sm:mx-6 mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-[#071220] to-cyan-950/40 border border-amber-500/30 text-xs">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-300">
                  ⚡ Freemium demo: Zbývá {demoRunsRemaining} z 3 bezplatných vyhodnocení
                </span>
                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                  BYOK = Neomezeně
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                `bAIright` je čistě inteligentní software a RAG databáze. Propojením vlastního AI klíče 
                (Claude, Gemini nebo ChatGPT) získáte <strong>neomezený počet vyhodnocení</strong>, nulovou frontu a 
                přímý přístup k nejvýkonnějším modelům bez marže.
              </p>
            </div>
          </div>
        </div>

        {/* Body: Providers List & Key Inputs */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3.5">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-1">
            Zvolte preferovaný AI engine:
          </span>

          <div className="space-y-2.5">
            {SUPPORTED_AI_PROVIDERS.map((provider) => {
              const isSelected = provider.id === activeId;
              const hasKey = Boolean(apiKeys[provider.id]);

              return (
                <div
                  key={provider.id}
                  onClick={() => setActiveId(provider.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#0b162a] border-cyan-400 shadow-lg shadow-cyan-950/40'
                      : 'bg-[#060c18] border-slate-800 hover:border-slate-700 hover:bg-[#081020]'
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
                        <span className={`px-1.5 py-0.5 rounded ${hasKey ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40' : 'bg-slate-800 text-slate-400'}`}>
                          {hasKey ? '✓ Klíč zadán' : 'Vyžaduje klíč'}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed pl-6">
                    {provider.description}
                  </p>

                  {/* API Key Input for selected BYOK provider */}
                  {isSelected && provider.requiresKey && (
                    <div className="mt-3.5 pl-6 pt-3 border-t border-cyan-500/15 space-y-2">
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
                            className="text-[10px] text-cyan-400 hover:text-cyan-300 underline flex items-center gap-1"
                          >
                            <span>Získat API klíč zdarma</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="relative flex-1 flex items-center">
                          <input
                            type={showKey[provider.id] ? 'text' : 'password'}
                            value={apiKeys[provider.id] || ''}
                            onChange={(e) => handleKeyChange(provider.id, e.target.value)}
                            placeholder={provider.placeholderKey || 'Zadejte API klíč...'}
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

                        <button
                          type="button"
                          onClick={() => handleTestKey(provider.id)}
                          disabled={testStatus[provider.id]?.loading}
                          className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 hover:text-white transition-all flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                        >
                          {testStatus[provider.id]?.loading ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Testuji...</span>
                            </>
                          ) : (
                            <>
                              <Zap className="w-3.5 h-3.5 text-cyan-400" />
                              <span>Otestovat klíč</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Test feedback status message */}
                      {testStatus[provider.id]?.message && (
                        <div
                          className={`p-2.5 rounded-xl text-xs flex items-center gap-2 animate-in fade-in duration-200 border ${
                            testStatus[provider.id]?.ok
                              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                              : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
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
                        <ShieldCheck className="w-3 h-3 text-cyan-400" />
                        <span>Klíč se ukládá výhradně lokálně ve vašem šifrovaném úložišti prohlížeče a neopouští váš stroj.</span>
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-cyan-500/20 bg-[#081222] flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Aktivní volba: <strong className="text-cyan-300">{selectedProvider.name}</strong>
          </div>

          <div className="flex items-center gap-3">
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
              <span>{isSaved ? 'Aktivováno!' : 'Aktivovat a uložit'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
