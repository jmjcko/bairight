import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Home from '@/app/page';
import { AgentStorageService } from '@/lib/agent/agent-storage-service';
import { UniversalAgentDefinition } from '@/lib/agent/universal-agent-schema';
import { extractRecommendedProductsFromMessages } from '@/lib/agent/ranking-parser';

describe('Dynamic Leaderboard, Chat Resume and Prominent Switch Agent Suite', () => {
  const mockAgent: UniversalAgentDefinition = {
    id: 'agent_cycling_test',
    name: 'Cycling Shoes Expert Advisor',
    category: 'Cycling',
    icon: '',
    version: '1.0.0',
    createdAt: '2026-09-25T10:00:00Z',
    description: 'Helps you choose the perfect cycling shoes',
    systemPrompt: 'You are a cycling shoe expert.',
    questions: [
      {
        id: 'discipline',
        step: 1,
        title: 'Riding Discipline',
        component: 'chips',
        options: [{ label: 'Road Cycling', value: 'road' }],
        defaultValue: 'road',
        promptForgeTemplate: '- **Discipline:** {value}',
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    AgentStorageService.saveAgent(mockAgent);
    localStorage.setItem(
      'bairight_api_keys',
      JSON.stringify({ google_gemini: 'test-valid-key' })
    );
  });

  it('1. Shows prominent Switch Agent button and renders non-clickable leaderboard', async () => {
    localStorage.setItem(
      'bairight_agent_wizard_states',
      JSON.stringify({
        agent_cycling_test: {
          answers: { discipline: 'road' },
          result: {
            summaryAssessment: 'Recommended top road shoes',
            recommendations: [
              {
                brand: 'Specialized',
                model: 'S-Works Torch',
                matchScore: 98,
                reasoning: 'Top performance road shoe',
              },
              {
                brand: 'Shimano',
                model: 'S-Phyre RC903',
                matchScore: 95,
                reasoning: 'Stiff and precise fit',
              },
            ],
          },
          isCompleted: true,
        },
      })
    );

    render(<Home />);

    // Switch to Chat tab
    const chatTabBtn = screen.getByRole('button', { name: /Diskuse s agentem|Agent Discussion/i });
    fireEvent.click(chatTabBtn);

    // Select agent
    const agentBtn = (await screen.findAllByText('Cycling Shoes Expert Advisor'))[0];
    fireEvent.click(agentBtn);

    // Verify Switch Agent button is prominent and localized
    const switchBtn = screen.getByRole('button', { name: /SWITCH AGENT|ZMĚNIT AGENTA/i });
    expect(switchBtn).toBeDefined();

    // Verify dynamic leaderboard is rendered
    await waitFor(() => {
      expect(screen.getAllByText(/S-Works Torch/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/S-Phyre RC903/i).length).toBeGreaterThan(0);
    });

    // Verify items in the leaderboard are NOT clickable buttons
    const torchElements = screen.getAllByText(/S-Works Torch/i);
    for (const el of torchElements) {
      expect(el.closest('button')).toBeNull();
    }
  });

  it('2. Does not duplicate initial prompt when entering an already initialized chat', async () => {
    localStorage.setItem(
      'bairight_chat_messages_agent_cycling_test',
      JSON.stringify([
        { id: '1', role: 'user', content: 'Existing user question from previous session' },
        { id: '2', role: 'assistant', content: 'Existing answer from assistant' },
      ])
    );
    localStorage.setItem('bairight_chat_initialized_agent_cycling_test', 'true');

    render(<Home />);

    const chatTabBtn = screen.getByRole('button', { name: /Diskuse s agentem|Agent Discussion/i });
    fireEvent.click(chatTabBtn);

    const agentBtn = (await screen.findAllByText('Cycling Shoes Expert Advisor'))[0];
    fireEvent.click(agentBtn);

    await waitFor(() => {
      expect(screen.getByText('Existing user question from previous session')).toBeDefined();
    });

    expect(screen.queryByText(/Please recommend your top 3 specific product choices/i)).toBeNull();
    expect(screen.queryByText(/Doporuč mi prosím své 3 konkrétní doporučené produkty/i)).toBeNull();
  });

  it('3. Dynamically extracts and updates top 3 recommendations from latest assistant message in chat', () => {
    const assistantMessageWithRecs = {
      id: 'msg-rec-turn-1',
      role: 'assistant' as const,
      timestamp: '12:00',
      content: `
# Expert Purchasing Recommendation

## Top 3 Recommended Models

### 1. Specialized S-Works Torch (Match: 98%)
- **Why this model fits:** Supreme stiffness.

### 2. Shimano S-Phyre RC903 (Match: 95%)
- **Why this model fits:** Dual BOA Li2.

### 3. Giro Imperial Road (Match: 91%)
- **Why this model fits:** Ultralight synchwire upper.
      `,
    };

    const parsed = extractRecommendedProductsFromMessages([
      { id: 'msg-0', role: 'user', content: 'Recommend shoes', timestamp: '12:00' },
      assistantMessageWithRecs,
    ]);

    expect(parsed.length).toBe(3);
    expect(parsed[0].fullName).toBe('Specialized S-Works Torch');
    expect(parsed[0].matchScore).toBe('98%');
    expect(parsed[1].fullName).toBe('Shimano S-Phyre RC903');
    expect(parsed[1].matchScore).toBe('95%');
    expect(parsed[2].fullName).toBe('Giro Imperial Road');
    expect(parsed[2].matchScore).toBe('91%');

    // Simulate user asking for cheaper options and assistant sending a new turn
    const secondTurn = {
      id: 'msg-rec-turn-2',
      role: 'assistant' as const,
      timestamp: '12:00',
      content: `
Zde jsou 3 levnější alternativy pod 100 USD:

1. **Shimano RC100** (Shoda: 94%)
Skvělý poměr cena výkon.

2. **Giro Stylus** (Shoda: 90%)
Kvalitní a dostupná silniční obuv.

3. **Triban RC 500** (Shoda: 87%)
Nejdostupnější model s 3-děrovým systémem.
      `,
    };

    const recalibrated = extractRecommendedProductsFromMessages([
      { id: 'msg-0', role: 'user', content: 'Recommend shoes', timestamp: '12:00' },
      assistantMessageWithRecs,
      { id: 'msg-2', role: 'user', content: 'Give me budget options under 100 USD', timestamp: '12:01' },
      secondTurn,
    ]);

    expect(recalibrated.length).toBe(3);
    expect(recalibrated[0].fullName).toBe('Shimano RC100');
    expect(recalibrated[0].matchScore).toBe('94%');
    expect(recalibrated[1].fullName).toBe('Giro Stylus');
    expect(recalibrated[2].fullName).toBe('Triban RC 500');
  });

  it('4. Renders agent-specific greeting for empty chat and never shows generic Cars/Coffee/Footwear greeting', async () => {
    render(<Home />);

    const chatTabBtn = screen.getByRole('button', { name: /Diskuse s agentem|Agent Discussion/i });
    fireEvent.click(chatTabBtn);

    const agentBtn = (await screen.findAllByText('Cycling Shoes Expert Advisor'))[0];
    fireEvent.click(agentBtn);

    await waitFor(() => {
      expect(screen.getAllByText(/Cycling Shoes Expert Advisor/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/I am your specialized AI advisor|Jsem váš specializovaný AI nákupní rádce/i)).toBeDefined();
    });

    // Verify the legacy placeholder categories are NOT present in the chat
    expect(screen.queryByText(/Cars & Family Vehicles/i)).toBeNull();
    expect(screen.queryByText(/Coffee Machines & Espresso/i)).toBeNull();
    expect(screen.queryByText(/Automobily & rodinné vozy/i)).toBeNull();
    expect(screen.queryByText(/select an agent above to start an interactive wizard/i)).toBeNull();
  });
});
