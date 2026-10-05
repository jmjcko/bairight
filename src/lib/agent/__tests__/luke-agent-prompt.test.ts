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

  it("incorporates complete user purchase history and cross-category intelligence when provided", () => {
    const purchaseHistory = [
      {
        name: "Boty na horské kolo",
        category: "Cyklistika",
        targetValues: { "Velikost": "EU 44", "Šířka chodidla": "2E široké" },
      },
    ];
    const userFacts = [
      { label: "Anatomie chodidla", value: "Široké klenuté chodidlo 2E" },
    ];

    const prompt = buildLukeSystemPrompt("Silniční běžecké boty", "cs", purchaseHistory, userFacts);
    expect(prompt).toContain("User Purchase History & Cross-Category Context:");
    expect(prompt).toContain("Boty na horské kolo (Cyklistika)");
    expect(prompt).toContain("EU 44");
    expect(prompt).toContain("2E široké");
    expect(prompt).toContain("Anatomie chodidla: Široké klenuté chodidlo 2E");
    expect(prompt).toContain("Cross-Category Intelligence");
  });
});
