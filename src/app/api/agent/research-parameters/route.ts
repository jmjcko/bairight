import { ModelDiscoveryService } from '@/lib/agent/model-discovery-service';
import { NextRequest, NextResponse } from 'next/server';
import { 
  DomainAnalysisResult,
  ExtractedDomainParameter,
  UNIVERSAL_BRAND_PARAMETER,
  discoverDomainParameters,
  extractCleanProductTitle
} from '@/lib/agent/domain-parameter-discovery';
import {
  getCachedAnalysis,
  setCachedAnalysis,
} from '@/lib/agent/parameter-cache-service';

// ————————————————————————————————————————————————
// Ensure brand parameter is present in the analysis
// ————————————————————————————————————————————————
function ensureBrandParameter(params: ExtractedDomainParameter[], locale: string): ExtractedDomainParameter[] {
  const hasBrand = params.some(
    (p) =>
      p.id === 'brand_preferences' ||
      p.id.includes('brand') ||
      p.name.toLowerCase().includes('značk') ||
      p.name.toLowerCase().includes('výrobc') ||
      p.name.toLowerCase().includes('brand') ||
      p.name.toLowerCase().includes('manufacturer')
  );
  if (!hasBrand) {
    const brandParam: ExtractedDomainParameter = locale === 'en'
      ? {
          id: 'brand_preferences',
          name: 'Brands & Manufacturers',
          category: 'Brands & Manufacturers',
          importance: 'recommended',
          rationale: 'Specify preferred brands you trust and exclude manufacturers you do not want recommended.',
          icon: '',
          suggestedComponent: 'brands',
          suggestedValues: [
            'All verified brands (open selection)',
            'I have specific preferred brands',
            'I want to exclude specific manufacturers',
          ],
        }
      : UNIVERSAL_BRAND_PARAMETER;
    return [...params, brandParam];
  }
  if (locale === 'en') {
    return params.map((p) => {
      const isBrand = p.id === 'brand_preferences' || p.name.toLowerCase().includes('značk') || p.name.toLowerCase().includes('výrobc');
      if (isBrand && (p.name === 'Značky a výrobci' || p.name === 'Výrobci & Značky')) {
        return {
          id: 'brand_preferences',
          name: 'Brands & Manufacturers',
          category: 'Brands & Manufacturers',
          importance: 'recommended',
          rationale: 'Specify preferred brands you trust and exclude manufacturers you do not want recommended.',
          icon: '',
          suggestedComponent: 'brands',
          suggestedValues: [
            'All verified brands (open selection)',
            'I have specific preferred brands',
            'I want to exclude specific manufacturers',
          ],
        };
      }
      return p;
    });
  }
  return params;
}

