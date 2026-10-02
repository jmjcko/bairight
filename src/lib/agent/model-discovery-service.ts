import { AIProviderId } from './engine-config';

export interface ModelCandidate {
  name: string;
  rawName: string;
  displayName?: string;
  isFlash: boolean;
  score: number;
}

/**
 * ModelDiscoveryService provides dynamic, resilient, self-healing model resolution.
 * Instead of hardcoding model names that break when providers deprecate them,
 * this service dynamically discovers supported models, ranks them by capability and speed,
 * caches results in memory, and blacklists dead models on HTTP 404/410 errors.
 */
export class ModelDiscoveryService {
  private static cache: Map<string, { models: string[]; timestamp: number }> = new Map();
  private static blacklistedModels: Set<string> = new Set();
  private static priorityPromotions: string[] = [];
  private static CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

  // Resilient static defaults used only when offline or network discovery fails
  public static readonly DEFAULT_GEMINI_MODELS = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-3.8-flash',
    'gemini-3.5-flash',
    'gemini-flash-latest',
    'gemini-2.5-pro',
    'gemini-1.5-pro',
  ];

  public static readonly DEFAULT_OPENAI_MODELS = [
    'gpt-4o',
    'gpt-4o-mini',
    'o3-mini',
  ];

  public static readonly DEFAULT_CLAUDE_MODELS = [
    'claude-3-5-sonnet-20241022',
    'claude-3-7-sonnet-latest',
    'claude-3-5-haiku-latest',
  ];

  /**
   * Resolves sorted candidate model IDs for a given provider and API key.
   */
  public static async getCandidateModels(
    providerId: AIProviderId | string = 'google_gemini',
    apiKey?: string,
    options?: { forceRefresh?: boolean }
  ): Promise<string[]> {
    if (providerId === 'openai_gpt4o') {
      return [...this.DEFAULT_OPENAI_MODELS];
    }
    if (providerId === 'anthropic_claude') {
      return [...this.DEFAULT_CLAUDE_MODELS];
    }

    // Google Gemini dynamic discovery
    if (!apiKey) {
      return this.filterAvailable(this.mergeWithPromotions(this.DEFAULT_GEMINI_MODELS));
    }

    const cacheKey = `gemini_${apiKey.slice(-8)}`;
    if (!options?.forceRefresh) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
        const available = this.filterAvailable(this.mergeWithPromotions(cached.models));
        if (available.length > 0) return available;
      }
    }

    try {
      const discovered = await this.discoverGeminiModels(apiKey);
      if (discovered && discovered.length > 0) {
        this.cache.set(cacheKey, { models: discovered, timestamp: Date.now() });
        const available = this.filterAvailable(this.mergeWithPromotions(discovered));
        if (available.length > 0) return available;
      }
    } catch (e) {
      console.warn('[ModelDiscoveryService] Dynamic Gemini discovery failed, using fallbacks:', e);
    }

    return this.filterAvailable(this.mergeWithPromotions(this.DEFAULT_GEMINI_MODELS));
  }

  /**
   * Queries Google Generative Language API for models supporting generateContent,
   * excludes non-conversational specialized models (TTS, Image, Embedding, Robotics, etc.),
   * and ranks them by latency (Flash tier) and version.
   */
  public static async discoverGeminiModels(apiKey: string): Promise<string[]> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
    if (!res.ok) {
      throw new Error(`Gemini listModels HTTP ${res.status}`);
    }

    const data = await res.json();
    const rawModels: any[] = data?.models || [];

    const candidates: ModelCandidate[] = [];

    for (const m of rawModels) {
      const rawName: string = m.name || '';
      const name = rawName.replace(/^models\//, '');
      const supportedMethods: string[] = m.supportedGenerationMethods || [];

      // Must support generateContent
      if (!supportedMethods.includes('generateContent')) continue;

      // Filter out non-conversational models
      const lower = name.toLowerCase();
      if (
        lower.includes('tts') ||
        lower.includes('embedding') ||
        lower.includes('image') ||
        lower.includes('audio') ||
        lower.includes('transcribe') ||
        lower.includes('robotics') ||
        lower.includes('computer-use') ||
        lower.includes('veo') ||
        lower.includes('lyria') ||
        lower.includes('banana') ||
        lower.includes('aqa') ||
        lower.includes('customtools') ||
        lower.includes('deep-research') ||
        lower.includes('gemma') ||
        !lower.startsWith('gemini')
      ) {
        continue;
      }

      // Calculate score for ranking
      let score = 0;
      const isFlash = lower.includes('flash');
      const isPro = lower.includes('pro');

      // 1. Prefer flash models for fast conversational latency
      if (isFlash) score += 60;
      else if (isPro) score += 30;

      // 2. Stable models preferred over preview/experimental models
      if (lower.includes('preview')) score -= 8;
      if (lower.includes('experimental') || lower.includes('exp')) score -= 15;

      // 3. Extract version number if present (e.g. 2.5, 3.8, 3.5, 3.1)
      const versionMatch = lower.match(/(?:gemini|gemma)-?(\d+(?:\.\d+)?)/);
      if (versionMatch && versionMatch[1]) {
        const ver = parseFloat(versionMatch[1]);
        if (!isNaN(ver)) {
          // Weight newer version higher
          score += ver * 10;
        }
      }

      // Known exceptionally stable models get an extra boost
      if (name === 'gemini-2.5-flash') score += 20;

      candidates.push({
        name,
        rawName,
        displayName: m.displayName,
        isFlash,
        score,
      });
    }

    candidates.sort((a, b) => b.score - a.score);
    return candidates.map((c) => c.name);
  }

  /**
   * Marks a model as unavailable (e.g. on HTTP 404/410/503).
   * Also parses recommended replacement model from error body if present.
   */
  public static markModelUnavailable(modelName: string, errorBody?: string): string | null {
    const cleanName = modelName.replace(/^models\//, '');
    this.blacklistedModels.add(cleanName);
    console.warn(`[ModelDiscoveryService] Model "${cleanName}" marked as unavailable.`);

    // If Google returned an error suggesting a specific replacement model:
    // e.g. "This model models/gemini-2.0-flash is no longer available. Please update your code to use models/gemini-3.8-flash"
    if (errorBody) {
      const match = errorBody.match(/models\/([a-zA-Z0-9.\-_]+)/g);
      if (match) {
        for (const item of match) {
          const suggested = item.replace(/^models\//, '');
          if (suggested !== cleanName && !this.blacklistedModels.has(suggested)) {
            if (!this.priorityPromotions.includes(suggested)) {
              this.priorityPromotions.unshift(suggested);
            }
            console.info(`[ModelDiscoveryService] Auto-detected recommended replacement model: "${suggested}"`);
            return suggested;
          }
        }
      }
    }

    return null;
  }

  /**
   * Resets the cache and blacklist (useful for testing or manual reload).
   */
  private static lastSuccessfulModel: Map<string, string> = new Map();

  /**
   * Executes an asynchronous LLM operation with self-healing failover.
   * If the chosen model returns 404/410 (deprecated) or 503 (spike) or fails:
   * 1. It marks the model unavailable.
   * 2. If a suggested replacement is in errorBody, it immediately tries it.
   * 3. If initial candidates run out or fail, it triggers on-the-fly live discovery via listModels to find active models.
   * 4. Retries seamlessly across live candidate models.
   * 5. Remembers the last successful model per provider/key to prioritize it in subsequent calls.
   * 6. Returns the successful result, or null if all live models failed (triggering the deterministic safety net).
   */
  public static async executeWithResilientFailover<T>(params: {
    providerId: AIProviderId | string;
    apiKey: string;
    executeFn: (modelName: string) => Promise<{
      success: boolean;
      data?: T;
      status?: number;
      errorBody?: string;
      error?: any;
    }>;
  }): Promise<{ result: T | null; modelUsed?: string }> {
    const { providerId, apiKey, executeFn } = params;

    // Get current candidate models
    const initialCandidates = await this.getCandidateModels(providerId, apiKey);
    const candidateQueue: string[] = [...initialCandidates];

    // If we have a previously successful model for this key, prioritize it at the front
    const providerKey = `${providerId}_${apiKey ? apiKey.slice(-8) : 'default'}`;
    const lastWorking = this.lastSuccessfulModel.get(providerKey);
    if (lastWorking && candidateQueue.includes(lastWorking)) {
      const idx = candidateQueue.indexOf(lastWorking);
      candidateQueue.splice(idx, 1);
      candidateQueue.unshift(lastWorking);
    }

    const attempted = new Set<string>();

    while (candidateQueue.length > 0) {
      const model = candidateQueue.shift()!;
      if (attempted.has(model) || this.blacklistedModels.has(model)) {
        continue;
      }
      attempted.add(model);

      try {
        const response = await executeFn(model);

        if (response.success && response.data !== undefined) {
          // Success! Remember this working model for future calls
          this.lastSuccessfulModel.set(providerKey, model);
          return { result: response.data, modelUsed: model };
        }

        // Handle failure
        const status = response.status;
        const errorBody = response.errorBody;

        if (status === 404 || status === 410) {
          const suggestedReplacement = this.markModelUnavailable(model, errorBody);
          // If Google recommended a replacement model, queue it immediately!
          if (suggestedReplacement && !attempted.has(suggestedReplacement)) {
            candidateQueue.unshift(suggestedReplacement);
          }
        } else if (status === 503) {
          console.warn(`[ModelDiscoveryService] Model "${model}" temporarily unavailable (503 spike). Waiting 800ms and trying next candidate.`);
          if (process.env.NODE_ENV !== 'test') await new Promise((resolve) => setTimeout(resolve, 600));
        }
      } catch (err: any) {
        console.warn(`[ModelDiscoveryService] Exception calling model "${model}":`, err?.message || err);
      }
    }

    // If all initial candidate models failed for Google Gemini, trigger ON-THE-FLY live discovery!
    if (providerId === 'google_gemini' && apiKey) {
      try {
        console.info('[ModelDiscoveryService] Initial candidate models exhausted. Triggering real-time live discovery...');
        const freshModels = await this.discoverGeminiModels(apiKey);
        const unattemptedFresh = freshModels.filter((m) => !attempted.has(m) && !this.blacklistedModels.has(m));

        for (const freshModel of unattemptedFresh) {
          attempted.add(freshModel);
          try {
            const response = await executeFn(freshModel);
            if (response.success && response.data !== undefined) {
              this.lastSuccessfulModel.set(providerKey, freshModel);
              console.info(`[ModelDiscoveryService] On-the-fly recovery successful with newly discovered model: "${freshModel}"`);
              return { result: response.data, modelUsed: freshModel };
            }
          } catch (freshErr) {
            console.warn(`[ModelDiscoveryService] Fresh model "${freshModel}" failed:`, freshErr);
          }
        }
      } catch (discoveryErr) {
        console.warn('[ModelDiscoveryService] On-the-fly live discovery failed:', discoveryErr);
      }
    }

    // All LLM candidate models failed -> safety net will trigger in caller
    return { result: null, modelUsed: undefined };
  }

  public static reset(): void {
    this.cache.clear();
    this.blacklistedModels.clear();
    this.priorityPromotions = [];
    this.lastSuccessfulModel.clear();
  }

  private static mergeWithPromotions(models: string[]): string[] {
    const set = new Set([...this.priorityPromotions, ...models]);
    return Array.from(set);
  }

  private static filterAvailable(models: string[]): string[] {
    return models.filter((m) => !this.blacklistedModels.has(m.replace(/^models\//, '')));
  }
}
