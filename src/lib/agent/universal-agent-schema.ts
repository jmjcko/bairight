/**
 * Universal Agent Schema & Portable Markdown Serializer
 * Implements PRD Section 6.1 (Dynamic Wizard Generation) & 6.3 (Agent Persistence in Portable Markdown/YAML)
 */

export type WizardComponentType = 'chips' | 'slider' | 'dropdown' | 'brands';

export interface WizardQuestionOption {
  label: string;
  value: string;
  description?: string;
  badge?: string;
}

export interface WizardSliderConfig {
  min: number;
  max: number;
  step: number;
  unit: string;
  defaultValue?: number;
}

export interface WizardQuestion {
  id: string;
  step: number;
  title: string;
  subtitle?: string;
  component: WizardComponentType;
  isMultiSelect?: boolean;
  options?: WizardQuestionOption[];
  sliderConfig?: WizardSliderConfig;
  defaultValue: any;
  /** Template for building the LLM prompt, e.g. "Požadavek na rozpočet: do {value} EUR." */
  promptForgeTemplate?: string;
}

export interface AgentVersionRecord {
  version: string;
  releasedAt: string;
  summary: string;
  changelog: string[];
}

export interface UniversalAgentDefinition {
  id: string;
  name: string;
  category: string;
  icon: string;
  version: string;
  description: string;
  systemPrompt: string;
  questions: WizardQuestion[];
  createdAt: string;
  updatedAt?: string;
  author?: string;
  isCustom?: boolean;
  isManaged?: boolean;
  versionsHistory?: AgentVersionRecord[];
  /** Full pool of parameters discovered by the Parameter Research Agent */
  researchedParametersPool?: any[];
  /** Subset of parameters selected by the user (including custom ones) */
  selectedParameters?: any[];
  /** Target values configured by the user in the wizard */
  targetValues?: Record<string, any>;
}

export interface UniversalRecommendationItem {
  id: string;
  brand: string;
  model: string;
  matchScore: number;
  reasoning: string;
  pros: string[];
  cons: string[];
  keySpecs?: Record<string, string | number>;
}

export interface UniversalEvaluationResult {
  agentId: string;
  agentName: string;
  category: string;
  evaluatedAt: string;
  summaryAssessment: string;
  recommendations: UniversalRecommendationItem[];
  contraindicationsOrCaveats: string[];
  providerUsed?: string;
  isLiveAI?: boolean;
  promptSent?: string;
}

/**
 * Serializes a UniversalAgentDefinition into a portable Markdown document with YAML frontmatter.
 */
export function serializeAgentToMarkdown(agent: UniversalAgentDefinition): string {
  const frontmatterObj = {
    id: agent.id,
    name: agent.name,
    category: agent.category,
    icon: agent.icon,
    version: agent.version,
    description: agent.description,
    createdAt: agent.createdAt,
    updatedAt: agent.updatedAt || new Date().toISOString(),
    isCustom: Boolean(agent.isCustom),
    researchedParametersPool: agent.researchedParametersPool,
    selectedParameters: agent.selectedParameters,
    targetValues: agent.targetValues,
    questions: agent.questions,
  };

  const yamlString = JSON.stringify(frontmatterObj, null, 2);

  return `---
${yamlString}
---

# System Prompt & Evaluation Directives

${agent.systemPrompt.trim()}
`.trim();
}

/**
 * Parses a UniversalAgentDefinition from a portable Markdown document with YAML/JSON frontmatter.
 */
