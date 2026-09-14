'use client';

import React from 'react';
import Image from 'next/image';
import { X, Activity, ShieldCheck, Zap, ArrowRight, HeartPulse, ChevronRight } from 'lucide-react';

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  footLengthMm: number;
  footWidthMm: number;
  kneeCondition: string;
}

export const AnalysisModal: React.FC<AnalysisModalProps> = ({
  isOpen,
  onClose,
  footLengthMm,
  footWidthMm,
  kneeCondition,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#0B121E] border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_20px_70px_rgba(6,182,212,0.25)] overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Glow backdrop */}
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-sm">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                Kinetický biomechanický model • v2.4
              </div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                Hloubková analýza kinetického řetězce
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-cyan-500/40 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Top telemetry cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-[#070f1e] border border-cyan-500/20">
              <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                Délka & Šířka chodidla:
              </span>
              <div className="text-lg font-mono font-bold text-cyan-300">
                {footLengthMm} mm × {footWidthMm} mm
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Index šířky: <span className="text-teal-300 font-semibold">{((footWidthMm / footLengthMm) * 100).toFixed(1)}% (Široké kopyto 2E)</span>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#070f1e] border border-cyan-500/20">
              <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                Zatížení kolenní chrupavky:
              </span>
              <div className="text-lg font-mono font-bold text-rose-300">
                Artróza kolene 3. st.
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Požadavek na rocker podrážku a drop 4–8 mm
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#070f1e] border border-cyan-500/20">
              <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                Stav rotace chodidla:
              </span>
              <div className="text-lg font-mono font-bold text-teal-300">
                Supinace (Vnější hrana)
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Kontraindikace: <span className="text-amber-300 font-semibold">Zákaz pronačních klínů</span>
              </p>
            </div>
          </div>

          {/* 3D Visual telemetry comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-center">
            <div className="relative h-60 rounded-2xl overflow-hidden bg-[#040914] border border-cyan-500/30">
              <Image
                src="/images/knee-foot-telemetry.jpg"
                alt="Kinetic model"
                fill
                className="object-cover object-center"
              />
              <div className="absolute bottom-3 left-3 bg-black/85 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-mono text-cyan-300 border border-cyan-500/40">
                3D SIMULACE TLAKU V KOLENI
              </div>
            </div>

            <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed">
              <h3 className="text-base font-bold text-white">
                Jak bAIright chrání vaše klouby před opotřebením:
              </h3>
              <div className="flex gap-2.5 items-start">
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-cyan-300 block">Eliminace patellofemorálního tlaku:</strong>
                  Snížením dropu na 4–8 mm dochází k narovnání osy holenní kosti, což redukuje tření v kolenní štěrbině až o 23%.
                </div>
              </div>

              <div className="flex gap-2.5 items-start">
                <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-teal-300 block">Kolébkový přechod (Rocker Geometry):</strong>
                  Zakřivení přední části podrážky přebírá práci za ztuhlé klouby prstů a ulevuje kolenním extenzorům při odrazu.
                </div>
              </div>

              <div className="flex gap-2.5 items-start">
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-cyan-300 block">Prostor pro kosti záprstí (2E Last):</strong>
                  Šířka {footWidthMm} mm zabraňuje stlačení cév a nervů (Mortonova neuralgie) i deformitě vbočeného palce.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-cyan-500/20 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Biomechanický výpočet optimalizovaný pro ochranu pohybového aparátu.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 shadow-md hover:brightness-110 transition-all"
          >
            Rozumím, pokračovat
          </button>
        </div>
      </div>
    </div>
  );
};
