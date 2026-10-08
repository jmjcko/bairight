import { describe, it, expect, beforeEach, vi } from "vitest";
import { AgentStorageService } from "../agent-storage-service";
import { UniversalAgentDefinition } from "../universal-agent-schema";
import { supabase } from "@/lib/supabase";

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

  it("automatically resolves user_id from localStorage user session when not explicitly provided", () => {
    localStorage.setItem(
      "bairight_user_session",
      JSON.stringify({ id: "user_auto_456", email: "test@example.com", name: "Tester" })
    );

    const currentId = AgentStorageService.getCurrentUserId();
    expect(currentId).toBe("user_auto_456");

    const dummyAgent: UniversalAgentDefinition = {
      id: "agent-auto-test",
      name: "Auto User Agent",
      category: "Audio",
      icon: "",
      version: "1.0.0",
      description: "Auto test",
      questions: [],
      systemPrompt: "Prompt",
      isCustom: true,
      createdAt: new Date().toISOString(),
    };

    AgentStorageService.saveAgent(dummyAgent);
    const stored = AgentStorageService.getAllAgents();
    const found = stored.find((a) => a.id === "agent-auto-test");
    expect(found).toBeDefined();
    expect(found?.updatedAt).toBeDefined();
  });

  it("updates updatedAt timestamp whenever agent is saved or modified", () => {
    const pastTime = new Date(Date.now() - 10000).toISOString();
    const agent: UniversalAgentDefinition = {
      id: "agent-timestamp-test",
      name: "Timestamp Agent",
      category: "Sport",
      icon: "",
      version: "1.0.0",
      description: "Testing timestamp",
      questions: [],
      systemPrompt: "Test",
      isCustom: true,
      createdAt: pastTime,
      updatedAt: pastTime,
    };

    AgentStorageService.saveAgent(agent);
    const saved = AgentStorageService.getAllAgents().find((a) => a.id === "agent-timestamp-test");
    expect(saved).toBeDefined();
    expect(new Date(saved!.updatedAt!).getTime()).toBeGreaterThan(new Date(pastTime).getTime());
  });

  it("merges remote agents when syncWithCloud is called with remote data", async () => {
    // Mock Supabase select for agents
    const remoteTimestamp = new Date().toISOString();
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [
            {
              id: "uuid-1",
              agent_slug: "agent-remote-synced",
              name: "Remote Synced Agent",
              category: "Cycling",
              icon: "",
              status: "active",
              is_purchased: false,
              purchased_at: null,
              updated_at: remoteTimestamp,
              definition: {
                id: "agent-remote-synced",
                name: "Remote Synced Agent",
                category: "Cycling",
                questions: [],
                systemPrompt: "Remote prompt",
                updatedAt: remoteTimestamp,
              },
            },
          ],
          error: null,
        }),
      }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    });

    vi.spyOn(AgentStorageService, "isCloudSyncEnabled").mockReturnValue(true);
    vi.spyOn(supabase, "from").mockImplementation(mockFrom as any);

    const result = await AgentStorageService.syncWithCloud("user_cloud_sync_test");
    expect(result.some((a) => a.id === "agent-remote-synced")).toBe(true);

    // Verify it updated localStorage so subsequent getAllAgents includes it
    const local = AgentStorageService.getAllAgents();
    expect(local.some((a) => a.id === "agent-remote-synced")).toBe(true);
  });

  it("implements Last-Write-Wins: newer remote overwrites older local agent", async () => {
    const olderTime = new Date("2026-01-01T10:00:00Z").toISOString();
    const newerTime = new Date("2026-01-02T10:00:00Z").toISOString();

    // Local has older version
    const localAgent: UniversalAgentDefinition = {
      id: "agent-lww",
      name: "Old Local Name",
      category: "Laptops",
      icon: "",
      version: "1.0.0",
      description: "Old",
      questions: [],
      systemPrompt: "Old prompt",
      isCustom: true,
      createdAt: olderTime,
      updatedAt: olderTime,
    };
    AgentStorageService.saveAgent(localAgent);
    // Explicitly set older timestamp in storage
    localStorage.setItem("bairight_all_agents_v2", JSON.stringify([localAgent]));

    // Remote has newer version
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [
            {
              id: "uuid-lww",
              agent_slug: "agent-lww",
              name: "Newer Remote Name",
              category: "Laptops",
              icon: "",
              status: "active",
              is_purchased: false,
              purchased_at: null,
              updated_at: newerTime,
              definition: {
                id: "agent-lww",
                name: "Newer Remote Name",
                category: "Laptops",
                questions: [],
                systemPrompt: "Newer remote prompt",
                updatedAt: newerTime,
              },
            },
          ],
          error: null,
        }),
      }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    });

    vi.spyOn(AgentStorageService, "isCloudSyncEnabled").mockReturnValue(true);
    vi.spyOn(supabase, "from").mockImplementation(mockFrom as any);

    const synced = await AgentStorageService.syncWithCloud("user_lww");
    const merged = synced.find((a) => a.id === "agent-lww");
    expect(merged?.name).toBe("Newer Remote Name");
    expect(merged?.systemPrompt).toBe("Newer remote prompt");
  });
});
