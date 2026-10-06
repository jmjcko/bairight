import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { I18nProvider } from "@/lib/i18n/I18nContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import Home from "@/app/page";
import { AgentStorageService } from "@/lib/agent/agent-storage-service";

describe("Bilingual Localization & Language Switcher Suite", () => {
  beforeEach(() => {
    localStorage.clear();
    if (typeof document !== "undefined") {
      document.cookie = "bairight_locale=; path=/; max-age=0";
    }
    AgentStorageService.saveAgent({
      id: "agent_shoes_test",
      name: "Běžecká obuv",
      category: "Sport",
      description: "Testovací agent",
      version: "1.0",
      questions: [{ id: "q1", title: "Otázka 1", question: "Otázka 1", type: "single_choice", options: ["A", "B"] }],
      systemPrompt: "Test prompt",
    } as any);
  });

  it("1. LanguageSwitcher renders with active English locale by default", () => {
    render(
      <I18nProvider>
        <LanguageSwitcher />
      </I18nProvider>
    );

    const czButton = screen.getByRole("button", { name: /Přepnout do češtiny/i });
    const enButton = screen.getByRole("button", { name: /Switch to English/i });

    expect(czButton).toBeInTheDocument();
    expect(enButton).toBeInTheDocument();
    expect(enButton).toHaveAttribute("aria-pressed", "true");
    expect(czButton).toHaveAttribute("aria-pressed", "false");
  });

  it("2. Clicking Czech button switches locale and persists to localStorage", () => {
    render(
      <I18nProvider>
        <LanguageSwitcher />
      </I18nProvider>
    );

    const czButton = screen.getByRole("button", { name: /Přepnout do češtiny/i });
    fireEvent.click(czButton);

    expect(czButton).toHaveAttribute("aria-pressed", "true");
    expect(localStorage.getItem("bairight_locale")).toBe("cs");
  });

  it("3. Toggling language in Home updates Header navigation and Hero Launcher texts", async () => {
    render(
      <I18nProvider>
        <Home />
      </I18nProvider>
    );

    // Initial state: English by default on clean homepage
    expect(screen.getByPlaceholderText(/Ergonomic office chair/i)).toBeInTheDocument();

    // Select agent to reveal contextual mode switcher tabs
    const agentCard = await screen.findByText("Běžecká obuv");
    fireEvent.click(agentCard);

    expect(screen.getByRole("button", { name: /Shopping Wizard/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Agent Discussion/i })).toBeInTheDocument();

    // Switch to Czech
    const czButton = screen.getByRole("button", { name: /Přepnout do češtiny/i });
    fireEvent.click(czButton);

    // Header tabs updated to Czech
    expect(screen.getByRole("button", { name: /Průvodce nákupem/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Diskuse s agentem/i })).toBeInTheDocument();

    // Switch back to English
    const enButton = screen.getByRole("button", { name: /Switch to English/i });
    fireEvent.click(enButton);

    expect(screen.getByRole("button", { name: /Shopping Wizard/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Agent Discussion/i })).toBeInTheDocument();
  });
});
