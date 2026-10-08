/**
 * Chat Storage Service
 * Handles persistence of chat messages in localStorage (instant render)
 * and synchronizes with Supabase cloud (chat_threads & chat_messages tables) for authenticated users.
 */

import { supabase } from "@/lib/supabase";
import { AgentChatMessage } from "./types";

const CHAT_PREFIX = "bairight_chat_messages_";

export class ChatStorageService {
  static isCloudSyncEnabled(): boolean {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const key =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "";
    return Boolean(
      supabase &&
      url &&
      !url.includes("placeholder") &&
      key &&
      !key.includes("placeholder")
    );
  }

  /**
   * Retrieves the currently authenticated user's ID from session storage if available
   */
  static getCurrentUserId(): string | undefined {
    if (typeof window === "undefined") return undefined;
    try {
      const raw = localStorage.getItem("bairight_user_session");
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed?.id;
      }
    } catch {
      return undefined;
    }
    return undefined;
  }

  /**
   * Retrieves messages from localStorage immediately
   */
  static getLocalMessages(agentSlug: string): AgentChatMessage[] {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(`${CHAT_PREFIX}${agentSlug}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Failed to load local chat messages:", e);
    }
    return [];
  }

  /**
   * Loads chat messages: returns local immediately, and merges with Supabase if user is authenticated
   */
  static async loadMessages(
    agentSlug: string,
    userId?: string,
    agentTitle?: string
  ): Promise<AgentChatMessage[]> {
    const local = this.getLocalMessages(agentSlug);
    const activeUserId = userId || this.getCurrentUserId();
    if (!activeUserId || !this.isCloudSyncEnabled()) {
      return local;
    }

    try {
      // 1. Fetch thread
      const { data: thread, error: threadErr } = await supabase
        .from("chat_threads")
        .select("id")
        .eq("user_id", activeUserId)
        .eq("agent_slug", agentSlug)
        .maybeSingle();

      if (threadErr) {
        console.warn("Could not query chat_threads:", threadErr.message);
        return local;
      }

      if (!thread?.id) {
        // If local has messages, seed to cloud
        if (local.length > 0) {
          void this.saveMessages(agentSlug, local, activeUserId, agentTitle);
        }
        return local;
      }

      // 2. Fetch messages in thread
      const { data: messageRows, error: msgErr } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("thread_id", thread.id)
        .order("created_at", { ascending: true });

      if (msgErr || !messageRows) {
        console.warn("Could not fetch remote chat_messages:", msgErr?.message);
        return local;
      }

      if (messageRows.length === 0) {
        if (local.length > 0) {
          void this.saveMessages(agentSlug, local, activeUserId, agentTitle);
        }
        return local;
      }

      const remoteMessages: AgentChatMessage[] = messageRows.map((r: any) => ({
        id: r.id,
        role: r.role,
        content: r.content,
        timestamp: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
        productMetadata: r.product_metadata || undefined,
      }));

      // Merge local messages that may not be in remote yet
      const remoteIds = new Set(remoteMessages.map((m) => m.id));
      const missingLocal = local.filter((m) => !remoteIds.has(m.id));

      let merged = [...remoteMessages];
      if (missingLocal.length > 0) {
        merged = [...remoteMessages, ...missingLocal].sort((a, b) => {
          const tA = new Date(a.timestamp || 0).getTime();
          const tB = new Date(b.timestamp || 0).getTime();
          return tA - tB;
        });
        // Seed missing local messages to cloud
        void this.saveMessages(agentSlug, merged, activeUserId, agentTitle);
      }

      // Cache locally
      if (typeof window !== "undefined") {
        localStorage.setItem(`${CHAT_PREFIX}${agentSlug}`, JSON.stringify(merged));
      }
      return merged;
    } catch (err) {
      console.warn("Exception loading chat messages from cloud:", err);
      return local;
    }
  }

  /**
   * Saves messages to localStorage and asynchronously syncs to Supabase
   */
  static async saveMessages(
    agentSlug: string,
    messages: AgentChatMessage[],
    userId?: string,
    agentTitle?: string
  ): Promise<void> {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(`${CHAT_PREFIX}${agentSlug}`, JSON.stringify(messages));
      } catch (e) {
        console.error("Failed to save chat locally:", e);
      }
    }

    const activeUserId = userId || this.getCurrentUserId();
    if (!activeUserId || !this.isCloudSyncEnabled() || messages.length === 0) {
      return;
    }

    try {
      // 1. Ensure thread exists with updated timestamp
      const { data: thread, error: threadErr } = await supabase
        .from("chat_threads")
        .upsert(
          {
            user_id: activeUserId,
            agent_slug: agentSlug,
            title: agentTitle || `Chat ${agentSlug}`,
            is_active: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id, agent_slug" }
        )
        .select("id")
        .single();

      if (threadErr || !thread?.id) {
        console.warn("Could not upsert chat thread in cloud:", threadErr?.message);
        return;
      }

      const threadId = thread.id;

      // 2. Fetch existing messages in thread
      const { data: existingRows } = await supabase
        .from("chat_messages")
        .select("id")
        .eq("thread_id", threadId);

      const existingIds = new Set((existingRows || []).map((r: any) => r.id));

      const newRows = messages
        .filter((m) => !existingIds.has(m.id))
        .map((m) => {
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(m.id);
          const row: any = {
            thread_id: threadId,
            user_id: activeUserId,
            role: m.role,
            content: m.content,
            product_metadata: (m as any).productMetadata || null,
            created_at: m.timestamp ? new Date(m.timestamp).toISOString() : new Date().toISOString(),
          };
          if (isUuid) {
            row.id = m.id;
          }
          return row;
        });

      if (newRows.length > 0) {
        const { error: insertErr } = await supabase.from("chat_messages").insert(newRows);
        if (insertErr) {
          console.warn("Could not insert chat_messages into cloud:", insertErr.message);
        }
      }
    } catch (err) {
      console.warn("Exception syncing chat messages to cloud:", err);
    }
  }

  /**
   * Clears messages locally and in cloud
   */
  static async clearMessages(agentSlug: string, userId?: string): Promise<void> {
    if (typeof window !== "undefined") {
      localStorage.removeItem(`${CHAT_PREFIX}${agentSlug}`);
    }

    const activeUserId = userId || this.getCurrentUserId();
    if (activeUserId && this.isCloudSyncEnabled()) {
      try {
        const { data: thread } = await supabase
          .from("chat_threads")
          .select("id")
          .eq("user_id", activeUserId)
          .eq("agent_slug", agentSlug)
          .maybeSingle();

        if (thread?.id) {
          await supabase.from("chat_messages").delete().eq("thread_id", thread.id);
          await supabase.from("chat_threads").delete().eq("id", thread.id);
        }
      } catch (err) {
        console.warn("Could not clear cloud chat:", err);
      }
    }
  }
}
