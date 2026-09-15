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
        agent: {
          id: 'custom_coffee_agent',
          name: 'Kávovary & domácí espresso',
          category: 'Appliances & Coffee',
          icon: '☕',
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
});

