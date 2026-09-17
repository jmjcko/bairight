'use client';


import React, { useState, useEffect, useRef } from 'react';
import { AgentChatMessage } from '@/lib/agent/types';
import { ToolExecutionBadge } from '@/components/ToolExecutionBadge';
import { Logo } from '@/components/Logo';
import { UserProfileCapsule } from '@/components/UserProfileCapsule';
import { HeaderEngineSwitcher } from '@/components/HeaderEngineSwitcher';
import { AIEngineSubscriptionModal } from '@/components/AIEngineSubscriptionModal';
import { UserRAGMemoryModal } from '@/components/UserRAGMemoryModal';
import { AgentCategoryLauncher } from '@/components/AgentCategoryLauncher';
import { DynamicAgentWizard } from '@/components/DynamicAgentWizard';
import { ColorPaletteModal } from '@/components/ColorPaletteModal';
import { UniversalAgentPromptModal } from '@/components/UniversalAgentPromptModal';
import { 
  UniversalAgentDefinition 
} from '@/lib/agent/universal-agent-schema';
import { AgentStorageService } from '@/lib/agent/agent-storage-service';
import { 
  AIProviderId, 
  SUPPORTED_AI_PROVIDERS, 
  PersistentMemoryFact, 
  INITIAL_USER_FACTS,
  CompletedAssessmentRecord,
  INITIAL_ASSESSMENT_RECORDS
} from '@/lib/agent/engine-config';
import { useI18n } from '@/lib/i18n/I18nContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  Database, 
  MessageSquare,
  ArrowLeft,
  Compass,
  CheckCircle2,
  Sliders,
  Type,
  Lock,
  Key,
  ShieldCheck,
  Zap,
  Plus
} from 'lucide-react';

export type AppTab = 'wizard' | 'chat';

const INITIAL_GREETING: AgentChatMessage = {
  id: 'greeting-1',
  role: 'assistant',
  content: `### 🤖 Vítejte v bAIright: Váš univerzální nákupní rádce & prompt inženýr

Jsem váš nezávislý nákupní expert poháněný umělou inteligencí s kontextovou RAG pamětí.
Pomohu vám vybrat jakýkoliv produkt na základě vašich technických, ergonomických a cenových požadavků:

- 🚗 **Automobily & rodinné vozy** (motorizace, prostor, provozní náklady)
- 👟 **Sportovní & zdravotní obuv** (biomechanika, došlap, šířka kopyta, tlumení)
- ☕ **Kávovary & příprava kávy** (espresso, mléčný systém, mlecí kameny)
- 🪑 **Ergonomické sezení & židle** (ochrana páteře, mechanika, područky)
- 🎯 **Jakákoliv další kategorie na míru**

Zadejte své požadavky nebo vyberte agenta výše pro spuštění interaktivního průvodce.`,
  timestamp: new Date().toISOString(),
};

const SUGGESTED_PROMPTS = [
  {
    label: '🚗 Rodinné SUV / kombi do 650 tis. Kč',
    text: 'Hledám spolehlivé rodinné auto do 650 000 Kč s velkým kufrem, pohonem 4x4 a nízkou spotřebou.',
  },
  {
    label: '👟 Běžecké boty na asfalt pro širší chodidlo',
    text: 'Potřebuji běžecké boty na silnici s dobrým tlumením mezipodešve a širším kopytem.',
  },
  {
    label: '☕ Automatický kávovar na espresso a cappuccino',
    text: 'Doporuč tichý kávovar s jednoduchou údržbou a kvalitním mléčným systémem do 18 000 Kč.',
  },
  {
    label: '🪑 Ergonomická židle pro celodenní home office',
    text: 'Jakou kancelářskou židli zvolit při 8+ hodinách sezení denně pro prevenci bolestí beder?',
  },
];

