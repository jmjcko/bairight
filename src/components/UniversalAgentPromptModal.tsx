'use client';

import React, { useState } from 'react';
import { X, Copy, Check, Terminal, Bot, Sparkles, Sliders, ShieldCheck } from 'lucide-react';
import { UniversalAgentDefinition, resolveAgentIcon } from '@/lib/agent/universal-agent-schema';

interface UniversalAgentPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: UniversalAgentDefinition | null;
}

export const UniversalAgentPromptModal: React.FC<UniversalAgentPromptModalProps> = ({
  isOpen,
  onClose,
  agent,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'prompt' | 'questions'>('prompt');

  if (!isOpen || !agent) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(agent.systemPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-cyan-950/70 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-[#263238] tracking-tight">
                  {agent.name}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#e1f5fe] text-[#01579b] border border-[#b3e5fc] font-bold">
                  {agent.category}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#f4f6f8] text-[#546e7a] border border-slate-200">
                  v{agent.version || '1.0'}
                </span>
              </div>
              <p className="text-xs text-[#607d8b] mt-0.5">
                Expertní systémový prompt, vyhodnocovací direktivy a otázky dotazníku.
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

        {/* Tab switcher */}
        <div className="px-6 border-b border-slate-200 bg-[#f4f6f8] flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('prompt')}
              className={`py-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'prompt'
                  ? 'border-[#0099cc] text-[#0099cc] font-bold'
                  : 'border-transparent text-[#607d8b] hover:text-[#263238]'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>Systémový Prompt & Pravidla ({agent.systemPrompt.length} znaků)</span>
            </button>

            <button
              onClick={() => setActiveTab('questions')}
              className={`py-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'questions'
                  ? 'border-[#0099cc] text-[#0099cc] font-bold'
                  : 'border-transparent text-[#607d8b] hover:text-[#263238]'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Otázky dotazníku ({agent.questions.length})</span>
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-mono text-cyan-300 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300 font-bold">Zkopírováno!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-cyan-400" />
                <span>Kopírovat prompt</span>
              </>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {activeTab === 'prompt' ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-[#607d8b]">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Tento prompt řídí rozhodovací logiku LLM modelu pro doporučení produktů:</span>
              </div>
              <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-200/90 text-xs font-mono text-[#455a64] leading-relaxed whitespace-pre-wrap selection:bg-cyan-500/30 overflow-x-auto">
                {agent.systemPrompt}
              </pre>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-[#607d8b]">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>Otázky, které agent klade uživateli v interaktivním dotazníku:</span>
              </div>
              <div className="space-y-2.5">
                {agent.questions.map((q, idx) => (
                  <div key={q.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#263238]">
                        {idx + 1}. {q.title}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-cyan-300 border border-slate-200">
                        {q.component} {q.isMultiSelect ? '(multi)' : ''}
                      </span>
                    </div>
                    {q.subtitle && (
                      <p className="text-[11px] text-[#607d8b]">{q.subtitle}</p>
                    )}
                    {q.options && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {q.options.map((opt, optIdx) => (
                          <span key={`${opt.value}-${optIdx}`} className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#f4f6f8] text-[#455a64] border border-slate-200">
                            {opt.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between text-xs text-[#607d8b]">
          <span className="font-mono text-[11px]">
            Přenosný formát agenta • Kompatibilní s OpenAI, Anthropic a Gemini
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-[#263238] font-medium text-xs transition-colors cursor-pointer"
          >
            Zavřít
          </button>
        </div>
      </div>
    </div>
  );
};
