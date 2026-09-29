import { ModelDiscoveryService } from "@/lib/agent/model-discovery-service";
import { NextRequest, NextResponse } from 'next/server';
import { ProfileStorageManager } from '@/lib/storage/profile-storage';
import { extractBiomechanicalProfileUpdates } from '@/lib/agent/state-machine';
import { AgentChatMessage } from '@/lib/agent/types';
import { UniversalAgentDefinition, resolveAgentIcon } from '@/lib/agent/universal-agent-schema';

interface ChatRequestBody {
  sessionId: string;
  message: string;
  agent?: UniversalAgentDefinition | null;
  history?: AgentChatMessage[];
  ragFacts?: Array<{ id?: string; label?: string; value?: string; fact?: string; category?: string }>;
  assessmentContext?: any | null;
  providerId?: string;
  locale?: string;
  apiKey?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequestBody = await req.json();
    const { sessionId, message, agent, history = [], ragFacts = [], assessmentContext, providerId, apiKey, locale = "cs" } = body;

    if (!sessionId || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Missing required parameters: sessionId and message' },
        { status: 400 }
      );
    }

    // 1. Update biomechanical profile if user mentioned any biometric data in text
    const currentProfile = ProfileStorageManager.getProfile(sessionId);
    const { updatedProfile } = extractBiomechanicalProfileUpdates(message, currentProfile);
    ProfileStorageManager.updateProfile(sessionId, updatedProfile);

    // 2. Persist user message to session history
    const userMsg: AgentChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    ProfileStorageManager.addMessage(sessionId, userMsg);

    // 3. Resolve API key for Live LLM (BYOK or environment)
    const effectiveKey = apiKey || (
      providerId === 'google_gemini' ? process.env.GOOGLE_GEMINI_API_KEY :
      providerId === 'openai_gpt4o' ? process.env.OPENAI_API_KEY :
      providerId === 'anthropic_claude' ? process.env.ANTHROPIC_API_KEY :
      process.env.GOOGLE_GEMINI_API_KEY || process.env.OPENAI_API_KEY
    );

    let assistantContent = '';

    // 4. If key available, attempt Live LLM generation with conversational persona
    if (effectiveKey) {
      try {
        assistantContent = await executeConversationalLLM({
          message,
          agent,
          history,
          ragFacts,
          assessmentContext,
          providerId,
          apiKey: effectiveKey,
          locale,
        });
      } catch (llmErr) {
        console.warn('Live LLM conversation call failed, falling back to conversational synthesizer:', llmErr);
      }
    }

    const msgLower = (message || "").toLowerCase().trim();
    const isAskingRecommendations = 
      msgLower.includes("top 3") || 
      msgLower.includes("top3") ||
      msgLower.includes("doporučení") ||
      msgLower.includes("doporuč mi 3") || 
      msgLower.includes("doporuč 3") || 
      msgLower.includes("navrhni 3") || 
      msgLower.includes("recommendations") || 
      msgLower.includes("konkrétní produkt") ||
      msgLower.includes("specific product") ||
      msgLower.includes("nejlepší produkty") ||
      msgLower.includes("based on all parameters") ||
      msgLower.includes("na základě všech zadaných parametrů");

    const rawAgentPrompt = agent?.systemPrompt || "";
    const isCompiledPrompt = rawAgentPrompt.includes("MANDATORY & BINDING USER REQUIREMENTS") 
      || rawAgentPrompt.includes("STRIKTNÍ A ZÁVAZNÉ POŽADAVKY UŽIVATELE")
      || rawAgentPrompt.includes("REQUIRED RESPONSE FORMAT")
      || rawAgentPrompt.includes("POŽADOVANÝ FORMÁT ODPOVĚDI");

    // 5. If no user BYOK key is connected, synthesized assessment context if present or return clear BYOK notice
    if (!effectiveKey && (assessmentContext || isAskingRecommendations || isCompiledPrompt)) {
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
        ? `### Custom AI Model Required (BYOK)

To start a live interactive discussion with shopping agent **${agent?.name || "bAIright Agent"}**, please connect your own AI model (Google Gemini, OpenAI GPT-4o, or Anthropic Claude).

**How to connect (100% Free):**
1. Click **Connect API Key (BYOK)** in the top app header.
2. Select **Google Gemini** and get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey) in 30 seconds.
3. Paste your key to enjoy unlimited private discussions!`
        : `### Vyžadováno Připojení Vlastního AI Modelu (BYOK)

Pro živou konverzaci s nákupním agentem **${agent?.name || "bAIright Agent"}** je vyžadováno připojení vašeho vlastního AI modelu (Google Gemini, OpenAI GPT-4o nebo Anthropic Claude).

**Jak začít (100% zdarma):**
1. Klikněte na tlačítko **Připojit API klíč (BYOK)** v záhlaví aplikace.
2. Vyberte **Google Gemini** a získejte bezplatný klíč z [Google AI Studio](https://aistudio.google.com/app/apikey) za 30 sekund.
3. Vložte klíč a konverzujte pod svým účtem bez omezení!`;
    } else if (!assistantContent) {
      assistantContent = synthesizeConversationalFallback({
        message,
        agent,
        history,
        ragFacts,
        assessmentContext,
        locale,
      });
    }

    // 6. Save assistant message and return
    const assistantMsg: AgentChatMessage = {
      id: `asst-${Date.now()}`,
      role: 'assistant',
      content: assistantContent,
      timestamp: new Date().toISOString(),
    };
    ProfileStorageManager.addMessage(sessionId, assistantMsg);

    const domain = classifyDomain(agent, message);
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
    });
  } catch (error) {
    console.error('Agent chat error:', error);
    return NextResponse.json(
      { error: 'Internal server error processing agent consultation' },
      { status: 500 }
    );
  }
}


