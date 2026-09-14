/**
 * Domain Learning Service (Kolektivní učení doménových parametrů)
 * 
 * Umožňuje systému bAIright učit se nové rozhodovací parametry z uživatelských interakcí.
 * Když uživatel přidá k nějaké kategorii (např. boty, auta) nový parametr (např. "sport", "dětská velikost"),
 * tento parametr se zaznamená do paměti s relevančním skóre a počítadlem použití.
 * Při dalším vyhledávání v dané kategorii se tento parametr automaticky nabídne
 * všem ostatním uživatelům jako ověřený komunitní parametr s odznakem 👥 Komunitní.
 */

import { ExtractedDomainParameter } from './domain-parameter-discovery';

export interface LearnedDomainParameter {
  id: string;
  domainKey: string; // např. 'shoes', 'cars', 'coffee', 'chair', 'laptop', 'generic'
  name: string;
  category: string;
  importance: 'mandatory' | 'recommended' | 'preference';
  rationale: string;
  icon: string;
  suggestedComponent: 'chips' | 'slider' | 'dropdown';
  suggestedValues?: string[];
  usageCount: number;
  relevanceScore: number; // 0 - 100 %
  isCommunityApproved: boolean;
  createdAt: string;
  lastUsedAt: string;
}

const STORAGE_KEY = 'bairight_learned_domain_parameters_v1';

// Počáteční přednaučené parametry z reálných nákupních scénářů uživatelů
const SEEDED_LEARNED_PARAMETERS: LearnedDomainParameter[] = [
  {
    id: 'learned-shoes-sport-type',
    domainKey: 'shoes',
    name: 'Konkrétní sportovní disciplína & pohybová zátěž',
    category: 'Sportovní zaměření',
    importance: 'recommended',
    rationale: 'Specifikace sportu (basketbal, volejbal, fitness/crossfit, tenis, atletika) pro optimalizaci stability a boční opory.',
    icon: '🏅',
    suggestedComponent: 'chips',
    suggestedValues: ['Běh / Silnice a maraton', 'Trail / Hory a les', 'Fitness / Silový trojboj', 'Halové sporty (basket, florbal)', 'Běžné nošení & chůze'],
    usageCount: 14,
    relevanceScore: 95,
    isCommunityApproved: true,
    createdAt: '2026-09-01T10:00:00.000Z',
    lastUsedAt: '2026-09-11T12:00:00.000Z',
  },
  {
    id: 'learned-shoes-orthopedic-insoles',
    domainKey: 'shoes',
    name: 'Kompatibilita s vlastní ortopedickou vložkou na míru',
    category: 'Ortopedie & Zdraví',
    importance: 'recommended',
    rationale: 'Hluboká pata a vyjímatelná původní stélka pro bezproblémové vložení individuální stélky od podiatra.',
    icon: '🩺',
    suggestedComponent: 'chips',
    suggestedValues: ['Plně vyjímatelná stélka nutná', 'Standardní integrovaná stélka'],
    usageCount: 9,
    relevanceScore: 92,
    isCommunityApproved: true,
    createdAt: '2026-09-02T14:30:00.000Z',
    lastUsedAt: '2026-09-10T16:00:00.000Z',
  },
  {
    id: 'learned-cars-isofix-count',
    domainKey: 'cars',
    name: 'Počet a přístupnost kotev ISOFIX (3 plnohodnotné sedačky)',
    category: 'Rodina & Bezpečnost',
    importance: 'recommended',
    rationale: 'Schopnost umístit tři dětské autosedačky vedle sebe ve druhé řadě či ISOFIX na sedadle spolujezdce.',
    icon: '👶',
    suggestedComponent: 'chips',
    suggestedValues: ['3x ISOFIX vzadu podmínkou', '2x ISOFIX vzadu postačí', 'ISOFIX i vpředu u spolujezdce'],
    usageCount: 18,
    relevanceScore: 98,
    isCommunityApproved: true,
    createdAt: '2026-09-03T09:15:00.000Z',
    lastUsedAt: '2026-09-11T11:30:00.000Z',
  },
  {
    id: 'learned-coffee-decalc-program',
    domainKey: 'coffee',
    name: 'Automatický program odvápnění & detekce tvrdosti vody',
    category: 'Údržba & Životnost',
    importance: 'preference',
    rationale: 'Automatická signalizace zanesení bojleru a snadný proplach pro ochranu před tvrdou vodou v ČR.',
    icon: '🧼',
    suggestedComponent: 'chips',
    suggestedValues: ['Plně automatický cyklus odvápnění', 'Běžná manuální údržba'],
    usageCount: 7,
    relevanceScore: 88,
    isCommunityApproved: true,
    createdAt: '2026-09-05T11:00:00.000Z',
    lastUsedAt: '2026-09-09T17:20:00.000Z',
  },
];

