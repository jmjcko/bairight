/**
 * /api/cron/sync-models
 * 
 * Scheduled / On-demand AI Provider Model Registry Synchronizer.
 * Supports Vercel Cron (GET) and custom automation triggers (POST).
 * Audits Google Gemini, Anthropic Claude, and OpenAI GPT-4o for active,
 * non-deprecated models, updates in-memory registry caches, and self-heals
 * against provider deprecations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { ModelDiscoveryService } from '@/lib/agent/model-discovery-service';

function isAuthorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    // In local development or environments without CRON_SECRET configured, allow execution
    return true;
  }

  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  const url = new URL(req.url);
  const secretParam = url.searchParams.get('secret') || url.searchParams.get('key');
  if (secretParam && secretParam === cronSecret) {
    return true;
  }

  return false;
}

async function handleSync(req: NextRequest) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized: Invalid or missing CRON_SECRET token.' },
        { status: 401 }
      );
    }

    // Parse optional custom keys if provided in POST body for targeted synchronization
    let customKeys: { gemini?: string; claude?: string; openai?: string } | undefined = undefined;
    if (req.method === 'POST') {
      try {
        const body = await req.json().catch(() => ({}));
        if (body && typeof body === 'object') {
          customKeys = {
            gemini: typeof body.gemini === 'string' ? body.gemini.trim() : undefined,
            claude: typeof body.claude === 'string' ? body.claude.trim() : undefined,
            openai: typeof body.openai === 'string' ? body.openai.trim() : undefined,
          };
        }
      } catch {
        // Fall back to environment keys
      }
    }

    const syncResult = await ModelDiscoveryService.syncAllProviders(customKeys);

    const summaries: string[] = [];
    for (const [provider, status] of Object.entries(syncResult.providers)) {
      const topStr = status.topModel ? ` [top: ${status.topModel}]` : '';
      const statusStr = status.ok ? 'OK' : `FAIL (${status.error || 'error'})`;
      summaries.push(`${provider}: ${statusStr} (${status.models.length} models)${topStr}`);
    }

    return NextResponse.json(
      {
        ok: true,
        timestamp: syncResult.timestamp,
        summary: summaries.join(' | '),
        providers: syncResult.providers,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[sync-models cron] Unexpected error during model synchronization:', error);
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || 'Server error during provider model synchronization',
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return handleSync(req);
}

export async function POST(req: NextRequest) {
  return handleSync(req);
}
