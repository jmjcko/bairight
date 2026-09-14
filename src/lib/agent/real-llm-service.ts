import { IntakeFormData, AgentPrescriptionResult } from './markdown-agent-loader';
import { EUROPEAN_CATALOG_2E_MODELS } from './tools/scan-eshops';
import { ShoeRecommendation } from './types';

export interface RealAIEvaluationOptions {
  providerId?: 'bairight_core' | 'google_gemini' | 'openai_gpt4o' | 'anthropic_claude';
  apiKey?: string;
  ragFacts?: Array<{ id: string; fact: string; category: string }>;
}

/**
 * Normalizes and parses JSON string safely even if wrapped in markdown codeblocks
 */
/**
 * Brand-specific high-resolution shoe imagery fallbacks
 */
const BRAND_FALLBACK_IMAGES: Record<string, string> = {
  hoka: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
  asics: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=600&q=80',
  brooks: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=600&q=80',
  'new balance': 'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=600&q=80',
  saucony: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=600&q=80',
  altra: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=600&q=80',
  'on running': 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=600&q=80',
  nike: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
  adidas: 'https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?auto=format&fit=crop&w=600&q=80',
  mizuno: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=600&q=80',
};

/**
 * Normalizes and parses JSON string safely even if wrapped in markdown codeblocks
 */
function safeJsonParse<T>(text: string): T | null {
  try {
    const cleaned = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    return JSON.parse(cleaned) as T;
  } catch (err) {
    console.error('Failed to parse LLM JSON response:', err, '\nRaw text was:\n', text);
    return null;
  }
}

/**
 * Post-processes and sanitizes LLM recommendations to guarantee valid fields
 */
export const ALL_KNOWN_BRANDS = [
  'Hoka', 
  'Asics', 
  'Brooks', 
  'New Balance', 
  'Saucony', 
  'Altra', 
  'On Running', 
  'Nike', 
  'Adidas', 
  'Mizuno', 
  'Puma', 
  'Salomon', 
  'Topo Athletic', 
  'Inov-8', 
  'Craft', 
  'Under Armour'
];

/**
 * Post-processes and sanitizes LLM recommendations to guarantee valid fields and strict brand compliance
 */
