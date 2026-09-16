'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  UniversalAgentDefinition 
} from '@/lib/agent/universal-agent-schema';
import { AgentStorageService } from '@/lib/agent/agent-storage-service';
import { 
  discoverDomainParameters, 
  DomainAnalysisResult,
  ExtractedDomainParameter,
  buildCustomAgentFromParameters
} from '@/lib/agent/domain-parameter-discovery';
import { DomainLearningService } from '@/lib/agent/domain-learning-service';
import { useI18n } from '@/lib/i18n/I18nContext';
import { 
  Sparkles, 
  Search, 
  ArrowRight, 
  Download, 
  PlusCircle, 
  Trash2, 
  Cpu, 
  Layers,
  ChevronRight,
  ShieldCheck,
  Zap,
  Footprints,
  CheckCircle2,
  X,
  Plus,
  RotateCcw,
  Dices,
  Sliders,
  Check
} from 'lucide-react';

interface AgentCategoryLauncherProps {
  onSelectAgent: (agent: UniversalAgentDefinition, initialShowResult?: boolean) => void;
  currentAgent?: UniversalAgentDefinition | null;
  activeProviderId?: string;
  currentApiKeys?: Record<string, string>;
  onOpenSubscriptionModal?: () => void;
  userName?: string;
}

export const AgentCategoryLauncher: React.FC<AgentCategoryLauncherProps> = ({
  onSelectAgent,
  currentAgent,
  activeProviderId,
  currentApiKeys,
  onOpenSubscriptionModal,
  userName = 'Jan Mynář',
}) => {
  const { t, locale } = useI18n();
  const [query, setQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [agents, setAgents] = useState<UniversalAgentDefinition[]>([]);
  const customInputRef = useRef<HTMLInputElement>(null);

  // Parameter Tuning State
  const [activeParameters, setActiveParameters] = useState<ExtractedDomainParameter[]>([]);
  const [selectedParamIds, setSelectedParamIds] = useState<Set<string>>(new Set());
  const [suggestedPool, setSuggestedPool] = useState<ExtractedDomainParameter[]>([]);
  const [customParamInput, setCustomParamInput] = useState('');
  const [learnedNotice, setLearnedNotice] = useState<string | null>(null);

  const focusCustomParamInput = () => {
    if (customInputRef.current) {
      customInputRef.current.focus();
      customInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  // Researched Domain Analysis State (Explicitly driven by Parameter Research Agent)
  const [researchedAnalysis, setResearchedAnalysis] = useState<DomainAnalysisResult | null>(null);
  const [isResearching, setIsResearching] = useState(false);
  const [researchNotice, setResearchNotice] = useState<string | null>(null);
  const [researchError, setResearchError] = useState<string | null>(null);
  const [lastFailedQuery, setLastFailedQuery] = useState<string | null>(null);

  // Trigger Parameter Research Agent on-demand for a target keyword
  const handleResearchParameters = async (targetKeyword?: string) => {
    const rawTarget = typeof targetKeyword === 'string' ? targetKeyword : query;
    const target = rawTarget.trim();
    if (!target || isResearching) return;

    setIsResearching(true);
    setLearnedNotice(null);
    setResearchNotice(locale === 'en' ? `Agent Luke is analyzing market teardowns and failure points for: "${target}"...` : `Agent Luke zkoumá trh a odhaluje skrytá kritéria pro: "${target}"...`);

    try {
      const res = await fetch('/api/agent/research-parameters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: target, locale }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.analysis) {
          setResearchError(null);
          setLastFailedQuery(null);
          setResearchedAnalysis(data.analysis);
          setActiveParameters(data.analysis.parameters || []);
          setSelectedParamIds(new Set((data.analysis.parameters || []).map((p: ExtractedDomainParameter) => p.id)));
          setSuggestedPool(data.analysis.suggestedAlternatives || []);
          return;
        }
      }

      // Non-OK response — show retryable error, NO generic fallback
      let errorMsg: string;
      try {
        const errData = await res.json();
        errorMsg = errData?.error || 'Analýza parametrů selhala.';
      } catch {
        errorMsg = 'Analýza parametrů selhala. Zkuste to prosím znovu.';
      }
      throw new Error(errorMsg);
    } catch (err: any) {
      const msg = err?.message || 'Analýza parametrů selhala. Zkuste to prosím znovu.';
      console.error('[Luke] Research failed:', msg);
      setResearchError(msg);
      setLastFailedQuery(target);
    } finally {
      setIsResearching(false);
      setResearchNotice(null);
    }
  };

  // Load saved agents from localStorage on client mount
  useEffect(() => {
    setAgents(AgentStorageService.getAllAgents());
  }, []);

  const toggleParamSelected = (paramId: string) => {
    setSelectedParamIds((prev) => {
      const next = new Set(prev);
      if (next.has(paramId)) {
        next.delete(paramId);
      } else {
        next.add(paramId);
      }
      return next;
    });
  };

  const handleRemoveParameter = (paramId: string) => {
    const toRemove = activeParameters.find((p) => p.id === paramId);
    if (!toRemove) return;
    setActiveParameters((prev) => prev.filter((p) => p.id !== paramId));
    setSelectedParamIds((prev) => {
      const next = new Set(prev);
      next.delete(paramId);
      return next;
    });
    setSuggestedPool((prev) => [toRemove, ...prev.filter((p) => p.id !== paramId)]);
  };

  const handleAddSuggestedParameter = (param: ExtractedDomainParameter) => {
    setSuggestedPool((prev) => prev.filter((p) => p.id !== param.id));
    setActiveParameters((prev) => [...prev, param]);
    setSelectedParamIds((prev) => new Set(prev).add(param.id));
  };

  const handleAddCustomParameter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customParamInput.trim();
    if (!trimmed) return;

    // Kolektivní učení: zaznamenáme parametr do doménové paměti agenta
    const domainKey = researchedAnalysis?.matchedDomain || 'generic';
    const { parameter, isNew } = DomainLearningService.recordUserParameter(domainKey, trimmed);

    // Přidáme parametr do aktivního výběru, pokud tam ještě není
    if (!activeParameters.some((p) => p.id === parameter.id || p.name.toLowerCase() === parameter.name.toLowerCase())) {
      setActiveParameters((prev) => [...prev, parameter]);
      setSelectedParamIds((prev) => new Set(prev).add(parameter.id));
    }

    setLearnedNotice(
      isNew
        ? `💡 Parametr "${trimmed}" byl úspěšně naučen a uložen do komunitní paměti pro budoucí vyhledávání!`
        : `🔥 Parametr "${trimmed}" byl posílen v kolektivní paměti (zvýšena popularita)!`
    );
    setTimeout(() => {
      setLearnedNotice(null);
    }, 5000);

    setCustomParamInput('');
  };

  const handleResetParameters = () => {
    if (researchedAnalysis) {
      setActiveParameters(researchedAnalysis.parameters);
      setSelectedParamIds(new Set(researchedAnalysis.parameters.map((p) => p.id)));
      setSuggestedPool(researchedAnalysis.suggestedAlternatives || []);
    }
  };

  const handleSuggestMore = () => {
    const extra: ExtractedDomainParameter[] = [
      {
        id: `extra_${Date.now()}_1`,
        name: 'Servisní dostupnost & náhradní díly v ČR',
        category: 'Podpora',
        importance: 'recommended',
        rationale: 'Rychlost řešení záručních i pozáručních oprav a dostupnost dílů.',
        icon: '🔧',
        suggestedComponent: 'chips',
        suggestedValues: ['Autorizovaný servis v ČR', 'Běžný servis postačí'],
      },
      {
        id: `extra_${Date.now()}_2`,
        name: 'Uživatelská ergonomie & snadná údržba',
        category: 'Komfort',
        importance: 'preference',
        rationale: 'Snadné čištění, intuitivní obsluha a minimum starostí při běžném používání.',
        icon: '🧹',
        suggestedComponent: 'chips',
        suggestedValues: ['Maximálně snadná údržba', 'Běžná údržba'],
      },
      {
        id: `extra_${Date.now()}_3`,
        name: 'Ekologická stopa & recyklovatelné materiály',
        category: 'Udržitelnost',
        importance: 'preference',
        rationale: 'Certifikované udržitelné materiály a nízký dopad na životní prostředí.',
        icon: '🌿',
        suggestedComponent: 'chips',
        suggestedValues: ['Důraz na ekologii a recyklaci', 'Standardní provedení'],
      },
    ];
    setSuggestedPool((prev) => [...prev, ...extra.filter((e) => !prev.some((p) => p.id === e.id))]);
  };

  const handleCreateCustomWizard = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || isGenerating || isResearching) return;

    setIsGenerating(true);
    setGenerationStep('Analyzuji kategorii produktu...');

    // If parameters haven't been researched yet (edge case: user skipped research step),
    // use curated offline knowledge base for known domains as last resort in generate flow only.
    const currentAnalysis = researchedAnalysis || discoverDomainParameters(query.trim());
    if (!researchedAnalysis) {
      setResearchedAnalysis(currentAnalysis);
    }

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

      const effectiveSelectedParams = activeParameters.filter((p) => selectedParamIds.has(p.id));
      const finalParamsToUse = effectiveSelectedParams.length > 0 ? effectiveSelectedParams : activeParameters;

      setGenerationStep('Odvozuji klíčové rozhodovací parametry a otázky...');

      const res = await fetch('/api/agent/generate-wizard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query.trim(),
          customParameters: finalParamsToUse.length > 0 ? finalParamsToUse : undefined,
          providerId,
          apiKey,
          locale,
        }),
      });

      if (!res.ok) {
        throw new Error('Chyba při generování průvodce.');
      }

      setGenerationStep('Sestavuji interaktivní komponenty wizardu...');
      const data = await res.json();
      let finalAgent = data.agent;

      if (!finalAgent && currentAnalysis) {
        finalAgent = buildCustomAgentFromParameters(
          currentAnalysis,
          finalParamsToUse.length > 0 ? finalParamsToUse : currentAnalysis.parameters
        );
      }

      if (finalAgent) {
        AgentStorageService.saveAgent(finalAgent);
        setAgents(AgentStorageService.getAllAgents());
        setQuery('');
        onSelectAgent(finalAgent, false);
      }
    } catch (err) {
      console.warn('Fallback to tuned agent generator:', err);
      if (currentAnalysis) {
        const effectiveSelectedParams = activeParameters.filter((p) => selectedParamIds.has(p.id));
        const finalParamsToUse = effectiveSelectedParams.length > 0 ? effectiveSelectedParams : activeParameters;
        const fallbackAgent = buildCustomAgentFromParameters(
          currentAnalysis,
          finalParamsToUse.length > 0 ? finalParamsToUse : currentAnalysis.parameters
        );
        AgentStorageService.saveAgent(fallbackAgent);
        setAgents(AgentStorageService.getAllAgents());
        setQuery('');
        onSelectAgent(fallbackAgent, false);
      } else {
        alert('Chyba při generování nákupního průvodce. Zkontrolujte připojení k internetu nebo API klíč.');
      }
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };


  const handleDeleteAgent = (e: React.MouseEvent, agentId: string) => {
    e.stopPropagation();
    if (confirm('Opravdu chcete smazat tohoto agenta z knihovny?')) {
      AgentStorageService.deleteAgent(agentId);
      setAgents(AgentStorageService.getAllAgents());
    }
  };

  const handleDeleteAllAgents = () => {
    if (confirm('Opravdu chcete smazat všechny vaše agenty?')) {
      AgentStorageService.deleteAllAgents();
      setAgents([]);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-10 py-6 animate-in fade-in duration-300">
      {/* Hero Search Box (PRD Step 1: User enters a free-text starting point) */}
      <div className="rounded-3xl p-8 sm:p-12 border-2 border-cyan-500/40 bg-gradient-to-b from-[#091528]/95 via-[#050e1c]/95 to-[#020610]/95 shadow-[0_0_80px_rgba(6,182,212,0.18),0_30px_90px_rgba(0,0,0,0.7)] relative text-center space-y-7 ring-1 ring-cyan-400/25">
        {/* Ambient Top Spotlight illuminating the search box - isolated in an overflow-hidden wrapper so hero content never gets scroll-clipped */}
        <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
          <div className="absolute -top-28 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-cyan-500/18 rounded-full blur-3xl" />
          <div className="absolute -bottom-36 -right-20 w-80 h-80 bg-teal-500/12 rounded-full blur-3xl" />
        </div>

        <div className="max-w-2xl mx-auto space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-400/40 text-cyan-300 text-xs font-mono font-bold shadow-[0_0_16px_rgba(6,182,212,0.25)]">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>{t.launcher.badge}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-md">
            {t.launcher.heroTitle}
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            {t.launcher.heroSubtitle}
          </p>
        </div>

        {/* Free-Text Prompt Generator Form with Glowing Ambient Aura */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            if (!researchedAnalysis || researchedAnalysis.keyword.toLowerCase() !== query.trim().toLowerCase()) {
              handleResearchParameters();
            } else {
              handleCreateCustomWizard(e);
            }
          }} 
          className="max-w-2xl mx-auto relative z-10"
        >
          <div className="relative group">
            {/* Luminous Animated Border Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-teal-400 to-cyan-500 rounded-2xl blur-sm opacity-35 group-hover:opacity-65 group-focus-within:opacity-100 transition-all duration-300 pointer-events-none" />

            <div className="relative flex items-center h-14 sm:h-16 bg-slate-950/95 rounded-2xl border-2 border-cyan-500/50 shadow-[0_4px_30px_rgba(0,0,0,0.8)] overflow-hidden">
              <div className="pl-4 sm:pl-5 text-cyan-400 shrink-0">
                <Search className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>

              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (!researchedAnalysis || researchedAnalysis.keyword.toLowerCase() !== query.trim().toLowerCase()) {
                      handleResearchParameters();
                    } else {
                      handleCreateCustomWizard();
                    }
                  }
                }}
                disabled={isGenerating || isResearching}
                placeholder={t.launcher.searchPlaceholder}
                className="w-full h-full pl-3.5 pr-32 sm:pr-40 bg-transparent text-white placeholder-slate-500 text-sm sm:text-base font-medium outline-none leading-normal caret-cyan-400 !border-none !border-0 !outline-none !shadow-none"
                style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
              />

              <button
                type="button"
                onClick={() => handleResearchParameters()}
                disabled={!query.trim() || isGenerating || isResearching}
                className="absolute right-2 px-5 sm:px-7 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-300 text-slate-950 text-xs sm:text-sm font-black hover:brightness-110 shadow-[0_0_22px_rgba(6,182,212,0.45)] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1.5 shrink-0 active:scale-95"
              >
                {isResearching ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>{t.launcher.btnResearching}</span>
                  </>
                ) : isGenerating ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>{t.launcher.btnBuilding}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 stroke-[2.5]" />
                    <span>{t.launcher.btnStart}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Researching Animation Progress Card */}
          {isResearching && (
            <div className="rounded-2xl bg-[#090d16] border border-cyan-500/40 p-6 text-center space-y-3 animate-pulse shadow-2xl">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-cyan-950/90 border border-cyan-500/50 text-cyan-400 mx-auto">
                <Sparkles className="w-6 h-6 animate-spin" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white font-mono flex items-center justify-center gap-2">
                  <span>🧠 AI provádí hloubkový průzkum trhu pro:</span>
                  <span className="text-cyan-300 font-sans font-bold">{query.trim()}</span>
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xl mx-auto leading-relaxed">
                  Procházím odborné recenze, komunitní fóra a technické specifikace výrobců pro nalezení skutečných rozhodovacích parametrů...
                </p>
              </div>
            </div>
          )}

          {/* Luke Research Error Card — no generic fallback, user must retry */}
          {researchError && !isResearching && (
            <div className="rounded-2xl bg-[#0d0a0a] border border-red-500/40 p-6 text-center space-y-4 shadow-2xl">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-950/80 border border-red-500/50 text-red-400 mx-auto">
                <span className="text-2xl">⚠️</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-red-300 font-mono">
                  Výzkum parametrů selhal
                </h4>
                <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
                  {researchError}
                </p>
              </div>
              <button
                onClick={() => {
                  setResearchError(null);
                  if (lastFailedQuery) handleResearchParameters(lastFailedQuery);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-950/60 border border-red-500/40 text-red-300 text-xs font-mono font-semibold hover:bg-red-900/60 hover:border-red-400/60 transition-all"
              >
                <span>🔄</span>
                <span>Zkusit znovu</span>
              </button>
            </div>
          )}

          {/* Researched Domain Parameter Discovery & Interactive Tuner */}
          {researchedAnalysis && !isResearching && (
            <div className="rounded-2xl bg-[#090d16] border border-cyan-500/30 p-4 sm:p-5 text-left space-y-4 animate-in fade-in slide-in-from-top-2 duration-200 shadow-xl">
              <div className="flex items-center justify-between gap-3 border-b border-cyan-500/15 pb-3.5">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-[#06101e] border border-cyan-500/30 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                    {researchedAnalysis.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base sm:text-lg font-bold text-white tracking-tight">
                        {researchedAnalysis.categoryName}
                      </h4>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
                        🔍 Agent Luke
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 leading-normal">
                      Vyberte parametry pro dotazník, nepotřebné odeberte křížkem (X).
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleResetParameters}
                    className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border border-cyan-500/20 hover:border-cyan-500/40 text-xs transition-colors cursor-pointer flex items-center justify-center shrink-0"
                    title="Obnovit výchozí parametry"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Active Parameters Grid with Selection Checkboxes & Dismiss (X) controls */}
              {activeParameters.length === 0 ? (
                <div className="p-6 rounded-xl bg-slate-950/60 border border-dashed border-slate-800 text-center space-y-2">
                  <Sliders className="w-6 h-6 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">Odebrali jste všechny parametry.</p>
                  <button
                    type="button"
                    onClick={handleResetParameters}
                    className="text-xs font-mono text-cyan-400 hover:underline cursor-pointer"
                  >
                    ↺ Obnovit výchozí doporučené parametry
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {activeParameters.map((param) => {
                    const isSelected = selectedParamIds.has(param.id);

                    return (
                      <div 
                        key={param.id} 
                        onClick={() => toggleParamSelected(param.id)}
                        className={`relative group p-2.5 rounded-xl border transition-all flex items-start gap-2.5 shadow-sm cursor-pointer select-none ${
                          isSelected
                            ? 'bg-slate-900/95 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)] ring-1 ring-cyan-400/30'
                            : 'bg-slate-950/60 border-slate-800/80 opacity-50 hover:opacity-75'
                        }`}
                      >
                        {/* Checkbox indicator */}
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                          isSelected
                            ? 'bg-cyan-500 border-cyan-400 text-slate-950 shadow-sm'
                            : 'bg-slate-900 border-slate-700 text-transparent'
                        }`}>
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>

                        <span className="text-base shrink-0 mt-0.5">{param.icon || '📌'}</span>
                        <div className="min-w-0 flex-1 pr-7">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-xs font-semibold leading-snug line-clamp-2 break-words ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                              {param.name}
                            </span>
                            {param.id.startsWith('learned-') && (
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-500/40 font-bold flex items-center gap-1">
                                👥 Naučeno komunitou
                              </span>
                            )}
                            {(param.id.startsWith('custom_') || param.category === 'Komunitní doporučení') && (
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-teal-950 text-teal-300 border border-teal-500/40 font-bold">
                                Vlastní
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 leading-tight mt-1 line-clamp-2">{param.rationale}</p>
                        </div>

                        {/* X Dismiss Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveParameter(param.id);
                          }}
                          className="absolute top-2 right-2 p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-500/30 transition-all cursor-pointer"
                          title="Odebrat tento parametr"
                          aria-label={`Odebrat parametr ${param.name}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}

                  {/* Interactive Add Custom Parameter Tile in Grid */}
                  <button
                    type="button"
                    onClick={focusCustomParamInput}
                    className="group relative p-3 rounded-xl border-2 border-dashed border-cyan-500/50 hover:border-cyan-300 bg-gradient-to-br from-cyan-950/25 to-teal-950/20 hover:from-cyan-950/45 hover:to-teal-950/40 transition-all flex items-center justify-center gap-3 text-cyan-300 hover:text-white cursor-pointer shadow-sm hover:shadow-[0_0_20px_rgba(6,182,212,0.2)] min-h-[62px]"
                    title="Klikněte pro přidání vlastního kritéria"
                  >
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400/50 group-hover:bg-cyan-400 group-hover:text-slate-950 flex items-center justify-center text-cyan-300 transition-all shadow-sm shrink-0">
                      <Plus className="w-4 h-4 stroke-[3]" />
                    </div>
                    <div className="text-left min-w-0">
                      <div className="text-xs font-bold font-mono tracking-tight text-cyan-300 group-hover:text-white flex items-center gap-1.5">
                        <span>+ Přidat další parametr</span>
                      </div>
                      <div className="text-[10px] text-slate-400 group-hover:text-cyan-200/80">
                        Vlastní kritérium nebo specifická výbava
                      </div>
                    </div>
                  </button>
                </div>
              )}

              {/* Parameter Customizer Controls: Prominent Glowing Studio Card */}
              <div id="custom-param-adder-section" className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-[#081528] via-[#05101d] to-[#030712] border-2 border-cyan-400/60 shadow-[0_0_35px_rgba(6,182,212,0.18)] space-y-4 ring-1 ring-cyan-500/20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyan-500/20 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)] shrink-0">
                      <Plus className="w-4 h-4 stroke-[3]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="text-xs sm:text-sm font-extrabold text-white tracking-tight">
                          Chybí vám zde nějaké kritérium? Přidejte si vlastní parametr
                        </h5>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 font-bold hidden sm:inline-block">
                          Interaktivní
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Napište libovolný parametr, který je pro vás klíčový, nebo klikněte na návrhy níže.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Add Custom Parameter Input */}
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <div className="relative flex-1 w-full">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400">
                      <Plus className="w-4 h-4" />
                    </div>
                    <input
                      ref={customInputRef}
                      id="custom-param-input"
                      type="text"
                      value={customParamInput}
                      onChange={(e) => setCustomParamInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomParameter();
                        }
                      }}
                      placeholder="Přidat vlastní parametr (např. Tažné zařízení, Prosklená střecha, Hlučnost)..."
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950/90 border-2 border-cyan-500/40 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-300 focus:ring-4 focus:ring-cyan-500/25 font-mono transition-all shadow-inner"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCustomParameter}
                    disabled={!customParamInput.trim()}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-300 text-slate-950 font-black text-xs sm:text-sm hover:brightness-110 shadow-[0_0_18px_rgba(6,182,212,0.35)] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Přidat parametr</span>
                  </button>
                </div>

                {/* Learned Parameter Notification Banner */}
                {learnedNotice && (
                  <div className="p-2.5 rounded-xl bg-purple-950/80 border border-purple-500/40 text-xs text-purple-200 flex items-center gap-2 shadow-sm animate-in fade-in duration-300">
                    <Sparkles className="w-4 h-4 text-purple-400 shrink-0 animate-pulse" />
                    <span className="font-mono text-[11px]">{learnedNotice}</span>
                  </div>
                )}

                {/* Available Suggestions Pool */}
                {suggestedPool.length > 0 && (
                  <div className="space-y-2 pt-1 border-t border-cyan-500/15">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-slate-300 font-bold flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Rychlé návrhy z testů a fór (klikněte pro okamžité zařazení):</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleSuggestMore}
                        className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer hover:underline"
                      >
                        <Dices className="w-3 h-3" />
                        <span>Navrhnout další</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {suggestedPool.map((sParam) => (
                        <button
                          key={sParam.id}
                          type="button"
                          onClick={() => handleAddSuggestedParameter(sParam)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-cyan-950/90 text-slate-300 hover:text-cyan-200 border border-slate-700/80 hover:border-cyan-400 text-xs font-mono transition-all cursor-pointer group shadow-sm hover:shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                          title={sParam.rationale}
                        >
                          <Plus className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-125 transition-transform" />
                          <span className="font-medium">{sParam.icon ? `${sParam.icon} ` : ''}{sParam.name}</span>
                          {sParam.id.startsWith('learned-') && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-500/40 ml-0.5">
                              👥 Komunitní
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Action Bar: Clean Parameter Counter & Direct Action CTA */}
              <div className="pt-3 border-t border-cyan-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs font-mono text-slate-400 flex items-center gap-2 whitespace-nowrap self-start sm:self-center">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="text-cyan-300 font-bold">
                    {locale === 'en' 
                      ? `Selected ${selectedParamIds.size} of ${activeParameters.length} parameters`
                      : `Vybráno ${selectedParamIds.size} z ${activeParameters.length} parametrů`}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={selectedParamIds.size === 0 || isGenerating}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-400 text-slate-950 text-xs sm:text-sm font-extrabold hover:brightness-110 shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin" />
                      <span>Sestavuji průvodce...</span>
                    </>
                  ) : (
                    <>
                      <span>Nastavit cílové hodnoty</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Dynamic Loading Step Indicator */}
          {isGenerating && (
            <div className="mt-3 flex items-center justify-center gap-2 text-xs font-mono text-cyan-300 animate-pulse">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>{generationStep}</span>
            </div>
          )}
        </form>
      </div>

      {/* User Custom Agents Library Grid - Only rendered when user has created custom agents */}
      {agents.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>{t.launcher.myAgentsTitle}</span>
                <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-cyan-300">
                  {agents.length}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Uložené konfigurace vašich nákupních rádců.
              </p>
            </div>

            <button
              type="button"
              onClick={handleDeleteAllAgents}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-950/80 text-rose-300 border border-rose-500/30 hover:border-rose-400 text-xs font-mono transition-all cursor-pointer"
              title="Smazat všechny agenty z knihovny"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Smazat všechny agenty</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <div
                key={agent.id}
                onClick={() => onSelectAgent(agent, true)}
                className="group p-5 rounded-3xl bg-[#060c18] border border-cyan-500/20 hover:border-cyan-400/80 shadow-md hover:shadow-cyan-950/40 transition-all cursor-pointer flex flex-col justify-between space-y-4 relative overflow-hidden"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-2xl shadow-inner group-hover:scale-105 transition-transform">
                      {agent.icon || '🎯'}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
                        {agent.questions.length} otázek
                      </span>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteAgent(e, agent.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Smazat agenta z knihovny"
                        aria-label={`Smazat agenta ${agent.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-base text-white group-hover:text-cyan-300 transition-colors">
                      {agent.name}
                    </h3>
                    <span className="text-[11px] font-mono text-cyan-400/80">
                      {agent.category}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                    {agent.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-mono text-slate-500">
                    Vlastní agent
                  </span>

                  <span className="flex items-center gap-1 text-cyan-400 font-bold group-hover:translate-x-1 transition-transform">
                    <span>Spustit</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
