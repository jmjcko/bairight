'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  Sparkles, 
  Search, 
  Bell, 
  User, 
  Activity, 
  ShieldCheck, 
  ShieldAlert, 
  ExternalLink, 
  Layers, 
  Footprints, 
  Check, 
  Sliders, 
  Calendar, 
  ChevronRight, 
  ArrowUpRight, 
  Languages, 
  Stethoscope,
  MessageSquare
} from 'lucide-react';

interface MockupClinicalDashboardProps {
  onOpenChat?: () => void;
}

export const MockupClinicalDashboard: React.FC<MockupClinicalDashboardProps> = ({ onOpenChat }) => {
  // Navigation State
  const [activeNav, setActiveNav] = useState<'dashboard' | 'analysis' | 'recommendations' | 'appointments' | 'profile'>('dashboard');
  const [activeCategory, setActiveCategory] = useState<'shoes' | 'ergonomics' | 'recovery' | 'orthotics'>('shoes');
  const [locale, setLocale] = useState<'cs' | 'en'>('cs');

  // Interactive Form State (Matching Mockup B)
  const [medicalHistory, setMedicalHistory] = useState<string[]>(['Osteoarthritis', 'Prior Injury']);
  const [kneePainLevel, setKneePainLevel] = useState<number>(6);
  const [painTypes, setPainTypes] = useState<string[]>(['Stiffness']);
  const [activityLevel, setActivityLevel] = useState<'sedentary' | 'active' | 'athlete'>('active');
  const [footWidth, setFootWidth] = useState<'standard' | 'wide_2e' | 'wide_4e'>('wide_2e');
  const [euSize, setEuSize] = useState<number>(44);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);

  const isCs = locale === 'cs';

  const toggleMedical = (item: string) => {
    setMedicalHistory(prev => 
      prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]
    );
  };

  const togglePainType = (item: string) => {
    setPainTypes(prev => 
      prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]
    );
  };

  const handleTriggerAnalysis = () => {
    setIsEvaluating(true);
    setTimeout(() => {
      setIsEvaluating(false);
    }, 600);
  };

  return (
    <div className="w-full max-w-[1520px] mx-auto p-2 sm:p-4 md:p-6 text-slate-100 font-sans">
      {/* Outer Sleek App Container from Mockup B */}
      <div className="mockup-dashboard-frame rounded-[28px] overflow-hidden backdrop-blur-2xl relative shadow-[0_25px_80px_rgba(0,0,0,0.8)]">
        
        {/* TOP NAVIGATION BAR (Exact match to Mockup B) */}
        <header className="px-6 py-4 border-b border-cyan-500/20 bg-[#09111e]/90 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30">
          
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Sparkles className="w-4 h-4 fill-cyan-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-extrabold text-white tracking-tight">bAIright</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/30 text-cyan-300 font-bold">
                AI CLINICAL
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <button 
              onClick={() => setActiveNav('dashboard')}
              className={`pb-1 transition-all relative ${
                activeNav === 'dashboard' 
                  ? 'text-white font-bold' 
                  : 'hover:text-slate-200'
              }`}
            >
              <span>{isCs ? 'Přehled' : 'Dashboard'}</span>
              {activeNav === 'dashboard' && (
                <span className="absolute bottom-[-17px] left-0 right-0 h-[3px] bg-gradient-to-r from-cyan-400 to-teal-400 rounded-full shadow-[0_0_10px_#06b6d4]" />
              )}
            </button>

            <button 
              onClick={() => setActiveNav('analysis')}
              className={`pb-1 transition-all relative ${
                activeNav === 'analysis' 
                  ? 'text-white font-bold' 
                  : 'hover:text-slate-200'
              }`}
            >
              <span>{isCs ? 'Analýza' : 'Analysis'}</span>
              {activeNav === 'analysis' && (
                <span className="absolute bottom-[-17px] left-0 right-0 h-[3px] bg-gradient-to-r from-cyan-400 to-teal-400 rounded-full shadow-[0_0_10px_#06b6d4]" />
              )}
            </button>

            <button 
              onClick={() => setActiveNav('recommendations')}
              className={`pb-1 transition-all relative ${
                activeNav === 'recommendations' 
                  ? 'text-white font-bold' 
                  : 'hover:text-slate-200'
              }`}
            >
              <span>{isCs ? 'Doporučení' : 'Recommendations'}</span>
              {activeNav === 'recommendations' && (
                <span className="absolute bottom-[-17px] left-0 right-0 h-[3px] bg-gradient-to-r from-cyan-400 to-teal-400 rounded-full shadow-[0_0_10px_#06b6d4]" />
              )}
            </button>

            <button 
              onClick={() => {
                setActiveNav('appointments');
                if (onOpenChat) onOpenChat();
              }}
              className={`pb-1 transition-all relative ${
                activeNav === 'appointments' 
                  ? 'text-white font-bold' 
                  : 'hover:text-slate-200'
              }`}
            >
              <span>{isCs ? 'Konzultace' : 'Appointments'}</span>
              {activeNav === 'appointments' && (
                <span className="absolute bottom-[-17px] left-0 right-0 h-[3px] bg-gradient-to-r from-cyan-400 to-teal-400 rounded-full shadow-[0_0_10px_#06b6d4]" />
              )}
            </button>

            <button 
              onClick={() => setActiveNav('profile')}
              className={`pb-1 transition-all relative ${
                activeNav === 'profile' 
                  ? 'text-white font-bold' 
                  : 'hover:text-slate-200'
              }`}
            >
              <span>{isCs ? 'Profil' : 'Profile'}</span>
              {activeNav === 'profile' && (
                <span className="absolute bottom-[-17px] left-0 right-0 h-[3px] bg-gradient-to-r from-cyan-400 to-teal-400 rounded-full shadow-[0_0_10px_#06b6d4]" />
              )}
            </button>
          </nav>

          {/* Search, Notifications & User */}
          <div className="flex items-center gap-3.5">
            {/* Search Input */}
            <div className="hidden sm:flex items-center gap-2 bg-[#060c18] border border-cyan-500/20 rounded-full px-3.5 py-1.5 text-xs text-slate-400 w-48 lg:w-60 focus-within:border-cyan-400 transition-all">
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <input 
                type="text" 
                placeholder={isCs ? 'Hledat model, zranění...' : 'Search shoes, injuries...'} 
                className="bg-transparent text-white outline-none w-full placeholder:text-slate-600 text-xs"
              />
            </div>

            {/* Language Switch */}
            <div className="flex items-center bg-[#060c18] border border-cyan-500/20 rounded-lg p-0.5 text-xs font-mono">
              <button 
                onClick={() => setLocale('cs')}
                className={`px-2 py-0.5 rounded font-bold transition-all ${locale === 'cs' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400'}`}
              >
                CZ
              </button>
              <button 
                onClick={() => setLocale('en')}
                className={`px-2 py-0.5 rounded font-bold transition-all ${locale === 'en' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400'}`}
              >
                EN
              </button>
            </div>

            {/* Notification Bell */}
            <button className="relative w-9 h-9 rounded-full bg-[#060c18] border border-cyan-500/20 flex items-center justify-center text-slate-300 hover:text-white transition-all">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#06b6d4]" />
            </button>

            {/* User Avatar */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-500 to-teal-400 p-0.5 cursor-pointer shadow-md">
              <div className="w-full h-full bg-[#09111e] rounded-full flex items-center justify-center text-cyan-300">
                <User className="w-4 h-4" />
              </div>
            </div>
          </div>
        </header>

        {/* HORIZONTAL PRODUCT CATEGORY SELECTOR (Multi-Product Platform Ready!) */}
        <div className="px-6 py-3 border-b border-cyan-500/15 bg-[#070e1b]/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold mr-2 shrink-0">
            {isCs ? 'Kategorie nákupčího:' : 'Product Category:'}
          </span>

          {[
            { id: 'shoes', label: isCs ? '👟 Běžecká & Tréninková obuv' : '👟 Running & Training Shoes' },
            { id: 'ergonomics', label: isCs ? '🪑 Ergonomie sezení & Pracoviště' : '🪑 Ergonomic Workstations' },
            { id: 'recovery', label: isCs ? '🧊 Regenerační & Kompresní pomůcky' : '🧊 Recovery & Compression' },
            { id: 'orthotics', label: isCs ? '🦶 Ortopedické vložky na míru' : '🦶 Custom Orthotics & Insoles' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                activeCategory === cat.id
                  ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                  : 'bg-[#060c18]/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* MAIN DASHBOARD 3-COLUMN GRID (Matching Mockup B) */}
        <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start bg-gradient-to-b from-[#0b1322] to-[#060b14]">
          
          {/* COLUMN 1: INTAKE QUESTIONNAIRE WIZARD (Left 4 cols) */}
          <div className="lg:col-span-4 bg-[#091220]/90 border border-cyan-500/20 rounded-2xl p-5 sm:p-6 shadow-xl relative flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight leading-snug mb-1">
                {isCs ? 'Biomechanický dotazník pro výběr' : 'Foot Biomechanics Intake Questionnaire Wizard'}
              </h2>

              {/* Step indicator and progress bar */}
              <div className="flex items-center justify-between text-xs font-mono text-cyan-400 mt-3 mb-1.5 font-bold">
                <span>{isCs ? 'KROK 2 ZE 4: Zdraví & Anamnéza' : 'STEP 2 OF 4: Health & History'}</span>
                <span>50%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#050c18] overflow-hidden mb-6 border border-cyan-500/25">
                <div className="h-full w-1/2 bg-gradient-to-r from-cyan-500 to-teal-400 rounded-full shadow-[0_0_10px_#06b6d4]" />
              </div>

              {/* Section 1: Medical History */}
              <div className="mb-6">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-200 mb-1">
                  1. {isCs ? 'Zdravotní anamnéza' : 'Medical History'}
                </label>
                <p className="text-[11px] text-slate-400 mb-2.5">
                  {isCs ? 'Jaké zdravotní potíže vás limitují při zátěži?' : 'What conditions impact your kinetic chain?'}
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'Prior Injury', label: isCs ? 'Předchozí zranění' : 'Prior Injury' },
                    { id: 'Osteoarthritis', label: isCs ? 'Artróza (Knee OA)' : 'Osteoarthritis' },
                    { id: 'Surgery', label: isCs ? 'Operace / Meniskus' : 'Surgery / Meniscus' },
                    { id: 'Drop Foot', label: isCs ? 'Vbočený palec / Halux' : 'Drop Foot / Bunions' },
                  ].map((item) => {
                    const checked = medicalHistory.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleMedical(item.id)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                          checked
                            ? 'bg-cyan-950/70 border-cyan-400 text-white shadow-sm'
                            : 'bg-[#060c18]/80 border-slate-800 text-slate-400 hover:border-cyan-500/30'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                          checked ? 'bg-cyan-500 border-cyan-400 text-slate-950' : 'border-slate-700 bg-slate-900'
                        }`}>
                          {checked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="text-[11px] font-semibold">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: Knee Health (Interactive Slider) */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-slate-200">
                    2. {isCs ? 'Bolest & Zátěž kolene (1–10)' : 'Knee Health (Pain Level 1–10)'}
                  </label>
                  <span className="text-xs font-mono font-bold text-cyan-300 px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30">
                    {kneePainLevel} / 10
                  </span>
                </div>

                <div className="py-2">
                  <input 
                    type="range" 
                    min={1} 
                    max={10} 
                    value={kneePainLevel}
                    onChange={(e) => setKneePainLevel(Number(e.target.value))}
                    className="w-full cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1.5 px-0.5">
                    <span>1 (Bez bolesti)</span>
                    <span>5</span>
                    <span className="text-amber-400 font-bold">10 (Kritická gonartróza)</span>
                  </div>
                </div>

                {/* Pain Type */}
                <div className="mt-2.5">
                  <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">
                    {isCs ? 'Typ bolesti kloubu:' : 'Type of Pain:'}
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { id: 'Stiffness', label: isCs ? 'Tuhost & Ranní ztuhlost' : 'Stiffness' },
                      { id: 'Locking', label: isCs ? 'Blokování / Lupání' : 'Locking / Catching' },
                    ].map((pt) => {
                      const checked = painTypes.includes(pt.id);
                      return (
                        <button
                          key={pt.id}
                          type="button"
                          onClick={() => togglePainType(pt.id)}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                            checked
                              ? 'bg-cyan-950/70 border-cyan-400 text-white'
                              : 'bg-[#060c18]/80 border-slate-800 text-slate-400 hover:border-cyan-500/30'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                            checked ? 'bg-cyan-500 border-cyan-400 text-slate-950' : 'border-slate-700 bg-slate-900'
                          }`}>
                            {checked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="text-[11px] font-semibold">{pt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Section 3: Activity Level */}
              <div className="mb-6">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-200 mb-1">
                  3. {isCs ? 'Úroveň aktivity' : 'Activity Level'}
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { id: 'sedentary', label: isCs ? 'Sedavý' : 'Sedentary' },
                    { id: 'active', label: isCs ? 'Aktivní' : 'Active' },
                    { id: 'athlete', label: isCs ? 'Sportovec' : 'Athlete' },
                  ].map((act) => (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => setActivityLevel(act.id as any)}
                      className={`p-2 rounded-xl border text-center font-semibold transition-all ${
                        activityLevel === act.id
                          ? 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-sm'
                          : 'bg-[#060c18]/80 border-slate-800 text-slate-400 hover:border-cyan-500/30'
                      }`}
                    >
                      {act.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 4: Foot Width & Size */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-slate-200">
                    4. {isCs ? 'Šířka kopyta & Velikost' : 'Foot Width & Sizing'}
                  </label>
                  <span className="text-xs font-mono text-slate-400">EU {euSize}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { id: 'standard', label: 'Standard (D)' },
                    { id: 'wide_2e', label: 'Široké (2E)' },
                    { id: 'wide_4e', label: 'Extra (4E)' },
                  ].map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setFootWidth(w.id as any)}
                      className={`p-2 rounded-xl border text-center font-semibold transition-all ${
                        footWidth === w.id
                          ? 'bg-teal-950 border-teal-400 text-teal-300 shadow-sm'
                          : 'bg-[#060c18]/80 border-slate-800 text-slate-400 hover:border-cyan-500/30'
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Glowing Trigger Button */}
            <button
              type="button"
              onClick={handleTriggerAnalysis}
              disabled={isEvaluating}
              className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-cyan-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-extrabold text-sm transition-all shadow-[0_0_25px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2"
            >
              {isEvaluating ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>{isCs ? 'Přepočítávám biomechaniku...' : 'Evaluating Biomechanics...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-slate-950" />
                  <span>{isCs ? 'Aktualizovat doporučení s AI' : 'Run AI Recommendation'}</span>
                </>
              )}
            </button>
          </div>

          {/* COLUMN 2: SHOE RECOMMENDATION RESULTS (Center 5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            
            {/* Header & Filter Tags */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-extrabold text-white tracking-tight">
                  {isCs ? 'Doporučené produkty a obuv' : 'Shoe Recommendation Results'}
                </h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 font-bold">
                  2 MODULY PASUJÍ
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isCs ? 'Výsledky podiatrického agenta optimalizované pro odlehčení kolene a chodidla' : 'AI-Powered Shoe Analysis for Knee & Foot Health'}
              </p>

              {/* Diagnostic Filter Badges from Mockup */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] font-mono text-slate-400 mr-1">Profil:</span>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#091524] border border-cyan-500/30 text-cyan-300">
                  Pronace / Supinace
                </span>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#091524] border border-cyan-500/30 text-cyan-300">
                  Tlumení paty (Medial Wear)
                </span>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#091524] border border-cyan-500/30 text-cyan-300">
                  Podpora klenby (Arch)
                </span>
              </div>
            </div>

            {/* PRODUCT CARD 1: Brooks Adrenaline GTS 23 */}
            <div className="bg-[#091220]/90 border border-cyan-500/25 rounded-2xl p-4 shadow-xl relative overflow-hidden group hover:border-cyan-400/50 transition-all">
              {/* Product Image on Studio Dark Backdrop */}
              <div className="relative w-full h-44 rounded-xl overflow-hidden bg-[#050a14] border border-cyan-500/20 mb-3.5">
                <Image 
                  src="/images/brooks-adrenaline.jpg"
                  alt="Brooks Adrenaline GTS 23"
                  fill
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />

                {/* Floating Telemetry Badges top-right */}
                <div className="absolute top-2.5 right-2.5 flex flex-col gap-1 items-end z-10">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/80 backdrop-blur-md border border-teal-500/40 text-teal-300 font-bold">
                    Stabilita: 8/10
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/80 backdrop-blur-md border border-cyan-500/40 text-cyan-300 font-bold">
                    Tlumení: 9/10
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/80 backdrop-blur-md border border-sky-500/40 text-sky-300 font-bold">
                    Ochrana rotace: 7/10
                  </span>
                </div>
              </div>

              {/* Medical Safety Badges (From Mockup) */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-teal-950/60 border border-teal-400/50 text-teal-300 text-[11px] font-extrabold uppercase tracking-wide">
                  <Activity className="w-3.5 h-3.5 text-teal-400" />
                  <span>Knee OA Grade 3 Safe</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-cyan-950/60 border border-cyan-400/50 text-cyan-300 text-[11px] font-extrabold uppercase tracking-wide">
                  <Footprints className="w-3.5 h-3.5 text-cyan-400" />
                  <span>2E Wide Fit</span>
                </div>
              </div>

              {/* Title & Clinical Rationale */}
              <div className="mb-3">
                <h3 className="text-base font-extrabold text-white tracking-tight">
                  Brooks Adrenaline GTS 23
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed mt-1">
                  {isCs 
                    ? 'Ověřený systém GuideRails® tlumí nadměrnou rotaci bérce a odlehčuje patelární chrupavku. Pěna DNA LOFT v2 poskytuje měkký došlap.'
                    : 'GuideRails holistic support system keeps excess knee rotation in check, protecting the patellofemoral compartment.'}
                </p>
                <div className="text-[11px] font-mono text-slate-400 mt-1.5">
                  {isCs ? 'Dostupné šířky: 2E Wide, Extra 4E • EU 42–46' : 'Size: 2E Wide Fit / 4E Extra • EU 42–46'}
                </div>
              </div>

              {/* Where to Buy (European Stores Table from Mockup) */}
              <div className="border-t border-cyan-500/20 pt-3">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block mb-2">
                  {isCs ? 'Kde koupit (Evropské obchody):' : 'Where to Buy (European Stores):'}
                </span>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-[#060c18] border border-cyan-500/15">
                    <span className="font-semibold text-slate-200">Top4Running</span>
                    <span className="font-mono font-bold text-white">4 290 Kč (€169.95)</span>
                    <a 
                      href="https://top4running.cz" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-teal-500/20 border border-teal-400/40 text-teal-300 text-[11px] font-bold hover:bg-teal-500 hover:text-slate-950 transition-all flex items-center gap-1"
                    >
                      <span>KOUPIT</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-[#060c18] border border-cyan-500/15">
                    <span className="font-semibold text-slate-200">Zalando EU</span>
                    <span className="font-mono font-bold text-white">4 390 Kč (€174.90)</span>
                    <a 
                      href="https://zalando.cz" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-[11px] font-bold hover:bg-cyan-500 hover:text-slate-950 transition-all flex items-center gap-1"
                    >
                      <span>KOUPIT</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* PRODUCT CARD 2: ASICS Gel-Kayano 30 */}
            <div className="bg-[#091220]/90 border border-cyan-500/25 rounded-2xl p-4 shadow-xl relative overflow-hidden group hover:border-cyan-400/50 transition-all">
              {/* Product Image on Studio Dark Backdrop */}
              <div className="relative w-full h-44 rounded-xl overflow-hidden bg-[#050a14] border border-cyan-500/20 mb-3.5">
                <Image 
                  src="/images/asics-kayano.jpg"
                  alt="ASICS Gel-Kayano 30"
                  fill
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />

                {/* Floating Telemetry Badges top-right */}
                <div className="absolute top-2.5 right-2.5 flex flex-col gap-1 items-end z-10">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/80 backdrop-blur-md border border-teal-500/40 text-teal-300 font-bold">
                    Stabilita: 9/10
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/80 backdrop-blur-md border border-cyan-500/40 text-cyan-300 font-bold">
                    Tlumení: 9/10
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/80 backdrop-blur-md border border-sky-500/40 text-sky-300 font-bold">
                    PureGEL™: Aktivní
                  </span>
                </div>
              </div>

              {/* Medical Safety Badges */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-teal-950/60 border border-teal-400/50 text-teal-300 text-[11px] font-extrabold uppercase tracking-wide">
                  <Activity className="w-3.5 h-3.5 text-teal-400" />
                  <span>Knee OA Grade 3 Safe</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-cyan-950/60 border border-cyan-400/50 text-cyan-300 text-[11px] font-extrabold uppercase tracking-wide">
                  <Footprints className="w-3.5 h-3.5 text-cyan-400" />
                  <span>2E Wide Fit</span>
                </div>
              </div>

              {/* Title & Clinical Rationale */}
              <div className="mb-3">
                <h3 className="text-base font-extrabold text-white tracking-tight">
                  ASICS Gel-Kayano 30
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed mt-1">
                  {isCs 
                    ? 'Revoluční 4D Guidance System™ se přizpůsobuje unavujícímu se došlapu. Širší základna a PureGEL pod patou zajišťují maximální odlehčení kloubů.'
                    : '4D Guidance System adaptive stability adapts to foot movement while PureGEL attenuates peak vertical loading.'}
                </p>
                <div className="text-[11px] font-mono text-slate-400 mt-1.5">
                  {isCs ? 'Dostupné šířky: 2E Wide Fit • EU 41–47' : 'Size: 2E Wide Fit • EU 41–47'}
                </div>
              </div>

              {/* Where to Buy */}
              <div className="border-t border-cyan-500/20 pt-3">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block mb-2">
                  {isCs ? 'Kde koupit (Evropské obchody):' : 'Where to Buy (European Stores):'}
                </span>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-[#060c18] border border-cyan-500/15">
                    <span className="font-semibold text-slate-200">Top4Running</span>
                    <span className="font-mono font-bold text-white">4 690 Kč (€184.95)</span>
                    <a 
                      href="https://top4running.cz" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-teal-500/20 border border-teal-400/40 text-teal-300 text-[11px] font-bold hover:bg-teal-500 hover:text-slate-950 transition-all flex items-center gap-1"
                    >
                      <span>KOUPIT</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-[#060c18] border border-cyan-500/15">
                    <span className="font-semibold text-slate-200">21run EU</span>
                    <span className="font-mono font-bold text-white">4 590 Kč (€179.95)</span>
                    <a 
                      href="https://21run.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-[11px] font-bold hover:bg-cyan-500 hover:text-slate-950 transition-all flex items-center gap-1"
                    >
                      <span>KOUPIT</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* COLUMN 3: QUICK HEALTH & BIOMECHANICAL SUMMARY (Right 3 cols) */}
          <div className="lg:col-span-3 bg-[#091220]/90 border border-cyan-500/20 rounded-2xl p-5 shadow-xl relative flex flex-col justify-between h-full">
            <div>
              <h2 className="text-base font-extrabold text-white tracking-tight mb-3">
                {isCs ? 'Rychlý zdravotní přehled' : 'Quick Health Summary'}
              </h2>

              {/* Holographic 3D Medical Render of Knee & Foot (From Mockup B) */}
              <div className="relative w-full h-44 rounded-xl overflow-hidden bg-[#040812] border border-cyan-500/25 mb-4 shadow-inner">
                <Image 
                  src="/images/knee-foot-telemetry.jpg"
                  alt="Knee and Foot Biomechanical Telemetry"
                  fill
                  className="object-cover object-center"
                />
                <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-mono text-cyan-300 border border-cyan-500/30">
                  SCAN: KNEE & TALUS
                </div>
              </div>

              {/* Progress Gauges */}
              <div className="space-y-3.5 mb-5">
                {/* Metric 1 */}
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-slate-300 font-medium">{isCs ? 'Biomechanická analýza' : 'Analysis Score'}</span>
                    <span className="text-cyan-400 font-bold">8.5 / 10</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#050c18] overflow-hidden border border-cyan-500/20">
                    <div className="h-full w-[85%] bg-gradient-to-r from-cyan-500 to-teal-400 rounded-full shadow-[0_0_8px_#06b6d4]" />
                  </div>
                </div>

                {/* Metric 2 */}
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-slate-300 font-medium">{isCs ? 'Ochrana kolene (Knee)' : 'Knee Health'}</span>
                    <span className="text-teal-400 font-bold">8.5 / 10</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#050c18] overflow-hidden border border-cyan-500/20">
                    <div className="h-full w-[85%] bg-gradient-to-r from-cyan-400 to-teal-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
                  </div>
                </div>
              </div>

              {/* Clinical Guardrails Snapshot */}
              <div className="p-3.5 rounded-xl bg-[#060c18] border border-cyan-500/20 space-y-2 text-xs mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{isCs ? 'Doporučený drop:' : 'Drop Limit:'}</span>
                  <span className="font-mono font-bold text-cyan-300">4–8 mm (Bezpečný)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{isCs ? 'Podešev kolébky:' : 'Rocker Sole:'}</span>
                  <span className="font-mono font-bold text-teal-300">Aktivní kolébka</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{isCs ? 'Odlehčení chrupavky:' : 'Load Reduction:'}</span>
                  <span className="font-mono font-bold text-cyan-300">+32% nižší tlak</span>
                </div>
              </div>
            </div>

            {/* Upcoming Appointment / Fitting Consultation Card */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-950/60 to-[#060c18] border border-cyan-400/30 text-xs">
              <div className="flex items-center gap-2 mb-1 text-cyan-300 font-bold">
                <Calendar className="w-3.5 h-3.5" />
                <span>{isCs ? 'Online konzultace s fitting specialistou' : 'Upcoming Fitting Consultation'}</span>
              </div>
              <p className="text-[11px] text-slate-300 mb-3">
                {isCs 
                  ? 'AI fitting specialista je připraven detailně probrat vaše preference a vyhodnotit došlap.'
                  : 'AI fitting specialist is standing by to evaluate your kinetic preferences.'}
              </p>

              <button
                type="button"
                onClick={onOpenChat}
                className="w-full py-2 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-cyan-950"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{isCs ? 'Zahájit podiatrický chat' : 'Start Podiatry Chat'}</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
