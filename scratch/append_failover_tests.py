with open('src/lib/agent/__tests__/model-discovery-service.test.ts', 'r') as f:
    content = f.read()

new_tests = '''
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
});
'''

last_close = content.rfind("});")
if last_close != -1:
    content = content[:last_close] + new_tests
    with open('src/lib/agent/__tests__/model-discovery-service.test.ts', 'w') as f:
        f.write(content)
    print("Appended failover tests successfully")
