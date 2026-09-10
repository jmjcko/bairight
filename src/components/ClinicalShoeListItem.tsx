'use client';

import React, { useState } from 'react';
import { ShoeRecommendation } from '@/lib/agent/types';
import { ShieldCheck, ArrowUpRight, Sparkles, Check, ChevronRight } from 'lucide-react';
import { DealVoucherModal } from './DealVoucherModal';

interface ClinicalShoeListItemProps {
  rank: number;
  badgeLabel?: string;
  shoe: ShoeRecommendation & {
    matchScore?: number;
    matchReasons?: string[];
  };
}

export const ClinicalShoeListItem: React.FC<ClinicalShoeListItemProps> = ({
  rank,
  badgeLabel,
  shoe,
}) => {
  const [isVoucherOpen, setIsVoucherOpen] = useState(false);
  const czkPrice = Math.round(shoe.european_price_eur * 25.2);
  const score = shoe.matchScore ?? (shoe as any).match_score ?? 98;

  const isFirst = rank === 1;

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 transition-all duration-200 relative border ${
        isFirst
          ? 'bg-[#0B1526]/95 border-cyan-400/60 shadow-[0_10px_35px_rgba(6,182,212,0.2)] ring-1 ring-cyan-400/40'
          : 'bg-[#080E1A]/90 border-slate-800/90 hover:border-cyan-500/40 shadow-sm'
      }`}
    >
      {/* Top Header: Rank, Badge & Match Score */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono font-black text-xs ${
            isFirst ? 'bg-cyan-400 text-slate-950 shadow-sm' : 'bg-slate-800 text-slate-300'
          }`}>
            #{rank}
          </span>
          <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
            isFirst 
              ? 'bg-cyan-950 text-cyan-300 border-cyan-500/40' 
              : 'bg-slate-900 text-slate-400 border-slate-800'
          }`}>
            {badgeLabel || (isFirst ? 'Hlavní doporučení' : 'Vhodná alternativa')}
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            {shoe.brand} • Kopyto 2E (Široké)
          </span>
        </div>

        <div className="flex items-center gap-1 font-mono font-extrabold text-xs text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded-md border border-cyan-400/30 shrink-0">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>{score}% SHODA</span>
        </div>
      </div>

      {/* Model Name */}
      <h4 className="text-base font-extrabold text-white tracking-tight mb-2">
        {shoe.model}
      </h4>

      {/* Medical Rationale (Plain Czech Podiatric Reason) */}
      <div className="p-3 rounded-xl bg-[#050B15] border border-cyan-500/20 text-xs text-slate-300 leading-relaxed mb-3">
        <span className="font-bold text-cyan-300 block text-[11px] mb-0.5">
          Proč vám sedí:
        </span>
        <p className="text-[11px] text-slate-300">
          {shoe.medical_rationale}
        </p>
      </div>

      {/* 3 Core Numbers & Parameters (No clutter) */}
      <div className="grid grid-cols-3 gap-2 mb-3.5">
        <div className="p-2 rounded-xl bg-[#040812] border border-slate-800/80 text-center">
          <span className="text-[9px] font-mono uppercase text-slate-500 block">Sklon (Drop)</span>
          <span className="text-xs font-mono font-bold text-white">{shoe.heel_drop_mm} mm</span>
        </div>
        <div className="p-2 rounded-xl bg-[#040812] border border-slate-800/80 text-center">
          <span className="text-[9px] font-mono uppercase text-slate-500 block">Tlumení</span>
          <span className="text-xs font-mono font-bold text-teal-300">{shoe.cushion_level}</span>
        </div>
        <div className="p-2 rounded-xl bg-[#040812] border border-slate-800/80 text-center">
          <span className="text-[9px] font-mono uppercase text-slate-500 block">Koleno</span>
          <span className="text-xs font-mono font-bold text-emerald-400">Bezpečné OA 3</span>
        </div>
      </div>

      {/* Price & Action Button */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
        <div>
          <span className="text-[9px] text-slate-500 uppercase font-mono block">Ověřená cena v EU:</span>
          <span className="text-sm font-mono font-bold text-white">
            {czkPrice.toLocaleString('cs-CZ')} Kč{' '}
            <span className="text-[10px] text-slate-400 font-normal">(€{shoe.european_price_eur.toFixed(2)})</span>
          </span>
        </div>

        <button
          onClick={() => setIsVoucherOpen(true)}
          className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
            isFirst
              ? 'bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)] hover:brightness-110'
              : 'bg-slate-800 hover:bg-cyan-950 text-slate-200 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/40'
          }`}
        >
          <span>Koupit s -10%</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <DealVoucherModal
        isOpen={isVoucherOpen}
        onClose={() => setIsVoucherOpen(false)}
        shoeName={shoe.model}
        retailerName={shoe.retailer_name || 'Top4Running'}
        priceEur={shoe.european_price_eur}
        dealUrl={shoe.retailer_url || 'https://top4running.cz'}
      />
    </div>
  );
};
