import { ModelDiscoveryService } from '@/lib/agent/model-discovery-service';
import { parseAnthropicKey, buildAnthropicHeaders } from '@/lib/agent/anthropic-helper';
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
          if (res.status === 401 || errMsg.toLowerCase().includes('invalid api key') || errMsg.toLowerCase().includes('incorrect api key')) {
            return NextResponse.json({
              ok: false,
              error: 'Neplatný OpenAI API klíč. Zkontrolujte prosím svůj klíč v OpenAI Platform (platform.openai.com/api-keys).',
            });
          }
          if (errMsg.toLowerCase().includes('insufficient_quota') || errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('billing')) {
            return NextResponse.json({
              ok: true,
              creditWarning: true,
              detectedProvider: 'openai_gpt4o',
              model: 'gpt-4o',
              message: 'Klíč je platný, ale váš OpenAI účet hlásí vyčerpaný kredit. Pro spuštění konverzace dobijte kredit v platform.openai.com/billing.',
            });
          }
          return NextResponse.json({ ok: false, error: `Neplatný OpenAI API klíč (${errMsg}).` });
        }

        const discoveredModels = await ModelDiscoveryService.discoverOpenAIModels(key).catch(() => []);
        const preferredModel = discoveredModels[0] || 'gpt-4o';
        const modelsSummary = discoveredModels.length > 0 ? ` (Dostupné modely: ${discoveredModels.slice(0, 3).join(', ')})` : '';

        // Optional check for quota exhaustion via minimal chat request
        try {
          const testMsgRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${key}`,
            },
            body: JSON.stringify({
              model: preferredModel,
              max_tokens: 5,
              messages: [{ role: 'user', content: 'Hi' }],
            }),
          });

          if (!testMsgRes.ok) {
            const testErrData = await testMsgRes.json().catch(() => ({}));
            const testErrMsg = testErrData?.error?.message || '';
            if (testErrMsg.toLowerCase().includes('insufficient_quota') || testErrMsg.toLowerCase().includes('quota') || testErrMsg.toLowerCase().includes('billing')) {
              return NextResponse.json({
                ok: true,
                creditWarning: true,
                detectedProvider: 'openai_gpt4o',
                model: preferredModel,
                discoveredModels,
                message: 'Klíč je platný, ale váš OpenAI účet hlásí vyčerpaný kredit. Pro spuštění konverzace dobijte kredit v platform.openai.com/billing.',
              });
            }
          }
        } catch {
          // Ignore secondary chat check errors
        }

        return NextResponse.json({
          ok: true,
          detectedProvider: 'openai_gpt4o',
          model: preferredModel,
          discoveredModels,
          message: `OpenAI API klíč je platný a připojený k ${preferredModel}!${modelsSummary}`,
        });
      } catch (err: any) {
        return NextResponse.json({ ok: false, error: `Chyba spojení s OpenAI: ${err.message}` });
      }
    }

    // 3. Anthropic Claude (supports both workspace-scoped keys & user keys with workspace ID)
    if (providerId === 'anthropic_claude' || key.startsWith('sk-ant-')) {
      try {
        const creds = parseAnthropicKey(key);

        // Step A: Attempt fast & token-free validation via /v1/models
        const modelsRes = await fetch('https://api.anthropic.com/v1/models', {
          method: 'GET',
          headers: buildAnthropicHeaders(creds),
        });

        if (modelsRes.ok) {
          const discoveredModels = await ModelDiscoveryService.discoverClaudeModels(key).catch(() => []);
          const preferredModel = discoveredModels[0] || 'claude-sonnet-5-5';

          console.log('[Anthropic test-key] Discovered models:', discoveredModels);
          const modelsSummary = discoveredModels.length > 0 ? ` (Dostupné modely: ${discoveredModels.slice(0, 3).join(', ')})` : '';
          return NextResponse.json({
            ok: true,
            detectedProvider: 'anthropic_claude',
            model: preferredModel,
            discoveredModels,
            message: `Claude API klíč je platný a připravený k analýze!${modelsSummary}`,
          });
        }

        const modelsErrData = await modelsRes.json().catch(() => ({}));
        const modelsErrMsg = (modelsErrData?.error?.message || `HTTP ${modelsRes.status}`).toLowerCase();

        // Detect missing workspace ID on User / multi-workspace keys
        if (
          modelsErrMsg.includes('not scoped to a workspace') ||
          modelsErrMsg.includes('anthropic-workspace-id')
        ) {
          return NextResponse.json({
            ok: false,
            error:
              'Tento Anthropic klíč je typu User/Multi-Workspace (sk-ant-usr-...) a vyžaduje Workspace ID. Zadejte jej prosím ve formátu "KLÍČ:wrkspc_ID" (Workspace ID najdete v console.anthropic.com -> Workspaces), nebo v konzoli vytvořte klíč přímo uvnitř konkrétního Workspace.',
          });
        }

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
          headers: buildAnthropicHeaders(creds, {
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            model: 'claude-sonnet-5-5',
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
          msgErrMsg.toLowerCase().includes('not scoped to a workspace') ||
          msgErrMsg.toLowerCase().includes('anthropic-workspace-id')
        ) {
          return NextResponse.json({
            ok: false,
            error:
              'Tento Anthropic klíč je typu User/Multi-Workspace (sk-ant-usr-...) a vyžaduje Workspace ID. Zadejte jej prosím ve formátu "KLÍČ:wrkspc_ID" (Workspace ID najdete v console.anthropic.com -> Workspaces), nebo v konzoli vytvořte klíč přímo uvnitř konkrétního Workspace.',
          });
        }

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
