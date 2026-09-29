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
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-[#070e1c] border border-cyan-500/40 rounded-3xl shadow-2xl shadow-cyan-950/80 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-950/80 via-[#0a182e] to-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-inner">
              <Database className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>RAG Kontext & Paměť zprávy</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-900/60 text-cyan-300 border border-cyan-500/30">
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
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-900 transition-colors cursor-pointer"
            aria-label="Zavřít inspector"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Section 1: Assessment Context from Wizard */}
          {(assessmentName || assessmentSummary || keyParameters) && (
            <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  Nákupní profil z průvodce
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {assessmentName || agentName || categoryName}
                </span>
              </div>

              {assessmentSummary && (
                <div className="text-xs text-slate-200 bg-slate-950/80 p-3 rounded-xl border border-slate-800 leading-relaxed">
                  <strong>Diagnostický souhrn:</strong> {assessmentSummary}
                </div>
              )}

              {keyParameters && Object.keys(keyParameters).length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-mono text-slate-400 block">Zadaná kritéria & odpovědi z wizardu:</span>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(keyParameters).map(([k, v]) => (
                      <div key={k} className="px-2.5 py-1 rounded-lg bg-slate-900 border border-cyan-500/30 text-xs">
                        <span className="text-slate-400 text-[10px] font-mono block">{k}</span>
                        <span className="font-semibold text-cyan-200">{formatValueDisplay(v)}</span>
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
                      className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {fact.label && (
                            <span className="font-bold text-xs text-white">
                              {formatValueDisplay(fact.label)}
                            </span>
                          )}
                          <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                            {cat}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-snug">
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
        <div className="p-4 border-t border-cyan-500/20 bg-[#081222] flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Všechny tyto hodnoty se automaticky přimíchávají do systémového promptu LLM.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
          >
            Zavřít
          </button>
        </div>
      </div>
    </div>
  );
};
