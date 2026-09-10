'use client';

import React from 'react';
import Image from 'next/image';
import { AgentPrescriptionResult, IntakeFormData } from '@/lib/agent/markdown-agent-loader';
import { X, FileText, AlertTriangle, ShieldCheck, Activity, Stethoscope, CheckCircle2 } from 'lucide-react';

interface ClinicalAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: AgentPrescriptionResult | null;
  formData: IntakeFormData;
}

export const ClinicalAssessmentModal: React.FC<ClinicalAssessmentModalProps> = ({
  isOpen,
  onClose,
  result,
  formData,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#0B121E] border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_25px_70px_rgba(6,182,212,0.25)] overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Glow */}
        <div className="absolute -top-28 -right-28 w-72 h-72 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                Biomechanický profil • bAIright Asistent
              </div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                Podrobný biomechanický rozbor profilu
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-cyan-500/40 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-5 text-xs text-slate-200">
          {/* Biomechanical Profile Summary */}
          <div className="p-4 rounded-2xl bg-[#070f1e] border border-cyan-500/25 space-y-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Zadané parametry profilu:</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="p-2.5 rounded-xl bg-[#050B15] border border-slate-800">
                <span className="text-slate-400 block text-[10px] font-mono">Délka chodidla:</span>
                <span className="font-mono text-cyan-300 font-bold">{formData.foot_length_mm || 280} mm</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#050B15] border border-slate-800">
                <span className="text-slate-400 block text-[10px] font-mono">Šířka chodidla:</span>
                <span className="font-mono text-teal-300 font-bold">{formData.foot_width_mm || 104} mm (2E)</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#050B15] border border-slate-800">
                <span className="text-slate-400 block text-[10px] font-mono">Mechanika došlapu:</span>
                <span className="font-bold text-white">
                  {formData.foot_mechanics === 'supination' ? 'Supinace (vnější)' : 'Neutrální'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#050B15] border border-slate-800">
                <span className="text-slate-400 block text-[10px] font-mono">Stav kloubů:</span>
                <span className="font-bold text-amber-300">Zátěž kolene (OA 3. st.)</span>
              </div>
            </div>
          </div>

          {/* Clinical Assessment Body */}
          <div className="p-4 rounded-2xl bg-[#070f1e] border border-cyan-500/20 space-y-2">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-400" />
              <span>Biomechanické vyhodnocení parametrů:</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
              {result?.clinicalAssessment || `Vyhodnoceno systémem bAIright na základě zadaných biomechanických pravidel.
              
              - Šetření kolenních kloubů: Při zátěži kolene doporučen nízký až střední drop (4–8 mm) a aktivní kolébková podrážka (rocker) pro plynulý odval a snížení tlaku na patelu.
              - Anatomie chodidla: Při naměřené šířce ${formData.foot_width_mm || 104} mm je doporučeno kopyto 2E/4E pro prevenci tlaku na prsty a metatarzy.
              - Mechanika došlapu: Došlap na vnější hranu (supinace). Vnitřní pronační klíny jsou nevhodné.`}
            </p>
          </div>

          {/* Contraindications Warning Box */}
          <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-2">
            <h3 className="font-bold text-amber-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Doporučená omezení (Čemu se raději vyhnout):</span>
            </h3>
            <ul className="space-y-1 text-[11px] text-slate-300 list-disc list-inside">
              <li>Vyhněte se botám s vysokým dropem (10–12 mm), které zvyšují ohyb v koleni.</li>
              <li>Vyhněte se botám s vnitřními pronačními klíny a tvrdou vnitřní pěnou (tlačí supinující nohu ještě více ven).</li>
              <li>Vyhněte se úzkým botám standardní šířky D, které stlačují záprstní kůstky.</li>
            </ul>
          </div>

          {/* Legal Compliance Disclaimer */}
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
            ℹ️ <strong>Upozornění:</strong> Veškerá doporučení a výpočty mají výhradně informativní a orientační charakter. Systém neprovádí lékařskou diagnostiku a nenahrazuje odborné vyšetření lékařem či ortopedem.
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-4 border-t border-cyan-500/20 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono">
            Systém bAIright • Biomechanický rozbor
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all cursor-pointer"
          >
            Zavřít rozbor
          </button>
        </div>
      </div>
    </div>
  );
};
