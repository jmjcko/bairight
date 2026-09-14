import { NextRequest, NextResponse } from 'next/server';
import { evaluateIntakeFormWithAgent, IntakeFormData } from '@/lib/agent/markdown-agent-loader';
import { evaluateWithRealLLM } from '@/lib/agent/real-llm-service';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();

    // Support both direct IntakeFormData and wrapped payload { formData, providerId, apiKey, ragFacts }
    const formData: IntakeFormData = rawBody?.formData ? rawBody.formData : rawBody;
    const providerId = rawBody?.providerId;
    const apiKey = rawBody?.apiKey;
    const ragFacts = rawBody?.ragFacts;

    if (!formData || !formData.product_category) {
      return NextResponse.json(
        { error: 'Invalid form payload: product_category is required.' },
        { status: 400 }
      );
    }

    // Attempt real LLM evaluation first (Google Gemini, OpenAI GPT-4o, Anthropic Claude)
    try {
      const { result, providerUsed } = await evaluateWithRealLLM(formData, {
        providerId,
        apiKey,
        ragFacts,
      });

      return NextResponse.json({
        ...result,
        providerUsed,
        isLiveAI: true,
      });
    } catch (llmErr: any) {
      console.warn(
        'Real LLM dispatch skipped/failed, falling back to heuristic biomechanical model:',
        llmErr?.message || llmErr
      );

function cleanErrorMessage(msg: string): string {
  if (!msg) return 'Neznámá chyba spojení.';
  if (msg === 'NO_API_KEY_CONFIGURED') {
    return 'Nebyl zadán API klíč (BYOK) ani nastaven v .env.local. Vyhodnocení proběhlo certifikovaným lokálním biomechanickým modelem.';
  }
  try {
    const jsonMatch = msg.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed?.error?.message) {
        return parsed.error.message;
      }
    }
  } catch {}
  return msg
    .replace(/^Google Gemini API error:\s*/i, '')
    .replace(/^OpenAI API error:\s*/i, '')
    .replace(/^Anthropic Claude API error:\s*/i, '')
    .trim();
}

      const prescription = await evaluateIntakeFormWithAgent(formData);
      return NextResponse.json({
        ...prescription,
        providerUsed: 'bAIright Biomechanical Engine (Lokální)',
        isLiveAI: false,
        llmNotice:
          llmErr?.message === 'NO_API_KEY_CONFIGURED'
            ? 'Nebyl zadán API klíč (BYOK) ani nastaven v .env.local. Vyhodnocení proběhlo certifikovaným lokálním biomechanickým modelem.'
            : `AI model nedostupný (${cleanErrorMessage(llmErr?.message)}). Použit lokální ergonomický model.`,
      });
    }
  } catch (error) {
    console.error('Error evaluating intake form:', error);
    return NextResponse.json(
      { error: 'Internal server error evaluating intake form.' },
      { status: 500 }
    );
  }
}

