'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  RotateCcw, 
  Check, 
  Tag, 
  MessageSquarePlus, 
  Database, 
  ArrowRight,
  SlidersHorizontal,
  Flame
} from 'lucide-react';

interface FeedbackTag {
  id: string;
  label: string;
  icon?: string;
  ruleCategory: 'budget' | 'brand' | 'mechanics' | 'aesthetic';
}

const POPULAR_FEEDBACK_TAGS: FeedbackTag[] = [
  { id: 'budget_under_3500', label: '💰 Chci nižší cenu (do 3 500 Kč)', ruleCategory: 'budget' },
  { id: 'lightweight_dynamic', label: '🪶 Chci lehčí / svižnější model', ruleCategory: 'mechanics' },
  { id: 'exclude_asics', label: '🚫 Vyřadit značku ASICS', ruleCategory: 'brand' },
  { id: 'exclude_hoka', label: '🚫 Vyřadit značku Hoka', ruleCategory: 'brand' },
  { id: 'more_ankle_stability', label: '🛡️ Vyšší torzní stabilita kotníku', ruleCategory: 'mechanics' },
  { id: 'moderate_cushion', label: '⚡ Střídmější podešev (méně mohutné tlumení)', ruleCategory: 'mechanics' },
  { id: 'gravel_capable', label: '🌲 Univerzál: asfalt i polní cesty', ruleCategory: 'mechanics' },
];

interface AssessmentFeedbackLoopProps {
  currentModelsCount: number;
  onApplyFeedback: (feedbackSummary: string, activeTags: string[], customNote: string) => void;
  isRecalculating?: boolean;
}

export const AssessmentFeedbackLoop: React.FC<AssessmentFeedbackLoopProps> = ({
  currentModelsCount,
  onApplyFeedback,
  isRecalculating = false,
}) => {
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [customNote, setCustomNote] = useState<string>('');
  const [feedbackAppliedSuccess, setFeedbackAppliedSuccess] = useState<boolean>(false);
  const [lastSavedFact, setLastSavedFact] = useState<string | null>(null);

  const toggleTag = (id: string) => {
    setSelectedTagIds((prev) => 
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleTriggerRefinement = () => {
    if (selectedTagIds.length === 0 && !customNote.trim()) return;

    const chosenLabels = POPULAR_FEEDBACK_TAGS
      .filter((t) => selectedTagIds.includes(t.id))
      .map((t) => t.label.replace(/^[^\s]+\s/, ''));

    const summaryParts: string[] = [];
    if (chosenLabels.length > 0) {
      summaryParts.push(chosenLabels.join(', '));
    }
    if (customNote.trim()) {
      summaryParts.push(`„${customNote.trim()}“`);
    }

    const fullSummary = summaryParts.join(' • ');
    setLastSavedFact(fullSummary);

    // Invoke parent callback to update recommendations and persist into RAG DB
    onApplyFeedback(fullSummary, selectedTagIds, customNote.trim());

    setFeedbackAppliedSuccess(true);
    // Clear inputs after submitting
    setSelectedTagIds([]);
    setCustomNote('');

    setTimeout(() => {
      setFeedbackAppliedSuccess(false);
    }, 6000);
  };

  const hasInputs = selectedTagIds.length > 0 || customNote.trim().length > 0;

  return (
    <div className="w-full rounded-3xl bg-gradient-to-b from-[#081528] via-[#050c18] to-[#040812] border-2 border-cyan-500/35 p-6 sm:p-7 shadow-[0_15px_50px_rgba(6,182,212,0.15)] relative overflow-hidden mt-6">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-cyan-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-950 border border-cyan-400/40 text-cyan-300 flex items-center justify-center font-bold shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <SlidersHorizontal className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-extrabold text-white">
                Interaktivní zpětná vazba & RAG ladění modelů
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold uppercase tracking-wider">
                Učící se smyčka
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Nesedí vám cena, značka nebo pocit z bot? Vyberte úpravu a agent okamžitě přepočítá doporučení a uloží si preferenci do RAG paměti.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 shrink-0">
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          <span>Ukládá se do vašeho profilu</span>
        </div>
      </div>

      {/* Quick Feedback Chips Grid */}
      <div className="py-4 space-y-2.5">
        <label className="text-[11px] font-mono uppercase tracking-wider text-cyan-300 font-bold flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-cyan-400" />
          <span>Rychlá zpětná vazba (kliknutím vyberte):</span>
        </label>

        <div className="flex flex-wrap gap-2">
          {POPULAR_FEEDBACK_TAGS.map((tag) => {
            const isSelected = selectedTagIds.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                  isSelected
                    ? 'bg-cyan-950 text-white border-2 border-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.45)] ring-1 ring-cyan-400 scale-[1.02]'
                    : 'bg-[#091526]/80 text-slate-300 hover:text-white border border-cyan-500/20 hover:border-cyan-500/50 hover:bg-[#0d1e36]'
                }`}
              >
                <span>{tag.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-cyan-300" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Note Input */}
      <div className="space-y-2 pt-1">
        <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <MessageSquarePlus className="w-3.5 h-3.5 text-slate-400" />
          <span>Vlastní instrukce pro asistenta (volitelné):</span>
        </label>
        
        <div className="relative">
          <input
            type="text"
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && hasInputs && !isRecalculating) {
                e.preventDefault();
                handleTriggerRefinement();
              }
            }}
            placeholder="Např. Hledám spíše neutrální tlumení na asfalt i polní cesty, nemám rád příliš křiklavé barvy..."
            className="w-full bg-[#040a16] border border-cyan-500/30 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all"
          />
        </div>
      </div>

      {/* Action Footer Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-5 mt-4 border-t border-cyan-500/15">
        <div className="text-xs text-slate-400">
          {hasInputs ? (
            <span className="text-cyan-300 font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>Připraveno: {selectedTagIds.length} filtrů {customNote.trim() && '+ vlastní poznámka'}</span>
            </span>
          ) : (
            <span className="text-slate-400">
              Vyberte jeden či více štítků nebo vepište svou poznámku.
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleTriggerRefinement}
          disabled={!hasInputs || isRecalculating}
          className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-extrabold bg-gradient-to-r from-cyan-400 via-cyan-300 to-teal-400 text-slate-950 shadow-[0_0_25px_rgba(6,182,212,0.45)] hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
        >
          <RotateCcw className={`w-4 h-4 text-slate-950 ${isRecalculating ? 'animate-spin' : ''}`} />
          <span>
            {isRecalculating 
              ? 'Přepočítávám a ukládám do RAG...' 
              : '🔄 Přepočítat doporučení s mou zpětnou vazbou'}
          </span>
        </button>
      </div>

      {/* Dynamic Success Confirmation & RAG Fact Indicator */}
      {feedbackAppliedSuccess && lastSavedFact && (
        <div className="mt-4 p-4 rounded-2xl bg-cyan-950/80 border border-cyan-400/60 shadow-[0_0_20px_rgba(34,211,238,0.25)] flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="w-6 h-6 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
            <Check className="w-3.5 h-3.5" />
          </div>
          <div className="space-y-1 text-xs">
            <div className="font-extrabold text-white flex items-center gap-2">
              <span>Zpětná vazba uložena do RAG databáze & doporučení aktualizována</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-900/90 text-cyan-200 border border-cyan-400/40">
                Učící se fakt
              </span>
            </div>
            <p className="text-slate-300 font-mono text-[11px]">
              {lastSavedFact}
            </p>
            <p className="text-cyan-300/80 text-[10px]">
              Tato preference je nyní aktivní v záložce „RAG Paměť“ a asistent ji aplikuje i při budoucím vyhodnocení.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
