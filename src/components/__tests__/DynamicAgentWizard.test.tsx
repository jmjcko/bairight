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
    expect(screen.getByText(/Dosavadní zkušenosti & Stávající produkt/i)).toBeInTheDocument();

    // Reset button is available
    expect(screen.getByRole('button', { name: /Reset/i })).toBeInTheDocument();

    // Step 1 navigation button
    const nextButton = screen.getByRole('button', { name: /^Pokračovat$/i });
    expect(nextButton).toBeInTheDocument();

    // Advance to step 2 (first question)
    fireEvent.click(nextButton);
    expect(screen.getByText(/Denní doba strávená sezením/i)).toBeInTheDocument();
  });

  it('2. Umožňuje procházet kroky a v posledním kroku zobrazí tlačítka inspekce i vygenerování', () => {
    render(
      <DynamicAgentWizard
        agent={PRESET_ERGO_CHAIR_AGENT}
        onBackToLauncher={mockOnBackToLauncher}
      />
    );

    // Step through the 4 steps
    for (let i = 0; i < 4; i++) {
      const nextButton = screen.getByRole('button', { name: /^Pokračovat$/i });
      fireEvent.click(nextButton);
    }

    // On final step
    const inspectButton = screen.getByRole('button', { name: /Zkontrolovat prompt pro AI/i });
    const generateButton = screen.getByRole('button', { name: /Vyhodnotit & Doporučit|Vygenerovat doporučení agenta/i });

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
    for (let i = 0; i < 4; i++) {
      fireEvent.click(screen.getByRole('button', { name: /^Pokračovat$/i }));
    }

    // Click generate
    const generateButton = screen.getByRole('button', { name: /Vyhodnotit & Doporučit|Vygenerovat doporučení agenta/i });
    fireEvent.click(generateButton);

    await waitFor(() => {
      // Verify Phase 2 Revealed Results: Delivers Agent Hub and removes shortlist model cards
      expect(screen.getByText(/Agent připraven k použití/i)).toBeInTheDocument();
      expect(screen.getByText(/Stáhnout .agent.md soubor/i)).toBeInTheDocument();
      expect(screen.queryByText(/Okamžitý výstup agenta: Ověřený shortlist modelů/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Herman Miller/i)).not.toBeInTheDocument();
    });
  });

  it('4. Umožňuje uživateli aktivovat pole pro zadání vlastní volby a zapsat specifický požadavek', () => {
    render(
      <DynamicAgentWizard
        agent={PRESET_ERGO_CHAIR_AGENT}
        onBackToLauncher={mockOnBackToLauncher}
      />
    );

    // Přejdeme do kroku 3 (otázka s výběrovými dlaždicemi: krok 1 = baseline, krok 2 = slider, krok 3 = chips)
    fireEvent.click(screen.getByRole('button', { name: /^Pokračovat$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Pokračovat$/i }));

    // Krok 3 obsahuje možnost napsat vlastní odpověď
    const customButton = screen.getByRole('button', { name: /Napsat vlastní možnost/i });
    expect(customButton).toBeInTheDocument();

    // Kliknutí aktivuje vstupní textové pole
    fireEvent.click(customButton);

    // Ověříme, že se otevřel textový input
    const customInput = screen.getByPlaceholderText(/Napište vlastní odpověď/i);
    expect(customInput).toBeInTheDocument();

    // Uživatel zadá svůj specifický požadavek
    fireEvent.change(customInput, { target: { value: 'Bolest mezi lopatkami a horní hrudní páteř' } });
    expect(customInput).toHaveValue('Bolest mezi lopatkami a horní hrudní páteř');
  });

  it('5. Vykreslí Agent Delivery Hub se stažením .agent.md souboru a přepínatelnými návody pro Gemini, ChatGPT a Claude', async () => {
    render(
      <DynamicAgentWizard
        agent={PRESET_ERGO_CHAIR_AGENT}
        onAssessmentCompleted={mockOnAssessmentCompleted}
      />
    );

    // Dokončení wizardu
    for (let i = 0; i < 4; i++) {
      fireEvent.click(screen.getByRole('button', { name: /^Pokračovat$/i }));
    }
    fireEvent.click(screen.getByRole('button', { name: /Vyhodnotit & Doporučit|Vygenerovat doporučení agenta/i }));

    await waitFor(() => {
      expect(screen.getByText(/Stáhnout .agent.md soubor/i)).toBeInTheDocument();
    });

    // Rozbalení sekce s návody (collapsible disclosure)
    const guidesToggle = screen.getByRole('button', { name: /Jak si z tohoto souboru vytvořit vlastního agenta|How to create your own agent from this file/i });
    fireEvent.click(guidesToggle);

    // Check tabs for Claude, ChatGPT, Gemini instructions
    expect(screen.getByRole('button', { name: /Google Gemini \(Gems\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ChatGPT \(Custom GPTs\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Claude \(Projects\)/i })).toBeInTheDocument();

    // Default tab is Gemini
    expect(screen.getByText(/Návod pro Google Gemini \(Gem Manager\)/i)).toBeInTheDocument();

    // Switch to ChatGPT tab
    fireEvent.click(screen.getByRole('button', { name: /ChatGPT \(Custom GPTs\)/i }));
    expect(screen.getByText(/Návod pro OpenAI ChatGPT \(Custom GPT\)/i)).toBeInTheDocument();

    // Switch to Claude tab
    fireEvent.click(screen.getByRole('button', { name: /Claude \(Projects\)/i }));
    expect(screen.getByText(/Návod pro Anthropic Claude \(Projects\)/i)).toBeInTheDocument();
  });

  it('6. Zobrazuje klíčovou hodnotu permanentní RAG paměti a odstranění nadbytečného shortlistu a feedback smyčky', async () => {
    render(
      <DynamicAgentWizard
        agent={PRESET_ERGO_CHAIR_AGENT}
        onAssessmentCompleted={mockOnAssessmentCompleted}
      />
    );

    for (let i = 0; i < 4; i++) {
      fireEvent.click(screen.getByRole('button', { name: /^Pokračovat$/i }));
    }
    fireEvent.click(screen.getByRole('button', { name: /Vyhodnotit & Doporučit|Vygenerovat doporučení agenta/i }));

    await waitFor(() => {
      expect(screen.getByText(/Klíčová výhoda bAIright architektury/i)).toBeInTheDocument();
    });

    // Check RAG USP content
    expect(screen.getByText(/Agent, který se s každým nákupem učí/i)).toBeInTheDocument();
    expect(screen.getByText(/Běžný chat \(ChatGPT \/ Claude \/ Gemini\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Příklad z praxe: Jak funguje kontinuální paměť agenta/i)).toBeInTheDocument();

    // Check Direct Integration / BYOK banner
    expect(screen.getByText(/Spouštět přímo v bAIright přes vlastní model \/ předplatné/i)).toBeInTheDocument();

    // Confirm that feedback loop and shortlist models are NOT rendered
    expect(screen.queryByText(/Interaktivní zpětná vazba & RAG ladění modelů/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Okamžitý výstup agenta: Ověřený shortlist modelů/i)).not.toBeInTheDocument();
  });

  it('7. Při initialShowResult={true} přejde přímo na výsledky a umožňuje kliknutím na "Upravit wizard" přejít do editace', async () => {
    render(
      <DynamicAgentWizard
        agent={PRESET_ERGO_CHAIR_AGENT}
        initialShowResult={true}
        onAssessmentCompleted={mockOnAssessmentCompleted}
      />
    );

    // Should auto-evaluate and land on Agent Delivery Hub
    await waitFor(() => {
      expect(screen.getByText(/Agent připraven k použití/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Stáhnout .agent.md soubor/i)).toBeInTheDocument();

    // The "Upravit wizard" button is visible
    const editWizardBtn = screen.getByRole('button', { name: /Upravit wizard/i });
    expect(editWizardBtn).toBeInTheDocument();

    // Clicking "Upravit wizard" switches to the intake wizard (Phase 1)
    fireEvent.click(editWizardBtn);

    expect(screen.getByText(/Dosavadní zkušenosti & Stávající produkt/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Zpět na výsledky/i })).toBeInTheDocument();

    // Clicking "Zpět na výsledky" immediately restores Phase 2
    fireEvent.click(screen.getByRole('button', { name: /Zpět na výsledky/i }));
    expect(screen.getByText(/Agent připraven k použití/i)).toBeInTheDocument();
  });

  it('8. Umožňuje wizard kdykoliv zavřít a zahodit neuložený progress přes tlačítko Zavřít v hlavičce i spodní liště', async () => {
    render(
      <DynamicAgentWizard
        agent={PRESET_ERGO_CHAIR_AGENT}
        initialShowResult={true}
        onBackToLauncher={mockOnBackToLauncher}
      />
    );

    // Wait for delivery hub
    await waitFor(() => {
      expect(screen.getByText(/Agent připraven k použití/i)).toBeInTheDocument();
    });

    // Enter wizard editing
    fireEvent.click(screen.getByRole('button', { name: /Upravit wizard/i }));
    expect(screen.getByText(/Dosavadní zkušenosti & Stávající produkt/i)).toBeInTheDocument();

    // Verify close buttons exist
    const closeHeaderBtn = screen.getByRole('button', { name: /Zavřít wizard/i });
    const closeBottomBtn = screen.getByRole('button', { name: /Zavřít \/ Zahodit progress/i });

    expect(closeHeaderBtn).toBeInTheDocument();
    expect(closeBottomBtn).toBeInTheDocument();

    // Clicking close in header returns to the finished agent result
    fireEvent.click(closeHeaderBtn);
    expect(screen.getByText(/Agent připraven k použití/i)).toBeInTheDocument();

    // Enter editing again and click bottom close
    fireEvent.click(screen.getByRole('button', { name: /Upravit wizard/i }));
    expect(screen.getByText(/Dosavadní zkušenosti & Stávající produkt/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Zavřít \/ Zahodit progress/i }));
    expect(screen.getByText(/Agent připraven k použití/i)).toBeInTheDocument();
  });

  it('9. Umožňuje na stránce výsledků přidat vlastní parametr/kritérium (např. cenový limit) a promítnout ho do agenta', async () => {
    render(
      <DynamicAgentWizard
        agent={PRESET_ERGO_CHAIR_AGENT}
        initialShowResult={true}
        onAssessmentCompleted={mockOnAssessmentCompleted}
      />
    );

    // Wait for delivery hub
    await waitFor(() => {
      expect(screen.getByText(/Kritéria výběru a aktivní parametry/i)).toBeInTheDocument();
    });

    // Click Add Parameter
    const addParamBtn = screen.getByRole('button', { name: /\+ Přidat parametr \/ cenový limit/i });
    expect(addParamBtn).toBeInTheDocument();
    fireEvent.click(addParamBtn);

    // Form inputs should now be visible
    expect(screen.getByText(/Přidat nový požadavek nebo omezení/i)).toBeInTheDocument();
    const nameInput = screen.getByPlaceholderText(/např. Cenový strop \/ rozpočet/i);
    const valInput = screen.getByPlaceholderText(/např. do 5 000 Kč včetně DPH/i);

    fireEvent.change(nameInput, { target: { value: 'Cenový limit' } });
    fireEvent.change(valInput, { target: { value: 'Do 6 000 Kč' } });

    // Submit new parameter
    const submitBtn = screen.getByRole('button', { name: /Uložit a přepočítat doporučení/i });
    fireEvent.click(submitBtn);

    // Verify parameter chip appears in the active criteria list
    await waitFor(() => {
      expect(screen.getByText('Cenový limit')).toBeInTheDocument();
      expect(screen.getByText('Do 6 000 Kč')).toBeInTheDocument();
    });

    // Remove parameter
    const removeBtn = screen.getByTitle(/Odebrat tento vlastní parametr/i);
    fireEvent.click(removeBtn);

    await waitFor(() => {
      expect(screen.queryByText('Do 6 000 Kč')).not.toBeInTheDocument();
    });
  });

  it('11. Zobrazí BYOK modal při kliknutí na Spustit živý chat bez připojeného API klíče a umožní otevřít Vault', async () => {
    const mockOpenSubscription = vi.fn();
    render(
      <DynamicAgentWizard
        agent={PRESET_ERGO_CHAIR_AGENT}
        currentApiKeys={{}}
        onOpenSubscriptionModal={mockOpenSubscription}
      />
    );

    // Step through the steps to reach results
    for (let i = 0; i < 4; i++) {
      fireEvent.click(screen.getByRole('button', { name: /^Pokračovat$/i }));
    }

    const generateBtn = screen.getByRole('button', { name: /Vyhodnotit & Doporučit|Vygenerovat doporučení agenta/i });
    fireEvent.click(generateBtn);

    // Wait for delivery hub
    await waitFor(() => {
      expect(screen.getByText(/Spustit živý chat & Výsledky agenta/i)).toBeInTheDocument();
    });

    // Click on chat hero card without API key
    const chatHeroBtn = screen.getByText(/Spustit živý chat & Výsledky agenta/i).closest('div[class*="cursor-pointer"]') || screen.getByText(/Spustit živý chat & Výsledky agenta/i);
    fireEvent.click(chatHeroBtn);

    // BYOK modal must be rendered
    await waitFor(() => {
      expect(screen.getByText(/Propojte svůj AI klíč pro živou diskusi s agentem/i)).toBeInTheDocument();
      expect(screen.getByText(/Správa klíčů ve Vaultu/i)).toBeInTheDocument();
    });

    // Clicking 'Správa klíčů ve Vaultu' triggers vault modal opening
    const vaultBtn = screen.getByRole('button', { name: /Správa klíčů ve Vaultu/i });
    fireEvent.click(vaultBtn);
    expect(mockOpenSubscription).toHaveBeenCalledTimes(1);

    // Modal is dismissed
    expect(screen.queryByText(/Propojte svůj AI klíč pro živou diskusi s agentem/i)).not.toBeInTheDocument();
  });
});
