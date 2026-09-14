'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Check, Download, History, Sparkles, FileText, ChevronRight, User, Trash2, Bot, Layers } from 'lucide-react';
import { UniversalAgentDefinition } from '@/lib/agent/universal-agent-schema';
import { AgentStorageService } from '@/lib/agent/agent-storage-service';
import { ManagedAgentRegistryService } from '@/lib/agent/managed-agents-registry';

interface MissionSelectorProps {
  currentAgent: UniversalAgentDefinition | null;
  isLauncherActive?: boolean;
  variant?: 'hero' | 'compact';
  userName?: string;
  userAgents?: UniversalAgentDefinition[];
  onSelectAgent: (agent: UniversalAgentDefinition) => void;
  onCreateNewAgent?: () => void;
  onOpenAgentRules?: () => void;
  onDeleteAgent?: (agentId: string) => void;
}

export const MissionSelector: React.FC<MissionSelectorProps> = ({
  currentAgent,
  isLauncherActive = false,
  variant = 'hero',
  userName = 'Jan Mynář',
  userAgents,
  onSelectAgent,
  onCreateNewAgent,
  onDeleteAgent,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [internalAgents, setInternalAgents] = useState<UniversalAgentDefinition[]>([]);
  const [managedAgents, setManagedAgents] = useState<UniversalAgentDefinition[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [expandedHistoryAgentId, setExpandedHistoryAgentId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeUserAgents = userAgents !== undefined ? userAgents : internalAgents;

  const refreshAgents = () => {
    setInternalAgents(AgentStorageService.getAllAgents());
    setManagedAgents(ManagedAgentRegistryService.getManagedAgents());
  };

  useEffect(() => {
    refreshAgents();
  }, [isOpen]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setExpandedHistoryAgentId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const countBadge = activeUserAgents.length > 0 ? ` (${activeUserAgents.length})` : '';
  const activeLabel = isLauncherActive || !currentAgent 
    ? `Vybrat z mých vytvořených agentů${countBadge}` 
    : currentAgent.name;
  const activeIcon = isLauncherActive || !currentAgent 
    ? '🤖' 
    : (currentAgent.icon || '🤖');
  const activeVersion = currentAgent?.version ? `v${currentAgent.version}` : null;

  return (
    <div className={`relative ${variant === 'hero' ? 'w-full max-w-md mx-auto' : ''}`} ref={dropdownRef}>
      {/* Trigger Button */}
      {variant === 'hero' ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between gap-2.5 px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/95 border border-cyan-500/35 hover:border-cyan-400 text-slate-200 hover:text-white transition-all duration-200 cursor-pointer shadow-lg shadow-cyan-950/40 group backdrop-blur-md"
          title="Zvolit historicky vytvořeného agenta vašeho účtu"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-lg p-1 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 shrink-0">
              {activeIcon}
            </span>
            <div className="text-left min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 transition-colors truncate">
                  {activeLabel}
                </span>
                {activeVersion && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-400/30 font-semibold shrink-0">
                    {activeVersion}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-400 block truncate">
                {isLauncherActive || !currentAgent 
                  ? `Historicky vytvoření agenti vašeho účtu (${userName})` 
                  : 'Připraven k detailnímu výběru či ladění'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-cyan-400 shrink-0">
            <span className="text-[11px] font-mono font-medium hidden sm:inline text-cyan-300/80">Moji agenti</span>
            <ChevronDown className={`w-4 h-4 text-cyan-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#08101e]/80 hover:bg-[#0c182c] border border-cyan-500/25 hover:border-cyan-400/60 transition-all cursor-pointer group shadow-sm text-xs"
          title="Zvolit historicky vytvořeného agenta účtu"
        >
          <span className="text-sm leading-none">{activeIcon}</span>
          <span className="text-slate-200 group-hover:text-cyan-300 transition-colors font-medium hidden sm:inline truncate max-w-[140px]">
            {activeLabel}
          </span>
          {activeVersion && (
            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/40">
              {activeVersion}
            </span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 text-cyan-400/80 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={`absolute top-full mt-2 rounded-2xl bg-[#060e1b]/98 backdrop-blur-2xl border border-cyan-500/40 shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_30px_rgba(6,182,212,0.2)] p-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200 ${
          variant === 'hero' ? 'left-0 right-0 w-full sm:w-[460px] sm:left-1/2 sm:-translate-x-1/2' : 'right-0 w-80 sm:w-96'
        }`}>
          {/* Header Info */}
          <div className="px-3 py-2.5 border-b border-cyan-500/15 flex items-center justify-between">
            <span className="text-[11px] font-mono text-cyan-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Moji vytvoření agenti ({activeUserAgents.length})
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/50 flex items-center gap-1">
              <User className="w-3 h-3 text-cyan-400" />
              Účet: {userName}
            </span>
          </div>

          {/* User's Created Agents List */}
          {activeUserAgents.length > 0 ? (
            <div className="py-2 space-y-1.5 max-h-96 overflow-y-auto pr-1">
              {activeUserAgents.map((agent) => {
                const isSelected = !isLauncherActive && currentAgent?.id === agent.id;
                const formattedDate = agent.updatedAt 
                  ? new Date(agent.updatedAt).toLocaleDateString('cs-CZ') 
                  : (agent.createdAt ? new Date(agent.createdAt).toLocaleDateString('cs-CZ') : 'Nedávno');

                return (
                  <div 
                    key={agent.id}
                    className={`rounded-xl border transition-all ${
                      isSelected 
                        ? 'bg-cyan-950/60 border-cyan-400/50 text-white' 
                        : 'bg-slate-950/50 hover:bg-slate-900/80 border-slate-800/80 text-slate-300'
                    }`}
                  >
                    <div className="p-2.5 flex items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectAgent(agent);
                          setIsOpen(false);
                        }}
                        className="flex items-start gap-2.5 text-left flex-1 min-w-0 cursor-pointer group"
                      >
                        <span className="text-xl p-1.5 rounded-lg bg-[#050c18] border border-cyan-500/25 shrink-0 group-hover:border-cyan-400/50 transition-colors">
                          {agent.icon || '🤖'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 transition-colors truncate">
                              {agent.name}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/80 border border-cyan-400/40 text-cyan-300 font-semibold">
                              v{agent.version || '1.0'}
                            </span>
                            {isSelected && (
                              <span className="flex items-center gap-1 text-[10px] font-mono text-cyan-300 bg-cyan-950 px-1.5 py-0.2 rounded border border-cyan-500/40 font-semibold">
                                <Check className="w-2.5 h-2.5" />
                                Aktivní
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 leading-snug mt-1 line-clamp-2">
                            {agent.description || `Nákupní poradce pro kategorii ${agent.category}`}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 text-[10px] font-mono text-slate-500">
                            <span className="text-cyan-400/90">{agent.questions?.length || 0} parametrů</span>
                            <span>•</span>
                            <span>Uloženo: {formattedDate}</span>
                          </div>
                        </div>
                      </button>

                      {/* Action buttons: Download & Delete */}
                      <div className="flex flex-col gap-1 shrink-0 pt-0.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            AgentStorageService.downloadAgentMarkdown(agent);
                          }}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900 hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/50 text-[10px] font-mono transition-colors cursor-pointer"
                          title={`Stáhnout ${agent.name} jako soubor .agent.md`}
                        >
                          <Download className="w-3 h-3 text-cyan-400" />
                          <span className="hidden sm:inline">Stáhnout</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Opravdu chcete smazat agenta "${agent.name}" z vašeho účtu?`)) {
                              AgentStorageService.deleteAgent(agent.id);
                              if (onDeleteAgent) onDeleteAgent(agent.id);
                              refreshAgents();
                            }
                          }}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 text-[10px] font-mono transition-colors cursor-pointer"
                          title="Smazat agenta z účtu"
                        >
                          <Trash2 className="w-3 h-3 text-rose-400" />
                          <span className="hidden sm:inline">Smazat</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center space-y-3 bg-slate-950/40 rounded-xl border border-dashed border-slate-800 my-2">
              <div className="w-10 h-10 rounded-full bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-slate-200">Zatím žádní vytvoření agenti</h5>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                  Pod účtem <strong className="text-cyan-300">{userName}</strong> zatím nemáte vytvořeného žádného nákupního agenta. Zadejte produkt výše a vytvořte si prvního agenta na míru.
                </p>
              </div>
            </div>
          )}

          {/* Optional Collapsible Platform Templates Section */}
          {managedAgents.length > 0 && (
            <div className="pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setShowTemplates(!showTemplates)}
                className="w-full flex items-center justify-between py-1.5 px-2 text-[10px] font-mono text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1.5 uppercase tracking-wider">
                  <Layers className="w-3 h-3 text-cyan-400" />
                  Oficiální doporučené šablony ({managedAgents.length})
                </span>
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showTemplates ? 'rotate-90' : ''}`} />
              </button>

              {showTemplates && (
                <div className="space-y-1.5 mt-1.5 max-h-56 overflow-y-auto pr-1">
                  {managedAgents.map((tAgent) => (
                    <div 
                      key={tAgent.id}
                      className="p-2 rounded-xl bg-slate-950/40 hover:bg-slate-900 border border-slate-800 flex items-center justify-between gap-2 transition-all"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onSelectAgent(tAgent);
                          setIsOpen(false);
                        }}
                        className="flex items-center gap-2 text-left flex-1 min-w-0 cursor-pointer"
                      >
                        <span className="text-lg">{tAgent.icon || '🤖'}</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-slate-200 truncate">
                              {tAgent.name}
                            </span>
                            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/40">
                              Šablona v{tAgent.version}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {tAgent.category}
                          </span>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          ManagedAgentRegistryService.downloadAgentFile(tAgent);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-950 text-slate-400 hover:text-cyan-300 border border-slate-700 text-xs cursor-pointer"
                        title={`Stáhnout šablonu ${tAgent.name}`}
                      >
                        <Download className="w-3 h-3 text-cyan-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quick CTA at bottom */}
          {onCreateNewAgent && (
            <div className="mt-1 pt-2 border-t border-cyan-500/15">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onCreateNewAgent();
                }}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-950/60 to-slate-900 hover:from-cyan-900/50 hover:to-slate-800 border border-cyan-500/30 hover:border-cyan-400/60 text-cyan-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nadefinovat nového agenta zadáním produktu nahoře</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

