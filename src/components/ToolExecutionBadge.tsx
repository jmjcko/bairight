'use client';

import React from 'react';
import { Search, ShoppingBag, CheckCircle2, Loader2 } from 'lucide-react';
import { translations, SupportedLocale } from '@/lib/i18n/translations';

interface ToolExecutionBadgeProps {
  toolName: string;
  status: 'running' | 'completed' | 'failed';
  args?: Record<string, unknown>;
  locale?: SupportedLocale;
}

export const ToolExecutionBadge: React.FC<ToolExecutionBadgeProps> = ({
  toolName,
  status,
  args,
  locale = 'cs',
}) => {
  const t = translations[locale].tools;
  const isForum = toolName === 'searchRunningForums';

  return (
    <div className="my-2.5 p-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
            isForum 
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
              : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
          }`}>
            {isForum ? <Search className="w-3.5 h-3.5" /> : <ShoppingBag className="w-3.5 h-3.5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-200">
                {isForum ? t.forumTitle : t.eshopTitle}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-slate-800 text-slate-400">
                {toolName}()
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {isForum ? t.forumDesc : t.eshopDesc}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {status === 'completed' ? (
            <span className="flex items-center gap-1 text-[11px] font-medium text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded-full border border-cyan-500/30">
              <CheckCircle2 className="w-3 h-3" />
              <span>{t.executed}</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-500/30 animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>{t.querying}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
