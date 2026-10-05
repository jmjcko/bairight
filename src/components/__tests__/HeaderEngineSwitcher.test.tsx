import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { HeaderEngineSwitcher } from "../HeaderEngineSwitcher";

describe("HeaderEngineSwitcher Unit Tests", () => {
  it("1. Renders active provider title and capsule button", () => {
    const onSelect = vi.fn();
    const onOpenVault = vi.fn();

    render(
      <HeaderEngineSwitcher
        activeProviderId="openai_gpt4o"
        onSelectProvider={onSelect}
        onOpenVaultModal={onOpenVault}
        currentApiKeys={{ openai_gpt4o: "sk-proj-test" }}
      />
    );

    expect(screen.getByText("OpenAI")).toBeInTheDocument();
    expect(screen.getByText("BYOK")).toBeInTheDocument();
  });

  it("2. Opens dropdown menu when clicked and handles provider selection", () => {
    const onSelect = vi.fn();
    const onOpenVault = vi.fn();

    render(
      <HeaderEngineSwitcher
        activeProviderId="google_gemini"
        onSelectProvider={onSelect}
        onOpenVaultModal={onOpenVault}
      />
    );

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(screen.getByText("Výběr AI Modelu (BYOK)")).toBeInTheDocument();
    const geminiOption = screen.getByText("Google Gemini 3.6 Flash / Pro");
    fireEvent.click(geminiOption);

    expect(onSelect).toHaveBeenCalledWith("google_gemini");
  });

  it("3. Renders Bez klíče badge when active provider has no API key", () => {
    const onSelect = vi.fn();
    const onOpenVault = vi.fn();

    render(
      <HeaderEngineSwitcher
        activeProviderId="google_gemini"
        onSelectProvider={onSelect}
        onOpenVaultModal={onOpenVault}
        currentApiKeys={{}}
      />
    );

    expect(screen.getByText("Google AI")).toBeInTheDocument();
    expect(screen.getByText("Bez klíče")).toBeInTheDocument();
  });

  it("4. Renders ! Neplatný klíč badge on trigger button when key is verified invalid", async () => {
    const { VaultService } = await import("@/lib/auth/VaultService");
    VaultService.saveApiKey("google_gemini", "bad_key");
    VaultService.setKeyVerificationStatus("google_gemini", false, "Bad key");

    render(
      <HeaderEngineSwitcher
        activeProviderId="google_gemini"
        onSelectProvider={vi.fn()}
        onOpenVaultModal={vi.fn()}
        currentApiKeys={{ google_gemini: "bad_key" }}
      />
    );

    expect(screen.getByText("! Neplatný klíč")).toBeInTheDocument();
  });
});
