import { describe, it, expect, beforeEach, vi } from "vitest";
import { AgentStorageService } from "../agent-storage-service";
import { UniversalAgentDefinition } from "../universal-agent-schema";

describe("AgentStorageService - Cloud Persistence and Cross-Device Sync", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("handles offline local storage correctly when user is not logged in", () => {
    const dummyAgent: UniversalAgentDefinition = {
      id: "agent-test-1",
      name: "Test Runner Agent",
      category: "Running",
      icon: "",
      version: "1.0.0",
      description: "Test description",
      questions: [],
      systemPrompt: "Test prompt",
      isCustom: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    AgentStorageService.saveAgent(dummyAgent);
    const stored = AgentStorageService.getAllAgents();
    expect(stored.some((a) => a.id === "agent-test-1")).toBe(true);

    AgentStorageService.markAgentAsPurchased("agent-test-1", true);
    const purchased = AgentStorageService.getPurchasedAgents();
    expect(purchased.some((a) => a.id === "agent-test-1")).toBe(true);

    AgentStorageService.deleteAgent("agent-test-1");
    const remaining = AgentStorageService.getAllAgents();
    expect(remaining.some((a) => a.id === "agent-test-1")).toBe(false);
  });

  it("syncWithCloud falls back gracefully to local agents if cloud is unavailable", async () => {
    const dummyAgent: UniversalAgentDefinition = {
      id: "agent-test-cloud",
      name: "Cloud Agent",
      category: "Tech",
      icon: "",
      version: "1.0.0",
      description: "Cloud agent",
      questions: [],
      systemPrompt: "Test",
      isCustom: true,
      createdAt: new Date().toISOString(),
    };
    AgentStorageService.saveAgent(dummyAgent);

    const result = await AgentStorageService.syncWithCloud("user_123");
    expect(Array.isArray(result)).toBe(true);
    expect(result.some((a) => a.id === "agent-test-cloud")).toBe(true);
  });
});