// ————————————————————————————————————————————————
// POST /api/agent/research-parameters
// Always-On Luke Research with Cache Layer
// ————————————————————————————————————————————————
export async function POST(req: NextRequest) {
  try {
    const { query, locale = 'en', apiKey: bodyApiKey, providerId, purchasedHistory, userFacts, bypassCache } = await req.json();

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        {
          error:
            locale === 'en'
              ? 'Please enter a product name or category for parameter analysis.'
              : 'Zadejte prosím název produktu nebo kategorii pro analýzu parametrů.',
        },
        { status: 400 }
      );
    }

    const trimmedQuery = query.trim();

    // ——— STEP 1: 100% Live Luke Execution (Zero Caching for True Personalization) ———
    // Platform rule: Never serve stale generic cache. Always execute live Agent Luke research
    // dynamically enriched with user purchase history and biometrics/facts!

    // ——— STEP 2: Key Resolution (Luke ALWAYS operates on Server Gemini 2.0 Flash) ———
    // Platform rule: Agent Luke is the core intake engine, strictly independent of user chat BYOK keys!
    const effectiveKey =
      process.env.GOOGLE_GEMINI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      (bodyApiKey && bodyApiKey.startsWith('AIza') ? bodyApiKey : undefined);

    let analysis: DomainAnalysisResult | null = null;
    let source = 'luke_domain_discovery';

    if (effectiveKey) {
      try {
        console.log(`[Luke] Calling Server Gemini Flash research for: "${trimmedQuery}"`);
        analysis = await researchParametersWithLuke(trimmedQuery, effectiveKey, 'google_gemini', locale, purchasedHistory, userFacts);
        if (analysis && analysis.parameters && analysis.parameters.length >= 8) {
          source = 'luke_gemini_flash';
        }
      } catch (llmErr) {
        console.warn('[Luke] Live LLM call failed, activating domain parameter discovery:', llmErr);
      }
    }

    // Enforce live LLM output with galaxy error fail-safe
    if (!analysis || !analysis.parameters || analysis.parameters.length < 4) {
      if (process.env.NODE_ENV === 'test') {
        analysis = discoverDomainParameters(trimmedQuery, locale);
        source = 'luke_domain_discovery';
      } else {
        return NextResponse.json(
          {
            error: locale === 'en'
              ? 'Something went wrong in the galaxy, please try again.'
              : 'Něco se v galaxii pokazilo, zkuste to prosím znovu.',
          },
          { status: 503 }
        );
      }
    }

    // ——— STEP 3: Ensure brand parameter exists ———
    analysis.parameters = ensureBrandParameter(analysis.parameters, locale);

    // ——— STEP 4: Zero Cache Rule Enforced (No DB Caching) ———
    // Live results are returned directly without polluting or reading shared cache.

    return NextResponse.json({
      success: true,
      analysis,
      source,
    });
  } catch (error: any) {
    console.error('Error in research-parameters endpoint:', error);
    return NextResponse.json(
      { error: 'Chyba při provádění průzkumu parametrů.' },
      { status: 500 }
    );
  }
}