function extractShoppingFactsFromMessage(message: string): Array<{ id: string; label: string; value: string; category: 'preference' | 'biometrics' | 'history' | 'medical' }> {
  const extracted: Array<{ id: string; label: string; value: string; category: 'preference' | 'biometrics' | 'history' | 'medical' }> = [];
  const msgLower = message.toLowerCase();

  // Budget detection (e.g. "rozpočet do 35 000", "strop 40000", "max 25000 czk")
  const budgetMatch = msgLower.match(/(?:rozpo[cč]et|strop|maxim[aá]ln[eě]|do|max.?)\s*(?:je\s*)?([0-9\s.]+)\s*(?:k[cč]|czk|eur|€)?/i);
  if (budgetMatch && budgetMatch[1]) {
    const rawNum = budgetMatch[1].replace(/[\s.]+/g, '');
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
  const forbiddenMatch = msgLower.match(/(?:nechci|vylou[cč]it|zak[aá]zat|nesn[aá][sš][ií]m|bez)\s+([a-z0-9\s]{2,20})/i);
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
  const preferredMatch = msgLower.match(/(?:preferuji|chci|m[aá]m r[aá]d|obl[ií]ben[aá])\s+([a-z0-9s]{2,20})/i);
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

function classifyDomain(agent?: UniversalAgentDefinition | null, message?: string) {
  const normMsg = (message || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const agentId = (agent?.id || '').toLowerCase();
  const agentCat = (agent?.category || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const agentName = (agent?.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const isCoffee = 
    agentId.includes('coffee') || 
    agentCat.includes('kav') || 
    agentCat.includes('coffee') || 
    agentCat.includes('appliance') ||
    agentName.includes('kav') || 
    agentName.includes('espresso') ||
    normMsg.includes('kavov') || 
    normMsg.includes('espresso') || 
    normMsg.includes('kava') || 
    normMsg.includes('kavy');

  const isCar = 
    agentId.includes('car') || 
    agentCat.includes('auto') || 
    agentCat.includes('car') || 
    agentName.includes('auto') || 
    agentName.includes('vuz') || 
    agentName.includes('vozidl') ||
    normMsg.includes('auto') || 
    normMsg.includes('vuz') || 
    normMsg.includes('vozidl') || 
    normMsg.includes('suv') || 
    normMsg.includes('kombi');

  const isChair = 
    agentId.includes('chair') || 
    agentId.includes('seat') || 
    agentCat.includes('zidl') || 
    agentCat.includes('ergo') || 
    agentCat.includes('spine') || 
    agentName.includes('zidl') || 
    agentName.includes('sezeni') ||
    normMsg.includes('zidl') || 
    normMsg.includes('sezeni') || 
    normMsg.includes('kancelar');

  const isFootwear = 
    (!isCoffee && !isCar && !isChair && !agent) ||
    agentId.includes('shoe') || 
    agentId.includes('footwear') || 
    agentId.includes('running') || 
    agentCat.includes('obuv') || 
    agentCat.includes('bot') || 
    agentCat.includes('footwear') || 
    agentName.includes('obuv') || 
    agentName.includes('bot') || 
    agentName.includes('podiatr') ||
    normMsg.includes('bot') || 
    normMsg.includes('obuv') || 
    normMsg.includes('tenisk') || 
    normMsg.includes('bezeck');

  return { isCoffee, isCar, isChair, isFootwear, normMsg };
}

function filterDomainRagFacts(
  facts: Array<{ id?: string; label?: string; value?: string; fact?: string; category?: string }>,
  domain: { isCoffee: boolean; isCar: boolean; isChair: boolean; isFootwear: boolean }
) {
  if (!facts || facts.length === 0) return [];
  
  return facts.filter((f) => {
    const text = `${f.label || ''} ${f.value || f.fact || ''}`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const isShoeBiometrics = 
      text.includes('kopyto') || 
      text.includes('chodidl') || 
      text.includes('doslap') || 
      text.includes('toe-box') || 
      text.includes('toebox') || 
      text.includes('2e') || 
      text.includes('supin') || 
      text.includes('pronac') || 
      text.includes('artroz') || 
      text.includes('kolen') || 
      text.includes('obuv');

    // If active category is NOT footwear, strictly discard shoe biomechanics
    if (!domain.isFootwear && isShoeBiometrics) {
      return false;
    }

    // If active category is coffee or car, discard seating spine ergonomics unless relevant
    const isSpineErgo = text.includes('beder') || text.includes('pater') || text.includes('sezeni');
    if ((domain.isCoffee || domain.isCar) && isSpineErgo) {
      return false;
    }

    return true;
  });
}

/**
 * Executes a conversational multi-turn call to real LLMs (Gemini, OpenAI, Claude)
 */
async function executeConversationalLLM(params: {
  message: string;
  agent?: UniversalAgentDefinition | null;
  history: AgentChatMessage[];
  ragFacts: Array<{ id?: string; label?: string; value?: string; fact?: string; category?: string }>;
  assessmentContext?: any | null;
  providerId?: string;
  apiKey: string;
  locale?: string;
}): Promise<string> {
  const { message, agent, history, ragFacts, assessmentContext, providerId, apiKey, locale = "cs" } = params;

  const domain = classifyDomain(agent, message);
  const relevantFacts = filterDomainRagFacts(ragFacts, domain);

  // Build system prompt
  const agentTitle = agent?.name || 'Všeobecný nákupní rádce bAIright';
  const agentRole = agent?.description || 'Nezávislý nákupní konzultant a expert na produkty';
  const agentCategory = agent?.category || (
    domain.isCoffee ? 'Kávovary a domácí espresso' :
    domain.isCar ? 'Automobily a rodinné vozy' :
    domain.isChair ? 'Ergonomické sezení a židle' :
    'Sportovní obuv a spotřební produkty'
  );
  // Detect if agent.systemPrompt is already a full compiled prompt (from wizard)
  // vs. a simple base directive. Compiled prompts contain the parameter block marker.
  const rawAgentSystemPrompt = agent?.systemPrompt || '';
  const isCompiledPrompt = rawAgentSystemPrompt.includes('MANDATORY & BINDING USER REQUIREMENTS') 
    || rawAgentSystemPrompt.includes('STRIKTNÍ A ZÁVAZNÉ POŽADAVKY UŽIVATELE')
    || rawAgentSystemPrompt.includes('REQUIRED RESPONSE FORMAT')
    || rawAgentSystemPrompt.includes('POŽADOVANÝ FORMÁT ODPOVĚDI');
  const agentDirective = rawAgentSystemPrompt || 'Pomáhej uživateli vybrat nejvhodnější produkty na základě technických a ergonomických parametrů.';

  const formattedFacts = relevantFacts
    .map((f) => `- [${f.category || 'profil'}] ${f.label ? f.label + ': ' : ''}${f.value || f.fact}`)
    .join('\n');

  const isEn = locale === 'en';

  let assessmentPromptBlock = '';
  if (assessmentContext) {
    // Resolve raw answer IDs to human-readable labels using agent question definitions
    const paramsText = Object.entries(assessmentContext.keyParameters || {})
      .map(([k, v]) => {
        const question = agent?.questions?.find((q: any) => q.id === k);
        const label = question?.title || k.replace(/_/g, ' ');
        let displayVal = v;
        if (typeof v === 'string' && question?.options) {
          const opt = question.options.find((o: any) => o.value === v);
          if (opt?.label) displayVal = opt.label;
          else displayVal = String(v).replace(/_/g, ' ');
        } else if (Array.isArray(v) && question?.options) {
          displayVal = v.map((item: any) => {
            const opt = question.options?.find((o: any) => o.value === item);
            return opt?.label || String(item).replace(/_/g, ' ');
          }).join(', ');
        } else if (typeof v === 'object' && v !== null && ('preferred' in v || 'forbidden' in v)) {
          const brandObj = v as { preferred?: string[]; forbidden?: string[] };
          const pref = Array.isArray(brandObj.preferred) ? brandObj.preferred.join(', ') : (brandObj.preferred || '');
          const forb = Array.isArray(brandObj.forbidden) ? brandObj.forbidden.join(', ') : (brandObj.forbidden || '');
          displayVal = pref ? `Preferred: [${pref}]` : 'Open selection';
          if (forb) displayVal += `; Forbidden: [${forb}]`;
        } else if (question?.sliderConfig) {
          displayVal = `${v} ${question.sliderConfig.unit}`;
        }
        return `- **${label}:** ${displayVal}`;
      })
      .join('\n');
    const recsText = (assessmentContext.recommendedModels || [])
      .map((m: any) => `- **${m.brand} ${m.model}** (${m.badge}): ${m.rationale}`)
      .join('\n');

    assessmentPromptBlock = isEn ? `
### USER COMPLETED THE STRUCTURED PURCHASING WIZARD WITH THIS PROFILE:
- **Category / Agent:** ${assessmentContext.missionName || agentTitle}
- **Diagnostic Summary:** ${assessmentContext.diagnosisSummary || 'Purchasing profile generated'}

**Selected Parameters & Answers:**
${paramsText || 'Parameters specified in wizard.'}

**Recommended Models from Profile:**
${recsText || 'No specific models from wizard.'}

${assessmentContext.completedPrompt ? `**Full Compiled Prompt:**\n${assessmentContext.completedPrompt}` : ''}

CRITICAL MANDATORY INSTRUCTION:
The user has already completed this purchasing wizard! All their criteria and requirements are listed above.
NEVER ask the user to re-enter their criteria, budget, or restart the wizard!
Answer their query directly, analyze the recommended models, and serve as their independent shopping expert strictly adhering to the requirements above!`
    : `
### UŽIVATEL JIŽ DOKONČIL STRUKTUROVANÝ PRŮVODCE NÁKUPEM A MÁ TENTO NÁKUPNÍ PROFIL:
- **Kategorie / Agent:** ${assessmentContext.missionName || agentTitle}
- **Diagnostický souhrn:** ${assessmentContext.diagnosisSummary || 'Nákupní profil vygenerován'}

**Vyklikané parametry a odpovědi z průvodce:**
${paramsText || 'Parametry zadané v dotazníku.'}

**Doporučené modely z profilu:**
${recsText || 'Žádné konkrétní modely z dotazníku.'}

${assessmentContext.completedPrompt ? `**Kompletní vygenerovaný prompt:**\n${assessmentContext.completedPrompt}` : ''}

STRIKTNÍ KRITICKÁ INSTRUKCE:
Uživatel už tento průvodce nákupem dokončil! Všechna jeho kritéria a naměřené rozměry MÁŠ K DISPOZICI VÝŠE.
NIKDY se uživatele nesmíš ptát, aby znova zadával kritéria, znova psal rozpočet nebo znova přecházel do průvodce!
Přímo mu odpovídej na jeho dotaz, analyzuj doporučené modely a buď jeho nezávislým nákupním expertem na míru jeho hodnotám výše!`;
  }

  // When the system prompt is already a fully compiled prompt from the wizard,
  // use it directly to avoid triple-duplication of parameters and format instructions.
  // Only add RAG facts and the "don't re-ask" instruction.
  let systemPrompt: string;
  if (isCompiledPrompt) {
    // The compiled prompt already contains: base persona, parameters, format, language directive.
    // We only add: RAG facts, assessment "don't re-ask" guard, and conversational rules.
    const ragBlock = formattedFacts 
      ? (isEn 
        ? `\n### USER KNOWLEDGE HISTORY & RAG FACTS:\n${formattedFacts}` 
        : `\n### ZNALOSTNÍ HISTORIE & RAG FAKTA UŽIVATELE:\n${formattedFacts}`)
      : '';
    const dontReaskBlock = assessmentContext 
      ? (isEn
        ? `\n\nCRITICAL MANDATORY INSTRUCTION:\nThe user has already completed the purchasing wizard. All criteria are in the instructions above. NEVER ask the user to re-enter criteria or restart the wizard! Answer directly and serve as their independent shopping expert.`
        : `\n\nSTRIKTNÍ KRITICKÁ INSTRUKCE:\nUživatel už tento průvodce nákupem dokončil! Všechna jeho kritéria MÁŠ K DISPOZICI VÝŠE. NIKDY se uživatele nesmíš ptát, aby znova zadával kritéria! Přímo mu odpovídej na jeho dotaz.`)
      : '';
    const conversationalRules = isEn
      ? `\n\n### CONVERSATIONAL RULES:\n1. ALWAYS respond directly to what the user wrote.\n2. If the user asks for a specific number of options, fulfill it strictly.\n3. Format ALL responses clearly in Markdown using headings (##, ###), bold text (**text**), and bullet points.\n4. When recommending products, ALWAYS use this exact structure for each item:\n### [number]. [Brand Model Name] ([Match: X%])\n- **Why Recommended:** [rationale]\n- **Key Pros:**\n  - [pro 1]\n  - [pro 2]\n- **Trade-offs & Cons:**\n  - [con 1]\n5. For follow-up questions, keep the same structured Markdown format — never respond with plain unformatted text.`
      : `\n\n### PRAVIDLA PRO ODPOVĚDI:\n1. VŽDY reaguj přímo na to, co uživatel napsal.\n2. Pokud uživatel požádá o určitý počet kritérií, VŽDY mu vyhov.\n3. Formátuj VŠECHNY odpovědi přehledně v Markdownu s nadpisy (##, ###), tučným písmem (**text**) a odrážkami.\n4. Při doporučování produktů VŽDY dodržuj tuto přesnou strukturu pro každý produkt:\n### [číslo]. [Značka Model] (Shoda: X%)\n- **Proč doporučujeme:** [odůvodnění]\n- **Klíčové výhody:**\n  - [výhoda 1]\n  - [výhoda 2]\n- **Kompromisy a nevýhody:**\n  - [nevýhoda 1]\n5. Na doplňující otázky odpovídej ve stejném strukturovaném Markdown formátu — nikdy neodpovídej neformátovaným prostým textem.`;
    systemPrompt = `${agentDirective}${ragBlock}${dontReaskBlock}${conversationalRules}`.trim();
  } else {
    // Standard non-compiled prompt: build the full system instruction
    systemPrompt = isEn ? `
You are ${agentTitle} (${agentRole}) specializing in "${agentCategory}".
${agentDirective}
${assessmentPromptBlock}

### USER KNOWLEDGE HISTORY & RAG FACTS:
${formattedFacts || 'No prior user facts recorded.'}

### RESPONSE RULES & STRICT LANGUAGE DIRECTIVE:
1. CRITICAL LANGUAGE DIRECTIVE: Communicate and output ALL text, executive summaries, product names, rationale, pros & cons, trade-offs, and buying advice STRICTLY in fluent, natural English. Do NOT generate Czech sentences or paragraphs.
2. ALWAYS respond directly to what the user wrote. Never repeat mechanically.
3. If the user explicitly asks for a specific number of options or criteria, fulfill it strictly.
4. Format output clearly in Markdown using headings (###), bold text, and bullet points.
`.trim() : `
Jsi ${agentTitle} (${agentRole}) specializovaný na kategorii "${agentCategory}".
${agentDirective}
${assessmentPromptBlock}

### ZNÁMÁ DATA UŽIVATELE Z RAG PAMĚTI:
${formattedFacts || 'Žádná předchozí data zatím nejsou evidována.'}

### PRAVIDLA PRO ODPOVĚDI:
1. CRITICAL LANGUAGE DIRECTIVE: Veškerá doporučení, konkrétní přesné názvy produktových modelů (např. Lenovo Legion Slim 5 16AHR8), odůvodnění, výhody a reakce MUSÍŠ komunikovat a generovat striktně v přirozené češtině (Čeština).
2. VŽDY reaguj přímo na to, co uživatel napsal. Nikdy se mechanicky neopakuj.
3. Pokud uživatel výslovně požádá o určitý počet parametrů či kritérií, VŽDY mu vyhov a uveď přesně tolik strukturovaných bodů s vysvětlením.
4. Formátuj odpověď přehledně v Markdownu s použitím nadpisů (###), tučného písma a odrážek či číslovaných seznamů.
`.trim();
  }

  // Route by provider
  if (providerId === 'openai_gpt4o') {
    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-6).map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
      { role: 'user', content: message },
    ];

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: formattedMessages,
        temperature: 0.7,
      }),
    });

    if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`);
    const data = await res.json();
    return data?.choices?.[0]?.message?.content || '';
  }

  if (providerId === 'anthropic_claude') {
    const formattedMessages = [
      ...history.slice(-6).map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
      { role: 'user', content: message },
    ];

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        system: systemPrompt,
        messages: formattedMessages,
      }),
    });

    if (!res.ok) throw new Error(`Claude HTTP ${res.status}`);
    const data = await res.json();
    return data?.content?.[0]?.text || '';
  }

  // Dynamic, self-healing model resolution via ModelDiscoveryService with real-time failover
  const failoverRes = await ModelDiscoveryService.executeWithResilientFailover<string>({
    providerId: "google_gemini",
    apiKey,
    executeFn: async (model) => {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        
        const payloadContents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];
        let lastRole: "user" | "model" | null = null;

        let sanitizedHistory = history.slice(-6);
        while (sanitizedHistory.length > 0 && sanitizedHistory[0].role === "assistant") {
          sanitizedHistory = sanitizedHistory.slice(1);
        }

        for (const m of sanitizedHistory) {
          const geminiRole = m.role === "assistant" ? "model" : "user";
          if (geminiRole === lastRole && payloadContents.length > 0) {
            payloadContents[payloadContents.length - 1].parts[0].text += `\n\n${m.content}`;
          } else {
            payloadContents.push({
              role: geminiRole,
              parts: [{ text: m.content }],
            });
            lastRole = geminiRole;
          }
        }

        if (lastRole === "user" && payloadContents.length > 0) {
          payloadContents[payloadContents.length - 1].parts[0].text += `\n\n${message}`;
        } else {
          payloadContents.push({
            role: "user",
            parts: [{ text: message }],
          });
        }

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemPrompt }],
            },
            contents: payloadContents,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2048,
            },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return { success: true, data: text };
          return { success: false, status: 200, errorBody: "Empty candidate text" };
        } else {
          const errBody = await res.text();
          console.warn(`Gemini API ${model} HTTP ${res.status}:`, errBody);
          return { success: false, status: res.status, errorBody: errBody };
        }
      } catch (e: any) {
        console.warn(`Gemini model ${model} conversational call exception:`, e);
        return { success: false, error: e, errorBody: e?.message };
      }
    },
  });

  return failoverRes.result || "";
}

/**
 * Deterministic conversational synthesizer for offline / zero-key mode
 */
function synthesizeConversationalFallback(params: {
  message: string;
  agent?: UniversalAgentDefinition | null;
  history: AgentChatMessage[];
  ragFacts: Array<{ id?: string; label?: string; value?: string; fact?: string; category?: string }>;
  assessmentContext?: any | null;
  locale?: string;
}): string {
  const { message, agent, ragFacts, assessmentContext, locale = "cs" } = params;
  const isEn = locale === "en";
  const msgLower = message.toLowerCase().trim();
  const domain = classifyDomain(agent, message);
  const relevantFacts = filterDomainRagFacts(ragFacts, domain);

  // Check RAG memory highlights ONLY from domain-filtered facts
  const ragNotes: string[] = [];
  relevantFacts.forEach((f) => {
    const val = (f.value || f.fact || '').toLowerCase();
    const label = (f.label || '').toLowerCase();
    const combined = `${label} ${val}`;

    if (domain.isFootwear) {
      if (combined.includes('2e') || combined.includes('širok') || combined.includes('kopyto') || combined.includes('wide')) {
        ragNotes.push(isEn ? 'wide toe box (2E)' : 'širší kopyto (2E)');
      }
      if (combined.includes('artróz') || combined.includes('kolen') || combined.includes('knee') || combined.includes('arthr')) {
        ragNotes.push(isEn ? 'knee joint sensitivity' : 'artróza kolenního kloubu');
      }
      if (combined.includes('supin')) {
        ragNotes.push(isEn ? 'supination strike' : 'supinační došlap');
      }
    } else if (domain.isChair) {
      if (combined.includes('páteř') || combined.includes('zad') || combined.includes('beder') || combined.includes('spine') || combined.includes('back')) {
        ragNotes.push(isEn ? 'lumbar spine sensitivity' : 'citlivost bederní páteře');
      }
      if (combined.includes('sezení') || combined.includes('sitting')) {
        ragNotes.push(isEn ? 'prolonged sitting (8+ hours)' : 'dlouhodobé sezení');
      }
    } else if (domain.isCoffee) {
      if (combined.includes('servis') || combined.includes('záruk') || combined.includes('service') || combined.includes('warranty')) {
        ragNotes.push(isEn ? 'local warranty service' : 'dostupnost servisu v ČR');
      }
      if (combined.includes('cena') || combined.includes('výkon') || combined.includes('rozpočet') || combined.includes('budget')) {
        ragNotes.push(isEn ? 'optimal price-to-performance ratio' : 'poměr cena/výkon');
      }
    } else if (domain.isCar) {
      if (combined.includes('servis') || combined.includes('záruk') || combined.includes('service')) {
        ragNotes.push(isEn ? 'local service network' : 'servis v ČR');
      }
      if (combined.includes('rodin') || combined.includes('kufr') || combined.includes('family') || combined.includes('trunk')) {
        ragNotes.push(isEn ? 'family cargo capacity requirements' : 'rodinné prostorové nároky');
      }
    }
  });

  const ragContextSentence = ragNotes.length > 0 
    ? (isEn 
      ? `> **Factored in from your personal RAG profile:** ${ragNotes.join(', ')}.\n\n`
      : `> **Zohledněno z vašeho RAG profilu:** ${ragNotes.join(', ')}.\n\n`)
    : '';

  // 1. Check if user has assessmentContext with existing recommended models
  if (assessmentContext && assessmentContext.recommendedModels && assessmentContext.recommendedModels.length > 0) {
    const agentName = agent?.name || assessmentContext.missionName || (isEn ? 'bAIright Shopping Consultant' : 'bAIright Nákupní konzultant');
    const recs = assessmentContext.recommendedModels;
    const recsMarkdown = recs.map((m: any, idx: number) => {
      const brandModel = m.model ? `${m.brand || ''} ${m.model}`.trim() : (m.brand || `Model #${idx + 1}`);
      const rationale = m.rationale || m.reasoning || (isEn ? 'Matches your specified parameters.' : 'Odpovídá zadaným parametrům.');
      const badge = m.badge || (m.matchScore ? `${isEn ? 'Match' : 'Shoda'} ${m.matchScore}%` : '');
      const prosList = Array.isArray(m.pros) && m.pros.length > 0
        ? `\n- **${isEn ? 'Key Pros' : 'Klíčové výhody'}:**\n  - ` + m.pros.join('\n  - ')
        : '';
      const consList = Array.isArray(m.cons) && m.cons.length > 0
        ? `\n- **${isEn ? 'Trade-offs & Cons' : 'Kompromisy a nevýhody'}:**\n  - ` + m.cons.join('\n  - ')
        : '';
      return `### ${idx + 1}. ${brandModel} ${badge ? `(${badge})` : ''}\n- **${isEn ? 'Why Recommended' : 'Proč doporučujeme'}:** ${rationale}${prosList}${consList}`;
    }).join('\n\n');

    return isEn ? `# Expert Purchasing Recommendation: ${agentName}

## Executive Summary & Selection Rationale
${ragContextSentence}${assessmentContext.diagnosisSummary || 'Based on all parameters and rules in your completed wizard assessment, here are your top 3 tailored recommendations.'}

## Top 3 Recommended Models

${recsMarkdown}

## Important Buying Advice
Verify local retailer availability, sizing, and warranty options before making your final purchase.`
    : `# Expertní nákupní doporučení: ${agentName}

## Souhrnné hodnocení a strategie výběru
${ragContextSentence}${assessmentContext.diagnosisSummary || 'Na základě všech zadaných parametrů a pravidel v dokončeném průvodci nákupem vám předkládáme nejvhodnější modely.'}

## Top 3 Doporučené Modely

${recsMarkdown}

## Důležitá upozornění před nákupem
Před nákupem si doporučujeme ověřit dostupnost u českých prodejců, záruční podmínky a přesné rozměry.`;
  }

  // 2. Check if user is explicitly asking for top recommendations or sending wizard initialQuery
  const isAskingRecommendations = 
    msgLower.includes('top 3') || 
    msgLower.includes('top3') ||
    msgLower.includes('doporučení') ||
    msgLower.includes('doporuč mi 3') || 
    msgLower.includes('doporuč 3') || 
    msgLower.includes('navrhni 3') || 
    msgLower.includes('recommendations') || 
    msgLower.includes('konkrétní produkt') ||
    msgLower.includes('specific product') ||
    msgLower.includes('nejlepší produkty') ||
    msgLower.includes('based on all parameters') ||
    msgLower.includes('na základě všech zadaných parametrů');

  if (isAskingRecommendations) {
    const agentName = agent?.name || (isEn ? 'bAIright Shopping Consultant' : 'bAIright Nákupní poradce');

    if (domain.isFootwear) {
      return isEn ? `# Expert Purchasing Recommendation: ${agentName}

## Executive Summary & Selection Rationale
${ragContextSentence}Based on your biomechanical profile, intended running surface, and cushioning requirements, we evaluated top road-cushioned and joint-friendly running shoes. The models below prioritize high-impact shock attenuation, anatomical stability, and wide toe box clearance.

## Top 3 Recommended Models

### 1. Hoka Bondi 8 (Wide 2E) (Match: 97%)
- **Why Recommended:** Industry benchmark for maximum cushioning with an Early-Stage Meta-Rocker that minimizes knee flexion stress and impact shock.
- **Key Pros:**
  - Ultra-plush CMEVA midsole with maximum impact absorption
  - Certified wide 2E toe box and stable straight-last platform
- **Trade-offs & Cons:**
  - Slightly heavier chassis (307 g) designed for recovery and endurance rather than speed intervals

### 2. Brooks Ghost Max (Wide 2E) (Match: 94%)
- **Why Recommended:** Features a protective 6 mm drop to unload the patella, paired with a GlideRoll Rocker that naturally assists forward momentum.
- **Key Pros:**
  - High-stack DNA LOFT v2 foam with neutral lateral stability
  - Highly durable rubber outsole compound with excellent wet-road traction
- **Trade-offs & Cons:**
  - Firmer underfoot initial feel during the first 15-20 km break-in period

### 3. Saucony Echelon 9 (Wide 2E) (Match: 91%)
- **Why Recommended:** Purpose-built straight platform designed specifically to accommodate custom orthotic insoles and wide feet without inward rolling.
- **Key Pros:**
  - PWRRUN cushioning with roomy, friction-free toe box
  - Rigid external heel counter for confident rearfoot lockdown
- **Trade-offs & Cons:**
  - Understated visual styling

## Important Buying Advice
Ensure a thumb-width of clearance in front of your longest toe for downhill running expansion, and pair with moisture-wicking technical running socks.`
      : `# Expertní nákupní doporučení: ${agentName}

## Souhrnné hodnocení a strategie výběru
${ragContextSentence}Na základě vašich parametrů, biomechanického profilu a požadavků na tlumení jsme vyhodnotili aktuální nabídku silničních a objemových bot. Níže uvedené modely maximalizují ochranu kloubů, stabilitu došlapu a prostor v přední části chodidla.

## Top 3 Doporučené Modely

### 1. Hoka Bondi 8 (Wide 2E) (Shoda: 97%)
- **Proč doporučujeme:** Absolutní špička v maximálním tlumení s kolébkovou geometrií Early-Stage Meta-Rocker, která zásadně odlehčuje tlak na koleno a čéšku.
- **Klíčové výhody:**
  - Mimořádné tlumení mezipodešve CMEVA pro citlivé klouby
  - Certifikované široké kopyto 2E zabraňující otlakům prstů
- **Kompromisy a nevýhody:**
  - Vyšší hmotnost (307 g) předurčená pro regeneraci a polykání kilometrů, nikoli na rychlé sprinty

### 2. Brooks Ghost Max (Wide 2E) (Shoda: 94%)
- **Proč doporučujeme:** Nízký 6mm drop ulevuje kolenům a kolébka GlideRoll Rocker přirozeně odvaluje krok při každém dopadu.
- **Klíčové výhody:**
  - Prémiová tlumicí pěna DNA LOFT v2 s neutrální stabilitou
  - Vysoce odolná pryžová podešev s dlouhou životností na asfaltu
- **Kompromisy a nevýhody:**
  - Tužší pocit při prvních 20 km před plným prošlápnutím

### 3. Saucony Echelon 9 (Wide 2E) (Shoda: 91%)
- **Proč doporučujeme:** Rovná a široká základna speciálně vyvinutá pro ortopedické vložky a široké chodidlo bez mačkání malíkové hrany.
- **Klíčové výhody:**
  - Mimořádně prostorný toebox a komfortní pěna PWRRUN
  - Skvělá stabilizace patního lůžka
- **Kompromisy a nevýhody:**
  - Konzervativnější design svršku

## Důležitá doporučení před nákupem
Při výběru velikosti běžecké obuvi ponechte nadměrek na šířku palce (cca 1–1,5 cm) před prsty kvůli rozpínání nohy při zátěži.`;
    }

    if (domain.isCoffee) {
      return isEn ? `# Expert Purchasing Recommendation: ${agentName}

## Executive Summary & Selection Rationale
${ragContextSentence}Based on your daily coffee consumption, preference for espresso and milk specialties, and maintenance requirements, here are your top 3 recommended coffee machines.

## Top 3 Recommended Models

### 1. De'Longhi Magnifica S ECAM 22.110.B (Match: 96%)
- **Why Recommended:** The gold standard for price-to-performance, featuring a removable brew unit for effortless cleaning and durable conical steel burrs.
- **Key Pros:**
  - Exceptional espresso extraction with rich crema at an affordable price
  - Easy self-maintenance without expensive service visits
- **Trade-offs & Cons:**
  - Manual Panarello steam wand requires practice for silky microfoam

### 2. Sage Barista Express BES875 (Match: 93%)
- **Why Recommended:** High-performance semi-automatic portafilter machine with built-in grinder and PID temperature regulation for cafe-quality coffee at home.
- **Key Pros:**
  - Full barista control over grind coarseness, dose, and water temperature
  - Robust brushed stainless steel construction with pressure gauge
- **Trade-offs & Cons:**
  - Requires manual tamping and regular portafilter clean-up

### 3. Jura E8 Piano Black (Match: 90%)
- **Why Recommended:** Premium Swiss automated espresso machine with Pulse Extraction Process (P.E.P.) and one-touch fine foam milk technology.
- **Key Pros:**
  - Outstanding one-touch cappuccino and flat white quality
  - Intelligent Water System (I.W.S.) with automatic filter detection
- **Trade-offs & Cons:**
  - Higher initial cost and fixed brew group requiring branded cleaning tablets

## Important Buying Advice
Always use fresh whole coffee beans roasted within the last 2-8 weeks and filtered water to prevent rapid limescale buildup.`
      : `# Expertní nákupní doporučení: ${agentName}

## Souhrnné hodnocení a strategie výběru
${ragContextSentence}Na základě vámi zadaných preferencí pro přípravu kávy, nároků na údržbu a rozpočtu vám předkládáme 3 nejlepší kávovary na trhu.

## Top 3 Doporučené Modely

### 1. De'Longhi Magnifica S ECAM 22.110.B (Shoda: 96%)
- **Proč doporučujeme:** Dlouhodobě prověřený vítěz v poměru cena/výkon s vyjímatelnou spařovací jednotkou pro snadné mytí pod tekoucí vodou.
- **Klíčové výhody:**
  - Skvělá extrakce espressa s hustou cremou a ocelovými mlecími kameny
  - Nenáročná údržba bez nutnosti drahých servisních zásahů
- **Kompromisy a nevýhody:**
  - Manuální parní tryska vyžaduje trochu cviku při šlehání mléka

### 2. Sage Barista Express BES875 (Shoda: 93%)
- **Proč doporučujeme:** Poctivý pákový kávovar s integrovaným mlýnkem a elektronickou regulací teploty PID pro plnou kontrolu nad chutí kávy.
- **Klíčové výhody:**
  - Kavárenská kvalita espressa a masivní nerezové tělo
  - 15barové italské čerpadlo a profesionální parní tryska
- **Kompromisy a nevýhody:**
  - Vyžaduje manuální pěchování v páce a pravidelné čištění

### 3. Jura E8 Piano Black (Shoda: 90%)
- **Proč doporučujeme:** Špičkový švýcarský plnoautomat s pulzním extrakčním procesem (P.E.P.) a sametovou mléčnou mikropěnou na jeden stisk.
- **Klíčové výhody:**
  - Prvotřídní chuť espressa i cappuccina jediným stiskem tlačítka
  - Inteligentní vodní systém I.W.S. s automatickým rozpoznáním filtru
- **Kompromisy a nevýhody:**
  - Vyšší pořizovací cena a pevná spařovací jednotka

## Důležitá doporučení před nákupem
Doporučujeme používat zrnkovou kávu praženou před 2–8 týdny a filtrovanou vodu pro minimalizaci usazování vodního kamene.`;
    }

    if (domain.isChair) {
      return isEn ? `# Expert Purchasing Recommendation: ${agentName}

## Executive Summary & Selection Rationale
${ragContextSentence}Based on your desk sitting duration, spine comfort requirements, and ergonomic adjustments, here are the top 3 ergonomic chairs.

## Top 3 Recommended Models

### 1. Herman Miller Aeron Remastered (Match: 96%)
- **Why Recommended:** Benchmark ergonomic task chair with breathable 8Z Pellicle mesh and PostureFit SL sacral/lumbar support.
- **Key Pros:**
  - Zero heat buildup with pressure-distributing suspension mesh
  - Industry-leading 12-year 24/7 commercial warranty
- **Trade-offs & Cons:**
  - High initial investment and rigid outer plastic frame rim

### 2. Steelcase Gesture 3D (Match: 93%)
- **Why Recommended:** Engineered to support modern multi-device posture with 360-degree adjustable armrests and adaptive LiveBack contouring.
- **Key Pros:**
  - Best-in-class armrest adjustability relieving shoulder and neck strain
  - Contoured seat cushion preventing thigh numbness
- **Trade-offs & Cons:**
  - Substantial chair weight making transport across stairs heavier

### 3. Sedus se:do Pro Light (Match: 89%)
- **Why Recommended:** German-engineered synchronous chair with Similar mechanism and forward seat tilt at a highly accessible price point.
- **Key Pros:**
  - Official German AGR ergonomic certification
  - Excellent value for comprehensive daily 8-hour office use
- **Trade-offs & Cons:**
  - Slightly firmer seat foam cushion initially

## Important Buying Advice
Adjust your desk and seat height so your elbows and knees rest at approximately 90 to 100 degrees with your feet planted firmly on the floor.`
      : `# Expertní nákupní doporučení: ${agentName}

## Souhrnné hodnocení a strategie výběru
${ragContextSentence}Na základě délky vašeho sezení, podpory páteře a tělesných proporcí jsme vybrali 3 nejlépe hodnocené ergonomické židle.

## Top 3 Doporučené Modely

### 1. Herman Miller Aeron Remastered (Shoda: 96%)
- **Proč doporučujeme:** Celosvětový etalon ergonomie s patentovanou síťovinou Pellicle 8Z a zónovou podporou beder PostureFit SL.
- **Klíčové výhody:**
  - Dokonalá prodyšnost bez přehřívání a 12letá záruka i pro vícesměnný provoz
  - Špičková synchronní mechanika udržující páteř ve zdravém esovitém prohnutí
- **Kompromisy a nevýhody:**
  - Vysoká počáteční investice a pevný lem sedáku (nutno vybrat správnou velikost A/B/C)

### 2. Steelcase Gesture 3D (Shoda: 93%)
- **Proč doporučujeme:** Revoluční 360° područky a opěrák LiveBack navržený pro práci s počítačem i mobilními zařízeními bez strnulosti šíje.
- **Klíčové výhody:**
  - Nejlepší nastavitelnost područek na trhu pro uvolnění ramen
  - Měkký polstrovaný sedák zabraňující tlaku do stehen
- **Kompromisy a nevýhody:**
  - Těžší konstrukce při manipulaci

### 3. Sedus se:do Pro Light (Shoda: 89%)
- **Proč doporučujeme:** Německá ergonomická kvalita s certifikací AGR a synchronní mechanikou Similar za dostupnější cenu.
- **Klíčové výhody:**
  - Vynikající poměr cena/výkon pro celodenní 8hodinové sezení
  - Nastavitelný negativní sklon sedáku pro uvolnění kyčlí
- **Kompromisy a nevýhody:**
  - Základnější rozsah posuvu hloubky sedáku

## Důležitá doporučení před nákupem
Židli a stůl nastavte tak, aby úhel v loktech a kolenou svíral cca 90–100 stupňů a chodidla spočívala plnou plochou na zemi.`;
    }

    // Generic category recommendations
    return isEn ? `# Expert Purchasing Recommendation: ${agentName}

## Executive Summary & Selection Rationale
${ragContextSentence}Based on your specified criteria, budget preferences, and key priorities, here are your top 3 product options evaluated for performance and longevity.

## Top 3 Recommended Models

### 1. Market Benchmark Option (Match: 95%)
- **Why Recommended:** Demonstrates highest reliability and parameter compliance according to user feedback and long-term test consensus.
- **Key Pros:**
  - Verified durability and high customer satisfaction ratings
  - Optimal fulfillment of your core specified requirements
- **Trade-offs & Cons:**
  - Premium pricing reflecting high market demand

### 2. Balanced Value Benchmark (Match: 91%)
- **Why Recommended:** Delivers the sweet spot of price-to-performance without unnecessary features that inflate cost.
- **Key Pros:**
  - Excellent cost-benefit ratio
  - Straightforward maintenance and dependable manufacturer warranty
- **Trade-offs & Cons:**
  - May lack advanced secondary custom settings

### 3. Accessible Entry Alternative (Match: 87%)
- **Why Recommended:** Economic solution strictly satisfying all mandatory safety and primary functional baseline needs.
- **Key Pros:**
  - Friendly budget barrier with solid build quality
  - Quick availability through primary authorized retailers
- **Trade-offs & Cons:**
  - Shorter expected lifespan under intensive continuous load

## Important Buying Advice
Double-check authorized warranty terms and return windows before finalizing your order.`
    : `# Expertní nákupní doporučení: ${agentName}

## Souhrnné hodnocení a strategie výběru
${ragContextSentence}Na základě vámi zadaných kritérií, rozpočtových možností a klíčových priorit vám předkládáme 3 nejvhodnější produkty z dané kategorie.

## Top 3 Doporučené Modely

### 1. Prémiový etalon trhu (Shoda: 95%)
- **Proč doporučujeme:** Dosahuje nejvyšších hodnocení spolehlivosti a přesně naplňuje vaše primární parametry.
- **Klíčové výhody:**
  - Dlouhodobě ověřená spolehlivost a vysoká spokojenost zákazníků
  - Zpracování z prvotřídních materiálů
- **Kompromisy a nevýhody:**
  - Vyšší pořizovací cena odpovídající prémiové třídě

### 2. Zlatý střed – Nejlepší poměr cena/výkon (Shoda: 91%)
- **Proč doporučujeme:** Nabízí ideální vyváženost mezi pořizovacími náklady a potřebným výkonem.
- **Klíčové výhody:**
  - Skvělý poměr cena / užitná hodnota
  - Dostupný záruční servis a jednoduché používání
- **Kompromisy a nevýhody:**
  - Méně doplňkových funkcí oproti nejdražším modelům

### 3. Dostupná ověřená volba (Shoda: 87%)
- **Proč doporučujeme:** Cenově dostupná varianta, která spolehlivě pokrývá všechny základní povinné požadavky.
- **Klíčové výhody:**
  - Velmi příznivá cena při zachování standardní kvality
  - Rychlá dostupnost u většiny prodejců
- **Kompromisy a nevýhody:**
  - Kratší předpokládaná životnost při maximálním vytížení

## Důležitá doporučení před nákupem
Doporučujeme zkontrolovat dostupnost u autorizovaných distributorů a záruční podmínky.`;
  }

  // 3. User asked for 10 parameters
  const isAsking10 = 
    /(?:10|deset)\s*(?:parametr|krit[eé]r|bod|v[eě]c)|(?:chci|dej|uka[zž]|napi[sš])\s*(?:jich\s*)?10/i.test(msgLower) ||
    msgLower === '10' ||
    (msgLower.includes('10') && (msgLower.includes('parametr') || msgLower.includes('chci') || msgLower.includes('rekl')));

  if (isAsking10) {
    if (domain.isCoffee) {
      return isEn ? `### 10 Key Parameters for Choosing a Coffee Machine

${ragContextSentence}1. **Machine Type:** Fully automatic bean-to-cup vs. semi-automatic portafilter vs. premium capsule machine.
2. **Grinder Burrs Material & Geometry:** Conical steel burrs vs. ceramic flat burrs with fine grind adjustment steps.
3. **Pump Pressure & Temperature Stability:** 9–15 bar pressure, thermoblock heating vs. single/dual boiler for simultaneous steam.
4. **Milk System:** Automated OneTouch carafe with self-purge cleaning vs. commercial manual steam wand for microfoam latte art.
5. **Capacity & Daily Duty Cycle:** Water reservoir capacity (liters), bean hopper size (grams), and waste grounds container size.
6. **Cleaning & Maintenance Convenience:** Removable brewing group for tap rinsing vs. automatic chemical descaling cycles.
7. **User Profiles & Drink Customization:** Memory presets for bean dose, extraction time, volume, and brewing temperature.
8. **Acoustic Insulation:** Grinder motor and pump decibel dampening for quiet operation in residential or office environments.
9. **Build Quality & Housing:** Brushed stainless steel exterior vs. ABS thermoplastic frame and drip tray durability.
10. **Service Network & Parts Availability:** Readily available water filters, silicone gaskets, and authorized local repair service.`
      : `### 10 klíčových parametrů pro výběr kávovaru

${ragContextSentence}1. **Typ kávovaru:** Automatický s mlýnkem, pákový (manuální) nebo profesionální kapslový.
2. **Materiál a geometrie mlecích kamenů:** Ocelové vs. keramické mlecí kameny s jemným odstupňováním hrubosti.
3. **Tlak čerpadla a stabilita teploty:** 9–15 barů, termoblok vs. bojler (nebo duální bojler pro současnou páru).
4. **Mléčný systém:** OneTouch automatická karafa s proplachem vs. manuální parní tryska pro mikropěnu.
5. **Kapacita a zátěž:** Velikost zásobníku na vodu (litry), zrno (gramy) a odpadní nádobky na sedlinu.
6. **Jednoduchost čištění a údržby:** Vyjímatelná spařovací jednotka a automatické čisticí programy.
7. **Uživatelské profily a přizpůsobení:** Uložení receptur na míru (objem, teplota, gramáž dávky).
8. **Hlučnost mlýnku a čerpadla:** Zvuková izolace pro klidný provoz v kanceláři či domácnosti.
9. **Materiálové zpracování:** Nerezová ocel vs. plastové tělo, odolnost odkapávací mřížky.
10. **Servisní zázemí a dostupnost dílů:** Rychlost záručního i pozáručního servisu a dostupnost filtrů.`;
    }

    if (domain.isChair) {
      return isEn ? `### 10 Key Parameters for Ergonomic Seating

${ragContextSentence}1. **Seat Mechanism:** Synchronous tilt mechanism with dynamic body-weight counterpressure tension adjustment.
2. **Lumbar Support:** Height and depth adjustable anatomical lordosis support to maintain healthy spine curvature.
3. **Upholstery & Cushioning:** Self-supporting breathable suspension mesh vs. high-density molded cold foam.
4. **Armrest Adjustability (3D / 4D):** Height, width, depth, and angle adjustable armrests to relieve shoulder and neck strain.
5. **Seat Depth Adjustment:** Seat sliding mechanism preventing circulation constriction behind the knee popliteal fossa.
6. **Forward Seat Tilt:** Negative tilt option opening the pelvic angle to promote upright spinal posture during active typing.
7. **Piston & Weight Rating:** Certified weight capacity (e.g. 120–150 kg) and appropriate gas lift height range.
8. **Headrest:** Multi-adjustable cervical spine support for recline and relaxation intervals.
9. **Casters:** Soft polyurethane-coated casters for hard floors vs. hard nylon wheels for carpets.
10. **Warranty & Lifecycle:** Long-term durability backing (5 to 12 years warranty) with modular replacement parts.`
      : `### 10 klíčových parametrů pro ergonomické sezení

${ragContextSentence}1. **Mechanika sedáku:** Synchronní mechanika s nastavením protitlaku podle tělesné hmotnosti.
2. **Bederní opěrka:** Výškově i hloubkově stavitelná podpora lordózy páteře.
3. **Materiál sedáku a opěráku:** Samonosná prodyšná síťovina vs. studená tvarovaná pěna.
4. **Područky (3D / 4D):** Výškově, podélně i úhlově nastavitelné pro uvolnění šíje a ramen.
5. **Hloubka sedáku:** Posuv sedáku vpřed a vzad, aby netlačil do podkolenních jamek.
6. **Negativní sklon sedáku:** Možnost mírného náklonu vpřed pro otevření úhlu v kyčlích.
7. **Nosnost a píst:** Certifikovaná nosnost (např. 120–150 kg) a rozsah zdvihu.
8. **Hlavová opěrka:** Nastavitelná opora krční páteře při relaxaci.
9. **Kolečka podle podlahy:** Měkká pogumovaná pro tvrdé podlahy vs. tvrdá na koberce.
10. **Záruka a servis:** Dlouhodobá životnost (např. 5–10 let záruky) a dostupnost náhradních dílů.`;
    }

    if (domain.isCar) {
      return isEn ? `### 10 Key Parameters for Vehicle Selection

${ragContextSentence}1. **Powertrain & Engine:** Gasoline, diesel, full-hybrid (HEV), plug-in hybrid (PHEV), or all-electric (BEV).
2. **Cargo Trunk Capacity:** Usable luggage volume in liters, flat load floor, and rear seat folding versatility.
3. **Drivetrain:** Front-wheel/rear-wheel drive vs. intelligent all-wheel drive (AWD/4x4) for winter stability.
4. **Fuel Economy & Operating Costs:** Real-world combined consumption, maintenance service intervals, and insurance tiers.
5. **Active Safety Systems:** Adaptive cruise control, blind spot monitoring, lane keeping, and autonomous emergency braking.
6. **Transmission:** Precise manual gearbox vs. reliable torque-converter / dual-clutch automated transmission.
7. **Rear Seat Passenger Space:** Width for 3 child car seats (ISOFIX anchor points) and adult legroom.
8. **Ground Clearance:** Underbody clearance for unpaved country roads and curb parking without scraping.
9. **Infotainment & Connectivity:** Wireless Apple CarPlay and Android Auto integration with fast touchscreen response.
10. **Resale Value & Long-Term Reliability:** Secondary market depreciation curve and engine reliability track record.`
      : `### 10 klíčových parametrů pro výběr automobilu

${ragContextSentence}1. **Typ pohonu a motorizace:** Benzín, nafta, full-hybrid, plug-in hybrid nebo elektromobil (EV).
2. **Objem zavazadelníku (kufr):** Základní objem v litrech a tvar ložné plochy pro rodinné potřeby.
3. **Pohon náprav:** Pohon předních/zadních kol vs. inteligentní pohon 4x4.
4. **Spotřeba a provozní náklady:** Reálná kombinovaná spotřeba, cena servisu a pojištění.
5. **Bezpečnostní asistenty:** Adaptivní tempomat, hlídání mrtvého úhlu a systém nouzového brzdění.
6. **Převodovka:** Manuální vs. spolehlivá hydrodynamická / dvouspojková automatická převodovka.
7. **Prostor na zadních sedadlech:** Šířka pro 3 dětské autosedačky a prostor na nohy (ISOFIX).
8. **Světlá výška podvozku:** Schopnost zvládat polní cesty a obrubníky bez poškození podvozku.
9. **Infotainment a konektivita:** Bezdrátové Apple CarPlay a Android Auto pro plynulou navigaci.
10. **Zůstatková hodnota a spolehlivost:** Poptávka na trhu ojetin a dlouhodobá spolehlivost modelu.`;
    }

    // Default footwear 10 parameters
    return isEn ? `### 10 Key Parameters for Choosing Footwear

${ragContextSentence}Here is an expert breakdown of the 10 most critical parameters determining joint comfort, injury prevention, and durability:

1. **Toe Box Width (Width & Fit):** Standard D, wide 2E, or extra wide 4E. Prevents toe bunion compression and compensatory knee torque.
2. **Cushioning Level & Stack Height:** Midsole thickness and compound density (e.g. PEBA, supercritical EVA) for impact shock absorption.
3. **Heel-to-Toe Drop:** Height difference in millimeters between heel and forefoot. Lower drops (4–6 mm) ease knee strain; higher drops (8–12 mm) protect the Achilles tendon.
4. **Foot Strike & Arch Guidance:** Supination (underpronation), pronation guidance, or neutral gait platform.
5. **Rocker Sole Geometry:** Curved sole facilitating smooth natural roll-off without hyper-flexing toe and knee joints.
6. **Torsional Rigidity & Platform Width:** Sole stiffness in torsion for stable footing without ankle inversion.
7. **Shoe Weight vs. Runner Body Weight:** Calibrating midsole resilience to runner mass to prevent foam bottoming out.
8. **Tread Pattern & Outsole Traction:** Smooth carbon rubber for road pavement vs. multi-directional lugs for forest trails.
9. **Upper Lockdown & Heel Counter:** Seamless engineered mesh and secure heel counter preventing heel slip and blisters.
10. **Orthotic Insole Compatibility:** Footbed depth and removable factory insole allowing custom orthopedic inserts.`
    : `### 10 klíčových parametrů pro výběr obuvi

${ragContextSentence}Tady je přehled 10 nejdůležitějších parametrů, které při výběru bot rozhodují o pohodlí, ochraně kloubů a životnosti:

1. **Šířka kopyta (Toebox & Width):** Standardní D, široké 2E nebo extra široké 4E. Zabraňuje mačkání prstů a kompenzační rotaci v koleni.
2. **Úroveň a typ tlumení (Cushioning & Stack Height):** Výška a hustota mezipodešve (např. PEBA, supercritical pěny) pro absorpci rázů.
3. **Drop (sklon pata–špička):** Výškový rozdíl mezi patou a špičkou v mm. Nižší drop (4–6 mm) odlehčuje kolennímu kloubu, vyšší (8–12 mm) šetří Achillovu šlachu.
4. **Typ došlapu a podpora klenby:** Supinace (vnější hrana), pronace (vnitřní vtáčení) nebo neutrální vedení chodidla.
5. **Kolébková geometrie (Rocker Sole):** Zaoblená podešev usnadňující přirozené odvalení kroku bez nadměrného ohybu v kloubech.
6. **Torzní tuhost a stabilita základny:** Šířka platformy a stabilita v krutu pro jistý krok bez vyvracení kotníku.
7. **Hmotnost obuvi vs. tělesná hmotnost:** Kalibrace hustoty pěny podle váhy běžce, aby mezipodešev neprošlápla.
8. **Trakce a vzorek podešve:** Hladká odolná pryž pro asfalt vs. vícesměrný hluboký vzorek pro trail a lesní cesty.
9. **Svršek a fixace paty (Heel Counter):** Bezešvá prodyšná síťovina a pevné uzamčení paty proti vyzouvání a vzniku puchýřů.
10. **Kompatibilita s ortopedickými vložkami:** Hloubka lůžka a vyjímatelná stélka pro individuální ortopedické korekce.`;
  }

  // 4. Conversational domain consultation queries (e.g. "jak kavovar do firmy?")
  if (domain.isCoffee) {
    const isCompanyOrOffice = 
      domain.normMsg.includes('firm') || 
      domain.normMsg.includes('kancelar') || 
      domain.normMsg.includes('offic') || 
      domain.normMsg.includes('podnik') ||
      domain.normMsg.includes('tym');

    if (isCompanyOrOffice) {
      return isEn ? `### ${agent?.name || 'Office Coffee Machine Consultation'}

${ragContextSentence}Choosing a coffee machine for a company or office requires a different focus than for a home – essential factors are **daily duty cycle / capacity**, **easy maintenance**, and **intuitive operation** for multiple colleagues without clogging milk lines.

To give you an exact recommendation, please clarify these 4 key criteria:
1. **Daily capacity:** How many cups will be brewed daily? (up to 15 / 20–50 / 50+ cups per day)
2. **Water connection:** Refillable water reservoir (2.5–5L) or direct waterline plumbing?
3. **Milk specialties:** OneTouch automated cappuccino/latte with auto-purge, or primarily espresso and lungo?
4. **Budget & service:** Solution up to $1,000 / 25,000 CZK for small teams, or commercial machine ($1,500–$3,000) with 24h guaranteed service?

You can reply with your criteria, or ask for *"10 parameters"* for the full technical breakdown.`
      : `### ${agent?.name || 'Konzultace výběru kávovaru do firmy'}

${ragContextSentence}Výběr kávovaru do firmy či kanceláře vyžaduje jiný přístup než pro domácnost – zásadní je **denní vytížení**, **snadná údržba** a **intuitivní ovládání** pro více kolegů bez rizika ucpání mléčných cest.

Pro přesné doporučení mi pomozte upřesnit 4 klíčová kritéria:
1. **Denní kapacita:** Kolik káv se u vás odhadem denně připraví? (do 15 káv / 20–50 káv / 50+ káv denně)
2. **Připojení na vodu:** Preferujete doplňovací velkou nádržku (např. 2,5–5 litrů), nebo přímé napojení na vodovodní řad?
3. **Mléčné speciality:** Přejí si lidé OneTouch cappuccino/latte na jeden stisk s automatickým proplachem, nebo stačí primárně espresso a lungo?
4. **Rozpočet a servis:** Hledáte řešení do cca 25 000 Kč pro menší tým, nebo profesionální kancelářský automat (40–70 tis. Kč) s garantovaným servisem do 24 hodin?

Můžete mi napsat vaše parametry, nebo napsat *"chci 10 parametrů"* pro kompletní srovnávací kritéria.`;
    }

    return isEn ? `### ${agent?.name || 'Coffee Machine Consultation'}

${ragContextSentence}I am delighted to help you choose the ideal coffee machine tailored to your taste preferences and maintenance expectations.

To pinpoint the right match, please clarify:
- **Machine Type:** Fully automated bean-to-cup machine or precise manual portafilter espresso machine?
- **Milk Drinks:** Automatic milk carafe preparation or manual steam wand?
- **Location:** Home use (2–6 cups daily) or busy office/studio?
- **Budget:** What is your estimated price range?

Tell me your priorities, or ask for *"10 key parameters"* for a full technical overview!`
    : `### ${agent?.name || 'Konzultace výběru kávovaru'}

${ragContextSentence}Rád vám pomohu s nezávislým výběrem ideálního kávovaru přesně podle vašich chuťových preferencí a nároků na obsluhu.

Pro přesné zacílení mi prosím upřesněte:
- **Typ kávovaru:** Plně automatický s mlýnkem na zrnkovou kávu, nebo precizní manuální pákový stroj?
- **Mléčné nápoje:** Preferujete automatickou karafovou přípravu cappuccina/latte, nebo manuální parní trysku?
- **Místo určení:** Bude kávovar v domácnosti (cca 2–6 káv denně), nebo do frekventované kanceláře?
- **Rozpočet:** Jaký je váš orientační cenový strop?

Napište mi své priority, nebo si napište o *"10 klíčových parametrů"* pro detailní technický přehled!`;
  }

  // 5. User expresses intent for car
  if (domain.isCar) {
    return isEn ? `### ${agent?.name || 'Vehicle Purchase Consultation'}

${ragContextSentence}I am happy to assist you with independent analysis and recommendations for personal and family vehicles.

Key factors to clarify:
- **Budget & Financing:** Maximum price cap.
- **Powertrain:** Gasoline, diesel, hybrid (HEV/PHEV), or full electric (BEV)?
- **Space Requirements:** Trunk cargo volume, AWD requirement, or towing package?

Share your priorities or ask for *"10 key parameters"* for comprehensive comparisons!`
    : `### ${agent?.name || 'Konzultace nákupu automobilu'}

${ragContextSentence}Rád vám pomohu s nezávislou analýzou a výběrem rodinného či osobního vozu.

Klíčové faktory pro upřesnění:
- **Rozpočet a financování:** Maximální cenový strop (např. 650 000 Kč).
- **Pohon a motorizace:** Benzín, diesel, hybrid nebo čisté EV?
- **Prostorové nároky:** Velikost zavazadlového prostoru, potřeba 4x4 nebo tažného zařízení.

Napište mi své priority nebo si nechte vypsat klíčové srovnávací parametry!`;
  }

  // 6. User expresses intent for chair
  if (domain.isChair) {
    return isEn ? `### ${agent?.name || 'Ergonomic Seating Consultation'}

${ragContextSentence}Selecting the right ergonomic chair is a vital investment in spinal health during long hours of computer work.

To evaluate appropriate mechanics, please clarify:
- **Daily Sitting Duration:** 4–6 hours daily, or full 8+ hour workdays?
- **Body Dimensions:** Approximate height and weight to size the gas lift and seat slider?
- **Specific Comfort Needs:** Lumbar or cervical spine discomfort, or need for negative tilt?

Share your requirements or ask for *"10 key parameters"* for a full mechanics breakdown!`
    : `### ${agent?.name || 'Konzultace ergonomického sezení'}

${ragContextSentence}Správný výběr ergonomické židle je zásadní investice do zdraví páteře při dlouhém sezení u počítače.

Pro doporučení vhodné mechaniky mi prosím upřesněte:
- **Délka sezení:** Sedíte u stolu 4–6 hodin denně, nebo plných 8+ hodin?
- **Tělesné proporce:** Jaká je vaše přibližná výška a hmotnost pro správnou volbu pístu a hloubky sedáku?
- **Specifika komfortu:** Trápí vás bolesti beder, šíje, nebo potřebujete nastavitelnou bederní oporu s negativním sklonem sedáku?

Napište mi své požadavky nebo požádejte o *"10 parametrů"* pro kompletní přehled mechanik.`;
  }

  // 7. User expresses intent to buy shoes
  if (domain.isFootwear && (msgLower.includes('koupit') || msgLower.includes('hledám') || msgLower.includes('chci') || msgLower.includes('boty') || msgLower.includes('shoe') || msgLower.includes('buy'))) {
    return isEn ? `### ${agent?.name || 'Footwear Purchase Consultation'}

${ragContextSentence}I am here to guide you toward the ideal footwear matched to your biomechanical profile and running goals!

Before picking specific models, help me narrow your focus:
- **Terrain:** Pavement/road, or forest and rocky trails?
- **Intended Use:** High-mileage training, fast tempo runs, or all-day standing at work?
- **Budget:** Preferred price tier (e.g. under $150 or premium uncapped)?

Feel free to ask for *"10 key parameters"* or switch to the **Shopping Wizard** tab above!`
    : `### ${agent?.name || 'Konzultace výběru obuvi bAIright'}

${ragContextSentence}Rád vám pomohu s výběrem ideální obuvi přesně na míru vašim nohám a biomechanickým potřebám!

Než vybereme konkrétní modely, pomozte mi zúžit zaměření:
- **Povrch:** Běháte/chodíte převážně po asfaltu a tvrdém povrchu, nebo hledáte boty do terénu a lesa?
- **Použití:** Jde o běžecký trénink, celodenní chůzi a stání v práci, nebo regenerační obuv?
- **Rozpočet:** Máte stanovenou cenovou hladinu (např. do 3 500 Kč nebo prémiovou kategorii)?

Pokud chcete rovnou vidět technická kritéria, stačí napsat např. *"chci 10 parametrů"*, nebo můžete spustit interaktivního průvodce kliknutím na **Průvodce nákupem** nahoře.`;
  }

  // 8. Default consultative fallback
  const agentHeader = agent?.name ? `${resolveAgentIcon(agent.icon, `${agent.name} ${agent.category}`)} ${agent.name}` : (isEn ? 'bAIright Shopping Consultant' : 'bAIright Nákupní konzultant');
  return isEn ? `### ${agentHeader}

${ragContextSentence}I understand your request: **"${message}"**.

As your independent purchasing advisor, I provide unbiased recommendations without sponsored influence.

You can:
1. Specify your key criteria, intended use, or budget constraints.
2. Ask for **10 key parameters** to understand the critical technical specifications.
3. Switch to the **Shopping Wizard** tab for structured, step-by-step guidance.`
  : `### ${agentHeader}

${ragContextSentence}Rozumím vašemu požadavku: **„${message}“**.

Jako váš nezávislý nákupní poradce se zaměřuji na výběr produktů bez sponzorovaných vlivů. 

Můžete:
1. Napsat mi podrobnější kritéria či rozpočet.
2. Požádat o **10 klíčových parametrů** pro tuto kategorii.
3. Přepnout se na záložku **Průvodce nákupem** pro strukturovaný výběr krok za krokem.`;
}
