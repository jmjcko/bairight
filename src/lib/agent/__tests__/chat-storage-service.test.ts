import { describe, it, expect, beforeEach, vi } from "vitest";
import { ChatStorageService } from "../chat-storage-service";
import { AgentChatMessage } from "../types";
import { supabase } from "@/lib/supabase";

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

  it("auto-detects userId from session storage and merges remote and local messages by timestamp", async () => {
    localStorage.setItem(
      "bairight_user_session",
      JSON.stringify({ id: "user_chat_test_1", email: "chat@test.com", name: "Chat Tester" })
    );

    const localMessages: AgentChatMessage[] = [
      {
        id: "msg-local-1",
        role: "user",
        content: "Lokální zpráva",
        timestamp: new Date("2026-02-01T10:00:00Z").toISOString(),
      },
    ];
    await ChatStorageService.saveMessages("agent-chat-merge", localMessages);

    // Mock Supabase
    vi.spyOn(ChatStorageService, "isCloudSyncEnabled").mockReturnValue(true);

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === "chat_threads") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: "thread-uuid-1" },
                  error: null,
                }),
              }),
            }),
          }),
          upsert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: "thread-uuid-1" },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "chat_messages") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: "msg-remote-1",
                    role: "assistant",
                    content: "Vzdálená odpověď ze serveru",
                    created_at: new Date("2026-02-01T10:05:00Z").toISOString(),
                  },
                ],
                error: null,
              }),
            }),
          }),
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      return {};
    });

    vi.spyOn(supabase, "from").mockImplementation(mockFrom as any);

    const loaded = await ChatStorageService.loadMessages("agent-chat-merge");
    expect(loaded.length).toBe(2);
    expect(loaded[0].id).toBe("msg-local-1");
    expect(loaded[1].id).toBe("msg-remote-1");
  });
});
