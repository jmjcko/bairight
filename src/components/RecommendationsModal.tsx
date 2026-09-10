'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { EUROPEAN_CATALOG_2E_MODELS } from '@/lib/agent/tools/scan-eshops';
import { X, Search, Filter, ShieldCheck, Sparkles, ExternalLink, Activity } from 'lucide-react';

interface RecommendationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectShoe?: (shoe: any) => void;
}

export const RecommendationsModal: React.FC<RecommendationsModalProps> = ({
  isOpen,
  onClose,
  onSelectShoe,
}) => {
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('Vše');

  if (!isOpen) return null;

  const brands = ['Vše', 'Brooks', 'Asics', 'Hoka', 'New Balance'];

  const filtered = EUROPEAN_CATALOG_2E_MODELS.filter((shoe) => {
    const matchesSearch = 
      shoe.model.toLowerCase().includes(searchFilter.toLowerCase()) ||
      shoe.brand.toLowerCase().includes(searchFilter.toLowerCase()) ||
      shoe.medical_rationale.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesBrand = selectedBrand === 'Vše' || shoe.brand.toLowerCase() === selectedBrand.toLowerCase();
    return matchesSearch && matchesBrand;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-[#0B121E] border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_20px_70px_rgba(6,182,212,0.25)] overflow-hidden max-h-[90vh] flex flex-col justify-between">
        {/* Glow */}
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                Katalog modelů obuvi 2E & Rocker
              </div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                Všechny doporučené modely obuvi
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-cyan-500/40 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mb-5 shrink-0">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filtrovat podle modelu, diagnózy nebo vlastnosti..."
              className="w-full bg-[#070f1e] border border-cyan-500/25 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {brands.map((b) => (
              <button
                key={b}
                onClick={() => setSelectedBrand(b)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  selectedBrand === b
                    ? 'bg-cyan-950/90 border-cyan-400 text-cyan-300 shadow-sm'
                    : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* Cards Grid */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((shoe) => {
              const czkPrice = Math.round(shoe.european_price_eur * 25.2);
              const isBrooks = shoe.brand.toLowerCase().includes('brooks');
              const img = isBrooks ? '/images/brooks-adrenaline.jpg' : '/images/asics-kayano.jpg';

              return (
                <div
                  key={shoe.id}
                  className="p-4 rounded-2xl bg-[#070f1e] border border-cyan-500/20 hover:border-cyan-400/50 transition-all flex flex-col justify-between"
                >
                  <div className="flex gap-4">
                    <div className="relative w-28 h-28 rounded-xl overflow-hidden bg-black/50 border border-cyan-500/20 shrink-0">
                      <Image
                        src={img}
                        alt={shoe.model}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/30 text-cyan-300 font-bold">
                          {shoe.brand}
                        </span>
                        <span className="text-[10px] font-mono text-teal-300">
                          Drop {shoe.heel_drop_mm} mm • 2E Wide
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white mb-1">
                        {shoe.model}
                      </h4>
                      <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed mb-2">
                        {shoe.medical_rationale}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-cyan-500/15 flex items-center justify-between">
                    <div className="text-xs font-mono font-bold text-white">
                      {czkPrice.toLocaleString('cs-CZ')} Kč{' '}
                      <span className="text-[11px] text-slate-400 font-normal">
                        (€{shoe.european_price_eur.toFixed(2)})
                      </span>
                    </div>

                    <a
                      href={shoe.retailer_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-500/20 hover:bg-teal-500/30 border border-teal-400/50 text-teal-300 flex items-center gap-1 transition-all"
                    >
                      <span>Skladem v EU</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-cyan-500/20 mt-4 flex items-center justify-between shrink-0 text-xs">
          <span className="text-slate-400 text-[11px]">
            Zobrazeno {filtered.length} modelů obuvi.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
          >
            Zavřít
          </button>
        </div>
      </div>
    </div>
  );
};
