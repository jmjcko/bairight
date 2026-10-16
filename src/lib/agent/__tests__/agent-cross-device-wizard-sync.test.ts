import { describe, it, expect, beforeEach, vi } from "vitest";
import { AgentStorageService } from "../agent-storage-service";
import { PromptStorageService } from "../prompt-storage-service";
import { UniversalAgentDefinition } from "../universal-agent-schema";
import { supabase } from "@/lib/supabase";

describe("Cross-Device Wizard Answers & Prompt Synchronization", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("1. Synchronizes wizard answers (targetValues) and wizardState into cloud definition and hydrates on second device", async () => {
    const remoteTimestamp = new Date("2026-10-16T12:00:00Z").toISOString();
    const mockAgentAnswers = {
      coffee_type: ["espresso"],
      budget_range: "budget_15k",
      grinder_type: "integrated_conical",
    };
    const compiledPromptText = "Jsi špičkový barista. Zákazník preferuje espresso s rozpočtem 15 000 Kč.";

    // Device 2 starts with clean local storage (zero agents, zero wizard states, zero prompts)
    expect(localStorage.getItem("bairight_agent_wizard_states")).toBeNull();
    expect(localStorage.getItem("bairight_completed_prompts_v1")).toBeNull();

    // Mock Supabase returning agent created and completed on Device 1
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === "agents") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [
                {
                  id: "uuid-coffee-123",
                  agent_slug: "coffee-specialist-1",
                  name: "Kávovar Specialist",
                  category: "Domácí spotřebiče",
                  icon: "",
                  status: "active",
                  is_purchased: false,
                  purchased_at: null,
                  updated_at: remoteTimestamp,
                  definition: {
                    id: "coffee-specialist-1",
                    name: "Kávovar Specialist",
                    category: "Domácí spotřebiče",
                    questions: [
                      { id: "coffee_type", step: 1, title: "Typ", defaultValue: [] },
                      { id: "budget_range", step: 2, title: "Rozpočet", defaultValue: "" },
                    ],
                    targetValues: mockAgentAnswers,
                    systemPrompt: compiledPromptText,
                    wizardState: {
                      answers: mockAgentAnswers,
                      currentStepIndex: 2,
                      isCompleted: true,
                      completedPrompt: compiledPromptText,
                      updatedAt: remoteTimestamp,
                    },
                    updatedAt: remoteTimestamp,
                  },
                },
              ],
              error: null,
            }),
          }),
          upsert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      if (table === "user_prompts") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [
                {
                  id: "prompt-uuid-1",
                  user_id: "user_device_2",
                  agent_slug: "coffee-specialist-1",
                  prompt_text: compiledPromptText,
                  answers_summary: "coffee_type: espresso",
                  provider_id: "gemini",
                  created_at: remoteTimestamp,
                },
              ],
              error: null,
            }),
          }),
          upsert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      return { select: vi.fn(), upsert: vi.fn() };
    });

    vi.spyOn(AgentStorageService, "isCloudSyncEnabled").mockReturnValue(true);
    vi.spyOn(PromptStorageService, "isCloudSyncEnabled").mockReturnValue(true);
    vi.spyOn(supabase, "from").mockImplementation(mockFrom as any);

    // Run cloud sync on Device 2
    const syncedAgents = await AgentStorageService.syncWithCloud("user_device_2");
    expect(syncedAgents.length).toBe(1);

    const agent = syncedAgents[0];
    expect(agent.id).toBe("coffee-specialist-1");
    // Verify target answers are present in the agent definition
    expect(agent.targetValues).toEqual(mockAgentAnswers);
    expect(agent.systemPrompt).toBe(compiledPromptText);
    expect(agent.wizardState?.isCompleted).toBe(true);

    // Verify localStorage["bairight_agent_wizard_states"] was automatically hydrated
    const storedWizardRaw = localStorage.getItem("bairight_agent_wizard_states");
    expect(storedWizardRaw).not.toBeNull();
    const storedWizard = JSON.parse(storedWizardRaw!);
    expect(storedWizard["coffee-specialist-1"]).toBeDefined();
    expect(storedWizard["coffee-specialist-1"].answers).toEqual(mockAgentAnswers);
    expect(storedWizard["coffee-specialist-1"].isCompleted).toBe(true);

    // Verify PromptStorageService was hydrated with the compiled prompt
    const completedPrompts = PromptStorageService.getCompletedPrompts();
    expect(completedPrompts.some((p) => p.agentId === "coffee-specialist-1")).toBe(true);
    const foundPrompt = PromptStorageService.getCompletedPromptByAgentId("coffee-specialist-1");
    expect(foundPrompt?.prompt).toBe(compiledPromptText);
  });

  it("2. PromptStorageService.syncWithCloud persists and merges prompts from Supabase user_prompts table", async () => {
    const timestamp = new Date().toISOString();
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [
            {
              id: "cloud-prompt-1",
              agent_slug: "running-shoes-custom",
              prompt_text: "Dokončený expertní prompt pro běžecké boty.",
              answers_summary: "pronace: ano",
              provider_id: "openai",
              created_at: timestamp,
            },
          ],
          error: null,
        }),
      }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    });

    vi.spyOn(PromptStorageService, "isCloudSyncEnabled").mockReturnValue(true);
    vi.spyOn(supabase, "from").mockImplementation(mockFrom as any);

    const prompts = await PromptStorageService.syncWithCloud("user_test_prompts");
    expect(prompts.length).toBe(1);
    expect(prompts[0].agentId).toBe("running-shoes-custom");
    expect(prompts[0].prompt).toBe("Dokončený expertní prompt pro běžecké boty.");

    // Local storage now contains it
    const local = PromptStorageService.getCompletedPrompts();
    expect(local.length).toBe(1);
    expect(local[0].agentId).toBe("running-shoes-custom");
  });

  it("3. Zero BYOK credentials leakage: Agent definition saved with wizardState excludes any API keys", () => {
    const agentWithWizard: UniversalAgentDefinition = {
      id: "agent-security-test",
      name: "Security Check Agent",
      category: "Tools",
      icon: "",
      version: "1.0",
      description: "Test",
      questions: [],
      systemPrompt: "Safe prompt",
      targetValues: { budget: 5000 },
      wizardState: {
        answers: { budget: 5000 },
        currentStepIndex: 1,
        isCompleted: true,
        completedPrompt: "Safe prompt",
      },
      createdAt: new Date().toISOString(),
      isCustom: true,
    };

    AgentStorageService.saveAgent(agentWithWizard);
    const stored = AgentStorageService.getAllAgents();
    const saved = stored.find((a) => a.id === "agent-security-test");

    expect(saved).toBeDefined();
    expect(saved?.targetValues).toEqual({ budget: 5000 });
    expect(saved?.wizardState?.isCompleted).toBe(true);

    // Verify no credential fields exist
    expect((saved as any).apiKey).toBeUndefined();
    expect((saved as any).openAiKey).toBeUndefined();
    expect((saved as any).geminiKey).toBeUndefined();
    expect((saved as any).claudeKey).toBeUndefined();
  });
});
