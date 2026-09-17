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
});
