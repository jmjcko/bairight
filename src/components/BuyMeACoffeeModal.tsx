'use client';

import React from 'react';
import { UniversalAgentDefinition } from '@/lib/agent/universal-agent-schema';
import { SupportedLocale } from '@/lib/i18n/translations';
import { X, ExternalLink } from 'lucide-react';

interface BuyMeACoffeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: UniversalAgentDefinition | null;
  locale: SupportedLocale;
  buyMeACoffeeUrl?: string;
}

export const BuyMeACoffeeModal: React.FC<BuyMeACoffeeModalProps> = ({
  isOpen,
  onClose,
  agent,
  locale,
  buyMeACoffeeUrl,
}) => {
  if (!isOpen || !agent) return null;

  const effectiveUrl =
    buyMeACoffeeUrl ||
    process.env.NEXT_PUBLIC_BUYMEACOFFEE_URL ||
    'https://buymeacoffee.com/bairight';

  const isEn = locale === 'en';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bmc-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#070d18] border-2 border-cyan-500/40 rounded-3xl p-6 sm:p-8 shadow-[0_20px_70px_rgba(6,182,212,0.3)] relative text-left space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-cyan-500/20 pb-4">
          <div>
            <span className="inline-block text-[10px] font-mono font-bold tracking-widest text-cyan-400 uppercase bg-cyan-950/80 px-2.5 py-0.5 rounded border border-cyan-500/30 mb-2">
              {isEn ? 'MISSION COMPLETED • PURCHASED' : 'MISE DOKONČENA • ZAKOUPENO'}
            </span>
            <h2 id="bmc-modal-title" className="text-lg sm:text-xl font-black text-white tracking-tight">
              {isEn ? 'Congratulations on your purchase!' : 'Gratulujeme k nákupu!'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-cyan-400/50 transition-colors cursor-pointer shrink-0"
            aria-label={isEn ? 'Close dialog' : 'Zavřít dialog'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
          <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1.5">
            <span className="text-[11px] font-mono text-cyan-400 font-bold block uppercase tracking-wider">
              {agent.category}
            </span>
            <p className="text-slate-200">
              {isEn ? (
                <>
                  Your shopping advisor for <strong className="text-white">„{agent.name}“</strong> has fulfilled its mission and was archived into your <strong className="text-cyan-300 font-mono">Purchase History</strong>.
                </>
              ) : (
                <>
                  Váš nákupní rádce pro <strong className="text-white">„{agent.name}“</strong> splnil svou misi a byl bezpečně uložen do vaší <strong className="text-cyan-300 font-mono">Historie nákupů</strong>.
                </>
              )}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-2">
            <h3 className="font-bold text-white text-xs sm:text-sm">
              {isEn
                ? 'Did bAIright help you save time and make the right choice?'
                : 'Pomohl vám bAIright ušetřit čas a vybrat ten správný produkt?'}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isEn
                ? 'We build bAIright as an independent AI shopping consultant with zero sponsored ads. If it saved you money or research fatigue, we would be honored if you supported our ongoing development with a coffee.'
                : 'Vyvíjíme bAIright jako nezávislého nákupního rádce bez sponzorovaných reklam. Pokud vám ušetřil peníze nebo trápení s výběrem, budeme moc rádi, když náš vývoj podpoříte pozváním na kávu.'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer text-center"
          >
            <span>{isEn ? 'Close & Continue' : 'Zavřít a pokračovat'}</span>
          </button>

          <a
            href={effectiveUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 hover:brightness-110 shadow-[0_0_20px_rgba(6,182,212,0.35)] transition-all cursor-pointer text-center"
          >
            <span>{isEn ? 'Support on Buy Me a Coffee' : 'Pozvat na kávu (Buy Me a Coffee)'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
