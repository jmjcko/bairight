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

  it('2. Successfully validates standard Anthropic key via /v1/models without generating messages', async () => {
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

  it('3. Successfully parses and transmits anthropic-workspace-id header for User/Multi-Workspace keys (KEY:wrkspc_ID)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: [
          { id: 'claude-3-5-sonnet-20241022', display_name: 'Claude 3.5 Sonnet' },
        ],
      }),
    });
    global.fetch = fetchMock;

    const req = new NextRequest('http://localhost:3000/api/agent/test-key', {
      method: 'POST',
      body: JSON.stringify({
        providerId: 'anthropic_claude',
        apiKey: 'sk-ant-usr-123456789abcdef:wrkspc_987654321fedcba',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.detectedProvider).toBe('anthropic_claude');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.anthropic.com/v1/models',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'x-api-key': 'sk-ant-usr-123456789abcdef',
          'anthropic-workspace-id': 'wrkspc_987654321fedcba',
        }),
      })
    );
  });

  it('4. Successfully parses pipe-delimited user key and workspace ID (KEY|wrkspc_ID)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: [{ id: 'claude-3-5-sonnet-20241022' }],
      }),
    });
    global.fetch = fetchMock;

    const req = new NextRequest('http://localhost:3000/api/agent/test-key', {
      method: 'POST',
      body: JSON.stringify({
        providerId: 'anthropic_claude',
        apiKey: 'sk-ant-usr-myorgkey|wrkspc_pipeid123',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.anthropic.com/v1/models',
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-api-key': 'sk-ant-usr-myorgkey',
          'anthropic-workspace-id': 'wrkspc_pipeid123',
        }),
      })
    );
  });

  it('5. Explains missing Workspace ID clearly when Anthropic reports key is not scoped to a workspace', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        type: 'error',
        error: {
          type: 'invalid_request_error',
          message: 'This API key is not scoped to a workspace, so this request must include the anthropic-workspace-id header with the ID of the workspace to use. Add the header, or use an API key that is scoped to a workspace.',
        },
      }),
    });
    global.fetch = fetchMock;

    const req = new NextRequest('http://localhost:3000/api/agent/test-key', {
      method: 'POST',
      body: JSON.stringify({
        providerId: 'anthropic_claude',
        apiKey: 'sk-ant-usr-unscoped_key123',
      }),
    });

    const res = await POST(req);
    const data = await res.json();
    expect(data.ok).toBe(false);
    expect(data.error).toContain('sk-ant-usr-');
    expect(data.error).toContain('Workspace ID');
    expect(data.error).toContain('KLÍČ:wrkspc_ID');
  });

  it('6. Rejects invalid Anthropic key with clear error message', async () => {
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

  it('7. Handles Anthropic credit balance warning constructively without blocking user', async () => {
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

  it('8. Successfully validates OpenAI key and discovers models prioritizing GPT-4o', async () => {
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('/v1/models')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: [
              { id: 'gpt-4o-mini', object: 'model' },
              { id: 'gpt-4o', object: 'model' },
              { id: 'text-embedding-3-small', object: 'model' },
            ],
          }),
        };
      }
      if (url.includes('/v1/chat/completions')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            choices: [{ message: { content: 'Hello' } }],
          }),
        };
      }
      return { ok: false, status: 404 };
    });
    global.fetch = fetchMock;

    const req = new NextRequest('http://localhost:3000/api/agent/test-key', {
      method: 'POST',
      body: JSON.stringify({
        providerId: 'openai_gpt4o',
        apiKey: 'sk-proj-validOpenAIKey1234567890abcdef',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.detectedProvider).toBe('openai_gpt4o');
    expect(data.model).toBe('gpt-4o');
    expect(data.discoveredModels).toContain('gpt-4o');
    expect(data.discoveredModels).toContain('gpt-4o-mini');
  });

  it('9. Rejects invalid OpenAI key with 401 error message', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        error: { message: 'Incorrect API key provided: sk-proj-***' },
      }),
    });
    global.fetch = fetchMock;

    const req = new NextRequest('http://localhost:3000/api/agent/test-key', {
      method: 'POST',
      body: JSON.stringify({
        providerId: 'openai_gpt4o',
        apiKey: 'sk-proj-invalidKey123456',
      }),
    });

    const res = await POST(req);
    const data = await res.json();
    expect(data.ok).toBe(false);
    expect(data.error).toContain('Neplatný OpenAI API klíč');
  });

  it('10. Detects OpenAI quota / credit exhaustion gracefully with creditWarning', async () => {
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('/v1/models')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: [{ id: 'gpt-4o', object: 'model' }],
          }),
        };
      }
      if (url.includes('/v1/chat/completions')) {
        return {
          ok: false,
          status: 429,
          json: async () => ({
            error: {
              code: 'insufficient_quota',
              message: 'You exceeded your current quota, please check your plan and billing details.',
            },
          }),
        };
      }
      return { ok: false, status: 404 };
    });
    global.fetch = fetchMock;

    const req = new NextRequest('http://localhost:3000/api/agent/test-key', {
      method: 'POST',
      body: JSON.stringify({
        providerId: 'openai_gpt4o',
        apiKey: 'sk-proj-unfundedAccountKey123',
      }),
    });

    const res = await POST(req);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.creditWarning).toBe(true);
    expect(data.message).toContain('vyčerpaný kredit');
  });
});
