import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DynamicAgentWizard } from '../DynamicAgentWizard';
import { PRESET_ERGO_CHAIR_AGENT } from '@/lib/agent/universal-agent-schema';

describe('DynamicAgentWizard Unit Test Suite (PRD v1)', () => {
  const mockOnAssessmentCompleted = vi.fn();
  const mockOnBackToLauncher = vi.fn();

  const mockEvaluationResponse = {
    agentId: 'ergo_seating',
    agentName: 'Ergonomické sezení & kancelář',
    category: 'Ergonomics & Spine',
    evaluatedAt: new Date().toISOString(),
    summaryAssessment: 'Detailní analýza ergonomických požadavků dokončena.',
    recommendations: [
      {
        id: 'herman-miller-aeron',
        brand: 'Herman Miller',
        model: 'Aeron Remastered',
        matchScore: 96,
        reasoning: 'Špičková podpora bederní páteře s PostureFit SL.',
        pros: ['Vysoká prodyšnost', 'Dlouhá životnost'],
        cons: ['Vyšší pořizovací cena'],
      },
    ],
    contraindicationsOrCaveats: ['Zkontrolujte maximální nosnost pístu.'],
    providerUsed: 'bAIright Universal Reasoning Engine',
    isLiveAI: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockEvaluationResponse,
    } as Response);
    window.alert = vi.fn();
  });

  it('1. Vykreslí dynamický dotazník z definice agenta s posuvníkem a kroky', () => {
    render(
      <DynamicAgentWizard
        agent={PRESET_ERGO_CHAIR_AGENT}
        onBackToLauncher={mockOnBackToLauncher}
      />
    );

    // Header title matches agent name
    expect(screen.getByText('Ergonomické sezení & kancelář')).toBeInTheDocument();
    expect(screen.getByText(/Denní doba strávená sezením/i)).toBeInTheDocument();

    // Export button is available
    expect(screen.getByText(/Exportovat .agent.md/i)).toBeInTheDocument();

    // Step 1 navigation button
    const nextButton = screen.getByRole('button', { name: /Pokračovat/i });
    expect(nextButton).toBeInTheDocument();
  });

  it('2. Umožňuje procházet kroky a v posledním kroku zobrazí tlačítka inspekce i vygenerování', () => {
    render(
      <DynamicAgentWizard
        agent={PRESET_ERGO_CHAIR_AGENT}
        onBackToLauncher={mockOnBackToLauncher}
      />
    );

    // Step through the 4 steps
    for (let i = 0; i < 3; i++) {
      const nextButton = screen.getByRole('button', { name: /Pokračovat/i });
      fireEvent.click(nextButton);
    }

    // On final step
    const inspectButton = screen.getByRole('button', { name: /Zkontrolovat prompt pro AI/i });
    const generateButton = screen.getByRole('button', { name: /Vygenerovat doporučení/i });

    expect(inspectButton).toBeInTheDocument();
    expect(generateButton).toBeInTheDocument();

    // Click inspector opens modal
    fireEvent.click(inspectButton);
    expect(screen.getByText(/Inspekce AI Promptu/i)).toBeInTheDocument();
  });

  it('3. Po odeslání zobrazí textová doporučení dle PRD (Značka, model, reasoning, pros, cons)', async () => {
    render(
      <DynamicAgentWizard
        agent={PRESET_ERGO_CHAIR_AGENT}
        onAssessmentCompleted={mockOnAssessmentCompleted}
      />
    );

    // Navigate to last step
    for (let i = 0; i < 3; i++) {
      fireEvent.click(screen.getByRole('button', { name: /Pokračovat/i }));
    }

    // Click generate
    const generateButton = screen.getByRole('button', { name: /Vygenerovat doporučení/i });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(mockOnAssessmentCompleted).toHaveBeenCalledTimes(1);
    });

    // Verify Phase 2 Revealed Results
    expect(screen.getByText(/Herman Miller/i)).toBeInTheDocument();
    expect(screen.getByText(/Aeron Remastered/i)).toBeInTheDocument();
    expect(screen.getByText(/Špičková podpora bederní páteře/i)).toBeInTheDocument();
    expect(screen.getByText(/Vysoká prodyšnost/i)).toBeInTheDocument();
    expect(screen.getByText(/Vyšší pořizovací cena/i)).toBeInTheDocument();
  });
});
