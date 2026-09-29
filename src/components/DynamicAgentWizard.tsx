'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  UniversalAgentDefinition, 
  UniversalEvaluationResult, 
  WizardQuestion,
  forgeAgentPrompt,
  serializeAgentToMarkdown, 
  resolveAgentIcon 
} from '@/lib/agent/universal-agent-schema';
import { AgentStorageService } from '@/lib/agent/agent-storage-service';
import { PromptInspectorModal } from './PromptInspectorModal';
import { AssessmentFeedbackLoop } from './AssessmentFeedbackLoop';
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
  FileCode,
  PenLine,
  X,
  ExternalLink,
  ArrowRight,
  History
} from 'lucide-react';
import { PromptStorageService } from '@/lib/agent/prompt-storage-service';
import { useI18n } from '@/lib/i18n/I18nContext';

interface DynamicAgentWizardProps {
  agent: UniversalAgentDefinition;
  locale?: "cs" | "en";
  onBackToLauncher?: () => void;
  onOpenChat?: (customPrompt?: string, evalResult?: UniversalEvaluationResult | null, wizardAnswers?: Record<string, any>) => void;
  activeProviderId?: string;
  currentApiKeys?: Record<string, string>;
  userFacts?: any[];
  onOpenSubscriptionModal?: () => void;
  onAssessmentCompleted?: (answers: Record<string, any>, result: UniversalEvaluationResult, completedPrompt?: string) => void;
  initialShowResult?: boolean;
  initialSavedAnswers?: Record<string, any>;
  initialSavedResult?: UniversalEvaluationResult | null;
  initialStepIndex?: number;
  onStepChange?: (stepIndex: number, currentAnswers: Record<string, any>) => void;
  onResetWizard?: () => void;
  onEditWizard?: () => void;
}

