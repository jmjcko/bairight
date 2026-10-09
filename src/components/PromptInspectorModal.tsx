'use client';
import { useI18n } from '@/lib/i18n/I18nContext';

import React, { useState } from 'react';
import { X, Copy, Check, Terminal, Eye, Sparkles, ShieldAlert, Cpu } from 'lucide-react';
import { IntakeFormData } from '@/lib/agent/markdown-agent-loader';

interface PromptInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  promptText: string;
  formData: IntakeFormData;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

export const PromptInspectorModal: React.FC<PromptInspectorModalProps> = ({
  isOpen,
  onClose,
  promptText,
  formData,
  onSubmit,
  isSubmitting = false,
}) => {
  const [activeTab, setActiveTab] = useState<'prompt' | 'payload'>('prompt');
  const { locale } = useI18n();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const contentToCopy = activeTab === 'prompt' ? promptText : JSON.stringify(formData, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(contentToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const forbiddenList = formData.forbidden_brands || [];
  const preferredList = formData.preferred_brands || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-cyan-950/70 flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#e1f5fe] border border-[#b3e5fc] flex items-center justify-center text-[#01579b] shadow-xs">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-[#263238] tracking-tight">
                  {locale === "en" ? "AI Prompt Inspection (Transparent Input)" : "Inspekce AI Promptu (Transparentní zadání)"}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#e1f5fe] border border-[#b3e5fc] text-[#01579b] font-bold">
                  Zero Hallucinations
                </span>
              </div>
              <p className="text-xs text-[#607d8b] mt-0.5">
                {locale === "en" ? "Exact instructions and parameters sent to the LLM model." : "Přesná instrukce a biometrická data odesílaná do LLM modelu."}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#607d8b] hover:text-[#263238] hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Rules Summary Bar */}
        <div className="px-5 py-3 bg-[#f4f6f8] border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-mono text-[#607d8b]">{locale === "en" ? "Brand rules:" : "Pravidla značek:"}</span>
            {preferredList.length > 0 ? (
              <span className="px-2 py-0.5 rounded-md bg-[#e1f5fe] text-[#01579b] border border-[#b3e5fc] font-mono text-[10px] font-bold">
                Povoleno: {preferredList.join(', ')}
              </span>
            ) : (
              <span className="text-[11px] text-[#607d8b] italic">{locale === "en" ? "All brands" : "Všechny značky"}</span>
            )}

            {forbiddenList.length > 0 && (
              <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-300 font-mono text-[10px] font-bold flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" />
                {locale === "en" ? "Excluded:" : "Vyloučeno:"} {forbiddenList.slice(0, 4).join(', ')}{forbiddenList.length > 4 ? ` +${forbiddenList.length - 4}` : ''}
              </span>
            )}
          </div>

          {/* Tab Switcher & Copy Action */}
          <div className="flex items-center gap-2">
            <div className="segmented-tabs-container inline-flex items-center gap-1.5 p-1 rounded-xl bg-[#f4f6f8] border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('prompt')}
                className={`segmented-tab-btn px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'prompt' ? 'segmented-tab-active bg-[#0099cc] text-white shadow-xs' : 'text-[#607d8b] hover:text-[#263238]'
                }`}
              >
                {locale === "en" ? "Complete Prompt (LLM)" : "Kompletní Prompt (LLM)"}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('payload')}
                className={`segmented-tab-btn px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'payload' ? 'segmented-tab-active bg-[#0099cc] text-white shadow-xs' : 'text-[#607d8b] hover:text-[#263238]'
                }`}
              >
                JSON Payload
              </button>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-[#455a64] hover:text-[#263238] border border-slate-700 text-xs font-mono transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? (locale === "en" ? "Copied" : "Zkopírováno") : (locale === "en" ? "Copy to clipboard" : "Zkopírovat do schránky")}</span>
            </button>
          </div>
        </div>

        {/* Code / Text Preview */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 font-mono text-xs text-[#455a64] leading-relaxed bg-[#f8fafc] text-[#263238] select-text">
          <pre className="whitespace-pre-wrap font-mono text-[11px] sm:text-xs text-[#263238]">
            {contentToCopy}
          </pre>
        </div>

        {/* Modal Footer with Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-white flex items-center justify-between">
          <span className="text-xs text-[#607d8b] hidden sm:inline">
            {locale === "en" ? "This text will be sent to your selected AI provider (Gemini / OpenAI / Claude)." : "Tento text bude odeslán do vašeho zvoleného AI poskytovatele (Gemini / OpenAI / Claude)."}
          </span>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#455a64] hover:text-[#263238] hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {locale === "en" ? "Close preview" : "Zavřít náhled"}
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onSubmit();
              }}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 hover:brightness-110 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${isSubmitting ? "animate-spin" : ""}`} />
              <span>{isSubmitting ? (locale === "en" ? "Evaluating..." : "Vyhodnocuji...") : (locale === "en" ? "Confirm and send to AI" : "Potvrdit a odeslat do AI")}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
