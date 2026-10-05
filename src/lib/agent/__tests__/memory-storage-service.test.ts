import { describe, it, expect, beforeEach, vi } from "vitest";
import { MemoryStorageService } from "../memory-storage-service";
import { PersistentMemoryFact } from "../engine-config";

describe("MemoryStorageService - Multi-Browser AI Memory & RAG Persistence", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("saves, toggles and deletes memory facts locally and falls back gracefully", () => {
    const fact: PersistentMemoryFact = {
      id: "fact-test-1",
      category: "preference",
      label: "Oblíbené značky",
      value: "Sony, Sennheiser",
      source: "Uživatelský záznam",
      updatedAt: new Date().toISOString(),
      isEnriched: true,
    };

    const saved = MemoryStorageService.saveFact(fact);
    expect(saved.length).toBeGreaterThanOrEqual(1);
    expect(saved.some((f) => f.label === "Oblíbené značky")).toBe(true);

    const toggled = MemoryStorageService.toggleFact("fact-test-1");
    const toggledFact = toggled.find((f) => f.id === "fact-test-1");
    expect(toggledFact?.isEnriched).toBe(false);

    const deleted = MemoryStorageService.deleteFact("fact-test-1", "Oblíbené značky");
    expect(deleted.some((f) => f.id === "fact-test-1")).toBe(false);
  });
});
