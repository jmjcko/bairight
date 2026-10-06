import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AIEngineSubscriptionModal } from "../AIEngineSubscriptionModal";
import { HeaderEngineSwitcher } from "../HeaderEngineSwitcher";
import { VaultService } from "@/lib/auth/VaultService";
import { I18nProvider } from "@/lib/i18n/I18nContext";

describe("QA Bug Regression: Invalid API Keys Verification & Activation Prevention", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("bairight_locale", "cs");
    vi.clearAllMocks();
  });

  it("1. QA Scenario: Entering an invalid key and clicking Test fails -> disables Activate button and displays ! Neplatný klíč", async () => {
    // Mock the test-key endpoint to return an error like in QA screenshot
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: false,
        error: "Neplatný Google Gemini API klíč. Zkontrolujte jej v Google AI Studio.",
      }),
    } as Response);

    const onSave = vi.fn();
    const onClose = vi.fn();

    render(
      <I18nProvider>
        <AIEngineSubscriptionModal
          isOpen={true}
          onClose={onClose}
          activeProviderId="google_gemini"
          onSaveProvider={onSave}
          currentApiKeys={{}}
        />
      </I18nProvider>
    );

    // Find the input and enter a dummy/invalid key (e.g. "nesmysl123")
    const input = screen.getByPlaceholderText("AIzaSy...");
    fireEvent.change(input, { target: { value: "invalid_dummy_key_123" } });

    // Click "Test klíče"
    const testButton = screen.getByText("Test klíče");
    fireEvent.click(testButton);

    // Wait for the test to complete
    await waitFor(() => {
      expect(screen.getByText("Neplatný Google Gemini API klíč. Zkontrolujte jej v Google AI Studio.")).toBeInTheDocument();
    });

    // 1. Badge must show "! Neplatný klíč" (NOT "Klíč zadán" or "✓ OK")
    expect(screen.getByText(/! Neplatný klíč/i)).toBeInTheDocument();

    // 2. Footer warning must appear
    expect(screen.getByText(/! Nelze aktivovat s neplatným klíčem/i)).toBeInTheDocument();

    // 3. Save button must be disabled
    const activateButton = screen.getByRole("button", { name: /Aktivovat & Uložit Vault/i });
    expect(activateButton).toBeDisabled();

    // 4. Clicking the disabled button does NOT trigger save
    fireEvent.click(activateButton);
    expect(onSave).not.toHaveBeenCalled();

    // 5. VaultService must store that the key is invalid
    const status = VaultService.getVerificationStatus("google_gemini");
    expect(status?.isValid).toBe(false);
  });

  it("2. HeaderEngineSwitcher displays ! Neplatný in dropdown and ! Neplatný klíč in trigger (NOT ✓ OK)", () => {
    // Prepare Vault with invalid key from the failed test
    VaultService.saveApiKey("google_gemini", "bad_key");
    VaultService.setKeyVerificationStatus("google_gemini", false, "Chybný klíč");

    render(
      <I18nProvider>
        <HeaderEngineSwitcher
          activeProviderId="google_gemini"
          onSelectProvider={vi.fn()}
          onOpenVaultModal={vi.fn()}
          currentApiKeys={{ google_gemini: "bad_key" }}
        />
      </I18nProvider>
    );

    // 1. The main trigger button must show ! Neplatný klíč (NOT BYOK or ✓ OK)
    expect(screen.getByText("! Neplatný klíč")).toBeInTheDocument();
    expect(screen.queryByText("✓ OK")).not.toBeInTheDocument();

    // 2. Open dropdown
    const trigger = screen.getByRole("button");
    fireEvent.click(trigger);

    // 3. In the dropdown, it must show "! Neplatný" (NOT "✓ OK")
    const invalidBadges = screen.getAllByText(/! Neplatný/i);
    expect(invalidBadges.length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText("✓ OK")).not.toBeInTheDocument();
  });

  it("3. User edits/fixes the key -> error state is cleared and user is unblocked", () => {
    VaultService.saveApiKey("google_gemini", "bad_key");
    VaultService.setKeyVerificationStatus("google_gemini", false, "Chybný klíč");

    render(
      <I18nProvider>
        <AIEngineSubscriptionModal
          isOpen={true}
          onClose={vi.fn()}
          activeProviderId="google_gemini"
          onSaveProvider={vi.fn()}
          currentApiKeys={{ google_gemini: "bad_key" }}
        />
      </I18nProvider>
    );

    // Initially blocked
    const activateButton = screen.getByRole("button", { name: /Aktivovat & Uložit Vault/i });
    expect(activateButton).toBeDisabled();

    // User types new key
    const input = screen.getByDisplayValue("bad_key");
    fireEvent.change(input, { target: { value: "AIzaSyValidGeminiKey" } });

    // The invalid state and warning are cleared
    expect(screen.queryByText(/! Nelze aktivovat s neplatným klíčem/i)).not.toBeInTheDocument();
    expect(activateButton).not.toBeDisabled();
  });
});