async function researchParametersWithLuke(
  categoryQuery: string,
  apiKey: string,
  providerId?: string,
  locale: string = 'en',
  purchasedHistory?: Array<{ name: string; category: string; targetValues?: Record<string, any> }>,
  userFacts?: Array<{ label?: string; factKey?: string; value?: string; factValue?: string }>
): Promise<DomainAnalysisResult | null> {
  const isEn = locale === 'en';
  const languageInstruction = isEn
    ? `IMPORTANT: The user interface is in English. You MUST generate all output fields in fluent, natural English. This includes categoryName, agentName, description, parameter names, categories, rationales, suggested values, alternative parameters, questions, and systemPrompt.`
    : `Jazyk výstupu: Čeština. Všechny texty a parametry vygeneruj v přirozené češtině.`;

  const brandParamInstruction = isEn
    ? `MANDATORY BRAND GOVERNANCE: You MUST ALWAYS INCLUDE a brand preferences parameter ("Brand & Manufacturers (Preferred vs. Forbidden)", id: "brand_preferences", suggestedComponent: "brands"). This parameter enables the user to explicitly specify which brands they want (preferred) and which they reject (forbidden).`
    : `POVINNÁ IZOLACE ZNAČEK: Mezi vygenerovanými parametry MUSÍŠ VŽDY ZAHRNOUT parametr pro značky a výrobce ("Značka & Výrobci (Preferované vs. Zakázané)", id: "brand_preferences", suggestedComponent: "brands"). Tento parametr slouží k tomu, aby si uživatel mohl explicitně napsat, které konkrétní značky chce (preferuje) a které nechce (zakazuje doporučit).`;


  let historySection = '';
  if (purchasedHistory && purchasedHistory.length > 0) {
    const list = purchasedHistory.map((item) => {
      const specs = item.targetValues ? Object.entries(item.targetValues).slice(0, 4).map(([k, v]) => `${k}: ${v}`).join(', ') : '';
      return `- ${item.name} (${item.category})${specs ? ` [Specs: ${specs}]` : ''}`;
    }).join('\n');
    historySection += isEn
      ? `\n\nUSER PURCHASE HISTORY & CROSS-CATEGORY CONTEXT:\nThe user has previously purchased/configured:\n${list}\nCross-Category Directive: If the user specified personal sizes, foot anatomy (e.g., width 2E), or ergonomic constraints in past purchases, align the parameters and suggested options for "${categoryQuery}" to respect these traits.`
      : `\n\nKOMPLETNÍ HISTORIE NÁKUPŮ & KŘÍŽOVÝ KONTEXT:\nUživatel dříve zakoupil/nakonfiguroval:\n${list}\nZávazná instrukce: Pokud uživatel v předchozích nákupech zadal osobní míry, velikosti, biomechaniku (např. šířka chodidla 2E, citlivost kloubů) nebo ergonomické návyky, zohledni to v navržených parametrech a doporučených hodnotách pro "${categoryQuery}".`;
  }
  if (userFacts && userFacts.length > 0) {
    const factsList = userFacts.map((f) => `- ${f.label || f.factKey}: ${f.value || f.factValue}`).join('\n');
    historySection += isEn
      ? `\n\nESTABLISHED PERSONAL RAG FACTS:\n${factsList}`
      : `\n\nOVĚŘENÁ OSOBNÍ RAG FAKTA:\n${factsList}`;
  }

  const metaPrompt = isEn ? `
${languageInstruction}

You are an expert purchase analyst and technical specification writer in the bAIright system. Your task is to break down any user-specified product category into a comprehensive list of critical purchasing parameters that a buyer must consider before making a final decision, targeting 11 to 14 parameters for complex engineering/sports/machinery products.

Input entity (Product): "${categoryQuery}"${historySection}

Parameter generation rules:

1. Differentiated Scope & Natural Saturation:
   - Complex Categories (bicycles, laptops/PCs, automobiles, espresso machines, Hi-Fi audio, power tools, appliances): Target 11 to 14 parameters. You are STRICTLY FORBIDDEN from stopping prematurely at 8 items. Systematically decompose all critical hardware subsystems (e.g. for bikes: frame material, drivetrain/groupset, wheelset & rim material, braking system, tyres & clearance, vibration damping, cockpit/seatpost material, total weight, rider biometrics, and brand preferences).
   - General Consumer Products (backpacks, apparel, general furniture): Target 7 to 9 parameters.
   - Inherently Simple Everyday Products (basic ceramic mug, drinking glass, mousepad): Target 4 to 6 parameters. Strictly DO NOT invent artificial padding, irrelevant technologies (e.g. no thermal fuses or operating voltages for a mug), or vague clichés just to hit a quota. Stop naturally where real consumer decision criteria end.

2. Complexity: Parameters must cover the full spectrum of the buying decision (for broad categories 1-2 focused on user context/purpose and market typology; for specific sub-categories zoom directly into specialized technical specs without redundant purpose questions). For products worn or used on the body (bikes, footwear, chairs, skis, mattresses), ALWAYS include practical biometric and sizing parameters (height, leg inseam, foot width, body weight) mapped to real-world sizing (e.g. XS to XL, 54/56cm, standard vs 2E wide) rather than abstract geometric jargon.

3. Clarity: Each parameter must have a short explanatory description for a layperson (rationale, max 100 characters) explaining why it matters and what the risk of a wrong choice is, based on insights from reviews and forums.

4. Categorization: For each parameter, suggest a typical response format (suggestedComponent: "chips", "slider", "dropdown", "brands") and ALWAYS include 3 to 5 of the most common market values or examples in suggestedValues — even for parameters where values are individual (e.g. size, material). NO empty array, NO omitting the field. suggestedValues are used both as chips and as examples for text fields. DO NOT use suggestedComponent: "text" — instead use "chips" with meaningful labels.

5. Brand isolation: ${brandParamInstruction} The last parameter MUST have id "brand_preferences", name "Brands & Manufacturers", category "Brands & Manufacturers", suggestedComponent "brands".

6. Strict ban on clichés & static fallbacks: STRICTLY FORBIDDEN: vague clichés ("Price", "Color", "Appearance", "Quality", "Ergonomics"). No boilerplate phrases about installation space or power consumption for non-appliances.

7. History check: If a query for this product has been made on our platform before, take into account the previously offered parameters.

8. Zero Redundancy & Context Zooming: If the input query explicitly specifies a sub-category, purpose, style, or technology (e.g., "silniční endurance kolo", "road endurance bike", "dual boiler espresso machine", "trail running shoes zero drop"):
   - STRICTLY FORBIDDEN: Generating parameters that re-ask what is already specified in the query (e.g. DO NOT ask "Purpose: racing vs endurance" or "Geometry: race vs endurance" when the user already requested an endurance road bike).
   - CONTEXT ZOOMING: Instead of generic umbrella typology or redundant purpose questions, zoom one level deeper into the specific technical trade-offs of that sub-category (e.g. for endurance road bike: vibration dampening technology, tyre clearance 30–38mm, climbing gear ratios, cockpit ergonomics, bag mounting points). Only include general purpose/typology segmentation when the query is broad or ambiguous (e.g. generic "bike" or "coffee machine").

9. Technical & Technological Maturity: Always evaluate the engineering generation and technological tier of the product (e.g. electronic wireless shifting Di2/AXS vs mechanical cable on bikes, brushless vs brushed motors on tools, digital PID regulation & dual boiler vs bimetal thermostats on espresso machines, OLED/Mini-LED 144Hz vs 60Hz LED on displays, LiDAR vs bump navigation on robot vacuums, adaptive hybrid ANC on audio). Ensure buyers can explicitly choose between baseline technology and modern pro-grade technological maturity.

Output structure (generate valid JSON):
Respond STRICTLY as a valid JSON object:
{
  "keyword": "${categoryQuery}",
  "matchedDomain": "custom",
  "categoryName": "Shopping selection for ${categoryQuery}",
  "agentName": "Specialist: ${categoryQuery}",
  "description": "Shopping advisor for selecting ${categoryQuery} based on key technical specs and review insights.",
  "parameters": [
    {
      "id": "param_id_1",
      "name": "Short name (≤ 18 chars)",
      "category": "Parameter category",
      "importance": "mandatory",
      "rationale": "Short layperson explanation of why this matters.",
      "suggestedComponent": "chips",
      "suggestedValues": ["Option 1", "Option 2", "Option 3"],
      "isMultiSelect": true
    }
  ],
  "questions": [],
  "systemPrompt": "Expert shopping advisor for ${categoryQuery}..."
}`.trim() : `
${languageInstruction}

Jsi expertní nákupní analytik a technický specifikátor v expertním systému bAIright. Tvým úkolem je rozpadnout jakoukoliv uživatelem zadanou kategorii zboží na ucelený seznam nejkritičtějších parametrů, které musí kupující zvážit před finálním rozhodnutím (u komplexních inženýrských, sportovních a technologických kategorií 11 až 14 parametrů).

Vstupní entita (Zboží): "${categoryQuery}"${historySection}

Pravidla pro generování parametrů:

1. Diferencovaný rozsah & Přirozená saturace:
   - Komplexní inženýrské, sportovní, motoristické a technologické kategorie (jízdní kola, auta, notebooky/PC, espresso kávovary, Hi-Fi audio, aku nářadí, spotřebiče): Cílem je 11 až 14 parametrů. Je STRIKTNĚ ZAKÁZÁNO zastavit se předčasně na 8 položkách. Systematicky dekomponuj všechny klíčové konstrukční podsestavy a kritéria (u kol: materiál rámu, pohon/řazení, zapletená kola a materiál ráfků, brzdový systém, pláště a průchodnost rámu, technologie tlumení vibrací, kokpit/sedlovka, celková hmotnost kola, biometrie/velikost postavy a preferované značky).
   - Běžné spotřební zboží (batohy, oblečení, běžné nádobí): Cílem je 7 až 9 parametrů.
   - Specificky jednoduché předměty denní potřeby (keramický hrnek na kávu, sklenice, podložka pod myš): Cílem je 4 až 6 parametrů. STRIKTNĚ ZAKÁZÁNO vymýšlet umělou vatu, nerelevantní technologie (např. žádné tepelné pojistky či provozní napětí u hrnku) nebo vágní klišé jen pro splnění kvóty. Skonči přirozeně na hranici reálných nákupních rozdílů na trhu.

2. Komplexita: Parametry musí pokrývat celé spektrum výběru (u obecných kategorií 1-2 zaměřené na uživatelský kontext/účel a typologii trhu; u specifických podkategorií jdi rovnou do specializovaných technických parametrů bez duplicitních otázek na již zadaný účel). U produktů vázaných na tělo (kola, obuv, židle, lyže, matrace) VŽDY zařaď praktické biometrické a rozměrové parametry (výška postavy, délka nohou inseam, šířka chodidla, hmotnost) přímo navázané na reálné velikosti (např. XS až XL, velikost rámu 54/56cm, standard vs 2E široké chodidlo), nikoliv abstraktní žargon.

3. Srozumitelnost: Každý parametr musí mít krátký vysvětlující popis pro laika (rationale, max 100 znaků), proč je daná věc důležitá a jaké je riziko špatné volby na základě poznatků z recenzí a fór.

4. Kategorizace: Ke každému parametru navrhni typický formát odpovědi (suggestedComponent: "chips", "slider", "dropdown", "brands") a VŽDY uveď 3 až 5 nejběžnějších hodnot nebo příkladů z trhu v poli suggestedValues – i pro parametry kde jsou hodnoty individuální (např. velikost, materiál). NE prázdné pole, NE vynechání pole. suggestedValues slouží jako chips i jako příklady pro text pole. NEPOUŽÍVEJ suggestedComponent: "text" – místo toho použij "chips" a dej hodnotám smysluplné labely.

5. Izolace značek: ${brandParamInstruction} Poslední parametr MUSÍ mít id "brand_preferences", name "Značky a výrobci", category "Výrobci & Značky", suggestedComponent "brands".

6. Striktní zákaz klišé & statických fallbacků: STRIKTNÍ ZÁKAZ VÁGNÍCH KLIŠÉ ("Cena", "Barva", "Vzhled", "Kvalita", "Ergonomie"). Žádné šablonové fráze o montáži či spotřebě u ne-spotřebičů.

7. Ověření historie webu: Pokud již na našem webu proběhl dotaz na toto zboží, zohledni dříve nabízené parametry z databáze.

8. Nulová redundance & Hloubkový zoom kontextu (Zero Redundancy & Context Zooming): Pečlivě analyzuj vstupní dotaz uživatele. Pokud dotaz již explicitně specifikuje podkategorii, účel, styl nebo technologii (např. "silniční endurance kolo", "road endurance bike", "dual boiler espresso kávovar", "trailové běžecké boty s nulovým dropem", "herní notebook 144hz"):
   - STRIKTNÍ ZÁKAZ: Generovat parametry, které se znovu ptají na to, co je již v zadání rozhodnuto (např. NEPTAT SE na "Účel použití: závody vs. vytrvalost/endurance" ani na "Geometrie rámu: závodní vs. endurance", když uživatel výslovně zadal endurance silniční kolo).
   - HLOUBKOVÝ ZOOM: Místo obecné typologie nebo duplicitního účelu jdi o úroveň hlouběji do specifických technických nuancí dané podkategorie (např. u endurance silničního kola: technologie tlumení vibrací rámu/sedlovky, průchodnost plášťů 30–38 mm, převodový rozsah na stoupání, ergonomie řídítek, úchyty na brašny). Obecné rozdělení účelu a typologie zařaď POUZE tehdy, pokud je zadání široké nebo nejednoznačné (např. obecné "kolo" nebo "kávovar").

9. Technická & Technologická vyspělost: Vždy vyhodnoť inženýrskou generaci a úroveň technologické vyspělosti produktu (např. elektronické bezdrátové řazení Di2/AXS vs. mechanické lanko u kola; bezuhlíkový brushless motor vs. uhlíkový motor u nářadí; digitální PID regulace & duální bojler vs. bimetalový termostat u kávovaru; OLED/Mini-LED 144Hz vs. 60Hz LED u TV/monitorů; LiDAR laserová navigace vs. narážecí gyroskop u robotického vysavače; adaptivní hybridní ANC u sluchátek). Umožni kupujícímu explicitně zvolit mezi základní technologií a moderním špičkovým standardem.

Struktura výstupu (vygeneruj validní JSON):
Odpověz STRIKTNĚ jako validní JSON objekt:
{
  "keyword": "${categoryQuery}",
  "matchedDomain": "custom",
  "categoryName": "Nákupní výběr pro ${categoryQuery}",
  "agentName": "Specialista na ${categoryQuery}",
  "description": "Nákupní poradce pro výběr ${categoryQuery} zohledňující klíčové technické specifikace a recenze.",
  "parameters": [
    {
      "id": "param_id_1",
      "name": "Stručný název (≤ 18 znaků)",
      "category": "Kategorie parametru",
      "importance": "mandatory",
      "rationale": "Krátký vysvětlující popis pro laika, proč je daná věc důležitá.",
      "suggestedComponent": "chips",
      "suggestedValues": ["Možnost 1", "Možnost 2", "Možnost 3"],
      "isMultiSelect": true
    }
  ],
  "questions": [],
  "systemPrompt": "Expertní nákupní poradce pro ${categoryQuery}..."
}`.trim();

  // Route according to provider
  if (providerId === 'openai_gpt4o' || apiKey.startsWith('sk-proj-') || apiKey.startsWith('sk-')) {
    const failoverOpenAI = await ModelDiscoveryService.executeWithResilientFailover<DomainAnalysisResult>({
      providerId: 'openai_gpt4o',
      apiKey,
      executeFn: async (model) => {
        try {
          const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model,
              messages: [
                {
                  role: 'system',
                  content: isEn
                    ? 'You are an elite Parameter Research Agent specializing in deep analysis of purchasing decisions, reviews, and expert forums. You always include market segmentation as the first parameter, user biometrics, and a minimum of 8 parameters. You respond exclusively with valid JSON.'
                    : 'Jsi elitní Parameter Research Agent pro hloubkovou analýzu nákupních rozhodnutí, recenzí a odborných fór. Vždy dodržuješ elementární tržní segmentaci jako 1. parametr, biometrii uživatele a minimálně 10 parametrů. Odpovídáš výhradně validním JSONem.',
                },
                { role: 'user', content: metaPrompt },
              ],
              response_format: { type: 'json_object' },
              temperature: 0.2,
            }),
          });

          if (!res.ok) {
            const errText = await res.text();
            return { success: false, status: res.status, errorBody: errText };
          }

          const data = await res.json();
          const jsonText = data?.choices?.[0]?.message?.content;
          if (jsonText) {
            const parsed = JSON.parse(jsonText) as DomainAnalysisResult;
            return { success: true, data: parsed };
          }
          return { success: false, status: 200, errorBody: 'Empty content from OpenAI' };
        } catch (err: any) {
          return { success: false, error: err, errorBody: err?.message };
        }
      },
    });

    if (failoverOpenAI.result) {
      return failoverOpenAI.result;
    }
  }

  // Google Gemini API with dynamic resilient failover
  const failoverGemini = await ModelDiscoveryService.executeWithResilientFailover<DomainAnalysisResult>({
    providerId: 'google_gemini',
    apiKey,
    executeFn: async (model) => {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const hasThinkingSupport = model.includes('2.5') || model.includes('3.') || model.includes('latest');
        const generationConfig: Record<string, any> = {
          temperature: 0.2,
          maxOutputTokens: 5000,
          responseMimeType: 'application/json',
        };
        if (hasThinkingSupport) {
          generationConfig.thinkingConfig = { thinkingBudget: 0 };
        }
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(15000),
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: metaPrompt }] }],
            generationConfig,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const cleanJson = text.replace(/```json/gi, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanJson) as DomainAnalysisResult;
            return { success: true, data: parsed };
          }
          return { success: false, status: 200, errorBody: 'Empty text returned' };
        } else {
          const errBody = await response.text();
          return { success: false, status: response.status, errorBody: errBody };
        }
      } catch (err: any) {
        return { success: false, error: err, errorBody: err?.message };
      }
    },
  });

  if (failoverGemini.result) {
    return failoverGemini.result;
  }

  return null;
}