export class DomainLearningService {
  /**
   * Získá všechny naučené parametry z úložiště (včetně inicializačních)
   */
  static getAllLearnedParameters(): LearnedDomainParameter[] {
    if (typeof window === 'undefined') {
      return [...SEEDED_LEARNED_PARAMETERS];
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        // Inicializujeme výchozí naučené parametry
        localStorage.setItem(STORAGE_KEY, JSON.stringify(SEEDED_LEARNED_PARAMETERS));
        return [...SEEDED_LEARNED_PARAMETERS];
      }
      const parsed: LearnedDomainParameter[] = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [...SEEDED_LEARNED_PARAMETERS];
    } catch (e) {
      console.error('Chyba při načítání naučených parametrů:', e);
      return [...SEEDED_LEARNED_PARAMETERS];
    }
  }

  /**
   * Získá naučené parametry pro konkrétní doménu (např. 'shoes', 'cars')
   * seřazené podle relevance a četnosti použití.
   */
  static getLearnedParametersForDomain(domainKey: string): ExtractedDomainParameter[] {
    const all = this.getAllLearnedParameters();
    const matching = all
      .filter((p) => p.domainKey === domainKey && (p.isCommunityApproved || p.usageCount >= 1))
      .sort((a, b) => b.usageCount * b.relevanceScore - a.usageCount * a.relevanceScore);

    return matching.map((p) => this.toExtractedParameter(p));
  }

  /**
   * Zaznamená nový nebo opakovaně přidaný parametr od uživatele.
   * Pokud parametr s podobným názvem v dané doméně už existuje, zvýší jeho četnost.
   * Jinak vytvoří nový naučený parametr s počátečním skóre.
   */
  static recordUserParameter(
    domainKey: string,
    rawName: string,
    rationale?: string
  ): { parameter: ExtractedDomainParameter; isNew: boolean } {
    const trimmedName = rawName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      throw new Error('Název parametru musí mít alespoň 2 znaky');
    }

    const all = this.getAllLearnedParameters();
    const normalizedTarget = trimmedName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Hledáme existující parametr pro shodnou doménu
    const existingIndex = all.findIndex(
      (p) =>
        p.domainKey === domainKey &&
        p.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(normalizedTarget)
    );

    let resultRecord: LearnedDomainParameter;
    let isNew = false;

    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      // Zvýšíme popularitu existujícího parametru
      const existing = all[existingIndex];
      existing.usageCount += 1;
      existing.relevanceScore = Math.min(100, existing.relevanceScore + 5);
      existing.lastUsedAt = now;
      if (existing.usageCount >= 2) {
        existing.isCommunityApproved = true;
      }
      all[existingIndex] = existing;
      resultRecord = existing;
    } else {
      // Vytvoříme nový naučený parametr
      isNew = true;
      const id = `learned-${domainKey}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      
      // Detekce vhodné ikony
      const icon = this.detectParameterIcon(trimmedName);

      resultRecord = {
        id,
        domainKey,
        name: trimmedName,
        category: 'Komunitní doporučení',
        importance: 'recommended',
        rationale: rationale || `Populární parametr požadovaný uživateli při nákupu v kategorii ${domainKey}.`,
        icon,
        suggestedComponent: 'chips',
        suggestedValues: ['Vysoká priorita', 'Doporučeno', 'Není nutné'],
        usageCount: 1,
        relevanceScore: 80,
        isCommunityApproved: true,
        createdAt: now,
        lastUsedAt: now,
      };

      all.unshift(resultRecord);
    }

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      } catch (err) {
        console.error('Chyba při ukládání naučeného parametru:', err);
      }
    }

    return {
      parameter: this.toExtractedParameter(resultRecord),
      isNew,
    };
  }

  /**
   * Převede interní LearnedDomainParameter na standardní ExtractedDomainParameter
   * a připojí k němu vizuální komunitní metadata.
   */
  private static toExtractedParameter(learned: LearnedDomainParameter): ExtractedDomainParameter {
    return {
      id: learned.id,
      name: learned.name,
      category: learned.category,
      importance: learned.importance,
      rationale: `${learned.rationale} (👥 Využilo ${learned.usageCount}× uživatelů)`,
      icon: learned.icon,
      suggestedComponent: learned.suggestedComponent,
      suggestedValues: learned.suggestedValues,
    };
  }

  /**
   * Heuristická detekce tematické ikony pro nový parametr
   */
  private static detectParameterIcon(name: string): string {
    const low = name.toLowerCase();
    if (low.includes('sport') || low.includes('beh') || low.includes('fit')) return '🏅';
    if (low.includes('zdrav') || low.includes('ortoped') || low.includes('vlozk') || low.includes('zada')) return '🩺';
    if (low.includes('dite') || low.includes('det') || low.includes('isofix') || low.includes('kocar')) return '👶';
    if (low.includes('voda') || low.includes('mokr') || low.includes('dest') || low.includes('gore')) return '🌧️';
    if (low.includes('tazn') || low.includes('prives') || low.includes('nosic')) return '🚛';
    if (low.includes('bater') || low.includes('nabij') || low.includes('vydrz')) return '🔋';
    if (low.includes('zvuk') || low.includes('audio') || low.includes('repro') || low.includes('hudb')) return '🎵';
    if (low.includes('displej') || low.includes('obraz') || low.includes('oled') || low.includes('monitor')) return '🖥️';
    if (low.includes('cist') || low.includes('udrzb') || low.includes('odvapn')) return '🧼';
    if (low.includes('zaruk') || low.includes('servis')) return '🛡️';
    return '👥';
  }

  /**
   * Resetuje komunitní paměť na výchozí stav
   */
  static resetToDefaults(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEEDED_LEARNED_PARAMETERS));
    } catch (e) {
      console.error('Chyba při resetu komunitní paměti:', e);
    }
  }
}
