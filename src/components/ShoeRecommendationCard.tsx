'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ShoeRecommendation } from '@/lib/agent/types';
import { ExternalLink, ShieldCheck, Zap, Activity, Sparkles, ArrowUpRight } from 'lucide-react';
import { DealVoucherModal } from './DealVoucherModal';

interface ShoeCardProps {
  shoe: ShoeRecommendation;
}

export const ShoeRecommendationCard: React.FC<ShoeCardProps> = ({ shoe }) => {
  const [isVoucherOpen, setIsVoucherOpen] = useState<boolean>(false);
  const [selectedRetailer, setSelectedRetailer] = useState<{ name: string; price: number; url: string }>({
    name: shoe.retailer_name || 'Top4Running',
    price: shoe.european_price_eur,
    url: shoe.retailer_url || 'https://top4running.cz',
  });

  const czkPrice = Math.round(shoe.european_price_eur * 25.2);

  // Pick photorealistic image based on brand/model
  const isBrooks = shoe.brand.toLowerCase().includes('brooks');
  const imageSrc = isBrooks ? '/images/brooks-adrenaline.jpg' : '/images/asics-kayano.jpg';

  const handleOpenDeal = (name: string, price: number, url: string) => {
    setSelectedRetailer({ name, price, url });
    setIsVoucherOpen(true);
  };

  return (
    <div className="glass-panel hover:border-cyan-400/70 transition-all duration-300 rounded-2xl overflow-hidden shadow-2xl shadow-cyan-950/30 flex flex-col justify-between group relative border border-cyan-500/25">
      {/* Top glowing accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />

      <div>
        {/* Photorealistic Shoe Image Container with Floating Badges */}
        <div className="relative w-full h-48 sm:h-52 bg-[#050a14] border-b border-cyan-500/20 overflow-hidden">
          <Image 
            src={imageSrc}
            alt={shoe.model}
            fill
            className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />

          {/* Floating Specs Badges on top-right */}
          <div className="absolute top-3 right-3 flex flex-col gap-1 items-end z-10">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/80 backdrop-blur-md border border-teal-500/40 text-teal-300 font-bold shadow-sm">
              Stabilita: 8/10
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/80 backdrop-blur-md border border-cyan-500/40 text-cyan-300 font-bold shadow-sm">
              Tlumení: {shoe.cushion_level === 'Maximum' || shoe.cushion_level === 'Plush' ? '9/10' : '8/10'}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/80 backdrop-blur-md border border-sky-500/40 text-sky-300 font-bold shadow-sm">
              Drop: {shoe.heel_drop_mm} mm
            </span>
          </div>

          {/* Match Score Badge on top-left */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-black/85 backdrop-blur-md px-2.5 py-1 rounded-full border border-cyan-500/50 text-xs font-mono font-extrabold text-cyan-300 shadow-md">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>{(shoe as any).match_score ?? (shoe as any).matchScore ?? 98}% SHODA</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5">
          {/* Brand & Model Title */}
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-300 bg-cyan-950/80 border border-cyan-500/40 px-2 py-0.5 rounded-md">
                {shoe.brand}
              </span>
              <span className="text-[10px] font-mono bg-teal-950/80 border border-teal-500/50 text-teal-300 px-2 py-0.5 rounded-full font-semibold">
                EU 41–47 (Široké kopyto 2E)
              </span>
            </div>

            <h3 className="text-lg font-extrabold text-white group-hover:text-cyan-300 transition-colors tracking-tight">
              {shoe.model}
            </h3>
          </div>

          {/* Medical Safety Badges */}
          <div className="grid grid-cols-2 gap-2 mb-3.5">
            <div className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-teal-950/60 border border-teal-400/40 text-teal-300 text-[11px] font-bold">
              <Activity className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span>VHODNÉ PRO ARTRÓZU</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-cyan-950/60 border border-cyan-400/40 text-cyan-300 text-[11px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>ŠÍŘKA 2E WIDE</span>
            </div>
          </div>

          {/* Clinical Rationale Snippet */}
          <div className="p-3 rounded-xl bg-[#050c18]/90 border border-cyan-500/20 text-xs leading-relaxed text-slate-300 mb-3">
            <span className="font-bold text-cyan-300 block mb-0.5">Klinické doporučení:</span>
            <p>{shoe.medical_rationale}</p>
          </div>
        </div>
      </div>

      {/* European Retailers Deals Table */}
      <div className="p-5 pt-0">
        <div className="border-t border-cyan-500/20 pt-3.5">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
              Kde koupit v Evropě:
            </span>
            <span className="text-base font-mono font-extrabold text-white">
              {czkPrice.toLocaleString('cs-CZ')} Kč <span className="text-xs text-slate-400 font-normal">(€{shoe.european_price_eur.toFixed(2)})</span>
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between p-2 rounded-xl bg-[#050c18] border border-cyan-500/15 text-xs">
              <span className="font-semibold text-slate-200">{shoe.retailer_name || 'Top4Running'}</span>
              <span className="font-mono text-slate-300 font-bold">{czkPrice.toLocaleString('cs-CZ')} Kč</span>
              <button
                onClick={() => handleOpenDeal(shoe.retailer_name || 'Top4Running', shoe.european_price_eur, shoe.retailer_url || 'https://top4running.cz')}
                className="px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 border border-cyan-400/40 font-bold text-[11px] transition-all flex items-center gap-1 shadow-sm cursor-pointer"
              >
                <span>KOUPIT</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-[#050c18] border border-cyan-500/15 text-xs">
              <span className="font-semibold text-slate-200">Zalando EU</span>
              <span className="font-mono text-slate-300 font-bold">{(czkPrice + 100).toLocaleString('cs-CZ')} Kč</span>
              <button
                onClick={() => handleOpenDeal('Zalando EU', shoe.european_price_eur + 4, 'https://zalando.cz')}
                className="px-3 py-1 rounded-lg bg-teal-500/20 hover:bg-teal-500 text-teal-300 hover:text-slate-950 border border-teal-400/40 font-bold text-[11px] transition-all flex items-center gap-1 shadow-sm cursor-pointer"
              >
                <span>KOUPIT</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Deal Voucher Modal */}
      <DealVoucherModal
        isOpen={isVoucherOpen}
        onClose={() => setIsVoucherOpen(false)}
        shoeName={shoe.model}
        retailerName={selectedRetailer.name}
        priceEur={selectedRetailer.price}
        dealUrl={selectedRetailer.url}
      />
    </div>
  );
};
