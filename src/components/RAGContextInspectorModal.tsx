'use client';

import React from 'react';
import { X, Database, Sparkles, User, Tag, CheckCircle2, ShieldAlert, Cpu } from 'lucide-react';
import { formatValueDisplay } from '@/lib/agent/engine-config';

interface RAGContextInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentName?: string;
  categoryName?: string;
  ragMetadata?: {
    factsCount: number;
    injectedFacts: Array<{ id?: string; label?: string; value?: string; fact?: string; category?: string }>;
    assessmentName?: string;
    assessmentSummary?: string;
    keyParameters?: Record<string, any>;
  };
}

export const RAGContextInspectorModal: React.FC<RAGContextInspectorModalProps> = ({
  isOpen,
  onClose,
  agentName,
  categoryName,
  ragMetadata,
}) => {
  if (!isOpen || !ragMetadata) return null;

  const { factsCount, injectedFacts = [], assessmentName, assessmentSummary, keyParameters } = ragMetadata;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-white border border-slate-200 rounded-2xl shadow-xl flex flex-col overflow-hidden text-[#263238]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#e1f5fe] border border-[#b3e5fc] flex items-center justify-center text-[#01579b] shadow-xs">
              <Database className="w-5 h-5 text-[#01579b]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#263238] flex items-center gap-2">
                <span>RAG Kontext & Paměť zprávy</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#e1f5fe] text-[#01579b] border border-[#b3e5fc]">
                  {factsCount} faktů
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Přesný přehled dat z vaší profilové databáze použitých při generování této odpovědi.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[#546e7a] hover:text-[#263238] p-2 rounded-lg hover:bg-[#f4f6f8] transition-colors cursor-pointer"
            aria-label="Zavřít inspector"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Section 1: Assessment Context from Wizard */}
          {(assessmentName || assessmentSummary || keyParameters) && (
            <div className="p-4 rounded-xl bg-[#e1f5fe]/40 border border-[#b3e5fc] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#014377] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  Nákupní profil z průvodce
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {assessmentName || agentName || categoryName}
                </span>
              </div>

              {assessmentSummary && (
                <div className="text-xs text-[#263238] bg-white p-3 rounded-lg border border-slate-200 leading-relaxed">
                  <strong>Diagnostický souhrn:</strong> {assessmentSummary}
                </div>
              )}

              {keyParameters && Object.keys(keyParameters).length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-mono text-slate-400 block">Zadaná kritéria & odpovědi z wizardu:</span>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(keyParameters).map(([k, v]) => (
                      <div key={k} className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs">
                        <span className="text-slate-400 text-[10px] font-mono block">{k}</span>
                        <span className="font-bold text-[#01579b]">{formatValueDisplay(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section 2: Injected RAG Memory Facts */}
          <div className="space-y-3">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-teal-400" />
              Aktivní RAG Fakta v Promptu ({injectedFacts.length})
            </span>

            {injectedFacts.length === 0 ? (
              <p className="text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl p-4 text-center">
                V této zprávě nebyla aktivní žádná dodatečná RAG fakta z databáze.
              </p>
            ) : (
              <div className="space-y-2">
                {injectedFacts.map((fact, idx) => {
                  const cat = fact.category || 'preference';
                  const badgeColor =
                    cat === 'biometrics' ? 'bg-purple-950/50 text-purple-300 border-purple-500/30' :
                    cat === 'medical' ? 'bg-teal-950/50 text-teal-300 border-teal-500/30' :
                    cat === 'history' ? 'bg-amber-950/50 text-amber-300 border-amber-500/30' :
                    'bg-cyan-950/50 text-cyan-300 border-cyan-500/30';

                  return (
                    <div
                      key={fact.id || idx}
                      className="p-3 rounded-xl bg-[#f8fafc] border border-slate-200 flex items-start justify-between gap-3 shadow-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {fact.label && (
                            <span className="font-bold text-xs text-[#263238]">
                              {formatValueDisplay(fact.label)}
                            </span>
                          )}
                          <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                            {cat}
                          </span>
                        </div>
                        <p className="text-xs text-[#546e7a] leading-snug">
                          {formatValueDisplay(fact.value || fact.fact)}
                        </p>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Všechny tyto hodnoty se automaticky přimíchávají do systémového promptu LLM.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#0099cc] hover:bg-[#0088b8] text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
          >
            Zavřít
          </button>
        </div>
      </div>
    </div>
  );
};
