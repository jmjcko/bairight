import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ModelDiscoveryService } from '../model-discovery-service';

describe('ModelDiscoveryService Unit & Resilience Test Suite', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });
  beforeEach(() => {
    ModelDiscoveryService.reset();
    vi.restoreAllMocks();
  });

  it('1. Returns resilient default candidates when no API key is provided', async () => {
    const candidates = await ModelDiscoveryService.getCandidateModels('google_gemini');
    expect(candidates).toContain('gemini-2.5-flash');
    expect(candidates).toContain('gemini-3.8-flash');
    expect(candidates.length).toBeGreaterThan(2);
  });

  it('2. Dynamically queries listModels, filters out TTS / Image / Embedding / Robotics, and sorts flash models first', async () => {
    const mockListResponse = {
      models: [
        { name: 'models/gemini-embedding-001', supportedGenerationMethods: ['embedContent'] },
        { name: 'models/gemini-2.5-flash-preview-tts', supportedGenerationMethods: ['generateContent'] },
        { name: 'models/gemini-robotics-er-2-preview', supportedGenerationMethods: ['generateContent'] },
        { name: 'models/gemini-3.1-pro-preview', supportedGenerationMethods: ['generateContent'] },
        { name: 'models/gemini-3.8-flash', supportedGenerationMethods: ['generateContent'] },
        { name: 'models/gemini-2.5-flash', supportedGenerationMethods: ['generateContent'] },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockListResponse,
    } as any);

    const candidates = await ModelDiscoveryService.discoverGeminiModels('AIzaSyMockKey');

    // Must NOT contain filtered models
    expect(candidates).not.toContain('gemini-embedding-001');
    expect(candidates).not.toContain('gemini-2.5-flash-preview-tts');
    expect(candidates).not.toContain('gemini-robotics-er-2-preview');

    // Must contain conversational models
    expect(candidates).toContain('gemini-2.5-flash');
    expect(candidates).toContain('gemini-3.8-flash');
    expect(candidates).toContain('gemini-3.1-pro-preview');

    // Flash models must be prioritized before pro
    const flashIndex = candidates.indexOf('gemini-2.5-flash');
    const proIndex = candidates.indexOf('gemini-3.1-pro-preview');
    expect(flashIndex).toBeLessThan(proIndex);
  });

  it('3. Blacklists dead models on markModelUnavailable and never returns them in candidate list', async () => {
    const initial = await ModelDiscoveryService.getCandidateModels('google_gemini');
    expect(initial).toContain('gemini-2.5-flash');

    // Mark gemini-2.5-flash as dead (e.g. HTTP 404 or 410)
    ModelDiscoveryService.markModelUnavailable('gemini-2.5-flash');

    const updated = await ModelDiscoveryService.getCandidateModels('google_gemini');
    expect(updated).not.toContain('gemini-2.5-flash');
  });

  it('4. Parses Google replacement suggestion from 404 error body and promotes it to the top candidate', async () => {
    const errorBody = JSON.stringify({
      error: {
        code: 404,
        message: 'This model models/gemini-2.0-flash is no longer available. Please update your code to use models/gemini-3.8-flash for the latest features and improvements.',
        status: 'NOT_FOUND',
      },
    });

    const recommended = ModelDiscoveryService.markModelUnavailable('gemini-2.0-flash', errorBody);
    expect(recommended).toBe('gemini-3.8-flash');

    const candidates = await ModelDiscoveryService.getCandidateModels('google_gemini');
    expect(candidates[0]).toBe('gemini-3.8-flash');
    expect(candidates).not.toContain('gemini-2.0-flash');
  });

  it('5. Caches dynamic discovery results so fetch is not called on every invocation', async () => {
    const mockListResponse = {
      models: [
        { name: 'models/gemini-2.5-flash', supportedGenerationMethods: ['generateContent'] },
      ],
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockListResponse,
    } as any);

    global.fetch = fetchMock;

    await ModelDiscoveryService.getCandidateModels('google_gemini', 'AIzaSyCachingKey123');
    await ModelDiscoveryService.getCandidateModels('google_gemini', 'AIzaSyCachingKey123');

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('6. Successfully handles OpenAI and Anthropic provider candidates without network calls', async () => {
    const openai = await ModelDiscoveryService.getCandidateModels('openai_gpt4o');
    expect(openai).toContain('gpt-4o');

    const claude = await ModelDiscoveryService.getCandidateModels('anthropic_claude');
    expect(claude).toContain('claude-3-5-sonnet-20241022');
  });

  it('7. executeWithResilientFailover: Seamlessly switches to Google suggested replacement model on HTTP 404 without failing', async () => {
    let callCount = 0;
    const attemptedModels: string[] = [];

    const mockExecute = vi.fn().mockImplementation(async (model: string) => {
      callCount++;
      attemptedModels.push(model);

      if (model === 'gemini-2.5-flash') {
        return {
          success: false,
          status: 404,
          errorBody: JSON.stringify({
            error: {
              code: 404,
              message: 'This model models/gemini-2.5-flash is no longer available. Please update your code to use models/gemini-3.8-flash for the latest features.',
            },
          }),
        };
      }

      if (model === 'gemini-3.8-flash') {
        return {
          success: true,
          data: 'Success from gemini-3.8-flash!',
        };
      }

      return { success: false, status: 500 };
    });

    const { result, modelUsed } = await ModelDiscoveryService.executeWithResilientFailover<string>({
      providerId: 'google_gemini',
      apiKey: 'AIzaSyFailoverTestKey',
      executeFn: mockExecute,
    });

    expect(result).toBe('Success from gemini-3.8-flash!');
    expect(modelUsed).toBe('gemini-3.8-flash');
    expect(attemptedModels).toContain('gemini-2.5-flash');
    expect(attemptedModels).toContain('gemini-3.8-flash');
  });

  it('8. executeWithResilientFailover: Triggers on-the-fly discovery when initial candidates fail and recovers with newly discovered model', async () => {
    // Mock listModels to return a brand new model
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        models: [
          { name: 'models/gemini-4.0-flash-nextgen', supportedGenerationMethods: ['generateContent'] },
        ],
      }),
    } as any);

    const attemptedModels: string[] = [];

    const mockExecute = vi.fn().mockImplementation(async (model: string) => {
      attemptedModels.push(model);
      if (model === 'gemini-4.0-flash-nextgen') {
        return {
          success: true,
          data: 'Recovered via on-the-fly discovered model!',
        };
      }
      return { success: false, status: 404 };
    });

    const { result, modelUsed } = await ModelDiscoveryService.executeWithResilientFailover<string>({
      providerId: 'google_gemini',
      apiKey: 'AIzaSyOnTheFlyDiscoveryKey',
      executeFn: mockExecute,
    });

    expect(result).toBe('Recovered via on-the-fly discovered model!');
    expect(modelUsed).toBe('gemini-4.0-flash-nextgen');
  });

  it('9. executeWithResilientFailover: Remembers last successful model and prioritizes it on subsequent calls', async () => {
    const attemptedFirstCall: string[] = [];
    await ModelDiscoveryService.executeWithResilientFailover<string>({
      providerId: 'google_gemini',
      apiKey: 'AIzaSyPriorityKey',
      executeFn: async (model: string) => {
        attemptedFirstCall.push(model);
        if (model === 'gemini-3.5-flash') {
          return { success: true, data: 'OK' };
        }
        return { success: false, status: 503 };
      },
    });

    // On second call, gemini-3.5-flash should be tried first!
    const attemptedSecondCall: string[] = [];
    await ModelDiscoveryService.executeWithResilientFailover<string>({
      providerId: 'google_gemini',
      apiKey: 'AIzaSyPriorityKey',
      executeFn: async (model: string) => {
        attemptedSecondCall.push(model);
        return { success: true, data: 'OK' };
      },
    });

    expect(attemptedSecondCall[0]).toBe('gemini-3.5-flash');
  });

  it('10. executeWithResilientFailover: Returns result: null safely when all candidates fail so deterministic safety net activates', async () => {
    // Both initial models and listModels fail
    global.fetch = vi.fn().mockRejectedValue(new Error('Network offline'));

    const mockExecute = vi.fn().mockResolvedValue({
      success: false,
      status: 500,
      errorBody: 'Server error',
    });

    const { result, modelUsed } = await ModelDiscoveryService.executeWithResilientFailover<string>({
      providerId: 'google_gemini',
      apiKey: 'AIzaSyOfflineKey',
      executeFn: mockExecute,
    });

    expect(result).toBeNull();
    expect(modelUsed).toBeUndefined();
  });

  it('11. executeWithResilientFailover: Gracefully catches thrown exceptions inside executeFn and continues to next candidate', async () => {
    let callCount = 0;
    const mockExecute = vi.fn().mockImplementation(async (model: string) => {
      callCount++;
      if (callCount === 1) {
        throw new Error('Unexpected JSON parse or socket abort');
      }
      return {
        success: true,
        data: 'Rescued on candidate 2!',
      };
    });

    const { result } = await ModelDiscoveryService.executeWithResilientFailover<string>({
      providerId: 'google_gemini',
      apiKey: 'AIzaSyExceptionKey',
      executeFn: mockExecute,
    });

    expect(result).toBe('Rescued on candidate 2!');
    expect(callCount).toBeGreaterThanOrEqual(2);
  });
});
