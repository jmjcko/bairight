import { ModelDiscoveryService } from '@/lib/agent/model-discovery-service';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { providerId, apiKey } = await req.json();

    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 5) {
      return NextResponse.json(
        { ok: false, error: 'Zadejte prosím platný API klíč.' },
        { status: 400 }
      );
    }

    const key = apiKey.trim();

    // 1. Google Gemini
    if (providerId === 'google_gemini' || key.startsWith('AIza')) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`, {
          headers: { 'Content-Type': 'application/json' },
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData?.error?.message || `HTTP ${res.status}`;
          if (res.status === 400 || errMsg.toLowerCase().includes('api_key_invalid') || errMsg.toLowerCase().includes('not valid')) {
            return NextResponse.json({ ok: false, error: 'Neplatný Google Gemini API klíč. Zkontrolujte jej v Google AI Studio.' });
          }
          return NextResponse.json({ ok: false, error: `Google Gemini chyba: ${errMsg}` });
        }

        const candidates = await ModelDiscoveryService.discoverGeminiModels(key);
        const preferred = candidates[0] || 'gemini-2.5-flash';

        return NextResponse.json({
          ok: true,
          detectedProvider: 'google_gemini',
          model: preferred,
          message: `Klíč je platný! Detekován model: ${preferred}`,
        });
      } catch (err: any) {
        return NextResponse.json({ ok: false, error: `Chyba spojení s Google Gemini: ${err.message}` });
      }
    }

    // 2. OpenAI GPT-4o
    if (providerId === 'openai_gpt4o' || key.startsWith('sk-proj-') || (key.startsWith('sk-') && !key.startsWith('sk-ant-'))) {
      try {
        const res = await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${key}` },
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData?.error?.message || `HTTP ${res.status}`;
          return NextResponse.json({ ok: false, error: `Neplatný OpenAI API klíč (${errMsg}).` });
        }

        return NextResponse.json({
          ok: true,
          detectedProvider: 'openai_gpt4o',
          model: 'gpt-4o',
          message: 'OpenAI API klíč je platný a připojený k GPT-4o!',
        });
      } catch (err: any) {
        return NextResponse.json({ ok: false, error: `Chyba spojení s OpenAI: ${err.message}` });
      }
    }

    // 3. Anthropic Claude
    if (providerId === 'anthropic_claude' || key.startsWith('sk-ant-')) {
      try {
        // Step A: Attempt fast & token-free validation via /v1/models
        const modelsRes = await fetch('https://api.anthropic.com/v1/models', {
          method: 'GET',
          headers: {
            'x-api-key': key,
            'anthropic-version': '2023-06-01',
          },
        });

        if (modelsRes.ok) {
          const modelsData = await modelsRes.json().catch(() => ({}));
          const discoveredModels: string[] = Array.isArray(modelsData?.data)
            ? modelsData.data.map((m: any) => m.id)
            : [];
          const preferredModel = discoveredModels.find((m) => m.includes('claude-3-7')) || discoveredModels.find((m) => m.includes('claude-3-5-sonnet')) || 'claude-3-5-sonnet';

          return NextResponse.json({
            ok: true,
            detectedProvider: 'anthropic_claude',
            model: preferredModel,
            message: 'Claude API klíč je platný a připravený k analýze!',
          });
        }

        const modelsErrData = await modelsRes.json().catch(() => ({}));
        const modelsErrMsg = (modelsErrData?.error?.message || `HTTP ${modelsRes.status}`).toLowerCase();

        // Explicit invalid key rejection
        if (
          modelsRes.status === 401 ||
          modelsRes.status === 403 ||
          modelsErrMsg.includes('invalid x-api-key') ||
          modelsErrMsg.includes('invalid api key')
        ) {
          return NextResponse.json({
            ok: false,
            error: 'Neplatný Claude API klíč. Zkontrolujte prosím klíč v Anthropic Console (console.anthropic.com).',
          });
        }

        // Detect credit / balance issues
        if (
          modelsErrMsg.includes('credit') ||
          modelsErrMsg.includes('balance') ||
          modelsErrMsg.includes('billing')
        ) {
          return NextResponse.json({
            ok: true,
            creditWarning: true,
            detectedProvider: 'anthropic_claude',
            model: 'claude-3-5-sonnet',
            message: 'Klíč je platný, ale váš Anthropic účet hlásí nulový kredit. Pro spuštění konverzace dobijte kredit v console.anthropic.com.',
          });
        }

        // Step B: Fallback to /v1/messages check if /v1/models returns an unexpected status
        const msgRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': key,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 5,
            messages: [{ role: 'user', content: 'Hi' }],
          }),
        });

        if (msgRes.ok) {
          return NextResponse.json({
            ok: true,
            detectedProvider: 'anthropic_claude',
            model: 'claude-3-5-sonnet',
            message: 'Claude API klíč je platný a připravený k analýze!',
          });
        }

        const msgErrData = await msgRes.json().catch(() => ({}));
        const msgErrMsg = (msgErrData?.error?.message || `HTTP ${msgRes.status}`);

        if (
          msgErrMsg.toLowerCase().includes('credit') ||
          msgErrMsg.toLowerCase().includes('balance') ||
          msgErrMsg.toLowerCase().includes('billing')
        ) {
          return NextResponse.json({
            ok: true,
            creditWarning: true,
            detectedProvider: 'anthropic_claude',
            model: 'claude-3-5-sonnet',
            message: 'Klíč je platný, ale váš Anthropic účet hlásí nulový kredit. Pro spuštění konverzace dobijte kredit v console.anthropic.com.',
          });
        }

        return NextResponse.json({ ok: false, error: `Neplatný Claude API klíč (${msgErrMsg}).` });
      } catch (err: any) {
        return NextResponse.json({ ok: false, error: `Chyba spojení s Anthropic: ${err.message}` });
      }
    }

    return NextResponse.json({ ok: false, error: 'Nerozpoznaný formát klíče nebo poskytovatel.' });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Chyba serveru při testu klíče.' },
      { status: 500 }
    );
  }
}
