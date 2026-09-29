const fs = require("fs");

// 1. Update src/app/api/agent/chat/route.ts
let routeCode = fs.readFileSync("src/app/api/agent/chat/route.ts", "utf8");

// Interface update
routeCode = routeCode.replace(
  "ragFacts?: Array<{ id?: string; label?: string; value?: string; fact?: string; category?: string }>;",
  "ragFacts?: Array<{ id?: string; label?: string; value?: string; fact?: string; category?: string }>;\n  assessmentContext?: any | null;"
);

// Destructuring update
routeCode = routeCode.replace(
  "const { sessionId, message, agent, history = [], ragFacts = [], providerId, apiKey } = body;",
  "const { sessionId, message, agent, history = [], ragFacts = [], assessmentContext, providerId, apiKey } = body;"
);

// Pass assessmentContext to executeConversationalLLM call
routeCode = routeCode.replace(
  "ragFacts,\n          providerId,",
  "ragFacts,\n          assessmentContext,\n          providerId,"
);

// Pass assessmentContext to synthesizeConversationalFallback call
routeCode = routeCode.replace(
  "history,\n        ragFacts,\n      });",
  "history,\n        ragFacts,\n        assessmentContext,\n      });"
);

// Function params for executeConversationalLLM
routeCode = routeCode.replace(
  "ragFacts: Array<{ id?: string; label?: string; value?: string; fact?: string; category?: string }>;\n  providerId?: string;",
  "ragFacts: Array<{ id?: string; label?: string; value?: string; fact?: string; category?: string }>;\n  assessmentContext?: any | null;\n  providerId?: string;"
);

routeCode = routeCode.replace(
  "const { message, agent, history, ragFacts, providerId, apiKey } = params;",
  "const { message, agent, history, ragFacts, assessmentContext, providerId, apiKey } = params;"
);

// Function params for synthesizeConversationalFallback
routeCode = routeCode.replace(
  "ragFacts: Array<{ id?: string; label?: string; value?: string; fact?: string; category?: string }>;\n}): string {",
  "ragFacts: Array<{ id?: string; label?: string; value?: string; fact?: string; category?: string }>;\n  assessmentContext?: any | null;\n}): string {"
);

routeCode = routeCode.replace(
  "const { message, agent, ragFacts } = params;",
  "const { message, agent, ragFacts, assessmentContext } = params;"
);

// Inject assessmentContext block into systemPrompt inside executeConversationalLLM
const oldSystemPromptDef = `  const systemPrompt = \`
Jsi \${agentTitle} (\${agentRole}) specializovaný na kategorii "\${agentCategory}".
\${agentDirective}

### ZNÁMÁ DATA UŽIVATELE Z RAG PAMĚTI:
\${formattedFacts || 'Žádná předchozí data zatím nejsou evidována.'}`;

const newSystemPromptDef = `  let assessmentPromptBlock = '';
  if (assessmentContext) {
    const paramsText = Object.entries(assessmentContext.keyParameters || {})
      .map(([k, v]) => \`- **\${k}:** \${typeof v === 'object' ? JSON.stringify(v) : v}\`)
      .join('\\n');
    const recsText = (assessmentContext.recommendedModels || [])
      .map((m: any) => \`- **\${m.brand} \${m.model}** (\${m.badge}): \${m.rationale}\`)
      .join('\\n');

    assessmentPromptBlock = \`
### 📋 UŽIVATEL JIŽ DOKONČIL STRUKTUROVANÝ PRŮVODCE NÁKUPEM A MÁ TENTO NÁKUPNÍ PROFIL:
- **Kategorie / Agent:** \${assessmentContext.missionName || agentTitle}
- **Diagnostický souhrn:** \${assessmentContext.diagnosisSummary || 'Nákupní profil vygenerován'}

**Vyklikané parametry a odpovědi z průvodce:**
\${paramsText || 'Parametry zadané v dotazníku.'}

**Doporučené modely z profilu:**
\${recsText || 'Žádné konkrétní modely z dotazníku.'}

\${assessmentContext.completedPrompt ? \`**Kompletní vygenerovaný prompt:**\\n\${assessmentContext.completedPrompt}\` : ''}

STRIKTNÍ KRITICKÁ INSTRUKCE:
Uživatel už tento průvodce nákupem dokončil! Všechna jeho kritéria a naměřené rozměry MÁŠ K DISPOZICI VÝŠE.
NIKDY se uživatele nesmíš ptát, aby znova zadával kritéria, znova psal rozpočet nebo znova přecházel do průvodce!
Přímo mu odpovídej na jeho dotaz, analyzuj doporučené modely a buď jeho nezávislým nákupním expertem na míru jeho hodnotám výše!\`;
  }

  const systemPrompt = \`
Jsi \${agentTitle} (\${agentRole}) specializovaný na kategorii "\${agentCategory}".
\${agentDirective}
\${assessmentPromptBlock}

### ZNÁMÁ DATA UŽIVATELE Z RAG PAMĚTI:
\${formattedFacts || 'Žádná předchozí data zatím nejsou evidována.'}`;

if (routeCode.includes(oldSystemPromptDef)) {
  routeCode = routeCode.replace(oldSystemPromptDef, newSystemPromptDef);
  console.log("Injected assessmentPromptBlock into systemPrompt in chat route.ts");
}

// Inject fallback block for assessmentContext in synthesizeConversationalFallback
const oldFallbackHeader = `  // 1. User asked for 10 parameters`;
const newFallbackHeader = `  if (assessmentContext) {
    const paramsSummary = Object.entries(assessmentContext.keyParameters || {})
      .map(([k, v]) => \`- **\${k}:** \${typeof v === 'object' ? (v.preferred ? \`Preferuji "\${v.preferred}"\` + (v.forbidden ? \`, zakázáno "\${v.forbidden}"\` : '') : JSON.stringify(v)) : v}\`)
      .join('\\n');
    const recsSummary = (assessmentContext.recommendedModels || [])
      .map((m: any, i: number) => \`\${i + 1}. **\${m.brand} \${m.model}** (\${m.badge}) – \${m.rationale}\`)
      .join('\\n');

    return \`### \${agentTitle} – Nákupní profil z průvodce

Rozumím vašemu dotazu: **„\${message}“**.

Mám k dispozici vaše kompletní nákupní preference z průvodce nákupem pro **\${assessmentContext.missionName || agentTitle}**:

\${paramsSummary || '- Všechna biometrická a ergonomická kritéria nastavena.'}

**Top doporučení z vašeho profilu:**
\${recsSummary || '- Modely připravené dle vašich parametrů.'}

Rád s vámi rozeberu konkrétní detaily těchto modelů, pomohu s výběrem obchodů nebo ověřím dostupnost. O co přesně máte zájem?\`;
  }

  // 1. User asked for 10 parameters`;

if (routeCode.includes(oldFallbackHeader) && !routeCode.includes("if (assessmentContext)")) {
  routeCode = routeCode.replace(oldFallbackHeader, newFallbackHeader);
  console.log("Injected assessmentContext fallback handling in chat route.ts");
}

fs.writeFileSync("src/app/api/agent/chat/route.ts", routeCode);

