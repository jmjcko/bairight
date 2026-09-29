import { describe, it, expect } from 'vitest';
import { forgeAgentPrompt, serializeAgentToMarkdown, UniversalAgentDefinition } from '../universal-agent-schema';
import { POST as chatHandler } from '@/app/api/agent/chat/route';
import { NextRequest } from 'next/server';

describe('E2E Wizard to Chat Integration Test Suite', () => {
  const sampleCoffeeAgent: UniversalAgentDefinition = {
    id: 'agent_coffee_e2e',
    name: 'Espresso Machine Specialist',
    category: 'Coffee & Appliances',
    icon: '☕',
    version: '1.0.0',
    createdAt: new Date().toISOString(),
    description: 'Expert advisor for home and office espresso machines.',
    systemPrompt: 'You are a master barista and espresso machine technician.',
    questions: [
      {
        id: 'budget_czk',
        step: 1,
        title: 'Max Budget',
        subtitle: 'Enter your maximum budget in CZK.',
        component: 'slider',
        sliderConfig: { min: 5000, max: 100000, step: 1000, unit: 'CZK', defaultValue: 25000 },
        defaultValue: 25000,
        promptForgeTemplate: '- **Max Budget:** {value}',
      },
      {
        id: 'pressure_bar',
        step: 1,
        title: 'Espresso Pressure',
        subtitle: 'Select desired pump pressure.',
        component: 'chips',
        isMultiSelect: false,
        options: [
          { label: '9-15 bar (Standard Pump)', value: '9_15_bar_pump' },
          { label: 'Rotary Pump (15+ bar)', value: 'rotary_pump_15_bar' },
        ],
        defaultValue: '9_15_bar_pump',
        promptForgeTemplate: '- **Espresso Pressure:** {value}',
      },
    ],
  };

  const sampleAnswers = {
    budget_czk: 25000,
    pressure_bar: '9_15_bar_pump',
  };

  it('1. Parameter Creation: forgeAgentPrompt parses raw values (9_15_bar_pump -> 9-15 bar) and serializes clean markdown without FE schema dumps', () => {
    const promptEN = forgeAgentPrompt(sampleCoffeeAgent, sampleAnswers, [], 'en');

    // Must contain human-readable labels instead of raw underscored values
    expect(promptEN).toContain('9-15 bar (Standard Pump)');
    expect(promptEN).not.toContain('9_15_bar_pump');
    expect(promptEN).toContain('- **Max Budget:** 25000 CZK');

    // serializeAgentToMarkdown must NOT leak raw question UI schemas
    const fullMarkdown = serializeAgentToMarkdown(sampleCoffeeAgent, sampleAnswers, 'en');
    expect(fullMarkdown).not.toContain('"component": "chips"');
    expect(fullMarkdown).not.toContain('"isMultiSelect"');
    expect(fullMarkdown).toContain('---');
    expect(fullMarkdown).toContain('# System Prompt & Evaluation Directives');
  });

  it('2. Wizard-to-Chat Hand-off: Initial query is clean in both EN and CS without legacy developer placeholders', () => {
    const isEn = true;
    const initialQueryEN = isEn
      ? 'Based on all parameters and rules in your instructions, please give me your top 3 specific product recommendations.'
      : 'Na základě všech zadaných parametrů a pravidel v instrukcích mi prosím navrhni 3 nejlepší konkrétní produkty.';

    expect(initialQueryEN).not.toContain('[Full Model Name]');
    expect(initialQueryEN).not.toContain('[Clear rationale]');
    expect(initialQueryEN).not.toContain('[Parameter match]');
    expect(initialQueryEN).toBe('Based on all parameters and rules in your instructions, please give me your top 3 specific product recommendations.');

    const initialQueryCS = false
      ? 'Based on all parameters and rules in your instructions, please give me your top 3 specific product recommendations.'
      : 'Na základě všech zadaných parametrů a pravidel v instrukcích mi prosím navrhni 3 nejlepší konkrétní produkty.';

    expect(initialQueryCS).toContain('3 nejlepší konkrétní produkty');
  });

  it('3. Chat API & Gemini Payload Sanitization: Drops leading assistant messages so payloadContents always starts with user role (prevents HTTP 400)', async () => {
    const forgedPrompt = forgeAgentPrompt(sampleCoffeeAgent, sampleAnswers, [], 'en');
    const updatedAgent = { ...sampleCoffeeAgent, systemPrompt: forgedPrompt };

    const req = new NextRequest('http://localhost:3000/api/agent/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: `e2e-session-${Date.now()}`,
        message: 'Based on all parameters and rules in your instructions, please give me your top 3 specific product recommendations.',
        agent: updatedAgent,
        locale: 'en',
        apiKey: 'AIzaSyTestKeyForGeminiSanitization',
        history: [
          {
            id: 'summary-1',
            role: 'assistant',
            content: '### Evaluation Complete for Espresso Machine Specialist\nAll user parameters compiled.',
            timestamp: new Date().toISOString(),
          },
        ],
        assessmentContext: {
          missionName: sampleCoffeeAgent.name,
          diagnosisSummary: 'User requires a 25,000 CZK espresso machine with 9-15 bar pressure.',
          keyParameters: sampleAnswers,
          recommendedModels: [
            { brand: 'DeLonghi', model: 'Dedica EC685', matchScore: 95, rationale: 'Fits 25,000 CZK budget and 15 bar pump.' },
            { brand: 'Sage', model: 'Barista Express BES875', matchScore: 92, rationale: 'Integrated grinder and 15 bar pressure.' },
            { brand: 'Gaggia', model: 'Classic EVO PRO', matchScore: 89, rationale: 'Commercial 58mm portafilter and 15 bar pump.' },
          ],
          completedPrompt: forgedPrompt,
        },
      }),
    });

    const res = await chatHandler(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.message).toBeDefined();
    expect(json.message.role).toBe('assistant');
  });

  it('4. Bilingual Fallback Response: In EN locale with completed wizard assessment, chat returns 100% English Markdown with top 3 recommendations and NO Czech text', async () => {
    const req = new NextRequest('http://localhost:3000/api/agent/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: `e2e-bilingual-en-${Date.now()}`,
        message: 'Based on all parameters and rules in your instructions, please give me your top 3 specific product recommendations.',
        agent: sampleCoffeeAgent,
        locale: 'en',
        apiKey: '', // Zero key mode to trigger fallback
        assessmentContext: {
          missionName: 'Espresso Machine Specialist',
          diagnosisSummary: 'Tailored espresso machine recommendations based on your preferences.',
          keyParameters: sampleAnswers,
          recommendedModels: [
            { brand: 'DeLonghi', model: 'Dedica EC685', matchScore: 95, rationale: 'Compact design with 15 bar pump.' },
            { brand: 'Sage', model: 'Barista Express', matchScore: 92, rationale: 'Built-in grinder with PID temperature control.' },
            { brand: 'Gaggia', model: 'Classic PRO', matchScore: 88, rationale: '58mm commercial portafilter.' },
          ],
        },
      }),
    });

    const res = await chatHandler(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    const content = json.message.content;

    // Must contain 100% English headers and models
    expect(content).toContain('# Expert Purchasing Recommendation: Espresso Machine Specialist');
    expect(content).toContain('## Executive Summary & Selection Rationale');
    expect(content).toContain('## Top 3 Recommended Models');
    expect(content).toContain('1. DeLonghi Dedica EC685 (Match 95%)');
    expect(content).toContain('- **Why Recommended:** Compact design with 15 bar pump.');
    expect(content).toContain('2. Sage Barista Express (Match 92%)');
    expect(content).toContain('3. Gaggia Classic PRO (Match 88%)');

    // Must NOT contain Czech text leaks
    expect(content).not.toContain('Expertní nákupní doporučení');
    expect(content).not.toContain('Rád vám pomohu');
    expect(content).not.toContain('Pro přesné zacílení mi prosím upřesněte');
    expect(content).not.toContain('Souhrnné hodnocení');
  });

  it('5. Bilingual Fallback Response: In CS locale with completed wizard assessment, chat returns Czech Markdown with top 3 recommendations', async () => {
    const req = new NextRequest('http://localhost:3000/api/agent/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: `e2e-bilingual-cs-${Date.now()}`,
        message: 'Na základě všech zadaných parametrů a pravidel v instrukcích mi prosím navrhni 3 nejlepší konkrétní produkty.',
        agent: sampleCoffeeAgent,
        locale: 'cs',
        apiKey: '', // Zero key mode to trigger fallback
        assessmentContext: {
          missionName: 'Espresso Machine Specialist',
          diagnosisSummary: 'Doporučení kávovarů na míru podle vašich požadavků.',
          keyParameters: sampleAnswers,
          recommendedModels: [
            { brand: 'DeLonghi', model: 'Dedica EC685', matchScore: 95, rationale: 'Kompaktní rozměry a tlak 15 barů.' },
            { brand: 'Sage', model: 'Barista Express', matchScore: 92, rationale: 'Integrovaný mlýnek s elektronickým termostatem.' },
            { brand: 'Gaggia', model: 'Classic PRO', matchScore: 88, rationale: 'Komerční páka 58mm pro profesionální přípravu.' },
          ],
        },
      }),
    });

    const res = await chatHandler(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    const content = json.message.content;

    expect(content).toContain('# Expertní nákupní doporučení: Espresso Machine Specialist');
    expect(content).toContain('## Souhrnné hodnocení a strategie výběru');
    expect(content).toContain('## Top 3 Doporučené Modely');
    expect(content).toContain('1. DeLonghi Dedica EC685 (Shoda 95%)');
    expect(content).toContain('- **Proč doporučujeme:** Kompaktní rozměry a tlak 15 barů.');
  });

  it('6. Running shoes custom agent without pre-existing assessmentContext in EN returns top 3 running shoe models without Czech consultative text', async () => {
    const runningShoesAgent: UniversalAgentDefinition = {
      id: 'agent-running-shoes-custom-123',
      name: 'Specialist in Running Shoes',
      category: 'Footwear & Running',
      icon: '👟',
      version: '1.1.0',
      createdAt: new Date().toISOString(),
      description: 'Expert shopping advisor for running shoes.',
      systemPrompt: 'Expert shopping advisor for running shoes.',
      questions: [],
    };

    const req = new NextRequest('http://localhost:3000/api/agent/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: `e2e-running-shoes-en-${Date.now()}`,
        message: 'Based on all parameters and rules in your instructions, please give me your top 3 specific product recommendations.',
        agent: runningShoesAgent,
        locale: 'en',
        apiKey: '',
      }),
    });

    const res = await chatHandler(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    const content = json.message.content;

    // Must return top 3 formatted shoe recommendations
    expect(content).toContain('# Expert Purchasing Recommendation: Specialist in Running Shoes');
    expect(content).toContain('## Top 3 Recommended Models');
    expect(content).toContain('Hoka Bondi 8 (Wide 2E)');
    expect(content).toContain('Brooks Ghost Max (Wide 2E)');
    expect(content).toContain('Saucony Echelon 9 (Wide 2E)');
    expect(content).toContain('- **Why Recommended:**');
    expect(content).toContain('- **Key Pros:**');
    expect(content).toContain('- **Trade-offs & Cons:**');

    // Must NOT contain Czech consultative fallback or template placeholders
    expect(content).not.toContain('Rozumím vašemu požadavku');
    expect(content).not.toContain('Jako váš nezávislý nákupní poradce');
    expect(content).not.toContain('[Full Model Name]');
    expect(content).not.toContain('[Clear rationale]');
    expect(content).not.toContain('Doporučená volba');
  });

  it('7. Universal evaluation fallback for running shoes recognizes custom agent IDs in English and produces real models with zero Czech leakage', async () => {
    const { POST: evaluateHandler } = await import('@/app/api/agent/evaluate-universal-agent/route');

    const runningShoesAgent: UniversalAgentDefinition = {
      id: 'agent-running-shoes-xyz',
      name: 'bAIright: Specialist in running shoes',
      category: 'Shopping selection for running shoes',
      icon: '👟',
      version: '1.1.0',
      createdAt: new Date().toISOString(),
      description: 'Custom shopping agent tailored with 4 key parameters.',
      systemPrompt: 'Expert shopping advisor for running shoes.',
      questions: [],
    };

    const req = new NextRequest('http://localhost:3000/api/agent/evaluate-universal-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent: runningShoesAgent,
        answers: {
          running_style: 'Road Running',
          cushioning: 'Maximum Cushioning',
        },
        locale: 'en',
        apiKey: '', // triggers fallback
      }),
    });

    const res = await evaluateHandler(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.recommendations).toHaveLength(3);
    expect(data.recommendations[0].brand).toBe('Hoka');
    expect(data.recommendations[0].model).toBe('Bondi 8 (Wide 2E)');
    expect(data.recommendations[0].reasoning).toContain('cushioning');
    expect(data.summaryAssessment).toContain('Based on your profile');

    // Must NOT contain generic "Doporučená volba" or Czech text
    expect(data.recommendations[0].brand).not.toBe('Doporučená volba');
    expect(data.summaryAssessment).not.toContain('Na základě vašeho profilu');
  });

  it('8. forgeAgentPrompt strictly strips any template placeholders ([Full Model Name], RESPONSE FORMATTING MANDATE) from raw prompts', () => {
    const dirtyAgent: UniversalAgentDefinition = {
      id: 'dirty-template-agent',
      name: 'Test Agent',
      category: 'Testing',
      icon: '🧪',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      description: 'Testing template stripping',
      systemPrompt: `You are an expert advisor.
      
RESPONSE FORMATTING MANDATE:
You MUST format your top 3 product recommendations clearly using Markdown:

### 1. [Full Model Name & Designation]
- **Why Recommended:** [Clear 1-2 sentence rationale matching user's specific parameters]
- **Key Specs:** [Key technical specifications and why it fits]
- **Pros:** [Advantage 1, Advantage 2]
- **Cons:** [Disadvantage / Trade-off 1]

### User Specified & Tuned Parameters:
User specified parameters here.`,
      questions: [
        {
          id: 'q1',
          step: 1,
          title: 'Speed requirement',
          component: 'text',
          isMultiSelect: false,
          defaultValue: '',
          promptForgeTemplate: '- **Speed:** {value}',
        },
      ],
    };

    const forgedPrompt = forgeAgentPrompt(dirtyAgent, { q1: 'High Speed' }, [], 'en');
    expect(forgedPrompt).not.toContain('[Full Model Name');
    expect(forgedPrompt).not.toContain('[Clear 1-2 sentence rationale');
    expect(forgedPrompt).not.toContain('RESPONSE FORMATTING MANDATE');
    expect(forgedPrompt).toContain('- **Speed:** High Speed');
  });
});
