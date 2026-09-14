'use client';

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
      <div className="relative w-full max-w-4xl bg-[#060c18] border border-cyan-500/30 rounded-3xl shadow-2xl shadow-cyan-950/70 flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-cyan-500/20 bg-[#081224] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-lg shadow-cyan-950">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                  Inspekce AI Promptu (Transparentní zadání)
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold">
                  Zero Hallucinations
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Přesná instrukce a biometrická data odesílaná do LLM modelu.
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

        {/* Quick Rules Summary Bar */}
        <div className="px-5 py-3 bg-[#050A14] border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-mono text-slate-400">Pravidla značek:</span>
            {preferredList.length > 0 ? (
              <span className="px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-mono text-[10px] font-bold">
                Povoleno: {preferredList.join(', ')}
              </span>
            ) : (
              <span className="text-[11px] text-slate-400 italic">Všechny značky</span>
            )}

            {forbiddenList.length > 0 && (
              <span className="px-2 py-0.5 rounded-md bg-rose-950/80 text-rose-300 border border-rose-500/40 font-mono text-[10px] font-bold flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" />
                Vyloučeno: {forbiddenList.slice(0, 4).join(', ')}{forbiddenList.length > 4 ? ` +${forbiddenList.length - 4}` : ''}
              </span>
            )}
          </div>

          {/* Tab Switcher & Copy Action */}
          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('prompt')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'prompt' ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Kompletní Prompt (LLM)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('payload')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'payload' ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                JSON Payload
              </button>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-mono transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Zkopírováno' : 'Zkopírovat do schránky'}</span>
            </button>
          </div>
        </div>

        {/* Code / Text Preview */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 font-mono text-xs text-slate-300 leading-relaxed bg-[#030711] select-text">
          <pre className="whitespace-pre-wrap font-mono text-[11px] sm:text-xs text-slate-200">
            {contentToCopy}
          </pre>
        </div>

        {/* Modal Footer with Actions */}
        <div className="p-4 sm:p-5 border-t border-cyan-500/20 bg-[#081224] flex items-center justify-between">
          <span className="text-xs text-slate-400 hidden sm:inline">
            Tento text bude odeslán do vašeho zvoleného AI poskytovatele (Gemini / OpenAI / Claude).
          </span>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Zavřít náhled
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
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Vyhodnocuji...' : 'Potvrdit a odeslat do AI'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
