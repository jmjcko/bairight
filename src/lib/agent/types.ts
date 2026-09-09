export type FootWidth = 'standard_d' | 'wide_2e' | 'extra_wide_4e' | 'narrow_b';

export type StrikeType = 
  | 'supination'
  | 'neutral'
  | 'mild_overpronation'
  | 'severe_overpronation'
  | 'heel_strike'
  | 'midfoot_strike';

export type KneeCondition = 
  | 'none'
  | 'patellar_tendinopathy'
  | 'meniscus_tear'
  | 'osteoarthritis_grade_1'
  | 'osteoarthritis_grade_2'
  | 'osteoarthritis_grade_3';

export interface BiomechanicalProfile {
  weight_kg: number | null;
  foot_width: FootWidth | null;
  strike_type: StrikeType | null;
  past_injuries: string[];
  injuries_acknowledged?: boolean;
  knee_condition: KneeCondition | null;
  activity_type: 'road_running' | 'trail' | 'walking' | 'hybrid';
  notes?: string;
}

export type AgentState = 
  | 'INITIAL_GREETING'
  | 'COLLECTING_BIOMECHANICS'
  | 'READY_FOR_RECOMMENDATIONS'
  | 'SEARCHING_FORUMS'
  | 'SCANNING_ESHOPS'
  | 'RECOMMENDATIONS_DELIVERED';

export interface MandatoryCheckResult {
  isReady: boolean;
  missingFields: (keyof BiomechanicalProfile)[];
  presentFields: (keyof BiomechanicalProfile)[];
  state: AgentState;
  guidanceForPrompt: string;
}

export interface ShoeRecommendation {
  id: string;
  brand: string;
  model: string;
  category: 'Running' | 'Walking' | 'Recovery';
  image_url: string;
  cushion_level: 'Maximum' | 'Plush' | 'High';
  heel_drop_mm: number;
  weight_g: number;
  available_widths: string[]; // e.g. ['Standard (D)', 'Wide (2E)']
  is_2e_available: boolean;
  european_price_eur: number;
  retailer_name: string;
  retailer_url: string;
  stock_status: 'In Stock' | 'Limited Stock';
  medical_rationale: string;
  knee_oa_rating: 'Optimal' | 'Good';
  rocker_geometry: boolean;
}

export interface ForumFinding {
  source: 'Reddit r/RunningShoeGeeks' | 'RunRepeat' | 'Slowtwitch Medical' | 'DoctorOfRunning';
  title: string;
  author: string;
  quote: string;
  url: string;
  relevance: string;
}

export interface AgentChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: string;
  toolCalls?: {
    id: string;
    toolName: string;
    status: 'running' | 'completed' | 'failed';
    args?: Record<string, unknown>;
    result?: unknown;
  }[];
  recommendations?: ShoeRecommendation[];
}
