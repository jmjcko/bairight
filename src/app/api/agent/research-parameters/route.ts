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
    const { query, locale = 'en', apiKey: bodyApiKey, providerId, purchasedHistory, userFacts } = await req.json();

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

    // ——— STEP 1: Cache lookup ———
    const cached = await getCachedAnalysis(trimmedQuery, locale);
    if (cached) {
      console.log(`[Luke] Cache HIT (${cached.source}): "${trimmedQuery}"`);
      return NextResponse.json({
        success: true,
        analysis: cached.analysis,
        source: cached.source,
      });
    }

    // ——— STEP 2: Key Resolution (Client BYOK or Server Env Keys) ———
    const effectiveKey =
      bodyApiKey ||
      process.env.GOOGLE_GEMINI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY;

    let analysis: DomainAnalysisResult | null = null;
    let source = 'luke_domain_discovery';

    if (effectiveKey) {
      try {
        console.log(`[Luke] Calling Gemini Flash research for: "${trimmedQuery}"`);
        analysis = await researchParametersWithLuke(trimmedQuery, effectiveKey, providerId || 'google_gemini', locale, purchasedHistory, userFacts);
        if (analysis && analysis.parameters && analysis.parameters.length >= 8) {
          source = 'luke_gemini_flash';
        }
      } catch (llmErr) {
        console.warn('[Luke] Live LLM call failed, activating domain parameter discovery:', llmErr);
      }
    }

    // High-yield domain parameter discovery if key missing or LLM call failed
    if (!analysis || !analysis.parameters || analysis.parameters.length < 8) {
      console.log(`[Luke] High-Yield Domain Parameter Discovery for: "${trimmedQuery}"`);
      analysis = discoverDomainParameters(trimmedQuery, locale);
      source = 'luke_domain_discovery';
    }

    // ——— STEP 3: Ensure brand parameter exists ———
    analysis.parameters = ensureBrandParameter(analysis.parameters, locale);

    // ——— STEP 4: Cache the result ———
    setCachedAnalysis(trimmedQuery, analysis, locale).catch((err) =>
      console.warn('[Luke] Cache write failed (non-critical):', err)
    );

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

You are an expert purchase analyst and technical specification writer in the bAIright system. Your task is to break down any user-specified product category into a list of 8 to 12 most critical parameters that a buyer must consider before making a final decision.

Input entity (Product): "${categoryQuery}"${historySection}

Parameter generation rules:

1. Scope: Generate strictly 8 to 12 parameters.

2. Complexity: Parameters must cover the full spectrum of the buying decision (1-2 focused on user context/purpose and market typology, the rest on key technical specifications typical for this product). For body-related products, include body biometrics and ergonomics.

3. Clarity: Each parameter must have a short explanatory description for a layperson (rationale, max 100 characters) explaining why it matters and what the risk of a wrong choice is, based on insights from reviews and forums.

4. Categorization: For each parameter, suggest a typical response format (suggestedComponent: "chips", "slider", "dropdown", "brands") and ALWAYS include 3 to 5 of the most common market values or examples in suggestedValues — even for parameters where values are individual (e.g. size, material). NO empty array, NO omitting the field. suggestedValues are used both as chips and as examples for text fields. DO NOT use suggestedComponent: "text" — instead use "chips" with meaningful labels.

5. Brand isolation: ${brandParamInstruction} The last parameter MUST have id "brand_preferences", name "Brands & Manufacturers", category "Brands & Manufacturers", suggestedComponent "brands".

6. Strict ban on clichés & static fallbacks: STRICTLY FORBIDDEN: vague clichés ("Price", "Color", "Appearance", "Quality", "Ergonomics"). No boilerplate phrases about installation space or power consumption for non-appliances.

7. History check: If a query for this product has been made on our platform before, take into account the previously offered parameters.

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

Jsi expertní nákupní analytik a technický specifikátor v expertním systému bAIright. Tvým úkolem je rozpadnout jakoukoliv uživatelem zadanou kategorii zboží na seznam 8 až 12 nejkritičtějších parametrů, které musí kupující zvážit před finálním rozhodnutím.

Vstupní entita (Zboží): "${categoryQuery}"${historySection}

Pravidla pro generování parametrů:

1. Rozsah: Vygeneruj striktně 8 až 12 parametrů.

2. Komplexita: Parametry musí pokrývat celé spektrum výběru (1-2 zaměřené na uživatelský kontext/účel a typologii trhu, zbytek na klíčové technické specifikace typické pro dané zboží). U produktů vázaných na tělo zařaď biometrii a ergonomii.

3. Srozumitelnost: Každý parametr musí mít krátký vysvětlující popis pro laika (rationale, max 100 znaků), proč je daná věc důležitá a jaké je riziko špatné volby na základě poznatků z recenzí a fór.

4. Kategorizace: Ke každému parametru navrhni typický formát odpovědi (suggestedComponent: "chips", "slider", "dropdown", "brands") a VŽDY uveď 3 až 5 nejběžnějších hodnot nebo příkladů z trhu v poli suggestedValues – i pro parametry kde jsou hodnoty individuální (např. velikost, materiál). NE prázdné pole, NE vynechání pole. suggestedValues slouží jako chips i jako příklady pro text pole. NEPOUŽÍVEJ suggestedComponent: "text" – místo toho použij "chips" a dej hodnotám smysluplné labely.

5. Izolace značek: ${brandParamInstruction} Poslední parametr MUSÍ mít id "brand_preferences", name "Značky a výrobci", category "Výrobci & Značky", suggestedComponent "brands".

6. Striktní zákaz klišé & statických fallbacků: STRIKTNÍ ZÁKAZ VÁGNÍCH KLIŠÉ ("Cena", "Barva", "Vzhled", "Kvalita", "Ergonomie"). Žádné šablonové fráze o montáži či spotřebě u ne-spotřebičů.

7. Ověření historie webu: Pokud již na našem webu proběhl dotaz na toto zboží, zohledni dříve nabízené parametry z databáze.

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
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: metaPrompt }] }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 5000,
              responseMimeType: 'application/json',
            },
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