export function parseAgentFromMarkdown(content: string): UniversalAgentDefinition {
  const match = content.match(/^---\s*([\s\S]*?)\s*---\s*([\s\S]*)$/);
  if (!match) {
    throw new Error('Invalid agent markdown format: Missing YAML frontmatter delimited by ---');
  }

  const rawHeader = match[1].trim();
  const systemPrompt = match[2].trim();

  let header: any;
  try {
    header = JSON.parse(rawHeader);
  } catch {
    // If not strict JSON, attempt key-value extraction for essential fields
    header = {
      id: rawHeader.match(/id:\s*"?(.*?)"?$/m)?.[1] || 'agent-custom',
      name: rawHeader.match(/name:\s*"?(.*?)"?$/m)?.[1] || 'Vlastní Nákupní Průvodce',
      category: rawHeader.match(/category:\s*"?(.*?)"?$/m)?.[1] || 'Všeobecné',
      icon: rawHeader.match(/icon:\s*"?(.*?)"?$/m)?.[1] || '✨',
      version: '1.0.0',
      description: 'Automaticky vygenerovaný nákupní agent',
      questions: [],
    };
  }

  return {
    id: header.id || `agent-${Date.now()}`,
    name: header.name || 'Nákupní Agent',
    category: header.category || 'Obecné',
    icon: header.icon || '🛍️',
    version: header.version || '1.0.0',
    description: header.description || '',
    systemPrompt: systemPrompt || 'Jsi specializovaný nákupní rádce. Pomoz uživateli vybrat nejvhodnější produkt.',
    questions: Array.isArray(header.questions) ? header.questions : [],
    createdAt: header.createdAt || new Date().toISOString(),
    updatedAt: header.updatedAt,
    author: header.author,
    isCustom: Boolean(header.isCustom),
    researchedParametersPool: header.researchedParametersPool,
    selectedParameters: header.selectedParameters,
    targetValues: header.targetValues,
  };
}

/**
 * Forges the structured prompt from the agent's questions and user's answers
 */
export function forgeAgentPrompt(
  agent: UniversalAgentDefinition,
  answers: Record<string, any>,
  ragFacts?: Array<{ fact: string; category: string }>
): string {
  const answeredBlocks: string[] = [];

  for (const q of agent.questions) {
    const val = answers[q.id];
    if (val !== undefined && val !== null && val !== '') {
      let formattedVal = val;
      if (typeof val === 'object' && val !== null && !Array.isArray(val) && ('preferred' in val || 'forbidden' in val)) {
        const pref = Array.isArray(val.preferred) ? val.preferred.join(', ') : (typeof val.preferred === 'string' ? val.preferred.trim() : '');
        const forb = Array.isArray(val.forbidden) ? val.forbidden.join(', ') : (typeof val.forbidden === 'string' ? val.forbidden.trim() : '');
        const prefText = pref ? `Preferované značky: [${pref}]` : 'Bez omezení značek (otevřený výběr)';
        const forbText = forb ? `Striktně zakázané značky (NIKDY nedoporučovat): [${forb}]` : 'Žádné zakázané značky';
        formattedVal = `${prefText}; ${forbText}`;
      } else if (Array.isArray(val)) {
        formattedVal = val.length > 0 ? val.join(', ') : 'Žádná specifická volba';
      }
      if (q.sliderConfig) {
        formattedVal = `${val} ${q.sliderConfig.unit}`;
      }

      if (q.promptForgeTemplate) {
        answeredBlocks.push(q.promptForgeTemplate.replace('{value}', String(formattedVal)));
      } else {
        answeredBlocks.push(`- **${q.title}:** ${formattedVal}`);
      }
    }
  }

  const ragSection = ragFacts && ragFacts.length > 0
    ? `\n### ZNALOSTNÍ HISTORIE & RAG FAKTA UŽIVATELE:\n${ragFacts.map((f) => `- [${f.category}] ${f.fact}`).join('\n')}\n`
    : '';

  return `
${agent.systemPrompt.trim()}

### ZADANÉ POŽADAVKY A PARAMETRY UŽIVATELE:
${answeredBlocks.join('\n')}
${ragSection}

### FORMÁT ODPOVĚDI:
Odpověz striktně ve validním formátu JSON bez markdownového obalu.
Vrať 3 nejvhodnější reálně dostupné modely na trhu odpovídající zadaným kritériím.
{
  "summaryAssessment": "Stručný přehled a odůvodnění výběru (2 odstavce v češtině).",
  "recommendations": [
    {
      "id": "model-slug-1",
      "brand": "Značka",
      "model": "Název přesného modelu",
      "matchScore": 95,
      "reasoning": "Konkrétní odůvodnění, proč tento model nejlépe odpovídá parametrům uživatele.",
      "pros": ["Hlavní přednost 1", "Hlavní přednost 2"],
      "cons": ["Potenciální kompromis či nevýhoda"]
    }
  ],
  "contraindicationsOrCaveats": [
    "Upozornění čemu se vyvarovat při nákupu"
  ]
}
`.trim();
}