function sanitizeLLMResult(parsed: AgentPrescriptionResult, formData: IntakeFormData): AgentPrescriptionResult {
  if (!parsed || !parsed.recommendations || !Array.isArray(parsed.recommendations)) {
    return parsed;
  }

  const preferred = (formData.preferred_brands || []).map((b) => b.trim()).filter(Boolean);
  let forbidden = (formData.forbidden_brands || []).map((b) => b.trim()).filter(Boolean);

  if (preferred.length > 0) {
    const unselected = ALL_KNOWN_BRANDS.filter(
      (b) => !preferred.some((p) => p.toLowerCase() === b.toLowerCase())
    );
    forbidden = Array.from(new Set([...forbidden, ...unselected]));
  }

  const preferredLower = preferred.map((b) => b.toLowerCase());
  const forbiddenLower = forbidden.map((b) => b.toLowerCase());

  // Filter out any recommendation that violates brand rules
  let validRecs = parsed.recommendations.filter((rec) => {
    const brandLower = (rec.brand || '').toLowerCase();
    if (forbiddenLower.some((fb) => brandLower.includes(fb) || fb.includes(brandLower))) {
      console.warn(`[bAIright Sanitizer] Excluded forbidden brand: ${rec.brand} ${rec.model}`);
      return false;
    }
    if (preferredLower.length > 0 && !preferredLower.some((pb) => brandLower.includes(pb) || pb.includes(brandLower))) {
      console.warn(`[bAIright Sanitizer] Excluded non-preferred brand: ${rec.brand} ${rec.model}`);
      return false;
    }
    return true;
  });

  // Allowed catalog models for safe fallback/backfill
  const allowedCatalog = EUROPEAN_CATALOG_2E_MODELS.filter((shoe) => {
    const bLower = shoe.brand.toLowerCase();
    if (forbiddenLower.some((fb) => bLower.includes(fb))) return false;
    if (preferredLower.length > 0 && !preferredLower.some((pb) => bLower.includes(pb))) return false;
    return true;
  });

  // If LLM returned fewer than 3 valid compliant models, backfill from allowed catalog
  for (const catShoe of allowedCatalog) {
    if (validRecs.length >= 3) break;
    if (!validRecs.some((r) => r.brand.toLowerCase() === catShoe.brand.toLowerCase() && r.model === catShoe.model)) {
      validRecs.push({
        ...catShoe,
        matchScore: 95,
        matchReasons: ['Ověřený certifikovaný model z vybraných povolených značek'],
      });
    }
  }

  const sanitizedRecs = validRecs.map((rec, index) => {
    const brandLower = (rec.brand || '').toLowerCase();
    const fallbackImage = BRAND_FALLBACK_IMAGES[brandLower] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80';
    
    // Ensure image is valid
    const image_url = (rec.image_url && rec.image_url.startsWith('http')) 
      ? rec.image_url 
      : fallbackImage;

    const brandName = rec.brand || 'Běžecká obuv';
    const modelName = rec.model || `Model ${index + 1}`;
    const searchParam = encodeURIComponent(`${brandName} ${modelName} EU ${formData.eu_size || 43}`);

    return {
      id: rec.id || `rec-${index}-${Date.now()}`,
      brand: brandName,
      model: modelName,
      category: rec.category || 'Running',
      image_url,
      cushion_level: rec.cushion_level || 'Maximum',
      heel_drop_mm: typeof rec.heel_drop_mm === 'number' ? rec.heel_drop_mm : 6,
      weight_g: typeof rec.weight_g === 'number' ? rec.weight_g : 295,
      available_widths: rec.available_widths?.length ? rec.available_widths : ['Standard (D)', 'Wide (2E)'],
      is_2e_available: rec.is_2e_available ?? true,
      european_price_eur: typeof rec.european_price_eur === 'number' ? rec.european_price_eur : (formData.budget_eur || 179),
      retailer_name: rec.retailer_name || 'Top4Running / Heureka.cz',
      retailer_url: rec.retailer_url || `https://www.heureka.cz/?h%5Bfraze%5D=${searchParam}`,
      stock_status: rec.stock_status || 'In Stock',
      medical_rationale: rec.medical_rationale || 'Vynikající biomechanické tlumení pro ochranu kolenních kloubů a široké kopyto.',
      knee_oa_rating: rec.knee_oa_rating || 'Optimal',
      rocker_geometry: rec.rocker_geometry ?? true,
      matchScore: typeof rec.matchScore === 'number' ? rec.matchScore : (96 - index * 2),
      matchReasons: Array.isArray(rec.matchReasons) && rec.matchReasons.length > 0 
        ? rec.matchReasons 
        : ['Odpovídá šířce kopyta', 'Optimální tlumení nárazů'],
    };
  });

  return {
    ...parsed,
    recommendations: sanitizedRecs,
  };
}

/**
 * Builds the comprehensive prompt for the LLM based on user intake & verified models
 */
