const fs = require("fs");

let code = fs.readFileSync("src/components/DynamicAgentWizard.tsx", "utf8");

// Remove ⏭️ from skip button
code = code.replace("⏭️ Není důležité / Nevím (Přeskočit tento parametr)", "Není důležité / Nevím (Přeskočit tento parametr)");

// Replace fallback emoji icon with clean Bot icon or Target icon
code = code.replace("{agent.icon || '🎯'}", '<Bot className="w-5 h-5 text-cyan-400" />');
code = code.replace("{agent.icon || '🎯'}", '<Bot className="w-5 h-5 text-cyan-400" />');

// Remove other emojis
code = code.replace(/✅\s*/g, '');
code = code.replace(/❌\s*/g, '');

fs.writeFileSync("src/components/DynamicAgentWizard.tsx", code);
console.log("Cleaned emojis in DynamicAgentWizard.tsx");
