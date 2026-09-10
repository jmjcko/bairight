'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { IntakeFormData, AgentPrescriptionResult } from '@/lib/agent/markdown-agent-loader';
import { translations, SupportedLocale } from '@/lib/i18n/translations';
import { VerifiedShoeCard } from './VerifiedShoeCard';
import { ClinicalAssessmentModal } from './ClinicalAssessmentModal';
import { AnalysisModal } from './AnalysisModal';
import { AppointmentsModal } from './AppointmentsModal';
import { RecommendationsModal } from './RecommendationsModal';
import { 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  ShieldAlert, 
  ShieldCheck, 
  FileText, 
  Activity, 
  Ban, 
  HeartHandshake, 
  Footprints, 
  Layers, 
  RefreshCw,
  Clock,
  ExternalLink,
  Info,
  Calendar,
  Layers3,
  Stethoscope,
  Sliders,
  ArrowLeft,
  RotateCcw
} from 'lucide-react';

const BRAND_OPTIONS = [
  'Hoka', 
  'Brooks', 
  'Asics', 
  'New Balance', 
  'Saucony', 
  'Altra', 
  'Nike', 
  'Adidas', 
  'On Running', 
  'Puma', 
  'Mizuno'
];

// Top 3 Verified Models (Clean data, zero fake pictures, zero fake discounts)
const DEFAULT_TOP_3_MODELS = [
  {
    id: 'asics-gel-kayano-30',
    brand: 'ASICS',
    model: 'Gel-Kayano 30 (2E Wide Last)',
    badgeLabel: 'Hlavní doporučení',
    heel_drop_mm: 10,
    cushion_level: 'Maximální plyšové',
    width_fitting: 'Široké kopyto 2E',
    rocker_geometry: true,
    is_2e_available: true,
    european_price_eur: 179.90,
    matchScore: 98,
    medical_rationale: 'Pěna FF BLAST™ PLUS a 4D GUIDANCE SYSTEM™ poskytují adaptivní tlumení, které efektivně absorbuje rázové zatížení chrupavky u artrózy kolene 3. stupně. Široké kopyto 2E zabraňuje tlaku na prsty.',
  },
  {
    id: 'brooks-adrenaline-gts-23',
    brand: 'Brooks',
    model: 'Adrenaline GTS 23 (2E Wide)',
    badgeLabel: 'Vhodné pro supinaci',
    heel_drop_mm: 12,
    cushion_level: 'Vyvážené stabilní',
    width_fitting: '2E Wide Fit',
    rocker_geometry: true,
    is_2e_available: true,
    european_price_eur: 149.95,
    matchScore: 96,
    medical_rationale: 'Holistická stabilita GuideRails® drží nadměrný pohyb v patě bez vnitřního pronačního klínu, což je zásadní pro ochranu supinujícího chodidla a kloubní štěrbiny kolene.',
  },
  {
    id: 'hoka-bondi-8-wide',
    brand: 'Hoka',
    model: 'Bondi 8 Wide (2E Kopyto)',
    badgeLabel: 'Maximální tlumení',
    heel_drop_mm: 4,
    cushion_level: 'Ultra-tlumení nárazů',
    width_fitting: '2E Wide Fit',
    rocker_geometry: true,
    is_2e_available: true,
    european_price_eur: 169.90,
    matchScore: 95,
    medical_rationale: 'Kolébková podrážka Meta-Rocker a nízký 4mm drop zkracují pákový ohyb v koleni při odrazu a eliminují rázové přetížení při chůzi i běhu.',
  }
];

const DEFAULT_FORM_DATA: IntakeFormData = {
  product_category: 'running_shoes',
  foot_length_mm: 275,
  foot_length_cm: 27.5,
  foot_width_mm: 100,
  eu_size: 43,
  foot_width: 'standard_d',
  strike_pattern: 'heel_strike',
  foot_mechanics: 'neutral',
  activity_type: ['road_running'],
  weekly_volume: '15_to_35_km',
  cushioning_preference: 'maximum',
  preferred_brands: ['Asics', 'Brooks', 'Hoka'],
  forbidden_brands: [],
  joint_conditions: [],
  foot_conditions: [],
  past_surgeries: [],
  budget_eur: 180,
};

interface IntakeWizardProps {
  onOpenAnalysis?: () => void;
  onOpenAppointments?: () => void;
  onOpenRecommendations?: () => void;
}

