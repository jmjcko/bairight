import { describe, it, expect } from "vitest";
import { buildLukeSystemPrompt } from "../luke-agent-prompt";

describe("Agent Luke System Prompt Specification", () => {
  it("builds canonical English system prompt with category query regardless of locale", () => {
    const promptCs = buildLukeSystemPrompt("endurance silniční kolo", "cs");
    expect(promptCs).toContain("endurance silniční kolo");
    expect(promptCs).toContain("expert shopping analyst");
    expect(promptCs).toContain("brand_preferences");

    const promptEn = buildLukeSystemPrompt("endurance road bike", "en");
    expect(promptEn).toContain("endurance road bike");
    expect(promptEn).toContain("expert shopping analyst");
    expect(promptEn).toContain("brand_preferences");
  });
});
