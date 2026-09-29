/**
 * Universal Agent Schema & Portable Markdown Serializer
 * Implements PRD Section 6.1 (Dynamic Wizard Generation) & 6.3 (Agent Persistence in Portable Markdown/YAML)
 */

export type WizardComponentType = 'chips' | 'slider' | 'dropdown' | 'brands' | 'text';

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
export function getHumanReadableOptionLabel(q: WizardQuestion, val: any, locale: string = 'cs'): string {
  if (val === undefined || val === null || val === '') return '';
  const isEn = locale === 'en';

  const resolveSingle = (v: any): string => {
    if (typeof v !== 'string') return String(v);
    if (isEn) {
      if (v === 'vysok_priorita' || v === 'Vysoká priorita') return 'High Priority';
      if (v === 'doporu_eno' || v === 'Doporučeno') return 'Recommended';
      if (v === 'nen_nutn' || v === 'Není nutné') return 'Optional';
    }
    if (q.options && q.options.length > 0) {
      const targetClean = v.replace(/_/g, ' ').toLowerCase();
      const found = q.options.find(
        (opt) => opt.value === v || opt.label.toLowerCase() === v.toLowerCase() || opt.value.replace(/_/g, ' ').toLowerCase() === targetClean
      );
      if (found) {
        let label = found.label;
        if (isEn) {
          if (label === 'Vysoká priorita') label = 'High Priority';
          if (label === 'Doporučeno') label = 'Recommended';
          if (label === 'Není nutné') label = 'Optional';
        }
        const cleanLabel = label.replace(/_/g, ' ');
        const cleanDesc = found.description ? found.description.replace(/_/g, ' ') : '';
        return cleanDesc ? `${cleanLabel} (${cleanDesc})` : cleanLabel;
      }
    }

    return v.replace(/_/g, ' ');
  };

  if (Array.isArray(val)) {
    return val.map(resolveSingle).filter(Boolean).join(', ');
  }

  return resolveSingle(val);
}

/**
 * Serializes a UniversalAgentDefinition into a portable Markdown document with YAML frontmatter.
 */
