"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/lib/i18n/I18nContext";

export interface ProductTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenGuidePage?: () => void;
}

export const ProductTourModal: React.FC<ProductTourModalProps> = ({
  isOpen,
  onClose,
  onOpenGuidePage,
}) => {
  const { t } = useI18n();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [mounted, setMounted] = useState(false);
  const totalSteps = 4;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        handleFinishTour();
      } else if (e.key === "ArrowRight") {
        if (currentStep < totalSteps) setCurrentStep((prev) => prev + 1);
      } else if (e.key === "ArrowLeft") {
        if (currentStep > 1) setCurrentStep((prev) => prev - 1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentStep]);

  if (!isOpen) return null;

  const handleFinishTour = () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("bairight_tour_seen", "true");
      }
    } catch {
      // Ignore
    }
    onClose();
  };

  const stepsData = [
    {
      step: 1,
      pill: t.productTour.step1Pill,
      title: t.productTour.step1Title,
      desc: t.productTour.step1Desc,
      featureBadge: "ZERO ADS • PURE LOGIC",
    },
    {
      step: 2,
      pill: t.productTour.step2Pill,
      title: t.productTour.step2Title,
      desc: t.productTour.step2Desc,
      featureBadge: "DISCOVERY WIZARD • PROMPT SYNTHESIS",
    },
    {
      step: 3,
      pill: t.productTour.step3Pill,
      title: t.productTour.step3Title,
      desc: t.productTour.step3Desc,
      featureBadge: "ATOMIC RAG • PERSISTENT CONTEXT",
    },
    {
      step: 4,
      pill: t.productTour.step4Pill,
      title: t.productTour.step4Title,
      desc: t.productTour.step4Desc,
      featureBadge: "BYOK VAULT • CLIENT-SIDE SECURE",
    },
  ];

  const currentData = stepsData[currentStep - 1];

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-tour-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={handleFinishTour}
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151d2c] text-slate-900 dark:text-slate-100 shadow-2xl shadow-[0_20px_70px_rgba(6,182,212,0.25)] overflow-hidden flex flex-col font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-sans font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300">
              {t.productTour.badge}
            </span>
            <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">
              {currentStep} / {totalSteps}
            </span>
          </div>

          <button
            onClick={handleFinishTour}
            aria-label={t.productTour.closeBtn}
            className="text-xs font-sans font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {t.productTour.closeBtn}
          </button>
        </div>

        {/* Step Content */}
        <div className="px-6 py-7 flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-sans font-bold tracking-wider text-cyan-600 dark:text-cyan-400 uppercase">
              {currentData.pill}
            </span>
            <span className="text-[10px] font-mono font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800/50">
              {currentData.featureBadge}
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            <h2 id="product-tour-title" className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-snug">
              {currentData.title}
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
              {currentData.desc}
            </p>
          </div>

          {/* Stepper Progress Bar */}
          <div className="w-full grid grid-cols-4 gap-2 pt-2">
            {[1, 2, 3, 4].map((step) => (
              <button
                key={step}
                onClick={() => setCurrentStep(step)}
                aria-label={`Krok ${step}`}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  step === currentStep
                    ? "bg-[#0099cc] shadow-[0_0_12px_rgba(0,153,204,0.6)]"
                    : step < currentStep
                    ? "bg-cyan-600/40 dark:bg-cyan-700/60"
                    : "bg-slate-200 dark:bg-slate-800"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer Controls */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:w-auto text-left">
            {onOpenGuidePage && (
              <button
                onClick={() => {
                  handleFinishTour();
                  onOpenGuidePage();
                }}
                className="text-xs font-sans font-semibold text-cyan-700 dark:text-cyan-300 hover:text-cyan-800 dark:hover:text-cyan-200 underline underline-offset-4 transition-colors cursor-pointer"
              >
                {t.productTour.openLandingPageBtn}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {currentStep > 1 && (
              <button
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="px-4 py-2 rounded-xl text-xs font-sans font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer whitespace-nowrap"
              >
                {t.productTour.prevBtn}
              </button>
            )}

            {currentStep < totalSteps ? (
              <button
                onClick={() => setCurrentStep((prev) => prev + 1)}
                className="px-5 py-2 rounded-xl text-xs font-sans font-bold bg-[#0099cc] hover:bg-[#0088b8] text-white shadow-[0_0_20px_rgba(0,153,204,0.35)] transition-all cursor-pointer whitespace-nowrap"
              >
                {t.productTour.nextBtn}
              </button>
            ) : (
              <button
                onClick={handleFinishTour}
                className="px-5 py-2 rounded-xl text-xs font-sans font-bold bg-[#0099cc] hover:bg-[#0088b8] text-white shadow-[0_0_20px_rgba(0,153,204,0.4)] transition-all cursor-pointer whitespace-nowrap"
              >
                {t.productTour.startBtn}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return mounted && typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : null;
};
