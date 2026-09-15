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
    modelName: 'Gemini 3.6 Flash (Managed)',
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
    name: 'Google Gemini 3.6 Flash / Pro',
    modelName: 'gemini-3.6-flash',
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

export const INITIAL_USER_FACTS: PersistentMemoryFact[] = [];

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

export const INITIAL_ASSESSMENT_RECORDS: CompletedAssessmentRecord[] = [];