export const IntakeWizard: React.FC<IntakeWizardProps> = ({
  onOpenAnalysis,
  onOpenAppointments,
  onOpenRecommendations,
}) => {
  const [locale] = useState<SupportedLocale>('cs');
  const t = translations[locale].wizard;

  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [result, setResult] = useState<AgentPrescriptionResult | null>(null);
  const [kneePainLevel, setKneePainLevel] = useState<number>(3);

  // Modals state
  const [isClinicalAssessmentOpen, setIsClinicalAssessmentOpen] = useState<boolean>(false);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState<boolean>(false);
  const [isAppointmentsModalOpen, setIsAppointmentsModalOpen] = useState<boolean>(false);
  const [isRecommendationsModalOpen, setIsRecommendationsModalOpen] = useState<boolean>(false);

  // Form State with precise length and width in mm
  const [formData, setFormData] = useState<IntakeFormData>(DEFAULT_FORM_DATA);

  const handleResetForm = () => {
    setFormData(DEFAULT_FORM_DATA);
    setStep(1);
    setResult(null);
    setKneePainLevel(3);
  };

  const handleLengthChange = (lengthMm: number) => {
    setFormData((prev) => ({
      ...prev,
      foot_length_mm: lengthMm,
      foot_length_cm: Number((lengthMm / 10).toFixed(1)),
      eu_size: Math.round((lengthMm + 15) / 6.67),
    }));
  };

  const handleWidthChange = (widthMm: number) => {
    let calculatedWidth: IntakeFormData['foot_width'] = 'standard_d';
    if (widthMm > 110) calculatedWidth = 'extra_wide_4e';
    else if (widthMm >= 103) calculatedWidth = 'wide_2e';
    else if (widthMm < 95) calculatedWidth = 'narrow_b';

    setFormData((prev) => ({
      ...prev,
      foot_width_mm: widthMm,
      foot_width: calculatedWidth,
    }));
  };

  const toggleArrayItem = (field: keyof IntakeFormData, value: string) => {
    setFormData((prev) => {
      const arr = (prev[field] as string[]) || [];
      const exists = arr.includes(value);
      return {
        ...prev,
        [field]: exists ? arr.filter((x) => x !== value) : [...arr, value],
      };
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/agent/evaluate-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to evaluate profile with agent');
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error('Error submitting wizard to agent:', err);
      alert('Chyba při komunikaci s vyhodnocovacím agentem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepTitles = [
    'Rozměry chodidla (mm)',
    'Šířka kopyta & došlap',
    'Aktivity a objem',
    'Zdravotní anamnéza kloubů',
    'Značky & rozpočet',
  ];

  const totalSteps = 5;
  const progressPercent = Math.round((step / totalSteps) * 100);

  // Derive Top 3 recommendations (from API evaluation result or clinical default models)
  const displayModels = result?.recommendations?.length
    ? result.recommendations.slice(0, 3).map((shoe, idx) => ({
        ...shoe,
        badgeLabel: idx === 0 ? 'Hlavní doporučení' : idx === 1 ? 'Alternativní model č. 2' : 'Doporučený model č. 3'
      }))
    : DEFAULT_TOP_3_MODELS;

  // =========================================================================
  // FÁZE 1: ZVÝRAZNĚNÝ, DOMINANTNÍ VSTUPNÍ DOTAZNÍK (dokud se nevygenerují návrhy)
  // =========================================================================
  if (!result) {
    return (
      <div className="w-full max-w-4xl mx-auto py-4">
        {/* Dominant Centered Wizard Container */}
        <div className="glass-panel rounded-3xl p-6 sm:p-10 border-2 border-cyan-500/40 shadow-[0_25px_80px_rgba(6,182,212,0.18)] relative overflow-hidden">
          {/* Ambient Glows */}
          <div className="absolute -top-32 -left-32 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Wizard Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-cyan-500/20">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-cyan-950/90 border border-cyan-400/50 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                  <Footprints className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    Biometrický dotazník chodidla
                  </h1>
                  <p className="text-xs sm:text-sm text-cyan-300 font-mono mt-0.5">
                    Krok {step} z {totalSteps}: {stepTitles[step - 1]}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 self-end sm:self-auto">
                {/* Reset button available on EVERY step of the wizard */}
                <button
                  onClick={handleResetForm}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700 text-xs font-mono transition-colors cursor-pointer"
                  title="Resetovat formulář na výchozí hodnoty"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Reset formuláře</span>
                </button>

                <span className="text-xs font-mono px-3.5 py-1.5 rounded-full bg-cyan-950/90 border border-cyan-400/50 text-cyan-300 font-bold shadow-inner">
                  {progressPercent}% DOKONČENO
                </span>
              </div>
            </div>

            {/* Progress Step Indicator */}
            <div className="grid grid-cols-5 gap-2 mt-6">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setStep(s)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    s === step
                      ? 'bg-gradient-to-r from-cyan-400 to-teal-400 shadow-[0_0_12px_rgba(6,182,212,0.8)]'
                      : s < step
                      ? 'bg-cyan-600/70'
                      : 'bg-slate-800'
                  }`}
                  title={`Přejít na krok ${s}`}
                />
              ))}
            </div>
          </div>

          {/* Form Step Body */}
          <div className="min-h-[380px] flex flex-col justify-between">
            {/* KROK 1: PŘESNÉ ROZMĚRY V MM (POSUVNÍKY) */}
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="p-4 rounded-2xl bg-[#070f1e] border border-cyan-500/20 text-xs text-slate-300 flex items-start gap-3">
                  <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <p>
                    Zadejte přesnou délku a šířku vašeho chodidla v milimetrech (např. obkreslením na papír). 
                    Systém automaticky vypočítá potřebnou šířku kopyta pro prevenci útlaku prstů.
                  </p>
                </div>

                {/* Foot Length Slider */}
                <div className="p-5 rounded-2xl bg-[#060c18] border border-slate-800/90 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-white flex items-center gap-2">
                      <Footprints className="w-4 h-4 text-cyan-400" />
                      <span>Délka chodidla:</span>
                    </label>
                    <div className="font-mono text-cyan-300 font-extrabold text-base bg-cyan-950/80 px-3 py-1 rounded-xl border border-cyan-500/30">
                      {formData.foot_length_mm} mm{' '}
                      <span className="text-xs text-slate-400 font-normal">({formData.foot_length_cm} cm)</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={220}
                    max={330}
                    step={1}
                    value={formData.foot_length_mm}
                    onChange={(e) => handleLengthChange(Number(e.target.value))}
                    className="w-full accent-cyan-400 h-2.5 bg-slate-900 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] font-mono text-slate-500">
                    <span>220 mm (EU 35)</span>
                    <span>280 mm (EU 44)</span>
                    <span>330 mm (EU 51)</span>
                  </div>
                </div>

                {/* Foot Width Slider */}
                <div className="p-5 rounded-2xl bg-[#060c18] border border-slate-800/90 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-white flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-teal-400" />
                      <span>Šířka v nejširším místě (klouby prstů):</span>
                    </label>
                    <div className="font-mono text-teal-300 font-extrabold text-base bg-cyan-950/80 px-3 py-1 rounded-xl border border-cyan-500/30">
                      {formData.foot_width_mm} mm{' '}
                      <span className="text-xs text-slate-400 font-normal">({formData.foot_width === 'wide_2e' ? 'Široké 2E' : formData.foot_width})</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={85}
                    max={125}
                    step={1}
                    value={formData.foot_width_mm}
                    onChange={(e) => handleWidthChange(Number(e.target.value))}
                    className="w-full accent-teal-400 h-2.5 bg-slate-900 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] font-mono text-slate-500">
                    <span>85 mm (Úzké B)</span>
                    <span>104 mm (Široké 2E)</span>
                    <span>125 mm (Extra široké 4E)</span>
                  </div>
                </div>

                {/* Calculated Shoe Last Preview */}
                <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block font-mono">Doporučená velikost & šířka kopyta:</span>
                    <span className="text-base font-extrabold text-white">
                      EU {formData.eu_size} • Kopyto {formData.foot_width === 'wide_2e' ? '2E (Wide Fit)' : formData.foot_width}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-cyan-300 font-bold px-3 py-1 rounded-lg bg-cyan-950/80 border border-cyan-500/30">
                    Vypočtené kopyto
                  </span>
                </div>
              </div>
            )}

            {/* KROK 2: ŠÍŘKA KOPYTA & DOŠLAP */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <label className="block text-sm font-bold text-white mb-2">
                    Kategorie šířky chodidla (kopyto):
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { id: 'narrow_b', label: 'B (Úzké)', desc: '< 98 mm' },
                      { id: 'standard_d', label: 'D (Standard)', desc: '98–102 mm' },
                      { id: 'wide_2e', label: '2E (Široké)', desc: '103–110 mm' },
                      { id: 'extra_wide_4e', label: '4E (Extra široké)', desc: '> 110 mm' },
                    ].map((w) => {
                      const active = formData.foot_width === w.id;
                      return (
                        <button
                          key={w.id}
                          onClick={() => setFormData((p) => ({ ...p, foot_width: w.id as any }))}
                          className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                            active
                              ? 'bg-cyan-950/90 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400'
                              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <div className="font-bold text-sm">{w.label}</div>
                          <div className="text-[11px] font-mono text-slate-400 mt-0.5">{w.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-white mb-2">
                    Biomechanika došlapu (rotace kotníku):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: 'supination', label: 'Supinace (Vnější hrana)', desc: 'Chodidlo rotuje ven, zákaz pronačních klínů' },
                      { id: 'neutral', label: 'Neutrální došlap', desc: 'Rovnoměrné rozložení tlaků' },
                      { id: 'mild_overpronation', label: 'Pronace (Vnitřní sešlap)', desc: 'Kolaps klenby dovnitř' },
                    ].map((m) => {
                      const active = formData.foot_mechanics === m.id;
                      return (
                        <button
                          key={m.id}
                          onClick={() => setFormData((p) => ({ ...p, foot_mechanics: m.id as any }))}
                          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                            active
                              ? 'bg-cyan-950/90 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400'
                              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <div className="font-bold text-xs sm:text-sm">{m.label}</div>
                          <div className="text-[11px] text-slate-400 mt-1">{m.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* KROK 3: AKTIVITY A OBJEM */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <label className="block text-sm font-bold text-white mb-2">
                    Kde a jak budete obuv používat:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { id: 'road_running', label: 'Běh po asfaltu a silnici', desc: 'Vyžaduje tlumení rázů pro kolena' },
                      { id: 'daily_walking', label: 'Běžná chůze a celodenní stání', desc: 'Vyžaduje stabilitu a široké kopyto' },
                      { id: 'trail_running', label: 'Běh v terénu a lesních cestách', desc: 'Grip a boční stabilita' },
                      { id: 'gym_fitness', label: 'Fitness a posilovna', desc: 'Pevná platforma' },
                    ].map((act) => {
                      const active = formData.activity_type.includes(act.id);
                      return (
                        <button
                          key={act.id}
                          onClick={() => toggleArrayItem('activity_type', act.id)}
                          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                            active
                              ? 'bg-cyan-950/90 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400'
                              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <div>
                            <div className="font-bold text-xs sm:text-sm">{act.label}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">{act.desc}</div>
                          </div>
                          {active ? <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 ml-2" /> : <div className="w-5 h-5 rounded-full border border-slate-700 shrink-0 ml-2" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-white mb-2">
                    Týdenní objem kilometrů:
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'under_15_km', label: '< 15 km / týden' },
                      { id: '15_to_35_km', label: '15–35 km / týden' },
                      { id: 'over_35_km', label: '> 35 km / týden' },
                    ].map((vol) => {
                      const active = formData.weekly_volume === vol.id;
                      return (
                        <button
                          key={vol.id}
                          onClick={() => setFormData((p) => ({ ...p, weekly_volume: vol.id as any }))}
                          className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
                            active
                              ? 'bg-cyan-950/90 border-cyan-400 text-white shadow-sm ring-1 ring-cyan-400'
                              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <div className="font-bold text-xs">{vol.label}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* KROK 4: ZDRAVOTNÍ ANAMNÉZA KLOUBŮ */}
            {step === 4 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="p-5 rounded-2xl bg-[#060c18] border border-cyan-500/30 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-white flex items-center gap-2">
                      <Activity className="w-4 h-4 text-amber-400" />
                      <span>Intenzita bolesti kolene při zátěži (1–10):</span>
                    </label>
                    <span className="font-mono text-amber-300 font-extrabold text-base bg-amber-950/80 px-3 py-1 rounded-xl border border-amber-500/30">
                      Stupeň {kneePainLevel} / 10
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={kneePainLevel}
                    onChange={(e) => setKneePainLevel(Number(e.target.value))}
                    className="w-full accent-amber-400 h-2.5 bg-slate-900 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] font-mono text-slate-500">
                    <span>1 (Bez bolesti)</span>
                    <span>5 (Mírná zátěž)</span>
                    <span>10 (Akutní artróza 3. stupně)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-white mb-2">
                    Lékařské diagnózy kloubů a chodidel:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { id: 'Knee Osteoarthritis Grade 3', label: 'Artróza kolene 3. stupně (Gonartróza)' },
                      { id: 'Plantar Fasciitis (Patní ostruha)', label: 'Plantární fasciitida (Patní ostruha)' },
                      { id: 'Hallux Valgus (Vbočený palec)', label: 'Hallux Valgus (Vbočený palec)' },
                      { id: 'Meniscus Partial Resection', label: 'Částečná resekce menisku' }
                    ].map((cond) => {
                      const active = formData.joint_conditions.includes(cond.id);
                      return (
                        <button
                          key={cond.id}
                          onClick={() => toggleArrayItem('joint_conditions', cond.id)}
                          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                            active
                              ? 'bg-cyan-950/90 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400'
                              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <span className="text-xs font-semibold">{cond.label}</span>
                          {active ? <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" /> : <div className="w-5 h-5 rounded-full border border-slate-700 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* KROK 5: ZNAČKY & ROZPOČET */}
            {step === 5 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <label className="block text-sm font-bold text-white mb-2">
                    Preferovaní výrobci se širokým kopytem 2E:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {BRAND_OPTIONS.map((brand) => {
                      const active = formData.preferred_brands.includes(brand);
                      return (
                        <button
                          key={brand}
                          onClick={() => toggleArrayItem('preferred_brands', brand)}
                          className={`p-3 rounded-xl border text-center transition-all cursor-pointer text-xs font-bold ${
                            active
                              ? 'bg-cyan-950/90 border-cyan-400 text-white shadow-sm ring-1 ring-cyan-400'
                              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {brand}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#060c18] border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-white">
                      Orientační rozpočet na pár obuvi:
                    </label>
                    <span className="font-mono text-cyan-300 font-extrabold text-base bg-cyan-950/80 px-3 py-1 rounded-xl border border-cyan-500/30">
                      do {Math.round((formData.budget_eur || 190) * 25.2).toLocaleString('cs-CZ')} Kč{' '}
                      <span className="text-xs text-slate-400 font-normal">(€{formData.budget_eur || 190})</span>
                    </span>
                  </div>
                  <input
                    type="range"
                    min={100}
                    max={250}
                    step={10}
                    value={formData.budget_eur || 190}
                    onChange={(e) => setFormData((p) => ({ ...p, budget_eur: Number(e.target.value) }))}
                    className="w-full accent-cyan-400 h-2.5 bg-slate-900 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Navigation Buttons with Reset on every step */}
            <div className="pt-6 border-t border-cyan-500/20 flex items-center justify-between gap-3 mt-8">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setStep((s) => Math.max(1, s - 1))}
                  disabled={step === 1}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Předchozí krok</span>
                </button>

                <button
                  onClick={handleResetForm}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs text-slate-400 hover:text-rose-300 hover:bg-rose-950/30 border border-slate-800/80 hover:border-rose-500/30 transition-all cursor-pointer"
                  title="Resetovat formulář na výchozí hodnoty"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Reset formuláře</span>
                </button>
              </div>

              {step < 5 ? (
                <button
                  onClick={() => setStep((s) => Math.min(5, s + 1))}
                  className="flex items-center gap-2 px-8 py-3.5 rounded-2xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:brightness-110 transition-all cursor-pointer"
                >
                  <span>Pokračovat</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center gap-2.5 px-9 py-4 rounded-2xl text-xs sm:text-sm font-extrabold bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 text-slate-950 shadow-[0_0_30px_rgba(6,182,212,0.8)] hover:scale-105 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-5 h-5 animate-pulse" />
                  <span>{isSubmitting ? 'Vyhodnocuji profil...' : 'Vygenerovat návrhy obuvi'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // FÁZE 2: "ROZSVÍCENÝ" VÝSLEDEK = VÝBĚR BOT S AKČNÍM TLAČÍTKEM POSUDKU
  // =========================================================================
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Top Banner: Clinical Prescription Header & Action Controls */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border-2 border-cyan-400/60 shadow-[0_20px_60px_rgba(6,182,212,0.25)] relative overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-400/40 flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Biometrická analýza dokončena
              </span>
              <span className="text-xs font-mono text-slate-400">
                Parametry: {formData.foot_length_mm} × {formData.foot_width_mm} mm • Kopyto 2E • Gonartróza 3. st.
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Doporučený výběr vhodné obuvi
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Na základě zadaných biometrických rozměrů a diagnózy vybral asistent 3 modely obuvi odpovídající zadaným biomechanickým parametrům (kolébková podrážka, odpovídající drop, kopyto 2E).
            </p>
          </div>

          {/* Action Buttons: Medical Report Overlay, Consultation, Edit Inputs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {/* Primary Action Button: Upravit zadání (Zvýrazněné dominantní tlačítko) */}
            <button
              onClick={() => setResult(null)}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-extrabold text-xs sm:text-sm bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 shadow-[0_0_22px_rgba(6,182,212,0.45)] hover:brightness-110 transition-all cursor-pointer group"
              title="Vrátit se a upravit zadaná biometrická data"
            >
              <ArrowLeft className="w-4 h-4 text-slate-950 group-hover:-translate-x-0.5 transition-transform" />
              <span>Upravit zadání dotazníku</span>
            </button>

            {/* Subtle Action Button: Medical Report Overlay (Odvyrazněné vedlejší tlačítko) */}
            <button
              onClick={() => setIsClinicalAssessmentOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-medium text-xs bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 hover:border-slate-600 transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4 text-slate-400" />
              <span>Biomechanický rozbor</span>
            </button>

            {/* Secondary Action: Appointments Modal */}
            <button
              onClick={() => {
                if (onOpenAppointments) onOpenAppointments();
                else setIsAppointmentsModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-medium text-xs bg-slate-900/80 hover:bg-cyan-950/60 text-cyan-300/80 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/30 transition-all cursor-pointer"
            >
              <Stethoscope className="w-4 h-4 text-cyan-400/80" />
              <span>Konzultace s odborníkem</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top 3 Verified Shoes Listing (Zero fake info, real live search links) */}
      <div>
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider font-mono">
            <Footprints className="w-4 h-4 text-cyan-400" />
            <span>Top 3 doporučené modely (Kopyto 2E)</span>
          </div>

          <button
            onClick={() => {
              if (onOpenRecommendations) onOpenRecommendations();
              else setIsRecommendationsModalOpen(true);
            }}
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono underline transition-colors cursor-pointer"
          >
            <span>Zobrazit celou databázi 20+ modelů</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3 Dominant Shoe Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {displayModels.map((shoe, idx) => (
            <VerifiedShoeCard
              key={shoe.id}
              rank={idx + 1}
              badgeLabel={(shoe as any).badgeLabel}
              shoe={shoe as any}
            />
          ))}
        </div>

        {/* Bottom Prompt Bar: Prominent Edit Inputs Action */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900/90 via-[#071324] to-slate-900/90 border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 shadow-lg">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shrink-0 shadow-inner">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">Chcete změnit naměřené rozměry, značky nebo rozpočet?</div>
              <div className="text-xs text-slate-400">Upravením biometrických dat agent okamžitě přepočítá vhodnost modelů.</div>
            </div>
          </div>
          <button
            onClick={() => setResult(null)}
            className="px-6 py-3 rounded-xl font-extrabold text-xs sm:text-sm bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Upravit zadání dotazníku</span>
          </button>
        </div>
      </div>

      {/* Overlay Modals */}
      <ClinicalAssessmentModal
        isOpen={isClinicalAssessmentOpen}
        onClose={() => setIsClinicalAssessmentOpen(false)}
        result={result}
        formData={formData}
      />

      <AnalysisModal
        isOpen={isAnalysisModalOpen}
        onClose={() => setIsAnalysisModalOpen(false)}
        footLengthMm={formData.foot_length_mm || 280}
        footWidthMm={formData.foot_width_mm || 104}
        kneeCondition={formData.joint_conditions[0] || 'Knee Osteoarthritis Grade 3'}
      />

      <AppointmentsModal
        isOpen={isAppointmentsModalOpen}
        onClose={() => setIsAppointmentsModalOpen(false)}
      />

      <RecommendationsModal
        isOpen={isRecommendationsModalOpen}
        onClose={() => setIsRecommendationsModalOpen(false)}
      />
    </div>
  );
};
