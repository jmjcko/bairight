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

        const data = await res.json();
        const available = (data?.models || [])
          .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
          .map((m: any) => m.name.replace(/^models\//, ''));

        const preferred = available.find((m: string) => m.includes('2.0-flash') || m.includes('2.5-flash') || m.includes('flash')) || available[0] || 'gemini-flash';

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
        const res = await fetch('https://api.anthropic.com/v1/messages', {
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

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData?.error?.message || `HTTP ${res.status}`;
          return NextResponse.json({ ok: false, error: `Neplatný Claude API klíč (${errMsg}).` });
        }

        return NextResponse.json({
          ok: true,
          detectedProvider: 'anthropic_claude',
          model: 'claude-3-5-sonnet',
          message: 'Claude API klíč je platný a připravený k analýze!',
        });
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
