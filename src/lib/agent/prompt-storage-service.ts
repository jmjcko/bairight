import { supabase } from "@/lib/supabase";
/**
 * Prompt Storage Service
 * Ukládá VÝHRADNĚ HOTOVÉ prompty po dokončení posledního kroku dotazníku.
 * Mezikroky (krok 1 až N-1) se NIKDY do úložiště neukládají, zobrazují se pouze v živém náhledu paměti.
 */

export interface CompletedPromptRecord {
  id: string;
  agentId: string;
  agentName: string;
  category: string;
  dateFormatted: string;
  timestamp: string;
  prompt: string;
  answersSummary?: string;
  providerId?: string;
}

const STORAGE_KEY = 'bairight_completed_prompts_v1';

export class PromptStorageService {
  /**
   * Checks if Supabase client is configured for cloud persistence
   */
  static isCloudSyncEnabled(): boolean {
    if (!supabase || typeof (supabase as any).from !== "function") return false;
    const url =
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      "";
    const key =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_ANON_KEY ||
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      "";
    return Boolean(
      url &&
      !url.includes("placeholder") &&
      key &&
      !key.includes("placeholder")
    );
  }

  /**
   * Retrieves active user id from session storage
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
   * Synchronizuje hotové prompty s cloudovou databází Supabase (tabulka user_prompts)
   */
  static async syncWithCloud(userId?: string): Promise<CompletedPromptRecord[]> {
    const activeUserId = userId || this.getCurrentUserId();
    if (!activeUserId || typeof window === "undefined") {
      return this.getCompletedPrompts();
    }
    const local = this.getCompletedPrompts();
    if (!this.isCloudSyncEnabled()) {
      return local;
    }

    try {
      const { data: remoteRows, error } = await supabase
        .from("user_prompts")
        .select("*")
        .eq("user_id", activeUserId);

      if (error || !remoteRows) {
        return local;
      }

      const promptMap = new Map<string, CompletedPromptRecord>();
      remoteRows.forEach((r: any) => {
        const record: CompletedPromptRecord = {
          id: r.id || `prompt-${r.agent_slug}`,
          agentId: r.agent_slug,
          agentName: r.agent_slug,
          category: "",
          dateFormatted: new Date(r.created_at || Date.now()).toLocaleDateString("cs-CZ"),
          timestamp: r.created_at || new Date().toISOString(),
          prompt: r.prompt_text,
          answersSummary: r.answers_summary || undefined,
          providerId: r.provider_id || undefined,
        };
        promptMap.set(record.agentId, record);
      });

      // Merge local prompts
      local.forEach((lp) => {
        const remote = promptMap.get(lp.agentId);
        if (!remote) {
          promptMap.set(lp.agentId, lp);
          void supabase.from("user_prompts").upsert({
            user_id: activeUserId,
            agent_slug: lp.agentId,
            prompt_text: lp.prompt,
            answers_summary: lp.answersSummary || "",
            provider_id: lp.providerId || "gemini",
            created_at: lp.timestamp,
          }, { onConflict: "user_id, agent_slug" });
        } else {
          const localTime = new Date(lp.timestamp).getTime();
          const remoteTime = new Date(remote.timestamp).getTime();
          if (localTime > remoteTime) {
            promptMap.set(lp.agentId, lp);
            void supabase.from("user_prompts").upsert({
              user_id: activeUserId,
              agent_slug: lp.agentId,
              prompt_text: lp.prompt,
              answers_summary: lp.answersSummary || "",
              provider_id: lp.providerId || "gemini",
              created_at: lp.timestamp,
            }, { onConflict: "user_id, agent_slug" });
          }
        }
      });

      const merged = Array.from(promptMap.values()).sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      return merged;
    } catch (e) {
      console.warn("Failed to sync prompts with cloud:", e);
      return local;
    }
  }

  /**
   * Načte všechny dokončené prompty z localStorage (seřazeno od nejnovějšího)
   */
  static getCompletedPromptByAgentId(agentId: string): CompletedPromptRecord | undefined {
    return this.getCompletedPrompts().find((p) => p.agentId === agentId);
  }