export function serializeAgentToMarkdown(
  agent: UniversalAgentDefinition,
  answers?: Record<string, any>,
  locale: string = 'cs'
): string {
  const frontmatterObj: Record<string, any> = {
    id: agent.id,
    name: agent.name,
    category: agent.category,
    icon: agent.icon,
    version: agent.version,
    description: agent.description,
    createdAt: agent.createdAt,
    updatedAt: agent.updatedAt || new Date().toISOString(),
    isCustom: Boolean(agent.isCustom),
  };

  const yamlString = JSON.stringify(frontmatterObj, null, 2);
  const effectiveAnswers = answers && Object.keys(answers).length > 0 ? answers : (agent.targetValues || {});
  const executablePrompt = forgeAgentPrompt(agent, effectiveAnswers, [], locale);

  return `---
${yamlString}
---

# System Prompt & Evaluation Directives

${executablePrompt}
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
      icon: rawHeader.match(/icon:\s*"?(.*?)"?$/m)?.[1] || '',
      version: '1.0.0',
      description: 'Automaticky vygenerovaný nákupní agent',
      questions: [],
    };
  }

  return {
    id: header.id || `agent-${Date.now()}`,
    name: header.name || 'Nákupní Agent',
    category: header.category || 'Obecné',
    icon: header.icon || '',
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
  ragFacts?: Array<{ fact: string; category: string }>,
  locale: string = 'cs'
): string {
  const isEn = locale === 'en';
  const answeredBlocks: string[] = [];

  const rawSystemPrompt = (agent.systemPrompt || '').trim();
  const rawBaseSystemPrompt = rawSystemPrompt
    .split(/### (?:User Specified & Tuned Parameters|Uživatelsky specifikované a vytuněné parametry|MANDATORY & BINDING USER REQUIREMENTS|STRIKTNÍ A ZÁVAZNÉ POŽADAVKY UŽIVATELE)/)[0]
    .trim();
  const baseSystemPrompt = rawBaseSystemPrompt
    .replace(/(?:RESPONSE FORMATTING MANDATE|MANDÁT FORMÁTOVÁNÍ ODPOVĚDI)[\s\S]*?(?=(?:###|$))/gi, '')
    .replace(/###\s*\d+\.\s*\[(?:Full Model Name|Přesný název modelu)[\s\S]*?(?=(?:###|$))/gi, '')
    .trim();

  // Helper: convert snake_case to Title Case (e.g. "road_running" -> "Road Running")
  const toTitleCase = (s: string): string =>
    s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  // Helper: translate skip values to locale-appropriate text
  // Handles both the internal __SKIP__ marker and legacy hardcoded Czech skip values
  const translateSkipValue = (v: string): string => {
    if (v === '__SKIP__') {
      return isEn ? 'Not important / No preference' : 'Není důležité';
    }
    const skipPatterns = ['není důležité', 'neni dulezite', 'nevím', 'přeskočit'];
    const normalized = v.toLowerCase().trim();
    if (skipPatterns.some((p) => normalized.includes(p))) {
      return isEn ? 'Not important / No preference' : 'Není důležité';
    }
    return v;
  };

  for (const q of agent.questions) {
    const val = answers[q.id];
    if (val !== undefined && val !== null && val !== '') {
      let formattedVal = val;
      if (typeof val === 'object' && val !== null && !Array.isArray(val) && ('preferred' in val || 'forbidden' in val)) {
        const pref = Array.isArray(val.preferred) ? val.preferred.join(', ') : (typeof val.preferred === 'string' ? val.preferred.trim() : '');
        const forb = Array.isArray(val.forbidden) ? val.forbidden.join(', ') : (typeof val.forbidden === 'string' ? val.forbidden.trim() : '');
        const prefText = pref 
          ? (isEn ? `Preferred Brands: [${pref}]` : `Preferované značky: [${pref}]`) 
          : (isEn ? 'No brand restrictions (Open selection)' : 'Bez omezení značek (otevřený výběr)');
        const forbText = forb 
          ? (isEn ? `Strictly Forbidden Brands (NEVER recommend): [${forb}]` : `Striktně zakázané značky (NIKDY nedoporučovat): [${forb}]`) 
          : (isEn ? 'No forbidden brands' : 'Žádné zakázané značky');
        formattedVal = `${prefText}; ${forbText}`;
      } else if (typeof val === 'string') {
        // 1) Check for hardcoded Czech skip values first
        formattedVal = translateSkipValue(val);
        // 2) Resolve label from options if available
        if (q.options) {
          const matchedOpt = q.options.find((o) => o.value === val);
          if (matchedOpt && matchedOpt.label) {
            formattedVal = translateSkipValue(matchedOpt.label);
          } else if (formattedVal === val) {
            // No option match and not a skip value — convert snake_case to Title Case
            formattedVal = toTitleCase(val);
          }
        } else if (formattedVal === val && val.includes('_')) {
          // No options array at all — convert snake_case to Title Case
          formattedVal = toTitleCase(val);
        }
      } else if (Array.isArray(val)) {
        const resolveItem = (v: any): string => {
          const s = String(v);
          // Check for skip values first
          const translated = translateSkipValue(s);
          if (translated !== s) return translated;
          // Try to resolve label from question options
          if (q.options) {
            const opt = q.options.find((o) => o.value === s);
            if (opt?.label) return translateSkipValue(opt.label);
          }
          // Fallback: convert snake_case to Title Case
          return toTitleCase(s);
        };
        formattedVal = val.length > 0 
          ? val.map(resolveItem).join(', ') 
          : (isEn ? 'No specific choice' : 'Žádná specifická volba');
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

  // Support dynamically added custom parameters (e.g. Budget/Price cap, extra constraints)
  if (answers.customParameters && Array.isArray(answers.customParameters)) {
    for (const cp of answers.customParameters) {
      if (cp && cp.name && cp.value) {
        answeredBlocks.push(`- **${cp.name}:** ${cp.value}`);
      }
    }
  }

  if (answers.baselineModel || answers.baselineLikes || answers.baselineDislikes) {
    const modelText = answers.baselineModel ? String(answers.baselineModel).trim() : (isEn ? 'Not specified' : 'Nespecifikováno');
    const likesText = answers.baselineLikes ? String(answers.baselineLikes).trim() : (isEn ? 'None specified' : 'Žádné nespecifikovány');
    const dislikesText = answers.baselineDislikes ? String(answers.baselineDislikes).trim() : (isEn ? 'None specified' : 'Žádné nespecifikovány');

    if (isEn) {
      answeredBlocks.push(`- **User's Current Baseline Product & Experience:**`);
      answeredBlocks.push(`  - **Current Model Owned:** ${modelText}`);
      answeredBlocks.push(`  - **Features Liked (Must Retain):** ${likesText}`);
      answeredBlocks.push(`  - **Pain Points & Frustrations (Must Improve/Fix):** ${dislikesText}`);
      answeredBlocks.push(`  - **DIRECTIVE:** In your top 3 recommendations, explicitly contrast each recommended model against their current baseline (${modelText}) and explain how it solves their specified pain points while preserving what they liked.`);
    } else {
      answeredBlocks.push(`- **Stávající produkt a zkušenost uživatele:**`);
      answeredBlocks.push(`  - **Dosud používaný model:** ${modelText}`);
      answeredBlocks.push(`  - **Co vyhovuje (zachovat):** ${likesText}`);
      answeredBlocks.push(`  - **Co vadí / nefunkční (zlepšit/vyřešit):** ${dislikesText}`);
      answeredBlocks.push(`  - **ZÁVAZNÁ INSTRUKCE:** Ve svých top 3 doporučeních explicitně porovnej každý doporučený model se stávajícím produktem (${modelText}) a vysvětli, jak nový model řeší a odstraňuje dosavadní nedostatky a zachovává vyhovující vlastnosti.`);
    }
  }

  const ragHeader = isEn 
    ? '\n### USER KNOWLEDGE HISTORY & RAG FACTS:' 
    : '\n### ZNALOSTNÍ HISTORIE & RAG FAKTA UŽIVATELE:';
  const ragSection = ragFacts && ragFacts.length > 0
    ? `${ragHeader}\n${ragFacts.map((f) => `- [${f.category}] ${f.fact}`).join('\n')}\n`
    : '';

  if (isEn) {
    return `
${baseSystemPrompt}

### MANDATORY & BINDING USER REQUIREMENTS:
All user-specified parameters and values listed below are STRICTLY BINDING. As an expert advisor, you MUST 100% adhere to every single parameter and value. You are strictly forbidden from recommending products that violate specified preferences, forbidden brands, budget caps, or biometric/health constraints!

${answeredBlocks.join('\n')}
${ragSection}

### CRITICAL LANGUAGE DIRECTIVE:
You MUST communicate and output all recommendations, rationale, exact product model names, key advantages, trade-offs, and user responses strictly in fluent, natural English.

### REQUIRED RESPONSE FORMAT (HUMAN-READABLE MARKDOWN):
Respond strictly in clean, human-readable Markdown using the following structure (DO NOT USE JSON or YAML).
STRICT LINE BREAK DIRECTIVE: You MUST place each section header, why recommended rationale, pros list, and cons list on its own distinct NEW LINE. NEVER collapse bullet points onto a single inline text string.

# Expert Purchasing Recommendation: ${agent.name}

## Executive Summary & Selection Rationale
A concise 2-paragraph expert evaluation explaining how the chosen models fulfill the user's specific parameters and requirements.

## Top 3 Recommended Models

### 1. [Brand & Exact Model Name #1] (Match: XX %)
- **Why this model fits:** Detailed rationale directly referencing the user's specified parameters.
- **Key Pros & Advantages:**
  - Advantage 1
  - Advantage 2
- **Potential Trade-offs & Cons:**
  - Consideration 1

### 2. [Brand & Exact Model Name #2] (Match: XX %)
...

### 3. [Brand & Exact Model Name #3] (Match: XX %)
...

## Important Considerations & Buying Advice
Key warnings regarding sizing, compatibility, or specific purchasing nuances to verify before buying.
`.trim();
  }

  return `
${baseSystemPrompt}

### STRIKTNÍ A ZÁVAZNÉ POŽADAVKY UŽIVATELE:
Všechny níže uvedené parametry a hodnoty zadané uživatelem v průvodci jsou ZÁVAZNÉ A NEKOMPROMISNÍ. Jako expertní poradce je MUSÍŠ 100% respektovat. Je přísně zakázáno doporučovat produkty, které porušují zadané preference, zakázané značky, rozpočtové limity nebo biometrická a zdravotní omezení!

${answeredBlocks.join('\n')}
${ragSection}

### CRITICAL LANGUAGE DIRECTIVE:
Directivně ukládám: Veškerá doporučení, konkrétní přesné názvy produktových modelů (např. Lenovo Legion Slim 5 16AHR8), odůvodnění, výhody a reakce MUSÍŠ komunikovat a generovat striktně v přirozené češtině (Čeština).

### POŽADOVANÝ FORMÁT ODPOVĚDI (HUMAN-READABLE MARKDOWN):
Odpověz přehledně v lidsky čitelném formátu Markdown s níže uvedenou strukturou (NEPOUŽÍVEJ JSON ANI YAML):

# Expertní nákupní doporučení: ${agent.name}

## Souhrnné hodnocení a strategie výběru
Stručné expertní shrnutí (2 odstavce), jak vybrané modely přesně řeší zadané parametry a potřeby uživatele.

## Top 3 Doporučené Modely

### 1. [Značka a přesný název modelu #1] (Shoda: XX %)
- **Proč právě tento model:** Detailní odůvodnění s přímým odkazem na zadané parametry uživatele.
- **Klíčové výhody:**
  - Výhoda 1
  - Výhoda 2
- **Potenciální kompromisy a nevýhody:**
  - Nevýhoda / kompromis 1

### 2. [Značka a přesný název modelu #2] (Shoda: XX %)
...

### 3. [Značka a přesný název modelu #3] (Shoda: XX %)
...

## Důležitá upozornění a doporučení před nákupem
Doporučení a varování týkající se dimenzování, kompatibility nebo specifik před finálním nákupem.
`.trim();
}





