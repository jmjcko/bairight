import { describe, it, expect, beforeEach } from "vitest";
import {
  ChatQuotaService,
  GUEST_QUOTA_LIMIT,
  LOGGED_IN_DAILY_QUOTA_LIMIT,
} from "../chat-quota-service";

describe("ChatQuotaService - Zero-Friction Free Chat Quota Engine", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("1. Guest gets exactly 5 free queries per shopping session", () => {
    const sessionId = "session-test-guest-1";
    let status = ChatQuotaService.getQuotaStatus({ sessionId });

    expect(status.tier).toBe("guest");
    expect(status.totalAllowed).toBe(GUEST_QUOTA_LIMIT);
    expect(status.used).toBe(0);
    expect(status.remaining).toBe(5);
    expect(status.isExhausted).toBe(false);

    // Consume 3 queries
    for (let i = 0; i < 3; i++) {
      status = ChatQuotaService.consumeQuery({ sessionId });
    }
    expect(status.used).toBe(3);
    expect(status.remaining).toBe(2);
    expect(status.isExhausted).toBe(false);

    // Consume remaining 2 queries
    ChatQuotaService.consumeQuery({ sessionId });
    status = ChatQuotaService.consumeQuery({ sessionId });

    expect(status.used).toBe(5);
    expect(status.remaining).toBe(0);
    expect(status.isExhausted).toBe(true);
  });

  it("2. Logged-in authenticated user gets 15 free daily queries with midnight reset", () => {
    const userId = "user-google-123";
    let status = ChatQuotaService.getQuotaStatus({ userId });

    expect(status.tier).toBe("authenticated");
    expect(status.totalAllowed).toBe(LOGGED_IN_DAILY_QUOTA_LIMIT);
    expect(status.remaining).toBe(15);
    expect(status.resetsAt).toBeDefined();

    // Consume 5 queries
    for (let i = 0; i < 5; i++) {
      status = ChatQuotaService.consumeQuery({ userId });
    }
    expect(status.used).toBe(5);
    expect(status.remaining).toBe(10);
    expect(status.isExhausted).toBe(false);
  });

  it("3. Custom BYOK API key completely bypasses quota limits (Unlimited tier)", () => {
    const status = ChatQuotaService.getQuotaStatus({ hasCustomKey: true });
    expect(status.tier).toBe("unlimited");
    expect(status.remaining).toBe(Infinity);
    expect(status.isExhausted).toBe(false);

    const afterConsume = ChatQuotaService.consumeQuery({ hasCustomKey: true });
    expect(afterConsume.tier).toBe("unlimited");
    expect(afterConsume.remaining).toBe(Infinity);
    expect(afterConsume.isExhausted).toBe(false);
  });

  it("4. Different sessions track quota independently for guests", () => {
    const sessionA = "guest-session-a";
    const sessionB = "guest-session-b";

    for (let i = 0; i < 4; i++) {
      ChatQuotaService.consumeQuery({ sessionId: sessionA });
    }

    const statusA = ChatQuotaService.getQuotaStatus({ sessionId: sessionA });
    const statusB = ChatQuotaService.getQuotaStatus({ sessionId: sessionB });

    expect(statusA.remaining).toBe(1);
    expect(statusB.remaining).toBe(5);
  });
});
