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
import { 
  Send, 
  Sparkles, 
  Footprints, 
  RefreshCw, 
  Stethoscope, 
  Bot, 
  User, 
  ChevronRight,
  ClipboardList,
  MessageSquare
} from 'lucide-react';

const INITIAL_GREETING: AgentChatMessage = {
  id: 'greeting-1',
  role: 'assistant',
  content: `### 🩺 Welcome to OrthoStride: Clinical Podiatrist & Shoe Shopper

I am your clinical AI podiatrist and personal footwear concierge. Unlike generic shoe pickers, my recommendation engine is governed by **strict biomechanical safety guardrails**.

To protect your kinetic chain and prevent worsening joint degeneration, I **cannot unlock external community searches or European retail scans** until we verify your **5 mandatory parameters**:
1. **Body Weight** (for midsole foam density calibration)
2. **Foot Width** (verifying standard D vs. **Wide 2E / Extra Wide 4E**)
3. **Gait / Strike Pattern** (supination vs. neutral vs. overpronation)
4. **Knee Joint Health** (specifically assessing for **Grade 3 Knee Osteoarthritis**)
5. **Past Injuries** (plantar fasciitis, meniscus tears, etc.)

How can I help you today? Feel free to describe your current running/walking routine and physical profile.`,
  timestamp: new Date().toISOString(),
};

const SUGGESTED_PROMPTS = [
  {
    label: '⚡ Test Full Profile (Grade 3 Knee OA + 2E Wide)',
    text: 'I weigh 86 kg, have wide 2E feet, a supinated heel strike, and was diagnosed with Grade 3 Knee Osteoarthritis. No other past injuries.',
  },
  {
    label: '🔒 Test Gated Profile (Partial Info)',
    text: 'I weigh 82 kg and run 5k three times a week on asphalt, but my shoes feel tight.',
  },
  {
    label: '🦵 Ask About Knee Osteoarthritis 3',
    text: 'Why do I need a rocker sole and 4mm drop for Grade 3 knee osteoarthritis?',
  },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<'wizard' | 'chat'>('wizard');
  const [sessionId, setSessionId] = useState<string>('');
  const [messages, setMessages] = useState<AgentChatMessage[]>([INITIAL_GREETING]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<BiomechanicalProfile>(INITIAL_BIOMECHANICAL_PROFILE);
  const [evalResult, setEvalResult] = useState<MandatoryCheckResult>(
    evaluateMandatoryBiomechanicalParameters(INITIAL_BIOMECHANICAL_PROFILE)
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);

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
          content: 'I apologize, but I encountered an issue connecting to the podiatry agent server. Please try again.',
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
  };

  return (
    <div className="flex h-screen flex-col bg-[#070d18] text-slate-100 overflow-hidden font-sans bio-grid-pattern">
      {/* Top Navbar: High-Tech Clinical Bio-Tech */}
      <header className="h-16 border-b border-cyan-500/20 bg-[#070d18]/85 backdrop-blur-xl px-6 flex items-center justify-between shrink-0 z-20 shadow-[0_4px_25px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-cyan-300 p-0.5 shadow-lg shadow-cyan-950/60 animate-pulse-glow">
            <div className="w-full h-full bg-[#070d18] rounded-[10px] flex items-center justify-center">
              <Footprints className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-1.5">
                <span>bAIright</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 font-mono font-semibold">BIO-TECH</span>
              </h1>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-[10px] font-mono text-cyan-300">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="font-semibold uppercase tracking-wider">AI Core Online</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Nakupujte správně s AI • Podiatrický nákupní asistent</p>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center gap-1 bg-[#0b1628]/90 p-1 rounded-xl border border-cyan-500/20 shadow-inner">
          <button
            onClick={() => setActiveTab('wizard')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'wizard'
                ? 'bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-cyan-300'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Průvodce výběrem (Formulář)</span>
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'chat'
                ? 'bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-cyan-300'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Podiatrický chat</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-500/20 hover:border-cyan-400/50 bg-[#0b1628] text-xs text-cyan-300/80 hover:text-cyan-200 transition-all shadow-sm"
            title="Nové sezení"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Resetovat</span>
          </button>
        </div>
      </header>

      {/* Main Workspace: Wizard or Chat Feed */}
      {activeTab === 'wizard' ? (
        <div className="flex-1 overflow-y-auto bg-[#070d18]">
          <IntakeWizard />
        </div>
      ) : (
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
                            Executed External Agent Tools
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
                  <span className="ml-2 font-medium">OrthoStride is evaluating biomechanical profile...</span>
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
                <span>Quick Prompts:</span>
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
                placeholder="Type your symptoms, shoe preferences, foot width, or joint conditions..."
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
    </div>
  );
}
