'use client';

import { useI18n } from "@/lib/i18n/I18nContext";
import React, { useState, useEffect, useMemo } from "react";
import { 
  X, 
  Plus, 
  Trash2, 
  ChevronRight, 
  Copy, 
  Download 
} from "lucide-react";
import { PersistentMemoryFact, CompletedAssessmentRecord, formatValueDisplay } from "@/lib/agent/engine-config";
import { PromptStorageService, CompletedPromptRecord } from "@/lib/agent/prompt-storage-service";

interface UserRAGMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  facts: PersistentMemoryFact[];
  assessments: CompletedAssessmentRecord[];
  userName?: string;
  onToggleFact: (factId: string) => void;
  onAddFact: (label: string, value: string, category: "biometrics" | "medical" | "preference" | "history") => void;
  onDeleteFact: (factId: string) => void;
  onDeleteAssessment: (assessmentId: string) => void;
}

export const UserRAGMemoryModal: React.FC<UserRAGMemoryModalProps> = ({
  isOpen,
  onClose,
  facts = [],
  assessments = [],
  userName = "Jan Mynář",
  onToggleFact,
  onAddFact,
  onDeleteFact,
  onDeleteAssessment,
}) => {
  const { locale } = useI18n();
  const [activeTab, setActiveTab] = useState<"history" | "prompts" | "facts">("history");
  const [expandedAssessmentId, setExpandedAssessmentId] = useState<string | null>(null);

  // Form for adding new manual fact
  const [isAdding, setIsAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newCategory, setNewCategory] = useState<"biometrics" | "medical" | "preference" | "history">("medical");

  // Storage of completed prompts
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
      (f) => f.category === "biometrics" || f.category === "medical" || f.category === "preference"
    );
  }, [facts]);

  if (!isOpen) return null;

  const activeFactsCount = (facts || []).filter((f) => f.isEnriched).length;

  const handleCreateFact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel || !newValue) return;
    onAddFact?.(newLabel, newValue, newCategory);
    setNewLabel("");
    setNewValue("");
    setIsAdding(false);
  };

  const handleDeletePrompt = (id: string) => {
    PromptStorageService.deleteCompletedPrompt(id);
    setCompletedPrompts(PromptStorageService.getCompletedPrompts());
  };

  const handleClearAllPrompts = () => {
    const confirmMsg = locale === "en" 
      ? "Are you sure you want to delete all saved completed prompts?" 
      : "Opravdu chcete smazat všechny uložené dokončené prompty?";
    if (window.confirm(confirmMsg)) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 bg-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-[#263238] tracking-tight">
                {locale === "en" ? "AI Memory & Assessment History" : "Paměť AI & Historie Posudků"}
              </h2>
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#e1f5fe] text-[#01579b] border border-[#b3e5fc] font-bold">
                {userName}
              </span>
            </div>
            <p className="text-xs text-[#546e7a] mt-0.5">
              {locale === "en" 
                ? "Overview of personal profile, biometric facts, and timeline of shopping protocols." 
                : "Přehled osobního profilu, biometrických faktů a časová osa nákupních protokolů."}
            </p>
          </div>

          {/* Segmented Control Tabs */}
          <div className="hidden sm:flex items-center gap-1 bg-[#f4f6f8] p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab("history")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "history"
                  ? "bg-[#0099cc] text-white shadow-xs"
                  : "text-[#546e7a] hover:text-[#263238] hover:bg-white/60"
              }`}
            >
              <span>{locale === "en" ? "Protocols" : "Protokoly"} ({(assessments || []).length})</span>
            </button>

            <button
              onClick={() => setActiveTab("prompts")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "prompts"
                  ? "bg-[#0099cc] text-white shadow-xs"
                  : "text-[#546e7a] hover:text-[#263238] hover:bg-white/60"
              }`}
            >
              <span>{locale === "en" ? "Prompts" : "Prompty"} ({(completedPrompts || []).length})</span>
            </button>

            <button
              onClick={() => setActiveTab("facts")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "facts"
                  ? "bg-[#0099cc] text-white shadow-xs"
                  : "text-[#546e7a] hover:text-[#263238] hover:bg-white/60"
              }`}
            >
              <span>{locale === "en" ? "Facts" : "Fakta"} ({(facts || []).length})</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#546e7a] hover:text-[#263238] hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label={locale === "en" ? "Close" : "Zavřít"}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Explanation Banner */}
        <div className="mx-5 sm:mx-6 mt-4 p-3.5 rounded-xl bg-[#e1f5fe] border border-[#b3e5fc] text-xs text-[#014377] leading-relaxed">
          <p className="text-xs text-[#014377] leading-relaxed">
            {locale === "en"
              ? "On every new query, the agent never starts from scratch. It retrieves your past specifications and preference facts from memory to automatically compile a contextually enriched prompt. Completed prompts are saved exclusively after finishing the final step."
              : "Při každém dalším dotazu agent nezačíná od nuly. Vytáhne z paměti vaše minulé specifikace i preferenční fakta a automaticky sestaví kontextově obohacený prompt. Hotové prompty se ukládají výhradně po dokončení posledního kroku."}
          </p>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">

          {/* TOP CARD: OSOBNÍ PROFIL A KLÍČOVÉ BIOMETRICKÉ ÚDAJE */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-[#263238]">{userName}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#e1f5fe] text-[#01579b] border border-[#b3e5fc] font-bold uppercase">
                    {locale === "en" ? "Active Personal Profile" : "Aktivní osobní profil"}
                  </span>
                </div>
                <span className="text-[11px] text-[#546e7a]">
                  {locale === "en"
                    ? "Personal & biometric data used automatically to enrich AI prompts"
                    : "Osobní & biometrické údaje používané automaticky pro obohacení AI promptů"}
                </span>
              </div>

              <button
                onClick={() => {
                  setActiveTab("facts");
                  setIsAdding(true);
                }}
                className="text-xs font-semibold text-[#01579b] hover:text-[#004275] flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 shadow-2xs transition-all cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5 text-[#0099cc]" />
                <span>{locale === "en" ? "Add profile fact" : "Přidat profilový fakt"}</span>
              </button>
            </div>

            {/* Display Personal & Biometric Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex flex-col justify-between shadow-2xs">
                <span className="text-[10px] text-[#546e7a] uppercase font-bold tracking-wide font-mono">
                  {locale === "en" ? "Name & User" : "Jméno & Uživatel"}
                </span>
                <span className="font-bold text-[#263238] text-xs mt-1 truncate">{userName}</span>
              </div>

              {personalBiometricFacts.length > 0 ? (
                personalBiometricFacts.map((fact) => (
                  <div
                    key={fact.id}
                    className={`p-2.5 rounded-xl border flex flex-col justify-between transition-colors shadow-2xs ${
                      fact.isEnriched !== false
                        ? "bg-white border-slate-200 text-[#263238]"
                        : "bg-slate-50 border-slate-200 text-[#546e7a] opacity-60"
                    }`}
                  >
                    <span className="text-[10px] text-[#546e7a] uppercase font-bold tracking-wide font-mono truncate">
                      {formatValueDisplay(fact.label)}
                    </span>
                    <span className="font-bold text-[#0277bd] text-xs mt-1 truncate">
                      {formatValueDisplay(fact.value)}
                    </span>
                  </div>
                ))
              ) : (
                <>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex flex-col justify-between shadow-2xs">
                    <span className="text-[10px] text-[#546e7a] uppercase font-bold tracking-wide font-mono">
                      {locale === "en" ? "Biometrics & Dimensions" : "Biometrie & Míry"}
                    </span>
                    <span className="font-semibold text-[#546e7a] text-xs mt-1">
                      {locale === "en" ? "Automatically from questionnaires" : "Automaticky z dotazníků"}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex flex-col justify-between shadow-2xs">
                    <span className="text-[10px] text-[#546e7a] uppercase font-bold tracking-wide font-mono">
                      {locale === "en" ? "Motion Sensitivity" : "Pohybová citlivost"}
                    </span>
                    <span className="font-semibold text-[#546e7a] text-xs mt-1">
                      {locale === "en" ? "Integrated in RAG memory" : "Zapojeno v RAG paměti"}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* TAB 1: HISTORIE DOKONČENÝCH PROTOKOLŮ */}
          {activeTab === "history" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-[#546e7a]">
                  {locale === "en" ? "Saved shopping protocols and specifications with date:" : "Uložené nákupní protokoly a specifikace s datem:"}
                </span>
                <span className="text-xs font-mono font-bold text-[#0277bd]">
                  {(assessments || []).length} {locale === "en" ? "records in database" : "záznamů v databázi"}
                </span>
              </div>

              {(assessments || []).length === 0 ? (
                <div className="py-12 text-center text-[#546e7a] space-y-2 border border-dashed border-slate-200 rounded-xl p-8">
                  <p className="text-xs font-semibold text-[#263238]">
                    {locale === "en" ? "No completed evaluations yet." : "Zatím nemáte dokončené žádné vyhodnocení."}
                  </p>
                  <p className="text-[11px] text-[#546e7a]">
                    {locale === "en"
                      ? "Launch any shopping advisor agent and generate your first recommendation."
                      : "Spusťte libovolného nákupního agenta a vygenerujte své první doporučení."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(assessments || []).map((assessment) => {
                    const isExpanded = expandedAssessmentId === assessment.id;
                    const paramCount = Object.entries(assessment.keyParameters || {}).filter(([_, val]) => val && val !== "N/A").length;

                    return (
                      <div
                        key={assessment.id}
                        className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs hover:border-slate-300 transition-all"
                      >
                        {/* Assessment Card Header */}
                        <div
                          onClick={() => setExpandedAssessmentId(isExpanded ? null : assessment.id)}
                          className="p-3.5 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer flex items-center justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-sm text-[#263238]">
                                {assessment.missionName}
                              </span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#e1f5fe] text-[#01579b] border border-[#b3e5fc] font-semibold">
                                {assessment.status === "active_prescription"
                                  ? (locale === "en" ? "Active recommendation" : "Aktivní doporučení")
                                  : (locale === "en" ? "Archive" : "Archiv")}
                              </span>
                              {paramCount > 0 && (
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-[#546e7a] border border-slate-200 font-semibold">
                                  {paramCount} {locale === "en" ? "specs" : "specifikací"}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-[#546e7a] mt-0.5 font-sans">
                              <span className="text-[#0277bd] font-semibold">
                                {assessment.dateFormatted}
                              </span>
                              <span>•</span>
                              <span>{assessment.doctorAgentName}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteAssessment?.(assessment.id);
                              }}
                              className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                              title={locale === "en" ? "Delete protocol from history" : "Smazat protokol z historie"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <ChevronRight className={`w-4 h-4 text-[#546e7a] transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} />
                          </div>
                        </div>

                        {/* Collapsible Content Body */}
                        {isExpanded && (
                          <div className="p-4 space-y-3 text-xs border-t border-slate-200 bg-white animate-in fade-in">
                            <div>
                              <span className="text-[10px] font-mono text-[#546e7a] uppercase block mb-1 font-bold">
                                {locale === "en" ? "Shopping profile & specifics:" : "Nákupní profil & specifika:"}
                              </span>
                              <p className="font-bold text-[#263238] text-xs leading-snug">
                                {assessment.diagnosisSummary}
                              </p>
                            </div>

                            {/* Dynamic Key Parameters Badges */}
                            {paramCount > 0 && (
                              <div className="flex flex-wrap gap-2 pt-1">
                                {Object.entries(assessment.keyParameters || {})
                                  .filter(([_, val]) => val && val !== "N/A")
                                  .map(([key, val]) => {
                                    const displayKey = key === "weight" ? "Váha" : key === "width" ? "Šířka" : key === "knee" ? "Klouby" : key === "dropLimit" ? "Limit dropu" : key;
                                    return (
                                      <div key={key} className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-center shrink-0">
                                        <span className="text-[10px] font-mono text-[#546e7a] block uppercase font-bold">{displayKey}</span>
                                        <span className="font-mono font-bold text-[#0277bd] text-xs">{formatValueDisplay(val)}</span>
                                      </div>
                                    );
                                  })}
                              </div>
                            )}

                            {/* Recommended Models List inside Assessment */}
                            <div className="pt-3 border-t border-slate-200 space-y-2.5">
                              <span className="text-[10px] font-mono text-[#01579b] uppercase tracking-wider block font-bold">
                                {locale === "en" ? "Generated recommendations" : "Vygenerovaná doporučení"} ({(assessment.recommendedModels || []).length}):
                              </span>

                              <div className="space-y-2">
                                {(assessment.recommendedModels || []).map((shoe) => (
                                  <div
                                    key={shoe.id}
                                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                                  >
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-extrabold text-[#263238] text-xs">
                                          {shoe.brand} {shoe.model}
                                        </span>
                                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-[#01579b] border border-slate-200 font-semibold">
                                          {shoe.badge}
                                        </span>
                                      </div>
                                      <p className="text-xs text-[#546e7a] mt-1 leading-snug">
                                        {shoe.rationale}
                                      </p>
                                    </div>

                                    <div className="text-right shrink-0">
                                      {shoe.priceCzk > 0 && (
                                        <span className="font-mono font-bold text-[#0277bd] text-xs block">
                                          {shoe.priceCzk.toLocaleString("cs-CZ")} Kč
                                        </span>
                                      )}
                                      <span className="text-[10px] font-mono text-[#546e7a]">
                                        {locale === "en" ? "Match" : "Shoda"}: {shoe.matchScore}%
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <div className="p-3 rounded-xl bg-[#e1f5fe] border border-[#b3e5fc] text-xs text-[#014377] leading-relaxed mt-2">
                                <strong className="text-[#01579b] block mb-0.5 font-bold">
                                  {locale === "en" ? "Expert advisor report & rationale:" : "Expertní zpráva nákupního poradce a odůvodnění:"}
                                </strong>
                                {assessment.clinicalReport}
                              </div>

                              {/* Completed Prompt (Saved after final step) */}
                              {assessment.completedPrompt && (
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 mt-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-[#01579b]">
                                      {locale === "en" ? "Final prompt (saved after final step)" : "Finální prompt (uložen po posledním kroku)"}
                                    </span>
                                    <button
                                      onClick={() => copyToClipboard(assessment.completedPrompt!, assessment.id)}
                                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-xs font-medium text-[#263238] border border-slate-300 flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                                    >
                                      <Copy className="w-3 h-3 text-[#546e7a]" />
                                      <span>{copiedPromptId === assessment.id ? (locale === "en" ? "Copied!" : "Zkopírováno!") : (locale === "en" ? "Copy" : "Kopírovat")}</span>
                                    </button>
                                  </div>
                                  <div className="rounded-lg bg-white p-3 font-mono text-xs text-[#263238] leading-relaxed whitespace-pre-wrap max-h-44 overflow-y-auto border border-slate-200">
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

          {/* TAB 2: HOTOVÉ PROMPTY */}
          {activeTab === "prompts" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-[#546e7a]">
                  {locale === "en" ? "Saved completed prompts after questionnaire completion" : "Uložené hotové prompty po dokončení dotazníku"} ({(completedPrompts || []).length}):
                </span>
                {(completedPrompts || []).length > 0 && (
                  <button
                    onClick={handleClearAllPrompts}
                    className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>{locale === "en" ? "Clear All Prompts" : "Smazat všechny prompty"}</span>
                  </button>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-[#e1f5fe] border border-[#b3e5fc] text-xs text-[#014377] leading-relaxed">
                <p className="text-xs text-[#014377] leading-relaxed">
                  <strong>{locale === "en" ? "Persistence rule:" : "Pravidlo perzistence:"}</strong> {locale === "en"
                    ? "Only finalized prompts are stored here upon completing the final step of the advisor flow. Unfinished intermediate steps are never stored."
                    : "Zde se ukládají výhradně hotové prompty po úspěšném projití a odeslání posledního kroku dotazníku. Žádné rozpracované mezikroky se do úložiště neukládají."}
                </p>
              </div>

              {(completedPrompts || []).length === 0 ? (
                <div className="py-12 text-center text-[#546e7a] space-y-2 border border-dashed border-slate-200 rounded-xl p-8">
                  <p className="text-xs font-semibold text-[#263238]">
                    {locale === "en" ? "No completed prompts saved yet." : "Zatím nemáte uložený žádný dokončený prompt."}
                  </p>
                  <p className="text-[11px] text-[#546e7a] max-w-md mx-auto">
                    {locale === "en"
                      ? "Complete all steps of an advisor questionnaire, and after generating recommendations the final prompt will automatically be saved to this library."
                      : "Dokončete všechny kroky dotazníku nákupního agenta a po vygenerování doporučení se finální prompt automaticky uloží do této knihovny."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {(completedPrompts || []).map((cp) => (
                    <div key={cp.id} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-[#263238]">{cp.agentName}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#e1f5fe] text-[#01579b] border border-[#b3e5fc] font-semibold">
                            {cp.category}
                          </span>
                          <span className="text-[11px] font-sans text-[#546e7a]">
                            {cp.dateFormatted}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 self-end sm:self-auto">
                          <button
                            onClick={() => PromptStorageService.downloadPromptMarkdown(cp)}
                            className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-[#546e7a] hover:text-[#263238] border border-slate-300 transition-colors cursor-pointer shadow-2xs"
                            title={locale === "en" ? "Download prompt as .md file" : "Stáhnout prompt jako .md soubor"}
                          >
                            <Download className="w-3.5 h-3.5 text-[#0099cc]" />
                          </button>
                          <button
                            onClick={() => copyToClipboard(cp.prompt, cp.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-xs font-medium text-[#263238] border border-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                          >
                            <Copy className="w-3 h-3 text-[#546e7a]" />
                            <span>{copiedPromptId === cp.id ? (locale === "en" ? "Copied!" : "Zkopírováno!") : (locale === "en" ? "Copy" : "Kopírovat")}</span>
                          </button>
                          <button
                            onClick={() => handleDeletePrompt(cp.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title={locale === "en" ? "Delete prompt from history" : "Smazat tento prompt z historie"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {cp.answersSummary && (
                        <p className="text-xs text-[#546e7a] bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                          {formatValueDisplay(cp.answersSummary)}
                        </p>
                      )}

                      <div className="rounded-lg bg-slate-50 p-3 font-mono text-xs text-[#263238] leading-relaxed whitespace-pre-wrap max-h-44 overflow-y-auto border border-slate-200">
                        {cp.prompt}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: OSOBNÍ & BIOMETRICKÁ FAKTA */}
          {activeTab === "facts" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-[#546e7a]">
                  {locale === "en" ? "Personal preferences, biometrics and rules in DB:" : "Osobní preference, biometrie a pravidla v DB:"}
                </span>
                {!isAdding && (
                  <button
                    onClick={() => setIsAdding(true)}
                    className="px-3 py-1.5 rounded-lg bg-[#0099cc] hover:bg-[#0088b8] text-white font-semibold text-xs flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{locale === "en" ? "Add fact" : "Přidat fakt"}</span>
                  </button>
                )}
              </div>

              {/* Form to add fact */}
              {isAdding && (
                <form onSubmit={handleCreateFact} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-[#546e7a] uppercase font-mono font-bold block mb-1">
                        {locale === "en" ? "Label / Criterion name:" : "Název faktu / kritéria:"}
                      </label>
                      <input
                        type="text"
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        placeholder={locale === "en" ? "e.g. Foot width, Brand preference..." : "Např. Šířka chodidla, Značková preference..."}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-[#263238] placeholder:text-slate-400 focus:border-[#0099cc] focus:ring-1 focus:ring-[#0099cc] outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#546e7a] uppercase font-mono font-bold block mb-1">
                        {locale === "en" ? "Category:" : "Kategorie:"}
                      </label>
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value as any)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-[#263238] focus:border-[#0099cc] focus:ring-1 focus:ring-[#0099cc] outline-none"
                      >
                        <option value="medical">{locale === "en" ? "Ergonomics & Comfort" : "Pohybová citlivost & komfort"}</option>
                        <option value="biometrics">{locale === "en" ? "Biometrics & Dimensions" : "Biometrie & Rozměry"}</option>
                        <option value="preference">{locale === "en" ? "Brand & Style Preference" : "Značková preference"}</option>
                        <option value="history">{locale === "en" ? "Purchase History" : "Nákupní historie"}</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-[#546e7a] uppercase font-mono font-bold block mb-1">
                      {locale === "en" ? "Detailed value / rule for recommendation:" : "Detailní hodnota / pravidlo pro doporučení:"}
                    </label>
                    <input
                      type="text"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      placeholder={locale === "en" ? "e.g. Requires soft heel cushioning..." : "Např. Potřeba měkkého tlumení paty, vyloučit úzká kopyta..."}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-[#263238] placeholder:text-slate-400 focus:border-[#0099cc] focus:ring-1 focus:ring-[#0099cc] outline-none"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAdding(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#546e7a] hover:text-[#263238] transition-colors cursor-pointer"
                    >
                      {locale === "en" ? "Cancel" : "Zrušit"}
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-[#0099cc] hover:bg-[#0088b8] text-white font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
                    >
                      {locale === "en" ? "Save to DB" : "Uložit do DB"}
                    </button>
                  </div>
                </form>
              )}

              {/* Facts list */}
              <div className="space-y-2">
                {(facts || []).length === 0 ? (
                  <div className="py-8 text-center text-[#546e7a] space-y-2 border border-dashed border-slate-200 rounded-xl p-6">
                    <p className="text-xs font-semibold text-[#263238]">
                      {locale === "en" ? "No specific facts stored yet." : "Zatím nemáte uložena žádná specifická fakta."}
                    </p>
                    <p className="text-[11px] text-[#546e7a]">
                      {locale === "en"
                        ? "Click 'Add fact' above to add custom criteria, dimensions, or preferences."
                        : "Klikněte na „Přidat fakt“ výše pro přidání vlastních kritérií, rozměrů či preferencí."}
                    </p>
                  </div>
                ) : (
                  (facts || []).map((fact) => {
                    const categoryBadge = 
                      fact.category === "medical" ? { label: locale === "en" ? "Ergonomics & Health" : "Ergonomie & komfort", color: "bg-emerald-50 text-emerald-800 border-emerald-200" } :
                      fact.category === "biometrics" ? { label: locale === "en" ? "Biometrics" : "Biometrie", color: "bg-purple-50 text-purple-800 border-purple-200" } :
                      fact.category === "preference" ? { label: locale === "en" ? "Preference" : "Preference", color: "bg-[#e1f5fe] text-[#01579b] border-[#b3e5fc]" } :
                      { label: locale === "en" ? "History" : "Historie", color: "bg-blue-50 text-blue-800 border-blue-200" };

                    return (
                      <div
                        key={fact.id}
                        className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 shadow-2xs ${
                          fact.isEnriched
                            ? "bg-white border-slate-200 text-[#263238]"
                            : "bg-slate-50 border-slate-200 text-slate-500 opacity-60"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={fact.isEnriched}
                            onChange={() => onToggleFact?.(fact.id)}
                            className="mt-1 w-4 h-4 rounded text-[#0099cc] border-slate-300 focus:ring-[#0099cc] cursor-pointer"
                            title={locale === "en" ? "Check to include in RAG prompt enrichment" : "Zaškrtněte pro vložení tohoto faktu do RAG obohacení promptu"}
                          />
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-bold text-xs text-[#263238]">
                                {formatValueDisplay(fact.label)}
                              </span>
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold ${categoryBadge.color}`}>
                                {categoryBadge.label}
                              </span>
                            </div>
                            <p className="text-xs text-[#455a64] leading-snug">
                              {formatValueDisplay(fact.value)}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-[#546e7a] mt-1 font-mono">
                              <span>{locale === "en" ? "Source" : "Zdroj"}: {fact.source}</span>
                              <span>•</span>
                              <span>{locale === "en" ? "Updated" : "Aktualizováno"}: {fact.updatedAt}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => onDeleteFact?.(fact.id)}
                          className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                          title={locale === "en" ? "Delete fact from database" : "Smazat fakt z databáze"}
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
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-[#f8fafc] flex items-center justify-between">
          <span className="text-xs text-[#546e7a] font-sans">
            {locale === "en" ? (
              <>Active RAG: <strong className="text-[#263238] font-bold">{activeFactsCount} facts</strong> and <strong className="text-[#263238] font-bold">{assessments.length} protocols</strong> ready for prompt enrichment.</>
            ) : (
              <>Aktivní RAG: <strong className="text-[#263238] font-bold">{activeFactsCount} faktů</strong> a <strong className="text-[#263238] font-bold">{assessments.length} zpráv</strong> připraveno k obohacení promptu.</>
            )}
          </span>

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-[#0099cc] hover:bg-[#0088b8] text-white font-semibold text-xs transition-all cursor-pointer shadow-xs"
          >
            {locale === "en" ? "Close" : "Zavřít"}
          </button>
        </div>
      </div>
    </div>
  );
};
