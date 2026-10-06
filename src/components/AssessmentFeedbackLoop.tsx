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
  { id: 'budget_under_3500', label: ' Chci nižší cenu (do 3 500 Kč)', ruleCategory: 'budget' },
  { id: 'lightweight_dynamic', label: ' Chci lehčí / svižnější model', ruleCategory: 'mechanics' },
  { id: 'exclude_asics', label: ' Vyřadit značku ASICS', ruleCategory: 'brand' },
  { id: 'exclude_hoka', label: ' Vyřadit značku Hoka', ruleCategory: 'brand' },
  { id: 'more_ankle_stability', label: '️ Vyšší torzní stabilita kotníku', ruleCategory: 'mechanics' },
  { id: 'moderate_cushion', label: ' Střídmější podešev (méně mohutné tlumení)', ruleCategory: 'mechanics' },
  { id: 'gravel_capable', label: ' Univerzál: asfalt i polní cesty', ruleCategory: 'mechanics' },
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
    <div className="w-full rounded-2xl bg-white border border-slate-200 border-t-4 border-t-[#0099cc] p-6 sm:p-7 shadow-xs relative overflow-hidden mt-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#e1f5fe] border border-[#b3e5fc] text-[#01579b] flex items-center justify-center font-bold shrink-0 shadow-xs">
            <SlidersHorizontal className="w-5 h-5 text-[#01579b]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-[#263238]">
                Interaktivní zpětná vazba & RAG ladění modelů
              </h3>
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-md bg-[#e1f5fe] text-[#01579b] border border-[#b3e5fc] font-bold uppercase tracking-wider">
                Učící se smyčka
              </span>
            </div>
            <p className="text-xs text-[#546e7a] mt-0.5">
              Nesedí vám cena, značka nebo pocit z bot? Vyberte úpravu a agent okamžitě přepočítá doporučení a uloží si preferenci do RAG paměti.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-[#546e7a] shrink-0 font-medium">
          <Database className="w-3.5 h-3.5 text-[#01579b]" />
          <span>Ukládá se do vašeho profilu</span>
        </div>
      </div>

      {/* Quick Feedback Chips Grid */}
      <div className="py-4 space-y-2.5">
        <label className="text-[11px] font-mono uppercase tracking-wider text-[#01579b] font-bold flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-[#01579b]" />
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
                    ? 'bg-[#0099cc] text-white border-2 border-[#0277bd] shadow-xs'
                    : 'bg-[#f8fafc] text-[#263238] hover:text-[#0277bd] border border-slate-200 hover:bg-[#eceff1]'
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
            className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm text-[#263238] placeholder:text-slate-400 focus:border-[#0099cc] focus:outline-none focus:ring-1 focus:ring-[#0099cc] transition-all"
          />
        </div>
      </div>

      {/* Action Footer Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-5 mt-4 border-t border-slate-200">
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
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs sm:text-sm font-bold bg-[#0099cc] hover:bg-[#0088b8] text-white shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
        >
          <RotateCcw className={`w-4 h-4 text-white ${isRecalculating ? 'animate-spin' : ''}`} />
          <span>
            {isRecalculating 
              ? 'Přepočítávám a ukládám do RAG...' 
              : ' Přepočítat doporučení s mou zpětnou vazbou'}
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
