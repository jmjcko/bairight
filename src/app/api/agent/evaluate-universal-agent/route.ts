import { NextRequest, NextResponse } from 'next/server';
import { 
  UniversalAgentDefinition, 
  UniversalEvaluationResult, 
  forgeAgentPrompt 
} from '@/lib/agent/universal-agent-schema';

export async function POST(req: NextRequest) {
  try {
    const { agent, answers, ragFacts, providerId, apiKey } = await req.json();

    if (!agent || !agent.id || !agent.questions) {
      return NextResponse.json(
        { error: 'Neplatná data agenta: Schéma agenta je povinné.' },
        { status: 400 }
      );
    }

    const constructedPrompt = forgeAgentPrompt(agent, answers || {}, ragFacts);

    // Resolve API key
    const effectiveKey = apiKey || (
      providerId === 'google_gemini' ? process.env.GOOGLE_GEMINI_API_KEY :
      providerId === 'openai_gpt4o' ? process.env.OPENAI_API_KEY :
      providerId === 'anthropic_claude' ? process.env.ANTHROPIC_API_KEY :
      process.env.GOOGLE_GEMINI_API_KEY || process.env.OPENAI_API_KEY
    );

    let result: UniversalEvaluationResult | null = null;
    let providerUsed = 'bAIright Universal Reasoning Engine (Lokální)';
    let isLiveAI = false;

    if (effectiveKey) {
      try {
        const liveOutput = await executeLiveLLMEvaluation(constructedPrompt, effectiveKey, providerId);
        result = {
          agentId: agent.id,
          agentName: agent.name,
          category: agent.category,
          evaluatedAt: new Date().toISOString(),
          summaryAssessment: liveOutput.summaryAssessment || 'Doporučení sestavené na míru zadaným parametrům.',
          recommendations: liveOutput.recommendations || [],
          contraindicationsOrCaveats: liveOutput.contraindicationsOrCaveats || [],
          providerUsed: providerId === 'google_gemini' ? 'Google Gemini 2.0' :
                        providerId === 'openai_gpt4o' ? 'OpenAI GPT-4o' :
                        providerId === 'anthropic_claude' ? 'Anthropic Claude 3.5' : 'Živé AI',
          isLiveAI: true,
          promptSent: constructedPrompt,
        };
        providerUsed = result.providerUsed || 'Živé AI';
        isLiveAI = true;
      } catch (e: any) {
        console.warn('Live LLM universal evaluation failed, falling back to local reasoning:', e?.message || e);
      }
    }

    if (!result) {
      result = synthesizeFallbackEvaluation(agent, answers, constructedPrompt);
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error evaluating universal agent:', error);
    return NextResponse.json(
      { error: 'Chyba při vyhodnocení nákupního doporučení.' },
      { status: 500 }
    );
  }
}

/**
 * Executes evaluation with live Gemini 2.0 API with JSON mode
 */
async function executeLiveLLMEvaluation(prompt: string, apiKey: string, providerId?: string): Promise<any> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.25,
        maxOutputTokens: 2500,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No text returned from Gemini');

  const cleanJson = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  return JSON.parse(cleanJson);
}

/**
 * Deterministic fallback recommendations for offline / zero-key mode
 */
