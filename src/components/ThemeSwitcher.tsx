'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Check, Zap, Leaf, Layers, Sparkles } from 'lucide-react';

export type DesignArchetype = 'executive-technical' | 'neo-brutalist' | 'organic-zen';

interface DesignOption {
  id: DesignArchetype;
  name: string;
  sub: string;
  archetype: string;
  icon: React.ReactNode;
  borderPreview: string;
  badge: string;
  geometry: string;
}

const DESIGN_REWORKS: DesignOption[] = [
  {
    id: 'executive-technical',
    name: 'Executive Technical',
    sub: 'Surgical data density, 8px ostré rohy, hairline titan',
    archetype: 'Styl: Linear & Raycast Pro',
    icon: <Layers className="w-4 h-4 text-slate-200" />,
    borderPreview: 'border-slate-500 bg-[#090a0f] rounded-sm',
    badge: 'Pro Dark',
    geometry: '8px radius • 1px hairline',
  },
  {
    id: 'neo-brutalist',
    name: 'Neo-Brutalist Athletic',
    sub: 'Ostré 2px rohy, 3px volt rámečky, tvrdé 6px stíny',
    archetype: 'Styl: Nike Lab & Off-White Streetwear',
    icon: <Zap className="w-4 h-4 text-lime-400" />,
    borderPreview: 'border-2 border-lime-400 bg-black rounded-none shadow-[2px_2px_0px_#ccff00]',
    badge: 'Brutalist',
    geometry: '0px boxy • 3px volt • Hard shadow',
  },
  {
    id: 'organic-zen',
    name: 'Organic Nordic Zen',
    sub: 'Oblé 32px squircle křivky, difúzní stíny, teplý len',
    archetype: 'Styl: Apple Vision & Aesop Calm',
    icon: <Leaf className="w-4 h-4 text-amber-700" />,
    borderPreview: 'border border-amber-300 bg-[#f7f5f0] rounded-full shadow-sm',
    badge: 'Porcelain Light',
    geometry: '32px oblázky • Cloud shadow • Pill',
  },
];

export const ThemeSwitcher: React.FC = () => {
  const [activeDesign, setActiveDesign] = useState<DesignArchetype>('executive-technical');
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = (localStorage.getItem('bairight_design_archetype') as DesignArchetype) || 'executive-technical';
    setActiveDesign(saved);
    applyDesignSystem(saved);
  }, []);

  const applyDesignSystem = (design: DesignArchetype) => {
    document.documentElement.setAttribute('data-design-system', design);
    if (design === 'executive-technical') {
      document.documentElement.setAttribute('data-theme', 'midnight-titanium');
    } else if (design === 'neo-brutalist') {
      document.documentElement.setAttribute('data-theme', 'volt-athletic');
    } else if (design === 'organic-zen') {
      document.documentElement.setAttribute('data-theme', 'zen-sandstone');
    }
  };

  const handleSelectDesign = (newDesign: DesignArchetype) => {
    setActiveDesign(newDesign);
    localStorage.setItem('bairight_design_archetype', newDesign);
    applyDesignSystem(newDesign);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentOption = DESIGN_REWORKS.find((d) => d.id === activeDesign) || DESIGN_REWORKS[0];

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#070f1e] hover:bg-[#0c182c] border border-cyan-500/25 hover:border-cyan-400/60 text-xs text-slate-200 transition-all cursor-pointer shadow-sm group"
        title="Přepnout kompletní architektonický rework designu (Linear / Nike Brutalist / Apple Zen)"
      >
        <div className="flex items-center gap-1.5">
          {currentOption.icon}
          <span className="font-semibold text-xs tracking-tight">{currentOption.name}</span>
        </div>
        <span className="text-[10px] text-cyan-400/70 ml-0.5 group-hover:translate-y-0.5 transition-transform">▾</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl bg-[#0B121E] border border-cyan-500/30 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-3 py-2 flex items-center justify-between border-b border-cyan-500/15 mb-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-300 font-bold">
                Kompletní Reworky Designu
              </span>
            </div>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-bold">
              3 PARADIGMATA
            </span>
          </div>

          <div className="space-y-1.5">
            {DESIGN_REWORKS.map((opt) => {
              const isSelected = opt.id === activeDesign;
              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelectDesign(opt.id)}
                  className={`w-full flex items-start justify-between p-3 rounded-xl text-left transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-cyan-950/80 text-cyan-100 border-cyan-400/60 shadow-lg'
                      : 'hover:bg-slate-800/60 text-slate-300 border-transparent hover:border-slate-700/60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 shrink-0 flex items-center justify-center mt-0.5 ${opt.borderPreview}`}>
                      {isSelected ? <span className="w-2 h-2 rounded-full bg-cyan-400" /> : opt.icon}
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white">{opt.name}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800/90 text-slate-300">
                          {opt.badge}
                        </span>
                      </div>
                      <div className="text-[10px] font-medium text-cyan-400/90">{opt.archetype}</div>
                      <div className="text-[10px] text-slate-400 leading-snug">{opt.sub}</div>
                      <div className="text-[9px] font-mono text-slate-500 pt-0.5">{opt.geometry}</div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-cyan-400 shrink-0 ml-2 mt-1" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
