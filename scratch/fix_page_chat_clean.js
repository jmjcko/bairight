const fs = require("fs");

let pageCode = fs.readFileSync("src/app/page.tsx", "utf8");

// Update handleSendMessage payload
const oldFetchCall = `    try {
      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId || 'default-session',
          message,
          agent: selectedAgent,
          history: [...messages, userMessage].slice(-8),
          ragFacts: userFacts.filter((f) => f.isEnriched),
          providerId: activeProviderId,
          apiKey: apiKeys[activeProviderId],
        }),
      });`;

const newFetchCall = `    try {
      const activeAssessment = selectedAgent
        ? assessments.find((a) => a.missionId === selectedAgent.id) || assessments[0]
        : assessments[0];

      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId || 'default-session',
          message,
          agent: selectedAgent,
          history: [...messages, userMessage].slice(-8),
          ragFacts: userFacts.filter((f) => f.isEnriched),
          assessmentContext: activeAssessment || null,
          providerId: activeProviderId,
          apiKey: apiKeys[activeProviderId],
        }),
      });`;

if (pageCode.includes(oldFetchCall)) {
  pageCode = pageCode.replace(oldFetchCall, newFetchCall);
  console.log("Updated handleSendMessage cleanly");
}

// Pass handleOpenChatWithAgent to DynamicAgentWizard
const oldWizardProps = `onOpenChat={() => setActiveTab('chat')}`;
const newWizardProps = `onOpenChat={() => handleOpenChatWithAgent(selectedAgent)}`;

if (pageCode.includes(oldWizardProps)) {
  pageCode = pageCode.replace(oldWizardProps, newWizardProps);
  console.log("Updated DynamicAgentWizard onOpenChat prop");
}

// Add handleOpenChatWithAgent implementation before JSX return
const oldHeaderComment = `{/* Header / Navbar navigation */}`;
const handleOpenChatCode = `  const handleOpenChatWithAgent = (agentToUse?: UniversalAgentDefinition | null) => {
    const targetAgent = agentToUse || selectedAgent;
    setActiveTab('chat');
    if (targetAgent) {
      setSelectedAgent(targetAgent);
      const matchingAssessment = assessments.find((a) => a.missionId === targetAgent.id) || assessments[0];
      if (matchingAssessment && messages.length <= 1) {
        const paramsSummary = Object.entries(matchingAssessment.keyParameters || {})
          .map(([k, v]) => \`- **\${k}:** \${typeof v === 'object' ? (v.preferred ? \`Preferuji "\${v.preferred}"\` + (v.forbidden ? \`, zakázáno "\${v.forbidden}"\` : '') : JSON.stringify(v)) : v}\`)
          .join('\\n');
        const recsSummary = (matchingAssessment.recommendedModels || [])
          .map((m, i) => \`\${i + 1}. **\${m.brand} \${m.model}** (\${m.badge}) – \${m.rationale}\`)
          .join('\\n');

        const initialGreeting: AgentChatMessage = {
          id: \`asst-init-\${Date.now()}\`,
          role: 'assistant',
          content: \`### \${targetAgent.icon || '🤖'} \${targetAgent.name} – Profil z průvodce načten

Dobrý den! Na základě vašeho dokončeného průvodce nákupem mám k dispozici vaše vyklikaná kritéria:

\${paramsSummary || '- Všechny biometrické a ergonomické parametry nastaveny.'}

**Doporučené modely z vašeho profilu:**
\${recsSummary || '- Modely vygenerované dle vašich preferencí.'}

Všechna vaše kritéria mám načtena v paměti. Jaký konkrétní detail či model chceme společně probrat?\`,
          timestamp: new Date().toISOString(),
        };
        setMessages([initialGreeting]);
      }
    }
  };

  {/* Header / Navbar navigation */}`;

if (!pageCode.includes("const handleOpenChatWithAgent") && pageCode.includes(oldHeaderComment)) {
  pageCode = pageCode.replace(oldHeaderComment, handleOpenChatCode);
  console.log("Added handleOpenChatWithAgent to page.tsx");
}

fs.writeFileSync("src/app/page.tsx", pageCode);
