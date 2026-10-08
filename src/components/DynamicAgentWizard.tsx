'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
import { SUPPORTED_AI_PROVIDERS } from '@/lib/agent/engine-config';
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
      if (q.component === 'brands' || q.id.includes('brand')) {
        acc[q.id] = q.defaultValue || { preferred: '', forbidden: '' };
      } else if (q.component === 'slider') {
        acc[q.id] = q.defaultValue ?? (q.sliderConfig?.defaultValue || 0);
      } else if (q.component === 'text') {
        acc[q.id] = q.defaultValue || '';
      } else if (q.options && q.options.length > 0) {
        if (Array.isArray(q.defaultValue)) {
          acc[q.id] = q.defaultValue;
        } else if (typeof q.defaultValue === 'string' && q.defaultValue && q.defaultValue !== '__SKIP__') {
          acc[q.id] = [q.defaultValue];
        } else {
          acc[q.id] = [];
        }
      } else {
        acc[q.id] = q.defaultValue;
      }
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

  const cleanAgentTitle = useMemo(() => {
    if (!agent?.name) return '';
    if (agent.name.toLowerCase().startsWith('specialist:')) {
      const topic = agent.name.replace(/^specialist:\s*/i, '').trim();
      const capitalizedTopic = topic.charAt(0).toUpperCase() + topic.slice(1);
      return locale === 'en' ? `${capitalizedTopic} Specialist Advisor` : `Specialista: ${capitalizedTopic}`;
    }
    return agent.name;
  }, [agent?.name, locale]);

  // Robust answer initialization merging defaults, agent targetValues, stored wizard state, and initialSavedAnswers
  const resolvedInitialAnswers = useMemo(() => {
    const base: Record<string, any> = {
      ...initialAnswers,
      ...(agent.targetValues || {}),
      ...(savedStateFromStorage?.answers || {}),
      ...(initialSavedAnswers || {}),
    };
    for (const q of agent.questions) {
      if (q.options && q.options.length > 0) {
        const v = base[q.id];
        if (typeof v === 'string' && v && v !== '__SKIP__') {
          base[q.id] = [v];
        } else if (v === undefined || v === null) {
          base[q.id] = [];
        }
      }
    }
    return base;
  }, [initialAnswers, agent.targetValues, savedStateFromStorage, initialSavedAnswers, agent.questions]);

  const [answers, setAnswers] = useState<Record<string, any>>(() => resolvedInitialAnswers);
  const backupAnswersRef = useRef<Record<string, any>>(resolvedInitialAnswers);

  // Synchronize state if resolvedInitialAnswers provides more detailed answers upon agent switch/load
  useEffect(() => {
    if (resolvedInitialAnswers && Object.keys(resolvedInitialAnswers).length > 0) {
      setAnswers((prev) => {
        const hasPrev = Object.values(prev).some((v) => v !== undefined && v !== '' && (!Array.isArray(v) || v.length > 0));
        if (!hasPrev) {
          backupAnswersRef.current = { ...resolvedInitialAnswers };
          return resolvedInitialAnswers;
        }
        return prev;
      });
    }
  }, [resolvedInitialAnswers]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(() => {
    if (initialStepIndex !== undefined && initialStepIndex !== null) {
      return initialStepIndex;
    }
    if (savedStateFromStorage?.currentStepIndex !== undefined && typeof savedStateFromStorage.currentStepIndex === "number") {
      return savedStateFromStorage.currentStepIndex;
    }
    return 0;
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [result, setResult] = useState<UniversalEvaluationResult | null>(() => {
    if (initialSavedResult) return initialSavedResult;
    if (initialShowResult && savedStateFromStorage?.result) {
      return savedStateFromStorage.result;
    }
    return null;
  });

  // Retroactive Parameter Tuning & Custom Constraints State
  const [isAddingCustomParam, setIsAddingCustomParam] = useState<boolean>(false);
  const [newParamName, setNewParamName] = useState<string>('');
  const [newParamValue, setNewParamValue] = useState<string>('');

  const handleAddCustomParam = async () => {
    if (!newParamName.trim() || !newParamValue.trim()) return;
    const existing: Array<{ id: string; name: string; value: string }> = Array.isArray(answers.customParameters)
      ? answers.customParameters
      : [];
    const newEntry = {
      id: `param-${Date.now()}`,
      name: newParamName.trim(),
      value: newParamValue.trim(),
    };
    const updatedAnswers = {
      ...answers,
      customParameters: [...existing, newEntry],
    };
    setAnswers(updatedAnswers);
    setIsAddingCustomParam(false);
    setNewParamName('');
    setNewParamValue('');
    await handleSubmit(updatedAnswers);
  };

  const handleRemoveCustomParam = async (paramId: string) => {
    const existing: Array<{ id: string; name: string; value: string }> = Array.isArray(answers.customParameters)
      ? answers.customParameters
      : [];
    const filtered = existing.filter((p) => p.id !== paramId);
    const updatedAnswers = {
      ...answers,
      customParameters: filtered,
    };
    setAnswers(updatedAnswers);
    await handleSubmit(updatedAnswers);
  };
  const [previousResult, setPreviousResult] = useState<UniversalEvaluationResult | null>(() => {
    if (initialSavedResult) return initialSavedResult;
    if (initialShowResult && savedStateFromStorage?.result) {
      return savedStateFromStorage.result;
    }
    return null;
  });
  const hasAutoEvaluatedRef = useRef<boolean>(false);

  // Prompt Inspector Modal State
  const [isPromptInspectorOpen, setIsPromptInspectorOpen] = useState<boolean>(false);
  const [inspectorPromptText, setInspectorPromptText] = useState<string>('');
  const [showLivePromptPreview, setShowLivePromptPreview] = useState<boolean>(false);

  // Deployment Guides & RAG Memory State (Phase 2 Deliverable)
  const [activeGuideTab, setActiveGuideTab] = useState<'gemini' | 'chatgpt' | 'claude'>('gemini');
  const [isGuidesExpanded, setIsGuidesExpanded] = useState<boolean>(false);
  const [isParametersExpanded, setIsParametersExpanded] = useState<boolean>(false);
  const [isRAGMemoryExpanded, setIsRAGMemoryExpanded] = useState<boolean>(false);
  const [copiedSnippetType, setCopiedSnippetType] = useState<string | null>(null);
  const [sessionFeedbackFacts, setSessionFeedbackFacts] = useState<Array<{ fact: string; category: string }>>([]);
  const [isRecalculatingWithFeedback, setIsRecalculatingWithFeedback] = useState<boolean>(false);
  const [feedbackSavedNotification, setFeedbackSavedNotification] = useState<string | null>(null);
  const [showBYOKHintModal, setShowBYOKHintModal] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Baseline Product Experience Mode State ('first_purchase' | 'has_experience' | null)
  const [baselineMode, setBaselineMode] = useState<'first_purchase' | 'has_experience' | null>(() => {
    const saved = initialSavedAnswers || savedStateFromStorage?.answers || agent.targetValues;
    if (saved && (saved.baselineModel || saved.baselineLikes || saved.baselineDislikes)) {
      return 'has_experience';
    }
    return null;
  });

  const activeProvider = useMemo(() => {
    return SUPPORTED_AI_PROVIDERS.find((p) => p.id === activeProviderId) || SUPPORTED_AI_PROVIDERS[0];
  }, [activeProviderId]);
  const activeProviderName = activeProvider?.name || 'Google Gemini';

  const displayAgentName = useMemo(() => {
    let name = cleanAgentTitle || agent.name;
    if (locale === 'cs') {
      name = name
        .replace(/Buying Expert/i, 'Nákupní expert')
        .replace(/Shopping Expert/i, 'Nákupní expert')
        .replace(/Expert/i, 'expert')
        .replace(/^Specialist:\s*/i, 'Specialista: ')
        .replace(/^Specialist in\s*/i, 'Specialista na ');
    } else if (locale === 'en') {
      name = name
        .replace(/^Specialista:\s*/i, 'Specialist: ')
        .replace(/^Specialista na\s*/i, 'Specialist in ');
    }
    return name;
  }, [agent.name, cleanAgentTitle, locale]);

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
      setPreviousResult(initialSavedResult);
    } else if (initialShowResult && !result && savedStateFromStorage?.result) {
      setResult(savedStateFromStorage.result);
      setPreviousResult(savedStateFromStorage.result);
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
  const isBaselineStep = currentStepIndex === 0;
  const activeQuestions = !isBaselineStep ? (stepGroups[currentStepIndex - 1] || []) : [];

  const persistProgress = (nextAnswers?: Record<string, any>, stepIdx?: number) => {
    if (typeof window === "undefined" || !agent?.id) return;
    try {
      const storedStates = localStorage.getItem("bairight_agent_wizard_states");
      const parsed = storedStates ? JSON.parse(storedStates) : {};
      const targetAnswers = nextAnswers !== undefined ? nextAnswers : answers;
      const targetStep = stepIdx !== undefined ? stepIdx : currentStepIndex;
      const existing = parsed[agent.id] || {};
      parsed[agent.id] = {
        ...existing,
        answers: targetAnswers,
        currentStepIndex: targetStep,
        isCompleted: existing.isCompleted === true,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem("bairight_agent_wizard_states", JSON.stringify(parsed));
      if (onStepChange) {
        onStepChange(targetStep, targetAnswers);
      }
    } catch (e) {
      console.warn("Failed to persist in-progress wizard state:", e);
    }
  };

  const handleValueChange = (questionId: string, value: any) => {
    setAnswers((prev) => {
      const next = { ...prev, [questionId]: value };
      persistProgress(next, currentStepIndex);
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
      const isMulti = question.component === "chips" || question.isMultiSelect;
      let next: Record<string, any>;
      if (isMulti) {
        const currentArr = Array.isArray(prev[question.id]) ? [...prev[question.id]] : [];
        const oldText = customAnswerText[question.id];
        const filtered = oldText ? currentArr.filter((item) => item !== oldText) : currentArr;
        if (text.trim()) {
          next = { ...prev, [question.id]: [...filtered, text.trim()] };
        } else {
          next = { ...prev, [question.id]: filtered };
        }
      } else {
        next = { ...prev, [question.id]: text };
      }
      persistProgress(next, currentStepIndex);
      return next;
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
      const isMulti = question.component === "chips" || question.isMultiSelect;
      let next: Record<string, any>;
      if (isMulti) {
        const currentArr = Array.isArray(prev[question.id]) ? [...prev[question.id]] : [];
        next = {
          ...prev,
          [question.id]: currentArr.filter((item) => item !== oldText),
        };
      } else {
        const defaultVal = question.defaultValue || question.options?.[0]?.value || '';
        next = {
          ...prev,
          [question.id]: defaultVal,
        };
      }
      persistProgress(next, currentStepIndex);
      return next;
    });
  };

  // Robust Option Matching across slugs, titles, and formatting
  const isOptionMatched = (opt: { value: string; label: string }, valItem: any): boolean => {
    if (valItem === undefined || valItem === null) return false;
    const vStr = String(valItem).trim().toLowerCase();
    const optVal = String(opt.value).trim().toLowerCase();
    const optLab = String(opt.label).trim().toLowerCase();
    const optSlug = optVal.replace(/[^a-z0-9]+/g, '_');
    const vSlug = vStr.replace(/[^a-z0-9]+/g, '_');
    return vStr === optVal || vStr === optLab || vSlug === optSlug || vSlug === optVal || vStr === optSlug;
  };

  // Prefill custom write-in answers from pre-existing answers that don't match standard options
  useEffect(() => {
    const customTexts: Record<string, string> = {};
    const activeInputs: Record<string, boolean> = {};

    for (const q of agent.questions) {
      if (q.options && q.options.length > 0) {
        const val = answers[q.id];
        if (Array.isArray(val)) {
          for (const item of val) {
            if (item && item !== '__SKIP__' && !q.options.some((opt) => isOptionMatched(opt, item))) {
              customTexts[q.id] = String(item);
              activeInputs[q.id] = true;
            }
          }
        } else if (typeof val === 'string' && val && val !== '__SKIP__') {
          if (!q.options.some((opt) => isOptionMatched(opt, val))) {
            customTexts[q.id] = val;
            activeInputs[q.id] = true;
          }
        }
      }
    }

    if (Object.keys(customTexts).length > 0) {
      setCustomAnswerText((prev) => ({ ...customTexts, ...prev }));
      setActiveCustomInputs((prev) => ({ ...activeInputs, ...prev }));
    }
  }, [agent.questions, answers]);

  const handleToggleChip = (question: WizardQuestion, chipValue: string) => {
    setAnswers((prev) => {
      const current = prev[question.id];
      let next: Record<string, any>;
      if (chipValue === '__SKIP__') {
        setActiveCustomInputs((aPrev) => ({ ...aPrev, [question.id]: false }));
        next = {
          ...prev,
          [question.id]: '__SKIP__',
        };
      } else {
        // All chips questions strictly allow multiselect
        const isMulti = question.component === 'chips' || question.isMultiSelect;
        if (isMulti) {
          const arr: any[] = Array.isArray(current)
            ? current.filter((x) => x !== '__SKIP__')
            : typeof current === 'string' && current && current !== '__SKIP__'
            ? [current]
            : [];
          const opt = question.options?.find((o) => o.value === chipValue);
          const matchIdx = arr.findIndex((item) =>
            opt ? isOptionMatched(opt, item) : String(item).toLowerCase() === String(chipValue).toLowerCase()
          );
          const nextArr = matchIdx >= 0
            ? arr.filter((_, idx) => idx !== matchIdx)
            : [...arr, chipValue];
          next = {
            ...prev,
            [question.id]: nextArr.length > 0 ? nextArr : '__SKIP__',
          };
        } else {
          setActiveCustomInputs((aPrev) => ({ ...aPrev, [question.id]: false }));
          next = {
            ...prev,
            [question.id]: chipValue,
          };
        }
      }
      persistProgress(next, currentStepIndex);
      return next;
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
    if (previousResult) {
      // Restore previous result and discard uncommitted edit session changes
      setAnswers(backupAnswersRef.current);
      setResult(previousResult);
    } else {
      // Persist ongoing progress so the user resumes right here
      persistProgress(answers, currentStepIndex);
      if (onBackToLauncher) {
        onBackToLauncher();
      }
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

  const purchasedHistory = useMemo(() => {
    return AgentStorageService.getPurchasedAgents()
      .filter((a) => a.id !== agent.id)
      .map((a) => ({
        name: a.name,
        category: a.category,
        targetValues: a.targetValues,
      }));
  }, [agent.id]);

  const currentLivePrompt = useMemo(() => {
    return forgeAgentPrompt(agent, answers, enrichedFacts, locale, purchasedHistory);
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
            const completedPrompt = forgeAgentPrompt(agent, answers, updatedFacts, locale, purchasedHistory);
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

  const handleSave = (overrideAnswers?: Record<string, any>) => {
    const activeAnswers = (overrideAnswers && typeof overrideAnswers === 'object' && !('nativeEvent' in overrideAnswers))
      ? overrideAnswers
      : answers;

    // Persist active answers into backup ref so future cancel/reset retains them
    backupAnswersRef.current = { ...activeAnswers };

    let providerId = activeProviderId || 'bairight_core';
    if (typeof window !== 'undefined') {
      const storedProvider = localStorage.getItem('bairight_active_provider');
      if (storedProvider) providerId = storedProvider;
    }

    const currentFacts = Array.isArray(userFacts)
      ? userFacts
          .filter((f) => f.isEnriched !== false)
          .map((f) => ({
            fact: f.fact || `${f.label || 'Poznámka'}: ${f.value || ''}`,
            category: f.category || 'biometrics',
          }))
      : [];
    const allFacts = [...currentFacts, ...sessionFeedbackFacts];
    const finalCompletedPrompt = forgeAgentPrompt(agent, activeAnswers, allFacts, locale, purchasedHistory);

    // Persist compiled prompt into PromptStorageService
    PromptStorageService.saveCompletedPrompt({
      agentId: agent.id,
      agentName: agent.name,
      category: agent.category,
      prompt: finalCompletedPrompt,
      answersSummary: Object.entries(activeAnswers)
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
        .join(' • '),
      providerId,
    });

    const targetResult: UniversalEvaluationResult = previousResult ? {
      ...previousResult,
    } : (result || {
      agentId: agent.id,
      agentName: agent.name,
      category: agent.category,
      evaluatedAt: new Date().toISOString(),
      summaryAssessment: locale === 'en' ? 'Parameters updated and saved.' : 'Parametry upraveny a uloženy.',
      recommendations: [],
      contraindicationsOrCaveats: [],
      providerUsed: 'bAIright Core',
      isLiveAI: false,
    });

    // Persist wizard state in localStorage
    if (typeof window !== 'undefined') {
      try {
        const storedStates = localStorage.getItem('bairight_agent_wizard_states');
        const parsed = storedStates ? JSON.parse(storedStates) : {};
        parsed[agent.id] = {
          ...(parsed[agent.id] || {}),
          answers: activeAnswers,
          result: targetResult,
          isCompleted: true,
          currentStepIndex: currentStepIndex,
        };
        localStorage.setItem('bairight_agent_wizard_states', JSON.stringify(parsed));
      } catch (e) {
        console.warn('Failed to save wizard state to localStorage:', e);
      }
    }

    // Persist updated agent definition in AgentStorageService
    AgentStorageService.saveAgent({
      ...agent,
      targetValues: activeAnswers,
      systemPrompt: finalCompletedPrompt,
    });

    setResult(targetResult);
    setPreviousResult(targetResult);

    if (onAssessmentCompleted) {
      onAssessmentCompleted(activeAnswers, targetResult, finalCompletedPrompt);
    }
  };

  const handleSubmit = async (overrideAnswers?: Record<string, any>) => {
    setIsSubmitting(true);
    const activeAnswers = (overrideAnswers && typeof overrideAnswers === 'object' && !('nativeEvent' in overrideAnswers))
      ? overrideAnswers
      : answers;
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
          answers: activeAnswers,
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

      // Persist completed wizard state into localStorage
      if (typeof window !== 'undefined') {
        try {
          const storedStates = localStorage.getItem('bairight_agent_wizard_states');
          const parsed = storedStates ? JSON.parse(storedStates) : {};
          parsed[agent.id] = {
            ...(parsed[agent.id] || {}),
            answers: activeAnswers,
            result: data,
            isCompleted: true,
            currentStepIndex: stepGroups.length,
          };
          localStorage.setItem('bairight_agent_wizard_states', JSON.stringify(parsed));
        } catch (e) {
          console.warn('Failed to save wizard state to localStorage:', e);
        }
      }

      // Sestavíme a uložíme VÝHRADNĚ HOTOVÝ prompt po dokončení posledního kroku
      const finalCompletedPrompt = forgeAgentPrompt(agent, activeAnswers, enrichedFacts, locale, purchasedHistory);
      PromptStorageService.saveCompletedPrompt({
        agentId: agent.id,
        agentName: agent.name,
        category: agent.category,
        prompt: finalCompletedPrompt,
        answersSummary: Object.entries(activeAnswers)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join(' • '),
        providerId,
      });

      if (onAssessmentCompleted) {
        onAssessmentCompleted(activeAnswers, data, finalCompletedPrompt);
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
          <div className="relative w-16 h-16 rounded-full bg-white dark:bg-slate-900 border-2 border-[#0099cc] flex items-center justify-center shadow-sm">
            <div className="w-7 h-7 rounded-full border-2 border-[#0099cc] border-t-transparent animate-spin" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0099cc]/10 dark:bg-[#0099cc]/20 border border-[#0099cc]/30 text-[#0099cc] dark:text-[#38bdf8] text-xs font-mono font-bold">
            <span>{t.dynamicWizardLoading.wakingUp}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {agent.name}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
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
        <div className="rounded-2xl sm:rounded-3xl p-6 sm:p-10 bg-white dark:bg-[#181e26] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          {/* Clean Focused Header */}
          <div className="border-b border-slate-200 dark:border-slate-800 pb-5 mb-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                {onBackToLauncher && (
                  <button
                    type="button"
                    onClick={() => {
                      persistProgress(answers, currentStepIndex);
                      onBackToLauncher();
                    }}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0 shadow-xs"
                    title={locale === 'en' ? "Back to category selection" : "Zpět na výběr kategorie"}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}

                <div className="min-w-0">
                  <h1 className="text-base sm:text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-snug truncate">
                    {cleanAgentTitle}
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5 font-medium">
                    {isBaselineStep
                      ? (locale === 'en' ? `Step 1 of ${totalSteps} • Optional Baseline Experience` : `Krok 1 z ${totalSteps} • Volitelná zkušenost s produktem`)
                      : (locale === 'en' ? `Step ${currentStepIndex + 1} of ${totalSteps} • ${Math.round(((currentStepIndex + 1) / totalSteps) * 100)}% Completed` : `Krok ${currentStepIndex + 1} z ${totalSteps} • ${Math.round(((currentStepIndex + 1) / totalSteps) * 100)} % dokončeno`)}
                  </p>
                </div>
              </div>

              {/* Action Tools in Header: Minimalist & Clean */}
              <div className="flex items-center gap-2 shrink-0">
                {previousResult && (
                  <button
                    type="button"
                    onClick={() => setResult(previousResult)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-[#0099cc]/5 dark:hover:bg-slate-800 border border-[#0099cc]/40 dark:border-[#0099cc]/50 text-[#0099cc] dark:text-[#38bdf8] text-xs font-mono font-bold transition-colors cursor-pointer shadow-xs"
                    title={locale === 'en' ? "Return to completed results" : "Návrat zpět na hotový výsledek a hotového agenta"}
                  >
                    <span>{locale === 'en' ? 'Back to results' : 'Zpět na výsledky'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleResetForm}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 text-xs font-mono transition-colors cursor-pointer shadow-xs"
                  title={locale === 'en' ? "Reset form to default values" : "Resetovat formulář na výchozí hodnoty"}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>

                <button
                  type="button"
                  onClick={handleCancelWizard}
                  className="p-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500 border border-slate-200 dark:border-slate-800 hover:border-rose-300 transition-colors cursor-pointer shrink-0 shadow-xs"
                  title={previousResult ? (locale === 'en' ? "Close editing and discard unsaved progress" : "Zavřít editaci a zahodit neuložený progress") : (locale === 'en' ? "Close wizard and return home" : "Zavřít wizard a vrátit se na úvod")}
                  aria-label={locale === 'en' ? "Close wizard" : "Zavřít wizard"}
                >
                  <X className="w-4 h-4 text-rose-500" />
                </button>
              </div>
            </div>

            {/* Stepper Progress Bar: Clean Solid Accent Line with Clickable Step Chips */}
            <div className="space-y-2.5 mt-5">
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-[#0099cc] transition-all duration-300 rounded-full"
                  style={{ width: `${Math.max(5, ((currentStepIndex + 1) / totalSteps) * 100)}%` }}
                />
              </div>

              {/* Clickable Step Chips for Direct Navigation */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
                {Array.from({ length: totalSteps }).map((_, sIdx) => {
                  const isActive = sIdx === currentStepIndex;
                  const isDone = sIdx < currentStepIndex;
                  return (
                    <button
                      key={sIdx}
                      type="button"
                      onClick={() => {
                        setCurrentStepIndex(sIdx);
                        persistProgress(answers, sIdx);
                      }}
                      className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer shrink-0 ${
                        isActive
                          ? 'bg-[#0099cc]/10 dark:bg-[#0099cc]/20 text-[#0099cc] dark:text-[#38bdf8] border-2 border-[#0099cc] font-bold shadow-xs'
                          : isDone
                          ? 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                          : 'bg-slate-50/50 dark:bg-slate-900/40 text-slate-400 dark:text-slate-500 border border-slate-200/80 dark:border-slate-800/60 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300'
                      }`}
                      title={locale === 'en' ? `Jump to step ${sIdx + 1}` : `Přejít na krok ${sIdx + 1}`}
                    >
                      {sIdx === 0 ? (locale === 'en' ? 'Baseline' : 'Zkušenost') : `${locale === 'en' ? 'Step' : 'Krok'} ${sIdx}`}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Active Questions Container */}
          <div className="min-h-[380px] flex flex-col justify-between">
            <div className="space-y-8 animate-in fade-in duration-200">
              {isBaselineStep ? (
                /* BASELINE PRODUCT & EXPERIENCE STEP (KROK 1 - VOLITELNÁ ZKUŠENOST) */
                <div className="p-6 rounded-2xl bg-white dark:bg-[#151a22] border border-slate-200 dark:border-slate-800 space-y-6 animate-in fade-in duration-300 shadow-xs">
                  <div className="border-b border-slate-200 dark:border-slate-800 pb-4 space-y-1">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#0099cc] dark:text-[#38bdf8] block">
                      {locale === 'en' ? `Step 1 of ${totalSteps} • Optional Baseline Experience` : `Krok 1 z ${totalSteps} • Volitelná zkušenost s produktem`}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-wide">
                      {locale === 'en' ? 'Current Experience & Baseline Product' : 'Dosavadní zkušenosti & Stávající produkt'}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
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
                      className={`p-5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                        baselineMode === 'first_purchase'
                          ? 'bg-[#0099cc]/5 dark:bg-[#0099cc]/15 border-2 border-[#0099cc] ring-1 ring-[#0099cc]/30 shadow-xs'
                          : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-900/80'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">
                            {locale === 'en' ? 'First purchase in this category' : 'První nákup v této kategorii'}
                          </h4>
                          {baselineMode === 'first_purchase' && (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#0099cc]/15 text-[#0099cc] dark:text-[#38bdf8] border border-[#0099cc]/30">
                              {locale === 'en' ? 'SELECTED' : 'ZVOLENO'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          {locale === 'en'
                            ? 'I do not currently own or use a product in this category. Take me straight to expert recommendations.'
                            : 'Zatím v této kategorii žádný produkt nevlastním ani nepoužívám. Chci přejít rovnou k doporučením.'}
                        </p>
                      </div>
                      <div className="pt-2">
                        <span className="text-xs font-mono font-semibold text-[#0099cc] dark:text-[#38bdf8]">
                          {locale === 'en' ? 'Skip baseline form' : 'Přeskočí formulář'}
                        </span>
                      </div>
                    </button>

                    {/* Karta B: Vlastním / používal jsem produkt z téhle kategorie */}
                    <button
                      type="button"
                      onClick={() => setBaselineMode('has_experience')}
                      className={`p-5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                        baselineMode === 'has_experience'
                          ? 'bg-[#0099cc]/5 dark:bg-[#0099cc]/15 border-2 border-[#0099cc] ring-1 ring-[#0099cc]/30 shadow-xs'
                          : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-900/80'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">
                            {locale === 'en' ? 'I own / used a product in this category' : 'Vlastním / používal jsem produkt z téhle kategorie'}
                          </h4>
                          {baselineMode === 'has_experience' && (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#0099cc]/15 text-[#0099cc] dark:text-[#38bdf8] border border-[#0099cc]/30">
                              {locale === 'en' ? 'SELECTED' : 'ZVOLENO'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          {locale === 'en'
                            ? 'I have experience with a specific model and want to specify what worked and what disappointed me.'
                            : 'Používám nebo jsem používal konkrétní model a chci specifikovat, co mi vyhovovalo a co vadilo.'}
                        </p>
                      </div>
                      <div className="pt-2">
                        <span className="text-xs font-mono font-semibold text-[#0099cc] dark:text-[#38bdf8]">
                          {locale === 'en' ? 'Open baseline form' : 'Otevře formulář níže'}
                        </span>
                      </div>
                    </button>
                  </div>

                  {/* Expanded Form: Only when Karta B is selected */}
                  {baselineMode === 'has_experience' && (
                    <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-top-2 duration-300">
                      {/* Field 1: Current Model */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                          {locale === 'en' ? 'Which specific model do you currently own / use?' : 'Jaký konkrétní model nyní vlastníte / používáte?'}
                        </label>
                        <input
                          type="text"
                          value={answers['baselineModel'] || ''}
                          onChange={(e) => handleValueChange('baselineModel', e.target.value)}
                          placeholder={locale === 'en' ? 'e.g. DeLonghi Magnifica S / Hoka Clifton 8 / Sidi Shot 2' : 'např. DeLonghi Magnifica S / Hoka Clifton 8 / Sidi Shot 2'}
                          className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:border-[#0099cc] focus:ring-1 focus:ring-[#0099cc] focus:outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-xs"
                        />
                      </div>

                      {/* Field 2: Likes */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                          <span className="text-emerald-500 select-none font-bold">✓</span>
                          <span>{locale === 'en' ? 'What worked well & what do you want to keep?' : 'Co vám na něm nejvíce vyhovuje a chcete to i u nového?'}</span>
                        </label>
                        <input
                          type="text"
                          value={answers['baselineLikes'] || ''}
                          onChange={(e) => handleValueChange('baselineLikes', e.target.value)}
                          placeholder={locale === 'en' ? 'e.g. Fast heat-up time, compact footprint, low weight' : 'např. Rychlý náběh, kompaktní rozměry na lince'}
                          className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 focus:outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-xs"
                        />
                      </div>

                      {/* Field 3: Dislikes */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                          <span className="text-amber-500 select-none font-bold">•</span>
                          <span>{locale === 'en' ? 'What frustrates you or what broke down / failed?' : 'Co vám na něm nejvíce vadí nebo co selhalo?'}</span>
                        </label>
                        <input
                          type="text"
                          value={answers['baselineDislikes'] || ''}
                          onChange={(e) => handleValueChange('baselineDislikes', e.target.value)}
                          placeholder={locale === 'en' ? 'e.g. Loud grinder, tedious manual milk wand cleaning, pinched instep' : 'např. Hlučný mlýnek, náročné ruční čištění mléčné trysky'}
                          className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 focus:outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-xs"
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
                  <div key={question.id} className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-[#151a22] border border-slate-200 dark:border-slate-800 space-y-5 shadow-xs">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5 flex-wrap">
                        <span>{cleanTitle}</span>
                        {(question.component === 'chips' || question.component === 'dropdown' || (question.options && question.options.length > 0)) && (
                          <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-md bg-[#0099cc]/10 dark:bg-[#0099cc]/20 text-[#0099cc] dark:text-[#38bdf8] border border-[#0099cc]/30 font-bold uppercase tracking-wider">
                            {locale === "en" ? "Multi-select" : "Možno vybrat více"}
                          </span>
                        )}
                      </h2>
                      {question.subtitle && (
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">{question.subtitle}</p>
                      )}
                    </div>

                    {/* COMPONENT 1: SLIDER */}
                    {question.component === 'slider' && question.sliderConfig && (
                      <div className="space-y-3 pt-2">
                        <div className="flex justify-between items-center">
                          {locale === 'en' ? <span className="text-xs font-mono text-slate-500 dark:text-slate-400">Set value:</span> : <span className="text-xs font-mono text-slate-500 dark:text-slate-400">Nastavená hodnota:</span>}
                          <span className="font-mono text-[#0099cc] dark:text-[#38bdf8] font-extrabold text-base bg-[#0099cc]/10 dark:bg-[#0099cc]/20 px-3.5 py-1 rounded-xl border border-[#0099cc]/30 shadow-xs">
                            {val ?? question.sliderConfig.defaultValue}{' '}
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">{question.sliderConfig.unit}</span>
                          </span>
                        </div>
                        <input
                          type="range"
                          min={question.sliderConfig.min}
                          max={question.sliderConfig.max}
                          step={question.sliderConfig.step}
                          value={val ?? question.sliderConfig.defaultValue}
                          onChange={(e) => handleValueChange(question.id, Number(e.target.value))}
                          className="w-full accent-[#0099cc] h-2.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
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
                          <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                <span>{t.brandSelector.preferredTitle}</span>
                              </label>
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30">
                                {preferredTags.length > 0 ? t.brandSelector.preferredBadgeSelected.replace('{count}', String(preferredTags.length)) : t.brandSelector.preferredBadgeOpen}
                              </span>
                            </div>

                            <input
                              type="text"
                              value={brandVal.preferred}
                              onChange={(e) => updateBrandPref(e.target.value)}
                              placeholder={t.brandSelector.preferredPlaceholder}
                              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 rounded-xl border border-emerald-300 dark:border-emerald-500/30 focus:border-emerald-500 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all shadow-xs"
                            />

                            {preferredTags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {preferredTags.map((tag: string) => (
                                  <span
                                    key={tag}
                                    className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-500/40"
                                  >
                                    <span>{tag}</span>
                                    <button
                                      type="button"
                                      onClick={() => removeTag('preferred', tag)}
                                      className="hover:text-rose-600 p-0.5 rounded cursor-pointer"
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
                          <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/30 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                                <span>{t.brandSelector.forbiddenTitle}</span>
                              </label>
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30">
                                {forbiddenTags.length > 0 ? t.brandSelector.forbiddenBadgeSelected.replace('{count}', String(forbiddenTags.length)) : t.brandSelector.forbiddenBadgeNone}
                              </span>
                            </div>

                            <input
                              type="text"
                              value={brandVal.forbidden}
                              onChange={(e) => updateBrandForb(e.target.value)}
                              placeholder={t.brandSelector.forbiddenPlaceholder}
                              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 rounded-xl border border-rose-300 dark:border-rose-500/30 focus:border-rose-500 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all shadow-xs"
                            />

                            {forbiddenTags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {forbiddenTags.map((tag: string) => (
                                  <span
                                    key={tag}
                                    className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-900 dark:text-rose-200 border border-rose-300 dark:border-rose-500/40"
                                  >
                                    <span>{tag}</span>
                                    <button
                                      type="button"
                                      onClick={() => removeTag('forbidden', tag)}
                                      className="hover:text-rose-700 p-0.5 rounded cursor-pointer"
                                      title={locale === 'en' ? "Remove brand" : "Odebrat značku"}
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* COMPONENT 2: CHIPS & MULTI-SELECT (OPTION CARDS) */}
                    {(question.component === 'chips' || question.component === 'dropdown' || (question.options && question.options.length > 0)) && question.options && !question.id.includes('brand') && !question.title.toLowerCase().includes('značk') && !question.title.toLowerCase().includes('brand') && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {question.options.map((opt, optIdx) => {
                          const isSelected = Array.isArray(val)
                            ? val.some((item) => isOptionMatched(opt, item))
                            : isOptionMatched(opt, val);

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
                                  ? 'bg-[#0099cc]/5 dark:bg-[#0099cc]/15 border-2 border-[#0099cc] text-slate-900 dark:text-white ring-1 ring-[#0099cc]/30 shadow-xs'
                                  : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-900/80'
                              }`}
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-slate-900 dark:text-white">{opt.label}</span>
                                  {opt.badge && (
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#0099cc]/10 dark:bg-[#0099cc]/20 text-[#0099cc] dark:text-[#38bdf8] border border-[#0099cc]/30 font-bold">
                                      {opt.badge}
                                    </span>
                                  )}
                                </div>
                                {hasMeaningfulDesc && (
                                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug">{opt.description}</p>
                                )}
                              </div>
                              {isSelected ? (
                                <div className="w-5 h-5 rounded-md bg-[#0099cc] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                                  <span className="text-xs font-black leading-none">✓</span>
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 shrink-0 mt-0.5" />
                              )}
                            </button>
                          );
                        })}
                        {/* Skip / Neutral option - Subtle clean link */}
                        <div className="sm:col-span-2 pt-2 flex flex-col items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleChip(question, '__SKIP__')}
                            className={`py-1.5 px-3 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                              (Array.isArray(val) ? val.includes('__SKIP__') : val === '__SKIP__')
                                ? 'bg-slate-100 dark:bg-slate-800 border border-[#0099cc] text-[#0099cc] dark:text-[#38bdf8] font-bold'
                                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                            }`}
                          >
                            <span>{t.dynamicWizardLoading.skipChip}</span>
                          </button>
                        </div>

                        {/* Interactive Custom / Write-In Option */}
                        {activeCustomInputs[question.id] || customAnswerText[question.id] ? (
                          <div className="sm:col-span-2 p-3.5 rounded-2xl bg-[#0099cc]/5 dark:bg-[#0099cc]/15 border-2 border-[#0099cc] text-slate-900 dark:text-white shadow-xs ring-1 ring-[#0099cc]/30 space-y-2 animate-in fade-in duration-200">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-mono font-bold text-[#0099cc] dark:text-[#38bdf8] flex items-center gap-1.5">
                                <PenLine className="w-3.5 h-3.5 text-[#0099cc] dark:text-[#38bdf8]" />
                                {t.dynamicWizardLoading.customChoice}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveCustomAnswer(question)}
                                className="text-slate-400 hover:text-rose-500 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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
                              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 focus:border-[#0099cc] text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all shadow-xs"
                            />
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleActivateCustomAnswer(question.id)}
                            className="sm:col-span-2 p-3.5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/30 hover:bg-slate-100/80 dark:hover:bg-slate-900/60 hover:border-[#0099cc]/60 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer flex items-center justify-center gap-2 text-xs font-bold group"
                          >
                            <PenLine className="w-3.5 h-3.5 text-[#0099cc] dark:text-[#38bdf8] group-hover:scale-110 transition-transform" />
                            <span>{locale === 'en' ? t.dynamicWizard.writeCustomOption : 'Napsat vlastní možnost (jiný specifický požadavek)...'}</span>
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
                          className="w-full px-4 py-3 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 focus:border-[#0099cc] focus:ring-2 focus:ring-[#0099cc]/20 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all resize-none shadow-xs leading-relaxed"
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400 px-1">{locale === 'en' ? 'Write typical values or specific requirements as free text.' : 'Typické hodnoty nebo specifické požadavky pište volným textem.'}</p>
                      </div>
                    )}
                  </div>
                );
              })
              )}
            </div>

            {/* Navigation Buttons with Prompt Inspector trigger */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 mt-8">
              <div className="flex items-center gap-3">
                {currentStepIndex > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const prevIdx = Math.max(0, currentStepIndex - 1);
                      setCurrentStepIndex(prevIdx);
                      persistProgress(answers, prevIdx);
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer shadow-xs"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>{t.dynamicWizard.btnPrevious}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleCancelWizard}
                  className="px-3.5 py-2 text-xs font-mono text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors cursor-pointer"
                  title={previousResult ? (locale === 'en' ? "Close editing and discard unsaved progress" : "Zavřít editaci a zahodit neuložený progress") : (locale === 'en' ? "Close wizard and return home" : "Zavřít wizard a vrátit se na úvod")}
                >
                  <span>{t.dynamicWizard.btnCancel}</span>
                </button>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Quick Save button — available on all steps in Edit Mode */}
                {previousResult && currentStepIndex < totalSteps - 1 && (
                  <button
                    type="button"
                    onClick={() => handleSave()}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#0099cc] hover:bg-[#0088b8] text-white shadow-xs transition-colors cursor-pointer"
                    title={locale === 'en' ? "Save" : "Uložit"}
                  >
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>{t.dynamicWizard.btnSave || (locale === 'en' ? 'Save' : 'Uložit')}</span>
                  </button>
                )}

                {currentStepIndex < totalSteps - 1 ? (
                  <div className="flex items-center gap-2.5">
                    {isBaselineStep && (
                      <button
                        type="button"
                        onClick={() => {
                          const nextIdx = 1;
                          setCurrentStepIndex(nextIdx);
                          persistProgress(answers, nextIdx);
                        }}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer shadow-xs"
                        title={locale === 'en' ? "Skip baseline step and go to parameters" : "Přeskočit stávající zkušenosti a přejít na parametry"}
                      >
                        <span>{locale === 'en' ? 'Skip to Parameters' : 'Přeskočit na parametry'}</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        const nextIdx = Math.min(totalSteps - 1, currentStepIndex + 1);
                        setCurrentStepIndex(nextIdx);
                        persistProgress(answers, nextIdx);
                      }}
                      className="flex items-center gap-2 px-7 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold bg-[#0099cc] hover:bg-[#0088b8] text-white shadow-xs transition-colors cursor-pointer"
                    >
                      <span>{t.dynamicWizard.btnContinue}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                      type="button"
                      onClick={handleOpenPromptInspector}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer shadow-xs"
                      title={locale === 'en' ? "Inspect prompt sent to AI" : "Zkontrolovat přesný prompt před odesláním do AI"}
                    >
                      <Eye className="w-4 h-4 text-[#0099cc] dark:text-[#38bdf8]" />
                      <span>{t.dynamicWizard.btnInspectPrompt}</span>
                    </button>

                    {previousResult && (
                      <button
                        type="button"
                        onClick={() => handleSave()}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#0099cc] hover:bg-[#0088b8] text-white shadow-xs transition-colors cursor-pointer"
                        title={locale === 'en' ? "Save" : "Uložit"}
                      >
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>{t.dynamicWizard.btnSave || (locale === 'en' ? 'Save' : 'Uložit')}</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleSubmit()}
                      disabled={isSubmitting}
                      className="flex items-center gap-2.5 px-7 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold bg-[#0099cc] hover:bg-[#0088b8] text-white shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmitting && <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />}
                      <span>{isSubmitting ? t.dynamicWizard.btnEvaluating : (previousResult ? (locale === 'en' ? 'Recalculate with AI' : 'Přepočítat s AI') : (locale === 'en' ? 'Generate Agent Recommendations' : 'Vygenerovat doporučení agenta'))}</span>
                    </button>
                  </div>
                )}
              </div>
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
      {/* 1. HERO DELIVERABLE: THE AGENT CARD (MATERIAL DESIGN 3 - HIGHLIGHTED MASTER CARD) */}
      <div className="rounded-2xl result-hub-master-card p-6 sm:p-8 relative overflow-hidden text-left space-y-6">
        {/* Top vibrant Material cyan-blue accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0099cc] via-[#0288d1] to-[#0099cc]" />

        {/* Success status & Agent Identity */}
        <div className="pb-5 result-hub-header-divider space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider result-hub-badge-cyan px-2.5 py-0.5 rounded-md">
              {locale === 'en' ? 'Calibration Complete' : 'Kalibrace dokončena'}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black result-hub-option1-title tracking-tight">
            {displayAgentName}
          </h2>
          <p className="text-xs sm:text-sm result-hub-option1-desc">
            {locale === 'en'
              ? 'Choose how you want to run this agent:'
              : 'Vyberte způsob, jak chcete agenta použít:'}
          </p>
        </div>

        {/* Primary Action Deliverables Bar */}
        <div className="space-y-5">

          {/* TIER 1: TWO DOMINANT HERO ACTION CARDS (SIDE BY SIDE - VARIANTA A) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
            {/* CARD 1 (LEFT): LIVE CHAT IN BAIRIGHT (PRIMARY HIGHLIGHTED OPTION) */}
            {(onOpenChat || onOpenSubscriptionModal) && (
              <div
                className="flex flex-col justify-between p-6 sm:p-7 rounded-2xl result-hub-option1-card transition-all text-left relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-[#0099cc]" />
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2 w-full">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider result-hub-badge-cyan px-2.5 py-1 rounded-md shrink-0">
                      {locale === 'en' ? 'Option 1' : 'Možnost 1'}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold shrink-0 ${
                      hasApiKey 
                        ? 'bg-[#e1f5fe] text-[#01579b] border border-[#b3e5fc]' 
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {hasApiKey
                        ? (locale === 'en' ? '✓ Model Connected' : '✓ Model připojen')
                        : (locale === 'en' ? 'Requires API Key' : 'Vyžaduje API klíč')}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg sm:text-xl font-black result-hub-option1-title">
                      {locale === 'en' ? 'Chat in bAIright' : 'Spustit chat přímo v bAIright'}
                    </h3>
                    <p className="text-xs sm:text-sm result-hub-option1-desc mt-1 leading-relaxed">
                      {locale === 'en'
                        ? 'Direct interactive discussion and tailored recommendations directly in this window.'
                        : 'Interaktivní diskuze a výběr produktů na míru přímo v tomto okně.'}
                    </p>
                  </div>

                  {/* Action Button & single concise caption */}
                  <div className="pt-2 space-y-2">
                    {hasApiKey ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenChat) {
                            onOpenChat(currentLivePrompt, result || previousResult, answers);
                          }
                        }}
                        className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#0099cc] hover:bg-[#0088b8] text-white font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
                      >
                        <span>{locale === 'en' ? 'Open Chat with Agent' : 'Otevřít chat s agentem'}</span>
                        <span>→</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenSubscriptionModal) {
                            onOpenSubscriptionModal();
                          } else {
                            setShowBYOKHintModal(true);
                          }
                        }}
                        className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-[#263238] font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
                      >
                        <span>{locale === 'en' ? 'Connect API Key in Vault' : 'Připojit API klíč v Trezoru'}</span>
                        <span>→</span>
                      </button>
                    )}

                    <p className="text-[11px] font-mono text-center result-hub-option1-desc">
                      {hasApiKey
                        ? (locale === 'en' ? `✓ Model ${activeProviderName} is ready` : `✓ Model ${activeProviderName} je připraven`)
                        : (locale === 'en' ? 'Supports Gemini, GPT-4o, Claude & Ollama' : 'Podpora Gemini, GPT-4o, Claude i Ollama')}
                    </p>
                  </div>
                </div>

                <div className="pt-3 result-hub-option1-footer mt-5 text-[11px] font-mono flex items-center justify-between">
                  <span>{locale === 'en' ? 'Interactive consultant' : 'Interaktivní konzultant'}</span>
                  <span className="font-bold text-[#0099cc] dark:text-[#38bdf8]">bAIright Chat</span>
                </div>
              </div>
            )}

            {/* CARD 2 (RIGHT): COPY PROMPT TO CLIPBOARD (SECONDARY OPTION) */}
            <div
              className="flex flex-col justify-between p-6 sm:p-7 rounded-2xl result-hub-option2-card transition-all text-left relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 result-hub-option2-bar" />
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2 w-full">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider result-hub-option2-badge px-2.5 py-1 rounded-md shrink-0">
                    {locale === 'en' ? 'Option 2' : 'Možnost 2'}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold result-hub-badge-cyan shrink-0">
                    {locale === 'en' ? 'No API Key Needed' : 'Bez API klíče'}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg sm:text-xl font-black result-hub-option2-title">
                    {locale === 'en' ? 'Copy Prompt to Clipboard' : 'Zkopírovat prompt do schránky'}
                  </h3>
                  <p className="text-xs sm:text-sm result-hub-option2-desc mt-1 leading-relaxed">
                    {locale === 'en'
                      ? 'Calibrated prompt ready to paste into ChatGPT, Claude, Gemini, or Perplexity.'
                      : 'Kompletní vyladěný prompt pro vložení do ChatGPT, Claude, Gemini či Perplexity.'}
                  </p>
                </div>

                {/* Big Action Button & Subtext */}
                <div className="pt-2 space-y-2">
                  <button
                    type="button"
                    onClick={() => handleCopyText(currentLivePrompt, 'system_prompt')}
                    className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer ${
                      copiedSnippetType === 'system_prompt'
                        ? 'bg-[#0099cc] hover:bg-[#0088b8] text-white'
                        : 'result-hub-option2-copybtn'
                    }`}
                  >
                    <span>{copiedSnippetType === 'system_prompt' ? '✓' : '⧉'}</span>
                    <span>
                      {copiedSnippetType === 'system_prompt'
                        ? (locale === 'en' ? 'Prompt Copied to Clipboard!' : 'Prompt zkopírován do schránky!')
                        : (locale === 'en' ? 'Copy Prompt' : 'Zkopírovat prompt')}
                    </span>
                  </button>

                  <p className="text-[11px] font-mono text-center result-hub-option2-desc">
                    {locale === 'en' ? 'Paste with Ctrl+V / Cmd+V into any AI chat' : 'Vložte zkratkou Ctrl+V / Cmd+V do libovolného chatu'}
                  </p>
                </div>

                {/* Single-line prompt preview with inspector link */}
                <div className="px-3 py-2 rounded-lg result-hub-prompt-box text-[11px] font-mono flex items-center justify-between gap-2">
                  <span className="truncate text-slate-500 max-w-[220px]">
                    {currentLivePrompt.slice(0, 45)}...
                  </span>
                  <button
                    type="button"
                    onClick={handleOpenPromptInspector}
                    className="text-[#0277bd] dark:text-[#38bdf8] hover:underline cursor-pointer font-bold shrink-0 lowercase text-[10px]"
                  >
                    {locale === 'en' ? 'view full prompt' : 'zobrazit celý prompt'}
                  </button>
                </div>
              </div>

              <div className="pt-3 result-hub-option2-footer mt-5 text-[11px] font-mono flex items-center justify-between">
                <span>{locale === 'en' ? 'Free tier ready' : 'Funguje i ve free verzích'}</span>
                <span className="font-bold result-hub-option2-brandtag">ChatGPT • Claude • Gemini</span>
              </div>
            </div>
          </div>

          {/* TIER 2: SECONDARY ACTIONS & PORTABLE EXPORT (.AGENT.MD) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl result-hub-tier2-box text-left">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider result-hub-option2-badge px-2 py-0.5 rounded">
                  {locale === 'en' ? 'Portable File' : 'Soubor'}
                </span>
                <span className="text-xs font-bold result-hub-option1-title">
                  {locale === 'en' ? 'Download .agent.md Configuration' : 'Uložit konfiguraci agenta (.agent.md)'}
                </span>
              </div>
              <p className="text-xs result-hub-option1-desc">
                {locale === 'en'
                  ? 'Markdown specification with all rules for Custom GPTs, Claude Projects, or local agents.'
                  : 'Otevřená specifikace se všemi pravidly pro Custom GPTs, Claude Projects nebo lokální agenty.'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownloadAgentMarkdown}
              className="px-3.5 py-2 rounded-lg result-hub-btn-secondary text-xs font-mono font-bold transition-all cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
            >
              <span>{locale === 'en' ? 'Download .agent.md' : 'Stáhnout .agent.md soubor'}</span>
              <span>↓</span>
            </button>
          </div>

          {/* TIER 3: CLEAN UTILITY TOOLBAR (MATERIAL DESIGN 3, ZERO ICONS) */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-xl result-hub-tier3-box">
            <span className="text-xs font-mono result-hub-option1-desc px-2 font-semibold">
              {locale === 'en' ? 'Wizard Tools:' : 'Nástroje průvodce:'}
            </span>

            <div className="flex flex-wrap items-center gap-2">
              {/* Inspect Prompt */}
              <button
                type="button"
                onClick={handleOpenPromptInspector}
                className="px-3.5 py-1.5 rounded-lg result-hub-btn-tool text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5"
                title={locale === 'en' ? "View full prompt sent to AI" : "Zobrazit kompletní prompt"}
              >
                <span>{locale === 'en' ? 'View Full Prompt' : 'Zobrazit celý prompt'}</span>
              </button>

              {/* Edit Parameters */}
              <button
                type="button"
                onClick={() => {
                  backupAnswersRef.current = { ...answers };
                  if (result) setPreviousResult(result);
                  setResult(null);
                  setCurrentStepIndex(0);
                  if (onEditWizard) onEditWizard();
                }}
                className="px-3.5 py-1.5 rounded-lg result-hub-btn-tool text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5"
                title={locale === 'en' ? "Adjust entered parameters" : "Upravit zadané parametry"}
              >
                <span>{locale === 'en' ? 'Edit Wizard' : 'Upravit wizard'}</span>
              </button>

              {/* Reset Questionnaire */}
              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  setCurrentStepIndex(0);
                  setAnswers(initialAnswers);
                  if (onResetWizard) onResetWizard();
                }}
                className="px-3.5 py-1.5 rounded-lg result-hub-btn-reset text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5"
                title={locale === 'en' ? "Reset questionnaire" : "Vynulovat dotazník"}
              >
                <span>{locale === 'en' ? 'Reset Questionnaire' : 'Vynulovat dotazník'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 1.5 ACTIVE SELECTION CRITERIA & RETROACTIVE PARAMETER TUNING */}
      <div className="rounded-2xl result-hub-accordion-master shadow-xs overflow-hidden transition-all text-left">
        {/* Collapsible Header Accordion Toggle */}
        <div className="w-full p-4 sm:p-5 flex items-center justify-between text-left result-hub-accordion-header transition-colors">
          <div
            onClick={() => setIsParametersExpanded((prev) => !prev)}
            className="min-w-0 cursor-pointer flex-1"
          >
            <h3 className="text-sm sm:text-base font-black text-[#263238] flex items-center gap-2 flex-wrap">
              <span>{locale === 'en' ? 'Selection Criteria & Active Parameters' : 'Kritéria výběru a aktivní parametry'}</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[#0099cc]">
                {(Array.isArray(answers.customParameters) ? answers.customParameters.length : 0) + (answers.baselineModel ? 1 : 0) + agent.questions.filter(q => { const val = answers[q.id]; return val !== undefined && val !== null && val !== "" && val !== "__SKIP__"; }).length}
              </span>
            </h3>
            <p className="text-xs text-[#546e7a] mt-0.5 truncate">
              {locale === 'en'
                ? 'Review parameters or add new constraints (such as budget ceiling or required features).'
                : 'Přehled zadaných kritérií z dotazníku s možností přidat další omezení.'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-3">
            {!isAddingCustomParam && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsParametersExpanded(true);
                  setIsAddingCustomParam(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-[#263238] text-xs font-mono font-bold transition-all cursor-pointer"
              >
                + {locale === 'en' ? 'Add Parameter / Budget' : 'Přidat parametr / cenový limit'}
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsParametersExpanded((prev) => !prev)}
              aria-expanded={isParametersExpanded}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <span className="text-xs font-sans text-[#0277bd] hover:text-[#01579b] font-semibold hidden md:inline">
                {isParametersExpanded
                  ? (locale === 'en' ? 'Hide parameters' : 'Skrýt parametry')
                  : (locale === 'en' ? 'Show parameters' : 'Zobrazit parametry')}
              </span>
              <div className="p-1.5 rounded-lg bg-slate-100 border border-slate-200 text-[#263238] group-hover:border-slate-300 transition-colors">
                {isParametersExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>
          </div>
        </div>

        <div className={isParametersExpanded ? "p-5 sm:p-6 border-t border-slate-200 space-y-4" : "hidden"}>
          {/* Inline Add Parameter Form */}
        {isAddingCustomParam && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[#01579b] uppercase tracking-wider">
                {locale === 'en' ? 'Add New Requirement or Constraint' : 'Přidat nový požadavek nebo omezení'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsAddingCustomParam(false);
                  setNewParamName('');
                  setNewParamValue('');
                }}
                className="text-xs text-[#546e7a] hover:text-[#263238] px-2 py-1 rounded cursor-pointer"
              >
                {locale === 'en' ? 'Cancel' : 'Zrušit'}
              </button>
            </div>

            {/* Suggested Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-mono text-[#546e7a]">
                {locale === 'en' ? 'Quick suggestions:' : 'Rychlé tipy:'}
              </span>
              {[
                { name: locale === 'en' ? 'Budget / Price Cap' : 'Cenový limit / Rozpočet', val: locale === 'en' ? 'Under $250' : 'Do 6 000 Kč' },
                { name: locale === 'en' ? 'Authorized Service' : 'Dostupnost servisu', val: locale === 'en' ? 'Official warranty service in CZ/EU' : 'Autorizovaný servis v ČR' },
                { name: locale === 'en' ? 'Eco & Recycled' : 'Udržitelné materiály', val: locale === 'en' ? 'Certified recycled materials' : 'Udržitelné a recyklované materiály' },
              ].map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setNewParamName(preset.name);
                    setNewParamValue(preset.val);
                  }}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-[#263238] transition-colors cursor-pointer"
                >
                  {preset.name}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-mono text-[#546e7a] block mb-1">
                  {locale === 'en' ? 'Parameter Name / Criterion' : 'Název parametru / kritéria'}
                </label>
                <input
                  type="text"
                  value={newParamName}
                  onChange={(e) => setNewParamName(e.target.value)}
                  placeholder={locale === 'en' ? 'e.g. Budget ceiling' : 'např. Cenový strop / rozpočet'}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 focus:border-[#0099cc] text-xs text-[#263238] placeholder-slate-400 outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-mono text-[#546e7a] block mb-1">
                  {locale === 'en' ? 'Required Value / Constraint' : 'Hodnota / Požadavek'}
                </label>
                <input
                  type="text"
                  value={newParamValue}
                  onChange={(e) => setNewParamValue(e.target.value)}
                  placeholder={locale === 'en' ? 'e.g. Max $250' : 'např. do 5 000 Kč včetně DPH'}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 focus:border-[#0099cc] text-xs text-[#263238] placeholder-slate-400 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                disabled={!newParamName.trim() || !newParamValue.trim() || isSubmitting}
                onClick={handleAddCustomParam}
                className="px-4 py-2 rounded-lg bg-[#0099cc] hover:bg-[#0088b8] text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {isSubmitting
                  ? (locale === 'en' ? 'Updating Agent...' : 'Aktualizuji agenta...')
                  : (locale === 'en' ? 'Save & Recalculate Recommendations' : 'Uložit a přepočítat doporučení')}
              </button>
            </div>
          </div>
        )}

        {/* Active Parameters List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {/* Custom Parameters with Delete */}
          {Array.isArray(answers.customParameters) && answers.customParameters.map((cp: any) => (
            <div
              key={cp.id}
              className="p-3 rounded-xl bg-[#e1f5fe] border border-[#b3e5fc] flex items-start justify-between gap-2 shadow-xs"
            >
              <div className="min-w-0">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#01579b] font-bold block truncate">
                  {cp.name}
                </span>
                <span className="text-xs font-semibold text-[#263238] block mt-0.5 break-words">
                  {cp.value}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveCustomParam(cp.id)}
                title={locale === 'en' ? 'Remove this custom parameter' : 'Odebrat tento vlastní parametr'}
                className="text-[#546e7a] hover:text-red-600 p-1 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {/* Baseline Model Owned */}
          {answers.baselineModel && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
              <span className="text-[10px] font-mono text-[#546e7a] uppercase tracking-wider block">
                {locale === 'en' ? 'Baseline Product Owned' : 'Dosavadní produkt'}
              </span>
              <span className="text-xs font-semibold text-[#263238] block truncate">
                {String(answers.baselineModel)}
              </span>
            </div>
          )}

          {/* Standard Question Criteria */}
          {agent.questions.map((q) => {
            const val = answers[q.id];
            if (val === undefined || val === null || val === '') return null;
            let displayVal = String(val);
            if (val === '__SKIP__' || (typeof val === 'string' && val.toLowerCase().includes('není důležité'))) {
              return null;
            }
            if (Array.isArray(val)) {
              if (val.length === 0 || (val.length === 1 && val[0] === '__SKIP__')) return null;
              displayVal = val.map((v) => {
                const opt = q.options?.find((o) => o.value === v);
                return opt?.label || String(v);
              }).join(', ');
            } else if (typeof val === 'object') {
              if ('preferred' in val || 'forbidden' in val) {
                const pref = typeof val.preferred === 'string' ? val.preferred.trim() : '';
                const forb = typeof val.forbidden === 'string' ? val.forbidden.trim() : '';
                if (!pref && !forb) {
                  displayVal = locale === 'en' ? 'Open selection (No brand restrictions)' : 'Otevřený výběr (Bez omezení značek)';
                } else {
                  const parts = [];
                  if (pref) parts.push(locale === 'en' ? `Preferred: ${pref}` : `Preferované: ${pref}`);
                  if (forb) parts.push(locale === 'en' ? `Forbidden: ${forb}` : `Vyloučené: ${forb}`);
                  displayVal = parts.join(' • ');
                }
              } else {
                displayVal = Object.entries(val).map(([k, v]) => `${k}: ${v}`).join('; ');
              }
            } else if (q.options) {
              const opt = q.options.find((o) => o.value === val);
              if (opt?.label) displayVal = opt.label;
            }
            return (
              <div key={q.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                <span className="text-[10px] font-mono text-[#546e7a] uppercase tracking-wider block truncate">
                  {q.title}
                </span>
                <span className="text-xs font-semibold text-[#263238] block truncate">
                  {displayVal}
                </span>
              </div>
            );
          })}
        </div>
        </div>
      </div>

      {/* 2. PLATFORM DEPLOYMENT GUIDES (GEMINI GEMS, CHATGPT CUSTOM GPTS, CLAUDE PROJECTS) */}
      <div className="rounded-2xl result-hub-accordion-master shadow-xs overflow-hidden transition-all text-left">
        {/* Collapsible Header Accordion Toggle */}
        <button
          type="button"
          onClick={() => setIsGuidesExpanded((prev) => !prev)}
          className="w-full p-4 sm:p-5 flex items-center justify-between text-left result-hub-accordion-header transition-colors cursor-pointer group"
          aria-expanded={isGuidesExpanded}
        >
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-black text-[#263238] flex items-center gap-2 flex-wrap">
              <span>{locale === 'en' ? 'How to create your own agent from this file' : 'Jak si z tohoto souboru vytvořit vlastního agenta'}</span>
              <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[#546e7a] hidden sm:inline">
                Google Gemini • ChatGPT • Claude
              </span>
            </h3>
            <p className="text-xs text-[#546e7a] mt-0.5 truncate">
              {locale === 'en'
                ? 'Step-by-step guides for Gem Manager, Custom GPTs, and Claude Projects.'
                : 'Návody krok za krokem pro Gem Manager, Custom GPTs a Claude Projects.'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-3">
            <span className="text-xs font-sans text-[#0277bd] hover:text-[#01579b] font-semibold hidden md:inline">
              {isGuidesExpanded
                ? (locale === 'en' ? 'Hide instructions' : 'Skrýt návod')
                : (locale === 'en' ? 'Show instructions' : 'Zobrazit návod')}
            </span>
            <div className="p-1.5 rounded-lg bg-slate-100 border border-slate-200 text-[#263238] group-hover:border-slate-300 transition-colors">
              {isGuidesExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>
        </button>

        {/* Collapsible Content */}
        {isGuidesExpanded && (
          <div className="p-5 sm:p-6 pt-0 border-t border-slate-200 space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4">
              <p className="text-xs text-[#546e7a]">
                {locale === 'en' ? 'Choose your preferred AI platform and follow the steps below:' : 'Vyberte svou oblíbenou AI platformu a postupujte podle návodu níže:'}
              </p>

              {/* Guide Platform Switcher Tabs */}
              <div className="flex items-center p-1 rounded-xl result-hub-tabs-container shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveGuideTab('gemini')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeGuideTab === 'gemini'
                      ? 'bg-white text-[#263238] border border-slate-200 shadow-xs'
                      : 'text-[#546e7a] hover:text-[#263238]'
                  }`}
                >
                  Google Gemini (Gems)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveGuideTab('chatgpt')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeGuideTab === 'chatgpt'
                      ? 'bg-white text-[#263238] border border-slate-200 shadow-xs'
                      : 'text-[#546e7a] hover:text-[#263238]'
                  }`}
                >
                  ChatGPT (Custom GPTs)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveGuideTab('claude')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeGuideTab === 'claude'
                      ? 'bg-white text-[#263238] border border-slate-200 shadow-xs'
                      : 'text-[#546e7a] hover:text-[#263238]'
                  }`}
                >
                  Claude (Projects)
                </button>
              </div>
            </div>

            {/* Tab Content: Google Gemini Gems */}
            {activeGuideTab === 'gemini' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="p-4 rounded-xl result-hub-card-item text-xs result-hub-option1-title space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#01579b] text-sm flex items-center gap-1.5">
                      {locale === 'en' ? 'Instructions for Google Gemini (Gem Manager):' : 'Návod pro Google Gemini (Gem Manager):'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyText(currentLivePrompt, 'gemini_prompt')}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-slate-300 text-[#263238] text-xs font-mono font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      {copiedSnippetType === 'gemini_prompt' ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                      <span>{copiedSnippetType === 'gemini_prompt' ? (locale === 'en' ? 'Copied!' : 'Zkopírováno!') : (locale === 'en' ? 'Copy Instructions for Gem' : 'Kopírovat instrukce pro Gem')}</span>
                    </button>
                  </div>

                  <ol className="space-y-2 text-[#546e7a] pl-5 list-decimal leading-relaxed">
                    <li>
                      {locale === 'en' ? (
                        <>Open <a href="https://gemini.google.com" target="_blank" rel="noreferrer" className="text-[#0277bd] hover:text-[#01579b] underline font-semibold inline-flex items-center gap-0.5">Google Gemini <ExternalLink className="w-3 h-3 inline" /></a> and in the left sidebar click <strong>Gem Manager</strong> → <strong>+ New Gem</strong>.</>
                      ) : (
                        <>Otevřete <a href="https://gemini.google.com" target="_blank" rel="noreferrer" className="text-[#0277bd] hover:text-[#01579b] underline font-semibold inline-flex items-center gap-0.5">Google Gemini <ExternalLink className="w-3 h-3 inline" /></a> a v levém menu klikněte na <strong>Správce Gemů (Gem Manager)</strong> → <strong>+ Nový Gem</strong>.</>
                      )}
                    </li>
                    <li>
                      {locale === 'en' ? 'Set the Gem name to' : 'Jako název Gemu zadejte'} <strong className="text-[#263238]">„{agent.name}“</strong>.
                    </li>
                    <li>
                      {locale === 'en' ? (
                        <>In the <strong>Instructions</strong> text area, paste the copied prompt, or upload the downloaded file <code className="text-[#01579b] bg-slate-200 px-1 py-0.5 rounded">{agent.id}.agent.md</code>.</>
                      ) : (
                        <>Do textového pole <strong>Instrukce (Instructions)</strong> vložte zkopírované instrukce z tlačítka výše, případně nahrajte stažený soubor <code className="text-[#01579b] bg-slate-200 px-1 py-0.5 rounded">{agent.id}.agent.md</code>.</>
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
                <div className="p-4 rounded-xl result-hub-card-item text-xs result-hub-option1-title space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#01579b] text-sm flex items-center gap-1.5">
                      {locale === 'en' ? 'Instructions for OpenAI ChatGPT (Custom GPT):' : 'Návod pro OpenAI ChatGPT (Custom GPT):'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyText(currentLivePrompt, 'chatgpt_prompt')}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-slate-300 text-[#263238] text-xs font-mono font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      {copiedSnippetType === 'chatgpt_prompt' ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                      <span>{copiedSnippetType === 'chatgpt_prompt' ? (locale === 'en' ? 'Copied!' : 'Zkopírováno!') : (locale === 'en' ? 'Copy Instructions for GPT' : 'Kopírovat instrukce pro GPT')}</span>
                    </button>
                  </div>

                  <ol className="space-y-2 text-[#546e7a] pl-5 list-decimal leading-relaxed">
                    <li>
                      {locale === 'en' ? (
                        <>Open <a href="https://chatgpt.com" target="_blank" rel="noreferrer" className="text-[#0277bd] hover:text-[#01579b] underline font-semibold inline-flex items-center gap-0.5">ChatGPT <ExternalLink className="w-3 h-3 inline" /></a>, select <strong>Explore GPTs</strong> in the left sidebar and click <strong>+ Create</strong>.</>
                      ) : (
                        <>Otevřete <a href="https://chatgpt.com" target="_blank" rel="noreferrer" className="text-[#0277bd] hover:text-[#01579b] underline font-semibold inline-flex items-center gap-0.5">ChatGPT <ExternalLink className="w-3 h-3 inline" /></a>, v levém sloupci zvolte <strong>Explore GPTs</strong> a klikněte na <strong>+ Create</strong> (vpravo nahoře).</>
                      )}
                    </li>
                    <li>
                      {locale === 'en' ? 'Switch to Configure tab and enter name' : 'Přepněte se do záložky Configure a zadejte jméno'} <strong className="text-[#263238]">„{agent.name}“</strong>.
                    </li>
                    <li>
                      {locale === 'en' ? (
                        <>In <strong>Instructions</strong> paste the copied prompt and under <strong>Knowledge</strong> upload <code className="text-[#01579b] bg-slate-200 px-1 py-0.5 rounded">{agent.id}.agent.md</code>.</>
                      ) : (
                        <>Do pole <strong>Instructions</strong> vložte zkopírovaný prompt a v sekci <strong>Knowledge</strong> nahrajte stažený soubor <code className="text-[#01579b] bg-slate-200 px-1 py-0.5 rounded">{agent.id}.agent.md</code>.</>
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
                <div className="p-4 rounded-xl result-hub-card-item text-xs result-hub-option1-title space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#01579b] text-sm flex items-center gap-1.5">
                      {locale === 'en' ? 'Instructions for Anthropic Claude (Projects):' : 'Návod pro Anthropic Claude (Projects):'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyText(currentLivePrompt, 'claude_prompt')}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-slate-300 text-[#263238] text-xs font-mono font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      {copiedSnippetType === 'claude_prompt' ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                      <span>{copiedSnippetType === 'claude_prompt' ? (locale === 'en' ? 'Copied!' : 'Zkopírováno!') : (locale === 'en' ? 'Copy Instructions for Claude' : 'Kopírovat instrukce pro Claude')}</span>
                    </button>
                  </div>

                  <ol className="space-y-2 text-[#546e7a] pl-5 list-decimal leading-relaxed">
                    <li>
                      {locale === 'en' ? (
                        <>Open <a href="https://claude.ai" target="_blank" rel="noreferrer" className="text-[#0277bd] hover:text-[#01579b] underline font-semibold inline-flex items-center gap-0.5">Claude.ai <ExternalLink className="w-3 h-3 inline" /></a> and select <strong>Projects</strong> → <strong>New Project</strong> named <strong className="text-[#263238]">„{agent.name}“</strong>.</>
                      ) : (
                        <>Otevřete <a href="https://claude.ai" target="_blank" rel="noreferrer" className="text-[#0277bd] hover:text-[#01579b] underline font-semibold inline-flex items-center gap-0.5">Claude.ai <ExternalLink className="w-3 h-3 inline" /></a> a v levém menu zvolte <strong>Projects</strong> → <strong>New Project</strong> s názvem <strong className="text-[#263238]">„{agent.name}“</strong>.</>
                      )}
                    </li>
                    <li>
                      {locale === 'en' ? 'In project settings click Set custom instructions and paste the prompt.' : 'V nastavení projektu klikněte na Set custom instructions a vložte zkopírované instrukce z bAIright.'}
                    </li>
                    <li>
                      {locale === 'en' ? (
                        <>In <strong>Project Knowledge</strong> upload <code className="text-[#01579b] bg-slate-200 px-1 py-0.5 rounded">{agent.id}.agent.md</code>.</>
                      ) : (
                        <>V sekci <strong>Project Knowledge</strong> nahrajte soubor <code className="text-[#01579b] bg-slate-200 px-1 py-0.5 rounded">{agent.id}.agent.md</code>.</>
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
      <div className="rounded-2xl bg-[#1e293b] border border-slate-700 p-6 shadow-xs space-y-4 text-left text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-[#81d4fa] border border-slate-700">
                {locale === 'en' ? 'Upcoming Integration' : 'Připravovaná integrace'}
              </span>
              <h3 className="text-base sm:text-lg font-bold text-white">
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
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#0099cc] hover:bg-[#0088b8] text-white transition-all cursor-pointer shadow-xs"
              >
                <span>{locale === 'en' ? 'Connect account / token (BYOK)' : 'Propojit účet / token (BYOK)'}</span>
              </button>
            ) : (
              <div className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300">
                {locale === 'en' ? 'Active:' : 'Aktivní:'} {result.providerUsed || 'bAIright Universal Engine'}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800">
          <span className="text-[11px] font-mono text-slate-400">{locale === 'en' ? 'Supported models:' : 'Podporované modely:'}</span>
          {['Claude 3.5 Sonnet', 'GPT-4o', 'Gemini 1.5 Pro', 'DeepSeek V3', 'Ollama Local'].map((m) => (
            <span key={m} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {m}
            </span>
          ))}
        </div>
      </div>
      )}

      {/* 4. THE ULTIMATE VALUE PROPOSITION: PERSISTENT RAG MEMORY & FEEDBACK LOOP */}
      <div className="rounded-2xl result-hub-accordion-master shadow-xs overflow-hidden transition-all text-left">
        {/* Collapsible Header Accordion Toggle */}
        <button
          type="button"
          onClick={() => setIsRAGMemoryExpanded((prev) => !prev)}
          className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer group"
          aria-expanded={isRAGMemoryExpanded}
        >
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-black text-[#263238] flex items-center gap-2 flex-wrap">
              <span>{locale === 'en' ? 'Persistent RAG Memory: An Agent that Learns With Every Purchase' : 'Permanentní RAG paměť: Agent, který se s každým nákupem učí'}</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#e1f5fe] border border-[#b3e5fc] text-[#01579b]">
                {locale === 'en' ? 'Key Advantage' : 'Klíčová výhoda bAIright architektury'}
              </span>
            </h3>
            <p className="text-xs text-[#546e7a] mt-0.5 truncate">
              {locale === 'en'
                ? 'Why an agent with profile memory is 10× more valuable than one-off anonymous chat.'
                : 'Proč je agent s profilovou pamětí 10× hodnotnější než jednorázový anonymní chat.'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-3">
            <span className="text-xs font-sans text-[#0277bd] hover:text-[#01579b] font-semibold hidden md:inline">
              {isRAGMemoryExpanded
                ? (locale === 'en' ? 'Hide overview' : 'Skrýt přehled')
                : (locale === 'en' ? 'Show overview' : 'Zobrazit přehled')}
            </span>
            <div className="p-1.5 rounded-lg bg-slate-100 border border-slate-200 text-[#263238] group-hover:border-slate-300 transition-colors">
              {isRAGMemoryExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>
        </button>

        <div className={isRAGMemoryExpanded ? "p-6 sm:p-8 border-t border-slate-200 space-y-6 block" : "hidden"}>
          {/* Contrast Grid: Generic LLM vs bAIright RAG */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 font-mono">
              {locale === 'en' ? 'Standard Chat (ChatGPT / Claude / Gemini):' : 'Běžný chat (ChatGPT / Claude / Gemini):'}
            </span>
            <ul className="text-xs text-[#546e7a] space-y-1.5 leading-relaxed">
              <li>{locale === 'en' ? '• Total amnesia: When you start a new chat in 3 months, it remembers nothing from before.' : '• Totální amnézie: Když za 3 měsíce otevřete nový chat, model si nepamatuje vůbec nic z minula.'}</li>
              <li>{locale === 'en' ? '• Continuous repetition: You have to re-enter all your preferences and budget every single time.' : '• Neustálé opakování: Pokaždé musíte znova vypisovat své rozměry nohy, rozpočet a značky, které nesnášíte.'}</li>
              <li>{locale === 'en' ? '• Zero learning from mistakes: If it suggested an ill-fitting item last time, it will happily recommend it again.' : '• Nulové poučení z chyb: Pokud vám minule doporučil botu, co vás tlačila v nártu, klidně vám ji doporučí znovu.'}</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-[#e1f5fe] border border-[#b3e5fc] space-y-2">
            <span className="text-xs font-bold text-[#01579b] flex items-center gap-1.5 font-mono">
              {locale === 'en' ? 'bAIright Agent with persistent RAG memory:' : 'bAIright Agent s permanentní RAG pamětí:'}
            </span>
            <ul className="text-xs text-[#014377] space-y-1.5 leading-relaxed">
              <li>{locale === 'en' ? '• Remembers every recommendation: All previous choices and feedback are stored in your profile.' : '• Pamatuje si každé doporučení: Všechny předchozí volby i váš feedback jsou trvale uloženy ve vaší profilové databázi.'}</li>
              <li>{locale === 'en' ? '• Automatic injection into every prompt: Past context is loaded without retyping.' : '• Automatická injekce do každého promptu: Při každém dalším probuzení agenta se kontext z minulosti automaticky promítne do dotazu bez vašeho přepisování.'}</li>
              <li>{locale === 'en' ? '• Learning feedback loop: Provide feedback and the agent remembers it forever!' : '• Učící se smyčka: Zadáte feedback (např. „Hoka byly moc úzké v nártu“) a agent si to navždy pamatuje pro všechny příští nákupy!'}</li>
            </ul>
          </div>
        </div>

        {/* Step-by-Step Scenario Example */}
        <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#263238] flex items-center gap-1.5">
            {locale === 'en' ? 'Practical Example: How Continuous Memory Works' : 'Příklad z praxe: Jak funguje kontinuální paměť agenta'}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
              <span className="font-bold text-[#263238]">{locale === 'en' ? '1. Today (First Launch)' : '1. Dnes (První spuštění)'}</span>
              <p className="text-[#546e7a]">{locale === 'en' ? 'Agent recommends shoes. You give feedback: "Hoka pinched my instep, keep budget under $150."' : 'Agent doporučí boty. Dáte mu feedback: „Hoka mě tlačily v nártu a chci strop do 3 500 Kč.“'}</p>
            </div>
            <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
              <span className="font-bold text-[#01579b]">{locale === 'en' ? '2. RAG Indexing' : '2. RAG Uložení'}</span>
              <p className="text-[#546e7a]">{locale === 'en' ? 'Information is indexed into your profile database as a verified shopping fact.' : 'Informace se indexuje do vaší profilové databázi jako ověřený nákupní fakt.'}</p>
            </div>
            <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
              <span className="font-bold text-[#01579b]">{locale === 'en' ? '3. In 6 Months (Next Launch)' : '3. Za půl roku (Další probuzení)'}</span>
              <p className="text-[#546e7a]">{locale === 'en' ? 'Agent autonomously loads: "User has wide instep, exclude narrow lasts, budget under $150."' : 'Agent si sám načte: „Uživatel má široký nárt, vyřadit úzká kopyta Hoka a držet rozpočet 3 500 Kč.“'}</p>
            </div>
          </div>
        </div>

        {/* Current Active RAG Facts for this Agent */}
        {enrichedFacts.length > 0 && (
          <div className="space-y-2 pt-1">
            <span className="text-xs font-mono font-semibold text-[#546e7a] flex items-center gap-1.5">
              {locale === 'en' ? `Active RAG facts in this agent\'s prompt (${enrichedFacts.length}):` : `Aktuálně načtená RAG fakta v promptu tohoto agenta (${enrichedFacts.length}):`}
            </span>
            <div className="flex flex-wrap gap-2">
              {enrichedFacts.map((f, fIdx) => (
                <span
                  key={fIdx}
                  className="text-xs px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[#263238] flex items-center gap-1.5 font-mono"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0099cc]" />
                  <span>{f.fact}</span>
                </span>
              ))}
            </div>
          </div>
        )}
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

      {/* BYOK Required Notice Modal (Cyber-glass) */}
      {showBYOKHintModal && mounted && typeof document !== 'undefined' && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
          onClick={() => setShowBYOKHintModal(false)}
        >
          <div
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#070d18] border-2 border-cyan-500/40 rounded-3xl p-6 sm:p-8 shadow-[0_20px_70px_rgba(6,182,212,0.3)] relative text-left space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Monospace Tag */}
            <div className="flex items-start justify-between gap-3 border-b border-cyan-500/20 pb-4">
              <div>
                <span className="inline-block text-[10px] font-mono font-bold tracking-widest text-cyan-400 uppercase bg-cyan-950/80 px-2.5 py-0.5 rounded border border-cyan-500/30 mb-2">
                  {locale === 'en' ? 'BYOK MODEL REQUIRED • LIVE CHAT' : 'VYŽADUJE VLASTNÍ AI MODEL • ŽIVÝ CHAT'}
                </span>
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  {locale === 'en'
                    ? 'Connect your AI key for live discussion'
                    : 'Propojte svůj AI klíč pro živou diskusi s agentem'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowBYOKHintModal(false)}
                className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-cyan-400/50 transition-colors cursor-pointer shrink-0"
                aria-label={locale === 'en' ? 'Close dialog' : 'Zavřít dialog'}
              >
                <span className="font-mono text-sm leading-none block">✕</span>
              </button>
            </div>

            {/* Content Body */}
            <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-2">
                <p className="text-slate-200 leading-relaxed">
                  {locale === 'en'
                    ? 'To start an interactive consultative discussion and tune product parameters in real-time, you need to connect your own AI API key (Google Gemini, OpenAI ChatGPT, Anthropic Claude, or local Ollama).'
                    : 'Pro spuštění interaktivní konzultace a ladění doporučených produktů v reálném čase je potřeba připojit vlastní AI API klíč (Google Gemini, OpenAI ChatGPT, Anthropic Claude nebo lokální Ollama).'}
                </p>
                <div className="pt-1 flex flex-wrap gap-2 text-[11px] font-mono text-cyan-300">
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-cyan-500/20">Google Gemini (Free tier)</span>
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-cyan-500/20">OpenAI GPT-4o</span>
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-cyan-500/20">Claude 3.5</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
                <span className="text-[11px] font-mono text-slate-400 font-bold block uppercase tracking-wider">
                  {locale === 'en' ? 'Alternative: Free Download' : 'Alternativa: Stažení zdarma'}
                </span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {locale === 'en'
                    ? 'Don’t have an API key? You can download the complete .agent.md deliverable and paste it directly into your favorite AI web chat.'
                    : 'Nemáte po ruce API klíč? Můžete si zdarma stáhnout kompletní soubor .agent.md a vložit ho přímo do webového rozhraní ChatGPT, Gemini nebo Claude.'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowBYOKHintModal(false)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer text-center"
              >
                <span>{locale === 'en' ? 'Dismiss' : 'Zavřít'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowBYOKHintModal(false);
                  if (onOpenSubscriptionModal) {
                    onOpenSubscriptionModal();
                  } else if (onOpenChat) {
                    onOpenChat(currentLivePrompt, result || previousResult, answers);
                  }
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 hover:brightness-110 shadow-[0_0_20px_rgba(6,182,212,0.35)] transition-all cursor-pointer text-center"
              >
                <span>{locale === 'en' ? 'Manage Keys in Vault' : 'Správa klíčů ve Vaultu'}</span>
                <span className="text-sm">→</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
