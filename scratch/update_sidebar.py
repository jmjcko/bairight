import re

with open('src/app/page.tsx', 'r') as f:
    content = f.read()

# 1. Ensure AgentMessageRenderer import is present at top
if 'AgentMessageRenderer' not in content:
    content = "import { AgentMessageRenderer } from '@/components/AgentMessageRenderer';\n" + content

# 2. Update message renderer block if not already updated
old_message_renderer = '''<div className="prose prose-invert prose-sm max-w-none space-y-3">
                            {msg.content.split('\\n\\n').map((paragraph, idx) => {
                              if (paragraph.startsWith('### ')) {
                                return <h3 key={idx} className="text-base font-bold text-white mt-2 mb-1">{paragraph.replace('### ', '')}</h3>;
                              }
                              if (paragraph.startsWith('> ')) {
                                return (
                                  <blockquote key={idx} className="p-3 my-2 border-l-4 border-cyan-500 bg-cyan-950/30 rounded text-cyan-200 text-xs">
                                    {paragraph.replace('> ', '')}
                                  </blockquote>
                                );
                              }
                              return <p key={idx} className="whitespace-pre-line">{paragraph}</p>;
                            })}
                          </div>'''

new_message_renderer = '''{!isUser ? (
                            <AgentMessageRenderer content={msg.content} isEn={isEn} />
                          ) : (
                            <div className="prose prose-invert prose-sm max-w-none space-y-3">
                              {msg.content.split('\\n\\n').map((paragraph, idx) => (
                                <p key={idx} className="whitespace-pre-line">{paragraph}</p>
                              ))}
                            </div>
                          )}'''

if old_message_renderer in content:
    content = content.replace(old_message_renderer, new_message_renderer)

# 3. Streamline sidebar panel
sidebar_pattern = r'\{\/\* Subscription & Model Status Badge \*\/\}[\s\S]*?\{\/\* Quick Agent Actions \*\/\}[\s\S]*?<\/button>\s*<\/div>'

new_sidebar_panel = '''{/* Unified System Context & Status Panel */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/90 space-y-3 shadow-md">
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400 block border-b border-slate-800/80 pb-1.5">
                {isEn ? 'System & Context Status' : 'Stav systému a kontextu'}
              </span>

              {/* Model Connection Status */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <span className={`text-[11px] font-mono font-bold flex items-center gap-1.5 ${
                    hasActiveSubscription ? 'text-emerald-300' : 'text-amber-300'
                  }`}>
                    {hasActiveSubscription ? (
                      <>
                        <Zap className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{isEn ? 'Model Connected' : 'Model propojen'}</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        <span>{isEn ? 'Model Disconnected' : 'Model nepropojen'}</span>
                      </>
                    )}
                  </span>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    {hasActiveSubscription
                      ? (isEn ? `Active: ${activeProvider.name}` : `Aktivní: ${activeProvider.name}`)
                      : (isEn ? 'BYOK Model Required' : 'Vyžadován model (BYOK)')}
                  </p>
                </div>
                <button
                  onClick={() => setIsSubscriptionModalOpen(true)}
                  className={`text-[10px] font-mono hover:underline cursor-pointer shrink-0 mt-0.5 ${
                    hasActiveSubscription ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {hasActiveSubscription ? (isEn ? 'Settings' : 'Nastavení') : (isEn ? 'Connect' : 'Propojit')}
                </button>
              </div>

              {/* RAG Memory Status */}
              <div className="flex items-start justify-between gap-2 pt-2 border-t border-slate-800/60">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-mono text-cyan-300 font-bold flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{isEn ? 'RAG Memory' : 'RAG paměť'}</span>
                  </span>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    {isEn ? <>Injected <strong>{activeFactsCount}</strong> preference facts</> : <>Zapojeno <strong>{activeFactsCount}</strong> preferenčních faktů</>}
                  </p>
                </div>
                <button
                  onClick={() => setIsMemoryModalOpen(true)}
                  className="text-[10px] font-mono text-cyan-400 hover:underline cursor-pointer shrink-0 mt-0.5"
                >
                  {isEn ? 'Manage' : 'Spravovat'}
                </button>
              </div>

              {/* Selection Wizard Action */}
              <div className="pt-2 border-t border-slate-800/60">
                <button
                  onClick={handleOpenShoppingWizardTab}
                  className="w-full py-2 px-3 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                >
                  <Compass className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{isEn ? 'Open Selection Wizard' : 'Otevřít průvodce výběrem'}</span>
                </button>
              </div>
            </div>'''

content, count = re.subn(sidebar_pattern, new_sidebar_panel, content)
print(f"Substituted sidebar count: {count}")

with open('src/app/page.tsx', 'w') as f:
    f.write(content)

print("Finished updating src/app/page.tsx")