/**
 * PRESET 1: Běžecká obuv a zdravotní podiatrie
 */
export const PRESET_SHOE_AGENT: UniversalAgentDefinition = {
  id: 'running_shoes',
  name: 'Běžecká obuv & Podiatrie kolene',
  category: 'Footwear & Podiatry',
  icon: '',
  version: '1.0.0',
  description: 'Prevence bolestí kolenních kloubů a patellofemorálního syndromu. Vyhodnocení šířky kopyta (2E/4E) a kolébkové podešve (Rocker).',
  systemPrompt: `Jsi špičkový ortopedický podiatr a běžecký biomechanik.
Tvým úkolem je doporučit 3 nejvhodnější modely běžecké obuvi dostupné na trhu přesně podle biometrie chodidla a kloubních potíží uživatele.
U každé boty vysvětli přesný anatomický důvod doporučení s ohledem na redukci tlaku v kolenním kloubu.`,
  questions: [
    {
      id: 'foot_size_eu',
      step: 1,
      title: 'Velikost chodidla (EU)',
      subtitle: 'Zadejte vaši obvyklou velikost běžecké obuvi.',
      component: 'slider',
      sliderConfig: { min: 36, max: 49, step: 0.5, unit: 'EU', defaultValue: 43 },
      defaultValue: 43,
      promptForgeTemplate: '- **Velikost obuvi:** {value}',
    },
    {
      id: 'foot_width',
      step: 1,
      title: 'Šířka kopyta / toeboxu',
      subtitle: 'Trpíte na otlaky malíků nebo potřebujete prostor pro prsty?',
      component: 'chips',
      isMultiSelect: false,
      options: [
        { label: 'Standardní šířka (D)', value: 'standard_d', description: 'Běžná konfekční šířka' },
        { label: 'Široké kopyto (2E Wide)', value: 'wide_2e', description: 'Širší prstová část pro prevenci Mortonova neuromu' },
        { label: 'Extrémně široké (4E Extra Wide)', value: 'extra_wide_4e', description: 'Pro široké nohy a ortopedické vložky' },
      ],
      defaultValue: 'wide_2e',
      promptForgeTemplate: '- **Šířka kopyta:** {value}',
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
  icon: '',
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
  icon: '',
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

export const INITIAL_UNIVERSAL_AGENTS: UniversalAgentDefinition[] = [
  PRESET_SHOE_AGENT,
  PRESET_ERGO_CHAIR_AGENT,
  PRESET_COFFEE_AGENT,
];



export function resolveAgentIcon(_icon?: string, _contextText?: string): string {
  // STRICT ZERO-EMOJI & ZERO-ICON DESIGN MANDATE (PRD Section 12 / AGENTS.md)
  // Emojis and generic icons are strictly prohibited across the user interface.
  return '';
}
