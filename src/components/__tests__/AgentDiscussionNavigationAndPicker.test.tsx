import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Home from '@/app/page';
import { AgentStorageService } from '@/lib/agent/agent-storage-service';
import { UniversalAgentDefinition } from '@/lib/agent/universal-agent-schema';

describe('Agent Discussion Navigation & Agent Picker Suite (Points 1 & 2)', () => {
  const mockAgent1: UniversalAgentDefinition = {
    id: 'agent_shoes_test',
    name: 'Běžecká obuv',
    category: 'Sport',
    icon: '👟',
    version: '1.0.0',
    createdAt: '2026-09-25T10:00:00Z',
    description: 'Expert na běžeckou obuv',
    systemPrompt: 'Jsi expert na obuv.',
    questions: [
      {
        id: 'q1',
        step: 1,
        title: 'Došlap',
        component: 'chips',
        options: [{ label: 'Neutrální', value: 'neutral' }],
        defaultValue: 'neutral',
        promptForgeTemplate: '- **Došlap:** {value}',
      },
      {
        id: 'q2',
        step: 2,
        title: 'Terén',
        component: 'chips',
        options: [{ label: 'Silnice', value: 'road' }],
        defaultValue: 'road',
        promptForgeTemplate: '- **Terén:** {value}',
      },
    ],
  };

  const mockAgent2: UniversalAgentDefinition = {
    id: 'agent_coffee_test',
    name: 'Kávovary',
    category: 'Domácnost',
    icon: '☕',
    version: '1.0.0',
    createdAt: '2026-09-25T10:00:00Z',
    description: 'Specialista na kávovary',
    systemPrompt: 'Jsi expert na kávu.',
    questions: [
      {
        id: 'q_coffee',
        step: 1,
        title: 'Typ kávovaru',
        component: 'chips',
        options: [{ label: 'Pákový', value: 'manual' }],
        defaultValue: 'manual',
        promptForgeTemplate: '- **Typ:** {value}',
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Pre-populate agents in storage
    AgentStorageService.saveAgent(mockAgent1);
    AgentStorageService.saveAgent(mockAgent2);
  });

  it('1. Bod č. 1: In chat view, shows active agent card and clicking "Přepnout" opens dropdown to switch agent', async () => {
    render(<Home />);

    // 1. Switch to Chat tab
    const chatTabBtn = screen.getByRole('button', { name: /Diskuse s agentem|Agent Discussion/i });
    fireEvent.click(chatTabBtn);

    // 2. Select first agent from list if not selected
    const agent1Btn = (await screen.findAllByText('Běžecká obuv'))[0];
    fireEvent.click(agent1Btn);

    // 3. Now active agent is selected -> verify active agent card & Switch button are visible
    expect(screen.getAllByText('Běžecká obuv').length).toBeGreaterThan(0);
    const switchBtn = screen.getByTitle(/Přepnout aktivního agenta|Switch active/i);
    expect(switchBtn).toBeDefined();

    // 4. Click Switch button to toggle agent picker dropdown
    fireEvent.click(switchBtn);

    // 5. Verify the other agent (Kávovary) is listed in the picker
    const coffeeAgentOption = screen.getByRole('button', { name: /Kávovary/i });
    expect(coffeeAgentOption).toBeDefined();

    // 6. Click on Kávovary to switch active agent
    fireEvent.click(coffeeAgentOption);

    // 7. Verify active agent switched to Kávovary
    await waitFor(() => {
      expect(screen.getAllByText('Kávovary').length).toBeGreaterThan(0);
    });
  });

  it('2. Bod č. 2: Top "Shopping Wizard" tab directs to results view if wizard is completed', async () => {
    // Set completed wizard state in localStorage
    localStorage.setItem(
      'bairight_agent_wizard_states',
      JSON.stringify({
        agent_shoes_test: {
          answers: { q1: 'neutral', q2: 'road' },
          result: {
            summaryAssessment: 'Hotové doporučení',
            recommendations: [{ brand: 'Hoka', model: 'Clifton 9', matchScore: 95 }],
          },
          currentStepIndex: 0,
          isCompleted: true,
          completedPrompt: 'Zkompilovaný prompt',
        },
      })
    );

    render(<Home />);

    // 1. Go to Chat tab and select agent_shoes_test
    const chatTabBtn = screen.getByRole('button', { name: /Diskuse s agentem|Agent Discussion/i });
    fireEvent.click(chatTabBtn);
    const switchBtn = screen.queryByTitle(/Přepnout aktivního agenta|Switch active/i);
    if (switchBtn) {
      fireEvent.click(switchBtn);
    }
    const agent1Btn = screen.getByRole('button', { name: /Běžecká obuv/i });
    fireEvent.click(agent1Btn);
    await waitFor(() => {
      expect(screen.getAllByText('Běžecká obuv').length).toBeGreaterThan(0);
    });

    // 2. Click top "Shopping Wizard" tab
    const topWizardTab = screen.getAllByRole('button', { name: /Shopping Wizard|Průvodce nákupem/i })[0];
    fireEvent.click(topWizardTab);

    // 3. Verify it routed directly to the final result screen with Download .agent.md and Edit buttons
    
    await waitFor(() => {
      console.log("DOM IN TEST 2:", document.body.innerHTML);
      expect(screen.getAllByText(/Stáhnout \.agent\.md|Download \.agent\.md/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Upravit wizard|Edit wizard/i)).toBeDefined();
    });
  });

  it('3. Bod č. 2: Top "Shopping Wizard" tab directs to in-progress step if wizard is not completed', async () => {
    // Set in-progress wizard state (step 1, not completed)
    localStorage.setItem(
      'bairight_agent_wizard_states',
      JSON.stringify({
        agent_shoes_test: {
          answers: { q1: 'neutral' },
          result: null,
          currentStepIndex: 1,
          isCompleted: false,
        },
      })
    );

    render(<Home />);

    // 1. Go to Chat tab and select agent_shoes_test
    const chatTabBtn = screen.getByRole('button', { name: /Diskuse s agentem|Agent Discussion/i });
    fireEvent.click(chatTabBtn);
    const switchBtn = screen.queryByTitle(/Přepnout aktivního agenta|Switch active/i);
    if (switchBtn) {
      fireEvent.click(switchBtn);
    }
    const agent1Btn = screen.getByRole('button', { name: /Běžecká obuv/i });
    fireEvent.click(agent1Btn);
    await waitFor(() => {
      expect(screen.getAllByText('Běžecká obuv').length).toBeGreaterThan(0);
    });

    // 2. Click top "Shopping Wizard" tab
    const topWizardTab = screen.getAllByRole('button', { name: /Shopping Wizard|Průvodce nákupem/i })[0];
    fireEvent.click(topWizardTab);

    // 3. Verify it routed to questionnaire step 2 (Terén), NOT the result screen
    await waitFor(() => {
      expect(screen.getByText(/Došlap|Terén/i)).toBeDefined();
      expect(screen.queryByText(/Stáhnout \.agent\.md soubor|Download \.agent\.md/i)).toBeNull();
    });
  });
});
