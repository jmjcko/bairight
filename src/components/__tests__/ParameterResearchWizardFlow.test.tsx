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
      expect(screen.getByText(/Nákupní výběr pro auto/i)).toBeInTheDocument();
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

    // Klikneme na parametr 'Typ & hlavní určení' pro odznačení
    const paramTile = screen.getByText(/Klíčové vlastnosti/i);
    fireEvent.click(paramTile);

    // Počet vybraných klesl
    expect(screen.getByText(/Vybráno 9 z 10 parametrů/i)).toBeInTheDocument();

    // Klikneme znovu pro opětovné zaškrtnutí
    fireEvent.click(paramTile);
    expect(screen.getByText(/Vybráno 10 z 10 parametrů/i)).toBeInTheDocument();
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

  it('4. Serializace a zpětný parsing agenta do čistého Markdown/YAML zachovává název a systémové instrukce', () => {
    const analysis = discoverDomainParameters('auto');
    const customAgent = buildCustomAgentFromParameters(analysis, analysis.parameters.slice(0, 5));

    const markdown = serializeAgentToMarkdown(customAgent);
    expect(markdown).not.toContain('researchedParametersPool');
    expect(markdown).not.toContain('selectedParameters');

    const restoredAgent = parseAgentFromMarkdown(markdown);
    expect(restoredAgent.name).toBe(customAgent.name);
    expect(restoredAgent.systemPrompt).toBeDefined();
  });

  it('5. DynamicAgentWizard zobrazuje přehledné záhlaví a krok vybraných parametrů', () => {
    const analysis = discoverDomainParameters('kancelářská židle');
    const testAgent = buildCustomAgentFromParameters(analysis, analysis.parameters.slice(0, 3));

    render(<DynamicAgentWizard agent={testAgent} />);

    // Zkontrolujeme zobrazení názvu a kroků v čistém záhlaví
    expect(screen.getByText(testAgent.name)).toBeInTheDocument();
    expect(screen.getAllByText(/Krok 1 z 4/i).length).toBeGreaterThanOrEqual(1);
  });

  it('6. Wizard obsahuje přesně tolik kroků jako je vybraných parametrů (10 parametrů = 10 otázek + 1 baseline krok)', () => {
    const analysis = discoverDomainParameters('road bike shoes');
    expect(analysis.parameters.length).toBeGreaterThanOrEqual(10);
    const tenParams = analysis.parameters.slice(0, 10);
    const customAgent = buildCustomAgentFromParameters(analysis, tenParams);

    // Každý parametr musí mít svou otázku s unikátním krokem
    expect(customAgent.questions.length).toBe(10);
    const steps = new Set(customAgent.questions.map(q => q.step));
    expect(steps.size).toBe(10);

    render(<DynamicAgentWizard agent={customAgent} />);

    // Celkem 11 kroků (1 krok stávající zkušenosti + 10 parametrů)
    expect(screen.getAllByText(/Krok 1 z 11/i).length).toBeGreaterThanOrEqual(1);

    // Hned na 1. kroku se zobrazí obrazovka stávajících zkušeností s 2-kartovou volbou
    expect(screen.getByText(/Dosavadní zkušenosti & Stávající produkt/i)).toBeInTheDocument();
    expect(screen.getByText(/První nákup v této kategorii/i)).toBeInTheDocument();
    expect(screen.getByText(/Vlastním \/ používal jsem produkt/i)).toBeInTheDocument();

    // Výběr Karty B otevře formulář pro zadání stávajícího modelu a preferencí
    const cardB = screen.getByText(/Vlastním \/ používal jsem produkt/i);
    fireEvent.click(cardB);

    expect(screen.getByPlaceholderText(/DeLonghi Magnifica S \/ Hoka Clifton 8/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Přeskočit na parametry/i })).toBeInTheDocument();

    // Proklikáme se přes parametry až na poslední krok (krok 11)
    for (let i = 0; i < 10; i++) {
      const continueBtn = screen.getByRole('button', { name: /^Pokračovat$/i });
      fireEvent.click(continueBtn);
    }

    expect(screen.getByRole('button', { name: /Dokončit a sestavit agenta|Vygenerovat doporučení agenta/i })).toBeInTheDocument();
  });
});
