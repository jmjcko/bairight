'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  BiomechanicalProfile, 
  MandatoryCheckResult, 
  AgentChatMessage 
} from '@/lib/agent/types';
import { INITIAL_BIOMECHANICAL_PROFILE, evaluateMandatoryBiomechanicalParameters } from '@/lib/agent/state-machine';
import { BiomechanicalSidebar } from '@/components/BiomechanicalSidebar';
import { ToolExecutionBadge } from '@/components/ToolExecutionBadge';
import { ShoeRecommendationCard } from '@/components/ShoeRecommendationCard';
import { IntakeWizard } from '@/components/IntakeWizard';
import { Logo } from '@/components/Logo';
import { MockupClinicalDashboard } from '@/components/MockupClinicalDashboard';
import { AnalysisModal } from '@/components/AnalysisModal';
import { RecommendationsModal } from '@/components/RecommendationsModal';
import { AppointmentsModal } from '@/components/AppointmentsModal';
import { MovementAnalysisView } from '@/components/MovementAnalysisView';
import { ShoeCatalogView } from '@/components/ShoeCatalogView';
import { AgentConfigModal } from '@/components/AgentConfigModal';
import { translations } from '@/lib/i18n/translations';
import { EUROPEAN_CATALOG_2E_MODELS } from '@/lib/agent/tools/scan-eshops';
import { 
  Send, 
  Sparkles, 
  Footprints, 
  RefreshCw, 
  Stethoscope, 
  Bot, 
  User, 
  ChevronRight,
  ChevronLeft,
  ClipboardList,
  MessageSquare,
  Search,
  Bell,
  CheckCircle2,
  Calendar,
  X,
  Tag,
  Settings
} from 'lucide-react';

export type AppTab = 'wizard' | 'analysis' | 'catalog' | 'chat';

const INITIAL_GREETING: AgentChatMessage = {
  id: 'greeting-1',
  role: 'assistant',
  content: `### 🩺 Vítejte v bAIright: Osobní klinický nákupčí bot

Jsem váš osobní klinický AI podiatr a nákupčí obuvi. Doporučení řídím přísnými biomechanickými pravidly podle vašeho profilu:
1. **Hmotnost & tlak na mezipodešev**
2. **Šířka chodidla (ověření 2E / 4E)**
3. **Typ došlapu & supinace**
4. **Zdraví kolene (Artróza 3. stupně)**
5. **Prodělané operace**

Jak vám mohu dnes pomoci? Zeptejte se na cokoli ohledně výběru bot a ochrany kloubů.`,
  timestamp: new Date().toISOString(),
};