export const DynamicAgentWizard: React.FC<DynamicAgentWizardProps> = ({
  agent,
  onBackToLauncher,
  onOpenChat,
  activeProviderId,
  currentApiKeys,
  userFacts,
  onOpenSubscriptionModal,
  onAssessmentCompleted,
  initialShowResult = false,
  initialSavedAnswers,
  initialSavedResult,
  initialStepIndex = 0,
  onStepChange,
  onResetWizard,
  onEditWizard,
}) => {
  const { t, locale } = useI18n();

  // Initialize default answers from agent definition
  const initialAnswers = useMemo(() => {
    const acc: Record<string, any> = {};
    for (const q of agent.questions) {
      acc[q.id] = q.defaultValue;
    }
    return acc;
  }, [agent]);

  const savedStateFromStorage = useMemo(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem("bairight_agent_wizard_states");
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed[agent.id] || null;
      }
    } catch {}
    return null;
  }, [agent.id]);

  const [answers, setAnswers] = useState<Record<string, any>>(() => {
    const savedAnswers = initialSavedAnswers || savedStateFromStorage?.answers;
    if (savedAnswers && Object.keys(savedAnswers).length > 0) {
      return { ...initialAnswers, ...savedAnswers };
    }
    return initialAnswers;
  });
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(initialStepIndex || 0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [result, setResult] = useState<UniversalEvaluationResult | null>(() => {
    if (initialSavedResult) return initialSavedResult;
    if (initialShowResult && savedStateFromStorage?.result) {
      return savedStateFromStorage.result;
    }
    return null;
  });
  const [previousResult, setPreviousResult] = useState<UniversalEvaluationResult | null>(null);
  const hasAutoEvaluatedRef = useRef<boolean>(false);

  // Prompt Inspector Modal State
  const [isPromptInspectorOpen, setIsPromptInspectorOpen] = useState<boolean>(false);
  const [inspectorPromptText, setInspectorPromptText] = useState<string>('');
  const [copiedFinalPrompt, setCopiedFinalPrompt] = useState<boolean>(false);
  const [showLivePromptPreview, setShowLivePromptPreview] = useState<boolean>(false);

  // Deployment Guides & RAG Memory State (Phase 2 Deliverable)
  const [activeGuideTab, setActiveGuideTab] = useState<'gemini' | 'chatgpt' | 'claude'>('gemini');
  const [isGuidesExpanded, setIsGuidesExpanded] = useState<boolean>(false);
  const [copiedSnippetType, setCopiedSnippetType] = useState<string | null>(null);
  const [sessionFeedbackFacts, setSessionFeedbackFacts] = useState<Array<{ fact: string; category: string }>>([]);
  const [isRecalculatingWithFeedback, setIsRecalculatingWithFeedback] = useState<boolean>(false);
  const [feedbackSavedNotification, setFeedbackSavedNotification] = useState<string | null>(null);
  const [showBYOKHintModal, setShowBYOKHintModal] = useState<boolean>(false);

  // Baseline Product Experience Mode State ('first_purchase' | 'has_experience' | null)
  const [baselineMode, setBaselineMode] = useState<'first_purchase' | 'has_experience' | null>(() => {
    const saved = initialSavedAnswers || savedStateFromStorage?.answers;
    if (saved && (saved.baselineModel || saved.baselineLikes || saved.baselineDislikes)) {
      return 'has_experience';
    }
    return null;
  });

  const hasApiKey = useMemo(() => {
    if (currentApiKeys && Object.values(currentApiKeys).some((k) => typeof k === "string" && k.trim().length > 0)) {
      return true;
    }
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("bairight_api_keys");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Object.values(parsed).some((k) => typeof k === "string" && k.trim().length > 0)) {
            return true;
          }
        }
      } catch {}
    }
    return false;
  }, [currentApiKeys, activeProviderId]);

  // When opened directly in result mode from homepage, auto-evaluate once on mount
  useEffect(() => {
    if (initialShowResult && initialSavedResult) {
      setResult(initialSavedResult);
    } else if (initialShowResult && !result && savedStateFromStorage?.result) {
      setResult(savedStateFromStorage.result);
    } else if (initialShowResult && !result && !initialSavedResult && !hasAutoEvaluatedRef.current) {
      hasAutoEvaluatedRef.current = true;
      handleSubmit();
    }
  }, [initialShowResult, initialSavedResult, savedStateFromStorage]);

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

  const totalSteps = stepGroups.length + 1;
  const activeQuestions = stepGroups[currentStepIndex] || [];

  const handleValueChange = (questionId: string, value: any) => {
    setAnswers((prev) => {
      const next = { ...prev, [questionId]: value };
      if (onStepChange) onStepChange(currentStepIndex, next);
      return next;
    });
  };

  // Custom Write-in Answers State
  const [customAnswerText, setCustomAnswerText] = useState<Record<string, string>>({});
  const [activeCustomInputs, setActiveCustomInputs] = useState<Record<string, boolean>>({});

  const handleActivateCustomAnswer = (questionId: string) => {
    setActiveCustomInputs((prev) => ({ ...prev, [questionId]: true }));
  };

  const handleCustomTextChange = (question: WizardQuestion, text: string) => {
    setCustomAnswerText((prev) => ({ ...prev, [question.id]: text }));

    setAnswers((prev) => {
      if (question.isMultiSelect) {
        const currentArr = Array.isArray(prev[question.id]) ? [...prev[question.id]] : [];
        const oldText = customAnswerText[question.id];
        const filtered = oldText ? currentArr.filter((item) => item !== oldText) : currentArr;
        if (text.trim()) {
          return { ...prev, [question.id]: [...filtered, text.trim()] };
        }
        return { ...prev, [question.id]: filtered };
      } else {
        return { ...prev, [question.id]: text };
      }
    });
  };

  const handleRemoveCustomAnswer = (question: WizardQuestion) => {
    const oldText = customAnswerText[question.id];
    setCustomAnswerText((prev) => {
      const next = { ...prev };
      delete next[question.id];
      return next;
    });
    setActiveCustomInputs((prev) => ({ ...prev, [question.id]: false }));

    setAnswers((prev) => {
      if (question.isMultiSelect) {
        const currentArr = Array.isArray(prev[question.id]) ? [...prev[question.id]] : [];
        return {
          ...prev,
          [question.id]: currentArr.filter((item) => item !== oldText),
        };
      } else {
        const defaultVal = question.defaultValue || question.options?.[0]?.value || '';
        return {
          ...prev,
          [question.id]: defaultVal,
        };
      }
    });
  };

  const handleToggleChip = (question: WizardQuestion, chipValue: string) => {
    setAnswers((prev) => {
      const current = prev[question.id];
      if (chipValue === '__SKIP__') {
        setActiveCustomInputs((aPrev) => ({ ...aPrev, [question.id]: false }));
        return {
          ...prev,
          [question.id]: '__SKIP__',
        };
      }
      if (question.isMultiSelect) {
        const arr = Array.isArray(current)
          ? [...current].filter((x) => x !== '__SKIP__')
          : typeof current === 'string' && current && current !== '__SKIP__'
          ? [current]
          : [];
        const exists = arr.includes(chipValue);
        const nextArr = exists ? arr.filter((x) => x !== chipValue) : [...arr, chipValue];
        return {
          ...prev,
          [question.id]: nextArr.length > 0 ? nextArr : '__SKIP__',
        };
      } else {
        setActiveCustomInputs((aPrev) => ({ ...aPrev, [question.id]: false }));
        return {
          ...prev,
          [question.id]: chipValue,
        };
      }
    });
  };

  const handleResetForm = () => {
    setAnswers(initialAnswers);
    setCustomAnswerText({});
    setActiveCustomInputs({});
    setBaselineMode(null);
    setCurrentStepIndex(0);
    setResult(null);
    setSessionFeedbackFacts([]);
    setFeedbackSavedNotification(null);
  };

  const handleCancelWizard = () => {
    // Discard any unsaved progress in this edit session
    setAnswers(initialAnswers);
    setCustomAnswerText({});
    setActiveCustomInputs({});
    setBaselineMode(null);
    setCurrentStepIndex(0);

    if (previousResult) {
      // Restore previous result
      setResult(previousResult);
    } else if (onBackToLauncher) {
      // Exit back to launcher
      onBackToLauncher();
    }
  };

  const enrichedFacts = useMemo(() => {
    const base = Array.isArray(userFacts)
      ? userFacts
          .filter((f) => f.isEnriched !== false)
          .map((f) => ({
            fact: f.fact || `${f.label || 'Poznámka'}: ${f.value || ''}`,
            category: f.category || 'biometrics',
          }))
      : [];
    return [...base, ...sessionFeedbackFacts];
  }, [userFacts, sessionFeedbackFacts]);

  const currentLivePrompt = useMemo(() => {
    return forgeAgentPrompt(agent, answers, enrichedFacts, locale);
  }, [agent, answers, enrichedFacts, locale]);

  const handleOpenPromptInspector = () => {
    setInspectorPromptText(currentLivePrompt);
    setIsPromptInspectorOpen(true);
  };

  const handleDownloadAgentMarkdown = () => {
    AgentStorageService.downloadAgentMarkdown(agent, answers, locale);
  };

  const handleCopyText = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippetType(type);
    setTimeout(() => setCopiedSnippetType(null), 2500);
  };

  const handleApplyFeedback = async (feedbackSummary: string, activeTags: string[], customNote: string) => {
    const newFact = {
      fact: `Zpětná vazba: ${feedbackSummary}`,
      category: 'user_feedback_history',
    };
    setSessionFeedbackFacts((prev) => [...prev, newFact]);
    setFeedbackSavedNotification(feedbackSummary);
    setTimeout(() => setFeedbackSavedNotification(null), 8000);

    // Persist into localStorage for future sessions
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('bairight_custom_memory_facts');
        const facts = stored ? JSON.parse(stored) : [];
        facts.push({
          id: `feedback-${Date.now()}`,
          fact: feedbackSummary,
          category: 'feedback',
          source: agent.name,
          timestamp: new Date().toISOString(),
        });
        localStorage.setItem('bairight_custom_memory_facts', JSON.stringify(facts));
      } catch (e) {
        console.error('Failed to persist feedback fact:', e);
      }
    }

    // Dynamic re-evaluation with updated RAG facts
    setIsRecalculatingWithFeedback(true);
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
            if (providerId && parsed[providerId]) apiKey = parsed[providerId];
          } catch {}
        }
      }
      if (currentApiKeys && providerId && currentApiKeys[providerId]) {
        apiKey = currentApiKeys[providerId];
      }

      const updatedFacts = [...enrichedFacts, newFact];
      const res = await fetch('/api/agent/evaluate-universal-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent,
          answers,
          ragFacts: updatedFacts,
          providerId,
          apiKey,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.recommendations) {
          setResult(data);
          if (onAssessmentCompleted) {
            const completedPrompt = forgeAgentPrompt(agent, answers, updatedFacts, locale);
            onAssessmentCompleted(answers, data, completedPrompt);
          }
        }
      }
    } catch (err) {
      console.error('Error recalculating with feedback:', err);
    } finally {
      setIsRecalculatingWithFeedback(false);
    }
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
          locale,
        }),
      });

      if (!res.ok) throw new Error('Failed to evaluate agent recommendation');
      const data: UniversalEvaluationResult = await res.json();
      setResult(data);
      setPreviousResult(data);

      // Sestavíme a uložíme VÝHRADNĚ HOTOVÝ prompt po dokončení posledního kroku
      const finalCompletedPrompt = forgeAgentPrompt(agent, answers, enrichedFacts, locale);
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
      alert(t.dynamicWizardLoading.communicationError);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state when landing directly in result mode
  if (initialShowResult && !result && isSubmitting) {
    return (
      <div className="w-full max-w-4xl mx-auto py-20 px-4 text-center space-y-6 animate-in fade-in duration-300">
        <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-xl animate-pulse" />
          <div className="relative w-16 h-16 rounded-full bg-cyan-950/80 border-2 border-cyan-400/50 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.3)]">
            <div className="w-7 h-7 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950 border border-cyan-400/40 text-cyan-300 text-xs font-mono font-bold">
            <span>{t.dynamicWizardLoading.wakingUp}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {agent.name}
          </h2>
          <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
            {t.dynamicWizardLoading.loadingDetails}
          </p>
        </div>
      </div>
    );
  }

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

          {/* Clean Focused Header */}
          <div className="border-b border-cyan-500/20 pb-5 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                {onBackToLauncher && (
                  <button
                    onClick={onBackToLauncher}
                    className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-400 hover:text-white hover:border-cyan-500/40 transition-colors cursor-pointer shrink-0"
                    title={locale === 'en' ? "Back to category selection" : "Zpět na výběr kategorie"}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}


                <div className="min-w-0">
                  <h1 className="text-base sm:text-lg md:text-xl font-black text-white tracking-tight leading-snug">
                    {agent.name}
                  </h1>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    {t.dynamicWizard.stepIndicator.replace('{current}', String(currentStepIndex + 1)).replace('{total}', String(totalSteps))} • {agent.category}
                  </p>
                </div>
              </div>

              {/* Action Tools in Header */}
              <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
                {previousResult && (
                  <button
                    type="button"
                    onClick={() => setResult(previousResult)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/90 hover:bg-cyan-900 border border-cyan-400/50 text-cyan-300 text-xs font-mono font-bold transition-colors cursor-pointer shadow-sm"
                    title={locale === 'en' ? "Return to completed results" : "Návrat zpět na hotový výsledek a hotového agenta"}
                  >
                    <span>{locale === 'en' ? 'Back to results' : 'Zpět na výsledky'}</span>
                  </button>
                )}

                <button
                  onClick={handleResetForm}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border border-slate-800 hover:border-slate-700 text-xs font-mono transition-colors cursor-pointer"
                  title={locale === 'en' ? "Reset form to default values" : "Resetovat formulář na výchozí hodnoty"}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>

                <span className="text-xs font-mono px-3.5 py-1.5 rounded-xl bg-cyan-950/90 border border-cyan-400/50 text-cyan-300 font-bold shadow-inner whitespace-nowrap">
                  {Math.round(((currentStepIndex + 1) / totalSteps) * 100)}% {locale === 'en' ? 'COMPLETED' : 'DOKONČENO'}
                </span>

                <button
                  type="button"
                  onClick={handleCancelWizard}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/30 hover:bg-rose-950/70 text-rose-300 border border-rose-500/30 hover:border-rose-400 text-xs font-mono font-bold transition-all cursor-pointer shadow-sm ml-1"
                  title={previousResult ? (locale === 'en' ? "Close editing and discard unsaved progress" : "Zavřít editaci a zahodit neuložený progress") : (locale === 'en' ? "Close wizard and return home" : "Zavřít wizard a vrátit se na úvod")}
                  aria-label={locale === 'en' ? "Close wizard" : "Zavřít wizard"}
                >
                  <X className="w-4 h-4 text-rose-400" />
                  <span>{locale === 'en' ? 'Close' : 'Zavřít'}</span>
                </button>
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
                  title={`${locale === 'en' ? 'Go to step' : 'Přejít na krok'} ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Active Questions Container */}
          <div className="min-h-[380px] flex flex-col justify-between">
            <div className="space-y-8 animate-in fade-in duration-200">
              {currentStepIndex === stepGroups.length ? (
                /* BASELINE PRODUCT & EXPERIENCE STEP (VOLITELNÝ INTERAKTIVNÍ KROK VŠECH WIZARDŮ) */
                <div className="p-6 rounded-2xl bg-[#060c18] border border-cyan-500/30 space-y-6 animate-in fade-in duration-300">
                  <div className="border-b border-cyan-500/20 pb-4 space-y-1">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 block">
                      {locale === 'en' ? `Step ${totalSteps} of ${totalSteps} • Optional Baseline Experience` : `Krok ${totalSteps} z ${totalSteps} • Volitelná zkušenost s produktem`}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                      {locale === 'en' ? 'Current Experience & Baseline Product' : 'Dosavadní zkušenosti & Stávající produkt'}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {locale === 'en'
                        ? 'Do you already have experience with this product category? The agent will contrast new models directly against what you know.'
                        : 'Máte již s touto kategorií zkušenost? Agent porovná nové modely přímo s tím, co znáte.'}
                    </p>
                  </div>

                  {/* 2-Card Interactive Choice: Karta A vs Karta B */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Karta A: První nákup v této kategorii */}
                    <button
                      type="button"
                      onClick={() => {
                        setBaselineMode('first_purchase');
                        handleValueChange('baselineModel', '');
                        handleValueChange('baselineLikes', '');
                        handleValueChange('baselineDislikes', '');
                      }}
                      className={`p-5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${baselineMode === 'first_purchase' ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400/50' : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'}`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-white tracking-wide">
                            {locale === 'en' ? 'First purchase in this category' : 'První nákup v této kategorii'}
                          </h4>
                          {baselineMode === 'first_purchase' && (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 border border-cyan-400/50 text-cyan-300">
                              {locale === 'en' ? 'SELECTED' : 'ZVOLENO'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {locale === 'en'
                            ? 'I do not currently own or use a product in this category. Take me straight to expert recommendations.'
                            : 'Zatím v této kategorii žádný produkt nevlastním ani nepoužívám. Chci přejít rovnou k doporučením.'}
                        </p>
                      </div>
                      <div className="pt-2">
                        <span className="text-xs font-mono font-semibold text-cyan-400/80">
                          {locale === 'en' ? 'Skip baseline form' : 'Přeskočí formulář'}
                        </span>
                      </div>
                    </button>

                    {/* Karta B: Vlastním / používal jsem produkt z téhle kategorie */}
                    <button
                      type="button"
                      onClick={() => setBaselineMode('has_experience')}
                      className={`p-5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${baselineMode === 'has_experience' ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400/50' : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'}`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-white tracking-wide">
                            {locale === 'en' ? 'I own / used a product in this category' : 'Vlastním / používal jsem produkt z téhle kategorie'}
                          </h4>
                          {baselineMode === 'has_experience' && (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 border border-cyan-400/50 text-cyan-300">
                              {locale === 'en' ? 'SELECTED' : 'ZVOLENO'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {locale === 'en'
                            ? 'I have experience with a specific model and want to specify what worked and what disappointed me.'
                            : 'Používám nebo jsem používal konkrétní model a chci specifikovat, co mi vyhovovalo a co vadilo.'}
                        </p>
                      </div>
                      <div className="pt-2">
                        <span className="text-xs font-mono font-semibold text-cyan-400/80">
                          {locale === 'en' ? 'Open baseline form' : 'Otevře formulář níže'}
                        </span>
                      </div>
                    </button>
                  </div>

                  {/* Expanded Form: Only when Karta B is selected */}
                  {baselineMode === 'has_experience' && (
                    <div className="space-y-4 pt-4 border-t border-cyan-500/20 animate-in fade-in slide-in-from-top-2 duration-300">
                      {/* Field 1: Current Model */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-200 block">
                          {locale === 'en' ? 'Which specific model do you currently own / use?' : 'Jaký konkrétní model nyní vlastníte / používáte?'}
                        </label>
                        <input
                          type="text"
                          value={answers['baselineModel'] || ''}
                          onChange={(e) => handleValueChange('baselineModel', e.target.value)}
                          placeholder={locale === 'en' ? 'e.g. DeLonghi Magnifica S / Hoka Clifton 8 / Sidi Shot 2' : 'např. DeLonghi Magnifica S / Hoka Clifton 8 / Sidi Shot 2'}
                          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs sm:text-sm focus:border-cyan-400 focus:outline-none transition-all placeholder:text-slate-600 shadow-inner"
                        />
                      </div>

                      {/* Field 2: Likes */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                          <span className="text-emerald-400 select-none font-bold">✓</span>
                          <span>{locale === 'en' ? 'What worked well & what do you want to keep?' : 'Co vám na něm nejvíce vyhovuje a chcete to i u nového?'}</span>
                        </label>
                        <input
                          type="text"
                          value={answers['baselineLikes'] || ''}
                          onChange={(e) => handleValueChange('baselineLikes', e.target.value)}
                          placeholder={locale === 'en' ? 'e.g. Fast heat-up time, compact footprint, low weight' : 'např. Rychlý náběh, kompaktní rozměry na lince'}
                          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs sm:text-sm focus:border-emerald-500/50 focus:outline-none transition-all placeholder:text-slate-600 shadow-inner"
                        />
                      </div>

                      {/* Field 3: Dislikes */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                          <span className="text-amber-400 select-none font-bold">•</span>
                          <span>{locale === 'en' ? 'What frustrates you or what broke down / failed?' : 'Co vám na něm nejvíce vadí nebo co selhalo?'}</span>
                        </label>
                        <input
                          type="text"
                          value={answers['baselineDislikes'] || ''}
                          onChange={(e) => handleValueChange('baselineDislikes', e.target.value)}
                          placeholder={locale === 'en' ? 'e.g. Loud grinder, tedious manual milk wand cleaning, pinched instep' : 'např. Hlučný mlýnek, náročné ruční čištění mléčné trysky'}
                          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs sm:text-sm focus:border-amber-500/50 focus:outline-none transition-all placeholder:text-slate-600 shadow-inner"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                activeQuestions.map((question) => {
                const val = answers[question.id];
                const cleanTitle = question.title.replace(/^Jaké jsou vaše požadavky na:\s*/i, '').replace(/\?$/, '');

                return (
                  <div key={question.id} className="p-6 rounded-2xl bg-[#060c18] border border-cyan-500/20 space-y-4">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                        <span>{cleanTitle}</span>
                        {question.isMultiSelect && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 font-bold">
                            {locale === "en" ? "Multiple options allowed" : "Možno vybrat více"}
                          </span>
                        )}
                      </h3>
                      {question.subtitle && (
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{question.subtitle}</p>
                      )}
                    </div>

                    {/* COMPONENT 1: SLIDER */}
                    {question.component === 'slider' && question.sliderConfig && (
                      <div className="space-y-3 pt-2">
                        <div className="flex justify-between items-center">
                          {locale === 'en' ? <span className="text-xs font-mono text-slate-400">Set value:</span> : <span className="text-xs font-mono text-slate-400">Nastavená hodnota:</span>}
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

                    {/* COMPONENT: BRANDS / VÝROBCI (PREFEROVANÉ VS. ZAKÁZANÉ ZNAČKY) */}
                    {(question.component === 'brands' || question.id.includes('brand') || question.title.toLowerCase().includes('značk') || question.title.toLowerCase().includes('brand')) && (() => {
                      const brandVal = typeof val === 'object' && val !== null && !Array.isArray(val)
                        ? { preferred: val.preferred || '', forbidden: val.forbidden || '' }
                        : { preferred: typeof val === 'string' && !val.includes('forbidden:') ? val : '', forbidden: '' };

                      const updateBrandPref = (text: string) => {
                        handleValueChange(question.id, { ...brandVal, preferred: text });
                      };

                      const updateBrandForb = (text: string) => {
                        handleValueChange(question.id, { ...brandVal, forbidden: text });
                      };

                      const preferredTags = (brandVal.preferred || '')
                        .split(/[,;\n]+/)
                        .map((s: string) => s.trim())
                        .filter(Boolean);

                      const forbiddenTags = (brandVal.forbidden || '')
                        .split(/[,;\n]+/)
                        .map((s: string) => s.trim())
                        .filter(Boolean);

                      const removeTag = (type: 'preferred' | 'forbidden', tagToRemove: string) => {
                        if (type === 'preferred') {
                          const remaining = preferredTags.filter((t: string) => t.toLowerCase() !== tagToRemove.toLowerCase());
                          updateBrandPref(remaining.join(', '));
                        } else {
                          const remaining = forbiddenTags.filter((t: string) => t.toLowerCase() !== tagToRemove.toLowerCase());
                          updateBrandForb(remaining.join(', '));
                        }
                      };

                      return (
                        <div className="space-y-4 pt-1">
                          {/* 1. PREFEROVANÉ ZNAČKY (CHCI) */}
                          <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-emerald-300 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span>{t.brandSelector.preferredTitle}</span>
                              </label>
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-900/40 text-emerald-300 border border-emerald-500/30">
                                {preferredTags.length > 0 ? t.brandSelector.preferredBadgeSelected.replace('{count}', String(preferredTags.length)) : t.brandSelector.preferredBadgeOpen}
                              </span>
                            </div>

                            <input
                              type="text"
                              value={brandVal.preferred}
                              onChange={(e) => updateBrandPref(e.target.value)}
                              placeholder={t.brandSelector.preferredPlaceholder}
                              className="w-full px-3.5 py-2.5 bg-slate-950/90 rounded-xl border border-emerald-500/30 focus:border-emerald-400 text-sm text-white placeholder-slate-500 outline-none transition-all shadow-inner"
                            />

                            {preferredTags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {preferredTags.map((tag: string) => (
                                  <span
                                    key={tag}
                                    className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-900/60 text-emerald-200 border border-emerald-500/40"
                                  >
                                    <span>{tag}</span>
                                    <button
                                      type="button"
                                      onClick={() => removeTag('preferred', tag)}
                                      className="hover:text-white p-0.5 rounded cursor-pointer"
                                      title={locale === 'en' ? "Remove brand" : "Odebrat značku"}
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* 2. ZAKÁZANÉ / VYLOUČENÉ ZNAČKY (NECHCI) */}
                          <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-rose-300 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-rose-400" />
                                <span>{t.brandSelector.forbiddenTitle}</span>
                              </label>
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-900/40 text-rose-300 border border-rose-500/30">
                                {forbiddenTags.length > 0 ? t.brandSelector.forbiddenBadgeSelected.replace('{count}', String(forbiddenTags.length)) : t.brandSelector.forbiddenBadgeNone}
                              </span>
                            </div>

                            <input
                              type="text"
                              value={brandVal.forbidden}
                              onChange={(e) => updateBrandForb(e.target.value)}
                              placeholder={t.brandSelector.forbiddenPlaceholder}
                              className="w-full px-3.5 py-2.5 bg-slate-950/90 rounded-xl border border-rose-500/30 focus:border-rose-400 text-sm text-white placeholder-slate-500 outline-none transition-all shadow-inner"
                            />

                            {forbiddenTags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {forbiddenTags.map((tag: string) => (
                                  <span
                                    key={tag}
                                    className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-rose-900/60 text-rose-200 border border-rose-500/40 line-through"
                                  >
                                    <span>{tag}</span>
                                    <button
                                      type="button"
                                      onClick={() => removeTag('forbidden', tag)}
                                      className="hover:text-white p-0.5 rounded cursor-pointer no-underline"
                                      title={locale === 'en' ? "Remove from forbidden" : "Odebrat ze zakázaných"}
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Quick reset to all brands */}
                          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                            <span>
                              {preferredTags.length === 0 && forbiddenTags.length === 0
                                ? t.brandSelector.openSelectionHint
                                : t.brandSelector.strictRulesHint}
                            </span>
                            {(preferredTags.length > 0 || forbiddenTags.length > 0) && (
                              <button
                                type="button"
                                onClick={() => handleValueChange(question.id, { preferred: '', forbidden: '' })}
                                className="text-cyan-400 hover:text-cyan-300 underline font-medium cursor-pointer"
                              >
                                {t.brandSelector.clearRestrictions}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* COMPONENT 2: SELECT CHIPS */}
                    {question.component === 'chips' && question.options && !question.id.includes('brand') && !question.title.toLowerCase().includes('značk') && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {question.isMultiSelect && (
                          <div className="sm:col-span-2 flex items-center gap-2 text-xs font-mono text-cyan-300 font-bold bg-cyan-950/60 px-3.5 py-1.5 rounded-xl border border-cyan-500/30 w-fit">
                            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                            <span>{locale === 'en' ? 'You can select multiple options' : 'Můžete vybrat více možností (Multiselect)'}</span>
                          </div>
                        )}
                        {question.options.map((opt, optIdx) => {
                          const isSelected = question.isMultiSelect
                            ? Array.isArray(val) && val.includes(opt.value)
                            : val === opt.value;

                          const hasMeaningfulDesc = opt.description && 
                            opt.description !== opt.label && 
                            !opt.description.toLowerCase().startsWith('preference:');

                          return (
                            <button
                              key={`${opt.value}-${optIdx}`}
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
                                {hasMeaningfulDesc && (
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
                        {/* Skip / Neutral option */}
                        <button
                          type="button"
                          onClick={() => handleToggleChip(question, '__SKIP__')}
                          className={`sm:col-span-2 p-3.5 rounded-2xl border text-center transition-all cursor-pointer flex items-center justify-center gap-2 text-xs font-bold ${
                            (Array.isArray(val) ? val.includes('__SKIP__') : val === '__SKIP__')
                              ? 'bg-slate-800/90 border-cyan-400 text-cyan-300 shadow-md ring-1 ring-cyan-400'
                              : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                          }`}
                        >
                          <span>{t.dynamicWizardLoading.skipChip}</span>
                        </button>

                        {/* Interactive Custom / Write-In Option */}
                        {activeCustomInputs[question.id] || customAnswerText[question.id] ? (
                          <div className="sm:col-span-2 p-3.5 rounded-2xl bg-cyan-950/70 border-2 border-cyan-400 text-white shadow-[0_0_20px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400 space-y-2 animate-in fade-in duration-200">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5">
                                <PenLine className="w-3.5 h-3.5 text-cyan-400" />
                                {t.dynamicWizardLoading.customChoice}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveCustomAnswer(question)}
                                className="text-slate-400 hover:text-red-400 p-1 rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
                                title={locale === 'en' ? 'Remove custom choice' : 'Zrušit vlastní volbu'}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <input
                              type="text"
                              autoFocus
                              value={customAnswerText[question.id] || ''}
                              onChange={(e) => handleCustomTextChange(question, e.target.value)}
                              placeholder={locale === 'en' ? 'Write your custom answer or specific clarification...' : 'Napište vlastní odpověď či specifické upřesnění...'}
                              className="w-full px-3.5 py-2.5 bg-slate-950/90 rounded-xl border border-cyan-500/40 focus:border-cyan-300 text-sm text-white placeholder-slate-500 outline-none transition-all shadow-inner"
                            />
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleActivateCustomAnswer(question.id)}
                            className="sm:col-span-2 p-3.5 rounded-2xl border border-dashed border-cyan-500/30 bg-cyan-950/20 hover:bg-cyan-950/40 hover:border-cyan-400/60 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-2 text-xs font-bold group"
                          >
                            <PenLine className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                            <span>{locale === 'en' ? t.dynamicWizard.writeCustomOption : 'Napsat vlastní možnost (jiný specifický požadavek)...'}</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* COMPONENT 3: DROPDOWN */}
                    {question.component === 'dropdown' && question.options && (
                      <div className="pt-2 space-y-3">
                        <select
                          value={val || ''}
                          onChange={(e) => handleValueChange(question.id, e.target.value)}
                          className="w-full p-3.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-white text-sm focus:ring-2 focus:ring-cyan-400 focus:outline-none cursor-pointer"
                        >
                          {question.options.map((opt, optIdx) => (
                            <option key={`${opt.value}-${optIdx}`} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>

                        {/* Interactive Custom / Write-In Option for Dropdown */}
                        {activeCustomInputs[question.id] || customAnswerText[question.id] ? (
                          <div className="p-3.5 rounded-2xl bg-cyan-950/70 border-2 border-cyan-400 text-white shadow-[0_0_20px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400 space-y-2 animate-in fade-in duration-200">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5">
                                <PenLine className="w-3.5 h-3.5 text-cyan-400" />
                                {locale === "en" ? "Custom requirement:" : "Vlastní specifická volba:"}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveCustomAnswer(question)}
                                className="text-slate-400 hover:text-red-400 p-1 rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
                                title={locale === "en" ? "Clear custom requirement" : "Zrušit vlastní volbu"}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <input
                              type="text"
                              autoFocus
                              value={customAnswerText[question.id] || ''}
                              onChange={(e) => handleCustomTextChange(question, e.target.value)}
                              placeholder={t.dynamicWizard.customChoicePlaceholder}
                              className="w-full px-3.5 py-2.5 bg-slate-950/90 rounded-xl border border-cyan-500/40 focus:border-cyan-300 text-sm text-white placeholder-slate-500 outline-none transition-all shadow-inner"
                            />
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleActivateCustomAnswer(question.id)}
                            className="w-full p-2.5 rounded-xl border border-dashed border-cyan-500/30 bg-cyan-950/20 hover:bg-cyan-950/40 hover:border-cyan-400/60 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-2 text-xs font-bold group"
                          >
                            <PenLine className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                            <span>{t.dynamicWizard.writeCustomOption}</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* COMPONENT: TEXT (free-form text input — no predefined options) */}
                    {question.component === 'text' && (
                      <div className="pt-2 space-y-2">
                        <textarea
                          rows={3}
                          autoFocus
                          value={typeof val === 'string' ? val : ''}
                          onChange={(e) => handleValueChange(question.id, e.target.value)}
                          placeholder={locale === 'en' ? 'Write your answer or specification…' : 'Napište svoji odpověď nebo specifikaci…'}
                          className="w-full px-4 py-3 bg-slate-900/80 rounded-2xl border border-cyan-500/30 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 text-sm text-white placeholder-slate-500 outline-none transition-all resize-none shadow-inner leading-relaxed"
                        />
                        <p className="text-xs text-slate-500 px-1">{locale === 'en' ? 'Write typical values or specific requirements as free text.' : 'Tipické hodnoty nebo specifické požadavky pište volným textem.'}</p>
                      </div>
                    )}
                  </div>
                );
              })
              )}
            </div>

            {/* Navigation Buttons with Prompt Inspector trigger */}
            <div className="pt-6 border-t border-cyan-500/20 flex flex-wrap items-center justify-between gap-3 mt-8">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                  const nextIdx = Math.max(0, currentStepIndex - 1);
                  setCurrentStepIndex(nextIdx);
                  if (onStepChange) onStepChange(nextIdx, answers);
                }}
                  disabled={currentStepIndex === 0}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>{t.dynamicWizard.btnPrevious}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCancelWizard}
                  className="flex items-center gap-1.5 px-4 py-3 rounded-2xl text-xs font-mono text-slate-400 hover:text-rose-300 hover:bg-rose-950/30 border border-slate-800 hover:border-rose-500/40 transition-all cursor-pointer"
                  title={previousResult ? (locale === 'en' ? "Close editing and discard unsaved progress" : "Zavřít editaci a zahodit neuložený progress") : (locale === 'en' ? "Close wizard and return home" : "Zavřít wizard a vrátit se na úvod")}
                >
                  <X className="w-3.5 h-3.5 text-rose-400" />
                  <span>{t.dynamicWizard.btnCancel}</span>
                </button>
              </div>

              {currentStepIndex < totalSteps - 1 ? (
                <button
                  onClick={() => {
                  const nextIdx = Math.min(totalSteps - 1, currentStepIndex + 1);
                  setCurrentStepIndex(nextIdx);
                  if (onStepChange) onStepChange(nextIdx, answers);
                }}
                  className="flex items-center gap-2 px-8 py-3.5 rounded-2xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:brightness-110 transition-all cursor-pointer"
                >
                  <span>{t.dynamicWizard.btnContinue}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    type="button"
                    onClick={handleOpenPromptInspector}
                    className="flex items-center gap-2 px-4 py-3.5 rounded-2xl text-xs font-bold bg-slate-900/90 border border-cyan-500/40 text-cyan-300 hover:text-white hover:bg-cyan-950/60 hover:border-cyan-400 transition-all cursor-pointer shadow-sm"
                    title={locale === 'en' ? "Inspect prompt sent to AI" : "Zkontrolovat přesný prompt před odesláním do AI"}
                  >
                    <Eye className="w-4 h-4 text-cyan-400" />
                    <span>{t.dynamicWizard.btnInspectPrompt}</span>
                  </button>

                  {currentStepIndex === stepGroups.length && (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="px-4 py-3.5 rounded-2xl text-xs font-bold bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all cursor-pointer"
                      title={locale === 'en' ? "Skip baseline step and evaluate" : "Přeskočit stávající zkušenosti a spustit vyhodnocení"}
                    >
                      <span>{locale === 'en' ? 'Skip & Evaluate' : 'Přeskočit & Vyhodnotit'}</span>
                    </button>
                  )}
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex items-center gap-2.5 px-8 py-3.5 rounded-2xl text-xs sm:text-sm font-extrabold bg-gradient-to-r from-cyan-400 via-cyan-300 to-teal-400 text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.8)] hover:scale-105 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting && <div className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />}
                    <span>{isSubmitting ? t.dynamicWizard.btnEvaluating : (currentStepIndex === stepGroups.length ? (locale === 'en' ? 'Evaluate & Recommend' : 'Vyhodnotit & Doporučit') : t.dynamicWizard.btnEvaluate)}</span>
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
  // FÁZE 2: AGENT DELIVERY HUB & VÝSLEDKY DOPORUČENÍ (PRD v1.2)
  // =========================================================================
  return (
    <div className="w-full max-w-5xl mx-auto space-y-7 py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 1. HERO DELIVERABLE: THE AGENT CARD */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border-2 border-cyan-400/60 shadow-[0_20px_60px_rgba(6,182,212,0.25)] relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-cyan-500/20 mb-6">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {agent.name}
              </h2>
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-400/50 shadow-sm">
                  {locale === 'en' ? 'Agent Ready for Use' : 'Agent připraven k použití'}
                </span>
              </div>
              <p className="text-xs font-mono text-slate-400 mt-0.5">
                {locale === 'en' ? 'Category:' : 'Kategorie:'} <span className="text-cyan-300 font-semibold">{agent.category}</span> • {locale === 'en' ? 'Version' : 'Verze'} {agent.version || '1.0.0'} • {locale === 'en' ? 'Calibrated for your exact requirements' : 'Zkalibrováno pro vaše míry a preference'}
              </p>
            </div>

          <div className="flex items-center gap-2">
            {result.providerUsed && (
              <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 shadow-sm bg-cyan-950/90 text-cyan-300 border-cyan-400/70">
                
                <span>{result.providerUsed}</span>
              </span>
            )}

            <button
              type="button"
              onClick={handleOpenPromptInspector}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-200 px-3 py-1.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 hover:border-cyan-400 transition-colors cursor-pointer flex items-center gap-1.5"
              title={locale === 'en' ? "View full prompt sent to AI" : "Zobrazit kompletní prompt odeslaný do AI"}
            >
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t.dynamicWizard.btnInspectPrompt}</span>
            </button>
          </div>
        </div>

        {/* Primary Action Deliverables Bar */}
        <div className="space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            {locale === 'en'
              ? 'Congratulations! The questionnaire was successfully evaluated and your personal shopping agent is fully configured. Below you can download the agent as a portable file, copy its instructions, or run it directly in bAIright.'
              : 'Gratulujeme! Dotazník byl úspěšně vyhodnocen a váš osobní nákupní agent je kompletně zkonfigurován. Níže si můžete agenta stáhnout jako přenosný soubor, zkopírovat jeho instrukce nebo ho rovnou provozovat v bAIright.'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {/* Download MD file */}
            <button
              type="button"
              onClick={handleDownloadAgentMarkdown}
              className="flex flex-col items-start p-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-teal-500/20 to-cyan-950 border-2 border-cyan-400/70 hover:border-cyan-300 text-white shadow-[0_0_25px_rgba(6,182,212,0.35)] hover:scale-[1.02] transition-all cursor-pointer group"
              title={locale === 'en' ? "Download full agent definition in open .agent.md format" : "Stáhnout kompletní definici agenta v otevřeném formátu .agent.md"}
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <span className="text-xs font-mono font-extrabold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-cyan-300 group-hover:translate-y-0.5 transition-transform" />
                  {locale === 'en' ? 'Primary Deliverable' : 'Hlavní výstup'}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-900/60 border border-cyan-400/40 text-cyan-200 font-bold">
                  .agent.md
                </span>
              </div>
              <span className="text-sm font-extrabold text-white">{locale === 'en' ? 'Download .agent.md File' : 'Stáhnout .agent.md soubor'}</span>
              <span className="text-[11px] text-slate-300 mt-0.5">{locale === 'en' ? 'Portable file with all rules and weights' : 'Přenosný soubor se všemi pravidly a váhami'}</span>
            </button>

            {/* Copy Instructions */}
            <button
              type="button"
              onClick={() => handleCopyText(currentLivePrompt, 'system_prompt')}
              className="flex flex-col items-start p-4 rounded-2xl bg-[#091526] border border-cyan-500/30 hover:border-cyan-400/70 text-slate-200 hover:text-white transition-all cursor-pointer group"
              title={locale === 'en' ? "Copy complete system instructions to clipboard" : "Zkopírovat kompletní systémové instrukce do schránky"}
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  {copiedSnippetType === 'system_prompt' ? <Check className="w-4 h-4 text-teal-300" /> : <Copy className="w-4 h-4 text-cyan-400" />}
                  {copiedSnippetType === 'system_prompt' ? (locale === 'en' ? 'Copied!' : 'Zkopírováno!') : (locale === 'en' ? 'To Clipboard' : 'Do schránky')}
                </span>
              </div>
              <span className="text-sm font-extrabold text-white">{locale === 'en' ? 'Copy Prompt Instructions' : 'Kopírovat instrukce promptu'}</span>
              <span className="text-[11px] text-slate-400 mt-0.5">{locale === 'en' ? 'Paste directly into any LLM window' : 'Vložte přímo do jakéhokoliv LLM okna'}</span>
            </button>

            {/* Adjust Values / Edit Wizard */}
            <button
              type="button"
              onClick={() => {
                setResult(null);
                if (onEditWizard) onEditWizard();
              }}
              className="flex flex-col items-start p-4 rounded-2xl bg-[#091526] border border-cyan-500/40 hover:border-cyan-300 text-slate-300 hover:text-white transition-all cursor-pointer group hover:scale-[1.02] shadow-sm"
              title={locale === 'en' ? "Open questionnaire steps to adjust parameters" : "Otevřít kroky dotazníku a upravit zadané parametry"}
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5">
                  
                  {locale === 'en' ? 'Edit Parameters' : 'Editace parametrů'}
                </span>
              </div>
              <span className="text-sm font-extrabold text-white">{t.dynamicWizard.btnEdit}</span>
              <span className="text-[11px] text-slate-400 mt-0.5">{locale === 'en' ? 'Change answers, weights, and criteria' : 'Změnit odpovědi, váhy a kritéria'}</span>
            </button>

            {/* Reset Form / Start Fresh */}
            <button
              type="button"
              onClick={() => {
                setResult(null);
                setCurrentStepIndex(0);
                setAnswers(initialAnswers);
                if (onResetWizard) onResetWizard();
              }}
              className="flex flex-col items-start p-4 rounded-2xl bg-[#091526] border border-slate-800 hover:border-red-500/50 text-slate-300 hover:text-white transition-all cursor-pointer group hover:scale-[1.02] shadow-sm"
              title={locale === 'en' ? "Reset questionnaire and start from step 1" : "Vynulovat dotazník a začít výběr od 1. kroku"}
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <span className="text-xs font-mono font-bold text-slate-400 group-hover:text-red-400 flex items-center gap-1.5 transition-colors">
                  <RotateCcw className="w-4 h-4 text-slate-400 group-hover:rotate-[-180deg] transition-transform duration-500" />
                  {locale === 'en' ? 'Reset Questionnaire' : 'Vynulovat dotazník'}
                </span>
              </div>
              <span className="text-sm font-extrabold text-white">{locale === 'en' ? 'Reset & Start Fresh' : 'Začít znovu od nuly'}</span>
              <span className="text-[11px] text-slate-400 mt-0.5">{locale === 'en' ? 'Clear custom answers and restart wizard' : 'Vymazat vlastní parametry a restartovat dotazník'}</span>
            </button>

            {/* Direct Chat with AI Model */}
            {(onOpenChat || onOpenSubscriptionModal) && (
              <button
                type="button"
                onClick={() => {
                  if (hasApiKey && onOpenChat) {
                    onOpenChat(currentLivePrompt, result || previousResult, answers);
                  } else {
                    setShowBYOKHintModal(true);
                  }
                }}
                className="flex flex-col items-start p-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-teal-500/20 to-slate-900 border-2 border-cyan-400/80 hover:border-cyan-300 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:scale-[1.02] transition-all cursor-pointer group"
                title={locale === 'en' ? "Open live consultative chat with this agent" : "Spustit přímou interaktivní konzultaci s tímto agentem"}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <span className="text-xs font-mono font-extrabold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                    {locale === 'en' ? 'Live Discussion' : 'Živá diskuse'}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-900/80 border border-cyan-400/50 text-cyan-200 font-bold">
                    {hasApiKey
                      ? (locale === 'en' ? 'BYOK Connected' : 'Model připojen')
                      : (locale === 'en' ? 'Open Chat' : 'Přejít do chatu')}
                  </span>
                </div>
                <span className="text-sm font-extrabold text-white">{locale === 'en' ? 'Open Chat & Agent Results' : 'Spustit chat & Výsledky agenta'}</span>
                <span className="text-[11px] text-slate-300 mt-0.5">{locale === 'en' ? 'Direct consultative discussion with AI model' : 'Přímá interaktivní diskuse s vaším AI modelem'}</span>
              </button>
            )}


          </div>
        </div>
      </div>

      {/* 2. PLATFORM DEPLOYMENT GUIDES (GEMINI GEMS, CHATGPT CUSTOM GPTS, CLAUDE PROJECTS) */}
      <div className="rounded-3xl bg-[#060c18] border border-cyan-500/30 shadow-lg overflow-hidden transition-all">
        {/* Collapsible Header Accordion Toggle */}
        <button
          type="button"
          onClick={() => setIsGuidesExpanded((prev) => !prev)}
          className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-cyan-950/20 transition-colors cursor-pointer group"
          aria-expanded={isGuidesExpanded}
        >
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2 flex-wrap">
              <span>{locale === 'en' ? 'How to create your own agent from this file' : 'Jak si z tohoto souboru vytvořit vlastního agenta'}</span>
              <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-cyan-300 hidden sm:inline">
                Google Gemini • ChatGPT • Claude
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              {locale === 'en'
                ? 'Step-by-step guides for Gem Manager, Custom GPTs, and Claude Projects.'
                : 'Návody krok za krokem pro Gem Manager, Custom GPTs a Claude Projects.'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-3">
            <span className="text-xs font-mono text-cyan-400 font-semibold hidden md:inline">
              {isGuidesExpanded
                ? (locale === 'en' ? 'Hide instructions' : 'Skrýt návod')
                : (locale === 'en' ? 'Show instructions' : 'Zobrazit návod')}
            </span>
            <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400 group-hover:border-cyan-500/40 transition-colors">
              {isGuidesExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>
        </button>

        {/* Collapsible Content */}
        {isGuidesExpanded && (
          <div className="p-5 sm:p-6 pt-0 border-t border-slate-800/80 space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4">
              <p className="text-xs text-slate-400">
                {locale === 'en' ? 'Choose your preferred AI platform and follow the steps below:' : 'Vyberte svou oblíbenou AI platformu a postupujte podle návodu níže:'}
              </p>

              {/* Guide Platform Switcher Tabs */}
              <div className="flex items-center p-1 rounded-2xl bg-slate-950 border border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveGuideTab('gemini')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeGuideTab === 'gemini'
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-400/60 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Google Gemini (Gems)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveGuideTab('chatgpt')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeGuideTab === 'chatgpt'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-400/60 shadow-sm'
                  : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ChatGPT (Custom GPTs)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveGuideTab('claude')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeGuideTab === 'claude'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-400/60 shadow-sm'
                  : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Claude (Projects)
                </button>
              </div>
            </div>

        {/* Tab Content: Google Gemini Gems */}
        {activeGuideTab === 'gemini' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 text-xs text-slate-300 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-300 text-sm flex items-center gap-1.5">
                  {locale === 'en' ? 'Instructions for Google Gemini (Gem Manager):' : 'Návod pro Google Gemini (Gem Manager):'}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyText(currentLivePrompt, 'gemini_prompt')}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-950 border border-cyan-400/40 text-cyan-300 text-xs font-mono font-bold hover:bg-cyan-900/50 transition-colors cursor-pointer"
                >
                  {copiedSnippetType === 'gemini_prompt' ? <Check className="w-3.5 h-3.5 text-teal-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSnippetType === 'gemini_prompt' ? (locale === 'en' ? 'Copied!' : 'Zkopírováno!') : (locale === 'en' ? 'Copy Instructions for Gem' : 'Kopírovat instrukce pro Gem')}</span>
                </button>
              </div>

              <ol className="space-y-2 text-slate-300 pl-5 list-decimal leading-relaxed">
                <li>
                  {locale === 'en' ? (
                    <>Open <a href="https://gemini.google.com" target="_blank" rel="noreferrer" className="text-cyan-400 underline font-semibold inline-flex items-center gap-0.5">Google Gemini <ExternalLink className="w-3 h-3 inline" /></a> and in the left sidebar click <strong>Gem Manager</strong> → <strong>+ New Gem</strong>.</>
                  ) : (
                    <>Otevřete <a href="https://gemini.google.com" target="_blank" rel="noreferrer" className="text-cyan-400 underline font-semibold inline-flex items-center gap-0.5">Google Gemini <ExternalLink className="w-3 h-3 inline" /></a> a v levém menu klikněte na <strong>Správce Gemů (Gem Manager)</strong> → <strong>+ Nový Gem</strong>.</>
                  )}
                </li>
                <li>
                  {locale === 'en' ? 'Set the Gem name to' : 'Jako název Gemu zadejte'} <strong className="text-white">„{agent.name}“</strong>.
                </li>
                <li>
                  {locale === 'en' ? (
                    <>In the <strong>Instructions</strong> text area, paste the copied prompt, or upload the downloaded file <code className="text-cyan-300 bg-slate-900 px-1 py-0.5 rounded">{agent.id}.agent.md</code>.</>
                  ) : (
                    <>Do textového pole <strong>Instrukce (Instructions)</strong> vložte zkopírované instrukce z tlačítka výše, případně nahrajte stažený soubor <code className="text-cyan-300 bg-slate-900 px-1 py-0.5 rounded">{agent.id}.agent.md</code>.</>
                  )}
                </li>
                <li>
                  {locale === 'en' ? 'Click Create. Your Gem is immediately ready to give personalized recommendations!' : 'Klikněte na Vytvořit. Váš Gem je okamžitě připraven odpovídat s veškerou vaší doménovou logikou a preferencemi!'}
                </li>
              </ol>
            </div>
          </div>
        )}

        {/* Tab Content: OpenAI ChatGPT Custom GPTs */}
        {activeGuideTab === 'chatgpt' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-4 rounded-2xl bg-teal-950/20 border border-teal-500/20 text-xs text-slate-300 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-teal-300 text-sm flex items-center gap-1.5">
                  {locale === 'en' ? 'Instructions for OpenAI ChatGPT (Custom GPT):' : 'Návod pro OpenAI ChatGPT (Custom GPT):'}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyText(currentLivePrompt, 'chatgpt_prompt')}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-teal-950 border border-teal-400/40 text-teal-300 text-xs font-mono font-bold hover:bg-teal-900/50 transition-colors cursor-pointer"
                >
                  {copiedSnippetType === 'chatgpt_prompt' ? <Check className="w-3.5 h-3.5 text-teal-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSnippetType === 'chatgpt_prompt' ? (locale === 'en' ? 'Copied!' : 'Zkopírováno!') : (locale === 'en' ? 'Copy Instructions for GPT' : 'Kopírovat instrukce pro GPT')}</span>
                </button>
              </div>

              <ol className="space-y-2 text-slate-300 pl-5 list-decimal leading-relaxed">
                <li>
                  {locale === 'en' ? (
                    <>Open <a href="https://chatgpt.com" target="_blank" rel="noreferrer" className="text-teal-400 underline font-semibold inline-flex items-center gap-0.5">ChatGPT <ExternalLink className="w-3 h-3 inline" /></a>, select <strong>Explore GPTs</strong> in the left sidebar and click <strong>+ Create</strong>.</>
                  ) : (
                    <>Otevřete <a href="https://chatgpt.com" target="_blank" rel="noreferrer" className="text-teal-400 underline font-semibold inline-flex items-center gap-0.5">ChatGPT <ExternalLink className="w-3 h-3 inline" /></a>, v levém sloupci zvolte <strong>Explore GPTs</strong> a klikněte na <strong>+ Create</strong> (vpravo nahoře).</>
                  )}
                </li>
                <li>
                  {locale === 'en' ? 'Switch to Configure tab and enter name' : 'Přepněte se do záložky Configure a zadejte jméno'} <strong className="text-white">„{agent.name}“</strong>.
                </li>
                <li>
                  {locale === 'en' ? (
                    <>In <strong>Instructions</strong> paste the copied prompt and under <strong>Knowledge</strong> upload <code className="text-teal-300 bg-slate-900 px-1 py-0.5 rounded">{agent.id}.agent.md</code>.</>
                  ) : (
                    <>Do pole <strong>Instructions</strong> vložte zkopírovaný prompt a v sekci <strong>Knowledge</strong> nahrajte stažený soubor <code className="text-teal-300 bg-slate-900 px-1 py-0.5 rounded">{agent.id}.agent.md</code>.</>
                  )}
                </li>
                <li>
                  {locale === 'en' ? 'Click Save / Confirm. Your tailored shopping advisor is ready.' : 'Klikněte vpravo nahoře na Save / Confirm. Váš specializovaný rádce je vám trvale k dispozici.'}
                </li>
              </ol>
            </div>
          </div>
        )}

        {/* Tab Content: Anthropic Claude Projects */}
        {activeGuideTab === 'claude' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/20 text-xs text-slate-300 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-300 text-sm flex items-center gap-1.5">
                  {locale === 'en' ? 'Instructions for Anthropic Claude (Projects):' : 'Návod pro Anthropic Claude (Projects):'}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyText(currentLivePrompt, 'claude_prompt')}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-950 border border-amber-400/40 text-amber-300 text-xs font-mono font-bold hover:bg-amber-900/50 transition-colors cursor-pointer"
                >
                  {copiedSnippetType === 'claude_prompt' ? <Check className="w-3.5 h-3.5 text-teal-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSnippetType === 'claude_prompt' ? (locale === 'en' ? 'Copied!' : 'Zkopírováno!') : (locale === 'en' ? 'Copy Instructions for Claude' : 'Kopírovat instrukce pro Claude')}</span>
                </button>
              </div>

              <ol className="space-y-2 text-slate-300 pl-5 list-decimal leading-relaxed">
                <li>
                  {locale === 'en' ? (
                    <>Open <a href="https://claude.ai" target="_blank" rel="noreferrer" className="text-amber-400 underline font-semibold inline-flex items-center gap-0.5">Claude.ai <ExternalLink className="w-3 h-3 inline" /></a> and select <strong>Projects</strong> → <strong>New Project</strong> named <strong className="text-white">„{agent.name}“</strong>.</>
                  ) : (
                    <>Otevřete <a href="https://claude.ai" target="_blank" rel="noreferrer" className="text-amber-400 underline font-semibold inline-flex items-center gap-0.5">Claude.ai <ExternalLink className="w-3 h-3 inline" /></a> a v levém menu zvolte <strong>Projects</strong> → <strong>New Project</strong> s názvem <strong className="text-white">„{agent.name}“</strong>.</>
                  )}
                </li>
                <li>
                  {locale === 'en' ? 'In project settings click Set custom instructions and paste the prompt.' : 'V nastavení projektu klikněte na Set custom instructions a vložte zkopírované instrukce z bAIright.'}
                </li>
                <li>
                  {locale === 'en' ? (
                    <>In <strong>Project Knowledge</strong> upload <code className="text-amber-300 bg-slate-900 px-1 py-0.5 rounded">{agent.id}.agent.md</code>.</>
                  ) : (
                    <>V sekci <strong>Project Knowledge</strong> nahrajte soubor <code className="text-amber-300 bg-slate-900 px-1 py-0.5 rounded">{agent.id}.agent.md</code>.</>
                  )}
                </li>
                <li>
                  {locale === 'en' ? 'Claude will automatically apply all your custom rules and constraints in each thread.' : 'Claude v každém novém vláknu v tomto projektu automaticky aplikuje veškerá vámi zadaná pravidla, kriteria a vyloučení.'}
                </li>
              </ol>
            </div>
          </div>
        )}
          </div>
        )}
      </div>

      {/* 3. DIRECT CONNECTION UI: PROPOJIT SE SVÝM MODELEM / PŘEDPLATNÝM (BYOK) - ONLY RENDER IF NO KEY */}
      {!hasApiKey && (
      <div className="rounded-3xl bg-gradient-to-r from-[#081324] via-[#060c18] to-[#040812] border border-cyan-500/30 p-6 sm:p-7 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                {locale === 'en' ? 'Upcoming Integration' : 'Připravovaná integrace'}
              </span>
              <h3 className="text-base sm:text-lg font-extrabold text-white">
                {locale === 'en' ? 'Run directly in bAIright with your own model / subscription' : 'Spouštět přímo v bAIright přes vlastní model / předplatné'}
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
              {locale === 'en'
                ? 'Don\'t want to switch to external windows and copy prompts? Connect your subscription (Claude Pro, ChatGPT Plus, Gemini Advanced) or API key to search with this agent directly with instant response and integrated memory.'
                : 'Nechcete ručně přecházet do externích oken a kopírovat prompty? Propojte své předplatné (Claude Pro, ChatGPT Plus, Gemini Advanced) nebo API klíč a hledejte s tímto agentem rovnou v našem rozhraní s bleskovou odezvou a integrovanou pamětí.'}
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            {onOpenSubscriptionModal ? (
              <button
                type="button"
                onClick={onOpenSubscriptionModal}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold bg-cyan-950 hover:bg-cyan-900/60 border border-cyan-400/50 text-cyan-300 transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.2)]"
              >
                
                <span>{locale === 'en' ? 'Connect account / token (BYOK)' : 'Propojit účet / token (BYOK)'}</span>
              </button>
            ) : (
              <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-400">
                {locale === 'en' ? 'Active:' : 'Aktivní:'} {result.providerUsed || 'bAIright Universal Engine'}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-mono text-slate-400">{locale === 'en' ? 'Supported models:' : 'Podporované modely:'}</span>
          {['Claude 3.5 Sonnet', 'GPT-4o', 'Gemini 1.5 Pro', 'DeepSeek V3', 'Ollama Local'].map((m) => (
            <span key={m} className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-800">
              {m}
            </span>
          ))}
        </div>
      </div>
      )}

      {/* 4. THE ULTIMATE VALUE PROPOSITION: PERSISTENT RAG MEMORY & FEEDBACK LOOP */}
      <div className="rounded-3xl bg-gradient-to-b from-[#0c1f38] via-[#071325] to-[#040913] border-2 border-cyan-400/50 p-6 sm:p-8 shadow-[0_15px_50px_rgba(6,182,212,0.2)] relative overflow-hidden space-y-6">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header of the Value Proposition */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300">
              {locale === 'en' ? 'Key Advantage of bAIright Architecture' : 'Klíčová výhoda bAIright architektury'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {locale === 'en' ? 'Persistent RAG Memory: An Agent that Learns With Every Purchase' : 'Permanentní RAG paměť: Agent, který se s každým nákupem učí'}
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
            {locale === 'en'
              ? 'Why is an agent with profile memory 10× more valuable than a one-off anonymous chat in ChatGPT or Claude?'
              : 'Proč je agent s profilovou pamětí 10× hodnotnější než jednorázový anonymní chat v ChatGPT nebo Claude?'}
          </p>
        </div>

        {/* Contrast Grid: Generic LLM vs bAIright RAG */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-red-950/20 border border-red-500/30 space-y-2">
            <span className="text-xs font-bold text-red-300 flex items-center gap-1.5 font-mono">
              {locale === 'en' ? 'Standard Chat (ChatGPT / Claude / Gemini):' : 'Běžný chat (ChatGPT / Claude / Gemini):'}
            </span>
            <ul className="text-xs text-slate-300 space-y-1.5 leading-relaxed">
              <li>{locale === 'en' ? '• Total amnesia: When you start a new chat in 3 months, it remembers nothing from before.' : '• Totální amnézie: Když za 3 měsíce otevřete nový chat, model si nepamatuje vůbec nic z minula.'}</li>
              <li>{locale === 'en' ? '• Continuous repetition: You have to re-enter all your preferences and budget every single time.' : '• Neustálé opakování: Pokaždé musíte znova vypisovat své rozměry nohy, rozpočet a značky, které nesnášíte.'}</li>
              <li>{locale === 'en' ? '• Zero learning from mistakes: If it suggested an ill-fitting item last time, it will happily recommend it again.' : '• Nulové poučení z chyb: Pokud vám minule doporučil botu, co vás tlačila v nártu, klidně vám ji doporučí znovu.'}</li>
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-teal-950/25 border border-teal-500/40 space-y-2 shadow-inner">
            <span className="text-xs font-bold text-teal-300 flex items-center gap-1.5 font-mono">
              {locale === 'en' ? 'bAIright Agent with persistent RAG memory:' : 'bAIright Agent s permanentní RAG pamětí:'}
            </span>
            <ul className="text-xs text-slate-200 space-y-1.5 leading-relaxed">
              <li>{locale === 'en' ? '• Remembers every recommendation: All previous choices and feedback are stored in your profile.' : '• Pamatuje si každé doporučení: Všechny předchozí volby i váš feedback jsou trvale uloženy ve vaší profilové databázi.'}</li>
              <li>{locale === 'en' ? '• Automatic injection into every prompt: Past context is loaded without retyping.' : '• Automatická injekce do každého promptu: Při každém dalším probuzení agenta se kontext z minulosti automaticky promítne do dotazu bez vašeho přepisování.'}</li>
              <li>{locale === 'en' ? '• Learning feedback loop: Provide feedback and the agent remembers it forever!' : '• Učící se smyčka: Zadáte feedback (např. „Hoka byly moc úzké v nártu“) a agent si to navždy pamatuje pro všechny příští nákupy!'}</li>
            </ul>
          </div>
        </div>

        {/* Step-by-Step Scenario Example */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-cyan-500/30 space-y-3">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
            <History className="w-4 h-4 text-cyan-400" />
            {locale === 'en' ? 'Practical Example: How Continuous Memory Works' : 'Příklad z praxe: Jak funguje kontinuální paměť agenta'}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="font-bold text-slate-300">{locale === 'en' ? '1. Today (First Launch)' : '1. Dnes (První spuštění)'}</span>
              <p className="text-slate-400">{locale === 'en' ? 'Agent recommends shoes. You give feedback: "Hoka pinched my instep, keep budget under $150."' : 'Agent doporučí boty. Dáte mu feedback: „Hoka mě tlačily v nártu a chci strop do 3 500 Kč.“'}</p>
            </div>
            <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 space-y-1">
              <span className="font-bold text-cyan-300">{locale === 'en' ? '2. RAG Indexing' : '2. RAG Uložení'}</span>
              <p className="text-slate-300">{locale === 'en' ? 'Information is indexed into your profile database as a verified shopping fact.' : 'Informace se indexuje do vaší profilové databáze jako ověřený nákupní fakt.'}</p>
            </div>
            <div className="p-3 rounded-xl bg-teal-950/40 border border-teal-500/30 space-y-1">
              <span className="font-bold text-teal-300">{locale === 'en' ? '3. In 6 Months (Next Launch)' : '3. Za půl roku (Další probuzení)'}</span>
              <p className="text-slate-300">{locale === 'en' ? 'Agent autonomously loads: "User has wide instep, exclude narrow lasts, budget under $150."' : 'Agent si sám načte: „Uživatel má široký nárt, vyřadit úzká kopyta Hoka a držet rozpočet 3 500 Kč.“'}</p>
            </div>
          </div>
        </div>

        {/* Current Active RAG Facts for this Agent */}
        {enrichedFacts.length > 0 && (
          <div className="space-y-2 pt-1">
            <span className="text-xs font-mono font-semibold text-slate-400 flex items-center gap-1.5">
              
              {locale === 'en' ? `Active RAG facts in this agent's prompt (${enrichedFacts.length}):` : `Aktuálně načtená RAG fakta v promptu tohoto agenta (${enrichedFacts.length}):`}
            </span>
            <div className="flex flex-wrap gap-2">
              {enrichedFacts.map((f, fIdx) => (
                <span
                  key={fIdx}
                  className="text-xs px-3 py-1 rounded-xl bg-slate-900 border border-cyan-500/20 text-slate-300 flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span>{f.fact}</span>
                </span>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Raw Prompt Accordion */}
      <div className="p-5 rounded-2xl bg-[#060c18] border border-cyan-500/30 text-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-cyan-300 font-bold font-mono">
            <span>{locale === 'en' ? 'Full Generated Agent Prompt' : 'Kompletní vygenerovaný prompt agenta'}</span>
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
            <span>{copiedFinalPrompt ? (locale === 'en' ? 'Copied!' : 'Zkopírováno!') : (locale === 'en' ? 'Copy Final Prompt' : 'Kopírovat finální prompt')}</span>
          </button>
        </div>
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
