import { NextRequest, NextResponse } from 'next/server';
import { ProfileStorageManager } from '@/lib/storage/profile-storage';
import { extractBiomechanicalProfileUpdates } from '@/lib/agent/state-machine';
import { AgentChatMessage } from '@/lib/agent/types';
import { UniversalAgentDefinition } from '@/lib/agent/universal-agent-schema';

interface ChatRequestBody {
  sessionId: string;
  message: string;
  agent?: UniversalAgentDefinition | null;
  history?: AgentChatMessage[];
  ragFacts?: Array<{ id?: string; label?: string; value?: string; fact?: string; category?: string }>;
  providerId?: string;
  apiKey?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequestBody = await req.json();
    const { sessionId, message, agent, history = [], ragFacts = [], providerId, apiKey } = body;

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
          providerId,
          apiKey: effectiveKey,
        });
      } catch (llmErr) {
        console.warn('Live LLM conversation call failed, falling back to conversational synthesizer:', llmErr);
      }
    }

    // 5. If no user BYOK key is connected, return clear BYOK notice
    if (!effectiveKey) {
      assistantContent = `### 🔑 Vyžadováno Připojení Vlastního AI Modelu (BYOK)

Pro živou konverzaci s nákupním agentem **${agent?.name || "bAIright Agent"}** je vyžadováno připojení vašeho vlastního AI modelu (Google Gemini, OpenAI GPT-4o nebo Anthropic Claude).

💡 **Jak začít (100% zdarma):**
1. Klikněte na tlačítko **Připojit API klíč (BYOK)** v záhlaví aplikace.
2. Vyberte **Google Gemini** a získejte bezplatný klíč z [Google AI Studio](https://aistudio.google.com/app/apikey) za 30 sekund.
3. Vložte klíč a konverzujte pod svým účtem bez omezení!`;
    } else if (!assistantContent) {
      assistantContent = synthesizeConversationalFallback({
        message,
        agent,
        history,
        ragFacts,
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

    return NextResponse.json({
      message: assistantMsg,
      updatedProfile,
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
  providerId?: string;
  apiKey: string;
}): Promise<string> {
  const { message, agent, history, ragFacts, providerId, apiKey } = params;

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
  const agentDirective = agent?.systemPrompt || 'Pomáhej uživateli vybrat nejvhodnější produkty na základě technických a ergonomických parametrů.';

  const formattedFacts = relevantFacts
    .map((f) => `- [${f.category || 'profil'}] ${f.label ? f.label + ': ' : ''}${f.value || f.fact}`)
    .join('\n');

  const systemPrompt = `
Jsi ${agentTitle} (${agentRole}) specializovaný na kategorii "${agentCategory}".
${agentDirective}

### ZNÁMÁ DATA UŽIVATELE Z RAG PAMĚTI:
${formattedFacts || 'Žádná předchozí data zatím nejsou evidována.'}

### PRAVIDLA PRO ODPOVĚDI:
1. Komunikuj vždy plynně a přirozeně v češtině.
2. VŽDY reaguj přímo na to, co uživatel napsal. Nikdy se mechanicky neopakuj.
3. Pokud uživatel výslovně požádá o určitý počet parametrů či kritérií (např. 10 parametrů, 5 rad, 10 bot), VŽDY mu vyhov a uveď přesně tolik strukturovaných bodů s vysvětlením.
4. Nikdy nezmiňuj irelevantní anatomická data z jiných kategorií (např. kopyto či došlap u kávovarů nebo aut).
5. Pokud uživatel vyjadřuje nákupní záměr, nabídni expertní vhled a navrhni logické další kroky.
6. Formátuj odpověď přehledně v Markdownu s použitím nadpisů (###), tučného písma a odrážek či číslovaných seznamů.
`.trim();

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

  // Default to Google Gemini (gemini-2.0-flash / gemini-1.5-flash)
  const candidateModels = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-latest'];
  for (const model of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const contents = [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\nUživatel se ptá:` }],
        },
        ...history.slice(-4).map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
        {
          role: 'user',
          parts: [{ text: message }],
        },
      ];

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      }
    } catch (e) {
      console.warn(`Gemini model ${model} conversational call failed:`, e);
    }
  }

  return '';
}

/**
 * Deterministic conversational synthesizer for offline / zero-key mode
 */
function synthesizeConversationalFallback(params: {
  message: string;
  agent?: UniversalAgentDefinition | null;
  history: AgentChatMessage[];
  ragFacts: Array<{ id?: string; label?: string; value?: string; fact?: string; category?: string }>;
}): string {
  const { message, agent, ragFacts } = params;
  const msgLower = message.toLowerCase().trim();

  const domain = classifyDomain(agent, message);
  const relevantFacts = filterDomainRagFacts(ragFacts, domain);

  const isAsking10 = 
    /(?:10|deset)\s*(?:parametr|krit[eé]r|bod|v[eě]c)|(?:chci|dej|uka[zž]|napi[sš])\s*(?:jich\s*)?10/i.test(msgLower) ||
    msgLower === '10' ||
    (msgLower.includes('10') && (msgLower.includes('parametr') || msgLower.includes('chci') || msgLower.includes('rekl')));

  // Check RAG memory highlights ONLY from domain-filtered facts
  const ragNotes: string[] = [];
  relevantFacts.forEach((f) => {
    const val = (f.value || f.fact || '').toLowerCase();
    const label = (f.label || '').toLowerCase();
    const combined = `${label} ${val}`;

    if (domain.isFootwear) {
      if (combined.includes('2e') || combined.includes('širok') || combined.includes('kopyto')) {
        ragNotes.push('širší kopyto (2E)');
      }
      if (combined.includes('artróz') || combined.includes('kolen')) {
        ragNotes.push('artróza kolenního kloubu');
      }
      if (combined.includes('supin')) {
        ragNotes.push('supinační došlap');
      }
    } else if (domain.isChair) {
      if (combined.includes('páteř') || combined.includes('zad') || combined.includes('beder')) {
        ragNotes.push('citlivost bederní páteře');
      }
      if (combined.includes('sezení')) {
        ragNotes.push('dlouhodobé sezení');
      }
    } else if (domain.isCoffee) {
      if (combined.includes('servis') || combined.includes('záruk')) {
        ragNotes.push('dostupnost servisu v ČR');
      }
      if (combined.includes('cena') || combined.includes('výkon') || combined.includes('rozpočet')) {
        ragNotes.push('poměr cena/výkon');
      }
    } else if (domain.isCar) {
      if (combined.includes('servis') || combined.includes('záruk')) {
        ragNotes.push('servis v ČR');
      }
      if (combined.includes('rodin') || combined.includes('kufr')) {
        ragNotes.push('rodinné prostorové nároky');
      }
    }
  });

  const ragContextSentence = ragNotes.length > 0 
    ? `> 💡 **Zohledněno z vašeho RAG profilu:** ${ragNotes.join(', ')}.\n\n`
    : '';

  // 1. User asked for 10 parameters
  if (isAsking10) {
    if (domain.isCoffee) {
      return `### ☕ 10 klíčových parametrů pro výběr kávovaru

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
      return `### 🪑 10 klíčových parametrů pro ergonomické sezení

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
      return `### 🚗 10 klíčových parametrů pro výběr automobilu

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
    return `### 👟 10 klíčových parametrů pro výběr obuvi

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
10. **Kompatibilita s ortopedickými vložkami:** Hloubka lůžka a vyjímatelná stélka pro individuální ortopedické korekce.

Chcete se na některý z těchto parametrů zaměřit, nebo si přejete doporučit konkrétní modely bot splňující tyto požadavky?`;
  }

  // 2. Coffee machine queries (e.g. "jak kavovar do firmy?")
  if (domain.isCoffee) {
    const isCompanyOrOffice = 
      domain.normMsg.includes('firm') || 
      domain.normMsg.includes('kancelar') || 
      domain.normMsg.includes('offic') || 
      domain.normMsg.includes('podnik') ||
      domain.normMsg.includes('tym');

    if (isCompanyOrOffice) {
      return `### ☕ ${agent?.name || 'Konzultace výběru kávovaru do firmy'}

${ragContextSentence}Výběr kávovaru do firmy či kanceláře vyžaduje jiný přístup než pro domácnost – zásadní je **denní vytížení**, **snadná údržba** a **intuitivní ovládání** pro více kolegů bez rizika ucpání mléčných cest.

Pro přesné doporučení mi pomozte upřesnit 4 klíčová kritéria:
1. **Denní kapacita:** Kolik káv se u vás odhadem denně připraví? (do 15 káv / 20–50 káv / 50+ káv denně)
2. **Připojení na vodu:** Preferujete doplňovací velkou nádržku (např. 2,5–5 litrů), nebo přímé napojení na vodovodní řad?
3. **Mléčné speciality:** Přejí si lidé OneTouch cappuccino/latte na jeden stisk s automatickým proplachem, nebo stačí primárně espresso a lungo?
4. **Rozpočet a servis:** Hledáte řešení do cca 25 000 Kč pro menší tým, nebo profesionální kancelářský automat (40–70 tis. Kč) s garantovaným servisem do 24 hodin?

Můžete mi napsat vaše parametry, nebo napsat *"chci 10 parametrů"* pro kompletní srovnávací kritéria.`;
    }

    return `### ☕ ${agent?.name || 'Konzultace výběru kávovaru'}

${ragContextSentence}Rád vám pomohu s nezávislým výběrem ideálního kávovaru přesně podle vašich chuťových preferencí a nároků na obsluhu.

Pro přesné zacílení mi prosím upřesněte:
- **Typ kávovaru:** Plně automatický s mlýnkem na zrnkovou kávu, nebo precizní manuální pákový stroj?
- **Mléčné nápoje:** Preferujete automatickou karafovou přípravu cappuccina/latte, nebo manuální parní trysku?
- **Místo určení:** Bude kávovar v domácnosti (cca 2–6 káv denně), nebo do frekventované kanceláře?
- **Rozpočet:** Jaký je váš orientační cenový strop?

Napište mi své priority, nebo si napište o *"10 klíčových parametrů"* pro detailní technický přehled!`;
  }

  // 3. User expresses intent for car
  if (domain.isCar) {
    return `### 🚗 ${agent?.name || 'Konzultace nákupu automobilu'}

${ragContextSentence}Rád vám pomohu s nezávislou analýzou a výběrem rodinného či osobního vozu.

Klíčové faktory pro upřesnění:
- **Rozpočet a financování:** Maximální cenový strop (např. 650 000 Kč).
- **Pohon a motorizace:** Benzín, diesel, hybrid nebo čisté EV?
- **Prostorové nároky:** Velikost zavazadlového prostoru, potřeba 4x4 nebo tažného zařízení.

Napište mi své priority nebo si nechte vypsat klíčové srovnávací parametry!`;
  }

  // 4. User expresses intent for chair
  if (domain.isChair) {
    return `### 🪑 ${agent?.name || 'Konzultace ergonomického sezení'}

${ragContextSentence}Správný výběr ergonomické židle je zásadní investice do zdraví páteře při dlouhém sezení u počítače.

Pro doporučení vhodné mechaniky mi prosím upřesněte:
- **Délka sezení:** Sedíte u stolu 4–6 hodin denně, nebo plných 8+ hodin?
- **Tělesné proporce:** Jaká je vaše přibližná výška a hmotnost pro správnou volbu pístu a hloubky sedáku?
- **Specifika komfortu:** Trápí vás bolesti beder, šíje, nebo potřebujete nastavitelnou bederní oporu s negativním sklonem sedáku?

Napište mi své požadavky nebo požádejte o *"10 parametrů"* pro kompletní přehled mechanik.`;
  }

  // 5. User expresses intent to buy shoes
  if (domain.isFootwear && (msgLower.includes('koupit') || msgLower.includes('hledám') || msgLower.includes('chci') || msgLower.includes('boty'))) {
    return `### 👟 ${agent?.name || 'Konzultace výběru obuvi bAIright'}

${ragContextSentence}Rád vám pomohu s výběrem ideální obuvi přesně na míru vašim nohám a biomechanickým potřebám!

Než vybereme konkrétní modely, pomozte mi zúžit zaměření:
- **Povrch:** Běháte/chodíte převážně po asfaltu a tvrdém povrchu, nebo hledáte boty do terénu a lesa?
- **Použití:** Jde o běžecký trénink, celodenní chůzi a stání v práci, nebo regenerační obuv?
- **Rozpočet:** Máte stanovenou cenovou hladinu (např. do 3 500 Kč nebo prémiovou kategorii)?

Pokud chcete rovnou vidět technická kritéria, stačí napsat např. *"chci 10 parametrů"*, nebo můžete spustit interaktivního průvodce kliknutím na **Průvodce nákupem** nahoře.`;
  }

  // 6. Default consultative fallback
  const agentHeader = agent?.name ? `${agent.icon || '🤖'} ${agent.name}` : '🤖 bAIright Nákupní konzultant';
  return `### ${agentHeader}

${ragContextSentence}Rozumím vašemu požadavku: **„${message}“**.

Jako váš nezávislý nákupní poradce se zaměřuji na výběr produktů bez sponzorovaných vlivů. 

Můžete:
1. Napsat mi podrobnější kritéria či rozpočet.
2. Požádat o **10 klíčových parametrů** pro tuto kategorii.
3. Přepnout se na záložku **Průvodce nákupem** pro strukturovaný výběr krok za krokem.`;
}

