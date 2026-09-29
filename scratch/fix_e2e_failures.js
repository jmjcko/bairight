const fs = require("fs");

// 1. Update forgeAgentPrompt in src/lib/agent/universal-agent-schema.ts to resolve chip option labels
const fileSchema = "src/lib/agent/universal-agent-schema.ts";
let schemaContent = fs.readFileSync(fileSchema, "utf8");

const oldOptionsHandling = `      if (typeof val === 'object' && val !== null && !Array.isArray(val) && ('preferred' in val || 'forbidden' in val)) {
        const pref = Array.isArray(val.preferred) ? val.preferred.join(', ') : (typeof val.preferred === 'string' ? val.preferred.trim() : '');
        const forb = Array.isArray(val.forbidden) ? val.forbidden.join(', ') : (typeof val.forbidden === 'string' ? val.forbidden.trim() : '');
        const prefText = pref 
          ? (isEn ? \`Preferred Brands: [\${pref}]\` : \`Preferované značky: [\${pref}]\`) 
          : (isEn ? 'No brand restrictions (Open selection)' : 'Bez omezení značek (otevřený výběr)');
        const forbText = forb 
          ? (isEn ? \`Strictly Forbidden Brands (NEVER recommend): [\${forb}]\` : \`Striktně zakázané značky (NIKDY nedoporučovat): [\${forb}]\`) 
          : (isEn ? 'No forbidden brands' : 'Žádné zakázané značky');
        formattedVal = \`\${prefText}; \${forbText}\`;
      } else if (Array.isArray(val)) {
        formattedVal = val.length > 0 ? val.join(', ') : (isEn ? 'No specific choice' : 'Žádná specifická volba');
      }`;

const newOptionsHandling = `      if (typeof val === 'object' && val !== null && !Array.isArray(val) && ('preferred' in val || 'forbidden' in val)) {
        const pref = Array.isArray(val.preferred) ? val.preferred.join(', ') : (typeof val.preferred === 'string' ? val.preferred.trim() : '');
        const forb = Array.isArray(val.forbidden) ? val.forbidden.join(', ') : (typeof val.forbidden === 'string' ? val.forbidden.trim() : '');
        const prefText = pref 
          ? (isEn ? \`Preferred Brands: [\${pref}]\` : \`Preferované značky: [\${pref}]\`) 
          : (isEn ? 'No brand restrictions (Open selection)' : 'Bez omezení značek (otevřený výběr)');
        const forbText = forb 
          ? (isEn ? \`Strictly Forbidden Brands (NEVER recommend): [\${forb}]\` : \`Striktně zakázané značky (NIKDY nedoporučovat): [\${forb}]\`) 
          : (isEn ? 'No forbidden brands' : 'Žádné zakázané značky');
        formattedVal = \`\${prefText}; \${forbText}\`;
      } else if (typeof val === 'string' && q.options) {
        const matchedOpt = q.options.find((o) => o.value === val);
        if (matchedOpt && matchedOpt.label) {
          formattedVal = matchedOpt.label;
        } else {
          formattedVal = val.replace(/_/g, ' ');
        }
      } else if (Array.isArray(val)) {
        if (q.options) {
          const labels = val.map((v) => {
            const opt = q.options?.find((o) => o.value === v);
            return opt?.label || String(v).replace(/_/g, ' ');
          });
          formattedVal = labels.length > 0 ? labels.join(', ') : (isEn ? 'No specific choice' : 'Žádná specifická volba');
        } else {
          formattedVal = val.length > 0 ? val.map((v) => String(v).replace(/_/g, ' ')).join(', ') : (isEn ? 'No specific choice' : 'Žádná specifická volba');
        }
      }`;

schemaContent = schemaContent.replace(oldOptionsHandling, newOptionsHandling);
fs.writeFileSync(fileSchema, schemaContent, "utf8");
console.log("Updated forgeAgentPrompt option label resolution in universal-agent-schema.ts");

// 2. Update step 5 BYOK handling in src/app/api/agent/chat/route.ts
const fileRoute = "src/app/api/agent/chat/route.ts";
let routeContent = fs.readFileSync(fileRoute, "utf8");

const oldStep5 = `    // 5. If no user BYOK key is connected, return clear BYOK notice
    if (!effectiveKey) {
      assistantContent = \`### Vyžadováno Připojení Vlastního AI Modelu (BYOK)

Pro živou konverzaci s nákupním agentem **\${agent?.name || "bAIright Agent"}** je vyžadováno připojení vašeho vlastního AI modelu (Google Gemini, OpenAI GPT-4o nebo Anthropic Claude).

**Jak začít (100% zdarma):**
1. Klikněte na tlačítko **Připojit API klíč (BYOK)** v záhlaví aplikace.
2. Vyberte **Google Gemini** a získejte bezplatný klíč z [Google AI Studio](https://aistudio.google.com/app/apikey) za 30 sekund.
3. Vložte klíč a konverzujte pod svým účtem bez omezení!\`;
    } else if (!assistantContent) {`;

const newStep5 = `    // 5. If no user BYOK key is connected, synthesized assessment context if present or return clear BYOK notice
    if (!effectiveKey && assessmentContext && (assessmentContext.recommendedModels || assessmentContext.completedPrompt)) {
      assistantContent = synthesizeConversationalFallback({
        message,
        agent,
        history,
        ragFacts,
        assessmentContext,
        locale,
      });
    } else if (!effectiveKey) {
      assistantContent = locale === 'en'
        ? \`### Custom AI Model Required (BYOK)

To start a live interactive discussion with shopping agent **\${agent?.name || "bAIright Agent"}**, please connect your own AI model (Google Gemini, OpenAI GPT-4o, or Anthropic Claude).

**How to connect (100% Free):**
1. Click **Connect API Key (BYOK)** in the top app header.
2. Select **Google Gemini** and get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey) in 30 seconds.
3. Paste your key to enjoy unlimited private discussions!\`
        : \`### Vyžadováno Připojení Vlastního AI Modelu (BYOK)

Pro živou konverzaci s nákupním agentem **\${agent?.name || "bAIright Agent"}** je vyžadováno připojení vašeho vlastního AI modelu (Google Gemini, OpenAI GPT-4o nebo Anthropic Claude).

**Jak začít (100% zdarma):**
1. Klikněte na tlačítko **Připojit API klíč (BYOK)** v záhlaví aplikace.
2. Vyberte **Google Gemini** a získejte bezplatný klíč z [Google AI Studio](https://aistudio.google.com/app/apikey) za 30 sekund.
3. Vložte klíč a konverzujte pod svým účtem bez omezení!\`;
    } else if (!assistantContent) {`;

routeContent = routeContent.replace(oldStep5, newStep5);
fs.writeFileSync(fileRoute, routeContent, "utf8");
console.log("Updated BYOK notice step 5 in route.ts");
