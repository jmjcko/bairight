'use client';

import React from 'react';
import { Database, User } from 'lucide-react';
import { AIProviderConfig } from '@/lib/agent/engine-config';

interface UserProfileCapsuleProps {
  userName: string;
  demoRunsRemaining?: number;
  activeProvider?: AIProviderConfig;
  onOpenSubscriptionModal?: () => void;
  onOpenMemoryModal: () => void;
  onOpenPaletteModal?: () => void;
}

export const UserProfileCapsule: React.FC<UserProfileCapsuleProps> = ({
  userName,
  onOpenMemoryModal,
}) => {

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {/* RAG Memory Quick Button */}
      <button
        onClick={onOpenMemoryModal}
        className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#06101e] hover:bg-cyan-950/60 border border-cyan-500/25 hover:border-cyan-400/50 text-xs transition-all cursor-pointer group shadow-sm text-slate-300 hover:text-cyan-300"
        title="Zobrazit uložená fakta a paměť (RAG kontext)"
      >
        <Database className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
        <span className="text-xs font-mono font-medium">RAG</span>
      </button>



      {/* User Profile Capsule */}
      <button 
        onClick={onOpenMemoryModal}
        className="flex items-center gap-1.5 p-1 pr-2 rounded-lg bg-[#060c18] border border-cyan-500/20 hover:border-cyan-400/40 transition-all cursor-pointer group text-slate-200"
        title={`Profil: ${userName}`}
      >
        <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-cyan-600 to-teal-500 flex items-center justify-center text-slate-950 font-bold text-xs shadow-sm">
          <User className="w-3.5 h-3.5 text-slate-950" />
        </div>
        <span className="hidden lg:inline text-xs font-semibold group-hover:text-cyan-300 transition-colors">
          {userName.split(' ')[0]}
        </span>
      </button>
    </div>
  );
};
