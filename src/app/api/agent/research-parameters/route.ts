import { NextRequest, NextResponse } from 'next/server';
import { 
  discoverDomainParameters, 
  DomainAnalysisResult,
  ExtractedDomainParameter,
  UNIVERSAL_BRAND_PARAMETER 
} from '@/lib/agent/domain-parameter-discovery';

export async function POST(req: NextRequest) {
  try {
    const { query, providerId, apiKey, locale = 'cs' } = await req.json();

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: locale === 'en' ? 'Please enter a product name or category for parameter analysis.' : 'Zadejte prosím název produktu nebo kategorii pro analýzu parametrů.' },
        { status: 400 }
      );
    }

    const trimmedQuery = query.trim();

    // 1. Check for LLM API keys (client BYOK or environment)
    const effectiveKey = apiKey || (
      providerId === 'google_gemini' ? process.env.GOOGLE_GEMINI_API_KEY :
      providerId === 'openai_gpt4o' ? process.env.OPENAI_API_KEY :
      providerId === 'anthropic_claude' ? process.env.ANTHROPIC_API_KEY :
      process.env.GOOGLE_GEMINI_API_KEY || process.env.OPENAI_API_KEY
    );

    // 2. ALWAYS invoke Agent Luke (Parameter Research Agent) when an API key is available
    if (effectiveKey) {
      try {
        const lukeResearched = await researchParametersWithLuke(trimmedQuery, effectiveKey, providerId, locale);
        if (lukeResearched && lukeResearched.parameters && lukeResearched.parameters.length >= 4) {
          const hasBrand = lukeResearched.parameters.some(
            (p: ExtractedDomainParameter) => 
              p.id === 'brand_preferences' || 
              p.id.includes('brand') || 
              p.name.toLowerCase().includes('značk') || 
              p.name.toLowerCase().includes('výrobc') ||
              p.name.toLowerCase().includes('brand') ||
              p.name.toLowerCase().includes('manufacturer')
          );
          if (!hasBrand) {
            const localizedBrandParam: ExtractedDomainParameter = locale === 'en' ? {
              id: 'brand_preferences',
              name: 'Brand & Manufacturers (Preferred vs. Forbidden)',
              category: 'Brands & Manufacturers',
              importance: 'recommended',
              rationale: 'Allows you to specify preferred brands you trust, or strictly exclude brands you do not want to be recommended.',
              icon: '🏷️',
              suggestedComponent: 'brands',
              suggestedValues: [
                'All verified brands (open selection)',
                'I have specific preferred brands',
                'I want to exclude specific manufacturers',
              ],
            } : UNIVERSAL_BRAND_PARAMETER;

            lukeResearched.parameters.push(localizedBrandParam);
          }
          return NextResponse.json({
            success: true,
            analysis: lukeResearched,
            source: 'agent_luke_deep_research',
          });
        }
      } catch (llmErr) {
        console.warn('Agent Luke LLM call failed, falling back to enriched domain knowledge:', llmErr);
      }
    }

    // 3. Fallback: High-quality curated domain intelligence synthesized by Luke's offline engine
    const localAnalysis = discoverDomainParameters(trimmedQuery);
    return NextResponse.json({
      success: true,
      analysis: localAnalysis,
      source: localAnalysis.matchedDomain !== 'generic' ? 'agent_luke_curated_intelligence' : 'agent_luke_offline_synthesizer',
    });
  } catch (error: any) {
    console.error('Error in research-parameters endpoint:', error);
    return NextResponse.json(
      { error: 'Chyba při provádění průzkumu parametrů.' },
      { status: 500 }
    );
  }
}

/**
 * Invokes LLM as Agent Luke (Deep Product Research Specialist).
 * Synthesizes insights grounded in YouTube teardowns, community enthusiast forums (Reddit etc.),
 * and manufacturer engineering datasheets.
 */
