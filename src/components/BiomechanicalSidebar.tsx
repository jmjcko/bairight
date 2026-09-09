'use client';

import React from 'react';
import { BiomechanicalProfile, MandatoryCheckResult } from '@/lib/agent/types';
import { 
  Activity, 
  ShieldAlert, 
  ShieldCheck, 
  Scale, 
  Maximize2, 
  Footprints, 
  AlertCircle, 
  HeartPulse, 
  Lock, 
  Unlock 
} from 'lucide-react';

interface BiomechanicalSidebarProps {
  profile: BiomechanicalProfile;
  evalResult: MandatoryCheckResult;
}

export const BiomechanicalSidebar: React.FC<BiomechanicalSidebarProps> = ({
  profile,
  evalResult,
}) => {
  const presentCount = evalResult.presentFields.length;
  const progressPercent = Math.round((presentCount / 5) * 100);

  return (
    <aside className="w-full lg:w-96 flex flex-col bg-slate-900/80 backdrop-blur-md border-b lg:border-b-0 lg:border-r border-slate-800 p-5 shrink-0 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white tracking-wide uppercase">Biomechanical Profile</h2>
          <p className="text-xs text-slate-400">Clinical Podiatry Intake</p>
        </div>
      </div>

      {/* Gating Status Card */}
      <div className={`p-4 rounded-xl border mb-6 transition-all ${
        evalResult.isReady 
          ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' 
          : 'bg-amber-950/30 border-amber-500/30 text-amber-200'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 font-medium text-xs">
            {evalResult.isReady ? (
              <Unlock className="w-4 h-4 text-emerald-400" />
            ) : (
              <Lock className="w-4 h-4 text-amber-400" />
            )}
            <span>{evalResult.isReady ? 'Search Tools Unlocked' : 'Search Tools Gated'}</span>
          </div>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-black/40">
            {presentCount} / 5
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-950 rounded-full h-1.5 mb-2 overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 rounded-full ${
              evalResult.isReady ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <p className="text-[11px] leading-relaxed text-slate-300">
          {evalResult.isReady 
            ? 'All 5 mandatory parameters collected. External forum queries & European 2E stock scans authorized.' 
            : 'AI will autonomously query missing items before searching external inventories.'}
        </p>
      </div>

      {/* Mandatory Parameters Checklist */}
      <div className="space-y-3 mb-6">
        <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider">Mandatory Metrics</h3>

        {/* 1. Body Weight */}
        <div className={`flex items-center justify-between p-3 rounded-lg border text-xs transition-colors ${
          profile.weight_kg 
            ? 'bg-slate-800/60 border-slate-700 text-slate-100' 
            : 'bg-slate-900/40 border-slate-800/80 text-slate-500'
        }`}>
          <div className="flex items-center gap-2.5">
            <Scale className="w-4 h-4 text-cyan-400 shrink-0" />
            <div>
              <p className="font-medium text-slate-200">Body Weight</p>
              <p className="text-[10px] text-slate-400">Foam density calibration</p>
            </div>
          </div>
          <span className="font-mono font-semibold">
            {profile.weight_kg ? `${profile.weight_kg} kg` : 'Missing'}
          </span>
        </div>

        {/* 2. Foot Width */}
        <div className={`flex items-center justify-between p-3 rounded-lg border text-xs transition-colors ${
          profile.foot_width 
            ? 'bg-slate-800/60 border-slate-700 text-slate-100' 
            : 'bg-slate-900/40 border-slate-800/80 text-slate-500'
        }`}>
          <div className="flex items-center gap-2.5">
            <Maximize2 className="w-4 h-4 text-purple-400 shrink-0" />
            <div>
              <p className="font-medium text-slate-200">Foot Width</p>
              <p className="text-[10px] text-slate-400">2E Wide verification</p>
            </div>
          </div>
          <span className={`font-mono font-semibold px-2 py-0.5 rounded text-[11px] ${
            profile.foot_width === 'wide_2e' ? 'bg-purple-900/50 text-purple-200 border border-purple-500/40' : ''
          }`}>
            {profile.foot_width ? profile.foot_width.replace('_', ' ').toUpperCase() : 'Missing'}
          </span>
        </div>

        {/* 3. Strike Pattern / Supination */}
        <div className={`flex items-center justify-between p-3 rounded-lg border text-xs transition-colors ${
          profile.strike_type 
            ? 'bg-slate-800/60 border-slate-700 text-slate-100' 
            : 'bg-slate-900/40 border-slate-800/80 text-slate-500'
        }`}>
          <div className="flex items-center gap-2.5">
            <Footprints className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <p className="font-medium text-slate-200">Gait & Strike</p>
              <p className="text-[10px] text-slate-400">Lateral vs medial load</p>
            </div>
          </div>
          <span className="font-mono font-semibold text-[11px]">
            {profile.strike_type ? profile.strike_type.replace('_', ' ').toUpperCase() : 'Missing'}
          </span>
        </div>

        {/* 4. Knee Health (Osteoarthritis Grade 3) */}
        <div className={`flex items-center justify-between p-3 rounded-lg border text-xs transition-colors ${
          profile.knee_condition 
            ? 'bg-slate-800/60 border-slate-700 text-slate-100' 
            : 'bg-slate-900/40 border-slate-800/80 text-slate-500'
        }`}>
          <div className="flex items-center gap-2.5">
            <HeartPulse className="w-4 h-4 text-rose-400 shrink-0" />
            <div>
              <p className="font-medium text-slate-200">Knee Condition</p>
              <p className="text-[10px] text-slate-400">Rocker geometry filter</p>
            </div>
          </div>
          <span className={`font-mono font-semibold px-2 py-0.5 rounded text-[10px] ${
            profile.knee_condition === 'osteoarthritis_grade_3' 
              ? 'bg-rose-950/60 text-rose-300 border border-rose-500/40' 
              : ''
          }`}>
            {profile.knee_condition 
              ? profile.knee_condition.replace(/_/g, ' ').toUpperCase() 
              : 'Missing'}
          </span>
        </div>

        {/* 5. Past Injuries */}
        <div className={`flex items-center justify-between p-3 rounded-lg border text-xs transition-colors ${
          profile.past_injuries.length > 0 || evalResult.presentFields.includes('past_injuries')
            ? 'bg-slate-800/60 border-slate-700 text-slate-100' 
            : 'bg-slate-900/40 border-slate-800/80 text-slate-500'
        }`}>
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <p className="font-medium text-slate-200">Past Injuries</p>
              <p className="text-[10px] text-slate-400">Contraindications check</p>
            </div>
          </div>
          <span className="font-mono font-semibold text-[11px]">
            {profile.past_injuries.length > 0 
              ? profile.past_injuries.join(', ') 
              : evalResult.presentFields.includes('past_injuries') 
                ? 'None Reported' 
                : 'Missing'}
          </span>
        </div>
      </div>

      {/* Clinical Podiatry Notes Box */}
      <div className="mt-auto pt-4 border-t border-slate-800">
        <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-800/30 text-xs">
          <div className="flex items-center gap-2 font-semibold text-blue-300 mb-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>Grade 3 Knee OA Directive</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-300">
            For Grade 3 Knee Osteoarthritis, shoes must feature an early-stage rocker sole, maximum compliant foam, a 4–8mm drop, and a genuine 2E wide platform to disperse axial impact and minimize patellofemoral torque.
          </p>
        </div>
      </div>
    </aside>
  );
};
