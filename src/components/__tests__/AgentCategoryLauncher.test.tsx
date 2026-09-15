import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AgentCategoryLauncher } from '../AgentCategoryLauncher';
import { AgentStorageService } from '@/lib/agent/agent-storage-service';
import { discoverDomainParameters, buildCustomAgentFromParameters } from '@/lib/agent/domain-parameter-discovery';

describe('AgentCategoryLauncher Unit Test Suite (PRD v1)', () => {
  const mockOnSelectAgent = vi.fn();
  const mockOnOpenSubscriptionModal = vi.fn();

  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    originalFetch = global.fetch;
    global.fetch = vi.fn().mockImplementation((url: string, opts: any) => {
      let q = '';
      try {
        const body = opts?.body ? JSON.parse(opts.body) : {};
        q = body.query || body.prompt || '';
      } catch {}

      const analysis = discoverDomainParameters(q || 'generic');

      if (url.includes('/api/agent/research-parameters')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            analysis,
          }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          agent: buildCustomAgentFromParameters(analysis, analysis.parameters),
        }),
      });
    });
  });

  it('1. Vykreslí vyhledávací konzoli bez výchozích agentů (čistý hero layout)', () => {
    AgentStorageService.resetToDefaults();
    render(
      <AgentCategoryLauncher
        onSelectAgent={mockOnSelectAgent}
        onOpenSubscriptionModal={mockOnOpenSubscriptionModal}
      />
    );

    expect(screen.getByText(/Co si dnes přejete koupit\?/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Kancelářská ergonomická židle/i)).toBeInTheDocument();
    expect(screen.queryByText(/Běžecká & ortopedická obuv/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Dostupní nákupní agenti/i)).not.toBeInTheDocument();
  });

  it('2. Kliknutí na kartu uloženého agenta spustí onSelectAgent s daným agentem', () => {
    AgentStorageService.resetToDefaults();
    AgentStorageService.saveAgent({
      id: 'custom_ergo',
      name: 'Ergonomické sezení & kancelář',
      category: 'Nábytek',
      description: 'Průvodce ergonomií',
      icon: '🪑',
      version: '1.0',
      questions: [],
      systemPrompt: 'Systémový prompt',
      createdAt: new Date().toISOString(),
      isCustom: true,
    });

    render(
      <AgentCategoryLauncher
        onSelectAgent={mockOnSelectAgent}
      />
    );

    const ergoCard = screen.getByText(/Ergonomické sezení & kancelář/i);
    fireEvent.click(ergoCard);

    expect(mockOnSelectAgent).toHaveBeenCalledTimes(1);
    const selected = mockOnSelectAgent.mock.calls[0][0];
    expect(selected.id).toBe('custom_ergo');
  });

  it('3. Odeslání formuláře s vlastním záměrem zavolá generování a vytvoří agenta', async () => {
    render(
      <AgentCategoryLauncher
        onSelectAgent={mockOnSelectAgent}
      />
    );

    const input = screen.getByPlaceholderText(/Kancelářská ergonomická židle/i);
    fireEvent.change(input, { target: { value: 'Židle na záda' } });

    const submitBtn = screen.getByRole('button', { name: /Začít/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Nastavit cílové hodnoty/i })).toBeInTheDocument();
    });

    const ctaBtn = screen.getByRole('button', { name: /Nastavit cílové hodnoty/i });
    fireEvent.click(ctaBtn);

    await waitFor(() => {
      expect(mockOnSelectAgent).toHaveBeenCalledTimes(1);
      const created = mockOnSelectAgent.mock.calls[0][0];
      expect(created.category).toBeDefined();
    });
  });

  it('4. Vykřížkování dlaždice parametru (X) odstraní parametr ze seznamu', async () => {
    render(<AgentCategoryLauncher onSelectAgent={mockOnSelectAgent} />);

    const searchInput = screen.getByPlaceholderText(/Kancelářská ergonomická židle/i);
    fireEvent.change(searchInput, { target: { value: 'auto' } });

    const researchBtn = screen.getByRole('button', { name: /Začít/i });
    fireEvent.click(researchBtn);

    // Check that cars parameters appear
    await waitFor(() => {
      expect(screen.getByText(/Typ karoserie/i)).toBeInTheDocument();
    });

    // Find the dismiss button for the first parameter
    const dismissBtn = screen.getByRole('button', { name: /Odebrat parametr Typ karoserie/i });
    fireEvent.click(dismissBtn);

    // Verify it was removed from active tiles (no dismiss button for it anymore)
    expect(screen.queryByRole('button', { name: /Odebrat parametr Typ karoserie/i })).not.toBeInTheDocument();
    // Verify it moved to suggestions pool
    expect(screen.getByRole('button', { name: /Typ karoserie/i })).toBeInTheDocument();
  });

  it('5. Přidání vlastního parametru jej zařadí mezi dlaždice s odznakem Vlastní', async () => {
    render(<AgentCategoryLauncher onSelectAgent={mockOnSelectAgent} />);

    const searchInput = screen.getByPlaceholderText(/Kancelářská ergonomická židle/i);
    fireEvent.change(searchInput, { target: { value: 'kávovar' } });

    const researchBtn = screen.getByRole('button', { name: /Začít/i });
    fireEvent.click(researchBtn);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Přidat vlastní parametr/i)).toBeInTheDocument();
    });

    const customInput = screen.getByPlaceholderText(/Přidat vlastní parametr/i);
    fireEvent.change(customInput, { target: { value: 'Digitální teploměr páky' } });

    const addBtn = screen.getByRole('button', { name: /Přidat parametr/i });
    fireEvent.click(addBtn);

    expect(screen.getAllByText(/Digitální teploměr páky/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Vlastní')).toBeInTheDocument();
    expect(screen.getByText('👥 Naučeno komunitou')).toBeInTheDocument();
  });

  it('6. Kliknutí na doporučený alternativní parametr jej zařadí do aktivních parametrů', async () => {
    render(<AgentCategoryLauncher onSelectAgent={mockOnSelectAgent} />);

    const searchInput = screen.getByPlaceholderText(/Kancelářská ergonomická židle/i);
    fireEvent.change(searchInput, { target: { value: 'boty' } });

    const researchBtn = screen.getByRole('button', { name: /Začít/i });
    fireEvent.click(researchBtn);

    // Wait for research to complete and show alternatives
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Voděodolná membrána/i })).toBeInTheDocument();
    });

    // Find an alternative suggestion in pool (e.g. Gore-Tex)
    const gtxBtn = screen.getByRole('button', { name: /Voděodolná membrána/i });
    fireEvent.click(gtxBtn);

    // Should now be rendered in active parameters grid
    expect(screen.getByText(/Voděodolná membrána/i)).toBeInTheDocument();
  });

  it('7. Nezobrazuje žádné výchozí agenty a čistě spravuje pouze uživatelem vytvořené agenty', () => {
    window.confirm = () => true;
    AgentStorageService.resetToDefaults();

    const { unmount } = render(<AgentCategoryLauncher onSelectAgent={mockOnSelectAgent} />);

    // Ověříme, že výchozí agenti ani prázdná knihovna se nezobrazují (žádný šum na hlavní stránce)
    expect(screen.queryByText(/Dostupní nákupní agenti/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Knihovna agentů je prázdná/i)).not.toBeInTheDocument();
    unmount();

    // Když uživatel vytvoří a uloží agenta, sekce vytvořených agentů se zobrazí
    AgentStorageService.saveAgent({
      id: 'custom_agent_test',
      name: 'Můj auto rádce',
      category: 'Automotive',
      description: 'Testovací poradce pro nákup vozu',
      icon: '🚗',
      version: '1.0',
      questions: [],
      systemPrompt: 'Systémový prompt',
      createdAt: new Date().toISOString(),
      isCustom: true,
    });

    render(<AgentCategoryLauncher onSelectAgent={mockOnSelectAgent} />);
    expect(screen.getByText('Můj auto rádce')).toBeInTheDocument();

    // Smazání agenta
    const deleteBtn = screen.getByTitle(/Smazat agenta z knihovny/i);
    fireEvent.click(deleteBtn);
    expect(screen.queryByText('Můj auto rádce')).not.toBeInTheDocument();
  });

  it('8. Zobrazuje možnost přidat vlastní parametr (in-grid dlaždice, studio panel)', async () => {
    render(<AgentCategoryLauncher onSelectAgent={mockOnSelectAgent} />);

    const searchInput = screen.getByPlaceholderText(/Kancelářská ergonomická židle/i);
    fireEvent.change(searchInput, { target: { value: 'elektroauto' } });

    const researchBtn = screen.getByRole('button', { name: /Začít/i });
    fireEvent.click(researchBtn);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Přidat vlastní parametr/i)).toBeInTheDocument();
    });

    // 1. In-grid interaktivní dlaždice na konci seznamu
    expect(screen.getByRole('button', { name: /\+ Přidat další parametr/i })).toBeInTheDocument();

    // 2. Dedikovaný studio panel pro přidání
    expect(screen.getByText(/Chybí vám zde nějaké kritérium\? Přidejte si vlastní parametr/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Přidat parametr/i })).toBeInTheDocument();
  });

  it('9. Nezobrazuje duplicitní dropdown a spravuje agenty přímo v přehledné knihovně karet', async () => {
    AgentStorageService.resetToDefaults();
    AgentStorageService.saveAgent({
      id: 'custom_car_advisor',
      name: 'Můj poradce pro elektromobily',
      category: 'Automotive',
      description: 'Vyzkoušený agent pro dálniční dojezd a baterie',
      icon: '⚡',
      version: '1.2.0',
      questions: [],
      systemPrompt: 'Systémový prompt pro EV',
      createdAt: new Date().toISOString(),
      isCustom: true,
    });

    render(<AgentCategoryLauncher onSelectAgent={mockOnSelectAgent} userName="Jan Mynář" />);

    // Ověříme, že duplicitní dropdown "Vybrat z mých vytvořených agentů" byl zcela odstraněn
    expect(screen.queryByTitle(/Zvolit historicky vytvořeného agenta vašeho účtu/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Vybrat z mých vytvořených agentů/i)).not.toBeInTheDocument();

    // Uživatel vidí svého agenta přímo v dedikované knihovně karet
    expect(screen.getByText(/Moje vytvořené nákupní agenty/i)).toBeInTheDocument();
    expect(screen.getByText(/Můj poradce pro elektromobily/i)).toBeInTheDocument();
    expect(screen.getByText(/Automotive/i)).toBeInTheDocument();
    expect(screen.getByText(/Spustit/i)).toBeInTheDocument();

    // Kliknutí na kartu vytvořeného agenta vybere daného agenta
    const agentCard = screen.getByText(/Můj poradce pro elektromobily/i);
    fireEvent.click(agentCard);

    expect(mockOnSelectAgent).toHaveBeenCalledTimes(1);
    const selected = mockOnSelectAgent.mock.calls[0][0];
    expect(selected.id).toBe('custom_car_advisor');
    expect(selected.version).toBe('1.2.0');
  });
});

