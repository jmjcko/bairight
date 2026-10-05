import { describe, it, expect, beforeEach, vi } from "vitest";
import { ChatStorageService } from "../chat-storage-service";
import { AgentChatMessage } from "../types";

describe("ChatStorageService - Multi-Browser Cloud & Local Persistence", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("handles offline local storage correctly when user is not logged in", async () => {
    const testMessages: AgentChatMessage[] = [
      {
        id: "msg-1",
        role: "user",
        content: "Hledám bezdrátová sluchátka na běhání",
        timestamp: new Date().toISOString(),
      },
      {
        id: "msg-2",
        role: "assistant",
        content: "Doporučuji Jabra Elite 8 Active nebo Beats Fit Pro s wingtips.",
        timestamp: new Date().toISOString(),
      },
    ];

    await ChatStorageService.saveMessages("headphones-test", testMessages);
    const local = ChatStorageService.getLocalMessages("headphones-test");
    expect(local.length).toBe(2);
    expect(local[0].content).toContain("Hledám bezdrátová sluchátka");

    const loaded = await ChatStorageService.loadMessages("headphones-test");
    expect(loaded.length).toBe(2);

    await ChatStorageService.clearMessages("headphones-test");
    expect(ChatStorageService.getLocalMessages("headphones-test").length).toBe(0);
  });
});
