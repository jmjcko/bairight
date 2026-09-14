'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AgentChatMessage } from '@/lib/agent/types';
import { ToolExecutionBadge } from '@/components/ToolExecutionBadge';
import { Logo } from '@/components/Logo';
import { UserProfileCapsule } from '@/components/UserProfileCapsule';
import { AIEngineSubscriptionModal } from '@/components/AIEngineSubscriptionModal';
import { UserRAGMemoryModal } from '@/components/UserRAGMemoryModal';
import { AgentCategoryLauncher } from '@/components/AgentCategoryLauncher';
import { DynamicAgentWizard } from '@/components/DynamicAgentWizard';
import { ColorPaletteModal } from '@/components/ColorPaletteModal';
import { UniversalAgentPromptModal } from '@/components/UniversalAgentPromptModal';
import { 
  UniversalAgentDefinition, 
  PRESET_SHOE_AGENT, 
  PRESET_ERGO_CHAIR_AGENT 
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
  Type
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
  const [wizardMode, setWizardMode] = useState<'launcher' | 'active_agent'>('launcher');
  const [activeProviderId, setActiveProviderId] = useState<AIProviderId>('bairight_core');
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [userFacts, setUserFacts] = useState<PersistentMemoryFact[]>(INITIAL_USER_FACTS);
  const [assessments, setAssessments] = useState<CompletedAssessmentRecord[]>(INITIAL_ASSESSMENT_RECORDS);
  const [demoRunsRemaining, setDemoRunsRemaining] = useState<number>(3);

  const activeProvider = SUPPORTED_AI_PROVIDERS.find((p) => p.id === activeProviderId) || SUPPORTED_AI_PROVIDERS[0];
  const activeFactsCount = userFacts.filter((f) => f.isEnriched).length;

  // Load persisted font preference, theme, assessments, BYOK keys & facts from localStorage
  useEffect(() => {
    const storedFont = localStorage.getItem('bairight_active_font') || 'space-grotesk';
    setActiveFontId(storedFont);
    document.documentElement.setAttribute('data-font', storedFont);

    const storedTheme = localStorage.getItem('bairight_active_theme') || 'pixel-mint';
    document.documentElement.setAttribute('data-theme', storedTheme);

    const storedAssessments = localStorage.getItem('bairight_assessments');
    if (storedAssessments) {
      try {
        setAssessments(JSON.parse(storedAssessments));
      } catch (e) {
        console.error('Failed to parse stored assessments:', e);
      }
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
    setUserFacts((prev) =>
      prev.map((f) => (f.id === factId ? { ...f, isEnriched: !f.isEnriched } : f))
    );
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
    setUserFacts((prev) => [newFact, ...prev]);
  };

  const handleDeleteFact = (factId: string) => {
    setUserFacts((prev) => prev.filter((f) => f.id !== factId));
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
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setMessages((prev) => [...prev, data.message]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Omlouvám se, došlo k chybě při spojení s AI agentem. Zkuste to prosím znovu.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-[#070d18] text-slate-100 overflow-hidden font-sans bio-grid-pattern">
      {/* Top Navbar: Clean Executive Header */}
      <header className="h-16 border-b border-cyan-500/20 bg-[#0B121E]/95 backdrop-blur-xl px-4 sm:px-8 flex items-center justify-between shrink-0 z-20 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        {/* Left: Brand Logo & Navigation */}
        <div className="flex items-center gap-6 shrink-0">
          <Logo size="md" />

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
              Průvodce nákupem
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Konzultační chat
            </button>
          </div>
        </div>

        {/* Right: User Profile & Customization Capsules */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
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
              onSelectAgent={(agent) => {
                setSelectedAgent(agent);
                setWizardMode('active_agent');
              }}
              activeProviderId={activeProviderId}
              currentApiKeys={apiKeys}
            />
          ) : (
            <DynamicAgentWizard
              agent={selectedAgent}
              onBackToLauncher={() => setWizardMode('launcher')}
              activeProviderId={activeProviderId}
              currentApiKeys={apiKeys}
              userFacts={userFacts}
              onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
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

      {/* Universal Consultative Chat Tab */}
      {activeTab === 'chat' && (
        <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
          {/* Left: Universal Context & RAG Sidebar */}
          <aside className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-slate-800 bg-[#08101e]/90 p-4 space-y-4 overflow-y-auto shrink-0">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                Aktivní nákupní kontext
              </span>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>{selectedAgent?.icon || '🤖'}</span>
                <span>{selectedAgent?.name || 'Všeobecný nákupní poradce'}</span>
              </h3>
              <p className="text-xs text-slate-400">
                {selectedAgent?.description || 'Nezávislý rádce pro analýzu trhu a parametrů.'}
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
                  setWizardMode('launcher');
                  setActiveTab('wizard');
                }}
                className="w-full py-2 px-3 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Otevřít průvodce výběrem</span>
              </button>
            </div>
          </aside>

          {/* Right: Conversational Stream */}
          <main className="flex-1 flex flex-col justify-between overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
            {/* Message List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
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
                    <span className="ml-2 font-medium">bAIright vyhodnocuje parametry...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts & Chat Input Form */}
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
                  placeholder="Zadejte svůj nákupní záměr, specifické požadavky na produkt či rozpočet..."
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
                bAIright je nezávislý nákupní rádce bez reklam a sponzorovaných odkazů. Doporučení jsou řízena výhradně vašimi parametry.
              </p>
            </div>
          </main>
        </div>
      )}

      {/* Global Interactive Modals */}
      {/* 1. BYOK AI Engine & Subscription Modal */}
      <AIEngineSubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        selectedProviderId={activeProviderId}
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
