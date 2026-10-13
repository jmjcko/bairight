import { supabase } from "@/lib/supabase";

export type FeedbackCategory = "feature" | "bug" | "praise" | "general";
export type FeedbackStatus = "new" | "in_progress" | "resolved";

export interface FeedbackSubmission {
  email: string;
  name?: string;
  category: FeedbackCategory;
  message: string;
  userId?: string;
  appVersion?: string;
}

export interface FeedbackItem extends FeedbackSubmission {
  id: string;
  created_at: string;
  status: FeedbackStatus;
  admin_notes?: string;
}

const LOCAL_FEEDBACK_KEY = "bairight_local_feedback_backup";

export class FeedbackService {
  /**
   * Submit new feedback from a user or visitor
   */
  static async submitFeedback(submission: FeedbackSubmission): Promise<{ success: boolean; id?: string; error?: string }> {
    const trimmedEmail = submission.email.trim();
    const trimmedMessage = submission.message.trim();

    if (!trimmedEmail || !trimmedMessage) {
      return { success: false, error: "Email and message are required" };
    }

    const payload = {
      email: trimmedEmail,
      name: submission.name?.trim() || null,
      category: submission.category,
      message: trimmedMessage,
      user_id: submission.userId || null,
      app_version: submission.appVersion || "v1.0.26",
      status: "new",
    };

    // 1. Local backup in localStorage
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(LOCAL_FEEDBACK_KEY);
        const list = stored ? JSON.parse(stored) : [];
        list.unshift({ ...payload, id: `local_${Date.now()}`, created_at: new Date().toISOString() });
        localStorage.setItem(LOCAL_FEEDBACK_KEY, JSON.stringify(list.slice(0, 50)));
      } catch {
        // Ignore storage error
      }
    }

    // 2. Direct Supabase insert
    if (supabase && typeof (supabase as any).from === "function") {
      try {
        const { data, error } = await supabase
          .from("feedback")
          .insert(payload)
          .select("id")
          .single();

        if (error) {
          console.warn("Notice: Cloud feedback insertion error:", error.message);
          return { success: true, id: `local_${Date.now()}` }; // Successful local fallback
        }
        return { success: true, id: data?.id };
      } catch (err: any) {
        console.warn("Exception during feedback submission:", err?.message || err);
        return { success: true, id: `local_${Date.now()}` };
      }
    }

    return { success: true, id: `local_${Date.now()}` };
  }

  /**
   * Fetch all feedback (Admin authorized)
   */
  static async fetchFeedback(): Promise<FeedbackItem[]> {
    if (!supabase || typeof (supabase as any).from !== "function") {
      return this.getLocalFeedbackBackup();
    }

    try {
      const { data, error } = await supabase
        .from("feedback")
        .select("*")
        .order("created_at", { ascending: false });

      if (error || !data) {
        console.warn("Notice: Could not fetch cloud feedback, falling back to local:", error?.message);
        return this.getLocalFeedbackBackup();
      }

      return data as FeedbackItem[];
    } catch {
      return this.getLocalFeedbackBackup();
    }
  }

  /**
   * Update feedback status or admin notes (Admin authorized)
   */
  static async updateFeedbackStatus(id: string, status: FeedbackStatus, adminNotes?: string): Promise<boolean> {
    if (!supabase || typeof (supabase as any).from !== "function" || id.startsWith("local_")) {
      return true;
    }

    try {
      const { error } = await supabase
        .from("feedback")
        .update({ status, admin_notes: adminNotes || null })
        .eq("id", id);

      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Retrieve local feedback backup
   */
  static getLocalFeedbackBackup(): FeedbackItem[] {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(LOCAL_FEEDBACK_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
}
