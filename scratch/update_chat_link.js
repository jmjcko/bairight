const fs = require("fs");

// 1. Update src/components/DynamicAgentWizard.tsx
let wizardCode = fs.readFileSync("src/components/DynamicAgentWizard.tsx", "utf8");

if (!wizardCode.includes("MessageSquare")) {
  wizardCode = wizardCode.replace("SlidersHorizontal,", "SlidersHorizontal,\n  MessageSquare,");
}

if (!wizardCode.includes("onOpenChat?: () => void;")) {
  wizardCode = wizardCode.replace(
    "onBackToLauncher?: () => void;",
    "onBackToLauncher?: () => void;\n  onOpenChat?: () => void;"
  );
  wizardCode = wizardCode.replace(
    "onBackToLauncher,\n  activeProviderId,",
    "onBackToLauncher,\n  onOpenChat,\n  activeProviderId,"
  );
}

const targetBackToLauncher = `{/* Back to Launcher */}`;
const chatButtonSnippet = `{/* Direct Chat with AI Model (BYOK Active) */}
            {onOpenChat && (
              <button
                type="button"
                onClick={onOpenChat}
                className="flex flex-col items-start p-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-teal-500/20 to-slate-900 border-2 border-cyan-400/80 hover:border-cyan-300 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:scale-[1.02] transition-all cursor-pointer group"
                title={locale === 'en' ? "Open live consultative chat with this agent" : "Spustit přímou interaktivní konzultaci s tímto agentem"}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <span className="text-xs font-mono font-extrabold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-cyan-300 group-hover:scale-110 transition-transform" />
                    {locale === 'en' ? 'Live Discussion' : 'Živá diskuse'}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-900/80 border border-cyan-400/50 text-cyan-200 font-bold">
                    {locale === 'en' ? 'BYOK Connected' : 'Model připojen'}
                  </span>
                </div>
                <span className="text-sm font-extrabold text-white">{locale === 'en' ? 'Open Chat & Agent Results' : 'Spustit chat & Výsledky agenta'}</span>
                <span className="text-[11px] text-slate-300 mt-0.5">{locale === 'en' ? 'Direct consultative discussion with AI model' : 'Přímá interaktivní diskuse s vaším AI modelem'}</span>
              </button>
            )}

            {/* Back to Launcher */}`;

if (!wizardCode.includes("Spustit chat & Výsledky agenta") && wizardCode.includes(targetBackToLauncher)) {
  wizardCode = wizardCode.replace(targetBackToLauncher, chatButtonSnippet);
  console.log("Added chat button snippet to DynamicAgentWizard.tsx");
}

fs.writeFileSync("src/components/DynamicAgentWizard.tsx", wizardCode);

// 2. Update src/app/page.tsx
let pageCode = fs.readFileSync("src/app/page.tsx", "utf8");

if (!pageCode.includes("onOpenChat={() => setActiveTab('chat')}")) {
  pageCode = pageCode.replace(
    "onBackToLauncher={() => setWizardMode('launcher')}",
    "onBackToLauncher={() => setWizardMode('launcher')}\n              onOpenChat={() => setActiveTab('chat')}"
  );
  fs.writeFileSync("src/app/page.tsx", pageCode);
  console.log("Updated src/app/page.tsx with onOpenChat");
}
