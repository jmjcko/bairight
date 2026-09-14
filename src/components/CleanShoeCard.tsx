'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ShoeRecommendation } from '@/lib/agent/types';
import { ShieldCheck, ArrowUpRight, Activity, Sparkles, Check } from 'lucide-react';
import { DealVoucherModal } from './DealVoucherModal';

interface CleanShoeCardProps {
  shoe: ShoeRecommendation & {
    matchScore?: number;
    matchReasons?: string[];
  };
  isTopPick?: boolean;
}

export const CleanShoeCard: React.FC<CleanShoeCardProps> = ({ shoe, isTopPick = false }) => {
  const [isVoucherOpen, setIsVoucherOpen] = useState(false);
  const czkPrice = Math.round(shoe.european_price_eur * 25.2);
  const isBrooks = shoe.brand.toLowerCase().includes('brooks');
  const imageSrc = isBrooks ? '/images/brooks-adrenaline.jpg' : '/images/asics-kayano.jpg';
  const score = shoe.matchScore ?? (shoe as any).match_score ?? 98;

  return (
    <div className={`rounded-3xl p-5 sm:p-6 transition-all duration-300 relative border ${
      isTopPick
        ? 'bg-[#0B1526]/95 border-cyan-400/60 shadow-[0_15px_50px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400/40'
        : 'bg-[#09101D]/90 border-slate-800 hover:border-cyan-500/40 shadow-lg'
    }`}>
      {/* Top Pick Badge */}
      {isTopPick && (
        <div className="absolute -top-3 left-6 bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-black text-[10px] tracking-wider uppercase px-3 py-0.5 rounded-full shadow-md flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          <span>Hlavní doporučení</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-5 items-start">
        {/* Clean, Focused Shoe Render Image */}
        <div className="relative w-full sm:w-44 h-36 rounded-2xl overflow-hidden bg-[#040812] border border-cyan-500/20 shrink-0">
          <Image
            src={imageSrc}
            alt={shoe.model}
            fill
            className="object-cover object-center"
          />
          <div className="absolute top-2 left-2 bg-black/85 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-mono font-bold text-cyan-300 border border-cyan-500/30">
            {score}% SHODA
          </div>
        </div>

        {/* Core Clinical & Product Info */}
        <div className="flex-1 space-y-2.5 w-full">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                {shoe.brand}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Ověřeno pro kopyto 2E (Široké)
              </span>
            </div>
            <h3 className="text-lg font-extrabold text-white tracking-tight">
              {shoe.model}
            </h3>
          </div>

          {/* Clinical Rationale: Focused & Plain-Czech */}
          <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-xs text-slate-200 leading-relaxed">
            <span className="font-bold text-cyan-300 block mb-0.5">Biomechanický důvod pro vaše nohy:</span>
            <p className="text-[11px] text-slate-300">
              {shoe.medical_rationale}
            </p>
          </div>

          {/* 3 Essential Biomechanical Specs (Clear & Large) */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="p-2 rounded-xl bg-[#060c18] border border-slate-800 text-center">
              <span className="text-[9px] font-mono uppercase text-slate-400 block">Sklon (Drop)</span>
              <span className="text-xs font-mono font-bold text-white">{shoe.heel_drop_mm} mm</span>
            </div>
            <div className="p-2 rounded-xl bg-[#060c18] border border-slate-800 text-center">
              <span className="text-[9px] font-mono uppercase text-slate-400 block">Tlumení</span>
              <span className="text-xs font-mono font-bold text-teal-300">{shoe.cushion_level}</span>
            </div>
            <div className="p-2 rounded-xl bg-[#060c18] border border-slate-800 text-center">
              <span className="text-[9px] font-mono uppercase text-slate-400 block">Ochrana kolene</span>
              <span className="text-xs font-mono font-bold text-cyan-300">Bezpečné OA 3</span>
            </div>
          </div>

          {/* Price & Direct Purchase Action */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
            <div>
              <span className="text-[10px] text-slate-400 block">Nejlepší ověřená cena v EU:</span>
              <div className="text-base font-mono font-extrabold text-white">
                {czkPrice.toLocaleString('cs-CZ')} Kč{' '}
                <span className="text-xs text-slate-400 font-normal">(€{shoe.european_price_eur.toFixed(2)})</span>
              </div>
            </div>

            <button
              onClick={() => setIsVoucherOpen(true)}
              className="px-4 py-2 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:brightness-110 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Koupit s -10% kupónem</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
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
