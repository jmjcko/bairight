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
   * Načte všechny dokončené prompty z localStorage (seřazeno od nejnovějšího)
   */
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
