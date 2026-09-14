'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  Sliders, 
  Database, 
  Code2, 
  Bot, 
  ShieldAlert, 
  Plus, 
  X, 
  Check, 
  RotateCcw, 
  Eye, 
  ChevronLeft, 
  ChevronRight,
  Stethoscope,
  Activity,
  Layers,
  Terminal
} from 'lucide-react';
import { UniversalAgentDefinition } from '@/lib/agent/universal-agent-schema';
import { PersistentMemoryFact, ShoppingMission, AIProviderConfig } from '@/lib/agent/engine-config';

export interface GuardrailSettings {
  medicalRigor: number; // 0 - 100
  budgetStrictness: number; // 0 - 100
  reasoningDepth: number; // 0 - 100
  bannedBrands: string[];
}

interface AIPromptTunerPanelProps {
  activeAgent: UniversalAgentDefinition | null;
  activeMission: ShoppingMission;
  activeProvider: AIProviderConfig;
  userFacts: PersistentMemoryFact[];
  onToggleFact: (factId: string) => void;
  guardrails: GuardrailSettings;
  onChangeGuardrails: (newSettings: GuardrailSettings) => void;
  systemPromptOverride: string | null;
  onChangeSystemPrompt: (prompt: string) => void;
  onResetSystemPrompt: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const AIPromptTunerPanel: React.FC<AIPromptTunerPanelProps> = ({
  activeAgent,
  activeMission,
  activeProvider,
  userFacts,
  onToggleFact,
  guardrails,
  onChangeGuardrails,
  systemPromptOverride,
  onChangeSystemPrompt,
  onResetSystemPrompt,
  isCollapsed,
  onToggleCollapse,
}) => {
  const [activeTab, setActiveTab] = useState<'prompt' | 'guardrails' | 'rag' | 'payload'>('prompt');
  const [newBannedBrand, setNewBannedBrand] = useState('');

  const defaultPrompt = activeAgent?.systemPrompt || 
    `Jsi špičkový certifikovaný podiatrický AI nákupčí bot bAIright pro běžeckou a zdravotní obuv.
Tvým úkolem je nekompromisně chránit zdraví nohou a kloubů uživatele.
Při šířce nohy nad 100 mm striktně vyžaduj certifikovaná kopyta 2E / 4E.
Při citlivosti kolen vynucuj kolébkovou podešev (rocker) a drop 4–8 mm.
Nikdy nedoporučuj zakázané značky.`;

  const currentSystemPrompt = systemPromptOverride !== null ? systemPromptOverride : defaultPrompt;
  const activeFacts = userFacts.filter((f) => f.isEnriched);

  // Compile final mock payload to show exact LLM prompt
  const compiledPayload = `=== SYSTEM INSTRUCTIONS (ROLE & PERSONA) ===
${currentSystemPrompt}

=== COGNITIVE GUARDRAILS (LIMITS) ===
- Medical Rigor: ${guardrails.medicalRigor}% (${guardrails.medicalRigor > 80 ? 'Striktní anatomická ochrana' : 'Běžná tolerance'})
- Budget Strictness: ${guardrails.budgetStrictness}% (${guardrails.budgetStrictness > 75 ? 'Hard limit (žádné překročení ceny)' : 'Tolerance ±15%'})
- Reasoning Depth: ${guardrails.reasoningDepth}% (${guardrails.reasoningDepth > 70 ? 'Plné klinické odůvodnění s biomechanikou' : 'Kompaktní'})
- Negative Constraints (Banned Brands): [${guardrails.bannedBrands.join(', ') || 'Žádné'}]

=== INJECTED RAG CONTEXT (USER ANAMNESIS & FACTS) ===
${activeFacts.length > 0 ? activeFacts.map(f => `- [${f.category.toUpperCase()}] ${f.label}: ${f.value}`).join('\n') : '(Žádná aktivní fakta)'}

=== CURRENT MISSION ===
Domain: ${activeMission.name} (${activeMission.id})
Target Category: ${activeAgent?.category || 'Běžecká obuv'}`;

  const handleAddBannedBrand = (e: React.FormEvent) => {
    e.preventDefault();
    const brand = newBannedBrand.trim();
    if (!brand) return;
    if (!guardrails.bannedBrands.map(b => b.toLowerCase()).includes(brand.toLowerCase())) {
      onChangeGuardrails({
        ...guardrails,
        bannedBrands: [...guardrails.bannedBrands, brand]
      });
    }
    setNewBannedBrand('');
  };

  const handleRemoveBannedBrand = (brandToRemove: string) => {
    onChangeGuardrails({
      ...guardrails,
      bannedBrands: guardrails.bannedBrands.filter(b => b !== brandToRemove)
    });
  };

  if (isCollapsed) {
    return (
      <aside className="w-12 shrink-0 border-r border-slate-800 bg-[#070b14] flex flex-col items-center py-4 justify-between transition-all">
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-cyan-400 hover:text-white cursor-pointer transition-colors"
          title="Rozbalit AI Prompt & Guardrail Tuner Studio"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <div className="[writing-mode:vertical-rl] rotate-180 flex items-center gap-2 text-[11px] font-mono tracking-wider text-slate-400 font-bold uppercase">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>AI Prompt Adjuster & Brain Studio</span>
        </div>
        <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
      </aside>
    );
  }

  return (
    <aside className="w-full lg:w-[420px] xl:w-[460px] shrink-0 border-r border-slate-800/80 bg-[#070b14]/95 flex flex-col h-full overflow-hidden shadow-2xl relative z-10">
      {/* Studio Header */}
      <div className="p-4 border-b border-slate-800/80 bg-[#090e1a] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-600 to-teal-500 flex items-center justify-center text-slate-950 font-bold text-xs shadow-sm">
            <Bot className="w-4 h-4 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs text-white">AI Prompt & Brain Tuner</span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40 font-semibold">
                STUDIO
              </span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
              <span>{activeProvider.name.split(' ')[0]}</span>
              <span>•</span>
              <span className="text-cyan-400 font-medium">{activeAgent?.name || activeMission.agentName}</span>
            </div>
          </div>
        </div>

        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white cursor-pointer transition-colors"
          title="Zabalit levý panel"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Sub-Tabs: Prompt, Guardrails, RAG, Payload */}
      <div className="px-3 pt-2.5 bg-[#080d18] border-b border-slate-800/80 flex items-center gap-1 text-xs shrink-0 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('prompt')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg font-medium transition-colors cursor-pointer border-b-2 ${
            activeTab === 'prompt'
              ? 'border-cyan-400 text-cyan-300 bg-slate-900/60 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>System Prompt</span>
        </button>

        <button
          onClick={() => setActiveTab('guardrails')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg font-medium transition-colors cursor-pointer border-b-2 ${
            activeTab === 'guardrails'
              ? 'border-cyan-400 text-cyan-300 bg-slate-900/60 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Mantinely</span>
        </button>

        <button
          onClick={() => setActiveTab('rag')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg font-medium transition-colors cursor-pointer border-b-2 ${
            activeTab === 'rag'
              ? 'border-cyan-400 text-cyan-300 bg-slate-900/60 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>RAG Kontext ({activeFacts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('payload')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg font-medium transition-colors cursor-pointer border-b-2 ${
            activeTab === 'payload'
              ? 'border-cyan-400 text-cyan-300 bg-slate-900/60 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Payload</span>
        </button>
      </div>

      {/* Main Tab Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* TAB 1: SYSTEM PROMPT & PERSONA TUNING */}
        {activeTab === 'prompt' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Instrukce & Osobnost Agenta</span>
              </span>
              {systemPromptOverride !== null && (
                <button
                  onClick={onResetSystemPrompt}
                  className="flex items-center gap-1 text-[10px] font-mono text-cyan-400 hover:text-cyan-300 cursor-pointer"
                  title="Obnovit výchozí prompt"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Obnovit výchozí</span>
                </button>
              )}
            </div>

            <div className="relative rounded-xl border border-slate-700/80 bg-[#050810] overflow-hidden focus-within:border-cyan-400/80 transition-colors">
              <div className="px-3 py-1.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>SYSTEM_PROMPT_TEMPLATE.md</span>
                <span className="text-cyan-400 font-bold">ŽIVĚ UPRAVITELNÉ</span>
              </div>
              <textarea
                value={currentSystemPrompt}
                onChange={(e) => onChangeSystemPrompt(e.target.value)}
                rows={9}
                className="w-full bg-transparent p-3 text-xs font-mono text-slate-200 placeholder-slate-500 outline-none resize-none leading-relaxed"
                placeholder="Zadejte systémové instrukce pro agenta..."
              />
            </div>

            <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/25 space-y-1.5 text-[11px] text-slate-300 leading-snug">
              <div className="font-bold text-cyan-300 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Přímý vliv na generování</span>
              </div>
              <p>
                Jakákoliv úprava textu výše okamžitě mění uvažování agenta při generování doporučení v pravém panelu.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: COGNITIVE GUARDRAILS & BANNED BRANDS */}
        {activeTab === 'guardrails' && (
          <div className="space-y-5 animate-in fade-in duration-150">
            {/* Slider 1: Medical Rigor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Klinická přísnost došlapu & kopyta</span>
                </span>
                <span className="font-mono text-cyan-300 font-bold">{guardrails.medicalRigor}%</span>
              </div>
              <input
                type="range"
                min={20}
                max={100}
                value={guardrails.medicalRigor}
                onChange={(e) => onChangeGuardrails({ ...guardrails, medicalRigor: Number(e.target.value) })}
                className="w-full cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Volnější tolerance</span>
                <span className="text-cyan-400 font-medium">
                  {guardrails.medicalRigor > 75 ? 'Striktní 2E kopyto & Rocker' : 'Střední doporučení'}
                </span>
              </div>
            </div>

            {/* Slider 2: Budget Strictness */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Striktnost rozpočtu (Cenový strop)</span>
                </span>
                <span className="font-mono text-emerald-300 font-bold">{guardrails.budgetStrictness}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                value={guardrails.budgetStrictness}
                onChange={(e) => onChangeGuardrails({ ...guardrails, budgetStrictness: Number(e.target.value) })}
                className="w-full cursor-pointer accent-emerald-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Tolerance +20%</span>
                <span className="text-emerald-400 font-medium">
                  {guardrails.budgetStrictness > 80 ? 'Tvrdý strop (ani korunu navíc)' : 'Mírná tolerance'}
                </span>
              </div>
            </div>

            {/* Slider 3: Reasoning Depth */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  <span>Hloubka odůvodnění (Reasoning)</span>
                </span>
                <span className="font-mono text-purple-300 font-bold">{guardrails.reasoningDepth}%</span>
              </div>
              <input
                type="range"
                min={20}
                max={100}
                value={guardrails.reasoningDepth}
                onChange={(e) => onChangeGuardrails({ ...guardrails, reasoningDepth: Number(e.target.value) })}
                className="w-full cursor-pointer accent-purple-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Kompaktní souhrn</span>
                <span className="text-purple-400 font-medium">Detailní biomechanické zdůvodnění</span>
              </div>
            </div>

            {/* Negative Brand Guardrail (Banned Brands) */}
            <div className="pt-2 border-t border-slate-800 space-y-2.5">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>Negativní prompt (Zakázané značky)</span>
              </span>

              <div className="flex flex-wrap gap-1.5">
                {guardrails.bannedBrands.map((brand) => (
                  <span
                    key={brand}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs font-semibold"
                  >
                    <span>{brand}</span>
                    <button
                      onClick={() => handleRemoveBannedBrand(brand)}
                      className="hover:text-white cursor-pointer ml-1"
                      title={`Zrušit zákaz značky ${brand}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Add Banned Brand Input Form */}
              <form onSubmit={handleAddBannedBrand} className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={newBannedBrand}
                  onChange={(e) => setNewBannedBrand(e.target.value)}
                  placeholder="Přidat další zákaz (např. Nike, Hoka)..."
                  className="flex-1 bg-[#050810] border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-rose-400/80"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-800/80 border border-rose-600/50 text-rose-200 text-xs font-medium cursor-pointer transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Zakázat</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: RAG MEMORY CONTEXT INJECTOR */}
        {activeTab === 'rag' && (
          <div className="space-y-3.5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                <span>Aktivní fakta z RAG paměti</span>
              </span>
              <span className="text-[10px] font-mono text-cyan-400">
                {activeFacts.length} z {userFacts.length} zapnuto
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-snug">
              Přepínačem zapněte nebo vypněte anamnestická fakta, která se přímo injektují do promptu agenta:
            </p>

            <div className="space-y-2">
              {userFacts.map((fact) => {
                const isActive = fact.isEnriched;
                return (
                  <div
                    key={fact.id}
                    onClick={() => onToggleFact(fact.id)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isActive
                        ? 'bg-cyan-950/40 border-cyan-500/40 text-slate-100 shadow-sm'
                        : 'bg-[#050810] border-slate-800 text-slate-400 opacity-60 hover:opacity-90'
                    }`}
                  >
                    <div className="space-y-0.5 max-w-[85%]">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300 font-bold">
                          {fact.category}
                        </span>
                        <span className="font-semibold text-xs text-white truncate">{fact.label}</span>
                      </div>
                      <div className="text-[11px] text-slate-300 truncate">{fact.value}</div>
                    </div>

                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      isActive ? 'bg-cyan-500 border-cyan-400 text-slate-950' : 'border-slate-700 bg-slate-900'
                    }`}>
                      {isActive && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: COMPILED PAYLOAD INSPECTOR */}
        {activeTab === 'payload' && (
          <div className="space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span>Zkompilovaný prompt do LLM</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700">
                ~{Math.round(compiledPayload.length / 4)} tokenů
              </span>
            </div>

            <pre className="p-3 rounded-xl bg-[#04060c] border border-slate-800 text-[10px] font-mono text-slate-300 leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-96">
              {compiledPayload}
            </pre>
          </div>
        )}
      </div>
    </aside>
  );
};