  static getCompletedPrompts(): CompletedPromptRecord[] {
    if (typeof window === 'undefined') {
      return [];
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const list: CompletedPromptRecord[] = JSON.parse(raw);
      return Array.isArray(list) ? list : [];
    } catch (err) {
      console.error('Chyba při načítání hotových promptů:', err);
      return [];
    }
  }

  /**
   * Uloží hotový prompt po dokončení posledního kroku.
   * Kontroluje, že se nejedná o prázdný prompt a zabraňuje duplicitám při opakovaném kliknutí.
   */
  static saveCompletedPrompt(
    data: Omit<CompletedPromptRecord, 'id' | 'timestamp' | 'dateFormatted'> & {
      timestamp?: string;
      dateFormatted?: string;
    }
  ): CompletedPromptRecord {
    const now = new Date();
    const timestamp = data.timestamp || now.toISOString();
    const dateFormatted =
      data.dateFormatted ||
      `${now.toLocaleDateString('cs-CZ')}, ${now.toLocaleTimeString('cs-CZ', {
        hour: '2-digit',
        minute: '2-digit',
      })}`;

    const newRecord: CompletedPromptRecord = {
      id: `prompt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      agentId: data.agentId,
      agentName: data.agentName,
      category: data.category,
      dateFormatted,
      timestamp,
      prompt: data.prompt.trim(),
      answersSummary: data.answersSummary,
      providerId: data.providerId,
    };

    if (typeof window !== 'undefined') {
      try {
        const existing = this.getCompletedPrompts();
        // Zabráníme duplikaci přesně stejného promptu během posledních 5 sekund
        const isDuplicate = existing.some(
          (p) =>
            p.prompt === newRecord.prompt &&
            Math.abs(new Date(p.timestamp).getTime() - now.getTime()) < 5000
        );

        if (!isDuplicate) {
          const updated = [newRecord, ...existing];
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

          const activeUserId = this.getCurrentUserId();
          if (activeUserId && this.isCloudSyncEnabled()) {
            void (async () => {
              try {
                await supabase.from("user_prompts").upsert({
                  user_id: activeUserId,
                  agent_slug: newRecord.agentId,
                  prompt_text: newRecord.prompt,
                  answers_summary: newRecord.answersSummary || "",
                  provider_id: newRecord.providerId || "gemini",
                  created_at: newRecord.timestamp,
                }, { onConflict: "user_id, agent_slug" });
              } catch (err) {
                console.warn("Cloud prompt sync error in saveCompletedPrompt:", err);
              }
            })();
          }
        }
      } catch (err) {
        console.error('Chyba při ukládání hotového promptu:', err);
      }
    }

    return newRecord;
  }

  /**
   * Smaže hotový prompt podle ID
   */
  static deleteCompletedPrompt(id: string): boolean {
    if (typeof window === 'undefined') return false;

    try {
      const existing = this.getCompletedPrompts();
      const filtered = existing.filter((p) => p.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch (err) {
      console.error('Chyba při mazání hotového promptu:', err);
      return false;
    }
  }

  /**
   * Smaže celou historii hotových promptů
   */
  static clearAll(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error('Chyba při promazání hotových promptů:', err);
    }
  }

  /**
   * Stáhne hotový prompt jako .md soubor
   */
  static downloadPromptMarkdown(record: CompletedPromptRecord): void {
    if (typeof window === 'undefined') return;

    const content = `# Dokončený prompt pro AI: ${record.agentName}
**Kategorie:** ${record.category}
**Datum a čas dokončení:** ${record.dateFormatted}
${record.answersSummary ? `**Souhrn parametrů:** ${record.answersSummary}\n` : ''}

---

## Finální systémový a uživatelský prompt

\`\`\`markdown
${record.prompt}
\`\`\`
`;

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hotovy-prompt-${record.agentId}-${Date.now()}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
