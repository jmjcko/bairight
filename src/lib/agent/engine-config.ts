export type AIProviderId = "google_gemini" | "openai_gpt4o" | "anthropic_claude";

export interface AIProviderConfig {
  id: AIProviderId;
  name: string;
  modelName: string;
  freeTierModel?: string;
  freeTierModelEn?: string;
  provider: "Google AI" | "OpenAI" | "Anthropic";
  tag: string;
  tagEn: string;
  description: string;
  descriptionEn: string;
  contextWindow: string;
  contextWindowEn: string;
  badgeColor: string;
  isFreemium: boolean;
  requiresKey: boolean;
  apiKeyHelpUrl?: string;
  placeholderKey?: string;
}

export const SUPPORTED_AI_PROVIDERS: AIProviderConfig[] = [
  {
    id: "google_gemini",
    name: "Google Gemini",
    modelName: "gemini-2.5-flash",
    freeTierModel: "gemini-2.5-flash (Free)",
    freeTierModelEn: "gemini-2.5-flash (Free)",
    provider: "Google AI",
    tag: "100% Zdarma (AI Studio)",
    tagEn: "100% Free (AI Studio)",
    description: "Bleskový reasoning na stabilním bezplatném tieru Google AI Studio (15 RPM / 1 500 RPD) s modelem Gemini 2.5 Flash.",
    descriptionEn: "Lightning-fast reasoning on the stable Google AI Studio free tier (15 RPM / 1,500 RPD) with Gemini 2.5 Flash.",
    contextWindow: "1M tokenů",
    contextWindowEn: "1M tokens",
    badgeColor: "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/60",
    isFreemium: true,
    requiresKey: true,
    apiKeyHelpUrl: "https://aistudio.google.com/app/apikey",
    placeholderKey: "AIzaSy...",
  },
  {
    id: "openai_gpt4o",
    name: "OpenAI ChatGPT",
    modelName: "gpt-4o",
    freeTierModel: "gpt-4o-mini (Free / Trial)",
    freeTierModelEn: "gpt-4o-mini (Free / Trial)",
    provider: "OpenAI",
    tag: "Univerzální standard",
    tagEn: "Universal Standard",
    description: "Výkonný multimodální model od OpenAI s automatickým přechodem na úsporný GPT-4o-mini pro bezplatné a zkušební účty.",
    descriptionEn: "High-performance multimodal model from OpenAI with automated failover to cost-effective GPT-4o-mini for free and trial accounts.",
    contextWindow: "128k tokenů",
    contextWindowEn: "128k tokens",
    badgeColor: "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/60",
    isFreemium: false,
    requiresKey: true,
    apiKeyHelpUrl: "https://platform.openai.com/api-keys",
    placeholderKey: "sk-proj-...",
  },
  {
    id: "anthropic_claude",
    name: "Anthropic Claude",
    modelName: "claude-sonnet-5-5",
    freeTierModel: "claude-3-5-haiku (Úsporný)",
    freeTierModelEn: "claude-3-5-haiku (Low-cost)",
    provider: "Anthropic",
    tag: "Hluboký reasoning",
    tagEn: "Deep Reasoning",
    description: "Vlajkový model pro hluboký klinický a technický reasoning s automatickým fallbackem na úsporný Claude 3.5 Haiku.",
    descriptionEn: "Flagship model for deep clinical and engineering reasoning with automated fallback to cost-effective Claude 3.5 Haiku.",
    contextWindow: "200k tokenů",
    contextWindowEn: "200k tokens",
    badgeColor: "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/60",
    isFreemium: false,
    requiresKey: true,
    apiKeyHelpUrl: "https://console.anthropic.com/settings/keys",
    placeholderKey: "sk-ant-api03-... nebo sk-ant-usr-...:wrkspc_id",
  },
];

export interface ShoppingMission {
  id: string;
  name: string;
  category: string;
  icon: string;
  agentName: string;
  agentVersion: string;
  status: "active" | "preset" | "custom";
  description: string;
}

export const INITIAL_MISSIONS: ShoppingMission[] = [
  {
    id: "running_shoes",
    name: "Běžecká & ortopedická obuv",
    category: "Footwear & Orthotics",
    icon: "",
    agentName: "Podiatrický Agent",
    agentVersion: "v1.1",
    status: "active",
    description: "Biomechanika došlapu, ochrana kolene (OA 3), anatomická šířka 2E a drop 4–8 mm.",
  },
  {
    id: "ergo_seating",
    name: "Ergonomické sezení & kancelář",
    category: "Ergonomics & Spine",
    icon: "",
    agentName: "Ergonomický Poradce",
    agentVersion: "v0.9",
    status: "preset",
    description: "Prevence bolestí beder, nastavení synchronní mechaniky židle a výšky monitoru k tělu.",
  },
  {
    id: "gravel_bikes",
    name: "Gravel & silniční kola (Bike-fit)",
    category: "Cycling & Fit",
    icon: "",
    agentName: "Bike-Fit Expert",
    agentVersion: "v0.8",
    status: "preset",
    description: "Výpočet geometrie rámu (Reach/Stack), sklon sedla a prevence necitlivosti rukou a kolen.",
  },
];

export interface PersistentMemoryFact {
  id: string;
  category: "biometrics" | "medical" | "preference" | "history";
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
  status: "active_prescription" | "archived";
  completedPrompt?: string;
}

export const INITIAL_ASSESSMENT_RECORDS: CompletedAssessmentRecord[] = [];


export function formatValueDisplay(val: any): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (Array.isArray(val)) return val.map(formatValueDisplay).filter(Boolean).join(', ');
  if (typeof val === 'object') {
    if ('preferred' in val || 'forbidden' in val) {
      const parts: string[] = [];
      if (val.preferred) parts.push(`Preferuji: ${val.preferred}`);
      if (val.forbidden) parts.push(`Zakázáno: ${val.forbidden}`);
      return parts.length > 0 ? parts.join(' | ') : 'Otevřený výběr ze všech značek';
    }
    try {
      return JSON.stringify(val);
    } catch {
      return String(val);
    }
  }
  return String(val);
}
