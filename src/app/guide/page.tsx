"use client";

import React from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { useI18n } from "@/lib/i18n/I18nContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeModeSwitcher } from "@/components/ThemeModeSwitcher";
import { APP_VERSION } from "@/lib/version";

export default function GuidePage() {
  const { t } = useI18n();
  const pg = t.productGuide;
  const [activeStep, setActiveStep] = React.useState<1 | 2 | 3 | 4>(1);

  const showcaseSteps = [
    {
      id: 1 as const,
      tab: pg.showcaseStep1Tab,
      badge: "DISCOVERY",
      urlPath: "bairight.app • step 1: natural query input",
      image: "/images/guide-steps/step1-query-selection.png",
      alt: "bAIright Step 1: Query & Category Discovery",
      title: pg.showcaseStep1Title,
      desc: pg.showcaseStep1Desc,
      highlight: pg.showcaseStep1Highlight,
    },
    {
      id: 2 as const,
      tab: pg.showcaseStep2Tab,
      badge: "PARAMETERS",
      urlPath: "bairight.app • step 2: parametric criteria extraction",
      image: "/images/guide-steps/step2-parameter-discovery.png",
      alt: "bAIright Step 2: AI Parameter Extraction",
      title: pg.showcaseStep2Title,
      desc: pg.showcaseStep2Desc,
      highlight: pg.showcaseStep2Highlight,
    },
    {
      id: 3 as const,
      tab: pg.showcaseStep3Tab,
      badge: "WIZARD",
      urlPath: "bairight.app • step 3: diagnostic intake questionnaire",
      image: "/images/guide-steps/step3-diagnostic-wizard.png",
      alt: "bAIright Step 3: Diagnostic Questionnaire",
      title: pg.showcaseStep3Title,
      desc: pg.showcaseStep3Desc,
      highlight: pg.showcaseStep3Highlight,
    },
    {
      id: 4 as const,
      tab: pg.showcaseStep4Tab,
      badge: "RESULT HUB",
      urlPath: "bairight.app • step 4: calibrated agent result hub & options",
      image: "/images/guide-steps/step4-prompt-and-chat.png",
      alt: "bAIright Step 4: Calibrated Agent Result Hub & Delivery Options",
      title: pg.showcaseStep4Title,
      desc: pg.showcaseStep4Desc,
      highlight: pg.showcaseStep4Highlight,
    },
  ];

  const currentStep = showcaseSteps.find((s) => s.id === activeStep) || showcaseSteps[0];

  const comparisonRows = [
    {
      feature: pg.row1Feature,
      standard: pg.row1Standard,
      bairight: pg.row1Bairight,
    },
    {
      feature: pg.row2Feature,
      standard: pg.row2Standard,
      bairight: pg.row2Bairight,
    },
    {
      feature: pg.row3Feature,
      standard: pg.row3Standard,
      bairight: pg.row3Bairight,
    },
    {
      feature: pg.row4Feature,
      standard: pg.row4Standard,
      bairight: pg.row4Bairight,
    },
  ];

  const pillars = [
    {
      num: "01",
      pill: pg.pillar1Pill,
      title: pg.pillar1Title,
      desc: pg.pillar1Desc,
      tag: "DISCOVERY & SPECIFICATION",
    },
    {
      num: "02",
      pill: pg.pillar2Pill,
      title: pg.pillar2Title,
      desc: pg.pillar2Desc,
      tag: "ATOMIC RAG & SUPABASE RLS",
    },
    {
      num: "03",
      pill: pg.pillar3Pill,
      title: pg.pillar3Title,
      desc: pg.pillar3Desc,
      tag: "GEMINI • OPENAI • CLAUDE",
    },
    {
      num: "04",
      pill: pg.pillar4Pill,
      title: pg.pillar4Title,
      desc: pg.pillar4Desc,
      tag: "BYOK & LOCAL ENCRYPTED VAULT",
    },
  ];

  const faqs = [
    { q: pg.faq1Q, a: pg.faq1A },
    { q: pg.faq2Q, a: pg.faq2A },
    { q: pg.faq3Q, a: pg.faq3A },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070d18] text-slate-900 dark:text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-800 dark:selection:text-cyan-200">
      {/* Top Header */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-[#070d18]/90 backdrop-blur-xl px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center">
            <Logo size="md" />
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <ThemeModeSwitcher />
          <LanguageSwitcher />
          <Link
            href="/"
            className="px-4 py-2 rounded-xl text-xs font-sans font-bold bg-[#0099cc] hover:bg-[#0088b8] text-white shadow-[0_0_20px_rgba(0,153,204,0.35)] transition-all"
          >
            {pg.startAppBtn}
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-12 sm:py-20 flex flex-col gap-20">
        {/* Hero Section */}
        <section className="flex flex-col items-center text-center gap-6 max-w-3xl mx-auto pt-4 sm:pt-10">
          <span className="text-[11px] font-sans font-bold uppercase tracking-wider px-3.5 py-1 rounded-full border border-cyan-500/30 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            {pg.badge}
          </span>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
            {pg.heroTitle}
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-sans max-w-2xl">
            {pg.heroSubtitle}
          </p>

          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl text-sm font-sans font-bold bg-[#0099cc] hover:bg-[#0088b8] text-white shadow-[0_0_30px_rgba(0,153,204,0.4)] transition-all cursor-pointer"
            >
              {pg.startAppBtn}
            </Link>
          </div>
        </section>

        {/* Interactive 4-Step Showcase Storyboard */}
        <section className="flex flex-col items-center gap-6 max-w-5xl mx-auto w-full">
          <div className="flex flex-col gap-2 text-center max-w-2xl mx-auto">
            <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">
              {pg.videoBadge}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              {pg.videoTitle}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 font-sans leading-relaxed">
              {pg.videoSubtitle}
            </p>
          </div>

          {/* Step Selector Tabs */}
          <div className="w-full flex items-center justify-center">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full max-w-3xl p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
              {showcaseSteps.map((step) => {
                const isActive = step.id === activeStep;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setActiveStep(step.id)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                      isActive
                        ? "bg-[#0099cc] text-white shadow-md shadow-cyan-950/40"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    {step.tab}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cyber-Glass Mockup Frame */}
          <div className="w-full rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-2xl shadow-[0_20px_70px_rgba(6,182,212,0.18)] overflow-hidden">
            {/* Window Chrome Header Bar */}
            <div className="h-10 px-4 sm:px-6 bg-slate-100 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
              </div>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 font-medium truncate max-w-[200px] sm:max-w-none">
                {currentStep.urlPath}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/60 font-semibold">
                {currentStep.badge}
              </span>
            </div>

            {/* Display Image */}
            <div className="relative w-full aspect-[16/10] bg-slate-950 flex items-center justify-center overflow-hidden">
              <img
                src={currentStep.image}
                alt={currentStep.alt}
                className="w-full h-full object-cover object-top transition-opacity duration-200"
                loading="eager"
              />
            </div>

            {/* Step Explanation Card Footer */}
            <div className="p-5 sm:p-6 bg-slate-50 dark:bg-slate-950/70 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-col gap-1.5 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
                    STEP {currentStep.id} OF 4
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {currentStep.title}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                  {currentStep.desc}
                </p>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  {currentStep.highlight}
                </span>
              </div>

              {/* Prev / Next controls */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3 | 4) : 4))}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  ← Prev
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep((prev) => (prev < 4 ? ((prev + 1) as 1 | 2 | 3 | 4) : 1))}
                  className="px-3 py-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-xs font-mono font-bold text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/20 transition-colors cursor-pointer"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison Section (Matrix) */}
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-2 text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              {pg.comparisonTitle}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {pg.comparisonSubtitle}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 overflow-hidden shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-3 border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/80 text-xs font-sans font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              <div className="p-4 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800">
                {pg.colFeature}
              </div>
              <div className="p-4 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                {pg.colStandard}
              </div>
              <div className="p-4 text-[#01579b] dark:text-cyan-300 bg-[#e1f5fe]/70 dark:bg-cyan-950/30">
                {pg.colBairight}
              </div>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-800/80">
              {comparisonRows.map((row, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-3 text-sm">
                  <div className="p-4 font-bold text-slate-900 dark:text-slate-200 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800/80 flex items-center">
                    {row.feature}
                  </div>
                  <div className="p-4 text-slate-600 dark:text-slate-400 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800/80 font-sans leading-relaxed">
                    {row.standard}
                  </div>
                  <div className="p-4 text-[#01579b] dark:text-cyan-200 font-sans leading-relaxed bg-[#e1f5fe]/30 dark:bg-cyan-950/15 font-semibold">
                    {row.bairight}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4 Technology Pillars */}
        <section className="flex flex-col gap-8">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              {pg.pillarsTitle}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pillars.map((pillar, idx) => (
              <div
                key={idx}
                className="p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30 hover:border-cyan-500/40 hover:shadow-lg transition-all flex flex-col gap-4 relative overflow-hidden group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-mono font-bold text-cyan-600/60 dark:text-cyan-500/50 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                    {pillar.num}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider border border-slate-200 dark:border-slate-800 px-2.5 py-0.5 rounded bg-slate-50 dark:bg-slate-800/50">
                    {pillar.tag}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-xs font-sans font-bold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider">
                    {pillar.pill}
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {pillar.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                    {pillar.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="flex flex-col gap-8 max-w-3xl mx-auto w-full">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              {pg.faqTitle}
            </h2>
          </div>

          <div className="flex flex-col gap-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30 flex flex-col gap-2.5"
              >
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  {faq.q}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA Banner */}
        <section className="rounded-3xl border border-cyan-500/30 bg-gradient-to-b from-cyan-50 dark:from-cyan-950/30 to-white dark:to-slate-900/80 p-8 sm:p-14 text-center flex flex-col items-center gap-6 shadow-xl">
          <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
            Připraveni zažít nakupování s objektivní AI?
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl font-sans">
            Bez sponzorovaných výsledků, bez reklam a se stoprocentním soukromím.
          </p>
          <Link
            href="/"
            className="px-8 py-3.5 rounded-xl text-sm font-sans font-bold bg-[#0099cc] hover:bg-[#0088b8] text-white shadow-[0_0_35px_rgba(0,153,204,0.4)] transition-all cursor-pointer"
          >
            {pg.startAppBtn}
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 py-8 px-4 sm:px-8 text-center text-xs font-sans text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between max-w-6xl mx-auto w-full gap-4">
        <div>bAIright Universal AI Shopping Consultant • {APP_VERSION}</div>
        <div className="flex items-center gap-4">
          <Link href="/" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors font-medium">
            {pg.backToAppBtn}
          </Link>
        </div>
      </footer>
    </div>
  );
}
