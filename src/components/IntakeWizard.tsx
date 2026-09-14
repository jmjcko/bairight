'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { IntakeFormData, AgentPrescriptionResult } from '@/lib/agent/markdown-agent-loader';
import { translations, SupportedLocale } from '@/lib/i18n/translations';
import { VerifiedShoeCard } from './VerifiedShoeCard';
import { ClinicalAssessmentModal } from './ClinicalAssessmentModal';
import { AnalysisModal } from './AnalysisModal';
import { AppointmentsModal } from './AppointmentsModal';
import { RecommendationsModal } from './RecommendationsModal';
import { AssessmentFeedbackLoop } from './AssessmentFeedbackLoop';
import { PromptInspectorModal } from './PromptInspectorModal';
import { buildEvaluationPrompt } from '@/lib/agent/real-llm-service';
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
  RotateCcw, 
  AlertCircle,
  Eye,
  Copy,
  Zap
} from 'lucide-react';
import { PromptStorageService } from '@/lib/agent/prompt-storage-service';

const BRAND_OPTIONS = [
  'Hoka', 
  'Asics', 
  'Brooks', 
  'New Balance', 
  'Saucony', 
  'Altra', 
  'On Running', 
  'Nike', 
  'Adidas', 
  'Mizuno', 
  'Puma', 
  'Salomon', 
  'Topo Athletic', 
  'Inov-8', 
  'Craft', 
  'Under Armour'
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

// Certified Alternative Models for Real-Time Feedback Refinement
const VERIFIED_FALLBACK_MODELS = [
  {
    id: 'saucony-echelon-9-wide',
    brand: 'Saucony',
    model: 'Echelon 9 Wide (2E)',
    badgeLabel: 'Doporučeno pro rozpočet',
    heel_drop_mm: 8,
    cushion_level: 'Měkké stabilní',
    width_fitting: '2E Široká základna',
    rocker_geometry: true,
    is_2e_available: true,
    european_price_eur: 139.00,
    matchScore: 97,
    medical_rationale: 'Příznivější cena do 3 500 Kč při zachování přísného certifikovaného 2E kopyta. Pěna PWRRUN a rovné kopyto poskytují stabilní platformu pro citlivá kolena.',
  },
  {
    id: 'brooks-ghost-max-wide',
    brand: 'Brooks',
    model: 'Ghost Max Wide (2E)',
    badgeLabel: 'Odlehčená rocker kolébka',
    heel_drop_mm: 6,
    cushion_level: 'GlideRoll Rocker',
    width_fitting: '2E Wide Fit',
    rocker_geometry: true,
    is_2e_available: true,
    european_price_eur: 145.00,
    matchScore: 95,
    medical_rationale: 'Výrazný profil kolébky GlideRoll a drop 6 mm odlehčují ohyb kolena a snižují rázové napětí při každém kroku.',
  },
  {
    id: 'new-balance-fresh-foam-more-v4',
    brand: 'New Balance',
    model: 'Fresh Foam X More v4 (2E)',
    badgeLabel: 'Vysoká absorpce',
    heel_drop_mm: 4,
    cushion_level: 'Fresh Foam X Ultra',
    width_fitting: '2E Wide Last',
    rocker_geometry: true,
    is_2e_available: true,
    european_price_eur: 149.00,
    matchScore: 94,
    medical_rationale: 'Objemná vrstva Fresh Foam X zajišťuje maximální eliminaci mikronárazů pro ochranu kloubních chrupavek.',
  },
  {
    id: 'brooks-glycerin-21-wide',
    brand: 'Brooks',
    model: 'Glycerin 21 Wide (2E)',
    badgeLabel: 'Lehký dynamický model',
    heel_drop_mm: 10,
    cushion_level: 'DNA LOFT v3 Dusík',
    width_fitting: '2E Wide Fit',
    rocker_geometry: true,
    is_2e_available: true,
    european_price_eur: 169.00,
    matchScore: 96,
    medical_rationale: 'Dusíkem sycená pěna DNA LOFT v3 je o 30 g lehčí než tradiční tlumení, přičemž poskytuje maximální návratnost energie.',
  },
];

const DEFAULT_FORM_DATA: IntakeFormData = {
  product_category: 'running_shoes',
  foot_length_mm: 275,
  foot_length_cm: 27.5,
  foot_width_mm: 104,
  eu_size: 43,
  foot_width: 'wide_2e',
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
  onAssessmentCompleted?: (formData: IntakeFormData, result: AgentPrescriptionResult, completedPrompt?: string) => void;
  onFeedbackSubmitted?: (feedbackSummary: string, updatedModels: any[]) => void;
  activeProviderId?: string;
  currentApiKeys?: Record<string, string>;
  userFacts?: any[];
  onOpenSubscriptionModal?: () => void;
}

export const IntakeWizard: React.FC<IntakeWizardProps> = ({
  onOpenAnalysis,
  onOpenAppointments,
  onOpenRecommendations,
  onAssessmentCompleted,
  onFeedbackSubmitted,
  activeProviderId,
  currentApiKeys,
  userFacts,
  onOpenSubscriptionModal,
}) => {
  const [locale] = useState<SupportedLocale>('cs');
  const t = translations[locale].wizard;

  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [result, setResult] = useState<AgentPrescriptionResult | null>(null);
  const [kneePainLevel, setKneePainLevel] = useState<number>(3);

  // Step 1: Quick Presets vs Precise mm Sliders mode
  const [sizeInputMode, setSizeInputMode] = useState<'quick' | 'precise'>('quick');

  // Interactive feedback loop refined models & loading state
  const [refinedModels, setRefinedModels] = useState<any[] | null>(null);
  const [isRecalculatingFeedback, setIsRecalculatingFeedback] = useState<boolean>(false);

  // Modals state
  const [isClinicalAssessmentOpen, setIsClinicalAssessmentOpen] = useState<boolean>(false);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState<boolean>(false);
  const [isAppointmentsModalOpen, setIsAppointmentsModalOpen] = useState<boolean>(false);
  const [isRecommendationsModalOpen, setIsRecommendationsModalOpen] = useState<boolean>(false);
  const [isPromptInspectorOpen, setIsPromptInspectorOpen] = useState<boolean>(false);
  const [inspectorPromptText, setInspectorPromptText] = useState<string>('');

  // Form State with precise length and width in mm
  const [formData, setFormData] = useState<IntakeFormData>(DEFAULT_FORM_DATA);

  const handleResetForm = () => {
    setFormData(DEFAULT_FORM_DATA);
    setStep(1);
    setResult(null);
    setRefinedModels(null);
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

  const handleQuickEuSize = (eu: number) => {
    const mm = Math.round(eu * 6.67 - 15);
    handleLengthChange(mm);
  };

  const handleQuickWidthPreset = (preset: 'standard_d' | 'wide_2e' | 'extra_wide_4e') => {
    if (preset === 'standard_d') handleWidthChange(98);
    else if (preset === 'wide_2e') handleWidthChange(104);
    else handleWidthChange(112);
  };

  const handleApplyFeedback = (summary: string, tags: string[], customNote: string) => {
    setIsRecalculatingFeedback(true);

    setTimeout(() => {
      let current: any[] = result?.recommendations?.length ? [...result.recommendations] : [...DEFAULT_TOP_3_MODELS];

      if (tags.includes('exclude_asics')) {
        current = current.filter((m) => m.brand.toLowerCase() !== 'asics');
        if (!current.some((m) => m.brand.toLowerCase() === 'saucony')) {
          current.push(VERIFIED_FALLBACK_MODELS[0]);
        }
      }

      if (tags.includes('exclude_hoka')) {
        current = current.filter((m) => m.brand.toLowerCase() !== 'hoka');
        if (!current.some((m) => m.id === 'brooks-ghost-max-wide')) {
          current.push(VERIFIED_FALLBACK_MODELS[1]);
        }
      }

      if (tags.includes('budget_under_3500')) {
        current = [
          VERIFIED_FALLBACK_MODELS[0], // Saucony Echelon 9 (139 EUR ~ 3 500 Kč)
          current.find((m) => m.id === 'brooks-adrenaline-gts-23') || VERIFIED_FALLBACK_MODELS[1],
          VERIFIED_FALLBACK_MODELS[2], // NB Fresh Foam More v4
        ].filter(Boolean);
      }

      if (tags.includes('lightweight_dynamic')) {
        current = [
          VERIFIED_FALLBACK_MODELS[3], // Brooks Glycerin 21 (278g)
          ...current.filter((m) => m.id !== 'hoka-bondi-8-wide'),
        ];
      }

      if (tags.includes('more_ankle_stability')) {
        current = [
          current.find((m) => m.id === 'brooks-adrenaline-gts-23') || DEFAULT_TOP_3_MODELS[1],
          ...current.filter((m) => m.id !== 'brooks-adrenaline-gts-23'),
        ];
      }

      // Fill up to 3 models if needed
      while (current.length < 3) {
        const nextFallback = VERIFIED_FALLBACK_MODELS.find((f) => !current.some((c) => c.id === f.id));
        if (nextFallback) current.push(nextFallback);
        else break;
      }

      const updated = current.slice(0, 3);
      setRefinedModels(updated);
      setIsRecalculatingFeedback(false);

      if (onFeedbackSubmitted) {
        onFeedbackSubmitted(summary, updated);
      }
    }, 450);
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

  const getEffectiveFormData = (): IntakeFormData => {
    const effectiveForbidden = formData.preferred_brands.length > 0
      ? BRAND_OPTIONS.filter((b) => !formData.preferred_brands.includes(b))
      : formData.forbidden_brands || [];

    return {
      ...formData,
      forbidden_brands: effectiveForbidden,
    };
  };

  const currentLivePrompt = useMemo(() => {
    const enrichedFacts = Array.isArray(userFacts)
      ? userFacts
          .filter((f) => f.isEnriched !== false)
          .map((f) => ({
            fact: f.fact || `${f.label || 'Poznámka'}: ${f.value || ''}`,
            category: f.category || 'biometrics',
          }))
      : [];

    const effectiveData = getEffectiveFormData();
    return buildEvaluationPrompt(effectiveData, enrichedFacts);
  }, [formData, kneePainLevel, userFacts, step]);

  const handleOpenPromptInspector = () => {
    setInspectorPromptText(currentLivePrompt);
    setIsPromptInspectorOpen(true);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Determine active AI Provider & API key (from props or browser localStorage)
      let providerId = activeProviderId || 'bairight_core';
      let apiKey: string | undefined = undefined;

      if (typeof window !== 'undefined') {
        const storedProvider = localStorage.getItem('bairight_active_provider');
        const storedKeys = localStorage.getItem('bairight_api_keys');
        if (storedProvider) providerId = storedProvider;
        if (storedKeys) {
          try {
            const parsed = JSON.parse(storedKeys);
            if (providerId && parsed[providerId]) {
              apiKey = parsed[providerId];
            }
          } catch (e) {
            console.error('Failed to parse localStorage api keys:', e);
          }
        }
      }

      // Prop overrides if provided
      if (currentApiKeys && providerId && currentApiKeys[providerId]) {
        apiKey = currentApiKeys[providerId];
      }

      // Format enriched RAG facts if available
      const enrichedFacts = Array.isArray(userFacts)
        ? userFacts
            .filter((f) => f.isEnriched !== false)
            .map((f) => ({
              id: f.id || `fact-${Math.random()}`,
              fact: f.fact || `${f.label || 'Poznámka'}: ${f.value || ''}`,
              category: f.category || 'biometrics',
            }))
        : [];

      const effectiveData = getEffectiveFormData();

      const res = await fetch('/api/agent/evaluate-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formData: effectiveData,
          providerId,
          apiKey,
          ragFacts: enrichedFacts,
        }),
      });

      if (!res.ok) throw new Error('Failed to evaluate profile with agent');
      const data = await res.json();
      setResult(data);

      // Sestavíme a uložíme VÝHRADNĚ HOTOVÝ prompt po dokončení posledního kroku (Krok 5)
      const finalCompletedPrompt = buildEvaluationPrompt(effectiveData, enrichedFacts);
      PromptStorageService.saveCompletedPrompt({
        agentId: 'running_shoes',
        agentName: 'Podiatrický Agent v1.1',
        category: 'Footwear & Orthotics',
        prompt: finalCompletedPrompt,
        answersSummary: `EU ${effectiveData.eu_size} (${effectiveData.foot_length_mm} mm), šířka ${effectiveData.foot_width}, došlap ${effectiveData.strike_pattern}`,
        providerId,
      });

      if (onAssessmentCompleted) {
        onAssessmentCompleted(effectiveData, data, finalCompletedPrompt);
      }
    } catch (err) {
      console.error('Error submitting wizard to agent:', err);
      alert('Chyba při komunikaci s vyhodnocovacím agentem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepTitles = [
    'Rozměry chodidla & velikost',
    'Styl došlapu & biomechanika',
    'Aktivity a objem',
    'Kloubní komfort & ochrana kolen',
    'Značky & rozpočet',
  ];

  const totalSteps = 5;
  const progressPercent = Math.round((step / totalSteps) * 100);

  // Derive Top 3 recommendations (from API evaluation result, clinical default models, or refined feedback)
  const baseModels = result?.recommendations?.length
    ? result.recommendations.slice(0, 3)
    : DEFAULT_TOP_3_MODELS;

  const displayModels = (refinedModels || baseModels).map((shoe, idx) => ({
    ...shoe,
    badgeLabel: (shoe as any).badgeLabel || (idx === 0 ? 'Hlavní doporučení' : idx === 1 ? 'Alternativní model č. 2' : 'Doporučený model č. 3')
  }));

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

          {/* Form Header */}
          <div className="border-b border-cyan-500/20 pb-6 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
            {/* KROK 1: VOLBA VELIKOSTI A ŠÍŘKY CHODIDLA */}
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Input Mode Switcher */}
                <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#060c18] border border-cyan-500/25 shadow-inner">
                  <button
                    type="button"
                    onClick={() => setSizeInputMode('quick')}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      sizeInputMode === 'quick'
                        ? 'bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.35)]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Footprints className="w-4 h-4" />
                    <span>👟 Rychlá volba velikosti (EU & šířka)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSizeInputMode('precise')}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      sizeInputMode === 'precise'
                        ? 'bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.35)]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Sliders className="w-4 h-4" />
                    <span>📐 Přesné mm měření (posuvníky)</span>
                  </button>
                </div>

                {sizeInputMode === 'quick' ? (
                  <div className="space-y-5">
                    {/* Quick EU Size Selection */}
                    <div className="p-5 rounded-2xl bg-[#060c18] border border-slate-800/90 space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-bold text-white flex items-center gap-2">
                          <Footprints className="w-4 h-4 text-cyan-400" />
                          <span>Jakou velikost bot běžně nosíte?</span>
                        </label>
                        <span className="font-mono text-cyan-300 font-extrabold text-base bg-cyan-950/80 px-3 py-1 rounded-xl border border-cyan-500/30">
                          EU {formData.eu_size} ({formData.foot_length_mm} mm)
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 pt-1">
                        {[38, 39, 40, 41, 42, 43, 44, 45, 46, 47].map((eu) => (
                          <button
                            key={eu}
                            type="button"
                            onClick={() => handleQuickEuSize(eu)}
                            className={`py-2.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                              formData.eu_size === eu
                                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.6)] scale-105'
                                : 'bg-[#091526] text-slate-300 hover:text-white border border-slate-800 hover:border-cyan-500/40'
                            }`}
                          >
                            {eu}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Quick Width Sensation */}
                    <div className="p-5 rounded-2xl bg-[#060c18] border border-slate-800/90 space-y-3">
                      <label className="text-sm font-bold text-white flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-teal-400" />
                        <span>Jak vnímáte šířku běžné obuvi?</span>
                      </label>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                        {[
                          {
                            id: 'standard_d',
                            label: 'Standardní šířka (D)',
                            desc: 'Běžná obuv mi netlačí prsty ani po stranách.',
                            widthMm: 98,
                          },
                          {
                            id: 'wide_2e',
                            label: 'Širší kopyto (2E)',
                            desc: 'V běžné obuvi cítím tlak v kloubech prstů, potřebuji prostor.',
                            widthMm: 104,
                          },
                          {
                            id: 'extra_wide_4e',
                            label: 'Extra široké (4E)',
                            desc: 'Mám výrazně široké chodidlo nebo výrazný vbočený palec.',
                            widthMm: 112,
                          },
                        ].map((preset) => {
                          const active = formData.foot_width === preset.id;
                          return (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => handleQuickWidthPreset(preset.id as any)}
                              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer space-y-1.5 ${
                                active
                                  ? 'bg-cyan-950/90 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400'
                                  : 'bg-[#091526]/80 border-slate-800/80 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold text-xs text-white">{preset.label}</span>
                                {active && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                              </div>
                              <p className="text-[11px] text-slate-300 leading-snug">{preset.desc}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
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
                          <span>Délka chodidla v mm:</span>
                        </label>
                        <div className="font-mono text-cyan-300 font-extrabold text-base bg-cyan-950/80 px-3 py-1 rounded-xl border border-cyan-500/30">
                          {formData.foot_length_mm} mm{' '}
                          <span className="text-xs text-slate-400 font-normal">({formData.foot_length_cm} cm • EU {formData.eu_size})</span>
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
                          <span>Šířka v nejširším místě v mm (klouby prstů):</span>
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
                  </div>
                )}

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

            {/* KROK 2: STYL DOŠLAPU & BIOMECHANIKA */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Visual Confirmation Card of Size & Width from Step 1 */}
                <div className="p-4 rounded-2xl bg-[#060e1d] border border-cyan-500/25 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-400/40 flex items-center justify-center text-cyan-300 font-mono font-bold text-xs">
                      {formData.foot_width === 'wide_2e' ? '2E' : formData.foot_width === 'extra_wide_4e' ? '4E' : 'D'}
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                        Zvolená velikost z Kroku 1:
                      </span>
                      <span className="font-extrabold text-xs sm:text-sm text-white">
                        EU {formData.eu_size} ({formData.foot_length_mm} mm) • {formData.foot_width === 'wide_2e' ? 'Široké kopyto 2E (104 mm)' : formData.foot_width === 'extra_wide_4e' ? 'Extra široké 4E (112 mm)' : 'Standardní šířka D (98 mm)'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-mono underline cursor-pointer shrink-0"
                  >
                    Upravit rozměry
                  </button>
                </div>

                {/* Question 1: Strike Pattern (Zone of Ground Contact) */}
                <div>
                  <label className="block text-sm font-bold text-white mb-2">
                    Zóna prvního kontaktu se zemí (styl dopadu):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      {
                        id: 'heel_strike',
                        label: 'Přes patu (Heel Strike)',
                        desc: 'Nejčastější styl (75 % běžců). Vyžaduje vysoké tlumení pod patou a vyšší drop (8–12 mm).'
                      },
                      {
                        id: 'midfoot_strike',
                        label: 'Přes střed (Midfoot)',
                        desc: 'Vyvážený dopad na celou plochu. Vyžaduje střední drop (4–8 mm) a stabilní platformu.'
                      },
                      {
                        id: 'forefoot_strike',
                        label: 'Přes špičku (Forefoot)',
                        desc: 'Rychlý dopad na bříška prstů. Vyžaduje nízký drop (0–4 mm) a pružnou přední část.'
                      }
                    ].map((sp) => {
                      const active = formData.strike_pattern === sp.id;
                      return (
                        <button
                          key={sp.id}
                          type="button"
                          onClick={() => setFormData((p) => ({ ...p, strike_pattern: sp.id as any }))}
                          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1.5 ${
                            active
                              ? 'bg-cyan-950/90 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400'
                              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs sm:text-sm text-white">{sp.label}</span>
                            {active && <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />}
                          </div>
                          <p className="text-[11px] text-slate-300 leading-snug">{sp.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Question 2: Foot Mechanics (Ankle Rotation) */}
                <div>
                  <label className="block text-sm font-bold text-white mb-2">
                    Vedení chodidla & rotace kotníku:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: 'supination', label: 'Supinace (Vnější hrana)', desc: 'Chodidlo rotuje ven, zákaz tvrdých pronačních klínů' },
                      { id: 'neutral', label: 'Neutrální došlap', desc: 'Rovnoměrné rozložení tlaků bez vychýlení' },
                      { id: 'mild_overpronation', label: 'Pronace (Vnitřní sešlap)', desc: 'Kolaps klenby dovnitř, potřeba stabilizační opory' },
                    ].map((m) => {
                      const active = formData.foot_mechanics === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setFormData((p) => ({ ...p, foot_mechanics: m.id as any }))}
                          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1.5 ${
                            active
                              ? 'bg-cyan-950/90 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400'
                              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs sm:text-sm text-white">{m.label}</span>
                            {active && <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />}
                          </div>
                          <p className="text-[11px] text-slate-300 leading-snug">{m.desc}</p>
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

            {/* KROK 4: KLOUBNÍ KOMFORT & OCHRANA KOLEN */}
            {step === 4 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div>
                  <label className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                    <Activity className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Citlivost kolenních kloubů při běhu a chůzi:</span>
                  </label>
                  <p className="text-xs text-slate-400">
                    Zvolte situaci, která nejlépe odpovídá vašim kolenům při došlapu:
                  </p>
                </div>

                {/* 4 Crystal-Clear Compact Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      level: 1,
                      title: '🟢 Bez potíží (Plná zátěž)',
                      desc: 'Běhám bez bolesti, kolena mě po tréninku ani ze schodů nijak neomezují.',
                      badge: 'Přirozený ohyb',
                      color: 'border-cyan-500/30 text-cyan-300',
                    },
                    {
                      level: 4,
                      title: '🟡 Mírná citlivost / Únava',
                      desc: 'Po delším běhu (>5 km), na tvrdém asfaltu nebo z kopce cítím tlak či únavu v kolenou.',
                      badge: 'Tlumení vibrací',
                      color: 'border-teal-500/30 text-teal-300',
                    },
                    {
                      level: 7,
                      title: '🟠 Výrazná citlivost / Artróza',
                      desc: 'Pravidelná bolest při došlapu, opotřebení chrupavky, artróza či dřívější operace.',
                      badge: 'Kolébka (Rocker)',
                      color: 'border-amber-500/30 text-amber-300',
                    },
                    {
                      level: 9,
                      title: '🔴 Maximální ochrana',
                      desc: 'Rekonvalescence po zranění vazů/menisku, vyšší váha nebo potřeba šetřícího režimu.',
                      badge: 'Max Cushion',
                      color: 'border-rose-500/30 text-rose-300',
                    },
                  ].map((tier) => {
                    const isSelected = 
                      (tier.level === 1 && kneePainLevel <= 2) ||
                      (tier.level === 4 && kneePainLevel >= 3 && kneePainLevel <= 5) ||
                      (tier.level === 7 && kneePainLevel >= 6 && kneePainLevel <= 8) ||
                      (tier.level === 9 && kneePainLevel >= 9);

                    return (
                      <button
                        key={tier.level}
                        type="button"
                        onClick={() => setKneePainLevel(tier.level)}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                          isSelected
                            ? 'bg-cyan-950/90 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.35)] ring-1 ring-cyan-400'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-extrabold text-xs sm:text-sm text-white">
                              {tier.title}
                            </span>
                            {isSelected ? (
                              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                            ) : (
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-950 border ${tier.color}`}>
                                {tier.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-300 leading-snug">
                            {tier.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Specific Ergonomic Conditions Checkboxes */}
                <div>
                  <label className="block text-sm font-bold text-white mb-2">
                    Máte některé z těchto konkrétních ergonomických specifik?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { id: 'Knee Osteoarthritis Grade 3', label: 'Artróza kolenního kloubu (vyžaduje kolébku rocker)' },
                      { id: 'Plantar Fasciitis (Patní ostruha)', label: 'Plantární fasciitida / patní ostruha (ochrana paty)' },
                      { id: 'Hallux Valgus (Vbočený palec)', label: 'Vbočený palec (Hallux Valgus) – potřeba široké špičky' },
                      { id: 'Meniscus Partial Resection', label: 'Dřívější zákrok na menisku či vazech kolene' }
                    ].map((cond) => {
                      const active = formData.joint_conditions.includes(cond.id);
                      return (
                        <button
                          key={cond.id}
                          type="button"
                          onClick={() => toggleArrayItem('joint_conditions', cond.id)}
                          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
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
                <div className="p-5 rounded-2xl bg-[#060c18] border border-cyan-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Preferovaní výrobci obuvi ({formData.preferred_brands.length}/{BRAND_OPTIONS.length}):</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData((p) => ({ ...p, preferred_brands: [...BRAND_OPTIONS] }))}
                        className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                      >
                        Vybrat vše
                      </button>
                      <span className="text-slate-600 text-xs">•</span>
                      <button
                        type="button"
                        onClick={() => setFormData((p) => ({ ...p, preferred_brands: [] }))}
                        className="text-[11px] font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                      >
                        Zrušit výběr
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400">
                    Kliknutím vyberte značky, které smí asistent doporučit. Neoznačené značky budou striktně vyloučeny ze všech doporučení.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                    {BRAND_OPTIONS.map((brand) => {
                      const active = formData.preferred_brands.includes(brand);
                      return (
                        <button
                          key={brand}
                          type="button"
                          aria-label={brand}
                          onClick={() => toggleArrayItem('preferred_brands', brand)}
                          className={`p-3 rounded-xl border text-center transition-all cursor-pointer text-xs font-bold flex items-center justify-between ${
                            active
                              ? 'bg-cyan-950/90 border-cyan-400 text-white shadow-sm ring-1 ring-cyan-400'
                              : 'bg-slate-900/60 border-slate-800 text-slate-500 hover:text-slate-300 opacity-60'
                          }`}
                        >
                          <span className={active ? '' : 'line-through'}>{brand}</span>
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                            active ? 'bg-cyan-900/60 text-cyan-300' : 'bg-slate-800 text-slate-500'
                          }`}>
                            {active ? 'POVOLENO' : 'STOP'}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {formData.preferred_brands.length > 0 ? (
                    <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/20 text-xs text-cyan-300/90 flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-white">Striktní izolace značek aktivní: </span>
                        Doporučeny budou výhradně značky <strong>{formData.preferred_brands.join(', ')}</strong>. Všechny ostatní značky ({BRAND_OPTIONS.filter(b => !formData.preferred_brands.includes(b)).slice(0, 3).join(', ')}{BRAND_OPTIONS.length - formData.preferred_brands.length > 3 ? '...' : ''}) jsou striktně zakázány.
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">
                      Nemáte označenou žádnou značku — asistent automaticky prohledá všechny výrobce na trhu.
                    </p>
                  )}
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
            {/* Live Prompt Inspector - visible in every single step */}
            <div className="mt-8 rounded-2xl bg-[#080d17] border border-cyan-500/25 p-4 sm:p-5 text-left space-y-3 shadow-xl">
              <div className="flex items-center justify-between border-b border-cyan-500/15 pb-2.5">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                    Sestavovaný prompt pro AI (Krok {step} z 5)
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                  Živý náhled
                </span>
              </div>
              
              <p className="text-[11px] text-slate-400">
                Vaše biomechanická data a preference v tomto kroku okamžitě formují klinický prompt, který obdrží AI model:
              </p>

              <textarea
                readOnly
                value={currentLivePrompt}
                rows={6}
                aria-label="Sestavovaný prompt pro AI"
                className="w-full rounded-xl bg-slate-950/95 border border-slate-800/90 p-3.5 font-mono text-xs text-slate-300 leading-relaxed outline-none resize-y selection:bg-cyan-500/30"
              />
            </div>

            {/* Navigation Buttons with Reset on every step */}
            <div className="pt-6 border-t border-cyan-500/20 flex flex-wrap items-center justify-between gap-3 mt-8">
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
                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    type="button"
                    onClick={handleOpenPromptInspector}
                    className="flex items-center gap-2 px-4 py-3.5 rounded-2xl text-xs font-bold bg-slate-900/90 border border-cyan-500/40 text-cyan-300 hover:text-white hover:bg-cyan-950/60 hover:border-cyan-400 transition-all cursor-pointer shadow-sm"
                    title="Zobrazit a ověřit přesný prompt před odesláním do AI"
                  >
                    <Eye className="w-4 h-4 text-cyan-400" />
                    <span>Zkontrolovat prompt pro AI</span>
                  </button>

                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex items-center gap-2.5 px-8 py-3.5 rounded-2xl text-xs sm:text-sm font-extrabold bg-gradient-to-r from-cyan-400 via-cyan-300 to-teal-400 text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.8)] hover:scale-105 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Sparkles className="w-5 h-5 animate-pulse" />
                    <span>{isSubmitting ? 'Vyhodnocuji profil...' : 'Vygenerovat návrhy obuvi'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Prompt Inspector Modal (Phase 1) */}
        <PromptInspectorModal
          isOpen={isPromptInspectorOpen}
          onClose={() => setIsPromptInspectorOpen(false)}
          promptText={inspectorPromptText}
          formData={getEffectiveFormData()}
          onSubmit={() => {
            setIsPromptInspectorOpen(false);
            handleSubmit();
          }}
          isSubmitting={isSubmitting}
        />
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

        {/* Top Badges Bar: Biometrics + AI Provider Status */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-cyan-500/20 mb-5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-400/40 flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Biometrická analýza dokončena
            </span>
            <span className="text-xs font-mono text-slate-400 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-800">
              EU {formData.eu_size || 43} ({formData.foot_length_mm} × {formData.foot_width_mm} mm) • Kopyto {formData.foot_width.toUpperCase().replace('_', ' ')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {result?.providerUsed && (
              <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 shadow-sm ${
                result.isLiveAI
                  ? 'bg-cyan-950/90 text-cyan-300 border-cyan-400/70 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                  : 'bg-slate-900/90 text-slate-300 border-slate-700'
              }`}>
                {result.isLiveAI ? <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> : <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />}
                <span>{result.isLiveAI ? `Živé AI: ${result.providerUsed}` : result.providerUsed}</span>
              </span>
            )}

            <button
              type="button"
              onClick={handleOpenPromptInspector}
              className="text-[11px] font-mono text-cyan-400 hover:text-cyan-200 px-2.5 py-1 rounded-lg bg-cyan-950/40 border border-cyan-500/30 hover:border-cyan-400 transition-colors cursor-pointer flex items-center gap-1.5"
              title="Zobrazit kompletní prompt a instrukce odeslané do AI modelu"
            >
              <Eye className="w-3 h-3 text-cyan-400" />
              <span>Zobrazit prompt</span>
            </button>

            {onOpenSubscriptionModal && (
              <button
                onClick={onOpenSubscriptionModal}
                className="text-[11px] font-mono text-cyan-400 hover:text-cyan-200 px-2.5 py-1 rounded-lg bg-cyan-950/40 border border-cyan-500/30 hover:border-cyan-400 transition-colors cursor-pointer"
                title="Spravovat AI poskytovatele a API klíče"
              >
                Nastavit mozek (BYOK)
              </button>
            )}
          </div>
        </div>

        {/* Notice alert banner if fallback occurred */}
        {result?.llmNotice && (
          <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs p-3.5 rounded-2xl animate-in fade-in duration-300">
            <div className="flex items-start sm:items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
              <span className="leading-relaxed">{result.llmNotice}</span>
            </div>
            {onOpenSubscriptionModal && (
              <button
                onClick={onOpenSubscriptionModal}
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-bold shrink-0 transition-colors cursor-pointer text-center"
              >
                Otestovat / Nastavit API klíč
              </button>
            )}
          </div>
        )}

        {/* Title and Main Action Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Doporučený výběr vhodné obuvi
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Algoritmus vybral 3 modely obuvi odpovídající zadaným biomechanickým rozměrům, došlapu a ochraně kloubů (kolébková podešev rocker, optimální drop a certifikované široké kopyto).
            </p>
          </div>

          {/* Action Buttons: Regenerate AI, Edit Inputs, Clinical Report, Consultation */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* 1. DOMINANT REGENERATE BUTTON */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-extrabold text-xs sm:text-sm bg-gradient-to-r from-cyan-400 via-cyan-300 to-teal-400 text-slate-950 shadow-[0_0_25px_rgba(6,182,212,0.5)] hover:scale-105 active:scale-95 disabled:opacity-50 transition-all cursor-pointer group"
              title="Spustit znovu vyhodnocení profilu přes AI"
            >
              <RefreshCw className={`w-4 h-4 text-slate-950 ${isSubmitting ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
              <span>{isSubmitting ? 'Vyhodnocuji profil...' : 'Přegenerovat s AI'}</span>
            </button>

            {/* 2. Secondary: Upravit zadání */}
            <button
              onClick={() => setResult(null)}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-semibold text-xs bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 hover:border-slate-600 transition-all cursor-pointer"
              title="Vrátit se a upravit zadaná biometrická data"
            >
              <ArrowLeft className="w-4 h-4 text-slate-400" />
              <span>Upravit zadání</span>
            </button>

            {/* 3. Secondary: Biomechanický rozbor */}
            <button
              onClick={() => setIsClinicalAssessmentOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-semibold text-xs bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 hover:border-slate-600 transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>Posudek</span>
            </button>

            {/* 4. Secondary: Konzultace */}
            <button
              onClick={() => {
                if (onOpenAppointments) onOpenAppointments();
                else setIsAppointmentsModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-semibold text-xs bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 hover:border-slate-600 transition-all cursor-pointer"
            >
              <Activity className="w-4 h-4 text-teal-400" />
              <span>Konzultace</span>
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

        {/* Interactive Feedback & Refinement Loop into RAG DB */}
        <AssessmentFeedbackLoop
          currentModelsCount={displayModels.length}
          onApplyFeedback={handleApplyFeedback}
          isRecalculating={isRecalculatingFeedback}
        />

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

      <PromptInspectorModal
        isOpen={isPromptInspectorOpen}
        onClose={() => setIsPromptInspectorOpen(false)}
        promptText={inspectorPromptText}
        formData={getEffectiveFormData()}
        onSubmit={() => {
          setIsPromptInspectorOpen(false);
          handleSubmit();
        }}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};
