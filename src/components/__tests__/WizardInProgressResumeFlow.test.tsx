import { describe, it, expect, beforeEach, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { AgentCategoryLauncher } from "@/components/AgentCategoryLauncher";
import { DynamicAgentWizard } from "@/components/DynamicAgentWizard";
import { AgentStorageService } from "@/lib/agent/agent-storage-service";
import { UniversalAgentDefinition } from "@/lib/agent/universal-agent-schema";
import { I18nProvider } from "@/lib/i18n/I18nContext";

const dummyAgent: UniversalAgentDefinition = {
  id: "test-coffee-wizard",
  name: "Kávovar Specialist",
  category: "Domácí spotřebiče",
  description: "Průvodce výběrem kávovaru",
  icon: "",
  version: "1.0",
  questions: [
    {
      id: "coffee_type",
      step: 1,
      title: "Jaký typ kávy preferujete?",
      subtitle: "Vyberte preferovaný styl",
      component: "chips",
      options: [
        { label: "Espresso", value: "espresso" },
        { label: "Cappuccino", value: "cappuccino" },
      ],
      defaultValue: [],
      promptForgeTemplate: "- Typ: {value}",
    },
    {
      id: "budget_range",
      step: 2,
      title: "Jaký je váš rozpočet?",
      subtitle: "Zvolte cenovou hladinu",
      component: "chips",
      options: [
        { label: "Do 10 000 Kč", value: "budget_10k" },
        { label: "10 000 - 25 000 Kč", value: "budget_25k" },
      ],
      defaultValue: [],
      promptForgeTemplate: "- Rozpočet: {value}",
    },
  ],
  systemPrompt: "Jsi expert na kávovary.",
  createdAt: new Date().toISOString(),
  isCustom: true,
};

describe("Wizard In-Progress Resume & Completion Integrity Test Suite", () => {
  beforeEach(() => {
    localStorage.clear();
    AgentStorageService.resetToDefaults();
  });

  it("1. [CZ] In-progress agent in launcher triggers onSelectAgent without forcing showResult = true", () => {
    localStorage.setItem("bairight_locale", "cs");
    AgentStorageService.saveAgent(dummyAgent);

    // Save in-progress state at Step 1 (not completed, no evaluation result)
    localStorage.setItem(
      "bairight_agent_wizard_states",
      JSON.stringify({
        [dummyAgent.id]: {
          answers: { coffee_type: ["espresso"] },
          currentStepIndex: 1,
          isCompleted: false,
        },
      })
    );

    const mockOnSelect = vi.fn();
    render(
      <I18nProvider>
        <AgentCategoryLauncher onSelectAgent={mockOnSelect} />
      </I18nProvider>
    );

    // Shows in-progress badge and Continue button in Czech
    expect(screen.getByText(/Rozpracováno/i)).toBeInTheDocument();
    expect(screen.getByText(/Pokračovat/i)).toBeInTheDocument();

    // Clicking card calls onSelectAgent without passing true
    const card = screen.getByText(/Kávovar Specialist/i);
    fireEvent.click(card);

    expect(mockOnSelect).toHaveBeenCalledTimes(1);
    expect(mockOnSelect).toHaveBeenCalledWith(expect.objectContaining({ id: dummyAgent.id }));
    expect(mockOnSelect.mock.calls[0][1]).toBeUndefined();
  });

  it("2. [EN] In-progress agent in launcher triggers onSelectAgent in English", () => {
    localStorage.setItem("bairight_locale", "en");
    AgentStorageService.saveAgent(dummyAgent);

    localStorage.setItem(
      "bairight_agent_wizard_states",
      JSON.stringify({
        [dummyAgent.id]: {
          answers: { coffee_type: ["espresso"] },
          currentStepIndex: 1,
          isCompleted: false,
        },
      })
    );

    const mockOnSelect = vi.fn();
    render(
      <I18nProvider>
        <AgentCategoryLauncher onSelectAgent={mockOnSelect} />
      </I18nProvider>
    );

    // Shows in-progress badge and Continue button in English
    expect(screen.getByText(/In progress/i)).toBeInTheDocument();
    expect(screen.getByText(/Continue/i)).toBeInTheDocument();

    const card = screen.getByText(/Kávovar Specialist/i);
    fireEvent.click(card);

    expect(mockOnSelect).toHaveBeenCalledTimes(1);
    expect(mockOnSelect.mock.calls[0][1]).toBeUndefined();
  });

  it("3. [CZ] Completed agent in launcher shows Completed badge and Results button", () => {
    localStorage.setItem("bairight_locale", "cs");
    AgentStorageService.saveAgent(dummyAgent);

    localStorage.setItem(
      "bairight_agent_wizard_states",
      JSON.stringify({
        [dummyAgent.id]: {
          answers: { coffee_type: ["espresso"], budget_range: ["budget_25k"] },
          currentStepIndex: 2,
          isCompleted: true,
          result: {
            title: "Vyhodnocení",
            summaryAssessment: "Doporučení hotovo",
            recommendations: [
              { model: "DeLonghi Magnifica", rationale: "Skvělá volba" },
            ],
          },
        },
      })
    );

    const mockOnSelect = vi.fn();
    render(
      <I18nProvider>
        <AgentCategoryLauncher onSelectAgent={mockOnSelect} />
      </I18nProvider>
    );

    expect(screen.getByText(/Dokončeno/i)).toBeInTheDocument();
    expect(screen.getByText(/Výsledky/i)).toBeInTheDocument();

    const card = screen.getByText(/Kávovar Specialist/i);
    fireEvent.click(card);

    expect(mockOnSelect).toHaveBeenCalledTimes(1);
    expect(mockOnSelect.mock.calls[0][1]).toBeUndefined();
  });

  it("4. DynamicAgentWizard mounts at saved currentStepIndex with prefilled answers and persists navigation", () => {
    localStorage.setItem("bairight_locale", "cs");
    localStorage.setItem(
      "bairight_agent_wizard_states",
      JSON.stringify({
        [dummyAgent.id]: {
          answers: { coffee_type: ["espresso"] },
          currentStepIndex: 2,
          isCompleted: false,
        },
      })
    );

    const mockStepChange = vi.fn();
    const mockBack = vi.fn();

    render(
      <I18nProvider>
        <DynamicAgentWizard
          agent={dummyAgent}
          initialStepIndex={2}
          initialShowResult={false}
          onStepChange={mockStepChange}
          onBackToLauncher={mockBack}
          locale="cs"
        />
      </I18nProvider>
    );

    // It should open at Step 2 question: "Jaký je váš rozpočet"
    expect(screen.getByText(/Jaký je váš rozpočet/i)).toBeInTheDocument();

    // Clicking previous goes to Step 1 and persists state
    const prevBtn = screen.getByText(/Předchozí/i);
    fireEvent.click(prevBtn);

    const stored = JSON.parse(localStorage.getItem("bairight_agent_wizard_states") || "{}");
    expect(stored[dummyAgent.id]?.currentStepIndex).toBe(1);
    expect(stored[dummyAgent.id]?.isCompleted).toBe(false);
  });

  it("5. Canceling wizard persists current progress so user can resume where they left off", () => {
    localStorage.setItem("bairight_locale", "cs");
    const mockBack = vi.fn();

    render(
      <I18nProvider>
        <DynamicAgentWizard
          agent={dummyAgent}
          initialStepIndex={1}
          initialShowResult={false}
          onBackToLauncher={mockBack}
          locale="cs"
        />
      </I18nProvider>
    );

    // Select an option on step 1
    const espressoChip = screen.getByText(/Espresso/i);
    fireEvent.click(espressoChip);

    // Click cancel in Czech
    const cancelBtn = screen.getAllByTitle(/Zavřít wizard a vrátit se na úvod/i)[0];
    fireEvent.click(cancelBtn);

    expect(mockBack).toHaveBeenCalledTimes(1);

    const stored = JSON.parse(localStorage.getItem("bairight_agent_wizard_states") || "{}");
    expect(stored[dummyAgent.id]?.answers?.coffee_type).toEqual(["espresso"]);
    expect(stored[dummyAgent.id]?.isCompleted).toBe(false);
  });
});
