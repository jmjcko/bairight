/**
 * Memory Storage Service
 * Handles persistence of AI Memory Facts (PersistentMemoryFact) in localStorage
 * and synchronizes with Supabase cloud (user_rag_facts table) for authenticated users.
 */

import { supabase } from "@/lib/supabase";
import { PersistentMemoryFact, INITIAL_USER_FACTS } from "./engine-config";

const MEMORY_STORAGE_KEY = "bairight_user_facts";

export class MemoryStorageService {
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
   * Retrieves all memory facts from localStorage
   */
  static getLocalFacts(): PersistentMemoryFact[] {
    if (typeof window === "undefined") return INITIAL_USER_FACTS;
    try {
      const stored = localStorage.getItem(MEMORY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Failed to load local memory facts:", e);
    }
    return INITIAL_USER_FACTS;
  }

  /**
   * Synchronizes local facts with Supabase cloud for authenticated user
   */
  static async syncWithCloud(userId: string): Promise<PersistentMemoryFact[]> {
    const localFacts = this.getLocalFacts();
    if (!userId || !this.isCloudSyncEnabled()) {
      return localFacts;
    }

    try {
      // 1. Fetch remote facts from user_rag_facts
      const { data: remoteRows, error: fetchErr } = await supabase
        .from("user_rag_facts")
        .select("*")
        .eq("user_id", userId);

      if (fetchErr || !remoteRows) {
        console.warn("Could not fetch remote memory facts:", fetchErr?.message);
        return localFacts;
      }

      const remoteFacts: PersistentMemoryFact[] = remoteRows.map((r: any) => ({
        id: r.id,
        category: (r.category || "preference") as any,
        label: r.fact_key,
        value: r.fact_value,
        source: r.source_query || "Cloud Sync",
        updatedAt: r.updated_at || r.created_at || new Date().toISOString(),
        isEnriched: r.is_enriched !== false,
      }));

      // 2. Merge map by fact_key / label
      const factMap = new Map<string, PersistentMemoryFact>();
      remoteFacts.forEach((rf) => factMap.set(rf.label.toLowerCase(), rf));

      const factsToUpload: PersistentMemoryFact[] = [];

      localFacts.forEach((lf) => {
        const existing = factMap.get(lf.label.toLowerCase());
        if (!existing) {
          factMap.set(lf.label.toLowerCase(), lf);
          factsToUpload.push(lf);
        }
      });

      // 3. Upload missing local facts to cloud
      if (factsToUpload.length > 0) {
        const rowsToUpsert = factsToUpload.map((f) => ({
          user_id: userId,
          category: f.category,
          fact_key: f.label,
          fact_value: f.value,
          confidence: 90,
          is_enriched: f.isEnriched,
          source_query: f.source,
          updated_at: f.updatedAt || new Date().toISOString(),
        }));

        void (async () => {
          try {
            await supabase.from("user_rag_facts").upsert(rowsToUpsert, { onConflict: "user_id, fact_key" });
          } catch (err) {
            console.warn("Could not upload missing facts to cloud:", err);
          }
        })();
      }

      const mergedList = Array.from(factMap.values());
      if (typeof window !== "undefined") {
        localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(mergedList));
      }
      return mergedList;
    } catch (err) {
      console.warn("Exception during memory cloud sync:", err);
      return localFacts;
    }
  }

  /**
   * Adds a new fact locally and syncs to Supabase
   */
  static saveFact(fact: PersistentMemoryFact, userId?: string): PersistentMemoryFact[] {
    const existing = this.getLocalFacts();
    const updated = [fact, ...existing.filter((f) => f.label.toLowerCase() !== fact.label.toLowerCase())];

    if (typeof window !== "undefined") {
      localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(updated));
    }

    if (userId && this.isCloudSyncEnabled()) {
      void (async () => {
        try {
          await supabase.from("user_rag_facts").upsert(
            {
              user_id: userId,
              category: fact.category,
              fact_key: fact.label,
              fact_value: fact.value,
              confidence: 90,
              is_enriched: fact.isEnriched,
              source_query: fact.source,
              updated_at: fact.updatedAt || new Date().toISOString(),
            },
            { onConflict: "user_id, fact_key" }
          );
        } catch (err) {
          console.warn("Exception saving memory fact to cloud:", err);
        }
      })();
    }

    return updated;
  }

  /**
   * Toggles enrichment of a fact locally and in cloud
   */
  static toggleFact(factId: string, userId?: string): PersistentMemoryFact[] {
    const existing = this.getLocalFacts();
    let toggledFact: PersistentMemoryFact | undefined;

    const updated = existing.map((f) => {
      if (f.id === factId) {
        toggledFact = { ...f, isEnriched: !f.isEnriched, updatedAt: new Date().toISOString() };
        return toggledFact;
      }
      return f;
    });

    if (typeof window !== "undefined") {
      localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(updated));
    }

    if (userId && toggledFact && this.isCloudSyncEnabled()) {
      const factToSync = toggledFact;
      void (async () => {
        try {
          await supabase
            .from("user_rag_facts")
            .update({
              is_enriched: factToSync.isEnriched,
              updated_at: factToSync.updatedAt,
            })
            .match({ user_id: userId, fact_key: factToSync.label });
        } catch (err) {
          console.warn("Exception updating memory fact in cloud:", err);
        }
      })();
    }

    return updated;
  }

  /**
   * Deletes a fact locally and in cloud
   */
  static deleteFact(factId: string, factLabel: string, userId?: string): PersistentMemoryFact[] {
    const existing = this.getLocalFacts();
    const updated = existing.filter((f) => f.id !== factId && f.label !== factLabel);

    if (typeof window !== "undefined") {
      localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(updated));
    }

    if (userId && this.isCloudSyncEnabled()) {
      void (async () => {
        try {
          await supabase
            .from("user_rag_facts")
            .delete()
            .match({ user_id: userId, fact_key: factLabel });
        } catch (err) {
          console.warn("Exception deleting memory fact from cloud:", err);
        }
      })();
    }

    return updated;
  }
}