/**
 * PRESET 1: Běžecká a ortopedická obuv (přeneseno z existujícího řešení)
 */
export const PRESET_SHOE_AGENT: UniversalAgentDefinition = {
  id: 'running_shoes',
  name: 'Běžecká & ortopedická obuv',
  category: 'Footwear & Orthotics',
  icon: '👟',
  version: '1.2.0',
  description: 'Biomechanika došlapu, ochrana kolene (artróza), anatomická šířka kopyta 2E a tlumení.',
  systemPrompt: `Jsi špičkový biomechanický podiatr a expert na běžeckou obuv.
Tvým úkolem je na základě parametrů chodidla, potíží s koleny a došlapu doporučit 3 nejlepší reálně existující modely běžeckých bot.
Dbej na to, aby modely měly dostatečnou šířku (2E Wide), odpovídající geometrii podrážky (rocker) a optimální drop.`,
  questions: [
    {
      id: 'foot_size',
      step: 1,
      title: 'Velikost obuvi (EU)',
      subtitle: 'Vyberte vaši běžnou velikost běžecké obuvi.',
      component: 'slider',
      sliderConfig: { min: 36, max: 49, step: 0.5, unit: 'EU', defaultValue: 43 },
      defaultValue: 43,
      promptForgeTemplate: '- **Velikost obuvi:** EU {value}',
    },
    {
      id: 'foot_width',
      step: 1,
      title: 'Šířka kopyta chodidla',
      subtitle: 'Máte širší chodidlo nebo potíže s otlaky malíčku a prstů?',
      component: 'chips',
      isMultiSelect: false,
      options: [
        { label: 'Standardní (D)', value: 'standard_d', description: 'Běžná šířka obuvi' },
        { label: 'Širší kopyto (2E)', value: 'wide_2e', description: 'Rozšířená špička a prostor pro prsty', badge: 'Doporučeno' },
        { label: 'Extra široké (4E)', value: 'extra_wide_4e', description: 'Maximální šířka pro vysoký nárt' },
      ],
      defaultValue: 'wide_2e',
      promptForgeTemplate: '- **Šířka chodidla:** {value}',
    },
    {
      id: 'strike_mechanics',
      step: 2,
      title: 'Došlap a biomechanika hlezna',
      subtitle: 'Kde nejčastěji dopadáte na zem a jak rotuje kotník?',
      component: 'chips',
      isMultiSelect: false,
      options: [
        { label: 'Došlap na patu (Heel)', value: 'heel_strike', description: 'Vyžaduje vyšší tlumení pod patou' },
        { label: 'Neutrální došlap', value: 'neutral', description: 'Rovnoměrné zatížení' },
        { label: 'Pronace (vbočení)', value: 'overpronation', description: 'Kotník propadá dovnitř' },
        { label: 'Supinace (vnější hrana)', value: 'supination', description: 'Tlak na vnější hranu chodidla' },
      ],
      defaultValue: 'heel_strike',
      promptForgeTemplate: '- **Mechanika došlapu:** {value}',
    },
    {
      id: 'knee_condition',
      step: 3,
      title: 'Stav kolenních kloubů a potíže',
      subtitle: 'Máte bolesti kolen nebo opotřebovanou chrupavku?',
      component: 'chips',
      isMultiSelect: true,
      options: [
        { label: 'Artróza kolene (1.–3. st.)', value: 'knee_osteoarthritis', description: 'Vyžaduje kolébkovou podešev (rocker) a drop 4–8 mm' },
        { label: 'Bolest čéšky (Běžecké koleno)', value: 'patellofemoral_pain', description: 'Menší nárazy při dopadu' },
        { label: 'Plantární fasciitis (pata)', value: 'plantar_fasciitis', description: 'Vysoká podpora klenby' },
        { label: 'Bez potíží', value: 'no_pain', description: 'Zdravé klouby' },
      ],
      defaultValue: ['knee_osteoarthritis'],
      promptForgeTemplate: '- **Kloubní a zdravotní specifika:** {value}',
    },
    {
      id: 'budget_eur',
      step: 4,
      title: 'Orientační rozpočet na pár obuvi',
      subtitle: 'Nastavte vaši cenovou hladinu.',
      component: 'slider',
      sliderConfig: { min: 100, max: 260, step: 10, unit: 'EUR', defaultValue: 180 },
      defaultValue: 180,
      promptForgeTemplate: '- **Rozpočet:** do {value}',
    },
  ],
  createdAt: '2026-09-10T10:00:00.000Z',
};

