import { describe, it, expect, beforeEach } from "vitest";
import { VaultService, maskKey } from "../VaultService";

describe("VaultService Unit Tests", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("1. Obfuscates and masks API keys correctly", () => {
    const rawKey = "sk-proj-1234567890abcdefghijklmnopqrstuvwxyz";
    const masked = maskKey(rawKey);
    expect(masked).toBe("sk-proj••••••••wxyz");
  });

  it("2. Saves and retrieves API key for provider", () => {
    const key = "AIzaSyTest123456789";
    VaultService.saveApiKey("google_gemini", key);
    expect(VaultService.getApiKey("google_gemini")).toBe(key);
  });

  it("3. Returns valid connection state for bairight_core managed model", () => {
    const state = VaultService.getConnectionState("bairight_core");
    expect(state.hasValidToken).toBe(true);
    expect(state.connectionType).toBe("bairight_managed");
  });

  it("4. Returns disconnected state when no key is set", () => {
    const state = VaultService.getConnectionState("anthropic_claude");
    expect(state.hasValidToken).toBe(false);
  });

  it("5. Deletes key when empty string is saved", () => {
    VaultService.saveApiKey("openai_gpt4o", "sk-proj-123");
    expect(VaultService.getApiKey("openai_gpt4o")).toBe("sk-proj-123");
    VaultService.saveApiKey("openai_gpt4o", "");
    expect(VaultService.getApiKey("openai_gpt4o")).toBe("");
  });
});
