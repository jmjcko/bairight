const fs = require("fs");

let code = fs.readFileSync("src/app/api/agent/chat/route.ts", "utf8");

const extractFactsHelper = `
function extractShoppingFactsFromMessage(message: string): Array<{ id: string; label: string; value: string; category: 'preference' | 'biometrics' | 'history' | 'medical' }> {
  const extracted: Array<{ id: string; label: string; value: string; category: 'preference' | 'biometrics' | 'history' | 'medical' }> = [];
  const msgLower = message.toLowerCase();

  // Budget detection (e.g. "rozpočet do 35 000", "strop 40000", "max 25000 czk")
  const budgetMatch = msgLower.match(/(?:rozpo[cč]et|strop|maxim[aá]ln[eě]|do|max\.?)\\s*(?:je\\s*)?([0-9\\s.]+)\\s*(?:k[cč]|czk|eur|€)?/i);
  if (budgetMatch && budgetMatch[1]) {
    const rawNum = budgetMatch[1].replace(/[\\s.]+/g, '');
    if (rawNum.length >= 3 && !isNaN(Number(rawNum))) {
      extracted.push({
        id: "fact-auto-" + Date.now() + "-budget",
        label: "Rozpočet / Strop",
        value: "Strop do " + Number(rawNum).toLocaleString('cs-CZ') + " Kč",
        category: "preference",
      });
    }
  }

  // Forbidden brand detection
  const forbiddenMatch = msgLower.match(/(?:nechci|vylou[cč]it|zak[aá]zat|nesn[aá][sš][ií]m|bez)\\s+([a-z0-9\\s]{2,20})/i);
  if (forbiddenMatch && forbiddenMatch[1]) {
    const brandName = forbiddenMatch[1].trim();
    if (brandName.length >= 3) {
      extracted.push({
        id: "fact-auto-" + Date.now() + "-brand-forb",
        label: "Vyloučená značka",
        value: "Zakázáno: " + brandName,
        category: "preference",
      });
    }
  }

  // Preferred brand detection
  const preferredMatch = msgLower.match(/(?:preferuji|chci|m[aá]m r[aá]d|obl[ií]ben[aá])\\s+([a-z0-9\s]{2,20})/i);
  if (preferredMatch && preferredMatch[1]) {
    const brandName = preferredMatch[1].trim();
    if (brandName.length >= 3) {
      extracted.push({
        id: "fact-auto-" + Date.now() + "-brand-pref",
        label: "Preferovaná značka",
        value: "Preferuji: " + brandName,
        category: "preference",
      });
    }
  }

  return extracted;
}
`;

if (!code.includes("extractShoppingFactsFromMessage")) {
  code = code.replace("function classifyDomain", extractFactsHelper + "\nfunction classifyDomain");
}

const oldReturnObj = `return NextResponse.json({
      message: assistantMsg,
      updatedProfile,
      isReady: true,
      missingFields: [],
    });`;

const newReturnObj = `const domain = classifyDomain(agent, message);
    const relevantFacts = filterDomainRagFacts(ragFacts, domain);
    const newExtractedFacts = extractShoppingFactsFromMessage(message);

    assistantMsg.ragMetadata = {
      factsCount: relevantFacts.length,
      injectedFacts: relevantFacts,
      assessmentName: assessmentContext?.missionName || agent?.name,
      assessmentSummary: assessmentContext?.diagnosisSummary,
      keyParameters: assessmentContext?.keyParameters,
    };

    return NextResponse.json({
      message: assistantMsg,
      updatedProfile,
      newExtractedFacts,
      injectedFacts: relevantFacts,
      isReady: true,
      missingFields: [],
    });`;

if (code.includes(oldReturnObj)) {
  code = code.replace(oldReturnObj, newReturnObj);
  console.log("Updated POST handler return object with RAG metadata & newExtractedFacts");
}

fs.writeFileSync("src/app/api/agent/chat/route.ts", code);
