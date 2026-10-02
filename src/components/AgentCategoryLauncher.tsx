'use client';
import { UserRAGHistoryService } from "@/lib/agent/user-rag-history-service";
import { Badge, Button, Card, Toast } from '@/components/ui';

import React, { useState, useEffect, useRef } from 'react';
import { 
  UniversalAgentDefinition 
} from '@/lib/agent/universal-agent-schema';
import { AgentStorageService } from '@/lib/agent/agent-storage-service';
import { BuyMeACoffeeModal } from './BuyMeACoffeeModal';
import { getLocalizedAgent } from '@/lib/agent/agent-localization';
import { 
  discoverDomainParameters, 
  DomainAnalysisResult,
  ExtractedDomainParameter,
  buildCustomAgentFromParameters
} from '@/lib/agent/domain-parameter-discovery';
import { DomainLearningService } from '@/lib/agent/domain-learning-service';
import { useI18n } from '@/lib/i18n/I18nContext';
import { useTheme } from '@/lib/theme/ThemeContext';
import { 
  AlertTriangle,
  RefreshCw,
  Sparkles, 
  Copy, 
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
  initialTab?: 'active' | 'purchased';
}

export const AgentCategoryLauncher: React.FC<AgentCategoryLauncherProps> = ({
  onSelectAgent,
  currentAgent,
  activeProviderId,
  currentApiKeys,
  onOpenSubscriptionModal,
  userName = 'Jan Mynář',
  initialTab = 'active',
}) => {
  const { t, locale } = useI18n();
  const { isMaterialCobalt } = useTheme();
  const [query, setQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeAgentsTab, setActiveAgentsTab] = useState<'active' | 'purchased'>(initialTab);
  const [bmcModalAgent, setBmcModalAgent] = useState<UniversalAgentDefinition | null>(null);

  useEffect(() => {
    if (initialTab) {
      setActiveAgentsTab(initialTab);
    }
  }, [initialTab]);
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
    const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  const handleCopyPrompt = async (promptText: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(promptText);
      }
      setToastType('success');
      setToastMessage(locale === 'en' ? 'Copied to clipboard!' : 'Kopírováno do schránky!');
    } catch (err) {
      setToastType('error');
      setToastMessage(locale === 'en' ? 'Copy failed' : 'Kopírování selhalo');
    }
  };

