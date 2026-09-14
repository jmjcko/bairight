'use client';

import React, { useState, useEffect } from 'react';
import { Palette, Check, X, Sparkles, Droplets, ArrowRight, Smartphone, Sliders } from 'lucide-react';

export interface ColorPaletteOption {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: 'Google Pixel Edition' | 'Google Material You' | 'Executive & Studio';
  bgHex: string;
  cardHex: string;
  accentHex: string;
  accentSecondaryHex: string;
  textHex: string;
  borderClass: string;
  accentGradient: string;
  characteristics: string[];
}

export const COLOR_PALETTES: ColorPaletteOption[] = [
  // 1. Google Pixel Bay Blue
  {
    id: 'pixel-bay',
    name: 'Pixel Bay & Google Sky',
    tagline: 'Ikonická azurová modř Google Pixel 8 Pro a čistý Material Sky',
    description: 'Zářivé odstíny digitální oblohy a periwinkle na temně modrém břidlicovém podkladu. Svěží, moderní technologický design.',
    category: 'Google Pixel Edition',
    bgHex: '#060b16',
    cardHex: '#0c1527',
    accentHex: '#38bdf8',
    accentSecondaryHex: '#818cf8',
    textHex: '#f0f9ff',
    borderClass: 'border-sky-400/40',
    accentGradient: 'from-sky-400 via-blue-400 to-indigo-400',
    characteristics: ['Ikonická Pixel Bay Blue', 'Čistý Google Material kontrast', 'Příjemné modré ambientní světlo'],
  },
  // 2. Google Pixel Coral & Sunset
  {
    id: 'pixel-coral',
    name: 'Pixel Coral & Sunset Clay',
    tagline: 'Hřejivý koral, západ slunce a jemná terakota z Pixelu',
    description: 'Inspirováno edicí Google Pixel Sunset/Coral. Hřejivé pastelové tóny růžové a jantaru dodávají rozhraní lidskost a prémiovou vřelost.',
    category: 'Google Pixel Edition',
    bgHex: '#0f070a',
    cardHex: '#1b0d13',
    accentHex: '#fb7185',
    accentSecondaryHex: '#f97316',
    textHex: '#fff1f2',
    borderClass: 'border-rose-400/40',
    accentGradient: 'from-rose-400 via-orange-400 to-amber-400',
    characteristics: ['Hřejivý koral & západ slunce', 'Energetický organický náboj', 'Material You dynamika'],
  },
  // 3. Google Pixel Mint & Hazel Sage
  {
    id: 'pixel-mint',
    name: 'Pixel Mint & Hazel Sage',
    tagline: 'Jemná šalvěj, pistácie a uklidňující mech z Pixel 8/9 Pro',
    description: 'Nejnovější Pixel Hazel a Mint estetika. Organická zelená a jemný mátový akcent na hlubokém grafitovém podkladu pro nulovou únavu zraku.',
    category: 'Google Pixel Edition',
    bgHex: '#060e0a',
    cardHex: '#0b1c13',
    accentHex: '#4ade80',
    accentSecondaryHex: '#2dd4bf',
    textHex: '#f0fdf4',
    borderClass: 'border-emerald-400/40',
    accentGradient: 'from-emerald-400 via-teal-300 to-green-400',
    characteristics: ['Harmonická šalvěj a pistácie', 'Klidný přírodní luxus', 'Nulová únava očí'],
  },
  // 4. Google Pixel Lemongrass
  {
    id: 'pixel-lemongrass',
    name: 'Pixel Lemongrass & Solar Zest',
    tagline: 'Mladistvý chartreuse, limetka a sluneční jantar z Pixel 7',
    description: 'Odvážný, svěží a energetický styl Google Pixel Lemongrass. Výrazné limetkovo-žluté akcenty s vysokou čitelností i na slunci.',
    category: 'Google Pixel Edition',
    bgHex: '#0a0e05',
    cardHex: '#141d0a',
    accentHex: '#a3e635',
    accentSecondaryHex: '#facc15',
    textHex: '#f7fee7',
    borderClass: 'border-lime-400/40',
    accentGradient: 'from-lime-400 via-yellow-400 to-emerald-400',
    characteristics: ['Odvážný moderní chartreuse', 'Vysoká čitelnost a kontrast', 'Čerstvý mladistvý styl'],
  },
  // 5. Google Pixel Porcelain & Warm Sand
  {
    id: 'pixel-porcelain',
    name: 'Pixel Porcelain & Warm Sand',
    tagline: 'Hedvábný kašmír, světlý pískovec a teplý titan',
    description: 'Prémiová estetika Google Pixel 8/9 Pro Porcelain a Material You Dune. Pískové a kašmírové odstíny vytvářejí luxusní, vyvážené prostředí.',
    category: 'Google Pixel Edition',
    bgHex: '#0c0b09',
    cardHex: '#191713',
    accentHex: '#fcd34d',
    accentSecondaryHex: '#fb923c',
    textHex: '#fffbeb',
    borderClass: 'border-amber-400/40',
    accentGradient: 'from-amber-200 via-orange-300 to-yellow-400',
    characteristics: ['Hedvábný kašmír a pískovec', 'Warm Stone minimalismus', 'Sofistikovaná prémiovost'],
  },
  // 6. Google Material You Iris
  {
    id: 'material-iris',
    name: 'Material You Iris & Lilac',
    tagline: 'Digitální levandule a jemná fialka z Material Design 3',
    description: 'Charakteristická pastelová fialová a šeřík z Google Material You M3. Hravé, sofistikované a kreativní rozhraní.',
    category: 'Google Material You',
    bgHex: '#0a0715',
    cardHex: '#140e2b',
    accentHex: '#c084fc',
    accentSecondaryHex: '#f472b6',
    textHex: '#faf5ff',
    borderClass: 'border-purple-400/40',
    accentGradient: 'from-purple-400 via-fuchsia-400 to-indigo-400',
    characteristics: ['Material You digitální levandule', 'Jemný pastelový neon', 'Kreativní hloubka'],
  },
  // 7. Midnight Titanium
  {
    id: 'midnight-titanium',
    name: 'Titanium Stealth & Slate',
    tagline: 'Chirurgická elegance, čistý kouřový titan a břidlice',
    description: 'Styl Linear Pro a Raycast. Maximálně decentní, profesionální a klidný tmavý režim bez rušivých neonů.',
    category: 'Executive & Studio',
    bgHex: '#090b10',
    cardHex: '#0f121c',
    accentHex: '#f8fafc',
    accentSecondaryHex: '#94a3b8',
    textHex: '#f8fafc',
    borderClass: 'border-slate-700/60',
    accentGradient: 'from-slate-100 via-slate-300 to-slate-400',
    characteristics: ['1px hairline titanové linky', 'Vysoký kontrast bílého písma', 'Nejmenší únava očí'],
  },
  // 8. Cyber Cyan
  {
    id: 'cyber-cyan',
    name: 'Cyber Cyan & Deep Abyss',
    tagline: 'Oficiální bAIright styl – kinetický tyrkys a noční hlubina',
    description: 'Styl moderních AI laboratoří. Elektrizující modrozelené akcenty dodávají webu dynamiku a technologický náboj.',
    category: 'Executive & Studio',
    bgHex: '#040711',
    cardHex: '#070e1c',
    accentHex: '#22d3ee',
    accentSecondaryHex: '#14b8a6',
    textHex: '#f8fafc',
    borderClass: 'border-cyan-500/40',
    accentGradient: 'from-cyan-400 via-teal-400 to-sky-500',
    characteristics: ['Zářivé cyan neonové akcenty', 'Hluboké skleněné panely', 'Sci-fi technologický puls'],
  },
  // 9. Monochrome Aluminum
  {
    id: 'monochrome-aluminum',
    name: 'Monochrome Cold Aluminum',
    tagline: 'Čistý Dieter Rams minimalismus, grafit a broušený kov',
    description: 'Styl Nothing OS a Apple Pro Display. Absolutní redukce na černou, grafit a čistou bílou typografii.',
    category: 'Executive & Studio',
    bgHex: '#060606',
    cardHex: '#121212',
    accentHex: '#ffffff',
    accentSecondaryHex: '#a1a1aa',
    textHex: '#ffffff',
    borderClass: 'border-neutral-700/60',
    accentGradient: 'from-white via-zinc-300 to-zinc-500',
    characteristics: ['Monolitický grafit a kov', 'Nulové barevné rušení', 'Maximální čistota'],
  },
];

