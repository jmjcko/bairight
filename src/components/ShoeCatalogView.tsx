'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { EUROPEAN_CATALOG_2E_MODELS } from '@/lib/agent/tools/scan-eshops';
import { translations, SupportedLocale } from '@/lib/i18n/translations';
import { 
  Search, 
  Sparkles, 
  ExternalLink, 
  Activity, 
  ShieldCheck, 
  Filter, 
  Layers, 
  MessageSquare, 
  ArrowLeft,
  X,
  CheckCircle2
} from 'lucide-react';

interface ShoeCatalogViewProps {
  onNavigateToWizard?: () => void;
  onNavigateToChat?: () => void;
  onNavigateToAnalysis?: () => void;
  locale?: SupportedLocale;
}

export const ShoeCatalogView: React.FC<ShoeCatalogViewProps> = ({
  onNavigateToWizard,
  onNavigateToChat,
  onNavigateToAnalysis,
  locale = 'cs',
}) => {
  const t = translations[locale].catalog;
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('Vše');
  const [selectedFeature, setSelectedFeature] = useState<string>('Vše');

  const brands = ['Vše', 'Brooks', 'Asics', 'Hoka', 'New Balance'];
  const featureFilters = ['Vše', 'Rocker podrážka', 'Široké 2E kopyto', 'Došlap na patu'];

  const filtered = EUROPEAN_CATALOG_2E_MODELS.filter((shoe) => {
    const matchesSearch = 
      shoe.model.toLowerCase().includes(searchFilter.toLowerCase()) ||
      shoe.brand.toLowerCase().includes(searchFilter.toLowerCase()) ||
      shoe.medical_rationale.toLowerCase().includes(searchFilter.toLowerCase());
    
    const matchesBrand = 
      selectedBrand === 'Vše' || shoe.brand.toLowerCase() === selectedBrand.toLowerCase();

    const matchesFeature = 
      selectedFeature === 'Vše' ||
      (selectedFeature === 'Rocker podrážka' && shoe.rocker_geometry) ||
      (selectedFeature === 'Široké 2E kopyto' && shoe.is_2e_available) ||
      (selectedFeature === 'Došlap na patu' && shoe.heel_drop_mm >= 8);

    return matchesSearch && matchesBrand && matchesFeature;
  });

  return (
    <div className="flex-1 overflow-y-auto bg-[#f4f6f8] text-[#263238] p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
        {/* Header Banner */}
        <div className="rounded-2xl bg-white border border-slate-200 border-t-4 border-t-[#0099cc] p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#e1f5fe] border border-[#b3e5fc] text-[#01579b] text-xs font-mono font-bold tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5 text-[#01579b]" />
                <span>{t.badge}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#263238] tracking-tight">
                {t.title}
              </h1>
              <p className="text-sm text-[#546e7a] max-w-2xl leading-relaxed">
                {t.subtitle}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-3">
              {onNavigateToAnalysis && (
                <button
                  onClick={onNavigateToAnalysis}
                  className="px-4 py-2.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900/80 border border-cyan-500/30 text-cyan-300 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Kinetická analýza</span>
                </button>
              )}
              {onNavigateToWizard && (
                <button
                  onClick={onNavigateToWizard}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-200 hover:border-cyan-500/30 text-slate-300 hover:text-[#263238] font-medium text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{t.backToWizard}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs border-t-[3px] border-t-[#0099cc] space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full bg-[#f4f6f8] border border-cyan-500/25 focus:border-cyan-400 rounded-xl pl-10 pr-9 py-2.5 text-xs text-[#263238] placeholder-slate-500 outline-none transition-all"
              />
              {searchFilter && (
                <button
                  onClick={() => setSearchFilter('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#263238]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Brand Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {brands.map((b) => (
                <button
                  key={b}
                  onClick={() => setSelectedBrand(b)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all border shrink-0 cursor-pointer ${
                    selectedBrand === b
                      ? 'bg-cyan-950/90 border-cyan-400 text-cyan-300 shadow-sm'
                      : 'bg-[#f4f6f8] border-slate-200 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Status line & Sub-filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200/80 text-xs">
            <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>{t.itemCount.replace('{count}', filtered.length.toString())}</span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              <span className="text-[11px] text-slate-500 font-medium mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3" />
                Filtr:
              </span>
              {featureFilters.map((feat) => (
                <button
                  key={feat}
                  onClick={() => setSelectedFeature(feat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer ${
                    selectedFeature === feat
                      ? 'bg-teal-950 border border-teal-500/40 text-teal-300 font-semibold'
                      : 'bg-[#f4f6f8] text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  {feat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Shoe Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((shoe) => {
            const czkPrice = Math.round(shoe.european_price_eur * 25.2);
            const isBrooks = shoe.brand.toLowerCase().includes('brooks');
            const img = isBrooks ? '/images/brooks-adrenaline.jpg' : '/images/asics-kayano.jpg';

            return (
              <div
                key={shoe.id}
                className="rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 border-t-[3px] border-t-[#1e88e5] shadow-xs p-5 shadow-lg transition-all flex flex-col justify-between group hover:shadow-[0_10px_30px_rgba(6,182,212,0.15)]"
              >
                <div>
                  <div className="flex gap-4">
                    <div className="relative w-32 h-32 rounded-2xl overflow-hidden bg-black/60 border border-cyan-500/20 shrink-0 group-hover:border-cyan-400/40 transition-colors">
                      <Image
                        src={img}
                        alt={shoe.model}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[9px] font-mono text-cyan-300 border border-cyan-500/30">
                        2E WIDE
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/30 text-cyan-300 font-bold">
                          {shoe.brand}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#f4f6f8] border border-slate-200 text-teal-300">
                          Drop {shoe.heel_drop_mm} mm
                        </span>
                        {shoe.rocker_geometry && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-950 text-teal-300">
                            Rocker
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-[#263238] mb-1.5 leading-snug">
                        {shoe.model}
                      </h3>

                      <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                        {shoe.medical_rationale}
                      </p>
                    </div>
                  </div>

                  {/* Spec Badges Row */}
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                    <div className="p-2 rounded-xl bg-[#f4f6f8] border border-slate-200">
                      <span className="text-slate-500 block">Kopyto</span>
                      <span className="text-cyan-300 font-bold">2E Extra Wide</span>
                    </div>
                    <div className="p-2 rounded-xl bg-[#f4f6f8] border border-slate-200">
                      <span className="text-slate-500 block">Tlumení</span>
                      <span className="text-teal-300 font-bold">Maximální</span>
                    </div>
                    <div className="p-2 rounded-xl bg-[#f4f6f8] border border-slate-200">
                      <span className="text-slate-500 block">Ochrana</span>
                      <span className="text-cyan-300 font-bold">Koleno OA 3</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Price and E-shop Action */}
                <div className="mt-5 pt-4 border-t border-cyan-500/15 flex items-center justify-between">
                  <div>
                    <div className="text-base font-mono font-extrabold text-[#263238]">
                      {czkPrice.toLocaleString('cs-CZ')} Kč
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      (€{shoe.european_price_eur.toFixed(2)} bez přirážky)
                    </div>
                  </div>

                  <a
                    href={shoe.retailer_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-teal-500/20 to-cyan-500/20 hover:from-teal-500/30 hover:to-cyan-500/30 border border-teal-400/50 text-teal-300 flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <span>{t.inStockEu}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Consultation Banner */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 border-t-4 border-t-[#0099cc] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#e1f5fe] border border-[#b3e5fc] flex items-center justify-center text-[#01579b] shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#263238]">
                {t.consultInChat}
              </h4>
              <p className="text-xs text-[#546e7a]">
                Náš specializovaný AI podiatrický agent vám poradí s klenbou, materiálem svršku a rozměry.
              </p>
            </div>
          </div>

          {onNavigateToChat && (
            <button
              onClick={onNavigateToChat}
              className="px-5 py-2.5 rounded-xl bg-[#0099cc] hover:bg-[#0088b8] text-white font-bold text-xs shadow-xs transition-all shrink-0 cursor-pointer"
            >
              {t.openChatBtn}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