export function buildEvaluationPrompt(formData: IntakeFormData, ragFacts?: Array<{ fact: string; category: string }>): string {
  const preferred = (formData.preferred_brands || []).map((b) => b.trim()).filter(Boolean);
  let forbidden = (formData.forbidden_brands || []).map((b) => b.trim()).filter(Boolean);

  // If user selected specific preferred brands, ANY other brand is automatically forbidden!
  if (preferred.length > 0) {
    const unselected = ALL_KNOWN_BRANDS.filter(
      (b) => !preferred.some((p) => p.toLowerCase() === b.toLowerCase())
    );
    forbidden = Array.from(new Set([...forbidden, ...unselected]));
  }

  const preferredLower = preferred.map((b) => b.toLowerCase());
  const forbiddenLower = forbidden.map((b) => b.toLowerCase());

  // Filter sample catalog strictly: ONLY allowed brands appear in the prompt context!
  const filteredCatalog = EUROPEAN_CATALOG_2E_MODELS.filter((shoe) => {
    const bLower = shoe.brand.toLowerCase();
    if (forbiddenLower.some((fb) => bLower.includes(fb))) return false;
    if (preferredLower.length > 0 && !preferredLower.some((pb) => bLower.includes(pb))) return false;
    return true;
  });

  const verifiedCatalogSummary = filteredCatalog.map((m) => ({
    id: m.id,
    brand: m.brand,
    model: m.model,
    drop: `${m.heel_drop_mm} mm`,
    cushion: m.cushion_level,
    rocker: m.rocker_geometry ? 'Ano' : 'Ne',
    widths: m.available_widths.join(', '),
    price: `${m.european_price_eur} EUR`,
  }));

  const factsSummary = ragFacts && ragFacts.length > 0 
    ? ragFacts.map(f => `- [${f.category}] ${f.fact}`).join('\n')
    : 'Žádná dodatečná fakta z předchozích sezení.';

  const brandDirectives = preferred.length > 0
    ? `
### KRITICKÉ PRAVIDLO PRO ZNAČKY (PŘÍSNÁ RESTRICE):
- **VÝHRADNĚ POVOLENÉ ZNAČKY:** ${preferred.join(', ')}
- **PŘÍSNĚ ZAKÁZANÉ ZNAČKY (NESMÍ BÝT DOPORUČENY):** ${forbidden.join(', ')}
- **PŘÍKAZ:** Uživatel si přeje doporučit boty POUZE od značek: [${preferred.join(', ')}]. Je PŘÍSNĚ ZAKÁZÁNO doporučit jakýkoliv model od jiné značky (např. ${forbidden.slice(0, 4).join(', ')}). Jakékoliv porušení tohoto pravidla je nepřípustné!`
    : forbidden.length > 0
    ? `
### PRAVIDLO PRO ZNAČKY:
- **ZAKÁZANÉ ZNAČKY:** ${forbidden.join(', ')}. Nikdy tyto značky nenavrhuj!`
    : `
### PRAVIDLO PRO ZNAČKY:
- Všechny značky jsou povoleny.`;

  return `
Jsi špičkový biomechanický a ergonomický specialista bAIright pro výběr běžecké a chodecké obuvi.
Analyzuj následující biometrický dotazník uživatele a vyber 3 až 4 nejvhodnější modely obuvi.

### VSTUPNÍ DATA UŽIVATELE:
- **Kategorie:** ${formData.product_category || 'running_shoes'}
- **Velikost obuvi:** EU ${formData.eu_size || 'Neuvedeno'} (Délka: ${formData.foot_length_mm || 275} mm)
- **Šířka kopyta:** ${formData.foot_width} (Šířka v kloubech: ${formData.foot_width_mm || 104} mm)
- **Zóna dopadu (Strike pattern):** ${formData.strike_pattern}
- **Biomechanika / rotace hlezna:** ${formData.foot_mechanics}
- **Týdenní objem a aktivita:** ${formData.weekly_volume || '15_to_35_km'}, aktivity: ${(formData.activity_type || []).join(', ')}
- **Citlivost kolen a specifika:** ${(formData.joint_conditions || []).join(', ') || 'Bez hlášené artrózy'}
- **Orientační rozpočet:** do ${formData.budget_eur || 190} EUR
${brandDirectives}

### PAMĚŤOVÁ FAKTA Z RAG DATABÁZE UŽIVATELE:
${factsSummary}

### DOSTUPNÉ CERTIFIKOVANÉ MODELY OD POVOLENÝCH ZNAČEK:
${JSON.stringify(verifiedCatalogSummary, null, 2)}

Můžeš doporučit buď modely z tohoto ověřeného seznamu, nebo jakékoliv jiné reálné, špičkové modely výhradně od povolených značek (${preferred.length > 0 ? preferred.join(', ') : 'všech povolených'}).

### PRAVIDLA PRO VYHODNOCENÍ:
1. **STRIKTNÍ DODRŽENÍ ZNAČEK:** Nikdy nedoporučuj značku ze zakázaných značek!
2. **Citlivost kolen:** Pokud má uživatel citlivá kolena / artrózu, preferuj boty s kolébkovou podešví (rocker), dropem 4–8 mm a vysokým tlumením.
3. **Šířka kopyta:** Pokud má 2E nebo 4E, boty musí mít široký anatomický prostor pro prsty.
4. **Jazyk:** Veškerá vysvětlení piš česky (přátelský, profesionální, srozumitelný tón).

### VÝSTUPNÍ FORMÁT (POUZE ČISTÝ JSON):
Vrať POUZE validní JSON bez markdownu, který přesně odpovídá této struktuře:
{
  "agentName": "bAIright Footwear Intelligence Agent",
  "agentVersion": "2.0-Live-LLM",
  "evaluatedAt": "${new Date().toISOString()}",
  "profileSummary": {
    "category": "Běžecká a regenerační obuv",
    "sizeDesc": "EU ${formData.eu_size || 43} (${formData.foot_length_mm || 275} mm)",
    "widthDesc": "${formData.foot_width} (${formData.foot_width_mm || 104} mm)",
    "gaitDesc": "${formData.strike_pattern} • ${formData.foot_mechanics}",
    "medicalHighlights": ["${(formData.joint_conditions || []).join('", "')}"],
    "surgeryHighlights": [],
    "brandRules": {
      "preferred": ${JSON.stringify(preferred)},
      "forbidden": ${JSON.stringify(forbidden)}
    }
  },
  "clinicalAssessment": "Stručný a výstižný český biomechanický posudek (2-3 odstavce) vysvětlující, proč jsou vybrané boty pro uživatele ideální a jak mu uleví.",
  "contraindications": [
    "Doporučení čeho se vyvarovat 1",
    "Doporučení čeho se vyvarovat 2"
  ],
  "recommendations": [
    {
      "id": "model-id-slug",
      "brand": "Název značky",
      "model": "Název modelu včetně specifikace kopyta (např. Bondi 8 Wide 2E)",
      "category": "Running",
      "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
      "cushion_level": "Maximum",
      "heel_drop_mm": 5,
      "weight_g": 305,
      "available_widths": ["Standard (D)", "Wide (2E)"],
      "is_2e_available": true,
      "european_price_eur": 170,
      "retailer_name": "Oficiální EU distribuce",
      "retailer_url": "https://www.google.com/search?q=koupit+model+heureka",
      "stock_status": "In Stock",
      "medical_rationale": "Přesné biomechanické vysvětlení, proč tento model chrání kolena/chodidlo.",
      "knee_oa_rating": "Optimal",
      "rocker_geometry": true,
      "matchScore": 96,
      "matchReasons": [
        "Důvod shody 1",
        "Důvod shody 2"
      ]
    }
  ]
}
`.trim();
}