interface ColorPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ColorPaletteModal: React.FC<ColorPaletteModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activePalette, setActivePalette] = useState<string>('pixel-mint');
  const [activeFilter, setActiveFilter] = useState<string>('all');

  useEffect(() => {
    if (!isOpen) return;
    const saved = localStorage.getItem('bairight_active_theme');
    if (saved) {
      setActivePalette(saved);
    } else {
      const current = document.documentElement.getAttribute('data-theme') || 'pixel-mint';
      setActivePalette(current);
    }
  }, [isOpen]);

  const handleSelectPalette = (paletteId: string) => {
    setActivePalette(paletteId);
    document.documentElement.setAttribute('data-theme', paletteId);
    localStorage.setItem('bairight_active_theme', paletteId);
  };

  const filteredPalettes = activeFilter === 'all'
    ? COLOR_PALETTES
    : COLOR_PALETTES.filter((p) => {
        if (activeFilter === 'pixel') return p.category.includes('Pixel') || p.category.includes('Material');
        if (activeFilter === 'studio') return p.category.includes('Executive');
        return true;
      });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-[#090b12] border border-cyan-500/30 shadow-[0_20px_70px_rgba(0,0,0,0.9)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/20 bg-[#070e1a]/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-400 via-teal-400 to-amber-300 flex items-center justify-center text-slate-950 font-bold shadow-md">
              <Palette className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white tracking-wide">
                  Designové & barevné palety
                </h2>
                <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
                  <Smartphone className="w-3 h-3 text-cyan-400" />
                  Google Pixel & Material You
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Vyberte si vyladěnou barevnou variantu inspirovanou hardwarem Google Pixel a Material Designem.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
            title="Zavřít"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="px-6 py-2.5 bg-[#050913] border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1 rounded-xl text-xs font-mono transition-all cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-400/50 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
            }`}
          >
            Všechny varianty ({COLOR_PALETTES.length})
          </button>
          <button
            onClick={() => setActiveFilter('pixel')}
            className={`px-3 py-1 rounded-xl text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'pixel'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-400/50 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
            <span>Google Pixel & Material (6)</span>
          </button>
          <button
            onClick={() => setActiveFilter('studio')}
            className={`px-3 py-1 rounded-xl text-xs font-mono transition-all cursor-pointer ${
              activeFilter === 'studio'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-400/50 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
            }`}
          >
            Executive & Minimal (3)
          </button>
        </div>

        {/* Scrollable Palette Cards Grid */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPalettes.map((palette) => {
              const isSelected = activePalette === palette.id;

              return (
                <div
                  key={palette.id}
                  onClick={() => handleSelectPalette(palette.id)}
                  className={`relative flex flex-col p-4 rounded-2xl border transition-all cursor-pointer group text-left ${
                    isSelected
                      ? 'bg-[#0e1424] border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.25)] ring-2 ring-cyan-400/50'
                      : 'bg-[#090d18]/90 border-slate-800 hover:border-slate-700 hover:bg-[#0c1220]'
                  }`}
                >
                  {/* Card Header: Swatches + Name */}
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-3">
                      {/* Color Swatch Pill */}
                      <div 
                        className="flex items-center p-1 rounded-xl border shadow-inner gap-1"
                        style={{ backgroundColor: palette.bgHex, borderColor: palette.accentHex + '60' }}
                      >
                        <div className="w-4 h-4 rounded-lg shadow-sm" style={{ backgroundColor: palette.cardHex }} />
                        <div className="w-4 h-4 rounded-lg shadow-sm" style={{ backgroundColor: palette.accentHex }} />
                        <div className="w-4 h-4 rounded-lg shadow-sm" style={{ backgroundColor: palette.accentSecondaryHex }} />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                            {palette.name}
                          </h3>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                          {palette.category}
                        </span>
                      </div>
                    </div>

                    {isSelected ? (
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-950 border border-cyan-400 text-cyan-300 text-[10px] font-mono font-bold shrink-0 shadow-sm">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>Aktivní</span>
                      </div>
                    ) : (
                      <span className="text-[11px] font-mono text-slate-500 group-hover:text-cyan-300 flex items-center gap-1 transition-colors">
                        Vybrat <ArrowRight className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  {/* Tagline & Description */}
                  <p className="text-xs font-semibold text-slate-200 mb-1">
                    {palette.tagline}
                  </p>
                  <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                    {palette.description}
                  </p>

                  {/* Live Mini Preview Box inside the palette */}
                  <div 
                    className="mt-auto p-3 rounded-xl border flex items-center justify-between gap-2 shadow-inner"
                    style={{
                      backgroundColor: palette.cardHex,
                      borderColor: isSelected ? palette.accentHex : 'rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div 
                        className="w-2.5 h-2.5 rounded-full animate-pulse shadow-sm" 
                        style={{ backgroundColor: palette.accentHex }} 
                      />
                      <span className="text-xs font-bold" style={{ color: palette.textHex }}>
                        {palette.name.split('&')[0].trim()}
                      </span>
                    </div>

                    <div 
                      className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold shadow-sm"
                      style={{
                        backgroundColor: palette.accentHex,
                        color: '#0a0a0a',
                      }}
                    >
                      Material Preview
                    </div>
                  </div>

                  {/* Characteristics tags */}
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-2.5 border-t border-slate-800/80">
                    {palette.characteristics.map((c, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-900/90 text-slate-400 border border-slate-800"
                      >
                        • {c}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-cyan-500/20 bg-[#070e1a]/90">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Kliknutím na paletu se barvy ihned adaptují napříč celým rozhraním.</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 hover:brightness-110 text-slate-950 font-bold text-xs transition-all cursor-pointer shadow-md"
          >
            Uložit a zavřít
          </button>
        </div>
      </div>
    </div>
  );
};

