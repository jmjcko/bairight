'use client';

import React from 'react';
import { IntakeFormData } from '@/lib/agent/markdown-agent-loader';
import { SupportedLocale } from '@/lib/i18n/translations';
import { 
  Activity, 
  ShieldAlert, 
  ShieldCheck, 
  Footprints, 
  Compass, 
  AlertTriangle, 
  Check, 
  Ban, 
  Flame, 
  Cpu, 
  Scale, 
  Maximize2 
} from 'lucide-react';

interface BiomechanicalHUDProps {
  formData: IntakeFormData;
  locale: SupportedLocale;
  currentStep: number;
}

export const BiomechanicalHUD: React.FC<BiomechanicalHUDProps> = ({
  formData,
  locale,
  currentStep,
}) => {
  const isCs = locale === 'cs';
  const hasKneeOA3 = formData.joint_conditions.includes('Knee Osteoarthritis Grade 3');
  const hasSupination = formData.foot_mechanics === 'supination';
  const hasPronation = formData.foot_mechanics === 'overpronation';
  const isWide2E = formData.foot_width === 'wide_2e';
  const isWide4E = formData.foot_width === 'extra_wide_4e';
  const hasNikeBan = formData.forbidden_brands.includes('Nike');

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6 flex flex-col justify-between h-full border border-cyan-500/25 shadow-[0_0_30px_rgba(6,182,212,0.12)] relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div>
        {/* Telemetry Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-cyan-500/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Cpu className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span>{isCs ? 'TELEMETRIE CHODIDLA' : 'FOOT TELEMETRY'}</span>
              </div>
              <h3 className="text-sm font-extrabold text-white tracking-tight">
                {isCs ? 'Biomechanický monitor' : 'Biomechanical Monitor'}
              </h3>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-400/30 text-cyan-300">
            HUD v2.4
          </span>
        </div>

        {/* Anatomical Foot Visualizer */}
        <div className="bg-[#040812]/80 rounded-xl p-4 border border-cyan-500/20 mb-5 relative">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2">
            <span>{isCs ? 'TLAKOVÁ MAPA & ŠÍŘKA' : 'PRESSURE MAP & WIDTH'}</span>
            <span className="text-cyan-400 font-bold">
              {formData.foot_width === 'wide_2e' ? '2E (ŠIROKÉ)' : formData.foot_width === 'extra_wide_4e' ? '4E (EXTRA)' : 'STANDARD (D)'}
            </span>
          </div>

          {/* Foot Silhouette SVG Graphic with Dynamic Heatmap */}
          <div className="flex items-center justify-center py-3 relative">
            <svg viewBox="0 0 120 220" className="w-28 h-48 drop-shadow-[0_0_12px_rgba(6,182,212,0.3)]">
              {/* Outer boundary lines for 2E/4E wide fit */}
              {(isWide2E || isWide4E) && (
                <path
                  d="M 50 15 C 32 18, 18 45, 18 90 C 18 140, 30 185, 45 208 C 65 215, 85 208, 98 185 C 108 140, 108 90, 95 45 C 85 18, 70 15, 50 15 Z"
                  fill="none"
                  stroke="rgba(6, 182, 212, 0.4)"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
              )}

              {/* Standard Foot Base Outline */}
              <path
                d="M 55 20 C 40 22, 25 45, 25 85 C 25 135, 36 175, 48 200 C 65 206, 80 200, 90 175 C 98 135, 98 85, 88 45 C 80 22, 70 20, 55 20 Z"
                fill="rgba(11, 22, 40, 0.9)"
                stroke="rgba(6, 182, 212, 0.8)"
                strokeWidth="2"
              />

              {/* Forefoot / Metatarsal Zone (Lights up for forefoot strike or wide fit) */}
              <ellipse
                cx="58"
                cy="58"
                rx={isWide2E || isWide4E ? "30" : "24"}
                ry="18"
                fill={formData.strike_pattern === 'forefoot' ? "rgba(6, 182, 212, 0.6)" : "rgba(6, 182, 212, 0.15)"}
                stroke={formData.strike_pattern === 'forefoot' ? "#06b6d4" : "rgba(6, 182, 212, 0.3)"}
                strokeWidth="1.5"
                className={formData.strike_pattern === 'forefoot' ? "animate-pulse" : ""}
              />

              {/* Midfoot Arch Zone */}
              <ellipse
                cx="58"
                cy="110"
                rx="18"
                ry="22"
                fill={formData.strike_pattern === 'midfoot' ? "rgba(20, 184, 166, 0.6)" : "rgba(20, 184, 166, 0.1)"}
                stroke="rgba(20, 184, 166, 0.3)"
                strokeWidth="1"
              />

              {/* Heel Zone (Lights up for heel strike) */}
              <ellipse
                cx="58"
                cy="175"
                rx="20"
                ry="18"
                fill={formData.strike_pattern === 'heel_strike' ? "rgba(245, 158, 11, 0.6)" : "rgba(6, 182, 212, 0.2)"}
                stroke={formData.strike_pattern === 'heel_strike' ? "#f59e0b" : "rgba(6, 182, 212, 0.3)"}
                strokeWidth="1.5"
                className={formData.strike_pattern === 'heel_strike' ? "animate-pulse" : ""}
              />

              {/* Supination (outer) vs Overpronation (inner) lateral load vectors */}
              {hasSupination && (
                <g>
                  <path d="M 22 70 L 22 150" stroke="#06b6d4" strokeWidth="3" strokeLinecap="round" />
                  <text x="5" y="115" fill="#06b6d4" fontSize="8" fontFamily="monospace">SUP</text>
                </g>
              )}
              {hasPronation && (
                <g>
                  <path d="M 98 70 L 98 150" stroke="#f43f5e" strokeWidth="3" strokeLinecap="round" />
                  <text x="102" y="115" fill="#f43f5e" fontSize="8" fontFamily="monospace">PRON</text>
                </g>
              )}
            </svg>

            {/* Dynamic callout pills */}
            <div className="absolute right-2 top-3 flex flex-col gap-1.5 text-right">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/70 border border-cyan-500/30 text-cyan-300">
                EU {formData.eu_size} • {formData.foot_length_cm} cm
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                hasSupination 
                  ? 'bg-cyan-950/70 border-cyan-400 text-cyan-300' 
                  : hasPronation 
                  ? 'bg-rose-950/70 border-rose-400 text-rose-300' 
                  : 'bg-teal-950/70 border-teal-400 text-teal-300'
              }`}>
                {formData.foot_mechanics.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Clinical Guardrails & Constraints */}
        <div className="space-y-2.5">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>{isCs ? 'AKTIVNÍ PRAVIDLA AGENTA' : 'ACTIVE AGENT RULES'}</span>
            <span className="text-teal-400 font-bold">STAV: OK</span>
          </div>

          {/* Knee OA Grade 3 Warning Card */}
          {hasKneeOA3 ? (
            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs">
              <div className="flex items-center gap-2 font-bold mb-1">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{isCs ? 'Gonartróza III. st. (Kritické)' : 'Knee OA Grade 3 (Critical)'}</span>
              </div>
              <p className="text-[11px] text-amber-300/80 leading-tight">
                {isCs 
                  ? 'Povinná kolébková podešev (Rocker), drop 4–8 mm a maximální tlumení pro snížení zátěže patelly.' 
                  : 'Mandatory rocker sole geometry, drop 4–8mm, and maximum shock attenuation.'}
              </p>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 text-xs flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-teal-400" />
              <span>{isCs ? 'Bez kritického poškození chrupavky kolene' : 'No critical knee cartilage degeneration'}</span>
            </div>
          )}

          {/* Brand Governance Protocol */}
          <div className="p-3 rounded-xl bg-[#081220] border border-cyan-500/20 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">{isCs ? 'Zakázané značky:' : 'Blacklisted Brands:'}</span>
              <span className="font-mono text-rose-400 font-bold">
                {formData.forbidden_brands.length > 0 ? formData.forbidden_brands.join(', ') : (isCs ? 'Žádné' : 'None')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">{isCs ? 'Preferované značky:' : 'Preferred Brands:'}</span>
              <span className="font-mono text-cyan-300 font-bold">
                {formData.preferred_brands.length > 0 ? formData.preferred_brands.join(', ') : (isCs ? 'Žádné' : 'None')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Kinetic Chain Readiness Bottom Bar */}
      <div className="pt-4 mt-4 border-t border-cyan-500/20">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-slate-400">{isCs ? 'Kompletnost profilu' : 'Profile Readiness'}</span>
          <span className="font-mono font-bold text-cyan-400">{Math.round((currentStep / 6) * 100)}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-cyan-500/30">
          <div 
            className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-cyan-300 transition-all duration-500 rounded-full"
            style={{ width: `${Math.round((currentStep / 6) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