export default function Home() {
  const { t, locale } = useI18n();
  const [activeTab, setActiveTab] = useState<AppTab>('wizard');
  const [sessionId, setSessionId] = useState<string>('');
  const [messages, setMessages] = useState<AgentChatMessage[]>([INITIAL_GREETING]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Modals & Controls State
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [isPaletteModalOpen, setIsPaletteModalOpen] = useState(false);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [activeFontId, setActiveFontId] = useState<string>('space-grotesk');

  // Universal Agent & BYOK State
  const [selectedAgent, setSelectedAgent] = useState<UniversalAgentDefinition | null>(null);
  const [storedAgents, setStoredAgents] = useState<UniversalAgentDefinition[]>([]);
  const [wizardMode, setWizardMode] = useState<'launcher' | 'active_agent'>('launcher');
  const [activeProviderId, setActiveProviderId] = useState<AIProviderId>('google_gemini');
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [userFacts, setUserFacts] = useState<PersistentMemoryFact[]>([]);
  const [assessments, setAssessments] = useState<CompletedAssessmentRecord[]>([]);
  const [demoRunsRemaining, setDemoRunsRemaining] = useState<number>(3);
  const [wizardInitialShowResult, setWizardInitialShowResult] = useState<boolean>(false);

  const activeProvider = SUPPORTED_AI_PROVIDERS.find((p) => p.id === activeProviderId) || SUPPORTED_AI_PROVIDERS[0];
  const activeFactsCount = userFacts.filter((f) => f.isEnriched).length;
  const hasActiveSubscription = Boolean(
    apiKeys['google_gemini']?.trim() ||
    apiKeys['openai_gpt4o']?.trim() ||
    apiKeys['anthropic_claude']?.trim() ||
    (apiKeys[activeProviderId]?.trim())
  );

  // Load persisted font preference, theme, assessments, BYOK keys, saved agents & facts from localStorage
  useEffect(() => {
    const storedFont = localStorage.getItem('bairight_active_font') || 'space-grotesk';
    setActiveFontId(storedFont);
    document.documentElement.setAttribute('data-font', storedFont);

    const storedTheme = localStorage.getItem('bairight_active_theme') || 'pixel-mint';
    document.documentElement.setAttribute('data-theme', storedTheme);

    // 1. Clean legacy mock facts and load actual user facts
    const storedFacts = localStorage.getItem('bairight_user_facts');
    if (storedFacts) {
      try {
        const parsed = JSON.parse(storedFacts);
        if (Array.isArray(parsed)) {
          // Filter out legacy mock facts (fact-1, fact-2, fact-3, fact-4)
          const filtered = parsed.filter((f: any) => !['fact-1', 'fact-2', 'fact-3', 'fact-4'].includes(f.id));
          setUserFacts(filtered);
          localStorage.setItem('bairight_user_facts', JSON.stringify(filtered));
        } else {
          setUserFacts([]);
        }
      } catch (e) {
        console.error('Failed to parse stored facts:', e);
        setUserFacts([]);
      }
    } else {
      setUserFacts([]);
      localStorage.setItem('bairight_user_facts', JSON.stringify([]));
    }

    // 2. Clean legacy mock assessments
    const storedAssessments = localStorage.getItem('bairight_assessments');
    if (storedAssessments) {
      try {
        const parsed = JSON.parse(storedAssessments);
        if (Array.isArray(parsed)) {
          // Filter out legacy mock assessment-rec-1
          const filtered = parsed.filter((a: any) => a.id !== 'assessment-rec-1');
          setAssessments(filtered);
          localStorage.setItem('bairight_assessments', JSON.stringify(filtered));
        } else {
          setAssessments([]);
        }
      } catch (e) {
        console.error('Failed to parse stored assessments:', e);
        setAssessments([]);
      }
    } else {
      setAssessments([]);
      localStorage.setItem('bairight_assessments', JSON.stringify([]));
    }

    // 3. Load user's actual stored custom agents (strictly from account)
    const userStoredAgents = AgentStorageService.getAllAgents();
    setStoredAgents(userStoredAgents);
    if (selectedAgent && !userStoredAgents.some((a) => a.id === selectedAgent.id)) {
      setSelectedAgent(null);
    }

    const storedProvider = localStorage.getItem('bairight_active_provider');
    if (storedProvider) {
      setActiveProviderId(storedProvider as AIProviderId);
    }

    const storedKeys = localStorage.getItem('bairight_api_keys');
    if (storedKeys) {
      try {
        setApiKeys(JSON.parse(storedKeys));
      } catch (e) {
        console.error('Failed to parse stored API keys:', e);
      }
    }

    const sid = localStorage.getItem('bairight_session_id') || `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    localStorage.setItem('bairight_session_id', sid);
    setSessionId(sid);
  }, []);

  const handleSelectFont = (fontId: string) => {
    setActiveFontId(fontId);
    document.documentElement.setAttribute('data-font', fontId);
    localStorage.setItem('bairight_active_font', fontId);
  };

  const handleToggleFact = (factId: string) => {
    setUserFacts((prev) => {
      const updated = prev.map((f) => (f.id === factId ? { ...f, isEnriched: !f.isEnriched } : f));
      localStorage.setItem('bairight_user_facts', JSON.stringify(updated));
      return updated;
    });
  };

  const handleAddFact = (
    label: string,
    value: string,
    category: 'biometrics' | 'medical' | 'preference' | 'history'
  ) => {
    const newFact: PersistentMemoryFact = {
      id: `fact-${Date.now()}`,
      label,
      value,
      category,
      source: 'Uživatelský záznam',
      updatedAt: new Date().toLocaleDateString('cs-CZ'),
      isEnriched: true,
    };
    setUserFacts((prev) => {
      const updated = [newFact, ...prev];
      localStorage.setItem('bairight_user_facts', JSON.stringify(updated));
      return updated;
    });
  };

  const handleDeleteFact = (factId: string) => {
    setUserFacts((prev) => {
      const updated = prev.filter((f) => f.id !== factId);
      localStorage.setItem('bairight_user_facts', JSON.stringify(updated));
      return updated;
    });
  };

  const handleDeleteAssessment = (assessmentId: string) => {
    setAssessments((prev) => {
      const updated = prev.filter((a) => a.id !== assessmentId);
      localStorage.setItem('bairight_assessments', JSON.stringify(updated));
      return updated;
    });
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const message = textToSend || inputValue.trim();
    if (!message || isLoading) return;

    if (!textToSend) {
      setInputValue('');
    }

    const userMessage: AgentChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId || 'default-session',
          message,
          agent: selectedAgent,
          history: [...messages, userMessage].slice(-8),
          ragFacts: userFacts.filter((f) => f.isEnriched),
          providerId: activeProviderId,
          apiKey: apiKeys[activeProviderId],
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Došlo k chybě při spojení s AI konzultantem. Zkontrolujte prosím své připojení nebo API klíč a zkuste to znovu.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoHome = () => {
    setActiveTab('wizard');
    setWizardMode('launcher');
    setSelectedAgent(null);
    setWizardInitialShowResult(false);
  };

  return (
    <div className="flex h-screen flex-col bg-[#070d18] text-slate-100 overflow-hidden font-sans bio-grid-pattern">
      {/* Top Navbar: Clean Executive Header */}
      <header className="h-16 border-b border-cyan-500/20 bg-[#0B121E]/95 backdrop-blur-xl px-4 sm:px-8 flex items-center justify-between shrink-0 z-20 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        {/* Left: Brand Logo & Navigation */}
        <div className="flex items-center gap-6 shrink-0">
          <Logo size="md" onClick={handleGoHome} />

          {/* Clean Top Navigation Tabs */}
          <div className="hidden sm:flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setActiveTab('wizard')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeTab === 'wizard'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.header.wizardTab}
            </button>
            <button
              onClick={() => {
                setActiveTab('chat');
                const userStoredAgents = AgentStorageService.getAllAgents();
                setStoredAgents(userStoredAgents);
                if (selectedAgent && !userStoredAgents.some((a) => a.id === selectedAgent.id)) {
                  setSelectedAgent(null);
                }
              }}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'chat'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{t.header.chatTab}</span>
              {selectedAgent ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-900/60 text-cyan-300 font-mono font-medium hidden md:inline">
                  {selectedAgent.name}
                </span>
              ) : null}
            </button>
          </div>
        </div>

        {/* Right: User Profile & Customization Capsules */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <HeaderEngineSwitcher
            activeProviderId={activeProviderId}
            onSelectProvider={(pId: AIProviderId) => {
              setActiveProviderId(pId);
              localStorage.setItem("bairight_active_provider", pId);
            }}
            onOpenVaultModal={() => setIsSubscriptionModalOpen(true)}
            currentApiKeys={apiKeys}
          />
          <LanguageSwitcher />
          <UserProfileCapsule
            userName="Jan Mynář"
            demoRunsRemaining={demoRunsRemaining}
            activeProvider={activeProvider}
            onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
            onOpenMemoryModal={() => setIsMemoryModalOpen(true)}
          />
        </div>
      </header>

      {/* Main Workspace: Wizard or Chat */}
      {activeTab === 'wizard' && (
        <div className="flex-1 overflow-y-auto bg-[var(--background)] p-3 sm:p-6">
          {wizardMode === 'launcher' || !selectedAgent ? (
            <AgentCategoryLauncher
              userName="Jan Mynář"
              currentAgent={selectedAgent}
              onSelectAgent={(agent, initialShowResult = false) => {
                setSelectedAgent(agent);
                setWizardMode('active_agent');
                setWizardInitialShowResult(initialShowResult);
              }}
              activeProviderId={activeProviderId}
              currentApiKeys={apiKeys}
            />
          ) : (
            <DynamicAgentWizard
              key={selectedAgent.id}
              agent={selectedAgent}
              onBackToLauncher={() => setWizardMode('launcher')}
              activeProviderId={activeProviderId}
              currentApiKeys={apiKeys}
              userFacts={userFacts}
              onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
              initialShowResult={wizardInitialShowResult}
              onAssessmentCompleted={(answers, evalRes, completedPrompt) => {
                const now = new Date();
                const dateFormatted = `${now.toLocaleDateString('cs-CZ')}, ${now.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}`;
                const newRecord: CompletedAssessmentRecord = {
                  id: `universal-rec-${Date.now()}`,
                  missionId: selectedAgent.id,
                  missionName: selectedAgent.name,
                  dateFormatted,
                  timestamp: now.toISOString(),
                  doctorAgentName: `${selectedAgent.name} v${selectedAgent.version || '1.0'}`,
                  diagnosisSummary: `Doporučení pro kategorii ${selectedAgent.category}: ${(evalRes?.recommendations || []).map((r: any) => r.model).join(', ')}`,
                  keyParameters: answers,
                  recommendedModels: (evalRes?.recommendations || []).map((r: any, idx: number) => ({
                    id: `rec-${idx}`,
                    brand: r.brand,
                    model: r.model,
                    badge: `Shoda ${r.matchScore}%`,
                    matchScore: r.matchScore,
                    priceCzk: 0,
                    rationale: r.reasoning,
                  })),
                  clinicalReport: evalRes?.summaryAssessment || 'Doporučení úspěšně vygenerováno expertním agentem.',
                  status: 'active_prescription',
                  completedPrompt,
                };
                setAssessments((prev) => {
                  const updated = [newRecord, ...prev];
                  localStorage.setItem('bairight_assessments', JSON.stringify(updated));
                  return updated;
                });
              }}
            />
          )}
        </div>
      )}

      {/* Universal Consultative Chat Tab — Gated by Subscription (BYOK) */}
      {activeTab === 'chat' && (
        <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
          {/* Left: Agent Selection & Context Sidebar */}
          <aside className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-slate-800 bg-[#08101e]/90 p-4 space-y-4 overflow-y-auto shrink-0">
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center justify-between">
                <span>Aktivní agent pro diskusi</span>
                {selectedAgent && (
                  <button
                    onClick={() => setSelectedAgent(null)}
                    className="text-[10px] text-cyan-400 hover:underline cursor-pointer lowercase"
                  >
                    změnit
                  </button>
                )}
              </span>

              {selectedAgent ? (
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-cyan-500/30 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xl p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                      {selectedAgent.icon || '🤖'}
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-white truncate">{selectedAgent.name}</h3>
                      <span className="text-[10px] font-mono text-cyan-400">{selectedAgent.category}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {selectedAgent.description}
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <span className="text-xs font-semibold text-slate-300 block">
                    Uložení agenti na vašem účtu:
                  </span>
                  {storedAgents.length > 0 ? (
                    <div className="space-y-1.5">
                      {storedAgents.map((ag) => (
                        <button
                          key={ag.id}
                          onClick={() => setSelectedAgent(ag)}
                          className="w-full p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left flex items-center gap-2.5 text-xs transition-all cursor-pointer group"
                        >
                          <span className="text-base">{ag.icon || '🤖'}</span>
                          <div className="min-w-0 flex-1">
                            <span className="text-slate-200 group-hover:text-white font-medium truncate block">{ag.name}</span>
                            <span className="text-[10px] text-slate-500 truncate block">{ag.category}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 px-2 space-y-2.5 bg-[#070e1a]/80 rounded-xl border border-slate-800/80">
                      <Bot className="w-6 h-6 text-slate-600 mx-auto" />
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Na svém účtu zatím nemáte uloženého žádného nákupního agenta.
                      </p>
                      <button
                        onClick={() => {
                          setActiveTab('wizard');
                          setWizardMode('launcher');
                        }}
                        className="w-full py-1.5 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Vytvořit agenta v průvodci</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Subscription & Model Status Badge */}
            <div className={`p-3 rounded-2xl border space-y-2 ${
              hasActiveSubscription
                ? 'bg-emerald-950/20 border-emerald-500/30'
                : 'bg-amber-950/20 border-amber-500/30'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-mono font-bold flex items-center gap-1.5 ${
                  hasActiveSubscription ? 'text-emerald-300' : 'text-amber-300'
                }`}>
                  {hasActiveSubscription ? (
                    <>
                      <Zap className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Model propojen</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Model nepropojen</span>
                    </>
                  )}
                </span>
                <button
                  onClick={() => setIsSubscriptionModalOpen(true)}
                  className={`text-[10px] font-mono hover:underline cursor-pointer ${
                    hasActiveSubscription ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {hasActiveSubscription ? 'Nastavení' : 'Propojit'}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                {hasActiveSubscription
                  ? `Aktivní: ${activeProvider.name}. Živá diskuse běží přes vaše předplatné.`
                  : 'Pro diskusi je vyžadováno propojení s vaším modelem (BYOK).'}
              </p>
            </div>

            {/* RAG Memory Snapshot */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-cyan-300 font-bold flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5" />
                  RAG paměť
                </span>
                <button
                  onClick={() => setIsMemoryModalOpen(true)}
                  className="text-[10px] font-mono text-cyan-400 hover:underline cursor-pointer"
                >
                  Spravovat
                </button>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Zapojeno <strong>{activeFactsCount}</strong> preferenčních faktů do systémového kontextu.
              </p>
            </div>

            {/* Quick Agent Actions */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  setWizardMode(selectedAgent ? 'active_agent' : 'launcher');
                  setActiveTab('wizard');
                }}
                className="w-full py-2 px-3 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Otevřít průvodce výběrem</span>
              </button>
            </div>
          </aside>

          {/* Right: Conversational Stream or Subscription Lock View */}
          <main className="flex-1 flex flex-col justify-between overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
            {!hasActiveSubscription ? (
              /* Subscription Paywall Screen */
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-200 overflow-y-auto">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600/20 via-teal-500/20 to-cyan-400/10 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-xl shadow-cyan-950/60">
                  <Lock className="w-8 h-8 text-cyan-400" />
                </div>

                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 font-mono text-[11px] font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Diskuse s agentem • Vyžaduje vlastní model (BYOK)</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                    Propojte své AI předplatné pro živou diskusi
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
                    Abychom neplýtvali tokeny na obecné dotazy, živá konverzace a ladění probíhá přímo přes vaše vlastní AI předplatné (Google Gemini, OpenAI ChatGPT, Anthropic Claude). Agent využije vaši RAG paměť a vaše data zůstanou v bezpečí.
                  </p>
                </div>

                {/* Current Agent Info Card */}
                <div className="w-full p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-left flex items-center gap-3 shadow-md">
                  <div className="text-2xl p-2.5 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
                    {selectedAgent?.icon || '👟'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white truncate">
                        {selectedAgent?.name || 'Luke (Běžecká & zdravotní obuv)'}
                      </h4>
                      <span className="text-[10px] font-mono text-cyan-400 font-bold px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/30">
                        {selectedAgent?.category || 'Sport & Lifestyle'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                      {selectedAgent?.description || 'Biomechanický nákupčí obuvi a konzultant'}
                    </p>
                  </div>
                </div>

                {/* Benefits Badges */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full text-left">
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <Zap className="w-4 h-4 text-amber-400 mb-1" />
                    <span className="text-xs font-bold text-slate-200 block">Vlastní tokeny</span>
                    <span className="text-[10px] text-slate-500 leading-tight">Neomezená diskuse bez kreditových stropů.</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <Database className="w-4 h-4 text-cyan-400 mb-1" />
                    <span className="text-xs font-bold text-slate-200 block">RAG kontext</span>
                    <span className="text-[10px] text-slate-500 leading-tight">Agent zná vaše uložená biometrická fakta.</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <ShieldCheck className="w-4 h-4 text-teal-400 mb-1" />
                    <span className="text-xs font-bold text-slate-200 block">100% soukromí</span>
                    <span className="text-[10px] text-slate-500 leading-tight">Klíč se ukládá pouze ve vašem prohlížeči.</span>
                  </div>
                </div>

                {/* CTA Actions */}
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full pt-1">
                  <button
                    onClick={() => setIsSubscriptionModalOpen(true)}
                    className="w-full sm:flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:brightness-110 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-950/60 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Key className="w-4 h-4" />
                    <span>Propojit vlastní model / předplatné</span>
                  </button>

                  <button
                    onClick={() => {
                      setWizardMode(selectedAgent ? 'active_agent' : 'launcher');
                      setActiveTab('wizard');
                    }}
                    className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-mono font-medium transition-all cursor-pointer"
                  >
                    Otevřít průvodce nákupem
                  </button>
                </div>
              </div>
            ) : (
              /* Unlocked Chat Stream */
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                {/* Active Model & Agent Banner */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-slate-200 font-medium">
                      Diskuse s agentem <strong>{selectedAgent?.name || 'Všeobecný nákupní poradce'}</strong> aktivní
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-900/60 text-cyan-300 border border-cyan-500/30">
                      {activeProvider.name}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsSubscriptionModalOpen(true)}
                    className="text-[10px] font-mono text-cyan-400 hover:underline cursor-pointer"
                  >
                    Změnit model
                  </button>
                </div>

                {messages.map((msg) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 max-w-4xl ${isUser ? 'ml-auto justify-end' : 'mr-auto justify-start'}`}
                    >
                      {!isUser && (
                        <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 flex items-center justify-center shrink-0 mt-1">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}

                      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[85%]`}>
                        <div
                          className={`p-4 sm:p-5 rounded-2xl text-sm leading-relaxed ${
                            isUser
                              ? 'bg-cyan-600 text-white rounded-tr-none shadow-md shadow-cyan-950/40'
                              : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none shadow-sm'
                          }`}
                        >
                          {!isUser && activeFactsCount > 0 && (
                            <div 
                              onClick={() => setIsMemoryModalOpen(true)}
                              className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-300 bg-cyan-950/70 border border-cyan-500/30 px-2.5 py-1 rounded-full w-fit mb-3 shadow-sm hover:border-cyan-400/60 cursor-pointer transition-all"
                              title="Klikněte pro zobrazení a správu RAG faktů z databáze"
                            >
                              <Database className="w-3 h-3 text-cyan-400" />
                              <span>RAG paměť: Obohaceno o {activeFactsCount} preferenčních faktů</span>
                            </div>
                          )}

                          <div className="prose prose-invert prose-sm max-w-none space-y-3">
                            {msg.content.split('\n\n').map((paragraph, idx) => {
                              if (paragraph.startsWith('### ')) {
                                return <h3 key={idx} className="text-base font-bold text-white mt-2 mb-1">{paragraph.replace('### ', '')}</h3>;
                              }
                              if (paragraph.startsWith('> ')) {
                                return (
                                  <blockquote key={idx} className="p-3 my-2 border-l-4 border-cyan-500 bg-cyan-950/30 rounded text-cyan-200 text-xs">
                                    {paragraph.replace('> ', '')}
                                  </blockquote>
                                );
                              }
                              return <p key={idx} className="whitespace-pre-line">{paragraph}</p>;
                            })}
                          </div>

                          {/* Tool Call Badges */}
                          {msg.toolCalls && msg.toolCalls.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                                Provedené nástroje agenta
                              </span>
                              {msg.toolCalls.map((tc) => (
                                <ToolExecutionBadge
                                  key={tc.id}
                                  toolName={tc.toolName}
                                  status={tc.status}
                                  args={tc.args}
                                />
                              ))}
                            </div>
                          )}
                        </div>

                        <span className="text-[10px] text-slate-500 mt-1 px-1">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {isUser && (
                        <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center shrink-0 mt-1">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {isLoading && (
                  <div className="flex gap-3 items-center text-xs text-slate-400">
                    <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 animate-pulse" />
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-slate-900 border border-slate-800 rounded-xl">
                      <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      <span className="ml-2 font-medium">Agent přemýšlí...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Quick Prompts & Chat Input Form or Locked Input Footer */}
            {!hasActiveSubscription ? (
              <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/90 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Lock className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Pro odesílání zpráv do diskuse s agentem nejprve propojte své AI předplatné.</span>
                </div>
                <button
                  onClick={() => setIsSubscriptionModalOpen(true)}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-300 hover:text-white text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Propojit model</span>
                </button>
              </div>
            ) : (
              <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/90 backdrop-blur-md">
                <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-2 no-scrollbar">
                  <span className="text-[11px] font-medium text-slate-400 shrink-0 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Rychlé dotazy:</span>
                  </span>
                  {SUGGESTED_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(prompt.text)}
                      disabled={isLoading}
                      className="px-3 py-1.5 rounded-full text-xs font-medium bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all shrink-0 disabled:opacity-50 cursor-pointer"
                    >
                      {prompt.label}
                    </button>
                  ))}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={
                      selectedAgent
                        ? `Zeptejte se agenta ${selectedAgent.name} na parametry, značky či rozpočet...`
                        : "Zadejte svůj nákupní záměr, specifické požadavky na produkt či rozpočet..."
                    }
                    disabled={isLoading}
                    className="flex-1 bg-slate-900 border border-slate-800 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-all"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !inputValue.trim()}
                    className="p-3 bg-gradient-to-r from-cyan-500 to-teal-500 hover:brightness-110 disabled:bg-slate-800 text-slate-950 disabled:text-slate-500 font-bold rounded-xl transition-all shadow-md shadow-cyan-950/50 disabled:shadow-none cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>

                <p className="text-[11px] text-center text-slate-400 mt-2">
                  Diskuse s agentem běží přímo přes vaše propojené AI předplatné s plným využitím vaší RAG paměti.
                </p>
              </div>
            )}
          </main>
        </div>
      )}

      {/* Global Interactive Modals */}
      {/* 1. BYOK AI Engine & Subscription Modal */}
      <AIEngineSubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        activeProviderId={activeProviderId}
        onSaveProvider={(providerId, keys) => {
          setActiveProviderId(providerId);
          setApiKeys(keys);
          if (typeof window !== 'undefined') {
            localStorage.setItem('bairight_active_provider', providerId);
            localStorage.setItem('bairight_api_keys', JSON.stringify(keys));
          }
        }}
        currentApiKeys={apiKeys}
        demoRunsRemaining={demoRunsRemaining}
      />

      {/* 2. Persistent RAG Memory Modal */}
      <UserRAGMemoryModal
        isOpen={isMemoryModalOpen}
        onClose={() => setIsMemoryModalOpen(false)}
        facts={userFacts}
        assessments={assessments}
        onToggleFact={handleToggleFact}
        onAddFact={handleAddFact}
        onDeleteFact={handleDeleteFact}
        onDeleteAssessment={handleDeleteAssessment}
      />

      {/* 3. Color Palette Switcher Modal (Google Pixel & Material Design combinations) */}
      <ColorPaletteModal
        isOpen={isPaletteModalOpen}
        onClose={() => setIsPaletteModalOpen(false)}
      />

      {/* 5. Universal Agent Prompt & Rules Inspector */}
      <UniversalAgentPromptModal
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
        agent={selectedAgent}
      />
    </div>
  );
}
