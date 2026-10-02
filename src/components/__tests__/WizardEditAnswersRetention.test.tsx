import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DynamicAgentWizard } from '../DynamicAgentWizard';
import { UniversalAgentDefinition } from '@/lib/agent/universal-agent-schema';

describe('Wizard Edit Mode: Answer Retention & Non-Destructive Navigation', () => {
  const mockAgent: UniversalAgentDefinition = {
    id: 'agent_headphones_retention_test',
    name: 'Specialist: true wireless headphones',
    category: 'True Wireless Headphones',
    icon: '🎧',
    version: '1.0.0',
    description: 'Shopping agent tailored with test parameters.',
    createdAt: new Date().toISOString(),
    systemPrompt: 'You are a headphones specialist.',
    targetValues: {
      baselineModel: 'Nothing ear',
      fit_style: ['in_ear'],
      noise_cancellation: ['basic_active', 'hybrid_active'],
      battery_life: 7,
    },
    questions: [
      {
        id: 'fit_style',
        step: 1,
        title: 'Fit & Tip Style',
        subtitle: 'Select tip preference',
        component: 'chips',
        isMultiSelect: true,
        options: [
          { label: 'In-Ear', value: 'in_ear' },
          { label: 'Open-Fit / Semi-In-Ear', value: 'open_fit' },
        ],
        defaultValue: [],
      },
      {
        id: 'noise_cancellation',
        step: 2,
        title: 'Noise Cancellation',
        subtitle: 'Select ANC mode',
        component: 'chips',
        isMultiSelect: true,
        options: [
          { label: 'Basic Active', value: 'basic_active' },
          { label: 'Hybrid Active', value: 'hybrid_active' },
          { label: 'Passive Only', value: 'passive_only' },
        ],
        defaultValue: [],
      },
      {
        id: 'battery_life',
        step: 3,
        title: 'Battery Life',
        subtitle: 'Minimum playtime per charge',
        component: 'slider',
        sliderConfig: {
          min: 4,
          max: 12,
          step: 1,
          unit: 'hours',
          defaultValue: 6,
        },
        defaultValue: 6,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    global.fetch = vi.fn(async () => {
      return {
        ok: true,
        json: async () => ({
          agentId: mockAgent.id,
          agentName: mockAgent.name,
          category: mockAgent.category,
          evaluatedAt: new Date().toISOString(),
          summaryAssessment: 'Test evaluation summary',
          recommendations: [
            { id: 'rec-1', brand: 'Sony', model: 'WF-1000XM5', matchScore: 95, reasoning: 'Top pick', pros: ['ANC'], cons: ['Price'] },
            { id: 'rec-2', brand: 'Bose', model: 'QC Ultra', matchScore: 92, reasoning: 'Comfort', pros: ['Comfort'], cons: ['Battery'] },
            { id: 'rec-3', brand: 'Apple', model: 'AirPods Pro 2', matchScore: 90, reasoning: 'iOS integration', pros: ['Transparency'], cons: ['iOS lock-in'] },
          ],
          contraindicationsOrCaveats: ['Check warranty'],
          providerUsed: 'bAIright Core',
          isLiveAI: false,
        }),
      } as unknown as Response;
    });
  });

  it('1. Initializes with existing targetValues so chips and inputs are pre-selected in questionnaire', () => {
    render(
      <DynamicAgentWizard
        agent={mockAgent}
        initialShowResult={false}
      />
    );

    // Baseline step is at step 0: baselineModel "Nothing ear" should be preserved
    expect(screen.getByDisplayValue('Nothing ear')).toBeInTheDocument();

    // Click "Skip to Parameters" / "Přeskočit na parametry"
    const skipBtn = screen.getByRole('button', { name: /Skip to Parameters|Přeskočit na parametry/i });
    fireEvent.click(skipBtn);

    // Step 1: Fit & Tip Style should show In-Ear as selected (checkmark indicator)
    expect(screen.getByText('Fit & Tip Style')).toBeInTheDocument();
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('2. Navigating back and forth (Previous / Continue) does not clear baseline or parameter answers', () => {
    render(
      <DynamicAgentWizard
        agent={mockAgent}
        initialShowResult={false}
      />
    );

    // On Step 0: Click skip to parameters
    fireEvent.click(screen.getByRole('button', { name: /Skip to Parameters|Přeskočit na parametry/i }));

    // On Step 1: Click Continue to Step 2
    fireEvent.click(screen.getByRole('button', { name: /Continue|Pokračovat/i }));

    // On Step 2: Click Previous back to Step 1
    fireEvent.click(screen.getByRole('button', { name: /Previous|Předchozí/i }));

    // On Step 1: In-Ear must still be selected
    expect(screen.getByText('Fit & Tip Style')).toBeInTheDocument();
    expect(screen.getByText('✓')).toBeInTheDocument();

    // Click Previous back to Step 0 (Baseline)
    fireEvent.click(screen.getByRole('button', { name: /Previous|Předchozí/i }));

    // Baseline model "Nothing ear" must NOT be wiped!
    expect(screen.getByDisplayValue('Nothing ear')).toBeInTheDocument();
  });

  it('3. In Edit Mode: user can modify one question and quick-save via "Save", retaining all other answers', async () => {
    const onAssessmentCompleted = vi.fn();

    render(
      <DynamicAgentWizard
        agent={mockAgent}
        initialShowResult={true}
        initialSavedResult={{
          agentId: mockAgent.id,
          agentName: mockAgent.name,
          category: mockAgent.category,
          evaluatedAt: new Date().toISOString(),
          summaryAssessment: 'Previous assessment',
          recommendations: [
            { id: '1', brand: 'Sony', model: 'WF-1000XM5', matchScore: 95, reasoning: 'Top', pros: ['ANC'], cons: ['Fit'] },
            { id: '2', brand: 'Bose', model: 'QC Ultra', matchScore: 92, reasoning: 'Comfort', pros: ['Comfort'], cons: ['Battery'] },
            { id: '3', brand: 'Sennheiser', model: 'Momentum 4', matchScore: 90, reasoning: 'Sound', pros: ['Sound'], cons: ['Size'] },
          ],
          contraindicationsOrCaveats: [],
          providerUsed: 'bAIright Core',
          isLiveAI: false,
        }}
        onAssessmentCompleted={onAssessmentCompleted}
      />
    );

    // Results screen is shown. Click "Edit Wizard" / "Upravit wizard"
    const editBtn = screen.getByRole('button', { name: /Edit Wizard|Upravit wizard|btnEdit/i });
    fireEvent.click(editBtn);

    // Questionnaire opens at Step 0. Advance to Step 1.
    fireEvent.click(screen.getByRole('button', { name: /Skip to Parameters|Přeskočit na parametry/i }));

    // Quick save button should be visible on Step 1 in Edit Mode
    const saveBtn = screen.getByRole('button', { name: /Save|Uložit/i });
    expect(saveBtn).toBeInTheDocument();

    // Toggle Open-Fit option on Step 1
    const openFitOpt = screen.getByText('Open-Fit / Semi-In-Ear');
    fireEvent.click(openFitOpt);

    // Save directly from Step 1!
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(onAssessmentCompleted).toHaveBeenCalled();
    });

    const [savedAnswers] = onAssessmentCompleted.mock.calls[0];
    // Baseline model must still be intact
    expect(savedAnswers.baselineModel).toBe('Nothing ear');
    // Step 2 Noise cancellation must still be intact
    expect(savedAnswers.noise_cancellation).toEqual(expect.arrayContaining(['basic_active', 'hybrid_active']));
    // Step 3 Battery life must still be intact
    expect(savedAnswers.battery_life).toBe(7);
    // Step 1 Fit style must have the new selection included
    expect(savedAnswers.fit_style).toEqual(expect.arrayContaining(['in_ear', 'open_fit']));
  });
});