/**
 * PRESET 2: Ergonomické sezení & kancelářská židle
 */
export const PRESET_ERGO_CHAIR_AGENT: UniversalAgentDefinition = {
  id: 'ergo_seating',
  name: 'Ergonomické sezení & kancelář',
  category: 'Ergonomics & Spine',
  icon: '🪑',
  version: '1.0.0',
  description: 'Prevence bolestí bederní páteře, synchronní mechanika židle, nastavení sedáku pro celodenní práci.',
  systemPrompt: `Jsi certifikovaný ergonom a fyzioterapeut specializovaný na pracovní prostředí a sedací nábytek.
Tvým úkolem je doporučit 3 nejvhodnější ergonomické kancelářské židle, které reálně existují na trhu, podle tělesných proporcí a bolestí zad uživatele.
U každé židle popiš přesné anatomické odůvodnění a synchronní mechanismus.`,
  questions: [
    {
      id: 'daily_hours',
      step: 1,
      title: 'Denní doba strávená sezením',
      subtitle: 'Kolik hodin denně v průměru sedíte u počítače?',
      component: 'slider',
      sliderConfig: { min: 2, max: 14, step: 1, unit: 'hodin/den', defaultValue: 8 },
      defaultValue: 8,
      promptForgeTemplate: '- **Doba sezení:** {value}',
    },
    {
      id: 'spine_pain_areas',
      step: 2,
      title: 'Bolestivá místa a potíže zad',
      subtitle: 'Kde vás nejčastěji po práci bolí tělo?',
      component: 'chips',
      isMultiSelect: true,
      options: [
        { label: 'Bederní páteř (Lumbální)', value: 'lumbar_pain', description: 'Nutná stavitelná bederní opěrka' },
        { label: 'Krční páteř a šíje', value: 'cervical_pain', description: 'Nutná 3D hlavová opěrka' },
        { label: 'Bolest kostrče a sedacích hrbolů', value: 'coccyx_pressure', description: 'Požadavek na paměťovou pěnu nebo síťovaný sedák' },
        { label: 'Karpály a zápěstí', value: 'carpal_tunnel', description: '3D/4D nastavitelné područky' },
      ],
      defaultValue: ['lumbar_pain'],
      promptForgeTemplate: '- **Oblasti bolesti:** {value}',
    },
    {
      id: 'body_height_cm',
      step: 3,
      title: 'Tělesná výška uživatele (cm)',
      subtitle: 'Zásadní pro výšku opěradla a hloubku sedáku.',
      component: 'slider',
      sliderConfig: { min: 150, max: 205, step: 1, unit: 'cm', defaultValue: 180 },
      defaultValue: 180,
      promptForgeTemplate: '- **Výška postavy:** {value}',
    },
    {
      id: 'chair_budget',
      step: 4,
      title: 'Rozpočet na kancelářskou židli',
      subtitle: 'Kolik plánujete investovat do svého zdraví?',
      component: 'dropdown',
      options: [
        { label: 'Ekonomická třída (do 8 000 Kč / ~320 EUR)', value: 'budget_tier' },
        { label: 'Střední ergonomická (8 000 – 18 000 Kč / ~700 EUR)', value: 'mid_tier' },
        { label: 'Prémiová zdravotní (nad 18 000 Kč / např. Herman Miller, Steelcase)', value: 'premium_tier' },
      ],
      defaultValue: 'mid_tier',
      promptForgeTemplate: '- **Cenová kategorie:** {value}',
    },
  ],
  createdAt: '2026-09-11T09:00:00.000Z',
};

