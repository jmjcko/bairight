with open('src/app/page.tsx', 'r') as f:
    lines = f.readlines()

# 1. Ensure AgentMessageRenderer import is present
if 'AgentMessageRenderer' not in ''.join(lines[:30]):
    lines.insert(1, "import { AgentMessageRenderer } from '@/components/AgentMessageRenderer';\n")

# 2. Add isEn after line 89 (useI18n)
for i, line in enumerate(lines[:120]):
    if 'const { t, locale } = useI18n();' in line:
        if 'const isEn =' not in lines[i+1]:
            lines.insert(i+1, "  const isEn = locale === 'en';\n")
        break

# 3. Replace sidebar blocks around line 530
start_idx = -1
end_idx = -1
for i, line in enumerate(lines):
    if '{/* Subscription & Model Status Badge */}' in line:
        start_idx = i
        break

if start_idx != -1:
    for j in range(start_idx, len(lines)):
        if '/* Right: Conversational Stream' in lines[j] or '<main className=' in lines[j]:
            end_idx = j
            break

print(f"Sidebar start: {start_idx}, end: {end_idx}")

if start_idx != -1 and end_idx != -1:
    new_sidebar = [
        "            {/* Unified System Context & Status Panel */}\n",
        "            <div className=\"p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/90 space-y-3 shadow-md\">\n",
        "              <span className=\"text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400 block border-b border-slate-800/80 pb-1.5\">\n",
        "                {isEn ? 'System & Context Status' : 'Stav systému a kontextu'}\n",
        "              </span>\n",
        "\n",
        "              {/* Model Connection Status */}\n",
        "              <div className=\"flex items-start justify-between gap-2\">\n",
        "                <div className=\"space-y-0.5\">\n",
        "                  <span className={`text-[11px] font-mono font-bold flex items-center gap-1.5 ${\n",
        "                    hasActiveSubscription ? 'text-emerald-300' : 'text-amber-300'\n",
        "                  }`}>\n",
        "                    {hasActiveSubscription ? (\n",
        "                      <>\n",
        "                        <Zap className=\"w-3.5 h-3.5 text-emerald-400\" />\n",
        "                        <span>{isEn ? 'Model Connected' : 'Model propojen'}</span>\n",
        "                      </>\n",
        "                    ) : (\n",
        "                      <>\n",
        "                        <Lock className=\"w-3.5 h-3.5 text-amber-400\" />\n",
        "                        <span>{isEn ? 'Model Disconnected' : 'Model nepropojen'}</span>\n",
        "                      </>\n",
        "                    )}\n",
        "                  </span>\n",
        "                  <p className=\"text-[10px] text-slate-400 leading-tight\">\n",
        "                    {hasActiveSubscription\n",
        "                      ? (isEn ? `Active: ${activeProvider.name}` : `Aktivní: ${activeProvider.name}`)\n",
        "                      : (isEn ? 'BYOK Model Required' : 'Vyžadován model (BYOK)')}\n",
        "                  </p>\n",
        "                </div>\n",
        "                <button\n",
        "                  onClick={() => setIsSubscriptionModalOpen(true)}\n",
        "                  className={`text-[10px] font-mono hover:underline cursor-pointer shrink-0 mt-0.5 ${\n",
        "                    hasActiveSubscription ? 'text-emerald-400' : 'text-amber-400'\n",
        "                  }`}\n",
        "                >\n",
        "                  {hasActiveSubscription ? (isEn ? 'Settings' : 'Nastavení') : (isEn ? 'Connect' : 'Propojit')}\n",
        "                </button>\n",
        "              </div>\n",
        "\n",
        "              {/* RAG Memory Status */}\n",
        "              <div className=\"flex items-start justify-between gap-2 pt-2 border-t border-slate-800/60\">\n",
        "                <div className=\"space-y-0.5\">\n",
        "                  <span className=\"text-[11px] font-mono text-cyan-300 font-bold flex items-center gap-1.5\">\n",
        "                    <Database className=\"w-3.5 h-3.5 text-cyan-400\" />\n",
        "                    <span>{isEn ? 'RAG Memory' : 'RAG paměť'}</span>\n",
        "                  </span>\n",
        "                  <p className=\"text-[10px] text-slate-400 leading-tight\">\n",
        "                    {isEn ? <>Injected <strong>{activeFactsCount}</strong> preference facts</> : <>Zapojeno <strong>{activeFactsCount}</strong> preferenčních faktů</>}\n",
        "                  </p>\n",
        "                </div>\n",
        "                <button\n",
        "                  onClick={() => setIsMemoryModalOpen(true)}\n",
        "                  className=\"text-[10px] font-mono text-cyan-400 hover:underline cursor-pointer shrink-0 mt-0.5\"\n",
        "                >\n",
        "                  {isEn ? 'Manage' : 'Spravovat'}\n",
        "                </button>\n",
        "              </div>\n",
        "\n",
        "              {/* Selection Wizard Action */}\n",
        "              <div className=\"pt-2 border-t border-slate-800/60\">\n",
        "                <button\n",
        "                  onClick={() => {\n",
        "                    setWizardMode(selectedAgent ? 'active_agent' : 'launcher');\n",
        "                    setActiveTab('wizard');\n",
        "                  }}\n",
        "                  className=\"w-full py-2 px-3 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm\"\n",
        "                >\n",
        "                  <Compass className=\"w-3.5 h-3.5 text-cyan-400\" />\n",
        "                  <span>{isEn ? 'Open Selection Wizard' : 'Otevřít průvodce výběrem'}</span>\n",
        "                </button>\n",
        "              </div>\n",
        "            </div>\n",
        "\n"
    ]
    lines[start_idx:end_idx] = new_sidebar

# 4. Replace message renderer block in main stream
msg_start = -1
msg_end = -1
for i, line in enumerate(lines):
    if '<div className="prose prose-invert prose-sm max-w-none space-y-3">' in line and 'msg.content.split' in lines[i+1]:
        msg_start = i
        break

if msg_start != -1:
    for j in range(msg_start, len(lines)):
        if '</div>' in lines[j]:
            msg_end = j
            break

print(f"Message renderer start: {msg_start}, end: {msg_end}")

if msg_start != -1 and msg_end != -1:
    new_msg_block = [
        "                          {!isUser ? (\n",
        "                            <AgentMessageRenderer content={msg.content} isEn={isEn} />\n",
        "                          ) : (\n",
        "                            <div className=\"prose prose-invert prose-sm max-w-none space-y-3\">\n",
        "                              {msg.content.split('\\\\n\\\\n').map((paragraph, idx) => (\n",
        "                                <p key={idx} className=\"whitespace-pre-line\">{paragraph}</p>\n",
        "                              ))}\n",
        "                            </div>\n",
        "                          )}\n"
    ]
    lines[msg_start:msg_end+1] = new_msg_block

with open('src/app/page.tsx', 'w') as f:
    f.writelines(lines)

print("Applied sidebar fix and AgentMessageRenderer successfully!")