/**
 * Evaluates with Google Gemini API with dynamic model discovery and clean error parsing
 */
async function callGemini(apiKey: string, prompt: string): Promise<AgentPrescriptionResult | null> {
  // 1. First, attempt to discover available models for this specific API key
  let candidateModels: string[] = [];
  try {
    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (listRes.ok) {
      const listData = await listRes.json();
      const models = listData?.models || [];
      const supported = models
        .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
        .map((m: any) => m.name.replace(/^models\//, ''));

      // Sort with modern fast models prioritized
      supported.sort((a: string, b: string) => {
        const score = (name: string) => {
          if (name.includes('2.5-flash')) return 10;
          if (name.includes('2.0-flash')) return 9;
          if (name.includes('flash-latest')) return 8;
          if (name.includes('1.5-flash')) return 7;
          if (name.includes('flash')) return 6;
          if (name.includes('pro')) return 5;
          return 1;
        };
        return score(b) - score(a);
      });

      if (supported.length > 0) {
        candidateModels = supported;
      }
    }
  } catch (discoveryErr) {
    console.warn('Gemini model discovery skipped:', discoveryErr);
  }

  // Fallback defaults if discovery returned nothing
  if (candidateModels.length === 0) {
    candidateModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-flash', 'gemini-pro'];
  }

  let lastHumanError = '';

  for (const model of candidateModels.slice(0, 4)) {
    // Try v1beta first, and support both with/without JSON mimeType
    const endpoints = [
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`,
    ];

    for (const url of endpoints) {
      try {
        // Attempt with responseMimeType
        let response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json',
            },
          }),
        });

        // If response failed with 400 (e.g. responseMimeType not supported on this model), try plain text
        if (!response.ok && response.status === 400) {
          response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.2,
              },
            }),
          });
        }

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const errMsg = errData?.error?.message || `HTTP ${response.status}`;
          if (response.status === 400 && (errMsg.includes('API_KEY_INVALID') || errMsg.includes('not valid'))) {
            throw new Error('Neplatný Google Gemini API klíč. Zkontrolujte svůj klíč v Google AI Studio.');
          }
          if (response.status === 429 || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) {
            throw new Error('Byla vyčerpána bezplatná kvóta pro váš Google Gemini klíč. Zkuste to za chvíli nebo použijte OpenAI/Claude.');
          }
          lastHumanError = `Model ${model} vrátil: ${errMsg}`;
          continue;
        }

        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = safeJsonParse<AgentPrescriptionResult>(rawText);
          if (parsed) return parsed;
        }
      } catch (e: any) {
        if (e.message?.includes('Neplatný') || e.message?.includes('vyčerpána')) {
          throw e;
        }
        lastHumanError = e.message || String(e);
      }
    }
  }

  throw new Error(lastHumanError || 'Žádný z modelů Google Gemini není pro váš klíč dostupný.');
}

/**
 * Evaluates with OpenAI ChatGPT (GPT-4o) API
 */
async function callOpenAI(apiKey: string, prompt: string): Promise<AgentPrescriptionResult | null> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You are bAIright Footwear Intelligence Agent. Respond only with valid JSON.' },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const rawText = data?.choices?.[0]?.message?.content;
  if (!rawText) throw new Error('Empty response from OpenAI API');

  return safeJsonParse<AgentPrescriptionResult>(rawText);
}

/**
 * Evaluates with Anthropic Claude API
 */
async function callAnthropic(apiKey: string, prompt: string): Promise<AgentPrescriptionResult | null> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 3500,
      temperature: 0.2,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Anthropic Claude API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const rawText = data?.content?.[0]?.text;
  if (!rawText) throw new Error('Empty response from Anthropic Claude API');

  return safeJsonParse<AgentPrescriptionResult>(rawText);
}

/**
 * Main dispatcher: Evaluates intake form using real configured LLM or environment keys
 */
export async function evaluateWithRealLLM(
  formData: IntakeFormData,
  options: RealAIEvaluationOptions = {}
): Promise<{ result: AgentPrescriptionResult; providerUsed: string }> {
  // Determine effective provider & key (from options or server env)
  const envGemini = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  const envOpenAI = process.env.OPENAI_API_KEY;
  const envAnthropic = process.env.ANTHROPIC_API_KEY;

  let provider = options.providerId || 'bairight_core';
  let key = options.apiKey?.trim();

  // Smart provider auto-detection if key is present but provider is default
  if (key && (provider === 'bairight_core' || !provider)) {
    if (key.startsWith('sk-ant-')) {
      provider = 'anthropic_claude';
    } else if (key.startsWith('AIza')) {
      provider = 'google_gemini';
    } else if (key.startsWith('sk-')) {
      provider = 'openai_gpt4o';
    }
  }

  // 1. If user has an explicit key provided via BYOK
  if (key) {
    if (provider === 'google_gemini') {
      const parsed = await callGemini(key, buildEvaluationPrompt(formData, options.ragFacts));
      if (parsed) return { result: sanitizeLLMResult(parsed, formData), providerUsed: 'Google Gemini (BYOK)' };
    } else if (provider === 'openai_gpt4o') {
      const parsed = await callOpenAI(key, buildEvaluationPrompt(formData, options.ragFacts));
      if (parsed) return { result: sanitizeLLMResult(parsed, formData), providerUsed: 'OpenAI GPT-4o (BYOK)' };
    } else if (provider === 'anthropic_claude') {
      const parsed = await callAnthropic(key, buildEvaluationPrompt(formData, options.ragFacts));
      if (parsed) return { result: sanitizeLLMResult(parsed, formData), providerUsed: 'Claude 3.5 Sonnet (BYOK)' };
    }
  }

  // 2. If server environment has keys configured
  if (envGemini) {
    const parsed = await callGemini(envGemini, buildEvaluationPrompt(formData, options.ragFacts));
    if (parsed) return { result: sanitizeLLMResult(parsed, formData), providerUsed: 'Google Gemini (Server Env)' };
  } else if (envOpenAI) {
    const parsed = await callOpenAI(envOpenAI, buildEvaluationPrompt(formData, options.ragFacts));
    if (parsed) return { result: sanitizeLLMResult(parsed, formData), providerUsed: 'OpenAI GPT-4o (Server Env)' };
  } else if (envAnthropic) {
    const parsed = await callAnthropic(envAnthropic, buildEvaluationPrompt(formData, options.ragFacts));
    if (parsed) return { result: sanitizeLLMResult(parsed, formData), providerUsed: 'Claude 3.5 Sonnet (Server Env)' };
  }

  throw new Error('NO_API_KEY_CONFIGURED');
}