/**
 * PRESET 3: Domácí a kancelářské kávovary
 */
export const PRESET_COFFEE_AGENT: UniversalAgentDefinition = {
  id: 'coffee_machines',
  name: 'Kávovary & domácí espresso',
  category: 'Appliances & Coffee',
  icon: '☕',
  version: '1.0.0',
  description: 'Automatické i pákové kávovary podle vašich chuťových preferencí a náročnosti na údržbu.',
  systemPrompt: `Jsi profesionální barista a technolog kávovarů.
Doporuč 3 nejvhodnější kávovary dostupné na trhu přesně podle požadavků na rychlost přípravy, typ mléčné pěny a rozpočet.`,
  questions: [
    {
      id: 'coffee_preference',
      step: 1,
      title: 'Jakou kávu nejraději pijete?',
      subtitle: 'Zvolte vaše primární kávové nápoje.',
      component: 'chips',
      isMultiSelect: true,
      options: [
        { label: 'Espresso & Ristretto (čistá černá)', value: 'espresso' },
        { label: 'Cappuccino & Latte (mléčné nápoje)', value: 'milk_drinks' },
        { label: 'Americano / Velká káva', value: 'lungo_americano' },
      ],
      defaultValue: ['milk_drinks'],
      promptForgeTemplate: '- **Preferovaný typ kávy:** {value}',
    },
    {
      id: 'machine_type',
      step: 2,
      title: 'Míra automatizace vs. barista rituál',
      subtitle: 'Chcete jedno tlačítko nebo si hrát s mletím a pákou?',
      component: 'chips',
      isMultiSelect: false,
      options: [
        { label: 'Plnoautomat (stisk jednoho tlačítka)', value: 'automatic_bean_to_cup', description: 'Integrovaný mlýnek, minimum práce' },
        { label: 'Pákový kávovar (manuální příprava)', value: 'manual_portafilter', description: 'Skutečný rituál a maximální chuť' },
        { label: 'Kapslový systém (maximální rychlost)', value: 'capsule_machine', description: 'Zero údržba, rychlá káva' },
      ],
      defaultValue: 'automatic_bean_to_cup',
      promptForgeTemplate: '- **Typ kávovaru:** {value}',
    },
    {
      id: 'daily_cups',
      step: 3,
      title: 'Počet šálků kávy denně',
      subtitle: 'Kolik káv se denně v domácnosti / kanceláři vypije?',
      component: 'slider',
      sliderConfig: { min: 1, max: 20, step: 1, unit: 'šálků', defaultValue: 3 },
      defaultValue: 3,
      promptForgeTemplate: '- **Kapacita:** {value} šálků/den',
    },
    {
      id: 'coffee_budget_eur',
      step: 4,
      title: 'Rozpočet na kávovar',
      subtitle: 'Orientační limit v EUR.',
      component: 'slider',
      sliderConfig: { min: 100, max: 1500, step: 50, unit: 'EUR', defaultValue: 600 },
      defaultValue: 600,
      promptForgeTemplate: '- **Rozpočet na kávovar:** do {value}',
    },
  ],
  createdAt: '2026-09-11T09:00:00.000Z',
};

export const INITIAL_UNIVERSAL_AGENTS: UniversalAgentDefinition[] = [];
