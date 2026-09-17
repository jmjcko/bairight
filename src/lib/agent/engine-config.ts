export type AIProviderId = "google_gemini" | "openai_gpt4o" | "anthropic_claude";

export interface AIProviderConfig {
  id: AIProviderId;
  name: string;
  modelName: string;
  provider: "Google AI" | "OpenAI" | "Anthropic";
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
    id: "google_gemini",
    name: "Google Gemini 3.6 Flash / Pro",
    modelName: "gemini-3.6-flash",
    provider: "Google AI",
    tag: "100% Zdarma (AI Studio)",
    description: "Bleskový reasoning s 2M tokenovou pamětí. V Google AI Studio si můžete za 30 sekund vygenerovat bezplatný klíč.",
    contextWindow: "2M tokenů",
    badgeColor: "border-sky-500/40 text-sky-300 bg-sky-950/40",
    isFreemium: true,
    requiresKey: true,
    apiKeyHelpUrl: "https://aistudio.google.com/app/apikey",
    placeholderKey: "AIzaSy...",
  },
  {
    id: "openai_gpt4o",
    name: "OpenAI GPT-4o / o3-mini",
    modelName: "gpt-4o",
    provider: "OpenAI",
    tag: "Univerzální standard",
    description: "Výkonný multimodální model od OpenAI pro detailní diskuze a hledání alternativ přes váš OpenAI účet.",
    contextWindow: "128k tokenů",
    badgeColor: "border-teal-500/40 text-teal-300 bg-teal-950/40",
    isFreemium: false,
    requiresKey: true,
    apiKeyHelpUrl: "https://platform.openai.com/api-keys",
    placeholderKey: "sk-proj-...",
  },
  {
    id: "anthropic_claude",
    name: "Claude 3.5 Sonnet / 3.7",
    modelName: "claude-3-5-sonnet-20241022",
    provider: "Anthropic",
    tag: "Hluboký reasoning",
    description: "Vlajkový model pro hluboký klinický a technický reasoning, analýzu biomechanických vazeb a komparaci.",
    contextWindow: "200k tokenů",
    badgeColor: "border-purple-500/40 text-purple-300 bg-purple-950/40",
    isFreemium: false,
    requiresKey: true,
    apiKeyHelpUrl: "https://console.anthropic.com/settings/keys",
    placeholderKey: "sk-ant-api03-...",
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
    icon: "👟",
    agentName: "Podiatrický Agent",
    agentVersion: "v1.1",
    status: "active",
    description: "Biomechanika došlapu, ochrana kolene (OA 3), anatomická šířka 2E a drop 4–8 mm.",
  },
  {
    id: "ergo_seating",
    name: "Ergonomické sezení & kancelář",
    category: "Ergonomics & Spine",
    icon: "🪑",
    agentName: "Ergonomický Poradce",
    agentVersion: "v0.9",
    status: "preset",
    description: "Prevence bolestí beder, nastavení synchronní mechaniky židle a výšky monitoru k tělu.",
  },
  {
    id: "gravel_bikes",
    name: "Gravel & silniční kola (Bike-fit)",
    category: "Cycling & Fit",
    icon: "🚲",
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
