import { describe, it, expect, beforeEach } from "vitest";
import { UserRAGHistoryService } from "../user-rag-history-service";

describe("UserRAGHistoryService", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("saves and retrieves user search history", async () => {
    const userId = "usr_test_123";
    const record = await UserRAGHistoryService.saveUserSearchHistory(userId, {
      query: "endurance silniční kolo",
      domainKey: "bikes",
      selectedParameters: [
        {
          id: "geom",
          name: "Geometrie rámu",
          category: "Rám",
          importance: "mandatory",
          rationale: "Comfort geometry",
          suggestedComponent: "chips",
          suggestedValues: ["Endurance vysoký Stack"],
        },
      ],
      generatedPrompt: "Vytvoř nákupní doporučení pro endurance kolo...",
    });

    expect(record.id).toBeDefined();
    expect(record.query).toBe("endurance silniční kolo");

    const history = UserRAGHistoryService.getUserSearchHistory(userId);
    expect(history.length).toBe(1);
    expect(history[0].query).toBe("endurance silniční kolo");
  });

  it("saves, retrieves and deletes user RAG facts", () => {
    const userId = "usr_test_456";

    const fact = UserRAGHistoryService.saveUserRAGFact(userId, {
      userId,
      category: "Rozměry",
      factKey: "Velikost rámu",
      factValue: "56 cm / L",
      confidence: 95,
    });

    expect(fact.id).toBeDefined();

    const facts = UserRAGHistoryService.getUserRAGFacts(userId);
    expect(facts.some((f) => f.factKey === "Velikost rámu")).toBe(true);

    UserRAGHistoryService.deleteUserRAGFact(userId, fact.id);
    const updatedFacts = UserRAGHistoryService.getUserRAGFacts(userId);
    expect(updatedFacts.some((f) => f.id === fact.id)).toBe(false);
  });
});
