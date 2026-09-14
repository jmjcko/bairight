'use client';

import React, { useState, useEffect } from 'react';
import { Type, Check, X, Sparkles, Sliders, ArrowRight } from 'lucide-react';

export interface FontOption {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  fontFamilySample: string;
  previewHeading: string;
  previewBody: string;
  characteristics: string[];
}

export const FONT_OPTIONS: FontOption[] = [
  {
    id: 'inter-tight',
    name: 'Inter Tight',
    tagline: 'Moderní technická přesnost & ostrý kontrast',
    description: 'Kondenzovanější varianta světového standardu Inter. Ideální pro technické panely, parametry a hutná data.',
    category: 'Technický Neo-Grotesk',
    fontFamilySample: "'Inter Tight', sans-serif",
    previewHeading: 'Chytrý nákupní agent pro libovolný produkt',
    previewBody: 'Odvození 10+ klíčových rozhodovacích parametrů a syntéza expertního promptu v reálném čase.',
    characteristics: ['Maximální čitelnost čísel a kódů', 'Úsporná šířka textu', 'Kompaktní technický vzhled'],
  },
  {
    id: 'jakarta',
    name: 'Plus Jakarta Sans',
    tagline: 'Moderní technologický standard Silicon Valley',
    description: 'Čistý, moderní a mimořádně čitelný geometrický font s lidským teplem. Nejoblíbenější volba moderních AI a SaaS aplikací.',
    category: 'Geometrický Humanistický Grotesk',
    fontFamilySample: "'Plus Jakarta Sans', sans-serif",
    previewHeading: 'Chytrý nákupní agent pro libovolný produkt',
    previewBody: 'Odvození 10+ klíčových rozhodovacích parametrů a syntéza expertního promptu v reálném čase.',
    characteristics: ['Příjemné zaoblení křivek', 'Prémiový dojem na první pohled', 'Skvělá čitelnost ve všech velikostech'],
  },
  {
    id: 'outfit',
    name: 'Outfit',
    tagline: 'Futuristický luxus & prémiová geometrie',
    description: 'Inspirace automobilovým a technologickým luxusem. Výrazné moderní křivky, které dodávají aplikaci sebevědomý vzhled.',
    category: 'Moderní Geometrický Display',
    fontFamilySample: "'Outfit', sans-serif",
    previewHeading: 'Chytrý nákupní agent pro libovolný produkt',
    previewBody: 'Odvození 10+ klíčových rozhodovacích parametrů a syntéza expertního promptu v reálném čase.',
    characteristics: ['Elegantní kruhové proporce', 'Moderní AI estetika', 'Výrazné a poutavé nadpisy'],
  },
  {
    id: 'space-grotesk',
    name: 'Space Grotesk',
    tagline: 'Inženýrská kybernetika & technologický ráz',
    description: 'Odvozený z monospaced Space Mono. Přináší nezaměnitelný vývojářský a kybernetický charakter vhodný pro prompt inženýrství.',
    category: 'Kybernetický Monospace-Grotesk',
    fontFamilySample: "'Space Grotesk', monospace, sans-serif",
    previewHeading: 'Chytrý nákupní agent pro libovolný produkt',
    previewBody: 'Odvození 10+ klíčových rozhodovacích parametrů a syntéza expertního promptu v reálném čase.',
    characteristics: ['Unikátní technická DNA', 'Perfektní pro promptové editory', 'Nezaměnitelná identita'],
  },
  {
    id: 'dm-sans',
    name: 'DM Sans',
    tagline: 'Ergonomická elegance & vyvážený klid',
    description: 'Nízký kontrast a vysoká geometrická čistota. Působí velmi klidně, ergonomicky a profesionálně.',
    category: 'Čistý Geometrický Standard',
    fontFamilySample: "'DM Sans', sans-serif",
    previewHeading: 'Chytrý nákupní agent pro libovolný produkt',
    previewBody: 'Odvození 10+ klíčových rozhodovacích parametrů a syntéza expertního promptu v reálném čase.',
    characteristics: ['Nenamáhá oči při delším čtení', 'Jemný a sofistikovaný tón', 'Vysoká univerzálnost'],
  },
];

interface TypographySwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeFontId: string;
  onSelectFont: (fontId: string) => void;
}

export const TypographySwitcherModal: React.FC<TypographySwitcherModalProps> = ({
  isOpen,
  onClose,
  activeFontId,
  onSelectFont,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#060c18] border border-cyan-500/30 rounded-3xl shadow-2xl shadow-cyan-950/70 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-cyan-500/20 bg-[#081222] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-400 p-0.5 shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-[#070e1a] rounded-[14px] flex items-center justify-center text-cyan-300">
                <Type className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-white">
                  Výběr typografie & systémového fontu
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold">
                  5 variant
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Vyberte si styl písma, který nejlépe ladí s vaší vizí aplikace bAIright.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Font List */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {FONT_OPTIONS.map((font) => {
            const isSelected = font.id === activeFontId;

            return (
              <div
                key={font.id}
                onClick={() => onSelectFont(font.id)}
                className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                  isSelected
                    ? 'bg-[#0b162c] border-cyan-400 shadow-lg shadow-cyan-950/50 ring-1 ring-cyan-400/40'
                    : 'bg-[#070e1a] border-slate-800 hover:border-cyan-500/40 hover:bg-[#081324]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {font.name}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                      {font.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isSelected ? (
                      <span className="flex items-center gap-1 text-xs font-mono text-cyan-300 font-bold bg-cyan-950 px-2.5 py-1 rounded-full border border-cyan-500/50">
                        <Check className="w-3.5 h-3.5" />
                        Aktivní font
                      </span>
                    ) : (
                      <span className="text-xs font-mono text-slate-500 group-hover:text-cyan-400 flex items-center gap-1 transition-colors">
                        <span>Zvolit tento font</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                  {font.description}
                </p>

                {/* Live Font Preview Card */}
                <div 
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5"
                  style={{ fontFamily: font.fontFamilySample }}
                >
                  <div className="text-sm font-bold text-slate-100 tracking-tight">
                    {font.previewHeading}
                  </div>
                  <div className="text-xs text-slate-400 leading-relaxed">
                    {font.previewBody}
                  </div>
                  <div className="text-[10px] font-mono text-cyan-400 pt-1 flex items-center gap-3">
                    <span>10+ parametrů</span>
                    <span>•</span>
                    <span>Match Score: 98%</span>
                    <span>•</span>
                    <span>Cena: 25 000 Kč</span>
                  </div>
                </div>

                {/* Characteristics Badges */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {font.characteristics.map((char, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900/80 border border-slate-800 text-slate-400"
                    >
                      ✓ {char}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-cyan-500/20 bg-[#081222] flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono text-[11px]">
            Aktivní volba se okamžitě projeví na všech textech, tlačítkách i promptech webu.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-bold text-xs hover:brightness-110 transition-all cursor-pointer"
          >
            Hotovo
          </button>
        </div>
      </div>
    </div>
  );
};
