import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import { ModelDiscoveryService } from '@/lib/agent/model-discovery-service';

describe('AI Provider Model Sync Cron (/api/cron/sync-models)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('1. Rejects request with 401 when CRON_SECRET is configured and token is invalid or missing', async () => {
    process.env.CRON_SECRET = 'super-secret-cron-token-123';

    // Request without Authorization header
    const reqNoAuth = new NextRequest('http://localhost:3000/api/cron/sync-models', {
      method: 'GET',
    });
    const resNoAuth = await GET(reqNoAuth);
    expect(resNoAuth.status).toBe(401);
    const dataNoAuth = await resNoAuth.json();
    expect(dataNoAuth.ok).toBe(false);
    expect(dataNoAuth.error).toContain('Unauthorized');

    // Request with incorrect Authorization header
    const reqWrongAuth = new NextRequest('http://localhost:3000/api/cron/sync-models', {
      method: 'GET',
      headers: {
        authorization: 'Bearer wrong-token',
      },
    });
    const resWrongAuth = await GET(reqWrongAuth);
    expect(resWrongAuth.status).toBe(401);
  });

  it('2. Authorizes request with valid Bearer token header when CRON_SECRET is set', async () => {
    process.env.CRON_SECRET = 'valid-cron-token-xyz';

    vi.spyOn(ModelDiscoveryService, 'syncAllProviders').mockResolvedValue({
      timestamp: '2026-10-13T10:00:00.000Z',
      providers: {
        google_gemini: { ok: true, models: ['gemini-2.0-flash'], topModel: 'gemini-2.0-flash' },
        anthropic_claude: { ok: true, models: ['claude-sonnet-5-5'], topModel: 'claude-sonnet-5-5' },
        openai_gpt4o: { ok: true, models: ['gpt-4o'], topModel: 'gpt-4o' },
      },
    });

    const req = new NextRequest('http://localhost:3000/api/cron/sync-models', {
      method: 'GET',
      headers: {
        authorization: 'Bearer valid-cron-token-xyz',
      },
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.providers.google_gemini.ok).toBe(true);
    expect(data.providers.anthropic_claude.topModel).toBe('claude-sonnet-5-5');
    expect(data.summary).toContain('google_gemini');
    expect(data.summary).toContain('anthropic_claude');
  });

  it('3. Authorizes request via URL query parameter (?secret=...)', async () => {
    process.env.CRON_SECRET = 'query-param-token-456';

    vi.spyOn(ModelDiscoveryService, 'syncAllProviders').mockResolvedValue({
      timestamp: '2026-10-13T10:00:00.000Z',
      providers: {
        google_gemini: { ok: true, models: ['gemini-2.0-flash'], topModel: 'gemini-2.0-flash' },
        anthropic_claude: { ok: true, models: ['claude-sonnet-5-5'], topModel: 'claude-sonnet-5-5' },
        openai_gpt4o: { ok: true, models: ['gpt-4o'], topModel: 'gpt-4o' },
      },
    });

    const req = new NextRequest('http://localhost:3000/api/cron/sync-models?secret=query-param-token-456', {
      method: 'GET',
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
  });

  it('4. Allows execution when CRON_SECRET is not configured (development mode)', async () => {
    delete process.env.CRON_SECRET;

    vi.spyOn(ModelDiscoveryService, 'syncAllProviders').mockResolvedValue({
      timestamp: '2026-10-13T10:00:00.000Z',
      providers: {
        google_gemini: { ok: true, models: ['gemini-2.0-flash'], topModel: 'gemini-2.0-flash' },
        anthropic_claude: { ok: true, models: ['claude-sonnet-5-5'], topModel: 'claude-sonnet-5-5' },
        openai_gpt4o: { ok: true, models: ['gpt-4o'], topModel: 'gpt-4o' },
      },
    });

    const req = new NextRequest('http://localhost:3000/api/cron/sync-models', {
      method: 'GET',
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
  });

  it('5. Supports POST with custom provider keys and handles partial provider failure gracefully', async () => {
    delete process.env.CRON_SECRET;

    vi.spyOn(ModelDiscoveryService, 'syncAllProviders').mockImplementation(async (keys) => {
      expect(keys?.claude).toBe('sk-ant-custom-key');
      return {
        timestamp: '2026-10-13T10:00:00.000Z',
        providers: {
          google_gemini: { ok: true, models: ['gemini-2.0-flash'], topModel: 'gemini-2.0-flash' },
          anthropic_claude: { ok: false, models: ['claude-sonnet-5-5'], error: 'Anthropic rate limit' },
          openai_gpt4o: { ok: true, models: ['gpt-4o'], topModel: 'gpt-4o' },
        },
      };
    });

    const req = new NextRequest('http://localhost:3000/api/cron/sync-models', {
      method: 'POST',
      body: JSON.stringify({
        claude: 'sk-ant-custom-key',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.providers.anthropic_claude.ok).toBe(false);
    expect(data.summary).toContain('FAIL');
    expect(data.providers.google_gemini.ok).toBe(true);
  });
});