const [researchError, setResearchError] = useState<string | null>(null);
  const [lastFailedQuery, setLastFailedQuery] = useState<string | null>(null);

  // Trigger Parameter Research Agent on-demand for a target keyword
  const handleResearchParameters = async (targetKeyword?: string) => {
    const rawTarget = typeof targetKeyword === 'string' ? targetKeyword : query;
    const target = rawTarget.trim();
    if (!target || isResearching) return;

    setIsResearching(true);
    setLearnedNotice(null);
    setResearchNotice(locale === 'en' ? `Analyzing market teardowns and failure points for: "${target}"...` : `Zkoumám trh a odhaluji skrytá kritéria pro: "${target}"...`);

    try {
      const res = await fetch(`/api/agent/research-parameters?locale=${locale}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: target,
          locale,
          apiKey: currentApiKeys?.[activeProviderId || 'bairight_core'],
          providerId: activeProviderId,
        }),
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
        errorMsg = errData?.error || (locale === 'en' ? 'Parameter analysis failed.' : 'Analýza parametrů selhala.');
      } catch {
        errorMsg = locale === 'en' ? 'Parameter analysis failed. Please try again.' : 'Analýza parametrů selhala. Zkuste to prosím znovu.';
      }
      throw new Error(errorMsg);
    } catch (err: any) {
      const msg = err?.message || (locale === 'en' ? 'Parameter analysis failed. Please try again.' : 'Analýza parametrů selhala. Zkuste to prosím znovu.');
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
    const { parameter, isNew } = DomainLearningService.recordUserParameter(domainKey, trimmed, undefined, locale);

    // Přidáme parametr do aktivního výběru, pokud tam ještě není
    const userCustomParam = {
      ...parameter,
      id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      category: locale === 'en' ? 'Custom' : 'Vlastní',
    };

    if (!activeParameters.some((p) => p.name.toLowerCase() === userCustomParam.name.toLowerCase())) {
      setActiveParameters((prev) => [...prev, userCustomParam]);
      setSelectedParamIds((prev) => new Set(prev).add(userCustomParam.id));
    }

    setLearnedNotice(
      isNew
        ? (locale === 'en' ? `Parameter "${trimmed}" successfully learned and saved to community memory!` : `Parametr "${trimmed}" byl úspěšně naučen a uložen do komunitní paměti pro budoucí vyhledávání!`)
        : (locale === 'en' ? `Parameter "${trimmed}" reinforced in community memory!` : `Parametr "${trimmed}" byl posílen v kolektivní paměti (zvýšena popularita)!`)
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
        icon: '',
        suggestedComponent: 'chips',
        suggestedValues: ['Autorizovaný servis v ČR', 'Běžný servis postačí'],
      },
      {
        id: `extra_${Date.now()}_2`,
        name: 'Uživatelská ergonomie & snadná údržba',
        category: 'Komfort',
        importance: 'preference',
        rationale: 'Snadné čištění, intuitivní obsluha a minimum starostí při běžném používání.',
        icon: '',
        suggestedComponent: 'chips',
        suggestedValues: ['Maximálně snadná údržba', 'Běžná údržba'],
      },
      {
        id: `extra_${Date.now()}_3`,
        name: 'Ekologická stopa & recyklovatelné materiály',
        category: 'Udržitelnost',
        importance: 'preference',
        rationale: 'Certifikované udržitelné materiály a nízký dopad na životní prostředí.',
        icon: '',
        suggestedComponent: 'chips',
        suggestedValues: ['Důraz na ekologii a recyklaci', 'Standardní provedení'],
      },
    ];
    setSuggestedPool((prev) => [...prev, ...extra.filter((e) => !prev.some((p) => p.id === e.id))]);
  };

  const handleCreateCustomWizard = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || isGenerating || isResearching) return;

    const effectiveSelectedParams = activeParameters.filter((p) => selectedParamIds.has(p.id));
    const finalParamsToUse = effectiveSelectedParams.length > 0 ? effectiveSelectedParams : activeParameters;

    const currentAnalysis = researchedAnalysis || discoverDomainParameters(query.trim(), locale);
    if (!researchedAnalysis) {
      setResearchedAnalysis(currentAnalysis);
    }

    // Instant Zero-Latency Launch: Compile agent directly from researched parameters (0 ms latency)
    if (currentAnalysis) {
      const finalAgent = buildCustomAgentFromParameters(
        currentAnalysis,
        finalParamsToUse.length > 0 ? finalParamsToUse : currentAnalysis.parameters,
        locale
      );

      if (finalAgent) {
        AgentStorageService.saveAgent(finalAgent);
        UserRAGHistoryService.saveUserSearchHistory("demo", {
          query: currentAnalysis?.categoryName || query,
          domainKey: currentAnalysis?.matchedDomain,
          selectedParameters: finalParamsToUse,
          generatedPrompt: finalAgent.systemPrompt,
        });
        setAgents(AgentStorageService.getAllAgents());
        setQuery('');
        onSelectAgent(finalAgent, false);
        return;
      }
    }

    // Fallback asynchronous generation if local compilation is unavailable
    setIsGenerating(true);
    setGenerationStep(locale === 'en' ? 'Assembling interactive wizard components...' : 'Sestavuji interaktivní komponenty wizardu...');

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
        throw new Error(locale === 'en' ? 'Wizard generation failed.' : 'Chyba při generování průvodce.');
      }

      const data = await res.json();
      const finalAgent = data.agent;

      if (finalAgent) {
        AgentStorageService.saveAgent(finalAgent);
        UserRAGHistoryService.saveUserSearchHistory("demo", {
          query: currentAnalysis?.categoryName || query,
          domainKey: currentAnalysis?.matchedDomain,
          selectedParameters: finalParamsToUse,
          generatedPrompt: finalAgent.systemPrompt,
        });
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
        alert(locale === 'en' ? 'Error generating shopping wizard. Please check your connection or API key.' : 'Chyba při generování nákupního průvodce. Zkontrolujte připojení k internetu nebo API klíč.');
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
    if (confirm(locale === 'en' ? 'Are you sure you want to delete all your agents?' : 'Opravdu chcete smazat všechny vaše agenty?')) {
      AgentStorageService.deleteAllAgents();
      setAgents([]);
    }
  };

  const handleMarkPurchased = (e: React.MouseEvent, agent: UniversalAgentDefinition) => {
    e.stopPropagation();
    AgentStorageService.markAgentAsPurchased(agent.id, true);
    setAgents(AgentStorageService.getAllAgents());
    setBmcModalAgent(agent);
  };

  const handleRestoreActive = (e: React.MouseEvent, agentId: string) => {
    e.stopPropagation();
    AgentStorageService.markAgentAsPurchased(agentId, false);
    setAgents(AgentStorageService.getAllAgents());
  };

  const activeAgents = agents.filter((a) => !a.isPurchased);
  const purchasedAgents = agents.filter((a) => Boolean(a.isPurchased));
  const displayedAgents = activeAgentsTab === 'active' ? activeAgents : purchasedAgents;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-10 py-6 animate-in fade-in duration-300">
      {/* Hero Search Box (PRD Step 1: User enters a free-text starting point) */}
      <div className={isMaterialCobalt ? 'rounded-2xl p-8 sm:p-12 border border-cyan-500/25 bg-[#091121]/90 shadow-xl relative text-center space-y-7' : 'rounded-3xl p-8 sm:p-12 border border-cyan-500/25 bg-[#091121]/90 shadow-xl relative text-center space-y-7 ring-1 ring-[#2563eb]/25'}>


        <div className="max-w-2xl mx-auto space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#242e4a] border border-cyan-500/25 text-cyan-400 text-xs font-mono font-bold shadow-sm">
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
        <form onSubmit={(e) => { e.preventDefault(); handleResearchParameters(); }} className="max-w-2xl mx-auto relative z-10">
          <div className="relative group">
            <div className="relative flex items-center h-14 sm:h-16 bg-[#091121]/90 rounded-xl border border-cyan-500/25 shadow-md overflow-hidden focus-within:border-[#60a5fa] transition-colors">
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
                className="w-full h-full pl-3.5 pr-32 sm:pr-40 bg-transparent text-white placeholder-slate-500 text-sm sm:text-base font-medium outline-none leading-normal caret-[#60a5fa] !border-none !border-0 !outline-none !shadow-none"
                style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
              />

              <button
                type="button"
                onClick={() => handleResearchParameters()}
                disabled={!query.trim() || isGenerating || isResearching}
                className="absolute right-2 px-5 sm:px-7 py-2.5 sm:py-3 rounded-lg bg-[#60a5fa] text-slate-950 text-xs sm:text-sm font-bold hover:brightness-110 shadow-md disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1.5 shrink-0 active:scale-95"
              >
                {isResearching ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                    <span>{t.launcher.btnResearching}</span>
                  </>
                ) : isGenerating ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                    <span>{t.launcher.btnBuilding}</span>
                  </>
                ) : (
                  <>
                    <span>{t.launcher.btnStart}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

          {/* Researching Animation Progress Card */}
          {isResearching && (
            <Card active className="p-6 text-center space-y-3 animate-pulse shadow-2xl">
              <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mx-auto" />
              <div>
                <h4 className="text-sm font-bold text-white font-mono flex items-center justify-center gap-2">
                  <span>{locale === 'en' ? 'AI conducting deep market research for:' : 'AI provádí hloubkový průzkum trhu pro:'}</span>
                  <span className="text-cyan-300 font-sans font-bold">{query.trim()}</span>
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xl mx-auto leading-relaxed">
                  {locale === 'en' ? 'Browsing expert reviews, community forums, and technical manufacturer specs to identify true decision criteria...' : 'Procházím odborné recenze, komunitní fóra a technické specifikace výrobců pro nalezení skutečných rozhodovacích parametrů...'}
                </p>
              </div>
            </Card>
          )}

          {/* Luke Research Error Card — no generic fallback, user must retry */}
          {researchError && !isResearching && (
            <Card error className="p-6 text-center space-y-4 shadow-2xl">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-950/80 border border-red-500/50 text-red-400 mx-auto">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-red-300 font-mono">
                  {locale === 'en' ? 'Parameter research failed' : 'Výzkum parametrů selhal'}
                </h4>
                <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
                  {researchError}
                </p>
              </div>
              <Button
                variant="danger"
                onClick={() => {
                  setResearchError(null);
                  if (lastFailedQuery) handleResearchParameters(lastFailedQuery);
                }}
                className="gap-2 font-mono text-xs"
              >
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                <span>Zkusit znovu</span>
              </Button>
            </Card>
          )}

      {/* Researched Domain Parameter Discovery & Interactive Tuner */}
      {researchedAnalysis && !isResearching && (
        <form onSubmit={handleCreateCustomWizard} className="rounded-2xl border border-cyan-500/25 bg-[#091121]/90 p-6 sm:p-8 text-left space-y-5 shadow-xl animate-in fade-in duration-300">
              <div className="flex items-center justify-between gap-3 border-b border-cyan-500/25 pb-3.5">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base sm:text-lg font-bold text-white tracking-tight">
                        {researchedAnalysis.categoryName}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 leading-normal">
                      {locale === 'en' ? 'Select parameters for intake questions, remove unneeded ones with (X).' : 'Vyberte parametry pro dotazník, nepotřebné odeberte křížkem (X).'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleResetParameters}
                    className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border border-cyan-500/25 hover:border-cyan-500/25 text-xs transition-colors cursor-pointer flex items-center justify-center shrink-0"
                    title={locale === "en" ? "Reset default parameters" : "Obnovit výchozí parametry"}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Active Parameters Grid with Selection Checkboxes & Dismiss (X) controls */}
              {activeParameters.length === 0 ? (
                <div className="p-6 rounded-xl bg-slate-950/60 border border-dashed border-slate-800 text-center space-y-2">
                  <Sliders className="w-6 h-6 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">{locale === "en" ? "You have removed all parameters." : "Odebrali jste všechny parametry."}</p>
                  <button
                    type="button"
                    onClick={handleResetParameters}
                    className="text-xs font-mono text-cyan-400 hover:underline cursor-pointer"
                  >
                    ↺ {locale === "en" ? "Reset default recommended parameters" : "Obnovit výchozí doporučené parametry"}
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
                            ? 'bg-slate-900/95 border-cyan-500/40 shadow-[0_0_15px_rgba(59,91,169,0.2)] ring-1 ring-[#2563eb]/30'
                            : 'bg-slate-950/60 border-slate-800/80 opacity-50 hover:opacity-75'
                        }`}
                      >
                        {/* Checkbox indicator */}
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 mt-1 transition-colors ${
                          isSelected
                            ? 'bg-cyan-500 border-cyan-500/40 text-slate-950 shadow-sm'
                            : 'bg-slate-900 border-slate-700 text-transparent'
                        }`}>
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>

                        <div className="min-w-0 flex-1 pr-7">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-sm sm:text-base font-extrabold tracking-tight leading-snug line-clamp-1 break-words ${isSelected ? 'text-slate-100 group-hover:text-cyan-300' : 'text-slate-400'}`}>
                              {formatConciseParameterName(param.name)}
                            </span>
                            {param.id.startsWith('learned-') && !param.id.startsWith('custom_') && (
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-500/40 font-bold flex items-center gap-1">
                                {locale === "en" ? "Community learned" : "Naučeno komunitou"}
                              </span>
                            )}
                            {(param.id.startsWith('custom_') || param.category === 'Custom' || param.category === 'Vlastní') && (
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#091121]/90 text-cyan-400 border border-cyan-500/25 font-bold">
                                {locale === "en" ? "Custom" : "Vlastní"}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 font-normal leading-relaxed mt-0.5 line-clamp-2">
                            {formatShortDescription(param.rationale, locale)}
                          </p>
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
                          aria-label={`Odebrat parametr ${formatConciseParameterName(param.name)}`}
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
                    className="group relative p-3 rounded-xl border-2 border-dashed border-cyan-500/40 hover:border-[#60a5fa] bg-gradient-to-br from-[#121e3d] to-[#242e4a] hover:bg-[#242e4a] transition-all flex items-center justify-center gap-3 text-cyan-300 hover:text-white cursor-pointer shadow-sm hover:shadow-[0_0_20px_rgba(59,91,169,0.25)] min-h-[62px]"
                    title={locale === "en" ? "Click to add custom criterion" : "Klikněte pro přidání vlastního kritéria"}
                  >
                    <div className="w-7 h-7 rounded-lg bg-cyan-950/40 border border-cyan-500/40 group-hover:bg-cyan-500 group-hover:text-slate-950 flex items-center justify-center text-cyan-300 transition-all shadow-sm shrink-0">
                      <Plus className="w-4 h-4 stroke-[3]" />
                    </div>
                    <div className="text-left min-w-0">
                      <div className="text-xs font-bold font-mono tracking-tight text-cyan-300 group-hover:text-white flex items-center gap-1.5">
                        <span>+ {locale === "en" ? "Add another parameter" : "Přidat další parametr"}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 group-hover:text-[#eff6ff]/80">
                        {locale === "en" ? "Custom criterion or specific feature" : "Vlastní kritérium nebo specifická výbava"}
                      </div>
                    </div>
                  </button>
                </div>
              )}

              {/* Parameter Customizer Controls: Prominent Glowing Studio Card */}
              <div id="custom-param-adder-section" className="p-5 sm:p-6 rounded-2xl bg-[#091121]/90 border border-cyan-500/25 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyan-500/25 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-cyan-950/40 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-[0_0_12px_rgba(59,91,169,0.3)] shrink-0">
                      <Plus className="w-4 h-4 stroke-[3]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="text-xs sm:text-sm font-extrabold text-white tracking-tight">
                          {locale === "en" ? "Missing a criterion here? Add your own parameter" : "Chybí vám zde nějaké kritérium? Přidejte si vlastní parametr"}
                        </h5>
                        
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {locale === "en" ? "Type any parameter that is key for you, or click suggestions below." : "Napište libovolný parametr, který je pro vás klíčový, nebo klikněte na návrhy níže."}
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
                      placeholder={locale === "en" ? "Add custom parameter (e.g. Tow hitch, Panoramic roof, Noise level)..." : "Přidat vlastní parametr (např. Tažné zařízení, Prosklená střecha, Hlučnost)..."}
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950/90 border-2 border-cyan-500/25 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#60a5fa] focus:ring-4 focus:ring-[#2563eb]/30 font-mono transition-all shadow-inner"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCustomParameter}
                    disabled={!customParamInput.trim()}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-[#3b82f6] text-white font-bold text-xs sm:text-sm hover:brightness-110 shadow-[0_0_18px_rgba(59,91,169,0.35)] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>{locale === "en" ? "Add parameter" : "Přidat parametr"}</span>
                  </button>
                </div>

                {/* Learned Parameter Notification Banner */}
                {learnedNotice && (
                  <div className="p-2.5 rounded-xl bg-purple-950/80 border border-purple-500/40 text-xs text-purple-200 flex items-center gap-2 shadow-sm animate-in fade-in duration-300">
                    
                    <span className="font-mono text-[11px]">{learnedNotice}</span>
                  </div>
                )}

                {/* Available Suggestions Pool */}
                {suggestedPool.length > 0 && (
                  <div className="space-y-2 pt-1 border-t border-cyan-500/25">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-slate-300 font-bold flex items-center gap-1.5">
                        
                        <span>{locale === "en" ? "Quick suggestions from reviews & forums (click to add):" : "Rychlé návrhy z testů a fór (klikněte pro okamžité zařazení):"}</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleSuggestMore}
                        className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer hover:underline"
                      >
                        <Dices className="w-3 h-3" />
                        <span>{locale === "en" ? "Suggest more" : "Navrhnout další"}</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {suggestedPool.map((sParam) => (
                        <button
                          key={sParam.id}
                          type="button"
                          onClick={() => handleAddSuggestedParameter(sParam)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-[#091121]/90 text-slate-300 hover:text-[#eff6ff] border border-slate-700/80 hover:border-cyan-500/40 text-xs font-mono transition-all cursor-pointer group shadow-sm hover:shadow-[0_0_10px_rgba(59,91,169,0.2)]"
                          title={sParam.rationale}
                        >
                          <Plus className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-125 transition-transform" />
                          <span className="font-medium">{sParam.icon ? `${sParam.icon} ` : ''}{sParam.name}</span>
                          {sParam.id.startsWith('learned-') && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-500/40 ml-0.5">
                              {locale === "en" ? "Community" : "Komunitní"}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Action Bar: Clean Parameter Counter & Direct Action CTA */}
              <div className="pt-3 border-t border-cyan-500/25 flex flex-col sm:flex-row items-center justify-between gap-3">
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
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#60a5fa] hover:bg-[#c6d7ff] text-slate-950 text-xs sm:text-sm font-extrabold shadow-lg hover:shadow-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                      <span>{locale === "en" ? "Assembling wizard..." : "Sestavuji průvodce..."}</span>
                    </>
                  ) : (
                    <>
                      <span>{locale === "en" ? "Set target values" : "Nastavit cílové hodnoty"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
        </form>
      )}

      {/* Dynamic Loading Step Indicator */}
      {isGenerating && (
        <div className="mt-3 flex items-center justify-center gap-2 text-xs font-mono text-cyan-300 animate-pulse">
          
          <span>{generationStep}</span>
        </div>
      )}

      {/* User Custom Agents Library Grid */}
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
                {locale === 'en' ? 'Your saved shopping advisor configurations.' : 'Uložené konfigurace vašich nákupních rádců.'}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center p-1 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setActiveAgentsTab('active')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer font-bold ${
                    activeAgentsTab === 'active'
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.launcher.tabActiveMissions} ({activeAgents.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveAgentsTab('purchased')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer font-bold ${
                    activeAgentsTab === 'purchased'
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.launcher.tabPurchasedHistory} ({purchasedAgents.length})
                </button>
              </div>

              {activeAgentsTab === 'active' && activeAgents.length > 0 && (
                <button
                  type="button"
                  onClick={handleDeleteAllAgents}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-950/80 text-rose-300 border border-rose-500/30 hover:border-rose-400 text-xs font-mono transition-all cursor-pointer"
                  title={locale === 'en' ? 'Delete all agents from library' : 'Smazat všechny agenty z knihovny'}
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>{locale === 'en' ? 'Delete all' : 'Smazat všechny agenty'}</span>
                </button>
              )}
            </div>
          </div>

          {displayedAgents.length === 0 && activeAgentsTab === 'purchased' && (
            <div className="p-8 text-center rounded-3xl bg-[#060c18] border border-cyan-500/20 space-y-2">
              <h3 className="text-sm font-bold text-slate-200">{t.launcher.emptyPurchasedTitle}</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">{t.launcher.emptyPurchasedDesc}</p>
            </div>
          )}

          {displayedAgents.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {displayedAgents.map((rawAgent) => {
                const agent = getLocalizedAgent(rawAgent, locale) || rawAgent;
                return (
                  <div
                    key={agent.id}
                    onClick={() => onSelectAgent(agent, true)}
                    className="group p-5 rounded-3xl bg-[#060c18] border border-cyan-500/25 hover:border-cyan-500/40 shadow-md hover:shadow-[#121e3d]/40 transition-all cursor-pointer flex flex-col justify-between space-y-4 relative overflow-hidden"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
                          {agent.questions.length} {locale === 'en' ? 'questions' : 'otázek'}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {activeAgentsTab === 'active' ? (
                            <button
                              type="button"
                              onClick={(e) => handleMarkPurchased(e, rawAgent)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-400 hover:bg-emerald-950/40 border border-transparent hover:border-emerald-500/30 transition-all cursor-pointer"
                              title={locale === 'en' ? 'Mark as Purchased (Move to History & Support)' : 'Označit jako zakoupené (Přesunout do historie)'}
                              aria-label={`${locale === 'en' ? 'Mark as purchased' : 'Označit jako zakoupené'} ${agent.name}`}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => handleRestoreActive(e, rawAgent.id)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-400 hover:bg-cyan-950/40 border border-transparent hover:border-cyan-500/30 transition-all cursor-pointer"
                              title={locale === 'en' ? 'Restore back to active missions' : 'Vrátit zpět mezi aktivní nákupy'}
                              aria-label={`${locale === 'en' ? 'Restore agent' : 'Obnovit agenta'} ${agent.name}`}
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={(e) => handleDeleteAgent(e, rawAgent.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-500/30 transition-all cursor-pointer"
                            title={locale === 'en' ? 'Remove from library' : 'Smazat agenta z knihovny'}
                            aria-label={`${locale === 'en' ? 'Delete agent' : 'Smazat agenta'} ${agent.name}`}
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
                        {rawAgent.isPurchased ? (
                          <span className="text-cyan-400/90 font-bold">
                            {t.launcher.purchasedBadge}
                            {rawAgent.purchasedAt ? ` • ${new Date(rawAgent.purchasedAt).toLocaleDateString(locale === 'en' ? 'en-US' : 'cs-CZ')}` : ''}
                          </span>
                        ) : (
                          locale === 'en' ? 'Custom agent' : 'Vlastní agent'
                        )}
                      </span>

                      <span className="flex items-center gap-1 text-cyan-400 font-bold group-hover:translate-x-1 transition-transform">
                        <span>{locale === 'en' ? 'Launch' : 'Spustit'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Buy Me a Coffee Modal */}
      <BuyMeACoffeeModal
        isOpen={Boolean(bmcModalAgent)}
        onClose={() => setBmcModalAgent(null)}
        agent={bmcModalAgent}
        locale={locale}
      />
      {toastMessage && (
        <Toast
          type={toastType}
          message={toastMessage}
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
};

export function formatShortDescription(rationale: string, locale: string = "en"): string {
  if (!rationale) return '';
  let clean = rationale.split(/Otázka pro vás:/i)[0].trim();
  if (locale === "en") {
    const popMatch = clean.match(/Populární parametr požadovaný uživateli při nákupu v kategorii (.+)/i);
    if (popMatch) {
      clean = `Popular parameter requested by users when purchasing in category ${popMatch[1]}.`;
    }
  }
  const firstSentence = clean.split(/[.!?]/)[0].trim();
  if (firstSentence.length > 110) {
    return firstSentence.slice(0, 107) + '...';
  }
  return firstSentence ? firstSentence + '.' : clean.slice(0, 110);
}

export function formatConciseParameterName(name: string): string {
  if (!name) return '';
  if (name.length <= 22) return name;
  const shortMap: Record<string, string> = {
    'Servisní dostupnost & náhradní díly v ČR': 'Servisní podpora',
    'Rozlišení a kvalita snímače fotoaparátu': 'Fotoaparát',
    'Rozlišení a vlastnosti fotoaparátu': 'Fotoaparát',
    'Kapacita a vnitřní objem': 'Kapacita',
    'Hlučnost a úroveň vibrací': 'Hlučnost',
    'Spotřeba energie a vody': 'Spotřeba',
    'Typ displeje a obnovovací frekvence': 'Displej',
    'Výdrž baterie a nabíjení': 'Baterie',
  };
  if (shortMap[name]) return shortMap[name];
  return name.slice(0, 18) + '...';
}
