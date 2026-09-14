export type AIProviderId = 'bairight_core' | 'anthropic_claude' | 'google_gemini' | 'openai_gpt4o';

export interface AIProviderConfig {
  id: AIProviderId;
  name: string;
  modelName: string;
  provider: 'bAIright Managed' | 'Anthropic' | 'Google AI' | 'OpenAI';
  tag: string;
  description: string;
  contextWindow: string;
  badgeColor: string;
  isFreemium: boolean;
  requiresKey: boolean;
  apiKeyHelpUrl?: string;
  placeholderKey?: string;
}

export const SUPPORTED_AI_PROVIDERS: AIProviderConfig[] = [
  {
    id: 'bairight_core',
    name: 'bAIright Core Engine',
    modelName: 'Gemini 2.0 Flash (Managed)',
    provider: 'bAIright Managed',
    tag: 'Freemium Demo',
    description: 'Optimalizovaný základní model pro okamžité demo. Běží na náš účet s limitem 3 bezplatných vyhodnocení.',
    contextWindow: '1M tokenů',
    badgeColor: 'border-cyan-500/30 text-cyan-300 bg-cyan-950/40',
    isFreemium: true,
    requiresKey: false,
  },
  {
    id: 'anthropic_claude',
    name: 'Claude 3.5 Sonnet / 3.7',
    modelName: 'claude-3-5-sonnet-20241022',
    provider: 'Anthropic',
    tag: 'Doporučeno pro medicínu',
    description: 'Vlajkový model pro hluboký klinický reasoning, detailní analýzu biomechanických vazeb a nuance v textech.',
    contextWindow: '200k tokenů',
    badgeColor: 'border-purple-500/40 text-purple-300 bg-purple-950/40',
    isFreemium: false,
    requiresKey: true,
    apiKeyHelpUrl: 'https://console.anthropic.com/settings/keys',
    placeholderKey: 'sk-ant-api03-...',
  },
  {
    id: 'google_gemini',
    name: 'Google Gemini 2.0 Flash / Pro',
    modelName: 'gemini-2.0-flash-exp',
    provider: 'Google AI',
    tag: 'Blesková rychlost & Obří paměť',
    description: 'Extrémně rychlý reasoning s obří kontextovou pamětí. V Google AI Studio je k dispozici velkorysý tier zdarma.',
    contextWindow: '2M tokenů',
    badgeColor: 'border-sky-500/40 text-sky-300 bg-sky-950/40',
    isFreemium: false,
    requiresKey: true,
    apiKeyHelpUrl: 'https://aistudio.google.com/app/apikey',
    placeholderKey: 'AIzaSy...',
  },
  {
    id: 'openai_gpt4o',
    name: 'OpenAI GPT-4o / o3-mini',
    modelName: 'gpt-4o',
    provider: 'OpenAI',
    tag: 'Univerzální standard',
    description: 'Výkonný multimodální model od OpenAI. Perfektní porozumění parametrům a rychlé hledání alternativ.',
    contextWindow: '128k tokenů',
    badgeColor: 'border-teal-500/40 text-teal-300 bg-teal-950/40',
    isFreemium: false,
    requiresKey: true,
    apiKeyHelpUrl: 'https://platform.openai.com/api-keys',
    placeholderKey: 'sk-proj-...',
  },
];

export interface ShoppingMission {
  id: string;
  name: string;
  category: string;
  icon: string;
  agentName: string;
  agentVersion: string;
  status: 'active' | 'preset' | 'custom';
  description: string;
}

export const INITIAL_MISSIONS: ShoppingMission[] = [
  {
    id: 'running_shoes',
    name: 'Běžecká & ortopedická obuv',
    category: 'Footwear & Orthotics',
    icon: '👟',
    agentName: 'Podiatrický Agent',
    agentVersion: 'v1.1',
    status: 'active',
    description: 'Biomechanika došlapu, ochrana kolene (OA 3), anatomická šířka 2E a drop 4–8 mm.',
  },
  {
    id: 'ergo_seating',
    name: 'Ergonomické sezení & kancelář',
    category: 'Ergonomics & Spine',
    icon: '🪑',
    agentName: 'Ergonomický Poradce',
    agentVersion: 'v0.9',
    status: 'preset',
    description: 'Prevence bolestí beder, nastavení synchronní mechaniky židle a výšky monitoru k tělu.',
  },
  {
    id: 'gravel_bikes',
    name: 'Gravel & silniční kola (Bike-fit)',
    category: 'Cycling & Fit',
    icon: '🚲',
    agentName: 'Bike-Fit Expert',
    agentVersion: 'v0.8',
    status: 'preset',
    description: 'Výpočet geometrie rámu (Reach/Stack), sklon sedla a prevence necitlivosti rukou a kolen.',
  },
];

export interface PersistentMemoryFact {
  id: string;
  category: 'biometrics' | 'medical' | 'preference' | 'history';
  label: string;
  value: string;
  source: string;
  updatedAt: string;
  isEnriched: boolean;
}