async function researchParametersWithLuke(
  categoryQuery: string,
  apiKey: string,
  providerId?: string,
  locale: string = 'cs'
): Promise<DomainAnalysisResult | null> {
  const isEn = locale === 'en';
  const languageInstruction = isEn
    ? `IMPORTANT: The user interface is in English. You MUST generate all output fields in fluent, natural English. This includes categoryName, agentName, description, parameter names, categories, rationales, suggested values, alternative parameters, questions, and systemPrompt.`
    : `Jazyk výstupu: Čeština. Všechny texty a parametry vygeneruj v přirozené češtině.`;

  const brandParamInstruction = isEn
    ? `MANDATORY PARAMETER: You MUST ALWAYS INCLUDE a brand preferences parameter ("Brand & Manufacturers (Preferred vs. Forbidden)", id: "brand_preferences", suggestedComponent: "brands"). This parameter enables the user to explicitly specify which brands they want (preferred) and which they reject (forbidden).`
    : `POVINNÝ PARAMETR VŽDY: Mezi vygenerovanými parametry MUSÍŠ VŽDY ZAHRNOUT parametr pro značky a výrobce ("Značka & Výrobci (Preferované vs. Zakázané)", id: "brand_preferences", suggestedComponent: "brands"). Tento parametr slouží k tomu, aby si uživatel mohl explicitně napsat, které konkrétní značky chce (preferuje) a které nechce (zakazuje doporučit).`;

  const metaPrompt = `
${languageInstruction}

Jsi špičkový produktový analytik, nákupčí a reverzní inženýr nákupního rozhodování v expertním systému bAIright.
Znáš psychologii nákupu, víš, jaká úskalí skrývají marketingové materiály výrobců, a přesně víš, na co se zákazníka zeptat, aby zúžil výběr na ten nejvhodnější produkt. Nemáš žádný zájem na prodeji konkrétní značky nebo modelu. Tvojí jedinou misí je ochránit uživatele před nevhodným nákupem, dodat mu maximální jistotu a ušetřit mu hodiny složité rešerše.

Uživatel chce koupit: "${categoryQuery}".

Tvým úkolem je na základě tohoto vstupu vygenerovat 8 až 12 nejdůležitějších parametrů a rozhodovacích kritérií + 3 až 5 alternativních do poolu návrhů. Tyto parametry poslouží jako základ pro Intake Wizard, který uživateli pomůže sestavit detailní a přesný nákupní prompt.

## METODOLOGIE A ZDROJE (SIMULOVANÁ HLOUBKOVÁ SYNTÉZA)
Při sestavování parametrů nesmíš vycházet jen ze suchých produktových letáků. Musíš syntetizovat poznatky z reálného světa:
1. YouTube recenze a dlouhodobé testy po 1 roce používání (kanály jako Project Farm, RTINGS, specialisté na jednotlivé obory): Zaměř se na to, co testeři nejčastěji kritizují (tzv. dealbreakery) a co se projeví až časem.
2. Diskusní fóra a komunity nadšenců (Reddit r/BuyItForLife, oborové subreddity): Zohledni reálné problémy dlouhodobých uživatelů (např. degradace materiálů, softwarové chyby, servisní pasti, ergonomické nedostatky).
3. Technické specifikace a normy výrobců: Převeď technická data do řeči reálného užitku (např. místo suchého čísla výkonu vysvětli, zda to zvládne plné naložení na dálnici).

## TÓN KOMUNIKACE
- Profesionální, návodný a empatický: Pokládáš chytré otázky, které laika navedou.
- Srozumitelný pro laiky: Cílovým uživatelem je člověk bez hlubokého technického vzdělání. Vše vysvětluj lidsky a prakticky.
- Absolutní absence nátlaku: Žádné prodejní fráze, žádné umělé FOMO. Jen fakta a uživatelský kontext.

## STRIKTNÍ PRAVIDLA PRO KVALITU PARAMETRŮ:
- STRIKTNÍ ZÁKAZ VÁGNÍCH KLIŠÉ: Žádná "Cena", "Barva", "Vzhled", "Kvalita zpracování", "Spolehlivost", "Ergonomie", "Technologický standard", "Základní výbava".
- ${brandParamInstruction}
- KAŽDÝ PARAMETR MUSÍ MÍT V "rationale" DVĚ SLOŽKY:
  1. Insight z fór a testů (proč na tom záleží a jaké je riziko špatné volby).
  2. Konkrétní návodnou otázku pro uživatele.

## FEW-SHOT REFERENČNÍ VZOR (Příklad správné hloubky na dotaz "Elektro auto"):
{
  "keyword": "Elektro auto",
  "matchedDomain": "electric_cars",
  "categoryName": "Elektromobily & Elektrická Vozidla (EV)",
  "agentName": "Specialista na Elektromobilitu & EV",
  "icon": "⚡",
  "description": "Nezávislý nákupní poradce pro výběr elektromobilu na základě dálničního dojezdu, nabíjecí křivky, tepelného čerpadla a baterie.",
  "parameters": [
    {
      "id": "ev_range_wltp",
      "name": "Reálný dojezd vs. WLTP",
      "category": "Baterie & Dojezd",
      "importance": "mandatory",
      "rationale": "Papírový dojezd se často liší od reality, zejména v zimních měsících a při dálničních rychlostech (pokles o 30–40 %), což je na fórech nejčastější zklamání. Otázka pro vás: Jakou vzdálenost průměrně ujedete za den a jak často jezdíte trasy nad 250 km v kuse?",
      "icon": "🔋",
      "suggestedComponent": "chips",
      "suggestedValues": ["Do 250 km (převážně město/okresky)", "250–400 km (kombinovaný provoz)", "400+ km v kuse (časté dálnice)"]
    },
    {
      "id": "ev_charging_speed",
      "name": "Možnosti a rychlost nabíjení (Architektura 800V vs 400V)",
      "category": "Nabíjení",
      "importance": "mandatory",
      "rationale": "Maximální výkon nestačí, klíčová je doba udržení nabíjecí křivky a dostupnost wallboxu. Otázka pro vás: Máte možnost instalovat domácí nabíjení, nebo budete závislí výhradně na veřejných stanicích?",
      "icon": "⚡",
      "suggestedComponent": "chips",
      "suggestedValues": ["Mám/plánuji domácí wallbox (AC 11 kW)", "Výhradně veřejné rychlonabíječky (DC)", "Kombinace domov + veřejné sítě"]
    },
    {
      "id": "ev_heat_pump",
      "name": "Tepelné čerpadlo pro zimní provoz",
      "category": "Klimatizace & Efektivita",
      "importance": "recommended",
      "rationale": "Uživatelé EV fór se shodují, že tento prvek je v ČR zásadní pro udržení rozumného dojezdu při vytápění kabiny pod 0 °C. Otázka pro vás: Bude vůz parkovat venku a jezdit pravidelně v mrazech?",
      "icon": "❄️",
      "suggestedComponent": "chips",
      "suggestedValues": ["Nutné tepelné čerpadlo (časté zimní jízdy)", "Garážované stání / běžný zimní dojezd postačí"]
    },
    {
      "id": "ev_battery_chem",
      "name": "Chemie baterie (LFP vs. NMC) a degradace",
      "category": "Baterie",
      "importance": "recommended",
      "rationale": "LFP baterie lze bez obav denně nabíjet do 100 % a mají delší životnost, NMC mají vyšší hustotu a lepší výkon v mrazu. Otázka pro vás: Plánujete auto vlastnit dlouhodobě (5+ let), nebo jde o operativní leasing?",
      "icon": "🔬",
      "suggestedComponent": "chips",
      "suggestedValues": ["Dlouhodobé vlastnictví (důraz na životnost)", "Operativní leasing / 3–4 roky (maximální dojezd)"]
    },
    {
      "id": "ev_software_ota",
      "name": "Softwarový ekosystém, plánování tras & OTA aktualizace",
      "category": "Konektivita",
      "importance": "recommended",
      "rationale": "Pomalý infotainment a chybějící předehřev baterie před nabíjením dokáže zkazit celou dálkovou cestu. Otázka pro vás: Vyžadujete špičkový nativní systém s automatickým plánováním nabíječek, nebo preferujete CarPlay/Android Auto?",
      "icon": "📱",
      "suggestedComponent": "chips",
      "suggestedValues": ["Nativní EV plánování s předehřevem (Tesla/Google)", "Bezdrátový Apple CarPlay / Android Auto"]
    }
  ],
  "suggestedAlternatives": [
    {
      "id": "ev_tow_hitch",
      "name": "Tažné zařízení & svislé zatížení na nosič kol",
      "category": "Praktičnost",
      "importance": "preference",
      "rationale": "U řady EV nelze tažné zařízení dodělat dodatečně a vertikální zatížení bývá u elektroaut omezené. Otázka pro vás: Plánujete vozit elektrokola nebo přívěsný vozík?",
      "icon": "🚲",
      "suggestedComponent": "chips",
      "suggestedValues": ["Nosič na 2–4 (elektro)kola (min. 75 kg na kouli)", "Tahání přívěsu / karavanu (min. 1 500 kg)", "Nepotřebuji tažné"]
    },
    {
      "id": "ev_service_warranty",
      "name": "Záruka na trakční baterii & dostupnost servisu v ČR",
      "category": "Záruka & Servis",
      "importance": "preference",
      "rationale": "Dostupnost certifikovaného servisu pro vysokonapěťové systémy ve vašem regionu a garance kapacity baterie (např. 70 % po 8 letech / 160 000 km).",
      "icon": "🛡️",
      "suggestedComponent": "chips",
      "suggestedValues": ["Minimálně 8 let / 160 000 km záruka", "Autorizovaný servis v dojezdu do 30 minut"]
    }
  ],
  "questions": [
    {
      "id": "ev_q_range",
      "step": 1,
      "title": "Jaký dálniční dojezd bez nutnosti nabíjení reálně potřebujete?",
      "subtitle": "Počítejte s rezervou pro zimní provoz při rychlosti 130 km/h.",
      "component": "chips",
      "isMultiSelect": false,
      "options": [
        { "label": "Do 250 km", "value": "do 250 km", "description": "Běžné příměstské a denní dojíždění" },
        { "label": "250 až 380 km", "value": "250-380 km", "description": "Jedna rychlá 20min zastávka na 600 km cestě" },
        { "label": "400+ km", "value": "400+ km", "description": "Dálkové dálniční trasy s minimem zastávek" }
      ],
      "defaultValue": "250-380 km",
      "promptForgeTemplate": "- **Požadovaný reálný dálniční dojezd:** {value}"
    }
  ],
  "systemPrompt": "Expertní systémový prompt pro doporučení přesně 3 konkrétních reálných modelů na trhu."
}

Nyní zpracuj uživatelský dotaz: "${categoryQuery}".
Vygeneruj 8 až 12 takových špičkových parametrů a 3 až 5 alternativních do poolu návrhů.
Odpověz STRIKTNĚ jako validní JSON podle výše uvedené struktury, bez jakéhokoliv doplňkového markdownového textu.
`.trim();

  // Route according to provider
  if (providerId === 'openai_gpt4o' || apiKey.startsWith('sk-proj-') || apiKey.startsWith('sk-')) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'Jsi elitní Parameter Research Agent pro hloubkovou analýzu nákupních rozhodnutí, recenzí a odborných fór. Odpovídáš výhradně validním JSONem.',
            },
            { role: 'user', content: metaPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data?.choices?.[0]?.message?.content;
        if (content) {
          return JSON.parse(content) as DomainAnalysisResult;
        }
      }
    } catch (err) {
      console.warn('OpenAI research call failed, trying Gemini:', err);
    }
  }

  // Default to Google Gemini API
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: metaPrompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 3500,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    // Fallback to gemini-1.5-flash if 2.0-flash not available
    const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const fallbackRes = await fetch(fallbackUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: metaPrompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 3500,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!fallbackRes.ok) {
      throw new Error(`Gemini API error ${response.status}: ${await response.text()}`);
    }

    const fbData = await fallbackRes.json();
    const fbText = fbData?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!fbText) return null;
    const cleanJson = fbText.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson) as DomainAnalysisResult;
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return null;

  const cleanJson = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(cleanJson);

  return parsed as DomainAnalysisResult;
}

