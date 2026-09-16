import { ExtractedDomainParameter } from "./domain-parameter-discovery";
import { supabase } from "@/lib/supabase";

export interface UserSearchRecord {
  id: string;
  userId: string;
  query: string;
  domainKey?: string;
  selectedParameters: ExtractedDomainParameter[];
  generatedPrompt?: string;
  createdAt: string;
}

export interface UserRAGFact {
  id: string;
  userId: string;
  category: string;
  factKey: string;
  factValue: string;
  confidence: number;
  sourceQuery?: string;
  updatedAt: string;
}

const SEARCH_HISTORY_PREFIX = "bairight_history_";
const RAG_FACTS_PREFIX = "bairight_rag_facts_";

const SEEDED_RAG_FACTS: Omit<UserRAGFact, "id" | "updatedAt">[] = [
  {
    userId: "demo",
    category: "Anatomie & Biomechanika",
    factKey: "Typ chodidla / Šířka",
    factValue: "Široké klenuté chodidlo (2E / 4E), pronace",
    confidence: 95,
  },
  {
    userId: "demo",
    category: "Zdraví & Komfort",
    factKey: "Citlivost kolenních kloubů",
    factValue: "Artróza 2. stupně, potřeba rocker podrážky",
    confidence: 90,
  },
  {
    userId: "demo",
    category: "Vlastněné značky",
    factKey: "Značky se skvělým fitem",
    factValue: "Altra Torin (0-drop), Hoka Bondi 8",
    confidence: 88,
  },
];

export class UserRAGHistoryService {
  /**
   * Uloží záznam o provedeném výzkumu a generování promptu pro daného uživatele.
   */
  static async saveUserSearchHistory(
    userId: string,
    record: {
      query: string;
      domainKey?: string;
      selectedParameters: ExtractedDomainParameter[];
      generatedPrompt?: string;
    }
  ): Promise<UserSearchRecord> {
    const now = new Date().toISOString();
    const newRecord: UserSearchRecord = {
      id: `srch-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      userId,
      query: record.query,
      domainKey: record.domainKey,
      selectedParameters: record.selectedParameters,
      generatedPrompt: record.generatedPrompt,
      createdAt: now,
    };

    // 1. Uložení v localStorage
    if (typeof window !== "undefined") {
      try {
        const key = `${SEARCH_HISTORY_PREFIX}${userId}`;
        const existing = this.getUserSearchHistory(userId);
        existing.unshift(newRecord);
        // Udržíme nejnovějších 50 výzkumů
        localStorage.setItem(key, JSON.stringify(existing.slice(0, 50)));
      } catch (err) {
        console.error("Chyba při zápisu historie výzkumu do localStorage:", err);
      }
    }

    // 2. Případná synchronizace se Supabase DB
    try {
      if (
        supabase &&
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://db.tydjbkdzghkbyeidyoxw.supabase.co"
      ) {
        await supabase.from("user_search_history").insert({
          user_id: userId,
          query: record.query,
          domain_key: record.domainKey,
          selected_parameters: record.selectedParameters,
          generated_prompt: record.generatedPrompt,
          created_at: now,
        });
      }
    } catch {
      // Tichý fallback pokud Supabase tabulka zatím neexistuje
    }

    // 3. Automatická extrakce RAG faktů ze zvolených parametrů
    this.extractRAGFactsFromSearch(userId, record.query, record.selectedParameters);

    return newRecord;
  }

  /**
   * Získá historii výzkumů pro daného uživatele.
   */
  static getUserSearchHistory(userId: string): UserSearchRecord[] {
    if (typeof window === "undefined") return [];

    try {
      const key = `${SEARCH_HISTORY_PREFIX}${userId}`;
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const parsed: UserSearchRecord[] = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  /**
   * Získá všechna uložená RAG fakta pro uživatele.
   */
  static getUserRAGFacts(userId: string): UserRAGFact[] {
    if (typeof window === "undefined") {
      return SEEDED_RAG_FACTS.map((f, i) => ({
        ...f,
        id: `fact-seed-${i}`,
        updatedAt: new Date().toISOString(),
      }));
    }

    try {
      const key = `${RAG_FACTS_PREFIX}${userId}`;
      const raw = localStorage.getItem(key);
      if (!raw) {
        // Inicializujeme výchozí fakta
        const seeded = SEEDED_RAG_FACTS.map((f, i) => ({
          ...f,
          id: `fact-seed-${i}`,
          updatedAt: new Date().toISOString(),
        }));
        localStorage.setItem(key, JSON.stringify(seeded));
        return seeded;
      }
      const parsed: UserRAGFact[] = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  /**
   * Přidá nebo aktualizuje RAG fakt uživatele.
   */
  static saveUserRAGFact(
    userId: string,
    fact: Omit<UserRAGFact, "id" | "updatedAt">
  ): UserRAGFact {
    const all = this.getUserRAGFacts(userId);
    const now = new Date().toISOString();

    const existingIdx = all.findIndex(
      (f) => f.category === fact.category && f.factKey.toLowerCase() === fact.factKey.toLowerCase()
    );

    let updatedFact: UserRAGFact;

    if (existingIdx >= 0) {
      all[existingIdx] = {
        ...all[existingIdx],
        factValue: fact.factValue,
        confidence: Math.max(all[existingIdx].confidence, fact.confidence),
        sourceQuery: fact.sourceQuery || all[existingIdx].sourceQuery,
        updatedAt: now,
      };
      updatedFact = all[existingIdx];
    } else {
      updatedFact = {
        ...fact,
        id: `fact-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        updatedAt: now,
      };
      all.unshift(updatedFact);
    }

