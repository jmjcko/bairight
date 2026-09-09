'use client';

import React, { useState } from 'react';
import { IntakeFormData, AgentPrescriptionResult } from '@/lib/agent/markdown-agent-loader';
import { translations, SupportedLocale } from '@/lib/i18n/translations';
import { ShoeRecommendationCard } from './ShoeRecommendationCard';
import { BiomechanicalHUD } from './BiomechanicalHUD';
import { 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  ShieldAlert, 
  ShieldCheck, 
  FileCode2, 
  Activity, 
  Ban, 
  HeartHandshake, 
  Footprints, 
  Layers, 
  RefreshCw,
  Languages
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

export const IntakeWizard: React.FC = () => {
  const [locale, setLocale] = useState<SupportedLocale>('cs');
  const t = translations[locale].wizard;

  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [result, setResult] = useState<AgentPrescriptionResult | null>(null);

  // Form State
  const [formData, setFormData] = useState<IntakeFormData>({
    product_category: 'running_shoes',
    foot_length_cm: 28,
    eu_size: 44,
    foot_width: 'wide_2e',
    strike_pattern: 'heel_strike',
    foot_mechanics: 'supination',
    activity_type: ['road_running', 'daily_walking'],
    weekly_volume: '15_to_35_km',
    cushioning_preference: 'maximum',
    preferred_brands: ['Hoka', 'Brooks'],
    forbidden_brands: ['Nike'],
    joint_conditions: ['Knee Osteoarthritis Grade 3'],
    foot_conditions: [],
    past_surgeries: ['Meniscus Partial Resection'],
    budget_eur: 190,
  });

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
      setStep(7); // Results step
    } catch (err) {
      console.error('Error submitting wizard to agent:', err);
      alert('Chyba při komunikaci s vyhodnocovacím agentem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 my-4">
      {/* Wizard Header */}
      <div className="glass-panel rounded-2xl p-6 mb-6 shadow-2xl shadow-cyan-950/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -right-20 -top-20 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
              {t.badge}
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-400 font-mono">
              <FileCode2 className="w-3.5 h-3.5 text-teal-400" />
              {t.agentSource}
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            {t.title}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t.subtitle}
          </p>
        </div>

        {/* Locale toggle & Step indicator */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Language Switcher */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
            <Languages className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-0.5" />
            <button
              onClick={() => setLocale('cs')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                locale === 'cs' 
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              CZ
            </button>
            <button
              onClick={() => setLocale('en')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                locale === 'en' 
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              EN
            </button>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/80 px-4 py-2 rounded-xl border border-cyan-500/30 shrink-0 shadow-inner">
            <span className="text-xs text-slate-400 font-medium">{t.stepIndicator}</span>
            <span className="text-xs font-bold text-cyan-400 font-mono">
              {step < 7 ? `${step} / 6` : t.prescriptionReady}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Tabs */}
      {step < 7 && (
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 mb-8">
          {[
            t.steps.step1,
            t.steps.step2,
            t.steps.step3,
            t.steps.step4,
            t.steps.step5,
            t.steps.step6,
          ].map((title, i) => {
            const stepNum = i + 1;
            const isActive = step === stepNum;
            const isDone = step > stepNum;
            return (
              <button
                key={i}
                onClick={() => setStep(stepNum)}
                className={`text-left p-3 rounded-xl border transition-all duration-200 ${
                  isActive
                    ? 'glass-panel-active border-cyan-400 text-white shadow-lg shadow-cyan-950/40'
                    : isDone
                    ? 'glass-panel border-teal-500/40 text-slate-200 hover:border-teal-500/60'
                    : 'bg-slate-950/50 border-slate-800/80 text-slate-500 hover:border-slate-700'
                }`}
              >
                <div className="text-[11px] font-bold tracking-tight mb-0.5 flex items-center justify-between">
                  <span>{title}</span>
                  {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* 2-Column Split Bio-Tech Dashboard (Steps 1 to 6) */}
      {step < 7 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Step Forms & User Intake (Primary Interaction) */}
          <div className="lg:col-span-8 flex flex-col justify-between space-y-6">
            <div>
              {/* STEP 1: Product Selection */}
              {step === 1 && (
                <div className="glass-panel rounded-2xl p-6 space-y-6">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Footprints className="w-5 h-5 text-cyan-400" />
                    {t.step1.title}
                  </h3>
          <p className="text-sm text-slate-400">
            {t.step1.desc}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {[
              {
                id: 'running_shoes',
                title: t.step1.runningTitle,
                desc: t.step1.runningDesc,
                active: formData.product_category === 'running_shoes',
              },
              {
                id: 'walking_shoes',
                title: t.step1.walkingTitle,
                desc: t.step1.walkingDesc,
                active: formData.product_category === 'walking_shoes',
              },
              {
                id: 'orthotics_insoles',
                title: t.step1.insolesTitle,
                desc: t.step1.insolesDesc,
                active: formData.product_category === 'orthotics_insoles',
                disabled: true,
              },
            ].map((card) => (
              <button
                key={card.id}
                disabled={card.disabled}
                onClick={() => setFormData({ ...formData, product_category: card.id })}
                className={`p-5 rounded-2xl text-left border transition-all ${
                  card.active
                    ? 'glass-panel-active border-cyan-400 text-white ring-1 ring-cyan-400/60 shadow-lg shadow-cyan-950/40'
                    : card.disabled
                    ? 'bg-slate-950/30 border-slate-800/50 text-slate-600 opacity-60 cursor-not-allowed'
                    : 'glass-panel border-slate-800 hover:border-cyan-500/40 text-slate-300'
                }`}
              >
                <div className="font-bold text-base mb-1">{card.title}</div>
                <p className="text-xs text-slate-400 leading-relaxed">{card.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2: Foot Sizing & Width */}
      {step === 2 && (
        <div className="glass-panel rounded-2xl p-6 space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-400" />
            {t.step2.title}
          </h3>
          <p className="text-sm text-slate-400">
            {t.step2.desc}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                {t.step2.sizeLabel}
              </label>
              <select
                value={formData.eu_size}
                onChange={(e) => setFormData({ ...formData, eu_size: Number(e.target.value) })}
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
              >
                {[40, 41, 42, 43, 44, 45, 46, 47, 48].map((size) => (
                  <option key={size} value={size}>
                    EU {size}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                {t.step2.widthLabel}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'standard_d', label: t.step2.widths.standard.label, desc: t.step2.widths.standard.desc },
                  { id: 'wide_2e', label: t.step2.widths.wide2e.label, desc: t.step2.widths.wide2e.desc },
                  { id: 'extra_wide_4e', label: t.step2.widths.wide4e.label, desc: t.step2.widths.wide4e.desc },
                  { id: 'narrow_b', label: t.step2.widths.narrow.label, desc: t.step2.widths.narrow.desc },
                ].map((w) => (
                  <button
                    key={w.id}
                    onClick={() => setFormData({ ...formData, foot_width: w.id as any })}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      formData.foot_width === w.id
                        ? 'bg-teal-950/70 border-teal-400 text-white ring-1 ring-teal-400/60 shadow-md shadow-teal-950/40'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-cyan-500/40'
                    }`}
                  >
                    <div className="font-bold text-xs">{w.label}</div>
                    <div className="text-[10px] text-slate-400">{w.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Gait & Mechanics */}
      {step === 3 && (
        <div className="glass-panel rounded-2xl p-6 space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Footprints className="w-5 h-5 text-cyan-400" />
            {t.step3.title}
          </h3>
          <p className="text-sm text-slate-400">
            {t.step3.desc}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                {t.step3.strikeLabel}
              </label>
              <div className="space-y-2">
                {[
                  { id: 'heel_strike', label: t.step3.strikes.heel.label, desc: t.step3.strikes.heel.desc },
                  { id: 'midfoot_strike', label: t.step3.strikes.midfoot.label, desc: t.step3.strikes.midfoot.desc },
                  { id: 'forefoot_strike', label: t.step3.strikes.forefoot.label, desc: t.step3.strikes.forefoot.desc },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setFormData({ ...formData, strike_pattern: item.id as any })}
                    className={`w-full p-3 rounded-xl border text-left transition-all ${
                      formData.strike_pattern === item.id
                        ? 'bg-cyan-950/60 border-cyan-400 text-white ring-1 ring-cyan-400/60 shadow-md shadow-cyan-950/40'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-cyan-500/40'
                    }`}
                  >
                    <div className="font-bold text-xs">{item.label}</div>
                    <div className="text-[11px] text-slate-400">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                {t.step3.rollLabel}
              </label>
              <div className="space-y-2">
                {[
                  { id: 'supination', label: t.step3.rolls.supination.label, desc: t.step3.rolls.supination.desc },
                  { id: 'neutral', label: t.step3.rolls.neutral.label, desc: t.step3.rolls.neutral.desc },
                  { id: 'mild_overpronation', label: t.step3.rolls.pronation.label, desc: t.step3.rolls.pronation.desc },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setFormData({ ...formData, foot_mechanics: item.id as any })}
                    className={`w-full p-3 rounded-xl border text-left transition-all ${
                      formData.foot_mechanics === item.id
                        ? 'bg-cyan-950/60 border-cyan-400 text-white ring-1 ring-cyan-400/60 shadow-md shadow-cyan-950/40'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-cyan-500/40'
                    }`}
                  >
                    <div className="font-bold text-xs">{item.label}</div>
                    <div className="text-[11px] text-slate-400">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: Activity & Volume */}
      {step === 4 && (
        <div className="glass-panel rounded-2xl p-6 space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-teal-400" />
            {t.step4.title}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                {t.step4.activityLabel}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'road_running', label: t.step4.activities.road },
                  { id: 'trail_running', label: t.step4.activities.trail },
                  { id: 'daily_walking', label: t.step4.activities.walking },
                  { id: 'standing_work', label: t.step4.activities.standing },
                ].map((act) => {
                  const selected = formData.activity_type.includes(act.id);
                  return (
                    <button
                      key={act.id}
                      onClick={() => toggleArrayItem('activity_type', act.id)}
                      className={`p-3 rounded-xl border text-center font-semibold text-xs transition-all ${
                        selected
                          ? 'bg-cyan-950/60 border-cyan-400 text-white ring-1 ring-cyan-400/60 shadow-md shadow-cyan-950/40'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-cyan-500/40'
                      }`}
                    >
                      {act.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                {t.step4.cushionLabel}
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'maximum', title: t.step4.cushions.max.title, desc: t.step4.cushions.max.desc },
                  { id: 'balanced', title: t.step4.cushions.balanced.title, desc: t.step4.cushions.balanced.desc },
                  { id: 'firm', title: t.step4.cushions.firm.title, desc: t.step4.cushions.firm.desc },
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setFormData({ ...formData, cushioning_preference: c.id as any })}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      formData.cushioning_preference === c.id
                        ? 'bg-cyan-950/60 border-cyan-400 text-white ring-1 ring-cyan-400/60 shadow-md shadow-cyan-950/40'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-cyan-500/40'
                    }`}
                  >
                    <div className="font-bold text-xs">{c.title}</div>
                    <div className="text-[10px] text-slate-400">{c.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: Brand Preferences & Forbidden Blacklist */}
      {step === 5 && (
        <div className="glass-panel rounded-2xl p-6 space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-teal-400" />
            {t.step5.title}
          </h3>
          <p className="text-sm text-slate-400">
            {t.step5.desc}
          </p>

          <div className="space-y-6">
            {/* Preferred Brands */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold uppercase text-cyan-400">
                  {t.step5.preferredLabel}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {BRAND_OPTIONS.map((brand) => {
                  const isPref = formData.preferred_brands.includes(brand);
                  const isForbid = formData.forbidden_brands.includes(brand);
                  return (
                    <button
                      key={brand}
                      disabled={isForbid}
                      onClick={() => toggleArrayItem('preferred_brands', brand)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                        isPref
                          ? 'bg-cyan-950/60 border-cyan-400 text-white ring-1 ring-cyan-400/60 shadow-md shadow-cyan-950/40'
                          : isForbid
                          ? 'opacity-30 border-slate-900 bg-slate-950 cursor-not-allowed text-slate-600'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-cyan-500/40'
                      }`}
                    >
                      {brand}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Forbidden Brands Blacklist */}
            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/30">
              <div className="flex items-center gap-2 mb-1">
                <Ban className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-bold uppercase text-rose-300">
                  {t.step5.forbiddenLabel}
                </span>
              </div>
              <p className="text-[11px] text-rose-300/70 mb-3">
                {t.step5.forbiddenDesc}
              </p>
              <div className="flex flex-wrap gap-2">
                {BRAND_OPTIONS.map((brand) => {
                  const isForbid = formData.forbidden_brands.includes(brand);
                  const isPref = formData.preferred_brands.includes(brand);
                  return (
                    <button
                      key={brand}
                      disabled={isPref}
                      onClick={() => toggleArrayItem('forbidden_brands', brand)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                        isForbid
                          ? 'bg-rose-950/80 border-rose-500 text-rose-200 ring-1 ring-rose-500'
                          : isPref
                          ? 'opacity-30 border-slate-900 bg-slate-950 cursor-not-allowed text-slate-600'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {isForbid ? `✕ ${brand}` : brand}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 6: Health Conditions & Surgeries */}
      {step === 6 && (
        <div className="glass-panel rounded-2xl p-6 space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            {t.step6.title}
          </h3>
          <p className="text-sm text-slate-400">
            {t.step6.desc}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Joint & Foot Conditions */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                {t.step6.jointLabel}
              </label>
              <div className="space-y-2">
                {Object.entries(t.step6.conditions).map(([condKey, condLabel]) => {
                  const isSelected = formData.joint_conditions.includes(condKey);
                  return (
                    <button
                      key={condKey}
                      onClick={() => toggleArrayItem('joint_conditions', condKey)}
                      className={`w-full p-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-cyan-950/60 border-cyan-400 text-cyan-200 ring-1 ring-cyan-400/60 shadow-md shadow-cyan-950/40'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-cyan-500/40'
                      }`}
                    >
                      {condLabel}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Surgical History */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                {t.step6.surgeriesLabel}
              </label>
              <div className="space-y-2">
                {Object.entries(t.step6.surgeries).map(([surgKey, surgLabel]) => {
                  const isSelected = formData.past_surgeries.includes(surgKey);
                  return (
                    <button
                      key={surgKey}
                      onClick={() => toggleArrayItem('past_surgeries', surgKey)}
                      className={`w-full p-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-teal-950/60 border-teal-400 text-teal-200 ring-1 ring-teal-400/60 shadow-md shadow-teal-950/40'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-cyan-500/40'
                      }`}
                    >
                      {surgLabel}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Navigation Buttons */}
    <div className="flex items-center justify-between pt-4 border-t border-cyan-500/20">
      <button
                  disabled={step === 1}
                  onClick={() => setStep((s) => Math.max(s - 1, 1))}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-cyan-500/20 bg-[#0b1628]/80 hover:bg-[#0f2038] disabled:opacity-30 disabled:cursor-not-allowed text-xs text-slate-300 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-cyan-400" />
                  <span>{t.buttons.previous}</span>
                </button>

                {step < 6 ? (
                  <button
                    onClick={() => setStep((s) => Math.min(s + 1, 6))}
                    className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-extrabold text-xs transition-all shadow-lg shadow-cyan-950/60 hover:shadow-cyan-500/30"
                  >
                    <span>{t.buttons.continue}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    disabled={isSubmitting}
                    onClick={handleSubmit}
                    className="flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-extrabold text-sm transition-all shadow-xl shadow-cyan-950/70 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>{t.buttons.evaluating}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>{t.buttons.evaluate}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Right Column: Biomechanical HUD & Live Anatomical Scanner */}
            <div className="lg:col-span-4 sticky top-6">
              <BiomechanicalHUD formData={formData} locale={locale} currentStep={step} />
            </div>
          </div>
      ) : (
        /* STEP 7: Results View */
        step === 7 && result && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Agent Header Prescription Banner */}
            <div className="glass-panel border-cyan-500/40 rounded-2xl p-6 shadow-2xl shadow-cyan-950/30 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400" />

              <div className="flex items-center justify-between gap-4 mb-4 pb-4 border-b border-cyan-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-inner">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-white tracking-tight">
                      {t.results.prescriptionTitle}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      {t.results.evaluatedBy} {result.agentName} (v{result.agentVersion})
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-cyan-500/30 bg-[#0b1628] hover:bg-[#0f2038] text-xs text-cyan-300 font-semibold transition-all shadow-sm"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{t.buttons.editAndRetest}</span>
                </button>
              </div>

              {/* Medical Findings Summary */}
              <div className="bg-[#050c18]/90 p-5 rounded-xl border border-cyan-500/20 mb-4 text-xs leading-relaxed text-slate-200">
                <div className="font-extrabold text-white mb-2 flex items-center gap-2 text-sm">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>{t.results.analysisTitle}</span>
                </div>
                <p className="whitespace-pre-line text-slate-300">{result.clinicalAssessment}</p>
              </div>

              {/* Contraindications Warning Box */}
              {result.contraindications.length > 0 && (
                <div className="p-4 rounded-xl bg-rose-950/25 border border-rose-500/40 text-xs">
                  <div className="font-bold text-rose-300 flex items-center gap-2 mb-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <span>{t.results.contraindicationsTitle}</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    {result.contraindications.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Recommended Shoes Grid */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-base font-extrabold text-white flex items-center gap-2">
                  <span>{t.results.matchesTitle}</span>
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/40">
                    {result.recommendations.length} {t.results.shoesPassedBadge}
                  </span>
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {result.recommendations.map((shoe) => (
                  <ShoeRecommendationCard key={shoe.id} shoe={shoe} />
                ))}
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
};
