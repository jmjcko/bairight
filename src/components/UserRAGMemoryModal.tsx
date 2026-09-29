'use client';

import { useI18n } from '@/lib/i18n/I18nContext';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Brain,
  Database, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Sparkles, 
  Layers, 
  Calendar, 
  FileText, 
  Footprints, 
  Stethoscope, 
  ChevronRight, 
  ArrowUpRight,
  Clock,
  Tag,
  Activity,
  Copy,
  Download,
  Terminal,
  User,
  Fingerprint,
  Heart,
  ShieldCheck
} from 'lucide-react';
import { PersistentMemoryFact, CompletedAssessmentRecord, formatValueDisplay } from '@/lib/agent/engine-config';
import { PromptStorageService, CompletedPromptRecord } from '@/lib/agent/prompt-storage-service';

interface UserRAGMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  facts: PersistentMemoryFact[];
  assessments: CompletedAssessmentRecord[];
  userName?: string;
  onToggleFact: (factId: string) => void;
  onAddFact: (label: string, value: string, category: 'biometrics' | 'medical' | 'preference' | 'history') => void;
  onDeleteFact: (factId: string) => void;
  onDeleteAssessment: (assessmentId: string) => void;
}

export const UserRAGMemoryModal: React.FC<UserRAGMemoryModalProps> = ({
  isOpen,
  onClose,
  facts = [],
  assessments = [],
  userName = 'Jan Mynář',
  onToggleFact,
  onAddFact,
  onDeleteFact,
  onDeleteAssessment,
}) => {
  const { locale } = useI18n();
  const [activeTab, setActiveTab] = useState<'history' | 'prompts' | 'facts'>('history');
  const [expandedAssessmentId, setExpandedAssessmentId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Form state for adding new fact
  const [newLabel, setNewLabel] = useState('');
  const [newCategory, setNewCategory] = useState<'biometrics' | 'medical' | 'preference' | 'history'>('medical');
  const [newValue, setNewValue] = useState('');

  // Prompts state
  const [completedPrompts, setCompletedPrompts] = useState<CompletedPromptRecord[]>([]);
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);

  // Load completed prompts from storage on open
  useEffect(() => {
    if (isOpen) {
      setCompletedPrompts(PromptStorageService.getCompletedPrompts());
    }
  }, [isOpen]);

  // Extract active personal & biometric facts
  const personalBiometricFacts = useMemo(() => {
    return (facts || []).filter(
      (f) => f.category === 'biometrics' || f.category === 'medical' || f.category === 'preference'
    );
  }, [facts]);

  if (!isOpen) return null;

  const activeFactsCount = (facts || []).filter((f) => f.isEnriched).length;

  const handleCreateFact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel || !newValue) return;
    onAddFact?.(newLabel, newValue, newCategory);
    setNewLabel('');
    setNewValue('');
    setIsAdding(false);
  };

  const handleDeletePrompt = (id: string) => {
    PromptStorageService.deleteCompletedPrompt(id);
    setCompletedPrompts(PromptStorageService.getCompletedPrompts());
  };

  const handleClearAllPrompts = () => {
    if (window.confirm('Opravdu chcete smazat všechny uložené dokončené prompty?')) {
      PromptStorageService.clearAll();
      setCompletedPrompts([]);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPromptId(id);
    setTimeout(() => setCopiedPromptId(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-[#050b14] border border-cyan-500/30 rounded-3xl shadow-2xl shadow-cyan-950/50 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-cyan-500/20 bg-gradient-to-r from-[#071322] via-[#091a30] to-[#050b14] flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-950 border border-cyan-400/40 text-cyan-300 flex items-center justify-center shadow-lg shadow-cyan-950/50">
              <Brain className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-tight">
                  {locale === 'en' ? 'AI Memory & Assessment History' : 'Paměť AI & Historie Posudků'}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold">
                  {userName}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Přehled osobního profilu, biometrických faktů a časová osa nákupních protokolů.
              </p>
            </div>
          </div>

          {/* Integrated Clean Cyberglass Pill Tabs */}
          <div className="hidden sm:flex items-center gap-1.5 bg-[#050c18] p-1 rounded-2xl border border-cyan-500/20">
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-400/50 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Protokoly ({(assessments || []).length})</span>
            </button>

            <button
              onClick={() => setActiveTab('prompts')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'prompts'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-400/50 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Prompty ({(completedPrompts || []).length})</span>
            </button>

            <button
              onClick={() => setActiveTab('facts')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'facts'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-400/50 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Fakta ({(facts || []).length})</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>



        {/* Global explanation banner */}
        <div className="mx-5 sm:mx-6 mt-4 p-3 rounded-2xl bg-[#081528] border border-cyan-500/25 text-xs text-slate-300">
          <div className="flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Při každém dalším dotazu agent nezačíná od nuly. Vytáhne z paměti vaše minulé specifikace i preferenční fakta 
              a automaticky sestaví <strong>kontextově obohacený prompt</strong>. Hotové prompty se ukládají výhradně po dokončení posledního kroku.
            </p>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">

          {/* TOP CARD: OSOBNÍ PROFIL A KLÍČOVÉ BIOMETRICKÉ ÚDAJE UŽIVATELE (ALWAYS VISIBLE AT TOP) */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#081628] to-[#0a1e36] border border-cyan-500/40 shadow-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyan-500/20 pb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-400/40 text-cyan-300 flex items-center justify-center font-bold text-xs">
                  <User className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-white">{userName}</span>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold uppercase">
                      Aktivní osobní profil
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    Osobní & biometrické údaje používané automaticky pro obohacení AI promptů
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setActiveTab('facts');
                  setIsAdding(true);
                }}
                className="text-xs font-mono font-semibold text-cyan-300 hover:text-white flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-950/80 border border-cyan-500/30 transition-all cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5 text-cyan-400" />
                <span>Přidat profilový fakt</span>
              </button>
            </div>

            {/* Display Personal & Biometric Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 font-mono text-xs">
              {/* Item 1: Jméno */}
              <div className="p-2.5 rounded-xl bg-[#050c18] border border-cyan-500/20 flex flex-col justify-between">
                <span className="text-[9px] text-slate-400 uppercase font-bold flex items-center gap-1">
                  <User className="w-3 h-3 text-cyan-400" />
                  Jméno & Uživatel
                </span>
                <span className="font-bold text-white text-xs mt-1 truncate">{userName}</span>
              </div>

              {/* Display active biometric & medical facts */}
              {personalBiometricFacts.length > 0 ? (
                personalBiometricFacts.map((fact) => (
                  <div
                    key={fact.id}
                    className={`p-2.5 rounded-xl border flex flex-col justify-between transition-colors ${
                      fact.isEnriched !== false ? 'bg-[#050c18] border-cyan-500/30 text-white' : 'bg-[#040812] border-slate-800 text-slate-500 opacity-60'
                    }`}
                  >
                    <span className="text-[9px] text-slate-400 uppercase font-bold flex items-center gap-1 truncate">
                      <Fingerprint className="w-3 h-3 text-cyan-400 shrink-0" />
                      {formatValueDisplay(fact.label)}
                    </span>
                    <span className="font-bold text-cyan-300 text-xs mt-1 truncate">
                      {formatValueDisplay(fact.value)}
                    </span>
                  </div>
                ))
              ) : (
                <>
                  <div className="p-2.5 rounded-xl bg-[#050c18] border border-slate-800/80 flex flex-col justify-between opacity-80">
                    <span className="text-[9px] text-slate-400 uppercase font-bold flex items-center gap-1">
                      <Fingerprint className="w-3 h-3 text-purple-400" />
                      Biometrie & Míry
                    </span>
                    <span className="font-semibold text-slate-300 text-xs mt-1">Automaticky z dotazníků</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#050c18] border border-slate-800/80 flex flex-col justify-between opacity-80">
                    <span className="text-[9px] text-slate-400 uppercase font-bold flex items-center gap-1">
                      <Heart className="w-3 h-3 text-teal-400" />
                      Pohybová citlivost
                    </span>
                    <span className="font-semibold text-slate-300 text-xs mt-1">Zapojeno v RAG paměti</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* TAB 1: HISTORIE DOKONČENÝCH ASSESMENTŮ */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  Uložené nákupní protokoly a specifikace s datem:
                </span>
                <span className="text-[10px] font-mono text-cyan-400">
                  {(assessments || []).length} záznamů v databázi
                </span>
              </div>

              {(assessments || []).length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs">Zatím nemáte dokončené žádné vyhodnocení.</p>
                  <p className="text-[11px] text-slate-500">
                    Spusťte libovolného nákupního agenta a vygenerujte své první doporučení.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(assessments || []).map((assessment) => {
                    const isExpanded = expandedAssessmentId === assessment.id;
                    const paramCount = Object.entries(assessment.keyParameters || {}).filter(([_, val]) => val && val !== 'N/A').length;

                    return (
                      <div
                        key={assessment.id}
                        className="rounded-2xl border border-cyan-500/30 bg-[#071120] overflow-hidden shadow-md transition-all"
                      >
                        {/* Assessment Card Header (Clickable Accordion) */}
                        <div
                          onClick={() => setExpandedAssessmentId(isExpanded ? null : assessment.id)}
                          className="p-4 bg-[#091526] hover:bg-[#0c1c34] transition-colors cursor-pointer flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-300 flex items-center justify-center font-mono text-xs font-bold shrink-0">
                              <Activity className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-extrabold text-sm text-white">
                                  {assessment.missionName}
                                </span>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 font-semibold">
                                  {assessment.status === 'active_prescription' ? 'Aktivní doporučení' : 'Archiv'}
                                </span>
                                {paramCount > 0 && (
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700/80 font-semibold">
                                    {paramCount} specifikací
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400 mt-0.5">
                                <span className="flex items-center gap-1 text-cyan-300 font-bold">
                                  <Clock className="w-3 h-3" />
                                  {assessment.dateFormatted}
                                </span>
                                <span>•</span>
                                <span>{assessment.doctorAgentName}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteAssessment?.(assessment.id);
                              }}
                              className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg transition-colors cursor-pointer"
                              title="Smazat protokol z historie"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <ChevronRight className={`w-4 h-4 text-cyan-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                          </div>
                        </div>

                        {/* Collapsible Content Body */}
                        {isExpanded && (
                          <div className="p-4 space-y-3 text-xs border-t border-cyan-500/15 animate-in fade-in">
                            <div>
                              <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                                Nákupní profil & specifika:
                              </span>
                              <p className="font-bold text-white text-xs leading-snug">
                                {assessment.diagnosisSummary}
                              </p>
                            </div>

                            {/* Dynamic Key Parameters Badges */}
                            {paramCount > 0 && (
                              <div className="flex flex-wrap gap-2 pt-1">
                                {Object.entries(assessment.keyParameters || {})
                                  .filter(([_, val]) => val && val !== 'N/A')
                                  .map(([key, val]) => {
                                    const displayKey = key === 'weight' ? 'Váha' : key === 'width' ? 'Šířka' : key === 'knee' ? 'Klouby' : key === 'dropLimit' ? 'Limit dropu' : key;
                                    return (
                                      <div key={key} className="px-2.5 py-1.5 rounded-xl bg-[#050c18] border border-slate-800 text-center shrink-0">
                                        <span className="text-[9px] font-mono text-slate-400 block uppercase">{displayKey}</span>
                                        <span className="font-mono font-bold text-cyan-300 text-xs">{formatValueDisplay(val)}</span>
                                      </div>
                                    );
                                  })}
                              </div>
                            )}

                            {/* Recommended Models List inside Assessment */}
                            <div className="pt-3 border-t border-cyan-500/15 space-y-2.5">
                              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block font-bold">
                                Vygenerovaná doporučení ({(assessment.recommendedModels || []).length} modely):
                              </span>

                              <div className="space-y-2">
                                {(assessment.recommendedModels || []).map((shoe) => (
                                  <div
                                    key={shoe.id}
                                    className="p-3 rounded-xl bg-[#050c18] border border-cyan-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                                  >
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-extrabold text-white text-xs">
                                          {shoe.brand} {shoe.model}
                                        </span>
                                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                                          {shoe.badge}
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                                        {shoe.rationale}
                                      </p>
                                    </div>

                                    <div className="text-right shrink-0">
                                      {shoe.priceCzk > 0 && (
                                        <span className="font-mono font-bold text-cyan-300 text-xs block">
                                          {shoe.priceCzk.toLocaleString('cs-CZ')} Kč
                                        </span>
                                      )}
                                      <span className="text-[9px] font-mono text-slate-400">
                                        Shoda: {shoe.matchScore}%
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-[11px] text-slate-300 leading-relaxed mt-2">
                                <strong className="text-cyan-200 block mb-0.5">Expertní zpráva nákupního poradce a odůvodnění:</strong>
                                {assessment.clinicalReport}
                              </div>

                              {/* Completed Prompt (Saved after final step) */}
                              {assessment.completedPrompt && (
                                <div className="p-3.5 rounded-xl bg-[#040914] border border-cyan-500/30 space-y-2 mt-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-300">
                                      <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                                      <span>Finální prompt (uložen po posledním kroku)</span>
                                    </div>
                                    <button
                                      onClick={() => copyToClipboard(assessment.completedPrompt!, assessment.id)}
                                      className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-[11px] font-mono text-cyan-300 border border-cyan-500/30 flex items-center gap-1 transition-colors cursor-pointer"
                                    >
                                      <Copy className="w-3 h-3" />
                                      <span>{copiedPromptId === assessment.id ? 'Zkopírováno!' : 'Kopírovat'}</span>
                                    </button>
                                  </div>
                                  <div className="rounded-lg bg-slate-950 p-3 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap max-h-44 overflow-y-auto border border-slate-800/80 selection:bg-cyan-500/30">
                                    {assessment.completedPrompt}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: HOTOVÉ PROMPTY (ULOŽENÉ PO POSLEDNÍM KROKU) */}
          {activeTab === 'prompts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  Uložené hotové prompty po dokončení dotazníku ({(completedPrompts || []).length}):
                </span>
                {(completedPrompts || []).length > 0 && (
                  <button
                    onClick={handleClearAllPrompts}
                    className="text-[10px] font-mono text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>{locale === 'en' ? 'Clear All Prompts' : 'Smazat všechny prompty'}</span>
                  </button>
                )}
              </div>

              <div className="p-3.5 rounded-2xl bg-[#081528] border border-cyan-500/25 text-xs text-slate-300 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  <strong>Pravidlo perzistence:</strong> Zde se ukládají <strong>výhradně hotové prompty</strong> po úspěšném projití a odeslání posledního kroku dotazníku. Žádné rozpracované mezikroky se do úložiště neukládají.
                </p>
              </div>

              {(completedPrompts || []).length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Terminal className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs font-semibold text-slate-300">Zatím nemáte uložený žádný dokončený prompt.</p>
                  <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                    Dokončete všechny kroky dotazníku nákupního agenta a po vygenerování doporučení se finální prompt automaticky uloží do této knihovny.
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {(completedPrompts || []).map((cp) => (
                    <div key={cp.id} className="rounded-2xl border border-cyan-500/30 bg-[#071120] p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyan-500/15 pb-2.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-white">{cp.agentName}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/90 text-cyan-300 border border-cyan-500/40">
                            {cp.category}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {cp.dateFormatted}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 self-end sm:self-auto">
                          <button
                            onClick={() => PromptStorageService.downloadPromptMarkdown(cp)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs transition-colors cursor-pointer"
                            title="Stáhnout prompt jako .md soubor"
                          >
                            <Download className="w-3.5 h-3.5 text-cyan-400" />
                          </button>
                          <button
                            onClick={() => copyToClipboard(cp.prompt, cp.id)}
                            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-mono text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Copy className="w-3 h-3" />
                            <span>{copiedPromptId === cp.id ? 'Zkopírováno!' : 'Kopírovat'}</span>
                          </button>
                          <button
                            onClick={() => handleDeletePrompt(cp.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Smazat tento prompt z historie"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {cp.answersSummary && (
                        <p className="text-[11px] font-mono text-cyan-300/80 bg-[#050c18] px-3 py-1.5 rounded-lg border border-slate-800/80">
                          {formatValueDisplay(cp.answersSummary)}
                        </p>
                      )}

                      <div className="rounded-xl bg-slate-950 p-3.5 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto border border-slate-800/90 selection:bg-cyan-500/30">
                        {cp.prompt}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: BIOMECHANICKÁ A PREFERENČNÍ FAKTA PRO PROMPT */}
          {activeTab === 'facts' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  Aktivní fakta pro obohacení promptu (RAG):
                </span>
                <button
                  onClick={() => setIsAdding(!isAdding)}
                  className="text-xs font-semibold text-cyan-300 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAdding ? 'Zavřít formulář' : 'Přidat ergonomický fakt'}</span>
                </button>
              </div>

              {/* Add Fact Form */}
              {isAdding && (
                <form onSubmit={handleCreateFact} className="p-4 rounded-2xl bg-[#0a1526] border border-cyan-400/40 space-y-3 mb-3 animate-in fade-in">
                  <span className="text-xs font-bold text-white block">
                    Nový ergonomický nebo preferenční záznam do databáze:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Název / Parametr:</label>
                      <input
                        type="text"
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        placeholder="Např. Citlivější koleno, Šířka nártu..."
                        className="w-full bg-[#050c18] border border-cyan-500/30 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-slate-600 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Kategorie:</label>
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value as any)}
                        className="w-full bg-[#050c18] border border-cyan-500/30 rounded-xl px-3 py-1.5 text-xs text-white outline-none"
                      >
                        <option value="medical">Pohybová citlivost & komfort</option>
                        <option value="biometrics">{locale === 'en' ? 'Biometrics & Dimensions' : 'Biometrie & Rozměry'}</option>
                        <option value="preference">Značková preference</option>
                        <option value="history">Nákupní historie</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Detailní hodnota / pravidlo pro doporučení:</label>
                    <input
                      type="text"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      placeholder="Např. Potřeba měkkého tlumení paty, vyloučit úzká kopyta..."
                      className="w-full bg-[#050c18] border border-cyan-500/30 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-slate-600 outline-none"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAdding(false)}
                      className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                    >
                      Zrušit
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
                    >
                      {locale === 'en' ? 'Save to DB' : 'Uložit do DB'}
                    </button>
                  </div>
                </form>
              )}

              {/* Facts list */}
              <div className="space-y-2">
                {(facts || []).length === 0 ? (
                  <div className="py-8 text-center text-slate-400 space-y-2 border border-dashed border-slate-800 rounded-2xl p-6">
                    <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-xs font-medium text-slate-300">Zatím nemáte uložena žádná specifická fakta.</p>
                    <p className="text-[11px] text-slate-500">
                      Klikněte na „Přidat ergonomický fakt“ výše pro přidání vlastních kritérií, rozměrů či preferencí.
                    </p>
                  </div>
                ) : (
                  (facts || []).map((fact) => {
                  const categoryBadge = 
                    fact.category === 'medical' ? { label: locale === 'en' ? 'Ergonomics & Health' : 'Ergonomie & komfort', color: 'border-teal-500/30 text-teal-300 bg-teal-950/40' } :
                    fact.category === 'biometrics' ? { label: 'Biometrie', color: 'border-purple-500/30 text-purple-300 bg-purple-950/40' } :
                    fact.category === 'preference' ? { label: 'Preference', color: 'border-cyan-500/30 text-cyan-300 bg-cyan-950/40' } :
                    { label: 'Historie', color: 'border-teal-500/30 text-teal-300 bg-teal-950/40' };

                  return (
                    <div
                      key={fact.id}
                      className={`p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                        fact.isEnriched
                          ? 'bg-[#091424] border-cyan-500/30 text-slate-200'
                          : 'bg-[#050a14] border-slate-800/80 text-slate-500 opacity-60'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={fact.isEnriched}
                          onChange={() => onToggleFact?.(fact.id)}
                          className="mt-1 w-4 h-4 rounded text-cyan-500 bg-slate-900 border-slate-700 focus:ring-cyan-500 cursor-pointer"
                          title="Zaškrtněte pro vložení tohoto faktu do RAG obohacení promptu"
                        />
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-bold text-xs text-white">
                              {formatValueDisplay(fact.label)}
                            </span>
                            <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full border ${categoryBadge.color}`}>
                              {categoryBadge.label}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 leading-snug">
                            {formatValueDisplay(fact.value)}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1 font-mono">
                            <span>Zdroj: {fact.source}</span>
                            <span>•</span>
                            <span>Aktualizováno: {fact.updatedAt}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => onDeleteFact?.(fact.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded-lg transition-colors cursor-pointer"
                        title="{locale === 'en' ? 'Delete fact from database' : 'Smazat fakt z databáze'}"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-cyan-500/20 bg-[#081222] flex items-center justify-between">
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              Aktivní RAG: <strong>{activeFactsCount} faktů</strong> a <strong>{assessments.length} zpráv</strong> připraveno k obohacení promptu.
            </span>
          </span>

          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:brightness-110 text-slate-950 font-bold text-xs transition-all cursor-pointer shadow-md shadow-cyan-950/50"
          >
            Zavřít
          </button>
        </div>
      </div>
    </div>
  );
};
