'use client';

import React, { useState, useEffect } from 'react';
import { Bot, Save, RefreshCw, X, ShieldAlert, CheckCircle2, Code2, Sliders, ExternalLink, AlertCircle } from 'lucide-react';

interface AgentConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const AgentConfigModal: React.FC<AgentConfigModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [activeTab, setActiveTab] = useState<'rules' | 'editor'>('rules');
  const [content, setContent] = useState<string>('');
  const [initialContent, setInitialContent] = useState<string>('');
  const [agentName, setAgentName] = useState<string>('bAIright Podiatrist & Footwear Shopper Agent');
  const [agentVersion, setAgentVersion] = useState<string>('1.1.0');
  const [filePath, setFilePath] = useState<string>('agents/shoe-recommender-agent.md');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (isOpen) {
      loadAgentDefinition();
    }
  }, [isOpen]);

  const loadAgentDefinition = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/agent/definition');
      if (res.ok) {
        const data = await res.json();
        setContent(data.content || '');
        setInitialContent(data.content || '');
        setAgentName(data.name || 'bAIright Podiatrist & Footwear Shopper Agent');
        setAgentVersion(data.version || '1.1.0');
        setFilePath(data.filePath || 'agents/shoe-recommender-agent.md');
      }
    } catch (err) {
      console.error('Failed to load agent definition:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      const res = await fetch('/api/agent/definition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const data = await res.json();
        setInitialContent(content);
        setSaveStatus('success');
        setAgentName(data.name || agentName);
        setAgentVersion(data.version || agentVersion);
        if (onSaved) onSaved();
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
      }
    } catch (err) {
      console.error('Failed to save agent definition:', err);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const isDirty = content !== initialContent;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div 
        className="relative w-full max-w-4xl bg-[#09111e] border border-cyan-500/30 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-cyan-500/20 bg-[#0c1626]/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.4)]">
              <Bot className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white leading-none">
                  {agentName}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/30 text-cyan-300 font-semibold">
                  v{agentVersion}
                </span>
                <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  Aktivní v produkci
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-mono flex items-center gap-1.5">
                <span>Zdrojový soubor pravidel:</span>
                <code className="text-cyan-300 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-800/40">
                  {filePath}
                </code>
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-cyan-500/10 bg-[#080e18] flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('rules')}
              className={`py-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'rules'
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Přehled klinických pravidel & Guardrails</span>
            </button>

            <button
              onClick={() => setActiveTab('editor')}
              className={`py-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'editor'
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>Editor instrukcí Markdown</span>
              {isDirty && (
                <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.9)]" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {saveStatus === 'success' && (
              <span className="text-xs font-semibold text-cyan-400 flex items-center gap-1 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" />
                Uloženo do souboru!
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-xs font-semibold text-rose-400 flex items-center gap-1 animate-in fade-in">
                <AlertCircle className="w-4 h-4" />
                Chyba při ukládání!
              </span>
            )}
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
              <p className="text-xs font-mono">Načítám instrukce z {filePath}...</p>
            </div>
          ) : activeTab === 'rules' ? (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-slate-300 leading-relaxed">
                <span className="font-bold text-white">Účel agenta:</span> Tento systémový agent vyhodnocuje 
                vstupní profil běžce z dotazníku a aplikuje striktní biomechanická a ortopedická pravidla. 
                Pravidla jsou čtena přímo z markdown souboru <code className="text-cyan-300">agents/shoe-recommender-agent.md</code>.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Rule Card 1 */}
                <div className="p-3.5 rounded-xl bg-[#0b1424] border border-cyan-500/20 space-y-1.5">
                  <div className="flex items-center justify-between text-white font-bold">
                    <span className="flex items-center gap-1.5 text-cyan-300">
                      <span>🏷️ Brand Governance (Striktní pravidlo)</span>
                    </span>
                    <span className="text-[10px] font-mono text-rose-400 bg-rose-950/80 px-1.5 py-0.5 rounded">Zákaz porušení</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Agent <strong>NIKDY</strong> nenabídne značku uvedenou v <code className="text-rose-300 font-mono">forbidden_brands</code> (např. Nike), i kdyby byla klinicky vhodná. Prioritizuje <code className="text-cyan-300 font-mono">preferred_brands</code>.
                  </p>
                </div>

                {/* Rule Card 2 */}
                <div className="p-3.5 rounded-xl bg-[#0b1424] border border-cyan-500/20 space-y-1.5">
                  <div className="flex items-center justify-between text-white font-bold">
                    <span className="flex items-center gap-1.5 text-cyan-300">
                      <span>📏 Anatomická šířka (2E / 4E)</span>
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-1.5 py-0.5 rounded">2E Certifikace</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    U širokého chodidla agent odmítá standardní šířku D. Doporučuje pouze modely postavené na autentickém širokém kopytě 2E k prevenci útlaku metatarzů a Mortonovy neuralgie.
                  </p>
                </div>

                {/* Rule Card 3 */}
                <div className="p-3.5 rounded-xl bg-[#0b1424] border border-cyan-500/20 space-y-1.5">
                  <div className="flex items-center justify-between text-white font-bold">
                    <span className="flex items-center gap-1.5 text-cyan-300">
                      <span>🦵 Ochrana kolene (Artróza 1–3 st.)</span>
                    </span>
                    <span className="text-[10px] font-mono text-teal-300 bg-teal-950/80 px-1.5 py-0.5 rounded">Drop 4–8 mm</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Limit dropu striktně mezi <strong>4 mm a 8 mm</strong>. Vysoký drop 10–12 mm je zakázán (přetěžuje kolenní extenzory). Povinná rockerová kolébková geometrie podešve.
                  </p>
                </div>

                {/* Rule Card 4 */}
                <div className="p-3.5 rounded-xl bg-[#0b1424] border border-cyan-500/20 space-y-1.5">
                  <div className="flex items-center justify-between text-white font-bold">
                    <span className="flex items-center gap-1.5 text-cyan-300">
                      <span>🦶 Došlap a mechanika (Supinace)</span>
                    </span>
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded">Neutrální platforma</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Při supinaci (nášlap na vnější hranu) je <strong>zakázán pronační klínek</strong> a tvrdé vnitřní výztuhy. Vyžadována stabilní neutrální platforma s vysokým tlumením.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400 text-xs">
                  Chcete upravit text instrukcí, přidat nová pravidla nebo změnit parametry agenta?
                </span>
                <button
                  onClick={() => setActiveTab('editor')}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Otevřít Markdown editor
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 h-full flex flex-col">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Editujete soubor: <code className="text-cyan-300">{filePath}</code></span>
                {isDirty && (
                  <span className="text-amber-400 font-mono text-[11px] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Neuložené změny
                  </span>
                )}
              </div>

              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={18}
                className="w-full flex-1 p-4 rounded-xl bg-[#060c16] border border-cyan-500/30 text-cyan-100 font-mono text-xs leading-relaxed outline-none focus:border-cyan-400 transition-colors resize-none selection:bg-cyan-500 selection:text-black"
                placeholder="Obsah instrukcí agenta v Markdown..."
              />
            </div>
          )}
        </div>

        {/* Footer with Actions */}
        <div className="p-4 sm:p-5 border-t border-cyan-500/20 bg-[#0c1626]/90 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={loadAgentDefinition}
              disabled={isLoading}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Obnovit původní obsah ze souboru"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Obnovit</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Zavřít
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !isDirty}
              className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
                isDirty
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Ukládám do souboru...' : 'Uložit pravidla agenta'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