const SUGGESTED_PROMPTS = [
  {
    label: '⚡ Test profilu (Artróza kolene 3. st. + 2E kopyto)',
    text: 'Mám 86 kg, široké chodidlo 2E (104 mm), došlap na vnější hranu a artrózu kolene 3. stupně.',
  },
  {
    label: '🦵 Proč potřebuji rockerovou podrážku?',
    text: 'Proč je pro artrózu kolene 3. stupně zásadní kolébková rocker podrážka a drop 4-8 mm?',
  },
  {
    label: '🔒 Ověření evropských skladů',
    text: 'Které modely mají certifikované široké kopyto 2E a jsou skladem v EU?',
  },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<AppTab>('wizard');
  const [sessionId, setSessionId] = useState<string>('');
  const [messages, setMessages] = useState<AgentChatMessage[]>([INITIAL_GREETING]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<BiomechanicalProfile>(INITIAL_BIOMECHANICAL_PROFILE);
  const [evalResult, setEvalResult] = useState<MandatoryCheckResult>(
    evaluateMandatoryBiomechanicalParameters(INITIAL_BIOMECHANICAL_PROFILE)
  );

  // Interactive UI Modal States
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [isRecommendationsOpen, setIsRecommendationsOpen] = useState(false);
  const [isAppointmentsOpen, setIsAppointmentsOpen] = useState(false);
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);

  // Header Interactive Menus
  const [searchQuery, setSearchQuery] = useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filtered search results
  const searchResults = searchQuery.trim().length > 1
    ? EUROPEAN_CATALOG_2E_MODELS.filter((s) => 
        s.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.medical_rationale.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Initialize unique session ID
  useEffect(() => {
    const existing = localStorage.getItem('orthostride_session_id');
    const sid = existing || `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    if (!existing) {
      localStorage.setItem('orthostride_session_id', sid);
    }
    setSessionId(sid);
  }, []);

  // Auto-scroll to bottom of chat
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
      if (data.updatedProfile) {
        setProfile(data.updatedProfile);
        setEvalResult(evaluateMandatoryBiomechanicalParameters(data.updatedProfile));
      }
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

  const handleReset = () => {
    const newSid = `session-${Date.now()}`;
    localStorage.setItem('orthostride_session_id', newSid);
    setSessionId(newSid);
    setProfile(INITIAL_BIOMECHANICAL_PROFILE);
    setEvalResult(evaluateMandatoryBiomechanicalParameters(INITIAL_BIOMECHANICAL_PROFILE));
    setMessages([INITIAL_GREETING]);
    setIsNotificationsOpen(false);
    setIsProfileOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="flex h-screen flex-col bg-[#070d18] text-slate-100 overflow-hidden font-sans bio-grid-pattern">
      {/* Top Navbar: Mockup B Clinical Bio-Tech Header */}
      <header className="h-20 border-b border-cyan-500/20 bg-[#0B121E]/95 backdrop-blur-xl px-4 sm:px-8 flex items-center justify-between shrink-0 z-20 shadow-[0_4px_30px_rgba(0,0,0,0.6)]">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-3">
          <Logo size="md" />
        </div>

        {/* Center: Mockup B Navigation Tabs */}
        <nav className="flex items-center gap-2 sm:gap-6 text-xs sm:text-sm font-semibold h-full overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('wizard')}
            className={`h-full flex items-center py-6 transition-all relative cursor-pointer shrink-0 ${
              activeTab === 'wizard'
                ? 'text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>{translations.cs.nav.wizardTab}</span>
            {activeTab === 'wizard' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-teal-400 shadow-[0_0_10px_rgba(6,182,212,1)]" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('analysis')}
            className={`h-full flex items-center py-6 transition-all relative cursor-pointer shrink-0 ${
              activeTab === 'analysis'
                ? 'text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>{translations.cs.nav.analysisTab}</span>
            {activeTab === 'analysis' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-teal-400 shadow-[0_0_10px_rgba(6,182,212,1)]" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('catalog')}
            className={`h-full flex items-center py-6 transition-all relative cursor-pointer shrink-0 ${
              activeTab === 'catalog'
                ? 'text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>{translations.cs.nav.catalogTab}</span>
            {activeTab === 'catalog' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-teal-400 shadow-[0_0_10px_rgba(6,182,212,1)]" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`h-full flex items-center py-6 transition-all relative cursor-pointer shrink-0 ${
              activeTab === 'chat'
                ? 'text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>{translations.cs.nav.chatTab}</span>
            {activeTab === 'chat' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-teal-400 shadow-[0_0_10px_rgba(6,182,212,1)]" />
            )}
          </button>
        </nav>

        {/* Right: Active Agent Widget, Search, Notifications, Profile & Reset */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Active Clinical AI Agent Capsule Widget */}
          <button
            onClick={() => setIsAgentModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#06101e] hover:bg-cyan-950/70 border border-cyan-500/30 hover:border-cyan-400 text-xs transition-all cursor-pointer group shadow-[0_0_15px_rgba(6,182,212,0.15)]"
            title="Klikněte pro zobrazení a editaci instrukcí podiatrického agenta (agents/shoe-recommender-agent.md)"
          >
            <div className="relative flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute opacity-75" />
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
            </div>
            <div className="hidden sm:flex flex-col items-start text-left leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                  Podiatrický Agent
                </span>
                <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40">
                  v1.1
                </span>
              </div>
              <span className="text-[9px] font-mono text-cyan-400/80 group-hover:text-cyan-300 flex items-center gap-1">
                <span>shoe-recommender-agent.md</span>
                <Settings className="w-2.5 h-2.5 text-cyan-400 group-hover:rotate-90 transition-transform" />
              </span>
            </div>
          </button>
          {/* Interactive Search Bar */}
          <div className="relative">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#070f1e] border border-cyan-500/25 text-xs text-slate-300 focus-within:border-cyan-400 transition-colors">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Hledat model, kopyto..." 
                className="bg-transparent text-xs text-white placeholder-slate-500 outline-none w-32" 
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Live Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute top-11 right-0 w-80 bg-[#0B121E] border border-cyan-500/40 rounded-2xl p-2.5 shadow-2xl z-50 space-y-2 max-h-80 overflow-y-auto animate-in fade-in">
                <div className="text-[10px] font-mono text-cyan-300 px-2 uppercase font-bold">
                  Nalezeno {searchResults.length} modelů:
                </div>
                {searchResults.map((shoe) => (
                  <div
                    key={shoe.id}
                    onClick={() => {
                      setActiveTab('catalog');
                      setSearchQuery('');
                    }}
                    className="p-2 rounded-xl bg-[#070f1e] hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-400/40 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-white">{shoe.model}</div>
                      <div className="text-[10px] text-slate-400">{shoe.brand} • Drop {shoe.heel_drop_mm} mm</div>
                    </div>
                    <div className="text-xs font-mono font-bold text-cyan-300">
                      {Math.round(shoe.european_price_eur * 25.2).toLocaleString('cs-CZ')} Kč
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Interactive Notification Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setIsNotificationsOpen(!isNotificationsOpen);
                setIsProfileOpen(false);
              }}
              className="relative p-2 rounded-xl bg-[#070f1e] border border-cyan-500/20 text-slate-300 hover:text-cyan-300 cursor-pointer transition-colors"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#0B121E]" />
            </button>

            {isNotificationsOpen && (
              <div className="absolute top-11 right-0 w-80 bg-[#0B121E] border border-cyan-500/40 rounded-2xl p-4 shadow-2xl z-50 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Upozornění a lékařský stav</span>
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 font-bold">3 NOVÉ</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-[#070f1e] border border-emerald-500/30">
                    <div className="font-bold text-emerald-300 text-[11px] mb-0.5">🏷️ Sleva 15% na skladě EU</div>
                    <p className="text-[10px] text-slate-300 leading-snug">Brooks Adrenaline GTS 23 (2E Wide) zlevněn na 3 779 Kč v Top4Running.</p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#070f1e] border border-cyan-500/30">
                    <div className="font-bold text-cyan-300 text-[11px] mb-0.5">🩺 Posudek agenta ověřen</div>
                    <p className="text-[10px] text-slate-300 leading-snug">Pro artrózu kolene 3. stupně byla aktivována ochrana rocker podrážkou.</p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#070f1e] border border-teal-500/30">
                    <div className="font-bold text-teal-300 text-[11px] mb-0.5">📅 Termín konzultace připraven</div>
                    <p className="text-[10px] text-slate-300 leading-snug">Dnes v 16:30 máte volný slot s MUDr. Procházkou.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar Popover */}
          <div className="relative">
            <button
              onClick={() => {
                setIsProfileOpen(!isProfileOpen);
                setIsNotificationsOpen(false);
              }}
              className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-teal-400 p-0.5 cursor-pointer shadow-sm hover:scale-105 transition-all"
            >
              <div className="w-full h-full rounded-full bg-[#070f1e] flex items-center justify-center text-xs font-bold text-cyan-300">
                JM
              </div>
            </button>

            {isProfileOpen && (
              <div className="absolute top-11 right-0 w-72 bg-[#0B121E] border border-cyan-500/40 rounded-2xl p-4 shadow-2xl z-50 space-y-3 animate-in fade-in">
                <div className="flex items-center gap-2.5 border-b border-cyan-500/20 pb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-teal-400 p-0.5">
                    <div className="w-full h-full rounded-full bg-[#070f1e] flex items-center justify-center font-bold text-cyan-300">
                      JM
                    </div>
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white">Jan Mlynář</div>
                    <div className="text-[10px] font-mono text-cyan-300">Aktivní biometrický profil</div>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between p-2 rounded-lg bg-[#070f1e]">
                    <span className="text-slate-400">Délka chodidla:</span>
                    <span className="font-mono text-white font-bold">280 mm (28.0 cm)</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-[#070f1e]">
                    <span className="text-slate-400">Šířka chodidla:</span>
                    <span className="font-mono text-teal-300 font-bold">104 mm (Kopyto 2E)</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-[#070f1e]">
                    <span className="text-slate-400">Zdravotní stav:</span>
                    <span className="text-amber-300 font-bold text-[11px]">Koleno OA 3. st.</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace: Wizard, Analysis, Catalog or Chat */}
      {activeTab === 'wizard' && (
        <div className="flex-1 overflow-y-auto bg-[#070d18] p-2 sm:p-4">
          <IntakeWizard 
            onOpenAnalysis={() => setActiveTab('analysis')}
            onOpenAppointments={() => setIsAppointmentsOpen(true)}
            onOpenRecommendations={() => setActiveTab('catalog')}
          />
        </div>
      )}

      {activeTab === 'analysis' && (
        <MovementAnalysisView
          footLengthMm={280}
          footWidthMm={profile.foot_width === 'wide_2e' ? 104 : profile.foot_width === 'extra_wide_4e' ? 110 : 98}
          kneeCondition={profile.knee_condition === 'osteoarthritis_grade_3' ? 'Artróza kolene 3. st.' : 'Artróza kolene 3. st.'}
          onNavigateToWizard={() => setActiveTab('wizard')}
          onNavigateToCatalog={() => setActiveTab('catalog')}
          onNavigateToChat={() => setActiveTab('chat')}
        />
      )}

      {activeTab === 'catalog' && (
        <ShoeCatalogView
          onNavigateToWizard={() => setActiveTab('wizard')}
          onNavigateToChat={() => setActiveTab('chat')}
          onNavigateToAnalysis={() => setActiveTab('analysis')}
        />
      )}

      {activeTab === 'chat' && (
        <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
          {/* Left: Interactive Biomechanical Profile Sidebar */}
          <BiomechanicalSidebar profile={profile} evalResult={evalResult} />

          {/* Right: Conversational Chat Stream */}
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
                    <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 mt-1">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[85%]`}>
                    <div
                      className={`p-4 sm:p-5 rounded-2xl text-sm leading-relaxed ${
                        isUser
                          ? 'bg-emerald-600 text-white rounded-tr-none shadow-md shadow-emerald-950/40'
                          : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none shadow-sm'
                      }`}
                    >
                      {/* Message Content rendered cleanly */}
                      <div className="prose prose-invert prose-sm max-w-none space-y-3">
                        {msg.content.split('\n\n').map((paragraph, idx) => {
                          if (paragraph.startsWith('### ')) {
                            return <h3 key={idx} className="text-base font-bold text-white mt-2 mb-1">{paragraph.replace('### ', '')}</h3>;
                          }
                          if (paragraph.startsWith('> ')) {
                            return (
                              <blockquote key={idx} className="p-3 my-2 border-l-4 border-amber-500 bg-amber-950/30 rounded text-amber-200 text-xs">
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
                            Provedené externí nástroje agenta
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

                    {/* Shoe Recommendation Cards Grid */}
                    {msg.recommendations && msg.recommendations.length > 0 && (
                      <div className="w-full mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {msg.recommendations.map((shoe) => (
                          <ShoeRecommendationCard key={shoe.id} shoe={shoe} />
                        ))}
                      </div>
                    )}

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
                <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 animate-pulse" />
                </div>
                <div className="flex items-center gap-2 p-3 bg-slate-900 border border-slate-800 rounded-xl">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="ml-2 font-medium">bAIright vyhodnocuje biometrický profil...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts & Chat Input Form */}
          <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/90 backdrop-blur-md">
            {/* Quick Prompt Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-2 no-scrollbar">
              <span className="text-[11px] font-medium text-slate-400 shrink-0 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Rychlé dotazy:</span>
              </span>
              {SUGGESTED_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt.text)}
                  disabled={isLoading}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all shrink-0 disabled:opacity-50"
                >
                  {prompt.label}
                </button>
              ))}
            </div>

            {/* Input Bar */}
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
                placeholder="Zadejte své potíže, preference obuvi, šířku chodidla či stav kloubů..."
                disabled={isLoading}
                className="flex-1 bg-slate-900 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-all"
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="p-3 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 text-slate-950 disabled:text-slate-500 font-semibold rounded-xl transition-all shadow-md shadow-emerald-950/50 disabled:shadow-none"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <p className="text-[11px] text-center text-slate-400 mt-2">
              bAIright aplikuje podiatrickou biomechaniku a ověřuje evropské 2E sklady. V případě akutních potíží vždy konzultujte lékaře.
            </p>
          </div>
        </main>
      </div>
      )}

      {/* Global Interactive Modals */}
      <AnalysisModal
        isOpen={isAnalysisOpen}
        onClose={() => setIsAnalysisOpen(false)}
        footLengthMm={280}
        footWidthMm={104}
        kneeCondition="Artróza kolene 3. st."
      />

      <RecommendationsModal
        isOpen={isRecommendationsOpen}
        onClose={() => setIsRecommendationsOpen(false)}
      />

      <AppointmentsModal
        isOpen={isAppointmentsOpen}
        onClose={() => setIsAppointmentsOpen(false)}
      />

      {/* Real Clinical Agent Inspector & Markdown Editor Modal */}
      <AgentConfigModal
        isOpen={isAgentModalOpen}
        onClose={() => setIsAgentModalOpen(false)}
      />
    </div>
  );
}
