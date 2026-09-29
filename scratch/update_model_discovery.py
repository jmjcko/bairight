with open('src/lib/agent/model-discovery-service.ts', 'r') as f:
    content = f.read()

new_methods = '''  private static lastSuccessfulModel: Map<string, string> = new Map();

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
          console.warn(`[ModelDiscoveryService] Model "${model}" temporarily unavailable (503 spike). Trying next candidate.`);
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
'''

# Insert before "  public static reset(): void {"
content = content.replace("  public static reset(): void {", new_methods + "\n  public static reset(): void {")

# Update reset() to clear lastSuccessfulModel
old_reset = """  public static reset(): void {
    this.cache.clear();
    this.blacklistedModels.clear();
    this.priorityPromotions = [];
  }"""

new_reset = """  public static reset(): void {
    this.cache.clear();
    this.blacklistedModels.clear();
    this.priorityPromotions = [];
    this.lastSuccessfulModel.clear();
  }"""

content = content.replace(old_reset, new_reset)

with open('src/lib/agent/model-discovery-service.ts', 'w') as f:
    f.write(content)

print("Updated ModelDiscoveryService with executeWithResilientFailover")