export const INITIAL_USER_FACTS: PersistentMemoryFact[] = [
  {
    id: 'fact-1',
    category: 'preference',
    label: 'Záruční servis v ČR',
    value: 'Požadavek na dostupnost autorizovaného servisu a náhradních dílů v České republice',
    source: 'Uživatelská volba',
    updatedAt: '11. 9. 2026 10:00',
    isEnriched: true,
  },
  {
    id: 'fact-2',
    category: 'biometrics',
    label: 'Ergonomie zad & sezení',
    value: 'Bolesti bederní páteře při sezení nad 6 hodin (doporučena aktivní bederní opora a synchronní mechanika)',
    source: 'Ergonomický dotazník',
    updatedAt: '11. 9. 2026 10:15',
    isEnriched: true,
  },
  {
    id: 'fact-3',
    category: 'preference',
    label: 'Poměr cena / výkon',
    value: 'Preference zlatého středu a spolehlivosti před ryze předraženými luxusními značkami',
    source: 'Nákupní profil',
    updatedAt: '11. 9. 2026 11:30',
    isEnriched: true,
  },
  {
    id: 'fact-4',
    category: 'biometrics',
    label: 'Anatomie chodidla (pro obuv)',
    value: 'Širší chodidlo (vyžaduje prostornější anatomický toe-box či šířku 2E)',
    source: 'Profil obuvi',
    updatedAt: '11. 9. 2026 12:00',
    isEnriched: true,
  },
];

export interface CompletedAssessmentRecord {
  id: string;
  missionId: string;
  missionName: string;
  dateFormatted: string;
  timestamp: string;
  doctorAgentName: string;
  diagnosisSummary: string;
  keyParameters: {
    weight?: string;
    width?: string;
    knee?: string;
    strike?: string;
    dropLimit?: string;
    [key: string]: string | undefined;
  };
  recommendedModels: {
    id: string;
    brand: string;
    model: string;
    badge: string;
    matchScore: number;
    priceCzk: number;
    rationale: string;
  }[];
  clinicalReport: string;
  status: 'active_prescription' | 'archived';
  completedPrompt?: string;
}

export const INITIAL_ASSESSMENT_RECORDS: CompletedAssessmentRecord[] = [
  {
    id: 'assessment-rec-1',
    missionId: 'running_shoes',
    missionName: 'Běžecká & ortopedická obuv',
    dateFormatted: '10. 9. 2026, 14:15',
    timestamp: '2026-09-10T14:15:00.000Z',
    doctorAgentName: 'Biomechanický Fitting Agent v1.1',
    diagnosisSummary: 'Citlivost levého kolenního kloubu + Široké metatarzy (Kopyto 2E)',
    keyParameters: {
      weight: '86 kg',
      width: '104 mm (Kopyto 2E Wide)',
      knee: 'Citlivost kolene / Artróza',
      strike: 'Supinace / Vnější hrana',
      dropLimit: '4–8 mm (kolébková geometrie)',
    },
    recommendedModels: [
      {
        id: 'asics-gel-kayano-30',
        brand: 'ASICS',
        model: 'Gel-Kayano 30 (2E Wide Last)',
        badge: 'Hlavní doporučení',
        matchScore: 98,
        priceCzk: 4530,
        rationale: 'Pěna FF BLAST™ PLUS a 4D GUIDANCE SYSTEM™ poskytují adaptivní absorpci nárazů pro odlehčení zátěže kolene.',
      },
      {
        id: 'brooks-adrenaline-gts-23',
        brand: 'Brooks',
        model: 'Adrenaline GTS 23 (2E Wide)',
        badge: 'Vhodné pro supinaci',
        matchScore: 96,
        priceCzk: 3779,
        rationale: 'GuideRails® fixují laterální deviaci bez vnitřního pronačního klínu, což odlehčuje kloubní štěrbinu.',
      },
      {
        id: 'hoka-bondi-8-wide',
        brand: 'Hoka',
        model: 'Bondi 8 Wide (2E Kopyto)',
        badge: 'Maximální tlumení',
        matchScore: 94,
        priceCzk: 4280,
        rationale: 'Masivní rocker mezipodešev s nízkým dropem 4 mm eliminuje rázy při došlapu na patu.',
      },
    ],
    clinicalReport: 'Biomechanické vyhodnocení: U běžce se zvýšenou citlivostí kolene a hmotností 86 kg je doporučeno vyhnout se standardní úzké šířce D (riziko otlačení metatarzů) a botám s vysokým dropem nad 10 mm bez kolébkové geometrie. Vybrány modely splňující specifikaci 2E Last s biomechanickým odlehčením.',
    status: 'active_prescription',
    completedPrompt: `Jsi přední biomechanický expert a klinický nákupčí obuvi v systému bAIright.
Analyzuj následující biomechanická data uživatele po dokončení fitting dotazníku:
- Velikost nohy: EU 43 (275 mm)
- Anatomická šířka: 2E Wide (104 mm)
- Hmotnost: 86 kg
- Došlap: Supinace / Vnější hrana
- Zdravotní specifika: Citlivost kolenního kloubu (Artróza 3. st.)
- Požadované tlumení: Maximální (kolébka rocker)
- Povolení výrobci: ASICS, Brooks, Hoka`,
  },
];