    if (typeof window !== "undefined") {
      try {
        const key = `${RAG_FACTS_PREFIX}${userId}`;
        localStorage.setItem(key, JSON.stringify(all));
      } catch (err) {
        console.error("Chyba při uložení RAG faktu:", err);
      }
    }

    return updatedFact;
  }

  /**
   * Smaže konkrétní RAG fakt.
   */
  static deleteUserRAGFact(userId: string, factId: string): void {
    if (typeof window === "undefined") return;
    const all = this.getUserRAGFacts(userId);
    const filtered = all.filter((f) => f.id !== factId);
    try {
      const key = `${RAG_FACTS_PREFIX}${userId}`;
      localStorage.setItem(key, JSON.stringify(filtered));
    } catch (e) {
      console.error("Chyba při mazání RAG faktu:", e);
    }
  }

  /**
   * Automaticky extrahuje RAG fakta ze zvolených nákupních parametrů
   */
  private static extractRAGFactsFromSearch(
    userId: string,
    query: string,
    parameters: ExtractedDomainParameter[]
  ): void {
    for (const param of parameters) {
      const selectedValCheck = (param as { selectedValue?: string }).selectedValue;
      if (!selectedValCheck && (!param.suggestedValues || param.suggestedValues.length === 0)) continue;
      
      const selectedVal = (param as { selectedValue?: string }).selectedValue;
      const value = selectedVal || param.suggestedValues?.[0];
      if (!value) continue;

      if (param.id === "brand_preferences" || param.name.toLowerCase().includes("značk")) {
        this.saveUserRAGFact(userId, {
          userId,
          category: "Značky & Výrobci",
          factKey: `Preferované v kategorii ${query}`,
          factValue: String(value),
          confidence: 85,
          sourceQuery: query,
        });
      } else if (param.name.toLowerCase().includes("velikost") || param.name.toLowerCase().includes("rozměr") || param.name.toLowerCase().includes("šířk")) {
        this.saveUserRAGFact(userId, {
          userId,
          category: "Rozměry & Specifikace",
          factKey: `${param.name} (${query})`,
          factValue: String(value),
          confidence: 90,
          sourceQuery: query,
        });
      }
    }
  }
}
