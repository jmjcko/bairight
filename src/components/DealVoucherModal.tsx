'use client';

import React, { useState } from 'react';
import { X, ExternalLink, Tag, Check, ShieldCheck, ShoppingCart } from 'lucide-react';

interface DealVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  shoeName: string;
  retailerName: string;
  priceEur: number;
  dealUrl: string;
}

export const DealVoucherModal: React.FC<DealVoucherModalProps> = ({
  isOpen,
  onClose,
  shoeName,
  retailerName,
  priceEur,
  dealUrl,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const czk = Math.round(priceEur * 25.2);
  const discountedPrice = Math.round(czk * 0.9); // 10% discount

  const handleCopy = () => {
    navigator.clipboard.writeText('BAIRIGHT10');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0B121E] border border-cyan-500/30 rounded-3xl p-6 shadow-[0_20px_70px_rgba(6,182,212,0.25)] overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-20 -right-20 w-52 h-52 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                Evropská partnerská nabídka
              </div>
              <h3 className="text-sm font-bold text-white">
                Nákup u ověřeného prodejce
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Details */}
        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-[#070f1e] border border-cyan-500/20">
            <div className="text-slate-400 text-[11px]">Vybraný model:</div>
            <div className="text-sm font-extrabold text-white mb-1">{shoeName}</div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800 text-[11px]">
              <span className="text-slate-400">Obchod: <strong className="text-cyan-300">{retailerName}</strong></span>
              <span className="font-mono text-white font-bold">{czk.toLocaleString('cs-CZ')} Kč (€{priceEur.toFixed(2)})</span>
            </div>
          </div>

          {/* Coupon Code Banner */}
          <div className="p-3.5 rounded-2xl bg-cyan-950/50 border border-cyan-400/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-cyan-300 font-bold flex items-center gap-1.5 text-xs">
                <Tag className="w-3.5 h-3.5" />
                Exkluzivní kupón bAIright (-10%):
              </span>
              <span className="text-emerald-400 font-mono font-bold">Úspora ~{Math.round(czk * 0.1)} Kč</span>
            </div>

            <div className="flex items-center justify-between bg-black/60 rounded-xl p-2 border border-cyan-500/30">
              <span className="font-mono font-extrabold text-white tracking-wider text-sm pl-2">
                BAIRIGHT10
              </span>
              <button
                onClick={handleCopy}
                className="px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-slate-950" /> : null}
                <span>{copied ? 'Zkopírováno' : 'Kopírovat kód'}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
            <span>Garance 100% originálního evropského zboží a 30denní vrácení zdarma.</span>
          </div>

          {/* CTA Link to Retailer */}
          <div className="pt-2">
            <a
              href={dealUrl || 'https://top4running.cz'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:brightness-110 flex items-center justify-center gap-2 text-xs transition-all"
            >
              <span>Přejít do obchodu ({retailerName})</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
