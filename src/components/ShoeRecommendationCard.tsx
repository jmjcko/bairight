'use client';

import React from 'react';
import { ShoeRecommendation } from '@/lib/agent/types';
import { ExternalLink, ShieldCheck, Zap, Activity, CheckCircle, Sparkles } from 'lucide-react';

interface ShoeCardProps {
  shoe: ShoeRecommendation;
}

export const ShoeRecommendationCard: React.FC<ShoeCardProps> = ({ shoe }) => {
  const czkPrice = Math.round(shoe.european_price_eur * 25.2);

  return (
    <div className="glass-panel hover:border-cyan-400/80 transition-all duration-300 rounded-2xl overflow-hidden shadow-2xl shadow-cyan-950/30 flex flex-col justify-between group relative border border-cyan-500/25">
      {/* Top glowing accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />

      <div>
        {/* Header with Match Score Radial Badge & Brand */}
        <div className="p-5 pb-3 flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-300 bg-cyan-950/80 border border-cyan-500/40 px-2.5 py-0.5 rounded-md shadow-sm">
                {shoe.brand}
              </span>
              <span className="text-[10px] bg-teal-950/80 border border-teal-500/50 text-teal-300 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                <Activity className="w-3 h-3 text-teal-400" />
                <span>2E Wide Fit</span>
              </span>
              {shoe.rocker_geometry && (
                <span className="text-[10px] bg-sky-950/80 border border-sky-500/40 text-sky-300 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <Zap className="w-3 h-3 text-sky-400" />
                  <span>Rocker Kolébka</span>
                </span>
              )}
            </div>

            <h3 className="text-lg font-extrabold text-white group-hover:text-cyan-300 transition-colors tracking-tight">
              {shoe.model}
            </h3>
          </div>

          {/* Match Score Badge with Cyan Glow */}
          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-[#050c18] border border-cyan-500/40 shrink-0 shadow-lg shadow-cyan-950/50">
            <div className="text-xs font-mono font-extrabold text-cyan-300 flex items-center gap-0.5">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>{shoe.match_score}%</span>
            </div>
            <span className="text-[9px] font-mono uppercase text-slate-400 font-semibold tracking-wider">
              SHODA
            </span>
          </div>
        </div>

        {/* Clinical Specs Pill Grid */}
        <div className="px-5 pb-3.5 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-[#050c18]/90 p-2.5 rounded-xl border border-cyan-500/20 group-hover:border-cyan-500/40 transition-colors">
            <span className="block text-[10px] text-slate-400 font-mono font-medium mb-0.5">TLUMENÍ</span>
            <span className="font-bold text-slate-100">{shoe.cushion_level}</span>
          </div>
          <div className="bg-[#050c18]/90 p-2.5 rounded-xl border border-cyan-500/20 group-hover:border-cyan-500/40 transition-colors">
            <span className="block text-[10px] text-slate-400 font-mono font-medium mb-0.5">DROP</span>
            <span className="font-mono font-bold text-cyan-400">{shoe.heel_drop_mm} mm</span>
          </div>
          <div className="bg-[#050c18]/90 p-2.5 rounded-xl border border-cyan-500/20 group-hover:border-cyan-500/40 transition-colors">
            <span className="block text-[10px] text-slate-400 font-mono font-medium mb-0.5">KOLÉBKA</span>
            <span className="font-bold text-teal-300">{shoe.rocker_geometry ? 'Aktivní' : 'Mírná'}</span>
          </div>
        </div>

        {/* Medical & Biomechanical Rationale */}
        <div className="mx-5 mb-3 p-3.5 rounded-xl bg-[#040914]/90 border border-cyan-500/20">
          <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300 mb-1.5">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Podiatrické zdůvodnění (artróza kolene & došlap):</span>
          </div>
          <p className="text-xs leading-relaxed text-slate-300">
            {shoe.medical_rationale}
          </p>
        </div>
      </div>

      {/* Footer: Price in CZK/EUR & Verified Retailer Link */}
      <div className="p-5 pt-3.5 flex items-center justify-between gap-3 bg-[#050c18]/90 border-t border-cyan-500/20">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-mono font-extrabold text-white">
              {czkPrice.toLocaleString('cs-CZ')} Kč
            </span>
            <span className="text-xs font-mono text-slate-400">
              (€{shoe.european_price_eur.toFixed(2)})
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block font-mono">
            Evropský prodejce: <strong className="text-slate-300 font-semibold">{shoe.retailer_name}</strong>
          </span>
        </div>

        <a
          href={shoe.retailer_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-cyan-950/60 hover:shadow-cyan-500/30"
        >
          <span>Koupit v EU</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
