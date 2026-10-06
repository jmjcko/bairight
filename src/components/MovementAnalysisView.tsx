'use client';

import React from 'react';
import Image from 'next/image';
import { 
  Activity, 
  ShieldCheck, 
  Zap, 
  ArrowRight, 
  HeartPulse, 
  ChevronRight, 
  Footprints,
  Compass,
  ArrowLeft,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { translations, SupportedLocale } from '@/lib/i18n/translations';

interface MovementAnalysisViewProps {
  footLengthMm?: number;
  footWidthMm?: number;
  kneeCondition?: string;
  onNavigateToWizard?: () => void;
  onNavigateToCatalog?: () => void;
  onNavigateToChat?: () => void;
  locale?: SupportedLocale;
}

export const MovementAnalysisView: React.FC<MovementAnalysisViewProps> = ({
  footLengthMm = 280,
  footWidthMm = 104,
  kneeCondition = 'Artróza kolene 3. st.',
  onNavigateToWizard,
  onNavigateToCatalog,
  onNavigateToChat,
  locale = 'cs',
}) => {
  const t = translations[locale].analysis;
  const widthIndex = ((footWidthMm / footLengthMm) * 100).toFixed(1);

  return (
    <div className="flex-1 overflow-y-auto bg-[#f4f6f8] text-[#263238] p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
        {/* Top Header Card */}
        <div className="rounded-2xl bg-white border border-slate-200 border-t-4 border-t-[#0099cc] p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#e1f5fe] border border-[#b3e5fc] text-[#01579b] text-xs font-mono font-bold tracking-wider uppercase">
                <Activity className="w-3.5 h-3.5 text-[#01579b]" />
                <span>{t.badge}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#263238] tracking-tight">
                {t.title}
              </h1>
              <p className="text-sm text-[#546e7a] max-w-2xl leading-relaxed">
                {t.subtitle}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-3">
              {onNavigateToCatalog && (
                <button
                  onClick={onNavigateToCatalog}
                  className="px-4 py-2.5 rounded-xl bg-[#0099cc] hover:bg-[#0088b8] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t.goToCatalog}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
              {onNavigateToWizard && (
                <button
                  onClick={onNavigateToWizard}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-200 hover:border-cyan-500/30 text-[#607d8b] hover:text-[#263238] font-medium text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{t.backToWizard}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Telemetry Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white shadow-xs border border-slate-200 hover:border-cyan-400/40 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#607d8b]">
                {t.footDimensions}
              </span>
              <Footprints className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-mono font-extrabold text-cyan-300">
              {footLengthMm} mm × {footWidthMm} mm
            </div>
            <p className="text-xs text-[#607d8b] mt-1.5">
              Index šířky: <span className="text-teal-300 font-bold">{widthIndex}% (Široké kopyto 2E)</span>
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white shadow-xs border border-slate-200 hover:border-cyan-400/40 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#607d8b]">
                {t.kneeLoad}
              </span>
              <HeartPulse className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-mono font-extrabold text-rose-300">
              {kneeCondition}
            </div>
            <p className="text-xs text-[#607d8b] mt-1.5">
              {t.rockerRequirement}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white shadow-xs border border-slate-200 hover:border-cyan-400/40 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#607d8b]">
                {t.footRotation}
              </span>
              <Compass className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-2xl font-mono font-extrabold text-teal-300">
              {t.supinationLabel}
            </div>
            <p className="text-xs text-amber-300 font-semibold mt-1.5">
              {t.contraindicationNoPost}
            </p>
          </div>
        </div>

        {/* Detailed Visual Telemetry & Clinical Shield */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* 3D Visual telemetry */}
          <div className="lg:col-span-6 rounded-3xl overflow-hidden bg-white shadow-xs border border-slate-200 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
                  {t.simulationBadge}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  REDUKCE TLAKU -23%
                </span>
              </div>
              <div className="relative h-72 w-full rounded-2xl overflow-hidden bg-[#040914] border border-cyan-500/30">
                <Image
                  src="/images/knee-foot-telemetry.jpg"
                  alt="Kinetic model"
                  fill
                  className="object-cover object-center"
                />
                <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-mono text-cyan-300 border border-cyan-500/30">
                  BIO-SENSORS ONLINE
                </div>
              </div>
            </div>

            {/* Load distribution telemetry bars */}
            <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-3 gap-3 text-center">
              <div className="p-2.5 rounded-xl bg-[#f4f6f8] border border-slate-200">
                <div className="text-[10px] font-mono text-[#607d8b] uppercase">Došlap pata</div>
                <div className="text-sm font-mono font-bold text-cyan-300">65%</div>
                <div className="text-[9px] text-[#607d8b] mt-0.5">Tlumení max.</div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#f4f6f8] border border-slate-200">
                <div className="text-[10px] font-mono text-[#607d8b] uppercase">Střed klenby</div>
                <div className="text-sm font-mono font-bold text-teal-300">15%</div>
                <div className="text-[9px] text-[#607d8b] mt-0.5">Bez klínu</div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#f4f6f8] border border-slate-200">
                <div className="text-[10px] font-mono text-[#607d8b] uppercase">Odraz špička</div>
                <div className="text-sm font-mono font-bold text-cyan-300">20%</div>
                <div className="text-[9px] text-[#607d8b] mt-0.5">Rocker profil</div>
              </div>
            </div>
          </div>

          {/* Clinical Protection Mechanisms */}
          <div className="lg:col-span-6 rounded-3xl bg-white shadow-xs border border-slate-200 p-6 flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-[#263238]">
                  {t.protectionTitle}
                </h3>
              </div>

              <div className="space-y-4 text-xs text-[#607d8b] leading-relaxed">
                <div className="p-3.5 rounded-2xl bg-[#f4f6f8] border border-slate-200">
                  <div className="flex gap-2.5 items-start">
                    <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-cyan-300 block text-xs mb-0.5">
                        {t.point1Title}
                      </strong>
                      <p className="text-[11px] text-[#607d8b]">{t.point1Desc}</p>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#f4f6f8] border border-teal-500/20">
                  <div className="flex gap-2.5 items-start">
                    <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-teal-300 block text-xs mb-0.5">
                        {t.point2Title}
                      </strong>
                      <p className="text-[11px] text-[#607d8b]">{t.point2Desc}</p>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#f4f6f8] border border-slate-200">
                  <div className="flex gap-2.5 items-start">
                    <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-cyan-300 block text-xs mb-0.5">
                        {t.point3Title}
                      </strong>
                      <p className="text-[11px] text-[#607d8b]">{t.point3Desc}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions inside View */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[11px] text-[#607d8b]">
                {t.telemetryFooter}
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {onNavigateToChat && (
                  <button
                    onClick={onNavigateToChat}
                    className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-200 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Konzultovat s AI</span>
                  </button>
                )}
                {onNavigateToCatalog && (
                  <button
                    onClick={onNavigateToCatalog}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>Do katalogu</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