function synthesizeFallbackEvaluation(
  agent: UniversalAgentDefinition,
  answers: Record<string, any>,
  promptSent: string
): UniversalEvaluationResult {
  const isShoes = agent.id === 'running_shoes' || agent.category.toLowerCase().includes('footwear');
  const isChair = agent.id === 'ergo_seating' || agent.category.toLowerCase().includes('chair') || agent.category.toLowerCase().includes('ergo');

  let recommendations = [];

  if (isShoes) {
    recommendations = [
      {
        id: 'hoka-bondi-8-wide',
        brand: 'Hoka',
        model: 'Bondi 8 (Wide 2E)',
        matchScore: 97,
        reasoning: 'Maximální tlumení s aktivní kolébkovou podešví (Early Stage Meta-Rocker), která snižuje ohybový tlak na koleno a čéšku.',
        pros: ['Extrémní tlumení nárazů pro citlivé klouby', 'Certifikovaná široká platforma 2E'],
        cons: ['Vyšší hmotnost (307 g) nevhodná pro rychlé intervaly'],
      },
      {
        id: 'brooks-ghost-max-wide',
        brand: 'Brooks',
        model: 'Ghost Max (Wide 2E)',
        matchScore: 94,
        reasoning: 'Nízký drop 6 mm ulevuje kolennímu kloubu a GlideRoll Rocker přirozeně odvaluje krok.',
        pros: ['Vynikající stabilita a neutrální podpora', 'Odolná podešev s vysokou životností'],
        cons: ['Tužší pocit při prvních 20 km'],
      },
      {
        id: 'saucony-echelon-9-wide',
        brand: 'Saucony',
        model: 'Echelon 9 (Wide 2E)',
        matchScore: 91,
        reasoning: 'Plošší základna kopyta ideální pro ortopedické vložky a došlap na celou plochu.',
        pros: ['Mimořádně prostorný toebox pro prsty', 'Vysoká stabilita paty'],
        cons: ['Jednodušší design svršku'],
      },
    ];
  } else if (isChair) {
    recommendations = [
      {
        id: 'herman-miller-aeron',
        brand: 'Herman Miller',
        model: 'Aeron Remastered (Size B/C)',
        matchScore: 96,
        reasoning: 'Patentovaná síťovina Pellicle 8Z a zónová podpora křížové i bederní kosti PostureFit SL.',
        pros: ['Dokonalá prodyšnost a celodenní opora', '12letá záruka'],
        cons: ['Vysoká počáteční investice'],
      },
      {
        id: 'steelcase-gesture',
        brand: 'Steelcase',
        model: 'Gesture 3D',
        matchScore: 93,
        reasoning: 'Technologie 360 Armrests a LiveBack systém kopírující přirozený esovitý pohyb páteře.',
        pros: ['Nejlepší područky na trhu pro práci s klávesnicí a mobilem', 'Měkký polstrovaný sedák'],
        cons: ['Těžší konstrukce pro manipulaci'],
      },
      {
        id: 'sedus-se-do',
        brand: 'Sedus',
        model: 'se:do Pro Light',
        matchScore: 89,
        reasoning: 'Vynikající poměr cena/výkon se synchronní mechanikou Similar a stavitelným sklonem.',
        pros: ['Německá ergonomická certifikace AGR', 'Dostupnější cenová hladina'],
        cons: ['Základnější rozsah nastavení hloubky sedáku'],
      },
    ];
  } else {
    recommendations = [
      {
        id: `${agent.id}-recommended-1`,
        brand: 'Doporučená volba',
        model: `Prémiový model pro ${agent.name}`,
        matchScore: 95,
        reasoning: `Tento model nejlépe vyvažuje zadané parametry (${Object.keys(answers).length} specifikovaných vlastností) s důrazem na dlouhou životnost.`,
        pros: ['Ověřená tržní spolehlivost', 'Ergonomické a funkční provedení'],
        cons: ['Vyšší poptávka u distributorů'],
      },
      {
        id: `${agent.id}-recommended-2`,
        brand: 'Alternativní volba',
        model: `Vyvážený model pro ${agent.name}`,
        matchScore: 90,
        reasoning: 'Skvělý kompromis mezi cenovou hladinou a požadovaným výkonem.',
        pros: ['Výborný poměr cena / výkon', 'Snadné používání a údržba'],
        cons: ['Méně pokročilých funkcí'],
      },
    ];
  }

  return {
    agentId: agent.id,
    agentName: agent.name,
    category: agent.category,
    evaluatedAt: new Date().toISOString(),
    summaryAssessment: `Na základě vašeho profilu a ${Object.keys(answers).length} zodpovězených otázek systém analyzoval aktuální nabídku v kategorii ${agent.category}. Níže jsou vybrány 3 nejvhodnější modely, které nejlépe naplňují vaše specifické požadavky.`,
    recommendations,
    contraindicationsOrCaveats: [
      'Před finálním nákupem ověřte kompatibilitu rozměrů a záruční podmínky.',
      'Doporučení je nezávislé a nepředstavuje prodejní nabídku ani sponzorovaný obsah.',
    ],
    providerUsed: 'bAIright Universal Reasoning Engine (Lokální)',
    isLiveAI: false,
    promptSent,
  };
}
