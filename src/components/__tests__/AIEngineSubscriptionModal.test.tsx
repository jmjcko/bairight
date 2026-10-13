import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { AIEngineSubscriptionModal } from "../AIEngineSubscriptionModal";
import { I18nProvider } from "@/lib/i18n/I18nContext";

describe("AIEngineSubscriptionModal - Zero-Knowledge BYOK Security Notice", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders the Zero-Knowledge security callout in Czech explaining keys are never synced to DB", () => {
    localStorage.setItem("bairight_locale", "cs");
    render(
      <I18nProvider>
        <AIEngineSubscriptionModal
          isOpen={true}
          onClose={vi.fn()}
          activeProviderId="google_gemini"
          onSaveProvider={vi.fn()}
        />
      </I18nProvider>
    );

    expect(screen.getByText(/BEZPEČNOSTNÍ ZÁRUKA \(ZERO-KNOWLEDGE VAULT\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Z bezpečnostních důvodů \(Zero-Knowledge\) se vaše API klíče NIKDY neukládají do naší databáze/i)).toBeInTheDocument();
    expect(screen.getByText(/Pokud se přihlásíte na novém zařízení.*bude potřeba API klíč.*zadat znovu/i)).toBeInTheDocument();
  });

  it("renders the Zero-Knowledge security callout in English explaining keys are never synced to DB", () => {
    localStorage.setItem("bairight_locale", "en");
    render(
      <I18nProvider>
        <AIEngineSubscriptionModal
          isOpen={true}
          onClose={vi.fn()}
          activeProviderId="google_gemini"
          onSaveProvider={vi.fn()}
        />
      </I18nProvider>
    );

    expect(screen.getByText(/ZERO-KNOWLEDGE SECURITY POLICY/i)).toBeInTheDocument();
    expect(screen.getByText(/your personal API keys are NEVER synchronized to our database or cloud/i)).toBeInTheDocument();
    expect(screen.getByText(/When accessing bAIright from a new device.*you will need to re-enter your API key/i)).toBeInTheDocument();
  });

  it("shows invalid key badge and disables activation when API key fails verification", async () => {
    localStorage.setItem("bairight_locale", "cs");
    const { VaultService } = await import("@/lib/auth/VaultService");
    VaultService.saveApiKey("google_gemini", "invalid_dummy_key");
    VaultService.setKeyVerificationStatus("google_gemini", false, "Neplatný klíč");

    const onSave = vi.fn();

    render(
      <I18nProvider>
        <AIEngineSubscriptionModal
          isOpen={true}
          onClose={vi.fn()}
          activeProviderId="google_gemini"
          onSaveProvider={onSave}
          currentApiKeys={{ google_gemini: "invalid_dummy_key" }}
        />
      </I18nProvider>
    );

    // Should display invalid key badge
    expect(screen.getByText(/! Neplatný klíč/i)).toBeInTheDocument();

    // Should display warning
    expect(screen.getByText(/! Nelze aktivovat s neplatným klíčem/i)).toBeInTheDocument();

    // Activate button should be disabled
    const saveButton = screen.getByRole("button", { name: /Aktivovat & Uložit Vault/i });
    expect(saveButton).toBeDisabled();
  });

  it("renders step-by-step onboarding guide auto-expanded in Czech with clear steps", async () => {
    const { fireEvent } = await import("@testing-library/react");
    localStorage.setItem("bairight_locale", "cs");

    render(
      <I18nProvider>
        <AIEngineSubscriptionModal
          isOpen={true}
          onClose={vi.fn()}
          activeProviderId="google_gemini"
          onSaveProvider={vi.fn()}
        />
      </I18nProvider>
    );

    const guideToggle = screen.getByRole("button", { name: /Návod krok za krokem/i });
    expect(guideToggle).toBeInTheDocument();

    // Auto-expanded by default for missing key
    expect(screen.getByText(/100% ZDARMA bez platební karty/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Google AI Studio/i })).toBeInTheDocument();
    expect(screen.getByText(/Vytvořte API klíč/i)).toBeInTheDocument();

    // Toggling collapses it
    fireEvent.click(guideToggle);
    expect(screen.queryByText(/100% ZDARMA bez platební karty/i)).not.toBeInTheDocument();
  });

  it("renders step-by-step onboarding guide auto-expanded in English with pricing clarification", async () => {
    localStorage.setItem("bairight_locale", "en");

    render(
      <I18nProvider>
        <AIEngineSubscriptionModal
          isOpen={true}
          onClose={vi.fn()}
          activeProviderId="openai_gpt4o"
          onSaveProvider={vi.fn()}
        />
      </I18nProvider>
    );

    const guideToggle = screen.getByRole("button", { name: /Step-by-step setup guide/i });
    expect(guideToggle).toBeInTheDocument();

    // Auto-expanded by default for missing key
    expect(screen.getByText(/Consumer ChatGPT Plus.*does NOT apply to API access/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /OpenAI Billing/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /API Keys/i })).toBeInTheDocument();
  });
});
