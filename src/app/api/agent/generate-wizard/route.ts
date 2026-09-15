import { NextRequest, NextResponse } from 'next/server';
import { UniversalAgentDefinition } from '@/lib/agent/universal-agent-schema';
import { 
  discoverDomainParameters, 
  buildAgentFromDomainAnalysis,
  DomainAnalysisResult 
} from '@/lib/agent/domain-parameter-discovery';

export async function POST(req: NextRequest) {
  try {
    const { prompt, providerId, apiKey, customParameters, locale = 'cs' } = await req.json();

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: locale === 'en' ? 'Please enter a product description or category.' : 'Zadejte prosím popis produktu nebo kategorii, kterou chcete vybrat.' },
        { status: 400 }
      );
    }

    const trimmedPrompt = prompt.trim();
    
    // 1. Perform domain parameter discovery and ontology mapping
    const domainAnalysis: DomainAnalysisResult = discoverDomainParameters(trimmedPrompt);

    // 2. Try real LLM dynamic generation if an API key is available
    const effectiveKey = apiKey || (
      providerId === 'google_gemini' ? process.env.GOOGLE_GEMINI_API_KEY :
      providerId === 'openai_gpt4o' ? process.env.OPENAI_API_KEY :
      providerId === 'anthropic_claude' ? process.env.ANTHROPIC_API_KEY :
      process.env.GOOGLE_GEMINI_API_KEY || process.env.OPENAI_API_KEY
    );

    let generatedAgent: UniversalAgentDefinition | null = null;

    if (effectiveKey) {
      try {
        const effectiveAnalysis = (customParameters && customParameters.length > 0)
          ? { ...domainAnalysis, parameters: customParameters }
          : domainAnalysis;
        generatedAgent = await generateAgentWithLLM(trimmedPrompt, effectiveAnalysis, effectiveKey, providerId, locale);
      } catch (llmErr) {
        console.warn('Dynamic LLM wizard generation failed, using domain discovery heuristics:', llmErr);
      }
    }

    // 3. Fallback to specialized domain heuristic synthesizer
    if (!generatedAgent) {
      generatedAgent = buildAgentFromDomainAnalysis(domainAnalysis, customParameters);
    }

    return NextResponse.json({
      success: true,
      agent: generatedAgent,
      analysis: {
        keyword: domainAnalysis.keyword,
        matchedDomain: domainAnalysis.matchedDomain,
        categoryName: domainAnalysis.categoryName,
        agentName: domainAnalysis.agentName,
        description: domainAnalysis.description,
        parameters: domainAnalysis.parameters,
      },
    });
  } catch (error: any) {
    console.error('Error generating wizard schema:', error);
    return NextResponse.json(
      { error: 'Chyba při generování nákupního průvodce.' },
      { status: 500 }
    );
  }
}

/**
 * Invokes LLM (Google Gemini by default or OpenAI) to synthesize a tailored wizard schema
 * using the extracted domain parameters as specialized guidance.
 */
async function generateAgentWithLLM(
  userIntent: string,
  domainAnalysis: DomainAnalysisResult,
  apiKey: string,
  providerId?: string,
  locale: string = 'cs'
): Promise<UniversalAgentDefinition> {
  const isEn = locale === 'en';
  const languageInstruction = isEn
    ? `IMPORTANT: The user interface is in English. You MUST generate the agent name, category, description, systemPrompt, question titles, subtitles, options, and promptForgeTemplates in fluent English.`
    : `DŮLEŽITÉ: Veškeré texty (název agenta, popis, otázky, možnosti, systémový prompt) musí být v přirozené češtině.`;

  const paramsSummary = domainAnalysis.parameters
    .map((p) => `- **${p.name}** (${p.importance}): ${p.rationale}`)
    .join('\n');

  const metaPrompt = `
${languageInstruction}

Jsi špičkový AI Product Strategist a doménový nákupní expert v systému bAIright.
Uživatel chce koupit produkt a zadal klíčové slovo / záměr: "${userIntent}".

Detekované klíčové parametry pro tuto kategorii:
${paramsSummary}

Tvým úkolem je:
1. Navrhnout specializovaného nákupního poradce (Agenta) s precizním systémovým promptem obsahujícím reálná doménová pravidla a kontraindikace (kdy produkt nekoupit).
2. Sestavit pro něj interaktivní dotazník (wizard) z 3 až 5 otázek zaměřených přímo na klíčové parametry tohoto produktu (např. pro obuv: došlap/pronace, povrch, tlumení, šířka; pro kávovar: typ přípravy, mléko, mlýnek; pro židli: doba sezení, bederní opora, potah).
Povolené UI komponenty:
- "chips" (přepínací tlačítka pro 2-4 možnosti, isMultiSelect: true/false)
- "slider" (posuvník pro čísla: rozpočet, rozměry, hodiny, váha, objem)
- "dropdown" (rozbalovací seznam)

Odpověz STRIKTNĚ jako validní JSON bez jakéhokoliv markdownového obalu (\`\`\`json).
Struktura JSON:
{
  "id": "kratky-unikatni-slug",
  "name": "${isEn ? 'Clear Agent Name in English' : 'Výstižný název agenta (česky)'}",
  "category": "${domainAnalysis.categoryName}",
  "icon": "${domainAnalysis.icon}",
  "version": "1.0.0",
  "description": "${isEn ? 'One-sentence description of how this agent helps choose the best product.' : 'Jednovětý popis toho, jak agent pomáhá vybrat nejlepší model.'}",
  "systemPrompt": "${isEn ? 'Detailed expert system instruction in English with evaluation criteria, contraindications and recommendations of 3 real market models.' : 'Detailní expertní systémová instrukce s pravidly pro vyhodnocení, kontraindikacemi a doporučením 3 konkrétních reálných modelů z trhu.'}",
  "questions": [
    {
      "id": "identifikator_otazky",
      "step": 1,
      "title": "Stručný a jasný název otázky",
      "subtitle": "Vysvětlující text proč na parametru záleží",
      "component": "chips",
      "isMultiSelect": false,
      "options": [
        { "label": "Text volby", "value": "hodnota", "description": "Krátké vysvětlení" }
      ],
      "defaultValue": "hodnota",
      "promptForgeTemplate": "- **Parametr:** {value}"
    }
  ]
}
`.trim();

  // Call Google Gemini API
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: metaPrompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from LLM');

  const cleanJson = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(cleanJson);

  return {
    ...parsed,
    createdAt: new Date().toISOString(),
    isCustom: true,
  };
}
