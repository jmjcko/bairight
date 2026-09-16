import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AgentCategoryLauncher } from '../AgentCategoryLauncher';
import { DynamicAgentWizard } from '../DynamicAgentWizard';
import { discoverDomainParameters, buildCustomAgentFromParameters } from '@/lib/agent/domain-parameter-discovery';
import { serializeAgentToMarkdown, parseAgentFromMarkdown } from '@/lib/agent/universal-agent-schema';

describe('Parameter Research Agent & 3-Phase Wizard Flow (Updated PRD)', () => {
  const mockOnSelectAgent = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock global fetch to simulate Luke API returning local domain parameters
    // (avoids actual network calls in unit tests — server has no API key in test env)
    global.fetch = vi.fn(async (input: any, opts?: any) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('/api/agent/research-parameters')) {
        const body = JSON.parse((opts as any)?.body || '{}');
        const query = body.query || 'auto';
        const { discoverDomainParameters } = await import('@/lib/agent/domain-parameter-discovery');
        const analysis = discoverDomainParameters(query);
        return {
          ok: true,
          json: async () => ({ success: true, analysis, source: 'test_mock' }),
        } as unknown as Response;
      }
      return { ok: false, json: async () => ({ error: 'Not found' }) } as unknown as Response;
    });
  });

  it('1. Parameter Research Agent nalezne klíčové parametry a zobrazí je s PRD titulkem', async () => {
    render(<AgentCategoryLauncher onSelectAgent={mockOnSelectAgent} />);

    const searchInput = screen.getByPlaceholderText(/Kancelářská ergonomická židle/i);
    fireEvent.change(searchInput, { target: { value: 'auto' } });

    const researchBtn = screen.getByRole('button', { name: /Začít/i });
    fireEvent.click(researchBtn);

    // Ověříme čistý titulek a počty
    await waitFor(() => {
      expect(screen.getByText(/Osobní Automobily & Mobility/i)).toBeInTheDocument();
      expect(screen.getByText(/Vybráno \d+ z \d+ parametrů/i)).toBeInTheDocument();
    });
  });

  it('2. Uživatel může kliknutím na dlaždici odznačit a znovu označit parametr', async () => {
    render(<AgentCategoryLauncher onSelectAgent={mockOnSelectAgent} />);

    const searchInput = screen.getByPlaceholderText(/Kancelářská ergonomická židle/i);
    fireEvent.change(searchInput, { target: { value: 'auto' } });

    const researchBtn = screen.getByRole('button', { name: /Začít/i });
    fireEvent.click(researchBtn);

    await waitFor(() => {
      expect(screen.getByText(/Vybráno \d+ z \d+ parametrů/i)).toBeInTheDocument();
    });

    // Klikneme na parametr 'Typ karoserie' pro odznačení
    const paramTile = screen.getByText(/Typ karoserie/i);
    fireEvent.click(paramTile);

    // Počet vybraných klesl
    expect(screen.getByText(/Vybráno 10 z 11 parametrů/i)).toBeInTheDocument();

    // Klikneme znovu pro opětovné zaškrtnutí
    fireEvent.click(paramTile);
    expect(screen.getByText(/Vybráno 11 z 11 parametrů/i)).toBeInTheDocument();
  });

  it('3. Tlačítko pro postup do wizardu nese přesný text dle PRD a generuje agenta pro vybrané parametry', async () => {
    render(<AgentCategoryLauncher onSelectAgent={mockOnSelectAgent} />);

    const searchInput = screen.getByPlaceholderText(/Kancelářská ergonomická židle/i);
    fireEvent.change(searchInput, { target: { value: 'kávovar' } });

    const researchBtn = screen.getByRole('button', { name: /Začít/i });
    fireEvent.click(researchBtn);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Nastavit cílové hodnoty/i })).toBeInTheDocument();
    });

    const ctaBtn = screen.getByRole('button', { name: /Nastavit cílové hodnoty/i });
    expect(ctaBtn).toHaveTextContent(/Nastavit cílové hodnoty/i);

    fireEvent.click(ctaBtn);

    await waitFor(() => {
      expect(mockOnSelectAgent).toHaveBeenCalledTimes(1);
      const createdAgent = mockOnSelectAgent.mock.calls[0][0];
      expect(createdAgent.category).toBeDefined();
      expect(createdAgent.questions.length).toBeGreaterThanOrEqual(1);
      expect(createdAgent.researchedParametersPool).toBeDefined();
      expect(createdAgent.selectedParameters).toBeDefined();
    });
  });

  it('4. Serializace a zpětný parsing agenta do Markdown/YAML zachovává researchedPool i user selection', () => {
    const analysis = discoverDomainParameters('auto');
    const customAgent = buildCustomAgentFromParameters(analysis, analysis.parameters.slice(0, 5));

    const markdown = serializeAgentToMarkdown(customAgent);
    expect(markdown).toContain('researchedParametersPool');
    expect(markdown).toContain('selectedParameters');

    const restoredAgent = parseAgentFromMarkdown(markdown);
    expect(restoredAgent.name).toBe(customAgent.name);
    expect(restoredAgent.researchedParametersPool).toBeDefined();
    expect(restoredAgent.selectedParameters).toHaveLength(5);
  });

  it('5. DynamicAgentWizard zobrazuje přehledné záhlaví a krok vybraných parametrů', () => {
    const analysis = discoverDomainParameters('kancelářská židle');
    const testAgent = buildCustomAgentFromParameters(analysis, analysis.parameters.slice(0, 3));

    render(<DynamicAgentWizard agent={testAgent} />);

    // Zkontrolujeme zobrazení názvu a kroků v čistém záhlaví
    expect(screen.getByText(testAgent.name)).toBeInTheDocument();
    expect(screen.getAllByText(/Krok 1 z 3/i).length).toBeGreaterThanOrEqual(1);
  });
});
