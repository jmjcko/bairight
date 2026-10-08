import { describe, it, expect } from 'vitest';
import { processAgentConversation } from '../agent-executor';
import { INITIAL_USER_FACTS, INITIAL_ASSESSMENT_RECORDS } from '../engine-config';
import { POST as chatHandler } from '@/app/api/agent/chat/route';
import { NextRequest } from 'next/server';

describe('Conversational Agent Chat & Parameter Responsiveness', () => {
  it('1. When user asks for 10 parameters, agent provides 10 criteria and does NOT repeat static clarifying questions', async () => {
    const sessionId = `test-chat-session-${Date.now()}`;
    
    // User first says they want to buy shoes
    const firstRes = await processAgentConversation(sessionId, 'chci koupit boty');
    expect(firstRes.message.content).toBeDefined();

    // User then requests 10 parameters: "rekl jsem ze chci 10"
    const secondRes = await processAgentConversation(sessionId, 'rekl jsem ze chci 10');
    
    expect(secondRes.message.content).toContain('10 klíčových parametrů');
    expect(secondRes.message.content).toContain('1. **Šířka kopyta');
    expect(secondRes.message.content).toContain('10. **Zdravotní kompatibilita');
    expect(secondRes.message.content).not.toContain('potřebuji ještě upřesnit 5 klíčových parametrů');
  });

  it('2. Extracts biomechanical updates when provided in text', async () => {
    const sessionId = `test-biomech-session-${Date.now()}`;
    
    const res = await processAgentConversation(
      sessionId, 
      'Vážím 85 kg, mám širokou nohu 2E a artrózu kolene 3. stupně'
    );

    expect(res.updatedProfile.weight_kg).toBe(85);
    expect(res.updatedProfile.foot_width).toBe('wide_2e');
    expect(res.updatedProfile.knee_condition).toBe('osteoarthritis_grade_3');
  });

  it('3. INITIAL_USER_FACTS and INITIAL_ASSESSMENT_RECORDS start completely empty for user account purity', () => {
    expect(INITIAL_USER_FACTS).toEqual([]);
    expect(INITIAL_ASSESSMENT_RECORDS).toEqual([]);
  });

  it('4. Chat API strictly isolates RAG facts: footwear biomechanics (kopyto, 2E) never leak into coffee machine discussion', async () => {
    const req = new NextRequest('http://localhost:3000/api/agent/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: `test-isolation-${Date.now()}`,
        message: 'jak kavovar do firmy?',
        apiKey: 'AIzaSyTestKey',
        agent: {
          id: 'custom_coffee_agent',
          name: 'Kávovary & domácí espresso',
          category: 'Appliances & Coffee',
          icon: '',
        },
        ragFacts: [
          { id: 'f1', label: 'Anatomie chodidla', value: 'širší kopyto (2E)', category: 'biometrics' },
          { id: 'f2', label: 'Klouby', value: 'artróza kolene', category: 'medical' },
          { id: 'f3', label: 'Servis', value: 'Dostupnost záručního servisu v ČR', category: 'preference' },
        ],
      }),
    });

    const response = await chatHandler(req);
    expect(response.status).toBe(200);

    const json = await response.json();
    const content = json.message.content;

    // Must NOT contain shoe biomechanics
    expect(content).not.toContain('kopyto');
    expect(content).not.toContain('2E');
    expect(content).not.toContain('artróza');
    expect(content).not.toContain('chodidl');

    // Must contain relevant coffee / office criteria
    expect(content).toContain('Denní kapacita');
    expect(content).toContain('Kávovary & domácí espresso');
  });

  it('5. When user asks "proč mi nabízíš pouze duotone?" on a wizard-compiled agent, agent answers conversationally without repeating 3-model report template', async () => {
    const req = new NextRequest('http://localhost:3000/api/agent/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: `test-duotone-${Date.now()}`,
        message: 'proč mi nabízíš pouze duotone?',
        agent: {
          id: 'custom_kitesurfing_agent',
          name: 'Kitesurfing poradce',
          category: 'Vodní sporty',
          systemPrompt: `Jsi expert na kitesurfing.
### STRIKTNÍ A ZÁVAZNÉ POŽADAVKY UŽIVATELE:
- Rozpočet: 45 000 Kč
- Zkušenost: mírně pokročilý
### POŽADOVANÝ FORMÁT ODPOVĚDI (HUMAN-READABLE MARKDOWN):
# Expertní nákupní doporučení: Kitesurfing poradce
## Top 3 Doporučené Modely
### 1. Duotone Rebel SLS`,
        },
        assessmentContext: {
          missionName: 'Kitesurfing poradce',
          diagnosisSummary: 'Výběr freeride draka do 45 000 Kč pro mírně pokročilého',
          recommendedModels: [
            { brand: 'Duotone', model: 'Rebel SLS', badge: 'Shoda 96%', rationale: 'Špičková stabilita a větrný rozsah', pros: ['Snadný restart', 'Vysoká odolnost'], cons: ['Vyšší cena'] },
            { brand: 'Duotone', model: 'Dice', badge: 'Shoda 92%', rationale: 'Univerzální freestyle/wave drak', pros: ['Rychlé reakce', 'Výborný tah'], cons: ['Vyžaduje citlivější trim'] },
            { brand: 'Duotone', model: 'Evo D/LAB', badge: 'Shoda 88%', rationale: 'Prémiový all-round', pros: ['Materiál Aluula', 'Extrémní lehkost'], cons: ['Překračuje rozpočet'] },
          ],
        },
      }),
    });

    const response = await chatHandler(req);
    expect(response.status).toBe(200);

    const json = await response.json();
    const content = json.message.content;

    // Must be conversational dialogue
    expect(content).toContain('Konzultace výběru a značek');
    expect(content).toContain('Duotone');
    expect(content).toContain('Jako nezávislý nákupní rádce');

    // MUST NOT repeat the full initial report template or dump the 3 product cards
    expect(content).not.toContain('# Expertní nákupní doporučení');
    expect(content).not.toContain('## Top 3 Doporučené Modely');
    expect(content).not.toContain('### 1. Duotone Rebel SLS');
  });

  it('6. When user explicitly asks "doporuč mi 3 modely", agent provides the full 3-model recommendation report', async () => {
    const req = new NextRequest('http://localhost:3000/api/agent/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: `test-recommendation-${Date.now()}`,
        message: 'doporuč mi 3 konkrétní modely',
        agent: {
          id: 'custom_kitesurfing_agent',
          name: 'Kitesurfing poradce',
          category: 'Vodní sporty',
          systemPrompt: 'Jsi expert na kitesurfing.',
        },
        assessmentContext: {
          missionName: 'Kitesurfing poradce',
          diagnosisSummary: 'Výběr freeride draka do 45 000 Kč pro mírně pokročilého',
          recommendedModels: [
            { brand: 'Duotone', model: 'Rebel SLS', badge: 'Shoda 96%', rationale: 'Špičková stabilita a větrný rozsah', pros: ['Snadný restart'], cons: ['Vyšší cena'] },
            { brand: 'Duotone', model: 'Dice', badge: 'Shoda 92%', rationale: 'Univerzální drak', pros: ['Rychlé reakce'], cons: ['Citlivější trim'] },
            { brand: 'Core', model: 'XR8', badge: 'Shoda 90%', rationale: 'Výkonný freeride', pros: ['Masivní skoky'], cons: ['Dražší bar'] },
          ],
        },
      }),
    });

    const response = await chatHandler(req);
    expect(response.status).toBe(200);

    const json = await response.json();
    const content = json.message.content;

    // Must output the full 3-model recommendation structure
    expect(content).toContain('# Expertní nákupní doporučení');
    expect(content).toContain('## Top 3 Doporučené Modely');
    expect(content).toContain('Duotone Rebel SLS');
    expect(content).toContain('Duotone Dice');
    expect(content).toContain('Core XR8');
  });

  it('7. When user asks in English "why are you only offering duotone?", agent answers conversationally in English without report template', async () => {
    const req = new NextRequest('http://localhost:3000/api/agent/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: `test-en-duotone-${Date.now()}`,
        message: 'why are you only offering duotone?',
        locale: 'en',
        agent: {
          id: 'custom_kitesurfing_agent_en',
          name: 'Kitesurfing Advisor',
          category: 'Water Sports',
          systemPrompt: 'You are a kitesurfing expert.',
        },
        assessmentContext: {
          missionName: 'Kitesurfing Advisor',
          diagnosisSummary: 'Freeride kite selection under $2,000 for intermediate rider',
          recommendedModels: [
            { brand: 'Duotone', model: 'Rebel SLS', badge: 'Match 96%', rationale: 'Benchmark freeride booster', pros: ['Easy relaunch'], cons: ['Higher price'] },
            { brand: 'Duotone', model: 'Dice', badge: 'Match 92%', rationale: 'Versatile freestyle/wave kite', pros: ['Crisp handling'], cons: ['Requires trim precision'] },
          ],
        },
      }),
    });

    const response = await chatHandler(req);
    expect(response.status).toBe(200);

    const json = await response.json();
    const content = json.message.content;

    // Must be English conversational consultation
    expect(content).toContain('Brand & Model Consultation');
    expect(content).toContain('Duotone');
    expect(content).toContain('independent purchasing consultant');
    expect(content).not.toContain('# Expert Purchasing Recommendation');
    expect(content).not.toContain('## Top 3 Recommended Models');
  });
});
