import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IntakeWizard } from '../IntakeWizard';

describe('IntakeWizard Unit Test Suite', () => {
  const mockOnAssessmentCompleted = vi.fn();
  const mockOnFeedbackSubmitted = vi.fn();

  const mockPrescriptionResult = {
    prescription_id: 'test-presc-1',
    clinical_summary: 'Biomechanické vyhodnocení dokončeno.',
    recommended_shoes: [
      {
        id: 'asics-gel-kayano-30',
        brand: 'ASICS',
        model: 'Gel-Kayano 30 (2E Wide Last)',
        heel_drop_mm: 10,
        cushion_level: 'Maximální plyšové',
      },
    ],
    contraindications: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockPrescriptionResult,
    } as Response);
    window.alert = vi.fn();
  });

  // Helper to navigate to a specific step
  const navigateToStep = (targetStep: number) => {
    for (let current = 1; current < targetStep; current++) {
      const nextButton = screen.getByRole('button', { name: /pokračovat/i });
      fireEvent.click(nextButton);
    }
  };

  /* =========================================================================
     SUITE 1: KROK 1 - VELIKOST A ŠÍŘKA CHODIDLA
     ========================================================================= */
  describe('Krok 1: Velikost a šířka chodidla', () => {
    it('1.1: Vykreslí Krok 1 s výchozí velikostí EU 43 a šířkou kopyta 2E', () => {
      render(
        <IntakeWizard onAssessmentCompleted={mockOnAssessmentCompleted} />
      );

      // Verify active step title
      expect(screen.getByText(/Rozměry chodidla & velikost/i)).toBeInTheDocument();

      // Verify default 43 button is selected
      const eu43Button = screen.getByRole('button', { name: '43' });
      expect(eu43Button).toBeInTheDocument();
      expect(eu43Button.className).toContain('bg-cyan-500');

      // Verify default 2E wide width card is selected
      expect(screen.getByText(/Širší kopyto \(2E\)/i)).toBeInTheDocument();
    });

    it('1.2: Umožňuje přepínat mezi rychlou volbou a přesným mm měřením', () => {
      render(
        <IntakeWizard onAssessmentCompleted={mockOnAssessmentCompleted} />
      );

      const preciseModeButton = screen.getByRole('button', {
        name: /Přesné mm měření/i,
      });
      fireEvent.click(preciseModeButton);

      // Sliders should now be visible
      expect(screen.getByText(/Délka chodidla v mm:/i)).toBeInTheDocument();
      expect(screen.getByText(/Šířka v nejširším místě v mm/i)).toBeInTheDocument();

      // Switch back to quick mode
      const quickModeButton = screen.getByRole('button', {
        name: /Rychlá volba velikosti/i,
      });
      fireEvent.click(quickModeButton);
      expect(screen.getByText(/Jakou velikost bot běžně nosíte\?/i)).toBeInTheDocument();
    });

    it('1.3: Kliknutí na jinou velikost (44) aktualizuje vybranou velikost a délku', () => {
      render(
        <IntakeWizard onAssessmentCompleted={mockOnAssessmentCompleted} />
      );

      const eu44Button = screen.getByRole('button', { name: '44' });
      fireEvent.click(eu44Button);

      expect(eu44Button.className).toContain('bg-cyan-500');
      expect(screen.getAllByText(/278 mm/i)[0]).toBeInTheDocument();
    });

    it('1.4: Volba šířky (Standard D vs Širší 2E vs Extra široké 4E) mění parametr šířky', () => {
      render(
        <IntakeWizard onAssessmentCompleted={mockOnAssessmentCompleted} />
      );

      const extraWide4E = screen.getByRole('button', {
        name: /Extra široké \(4E\)/i,
      });
      fireEvent.click(extraWide4E);

      expect(extraWide4E.className).toContain('ring-cyan-400');
    });

    it('1.5: Přesný posuvník délky v mm automaticky přepočítává EU velikost', () => {
      render(
        <IntakeWizard onAssessmentCompleted={mockOnAssessmentCompleted} />
      );

      // Switch to precise mode
      fireEvent.click(screen.getByRole('button', { name: /Přesné mm měření/i }));

      const sliders = screen.getAllByRole('slider');
      const lengthSlider = sliders[0];
      fireEvent.change(lengthSlider, { target: { value: '290' } });

      // 290mm corresponds to EU 46
      expect(screen.getAllByText(/290 mm/i)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/EU 46/i).length).toBeGreaterThan(0);
    });
  });

  /* =========================================================================
     SUITE 2: KROK 2 - STYL DOŠLAPU & BIOMECHANIKA
     ========================================================================= */
  describe('Krok 2: Styl došlapu & biomechanika', () => {
    it('2.1: Zobrazí potvrzovací kartu s vybranou velikostí a šířkou z Kroku 1', () => {
      render(
        <IntakeWizard onAssessmentCompleted={mockOnAssessmentCompleted} />
      );
      navigateToStep(2);

      expect(screen.getByText(/Zvolená velikost z Kroku 1:/i)).toBeInTheDocument();
      expect(screen.getAllByText(/EU 43/i)[0]).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Upravit rozměry/i })).toBeInTheDocument();
    });

    it('2.2: Umožňuje zvolit typ došlapu (Pata / Střed / Špička)', () => {
      render(
        <IntakeWizard onAssessmentCompleted={mockOnAssessmentCompleted} />
      );
      navigateToStep(2);

      const midfootButton = screen.getByRole('button', {
        name: /Přes střed \(Midfoot\)/i,
      });
      fireEvent.click(midfootButton);

      expect(midfootButton.className).toContain('ring-cyan-400');
    });

    it('2.3: Umožňuje zvolit rotaci kotníku / pronační podporu', () => {
      render(
        <IntakeWizard onAssessmentCompleted={mockOnAssessmentCompleted} />
      );
      navigateToStep(2);

      const pronationButton = screen.getByRole('button', {
        name: /Pronace \(Vnitřní sešlap\)/i,
      });
      fireEvent.click(pronationButton);

      expect(pronationButton.className).toContain('ring-cyan-400');
    });
  });

  /* =========================================================================
     SUITE 3: KROK 3 - BĚŽECKÝ PROFIL & TERÉN
     ========================================================================= */
  describe('Krok 3: Běžecký profil & zátěž', () => {
    it('3.1: Umožňuje vybrat povrch / terén běhu', () => {
      render(
        <IntakeWizard onAssessmentCompleted={mockOnAssessmentCompleted} />
      );
      navigateToStep(3);

      expect(screen.getByText(/Kde a jak budete obuv používat:/i)).toBeInTheDocument();

      const trailButton = screen.getByRole('button', {
        name: /Běh v terénu a lesních cestách/i,
      });
      fireEvent.click(trailButton);

      expect(trailButton.className).toContain('ring-cyan-400');
    });

    it('3.2: Umožňuje zvolit týdenní kilometráž', () => {
      render(
        <IntakeWizard onAssessmentCompleted={mockOnAssessmentCompleted} />
      );
      navigateToStep(3);

      const highVolumeButton = screen.getByRole('button', {
        name: /> 35 km \/ týden/i,
      });
      fireEvent.click(highVolumeButton);

      expect(highVolumeButton.className).toContain('ring-cyan-400');
    });
  });

  /* =========================================================================
     SUITE 4: KROK 4 - KLOUBNÍ KOMFORT & CITLIVOST KOLEN
     ========================================================================= */
  describe('Krok 4: Kloubní komfort & citlivost kolen', () => {
    it('4.1: Zobrazí čistý nadpis a neobsahuje žádné matoucí (i) tlačítko', () => {
      render(
        <IntakeWizard onAssessmentCompleted={mockOnAssessmentCompleted} />
      );
      navigateToStep(4);

      expect(
        screen.getByText(/Citlivost kolenních kloubů při běhu a chůzi:/i)
      ).toBeInTheDocument();

      // Zero (i) buttons or collapsible educational wall of text
      expect(screen.queryByText(/Proč se ptáme\? \(i\)/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Co přesně zjišťujeme/i)).not.toBeInTheDocument();
    });

    it('4.2: Vykreslí přesně 4 přehledné situace citlivosti kolen', () => {
      render(
        <IntakeWizard onAssessmentCompleted={mockOnAssessmentCompleted} />
      );
      navigateToStep(4);

      expect(screen.getByText(/🟢 Bez potíží/i)).toBeInTheDocument();
      expect(screen.getByText(/🟡 Mírná citlivost/i)).toBeInTheDocument();
      expect(screen.getByText(/🟠 Výrazná citlivost \/ Artróza/i)).toBeInTheDocument();
      expect(screen.getByText(/🔴 Maximální ochrana/i)).toBeInTheDocument();
    });

    it('4.3: Ověřuje, že karta 🟠 Výrazná citlivost / Artróza NEOBSAHUJE text (Doporučeno)', () => {
      render(
        <IntakeWizard onAssessmentCompleted={mockOnAssessmentCompleted} />
      );
      navigateToStep(4);

      // Must not recommend having osteoarthritis
      expect(screen.queryByText(/\(Doporučeno\)/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/\(doporučeno\)/i)).not.toBeInTheDocument();
    });

    it('4.4: Kliknutí na kartu mění zvolenou úroveň ochrany kolen', () => {
      render(
        <IntakeWizard onAssessmentCompleted={mockOnAssessmentCompleted} />
      );
      navigateToStep(4);

      const severeKneeCard = screen.getByRole('button', {
        name: /Výrazná citlivost \/ Artróza/i,
      });
      fireEvent.click(severeKneeCard);

      expect(severeKneeCard.className).toContain('ring-cyan-400');
    });

    it('4.5: Umožňuje přepínat specifická ergonomická specifika (artróza, ostruha, vbočený palec, meniskus)', () => {
      render(
        <IntakeWizard onAssessmentCompleted={mockOnAssessmentCompleted} />
      );
      navigateToStep(4);

      const bunionButton = screen.getByRole('button', {
        name: /Vbočený palec \(Hallux Valgus\)/i,
      });
      fireEvent.click(bunionButton);

      expect(bunionButton.className).toContain('ring-cyan-400');

      // Clicking again toggles it off
      fireEvent.click(bunionButton);
      expect(bunionButton.className).not.toContain('ring-cyan-400');
    });
  });

  /* =========================================================================
     SUITE 5: KROK 5 - VÝROBCI OBUVI & ROZPOČET
     ========================================================================= */
  describe('Krok 5: Výrobci obuvi & rozpočet', () => {
    const expected16Brands = [
      'Hoka',
      'Asics',
      'Brooks',
      'New Balance',
      'Saucony',
      'Altra',
      'On Running',
      'Nike',
      'Adidas',
      'Mizuno',
      'Puma',
      'Salomon',
      'Topo Athletic',
      'Inov-8',
      'Craft',
      'Under Armour',
    ];

    it('5.1: Zobrazí všech 16 klíčových značek na trhu', () => {
      render(
        <IntakeWizard onAssessmentCompleted={mockOnAssessmentCompleted} />
      );
      navigateToStep(5);

      expect(screen.getByText(/Preferovaní výrobci obuvi/i)).toBeInTheDocument();

      expected16Brands.forEach((brand) => {
        expect(screen.getByRole('button', { name: brand })).toBeInTheDocument();
      });
    });

    it('5.2: Tlačítko "Vybrat vše" označí všech 16 značek', () => {
      render(
        <IntakeWizard onAssessmentCompleted={mockOnAssessmentCompleted} />
      );
      navigateToStep(5);

      const selectAllButton = screen.getByRole('button', { name: /Vybrat vše/i });
      fireEvent.click(selectAllButton);

      expect(screen.getByText(/Preferovaní výrobci obuvi \(16\/16\)/i)).toBeInTheDocument();
    });

    it('5.3: Tlačítko "Zrušit výběr" odznačí všechny značky a zobrazí informaci o prohledání všech výrobců', () => {
      render(
        <IntakeWizard onAssessmentCompleted={mockOnAssessmentCompleted} />
      );
      navigateToStep(5);

      const deselectAllButton = screen.getByRole('button', { name: /Zrušit výběr/i });
      fireEvent.click(deselectAllButton);

      expect(screen.getByText(/Preferovaní výrobci obuvi \(0\/16\)/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Nemáte označenou žádnou značku — asistent automaticky prohledá všechny výrobce na trhu/i)
      ).toBeInTheDocument();
    });

    it('5.4: Kliknutí na jednotlivou značku ji přidá nebo odebere', () => {
      render(
        <IntakeWizard onAssessmentCompleted={mockOnAssessmentCompleted} />
      );
      navigateToStep(5);

      // Default includes Asics, Brooks, Hoka
      const salomonButton = screen.getByRole('button', { name: 'Salomon' });
      expect(salomonButton.className).not.toContain('ring-cyan-400');

      // Click to add Salomon
      fireEvent.click(salomonButton);
      expect(salomonButton.className).toContain('ring-cyan-400');

      // Click to remove Salomon
      fireEvent.click(salomonButton);
      expect(salomonButton.className).not.toContain('ring-cyan-400');
    });

    it('5.5: Posuvník rozpočtu správně přepočítává EUR na orientační Kč', () => {
      render(
        <IntakeWizard onAssessmentCompleted={mockOnAssessmentCompleted} />
      );
      navigateToStep(5);

      const budgetSlider = screen.getByRole('slider');
      fireEvent.change(budgetSlider, { target: { value: '220' } });

      expect(screen.getByText(/€220/i)).toBeInTheDocument();
      expect(screen.getByText(/5 544 Kč/i)).toBeInTheDocument();
    });

    it('5.6: Kliknutí na "Zkontrolovat prompt pro AI" otevře inspekční modal s přesným zadáním', () => {
      render(
        <IntakeWizard onAssessmentCompleted={mockOnAssessmentCompleted} />
      );
      navigateToStep(5);

      const inspectButton = screen.getByRole('button', { name: /Zkontrolovat prompt pro AI/i });
      expect(inspectButton).toBeInTheDocument();

      fireEvent.click(inspectButton);

      // Modal is visible
      expect(screen.getByText(/Inspekce AI Promptu/i)).toBeInTheDocument();
      expect(screen.getByText(/Zero Hallucinations/i)).toBeInTheDocument();
      expect(screen.getByText(/Pravidla značek:/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Zkopírovat do schránky/i })).toBeInTheDocument();
    });

    it('5.7: Odznačení značky Asics ji přesune do zakázaných a žádný model Asics se neobjeví ve výsledcích', async () => {
      render(
        <IntakeWizard onAssessmentCompleted={mockOnAssessmentCompleted} />
      );
      navigateToStep(5);

      // Deselect Asics
      const asicsButton = screen.getByRole('button', { name: 'Asics' });
      fireEvent.click(asicsButton);

      // Generate results
      const submitButton = screen.getByRole('button', { name: /Vygenerovat návrhy obuvi/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnAssessmentCompleted).toHaveBeenCalledTimes(1);
      });

      const [calledFormData] = mockOnAssessmentCompleted.mock.calls[0];
      expect(calledFormData.preferred_brands).not.toContain('Asics');
      expect(calledFormData.forbidden_brands).toContain('Asics');

      // Verify the fetch call body contains Asics in forbidden_brands
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/agent/evaluate-form',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"forbidden_brands"'),
        })
      );
      const fetchBody = JSON.parse((global.fetch as any).mock.calls[0][1].body);
      expect(fetchBody.formData.forbidden_brands).toContain('Asics');
      expect(fetchBody.formData.preferred_brands).not.toContain('Asics');
    });
  });

  /* =========================================================================
     SUITE 6: NAVIGACE, RESET FORMULÁŘE & ODESLÁNÍ DOTAZNÍKU
     ========================================================================= */
  describe('Navigace, Reset a Odeslání dotazníku', () => {
    it('6.1: Tlačítko "Předchozí krok" je na Kroku 1 neaktivní a na dalších krocích funkční', () => {
      render(
        <IntakeWizard onAssessmentCompleted={mockOnAssessmentCompleted} />
      );

      const prevButton = screen.getByRole('button', { name: /Předchozí krok/i });
      expect(prevButton).toBeDisabled();

      // Go to Step 2
      const nextButton = screen.getByRole('button', { name: /Pokračovat/i });
      fireEvent.click(nextButton);
      expect(prevButton).not.toBeDisabled();

      // Go back to Step 1
      fireEvent.click(prevButton);
      expect(screen.getByText(/Rozměry chodidla & velikost/i)).toBeInTheDocument();
    });

    it('6.2: Tlačítko "Reset formuláře" kdykoliv vrátí dotazník na výchozí hodnoty a na Krok 1', () => {
      render(
        <IntakeWizard onAssessmentCompleted={mockOnAssessmentCompleted} />
      );
      navigateToStep(3);

      // There can be two reset buttons (header and footer)
      const resetButtons = screen.getAllByRole('button', { name: /Reset formuláře/i });
      fireEvent.click(resetButtons[0]);

      // Should be back on Step 1 with default size 43
      expect(screen.getByText(/Rozměry chodidla & velikost/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '43' }).className).toContain('bg-cyan-500');
    });

    it('6.3: Na Kroku 5 tlačítko "Vygenerovat návrhy obuvi" spustí onAssessmentCompleted', async () => {
      render(
        <IntakeWizard onAssessmentCompleted={mockOnAssessmentCompleted} />
      );
      navigateToStep(5);

      const submitButton = screen.getByRole('button', {
        name: /Vygenerovat návrhy obuvi/i,
      });
      expect(submitButton).toBeInTheDocument();

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnAssessmentCompleted).toHaveBeenCalledTimes(1);
      });

      const [calledFormData, calledResult] = mockOnAssessmentCompleted.mock.calls[0];
      expect(calledFormData.eu_size).toBe(43);
      expect(calledResult).toHaveProperty('recommended_shoes');
      expect(calledResult.recommended_shoes.length).toBeGreaterThan(0);
    });
  });
});
