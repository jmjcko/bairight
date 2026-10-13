import { describe, it, expect, vi, beforeEach } from "vitest";
import { FeedbackService } from "../feedback-service";
import { supabase } from "@/lib/supabase";

describe("FeedbackService Suite", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("1. Rejects submissions without required email or message", async () => {
    const res1 = await FeedbackService.submitFeedback({
      email: "",
      category: "feature",
      message: "Some message",
    });
    expect(res1.success).toBe(false);

    const res2 = await FeedbackService.submitFeedback({
      email: "test@example.com",
      category: "feature",
      message: "   ",
    });
    expect(res2.success).toBe(false);
  });

  it("2. Successfully stores feedback in local backup and returns success", async () => {
    const res = await FeedbackService.submitFeedback({
      email: "visitor@example.com",
      name: "Visitor Jan",
      category: "bug",
      message: "Found a typo on checkout",
    });

    expect(res.success).toBe(true);
    const backup = FeedbackService.getLocalFeedbackBackup();
    expect(backup.length).toBe(1);
    expect(backup[0].email).toBe("visitor@example.com");
    expect(backup[0].category).toBe("bug");
    expect(backup[0].message).toBe("Found a typo on checkout");
  });

  it("3. fetchFeedback falls back gracefully to local backup when cloud is unavailable", async () => {
    localStorage.setItem(
      "bairight_local_feedback_backup",
      JSON.stringify([
        {
          id: "local_1",
          email: "user@test.cz",
          category: "feature",
          message: "Add dark mode toggle",
          status: "new",
          created_at: new Date().toISOString(),
        },
      ])
    );

    const list = await FeedbackService.fetchFeedback();
    expect(list.length).toBeGreaterThanOrEqual(1);
    expect(list[0].email).toBe("user@test.cz");
  });
});
