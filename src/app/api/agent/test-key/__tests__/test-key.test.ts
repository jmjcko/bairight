import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';

describe('POST /api/agent/test-key Anthropic & Provider Validation Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('1. Rejects empty or too short API keys with 400', async () => {
    const req = new NextRequest('http://localhost:3000/api/agent/test-key', {
      method: 'POST',
      body: JSON.stringify({ providerId: 'anthropic_claude', apiKey: '   ' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.ok).toBe(false);
  });

  it('2. Successfully validates Anthropic key via /v1/models without generating messages', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: [
          { id: 'claude-3-5-sonnet-20241022', display_name: 'Claude 3.5 Sonnet' },
          { id: 'claude-3-7-sonnet-latest', display_name: 'Claude 3.7 Sonnet' },
        ],
      }),
    });
    global.fetch = fetchMock;

    const req = new NextRequest('http://localhost:3000/api/agent/test-key', {
      method: 'POST',
      body: JSON.stringify({
        providerId: 'anthropic_claude',
        apiKey: '  sk-ant-api03-validkey1234567890abcdef  ',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.detectedProvider).toBe('anthropic_claude');
    expect(data.model).toContain('claude-3-7');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.anthropic.com/v1/models',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'x-api-key': 'sk-ant-api03-validkey1234567890abcdef',
        }),
      })
    );
  });

  it('3. Rejects invalid Anthropic key with clear error message', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        type: 'error',
        error: { type: 'authentication_error', message: 'invalid x-api-key' },
      }),
    });
    global.fetch = fetchMock;

    const req = new NextRequest('http://localhost:3000/api/agent/test-key', {
      method: 'POST',
      body: JSON.stringify({
        providerId: 'anthropic_claude',
        apiKey: 'sk-ant-api03-wrongkey123',
      }),
    });

    const res = await POST(req);
    const data = await res.json();
    expect(data.ok).toBe(false);
    expect(data.error).toContain('Neplatný Claude API klíč');
  });

  it('4. Handles Anthropic credit balance warning constructively without blocking user', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        type: 'error',
        error: {
          type: 'invalid_request_error',
          message: 'Your credit balance is too low to access the Anthropic API. Please go to Plans & Billing to upgrade or purchase credits.',
        },
      }),
    });
    global.fetch = fetchMock;

    const req = new NextRequest('http://localhost:3000/api/agent/test-key', {
      method: 'POST',
      body: JSON.stringify({
        providerId: 'anthropic_claude',
        apiKey: 'sk-ant-api03-unfundedkey123',
      }),
    });

    const res = await POST(req);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.creditWarning).toBe(true);
    expect(data.message).toContain('nulový kredit');
  });
});
