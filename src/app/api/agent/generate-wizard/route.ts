import { NextRequest, NextResponse } from 'next/server';
import { UniversalAgentDefinition, WizardQuestion, resolveAgentIcon } from '@/lib/agent/universal-agent-schema';
import { ModelDiscoveryService } from '@/lib/agent/model-discovery-service';
import { 
  discoverDomainParameters, 
  buildAgentFromDomainAnalysis,
  DomainAnalysisResult,
  ExtractedDomainParameter
} from '@/lib/agent/domain-parameter-discovery';

export async function POST(req: NextRequest) {
  try {
    const { prompt, providerId, apiKey, customParameters, locale = 'en' } = await req.json();

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: locale === 'en' ? 'Please enter a product description or category.' : 'Zadejte prosím popis produktu nebo kategorii, kterou chcete vybrat.' },
        { status: 400 }
      );
    }

    const trimmedPrompt = prompt.trim();
    
    // 1. Perform domain parameter discovery and ontology mapping
    const domainAnalysis: DomainAnalysisResult = discoverDomainParameters(trimmedPrompt, locale);

    // 2. Try real LLM dynamic generation if an API key is available
    const effectiveKey = apiKey || (
      providerId === 'google_gemini' ? process.env.GOOGLE_GEMINI_API_KEY :
      providerId === 'openai_gpt4o' ? process.env.OPENAI_API_KEY :
      providerId === 'anthropic_claude' ? process.env.ANTHROPIC_API_KEY :
      process.env.GOOGLE_GEMINI_API_KEY || process.env.OPENAI_API_KEY
    );

    let generatedAgent: UniversalAgentDefinition | null = null;
    const effectiveParameters = (customParameters && customParameters.length > 0)
      ? customParameters
      : domainAnalysis.parameters;

    if (effectiveKey) {
      try {
        const effectiveAnalysis = { ...domainAnalysis, parameters: effectiveParameters };
        generatedAgent = await generateAgentWithLLM(trimmedPrompt, effectiveAnalysis, effectiveKey, providerId, locale);
      } catch (llmErr) {
        console.warn('Dynamic LLM wizard generation failed, using domain discovery heuristics:', llmErr);
      }
    }

    // 3. Fallback to specialized domain heuristic synthesizer
    if (!generatedAgent) {
      generatedAgent = buildAgentFromDomainAnalysis(domainAnalysis, effectiveParameters, locale);
    }

    // 4. Guarantee every parameter has its own dedicated question step
    if (generatedAgent && effectiveParameters && effectiveParameters.length > 0) {
      generatedAgent = ensureAllParametersHaveQuestions(generatedAgent, effectiveParameters, locale);
    }

    if (generatedAgent) {
      generatedAgent.icon = resolveAgentIcon(generatedAgent.icon, `${generatedAgent.name} ${generatedAgent.category}`);
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
        parameters: effectiveParameters,
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
 * Ensures that every parameter in the selection has a corresponding question in the wizard,
 * and that each question receives a sequential step number (1-to-1 mapping).
 */
function ensureAllParametersHaveQuestions(
  agent: UniversalAgentDefinition,
  parameters: ExtractedDomainParameter[],
  locale: string = 'cs'
): UniversalAgentDefinition {
  const isEn = locale === 'en';
  const existingQuestions: WizardQuestion[] = [...(agent.questions || [])];

  for (const param of parameters) {
    const isBrand = param.id === 'brand_preferences' || param.id.includes('brand') || param.name.toLowerCase().includes('značk') || param.name.toLowerCase().includes('výrobc');
    
    // Check if this parameter is already covered by an existing question
    const alreadyCovered = existingQuestions.some((q) => {
      if (isBrand && (q.component === 'brands' || q.id === 'brand_preferences' || q.id.includes('brand') || q.title.toLowerCase().includes('značk'))) {
        return true;
      }
      return q.id === param.id || q.id.includes(param.id) || q.title.toLowerCase().includes(param.name.toLowerCase()) || param.name.toLowerCase().includes(q.title.toLowerCase());
    });

    if (!alreadyCovered) {
      if (isBrand) {
        existingQuestions.push({
          id: param.id,
          step: existingQuestions.length + 1,
          title: param.name || (isEn ? 'Preferred & Forbidden Brands' : 'Preferované a zakázané značky'),
          subtitle: param.rationale || (isEn ? 'Specify preferred and forbidden brands.' : 'Napište výrobce, které preferujete a které chcete vyloučit.'),
          component: 'brands',
          isMultiSelect: false,
          defaultValue: { preferred: '', forbidden: '' },
          promptForgeTemplate: isEn ? `- **Manufacturer & Brand Rules:** {value}` : `- **Pravidla pro výrobce & značky:** {value}`,
        });
      } else {
        const rawOptions = (param.suggestedValues && param.suggestedValues.length > 0)
          ? param.suggestedValues.map((v, idx) => {
              const parenMatch = v.match(/^([^(]+?)\s*\(([^)]+)\)$/);
              if (parenMatch) {
                return {
                  label: parenMatch[1].trim(),
                  description: parenMatch[2].trim(),
                  value: parenMatch[1].toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || `opt_${idx}`,
                };
              }
              const colonMatch = v.match(/^([^:]+?)\s*:\s*(.+)$/);
              if (colonMatch) {
                return {
                  label: colonMatch[1].trim(),
                  description: colonMatch[2].trim(),
                  value: colonMatch[1].toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || `opt_${idx}`,
                };
              }
              return {
                label: v.trim(),
                value: v.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || `opt_${idx}`,
              };
            })
          : null;

        if (!rawOptions || rawOptions.length === 0) {
          existingQuestions.push({
            id: param.id,
            step: existingQuestions.length + 1,
            title: param.name,
            subtitle: param.rationale || '',
            component: 'text',
            isMultiSelect: false,
            defaultValue: '',
            promptForgeTemplate: `- **${param.name}:** {value}`,
          });
        } else {
          existingQuestions.push({
            id: param.id,
            step: existingQuestions.length + 1,
            title: param.name,
            subtitle: param.rationale || '',
            component: param.suggestedComponent === 'slider' ? 'slider' : 'chips',
            isMultiSelect: param.suggestedComponent !== 'slider',
            options: rawOptions,
            defaultValue: undefined,
            promptForgeTemplate: `- **${param.name}:** {value}`,
          });
        }
      }
    }
  }

  // Enforce sequential 1-based step numbers so each question is strictly its own step
  const sequentialQuestions = existingQuestions.map((q, idx) => ({
    ...q,
    step: idx + 1,
  }));

  return {
    ...agent,
    questions: sequentialQuestions,
  };
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
2. Sestavit pro něj interaktivní dotazník (wizard) s PŘESNĚ JEDNOU OTÁZKOU NA KAŽDÝ Z UVEDENÝCH PARAMETRŮ výše — tedy celkem ${domainAnalysis.parameters.length} otázek. ŽÁDNOU otázku nevynechej, ŽÁDNOU nepřidávej navíc. Každá otázka musí striktně odpovídat svému parametru (stejný kontext, relevantní možnosti odpovědí).
ZAKÁZÁNO: Sloučit dva parametry do jedné otázky. Zakázáno vynechat parametr.
Povolené UI komponenty:
- "chips" (přepínací tlačítka pro 2-6 možností, isMultiSelect: true/false) — preferuj pro kategorické parametry
- "slider" (posuvník pro čísla: rozpočet, rozměry, hodiny, váha, objem) — použij pro číselné parametry
- "chips" (přepínací tlačítka pro volby, isMultiSelect: true) — preferuj pro všechny kategorické a výběrové parametry (vždy s povoleným výběrem více možností)
- "brands" — VÝHRADNĚ pro parametr brand_preferences (značky a výrobci)

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
    },
    {
      "id": "brand_preferences",
      "step": 2,
      "title": "Značky & Výrobci",
      "subtitle": "Preferované a zakázané značky",
      "component": "brands",
      "isMultiSelect": false,
      "defaultValue": { "preferred": "", "forbidden": "" },
      "promptForgeTemplate": "- **Značky & výrobci:** {value}"
    }
  ]
DŮLEŽITÉ PRAVIDLO PRO brands:
- Otázka s id="brand_preferences" MUSÍ mít component="brands", defaultValue={ "preferred": "", "forbidden": "" }
- Otázka brands NESMÍ mít "options" pole
}
`.trim();

  // Dynamic resilient failover via ModelDiscoveryService
  const failoverRes = await ModelDiscoveryService.executeWithResilientFailover<UniversalAgentDefinition>({
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
              maxOutputTokens: 4096,
              responseMimeType: 'application/json',
            },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const cleanJson = text.replace(/```json/gi, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanJson);
            return {
              success: true,
              data: {
                ...parsed,
                createdAt: new Date().toISOString(),
                isCustom: true,
              },
            };
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

  if (failoverRes.result) {
    return failoverRes.result;
  }

  throw new Error('All candidate Gemini models failed or unavailable for wizard generation');
}
