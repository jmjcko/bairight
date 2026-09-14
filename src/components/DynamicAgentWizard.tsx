'use client';

import React, { useState, useMemo } from 'react';
import { 
  UniversalAgentDefinition, 
  UniversalEvaluationResult, 
  WizardQuestion,
  forgeAgentPrompt 
} from '@/lib/agent/universal-agent-schema';
import { AgentStorageService } from '@/lib/agent/agent-storage-service';
import { PromptInspectorModal } from './PromptInspectorModal';
import { 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  RotateCcw, 
  Zap, 
  ShieldCheck, 
  Eye, 
  Download, 
  ArrowLeft, 
  Check, 
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  FileText,
  Copy,
  ChevronDown,
  ChevronUp,
  FileCode
} from 'lucide-react';
import { PromptStorageService } from '@/lib/agent/prompt-storage-service';

interface DynamicAgentWizardProps {
  agent: UniversalAgentDefinition;
  onBackToLauncher?: () => void;
  activeProviderId?: string;
  currentApiKeys?: Record<string, string>;
  userFacts?: any[];
  onOpenSubscriptionModal?: () => void;
  onAssessmentCompleted?: (answers: Record<string, any>, result: UniversalEvaluationResult, completedPrompt?: string) => void;
}

export const DynamicAgentWizard: React.FC<DynamicAgentWizardProps> = ({
  agent,
  onBackToLauncher,
  activeProviderId,
  currentApiKeys,
  userFacts,
  onOpenSubscriptionModal,
  onAssessmentCompleted,
}) => {
  // Initialize default answers from agent definition
  const initialAnswers = useMemo(() => {
    const acc: Record<string, any> = {};
    for (const q of agent.questions) {
      acc[q.id] = q.defaultValue;
    }
    return acc;
  }, [agent]);

  const [answers, setAnswers] = useState<Record<string, any>>(initialAnswers);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [result, setResult] = useState<UniversalEvaluationResult | null>(null);

  // Prompt Inspector Modal State
  const [isPromptInspectorOpen, setIsPromptInspectorOpen] = useState<boolean>(false);
  const [inspectorPromptText, setInspectorPromptText] = useState<string>('');
  const [copiedFinalPrompt, setCopiedFinalPrompt] = useState<boolean>(false);
  const [showLivePromptPreview, setShowLivePromptPreview] = useState<boolean>(false);

  // Group questions by step
  const stepGroups = useMemo(() => {
    const map = new Map<number, WizardQuestion[]>();
    for (const q of agent.questions) {
      const s = q.step || 1;
      if (!map.has(s)) map.set(s, []);
      map.get(s)!.push(q);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map((entry) => entry[1]);
  }, [agent.questions]);

  const totalSteps = Math.max(1, stepGroups.length);
  const activeQuestions = stepGroups[currentStepIndex] || [];

  const handleValueChange = (questionId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleToggleChip = (question: WizardQuestion, chipValue: string) => {
    setAnswers((prev) => {
      const current = prev[question.id];
      if (question.isMultiSelect) {
        const arr = Array.isArray(current) ? [...current] : [];
        const exists = arr.includes(chipValue);
        return {
          ...prev,
          [question.id]: exists ? arr.filter((x) => x !== chipValue) : [...arr, chipValue],
        };
      } else {
        return {
          ...prev,
          [question.id]: chipValue,
        };
      }
    });
  };

  const handleResetForm = () => {
    setAnswers(initialAnswers);
    setCurrentStepIndex(0);
    setResult(null);
  };

  const enrichedFacts = useMemo(() => {
    return Array.isArray(userFacts)
      ? userFacts
          .filter((f) => f.isEnriched !== false)
          .map((f) => ({
            fact: f.fact || `${f.label || 'Poznámka'}: ${f.value || ''}`,
            category: f.category || 'biometrics',
          }))
      : [];
  }, [userFacts]);

  const currentLivePrompt = useMemo(() => {
    return forgeAgentPrompt(agent, answers, enrichedFacts);
  }, [agent, answers, enrichedFacts]);

  const handleOpenPromptInspector = () => {
    setInspectorPromptText(currentLivePrompt);
    setIsPromptInspectorOpen(true);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      let providerId = activeProviderId || 'bairight_core';
      let apiKey: string | undefined = undefined;

      if (typeof window !== 'undefined') {
        const storedProvider = localStorage.getItem('bairight_active_provider');
        const storedKeys = localStorage.getItem('bairight_api_keys');
        if (storedProvider) providerId = storedProvider;
        if (storedKeys) {
          try {
            const parsed = JSON.parse(storedKeys);
            if (providerId && parsed[providerId]) {
              apiKey = parsed[providerId];
            }
          } catch {}
        }
      }

      if (currentApiKeys && providerId && currentApiKeys[providerId]) {
        apiKey = currentApiKeys[providerId];
      }

      const enrichedFacts = Array.isArray(userFacts)
        ? userFacts
            .filter((f) => f.isEnriched !== false)
            .map((f) => ({
              fact: f.fact || `${f.label || 'Poznámka'}: ${f.value || ''}`,
              category: f.category || 'biometrics',
            }))
        : [];

      const res = await fetch('/api/agent/evaluate-universal-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent,
          answers,
          ragFacts: enrichedFacts,
          providerId,
          apiKey,
        }),
      });

      if (!res.ok) throw new Error('Failed to evaluate agent recommendation');
      const data: UniversalEvaluationResult = await res.json();
      setResult(data);

      // Sestavíme a uložíme VÝHRADNĚ HOTOVÝ prompt po dokončení posledního kroku
      const finalCompletedPrompt = forgeAgentPrompt(agent, answers, enrichedFacts);
      PromptStorageService.saveCompletedPrompt({
        agentId: agent.id,
        agentName: agent.name,
        category: agent.category,
        prompt: finalCompletedPrompt,
        answersSummary: Object.entries(answers)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join(' • '),
        providerId,
      });

      if (onAssessmentCompleted) {
        onAssessmentCompleted(answers, data, finalCompletedPrompt);
      }
    } catch (err) {
      console.error('Error submitting dynamic wizard:', err);
      alert('Chyba při komunikaci s vyhodnocovacím agentem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================================
  // FÁZE 1: INTERAKTIVNÍ DOTAZNÍK (NO-PROMPT UX)
  // =========================================================================
  if (!result) {
    return (
      <div className="w-full max-w-4xl mx-auto py-4 animate-in fade-in duration-300">
        <div className="glass-panel rounded-3xl p-6 sm:p-10 border-2 border-cyan-500/40 shadow-[0_25px_80px_rgba(6,182,212,0.18)] relative overflow-hidden">
          {/* Subtle Glow effects */}
          <div className="absolute -top-32 -left-32 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="border-b border-cyan-500/20 pb-6 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                {onBackToLauncher && (
                  <button
                    onClick={onBackToLauncher}
                    className="p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-400 hover:text-white hover:border-cyan-500/40 transition-colors cursor-pointer mr-1"
                    title="Zpět na výběr kategorie"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}

                <div className="w-12 h-12 rounded-2xl bg-cyan-950/90 border border-cyan-400/50 flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                  {agent.icon || '🎯'}
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
                    <span>{agent.name}</span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-400/40 text-cyan-300">
                      v{agent.version || '1.0'}
                    </span>
                  </h1>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 font-bold">
                      Fáze 2: Nastavení cílových hodnot
                    </span>
                    <span className="text-xs text-slate-300 font-mono">
                      Krok {currentStepIndex + 1} z {totalSteps} • {agent.category}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Tools in Header */}
              <div className="flex items-center gap-2.5 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => AgentStorageService.downloadAgentMarkdown(agent)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-mono transition-colors cursor-pointer"
                  title="Stáhnout tohoto agenta jako přenositelný .agent.md soubor"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden sm:inline">Exportovat .agent.md</span>
                </button>

                <button
                  onClick={handleResetForm}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700 text-xs font-mono transition-colors cursor-pointer"
                  title="Resetovat formulář na výchozí hodnoty"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>

                <span className="text-xs font-mono px-3.5 py-1.5 rounded-full bg-cyan-950/90 border border-cyan-400/50 text-cyan-300 font-bold shadow-inner">
                  {Math.round(((currentStepIndex + 1) / totalSteps) * 100)}% DOKONČENO
                </span>
              </div>
            </div>

            {/* Stepper Progress Bar */}
            <div 
              className="grid gap-2 mt-6"
              style={{ gridTemplateColumns: `repeat(${totalSteps}, minmax(0, 1fr))` }}
            >
              {stepGroups.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    idx === currentStepIndex
                      ? 'bg-gradient-to-r from-cyan-400 to-teal-400 shadow-[0_0_12px_rgba(6,182,212,0.8)]'
                      : idx < currentStepIndex
                      ? 'bg-cyan-600/70'
                      : 'bg-slate-800/80 hover:bg-slate-700'
                  }`}
                  title={`Přejít na krok ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Active Questions Container */}
          <div className="min-h-[380px] flex flex-col justify-between">
            <div className="space-y-8 animate-in fade-in duration-200">
              {activeQuestions.map((question) => {
                const val = answers[question.id];

                return (
                  <div key={question.id} className="p-6 rounded-2xl bg-[#060c18] border border-cyan-500/20 space-y-4">
                    <div>
                      <h3 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                        <span>{question.title}</span>
                        {question.isMultiSelect && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                            Možno vybrat více
                          </span>
                        )}
                      </h3>
                      {question.subtitle && (
                        <p className="text-xs text-slate-400 mt-1">{question.subtitle}</p>
                      )}
                    </div>

                    {/* COMPONENT 1: SLIDER */}
                    {question.component === 'slider' && question.sliderConfig && (
                      <div className="space-y-3 pt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-mono text-slate-400">Nastavená hodnota:</span>
                          <span className="font-mono text-cyan-300 font-extrabold text-base bg-cyan-950/90 px-3.5 py-1 rounded-xl border border-cyan-500/30 shadow-sm">
                            {val ?? question.sliderConfig.defaultValue}{' '}
                            <span className="text-xs text-slate-400 font-normal">{question.sliderConfig.unit}</span>
                          </span>
                        </div>
                        <input
                          type="range"
                          min={question.sliderConfig.min}
                          max={question.sliderConfig.max}
                          step={question.sliderConfig.step}
                          value={val ?? question.sliderConfig.defaultValue}
                          onChange={(e) => handleValueChange(question.id, Number(e.target.value))}
                          className="w-full accent-cyan-400 h-2.5 bg-slate-900 rounded-lg cursor-pointer"
                        />
                      </div>
                    )}

                    {/* COMPONENT 2: SELECT CHIPS */}
                    {question.component === 'chips' && question.options && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {question.options.map((opt) => {
                          const isSelected = question.isMultiSelect
                            ? Array.isArray(val) && val.includes(opt.value)
                            : val === opt.value;

                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => handleToggleChip(question, opt.value)}
                              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start justify-between gap-3 ${
                                isSelected
                                  ? 'bg-cyan-950/90 border-cyan-400 text-white shadow-[0_0_20px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400'
                                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                              }`}
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-white">{opt.label}</span>
                                  {opt.badge && (
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-900/50 text-cyan-300 border border-cyan-500/30 font-bold">
                                      {opt.badge}
                                    </span>
                                  )}
                                </div>
                                {opt.description && (
                                  <p className="text-xs text-slate-400 leading-snug">{opt.description}</p>
                                )}
                              </div>
                              {isSelected ? (
                                <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                              ) : (
                                <div className="w-5 h-5 rounded-full border border-slate-700 shrink-0 mt-0.5" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* COMPONENT 3: DROPDOWN */}
                    {question.component === 'dropdown' && question.options && (
                      <div className="pt-2">
                        <select
                          value={val || ''}
                          onChange={(e) => handleValueChange(question.id, e.target.value)}
                          className="w-full p-3.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-white text-sm focus:ring-2 focus:ring-cyan-400 focus:outline-none cursor-pointer"
                        >
                          {question.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Collapsible Live Prompt Inspector */}
            <div className="mt-6 pt-3 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setShowLivePromptPreview(!showLivePromptPreview)}
                className="flex items-center justify-between w-full text-[11px] font-mono text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer py-1.5 px-1"
              >
                <span className="flex items-center gap-2">
                  <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                  <span>
                    {showLivePromptPreview 
                      ? 'Skrýt sestavovaný prompt pro AI' 
                      : `Zobrazit sestavovaný prompt pro AI (Krok ${currentStepIndex + 1} z ${totalSteps})`}
                  </span>
                </span>
                {showLivePromptPreview ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {showLivePromptPreview && (
                <div className="mt-2 rounded-2xl bg-[#080d17] border border-cyan-500/25 p-4 text-left space-y-2 shadow-xl animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-cyan-500/15 pb-2">
                    <span className="text-[11px] text-slate-400 font-mono">
                      Vaše volby v tomto kroku okamžitě formují parametry a systémové instrukce:
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                      Živý náhled
                    </span>
                  </div>
                  <div className="relative rounded-xl bg-slate-950/95 border border-slate-800/90 p-3 max-h-48 overflow-y-auto font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap selection:bg-cyan-500/30">
                    {currentLivePrompt}
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Buttons with Prompt Inspector trigger */}
            <div className="pt-6 border-t border-cyan-500/20 flex flex-wrap items-center justify-between gap-3 mt-8">
              <button
                onClick={() => setCurrentStepIndex((s) => Math.max(0, s - 1))}
                disabled={currentStepIndex === 0}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Předchozí krok</span>
              </button>

              {currentStepIndex < totalSteps - 1 ? (
                <button
                  onClick={() => setCurrentStepIndex((s) => Math.min(totalSteps - 1, s + 1))}
                  className="flex items-center gap-2 px-8 py-3.5 rounded-2xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:brightness-110 transition-all cursor-pointer"
                >
                  <span>Pokračovat</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    type="button"
                    onClick={handleOpenPromptInspector}
                    className="flex items-center gap-2 px-4 py-3.5 rounded-2xl text-xs font-bold bg-slate-900/90 border border-cyan-500/40 text-cyan-300 hover:text-white hover:bg-cyan-950/60 hover:border-cyan-400 transition-all cursor-pointer shadow-sm"
                    title="Zkontrolovat přesný prompt před odesláním do AI"
                  >
                    <Eye className="w-4 h-4 text-cyan-400" />
                    <span>Zkontrolovat prompt pro AI</span>
                  </button>

                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex items-center gap-2.5 px-8 py-3.5 rounded-2xl text-xs sm:text-sm font-extrabold bg-gradient-to-r from-cyan-400 via-cyan-300 to-teal-400 text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.8)] hover:scale-105 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Sparkles className="w-5 h-5 animate-pulse" />
                    <span>{isSubmitting ? 'Vyhodnocuji profil...' : 'Vygenerovat doporučení'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Prompt Inspector Modal (Phase 1) */}
        <PromptInspectorModal
          isOpen={isPromptInspectorOpen}
          onClose={() => setIsPromptInspectorOpen(false)}
          promptText={inspectorPromptText}
          formData={answers as any}
          onSubmit={() => {
            setIsPromptInspectorOpen(false);
            handleSubmit();
          }}
          isSubmitting={isSubmitting}
        />
      </div>
    );
  }

  // =========================================================================
  // FÁZE 2: VÝSLEDKY DOPORUČENÍ (GROUNDED TEXT-ONLY REASONING DLE PRD)
  // =========================================================================
  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Top Banner with Actions */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border-2 border-cyan-400/60 shadow-[0_20px_60px_rgba(6,182,212,0.25)] relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-cyan-500/20 mb-5">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-400/40 flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Doporučení dokončeno: {agent.name}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {result.providerUsed && (
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 shadow-sm bg-cyan-950/90 text-cyan-300 border-cyan-400/70">
                {result.isLiveAI ? <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> : <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />}
                <span>{result.providerUsed}</span>
              </span>
            )}

            <button
              type="button"
              onClick={handleOpenPromptInspector}
              className="text-[11px] font-mono text-cyan-400 hover:text-cyan-200 px-2.5 py-1 rounded-lg bg-cyan-950/40 border border-cyan-500/30 hover:border-cyan-400 transition-colors cursor-pointer flex items-center gap-1.5"
              title="Zobrazit kompletní prompt odeslaný do AI"
            >
              <Eye className="w-3 h-3 text-cyan-400" />
              <span>Zobrazit prompt</span>
            </button>

            {onOpenSubscriptionModal && (
              <button
                onClick={onOpenSubscriptionModal}
                className="text-[11px] font-mono text-cyan-400 hover:text-cyan-200 px-2.5 py-1 rounded-lg bg-cyan-950/40 border border-cyan-500/30 hover:border-cyan-400 transition-colors cursor-pointer"
                title="Spravovat AI poskytovatele a API klíče"
              >
                Nastavit mozek (BYOK)
              </button>
            )}
          </div>
        </div>

        {/* Summary Assessment */}
        <div className="space-y-2 mb-6">
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Souhrnné expertní zhodnocení
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            {result.summaryAssessment}
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-800/80">
          <button
            onClick={() => setResult(null)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-cyan-500/40 transition-colors cursor-pointer"
            title="Změnit zadané hodnoty ve wizardu"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Upravit cílové hodnoty</span>
          </button>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-cyan-950 border border-cyan-400/40 text-cyan-300 hover:bg-cyan-900/60 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isSubmitting ? 'Přepočítávám...' : 'Přegenerovat s AI'}</span>
          </button>

          {onBackToLauncher && (
            <button
              onClick={onBackToLauncher}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer ml-auto"
              title="Zpět na výběr parametrů nebo novou kategorii"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Upravit parametry / Nová kategorie</span>
            </button>
          )}
        </div>
      </div>

      {/* Recommended Models Shortlist (Grounded Text-Only per PRD v1) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Doporučený shortlist modelů ({result.recommendations.length})</span>
            <span className="text-xs font-mono font-normal text-slate-400">
              Ověřeno v reálném čase
            </span>
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {result.recommendations.map((rec, idx) => (
            <div
              key={rec.id || idx}
              className="p-6 rounded-3xl bg-[#060c18] border border-cyan-500/30 shadow-lg hover:border-cyan-400/60 transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                    {rec.brand}
                  </span>
                  <h4 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                    {rec.model}
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-extrabold px-3 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-400/40">
                    Shoda {rec.matchScore}%
                  </span>
                </div>
              </div>

              {/* Reasoning */}
              <div className="space-y-1">
                <span className="text-xs font-mono font-semibold text-slate-400">
                  Proč je tento model ideální volbou:
                </span>
                <p className="text-sm text-slate-200 leading-relaxed">
                  {rec.reasoning}
                </p>
              </div>

              {/* Pros and Cons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {rec.pros && rec.pros.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-teal-950/20 border border-teal-500/20 space-y-1.5">
                    <span className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
                      <ThumbsUp className="w-3.5 h-3.5" />
                      Silné stránky:
                    </span>
                    <ul className="text-xs text-slate-300 space-y-1">
                      {rec.pros.map((pro, pIdx) => (
                        <li key={pIdx} className="flex items-start gap-1.5">
                          <span className="text-teal-400 mt-0.5">•</span>
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {rec.cons && rec.cons.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/20 space-y-1.5">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <ThumbsDown className="w-3.5 h-3.5" />
                      Potenciální kompromisy:
                    </span>
                    <ul className="text-xs text-slate-300 space-y-1">
                      {rec.cons.map((con, cIdx) => (
                        <li key={cIdx} className="flex items-start gap-1.5">
                          <span className="text-amber-400 mt-0.5">•</span>
                          <span>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contraindications / Caveats */}
      {result.contraindicationsOrCaveats && result.contraindicationsOrCaveats.length > 0 && (
        <div className="p-5 rounded-2xl bg-[#060c18] border border-amber-500/30 text-amber-200 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-300">
            <AlertCircle className="w-4 h-4" />
            <span>Důležitá upozornění a na co dát pozor při nákupu:</span>
          </div>
          <ul className="space-y-1 text-slate-300 pl-6 list-disc">
            {result.contraindicationsOrCaveats.map((c, idx) => (
              <li key={idx}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Completed Prompt Card (saved after final step) */}
      <div className="p-5 rounded-2xl bg-[#060c18] border border-cyan-500/30 text-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-cyan-300 font-bold font-mono">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Hotový prompt pro AI (uložen po posledním kroku)</span>
          </div>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(currentLivePrompt);
              setCopiedFinalPrompt(true);
              setTimeout(() => setCopiedFinalPrompt(false), 2000);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/30 text-cyan-300 text-xs font-mono transition-colors cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copiedFinalPrompt ? 'Zkopírováno!' : 'Kopírovat finální prompt'}</span>
          </button>
        </div>
        <p className="text-[11px] text-slate-400">
          Tento prompt byl finálně zkompletován a uložen do paměti agenta po dokončení všech {totalSteps} kroků dotazníku.
        </p>
        <div className="rounded-xl bg-slate-950 p-3.5 font-mono text-xs text-slate-300 max-h-48 overflow-y-auto border border-slate-800/80 leading-relaxed whitespace-pre-wrap selection:bg-cyan-500/30">
          {currentLivePrompt}
        </div>
      </div>

      {/* Prompt Inspector Modal (Phase 2) */}
      <PromptInspectorModal
        isOpen={isPromptInspectorOpen}
        onClose={() => setIsPromptInspectorOpen(false)}
        promptText={inspectorPromptText}
        formData={answers as any}
        onSubmit={() => {
          setIsPromptInspectorOpen(false);
          handleSubmit();
        }}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};
