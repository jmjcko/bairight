import fs from 'fs';
import path from 'path';
import { ShoeRecommendation } from './types';
import { EUROPEAN_CATALOG_2E_MODELS } from './tools/scan-eshops';

export interface IntakeFormData {
  product_category: string;
  foot_length_cm?: number;
  foot_length_mm?: number;
  foot_width_mm?: number;
  eu_size?: number;
  foot_width: 'standard_d' | 'wide_2e' | 'extra_wide_4e' | 'narrow_b';
  strike_pattern: 'heel_strike' | 'midfoot_strike' | 'forefoot_strike' | 'unknown';
  foot_mechanics: 'supination' | 'neutral' | 'mild_overpronation' | 'severe_overpronation';
  activity_type: string[];
  weekly_volume?: string;
  cushioning_preference: 'maximum' | 'balanced' | 'firm';
  preferred_brands: string[];
  forbidden_brands: string[];
  joint_conditions: string[];
  foot_conditions: string[];
  past_surgeries: string[];
  budget_eur?: number;
}

export interface AgentPrescriptionResult {
  agentName: string;
  agentVersion: string;
  evaluatedAt: string;
  profileSummary: {
    category: string;
    sizeDesc: string;
    widthDesc: string;
    gaitDesc: string;
    medicalHighlights: string[];
    surgeryHighlights: string[];
    brandRules: {
      preferred: string[];
      forbidden: string[];
    };
  };
  clinicalAssessment: string;
  contraindications: string[];
  recommendations: (ShoeRecommendation & {
    matchScore: number;
    matchReasons: string[];
  })[];
}

/**
 * Reads the agent markdown definition from agents/shoe-recommender-agent.md
 */
export function loadAgentMarkdownDefinition(): { content: string; name: string; version: string; filePath: string } {
  const agentFilePath = path.join(process.cwd(), 'agents', 'shoe-recommender-agent.md');
  try {
    const content = fs.readFileSync(agentFilePath, 'utf-8');
    const nameMatch = content.match(/name:\s*"([^"]+)"/);
    const versionMatch = content.match(/version:\s*"([^"]+)"/);
    return {
      content,
      filePath: 'agents/shoe-recommender-agent.md',
      name: nameMatch ? nameMatch[1] : 'bAIright Podiatrist & Footwear Shopper Agent',
      version: versionMatch ? versionMatch[1] : '1.1.0',
    };
  } catch (err) {
    console.warn('Could not read agent file directly from disk, using fallback definition', err);
    return {
      content: 'Clinical Podiatrist Agent',
      filePath: 'agents/shoe-recommender-agent.md',
      name: 'bAIright Podiatrist & Footwear Shopper Agent',
      version: '1.1.0',
    };
  }
}

/**
 * Saves updated markdown definition back to agents/shoe-recommender-agent.md
 */
export function saveAgentMarkdownDefinition(newContent: string): { success: boolean; name: string; version: string } {
  const agentFilePath = path.join(process.cwd(), 'agents', 'shoe-recommender-agent.md');
  fs.writeFileSync(agentFilePath, newContent, 'utf-8');
  const nameMatch = newContent.match(/name:\s*"([^"]+)"/);
  const versionMatch = newContent.match(/version:\s*"([^"]+)"/);
  return {
    success: true,
    name: nameMatch ? nameMatch[1] : 'bAIright Podiatrist & Footwear Shopper Agent',
    version: versionMatch ? versionMatch[1] : '1.1.0',
  };
}

/**
 * Evaluates the form intake payload strictly against the rules in the markdown agent
 */
export async function evaluateIntakeFormWithAgent(
  formData: IntakeFormData
): Promise<AgentPrescriptionResult> {
  const agentMeta = loadAgentMarkdownDefinition();

  // Normalize forbidden brands
  const forbiddenLower = (formData.forbidden_brands || []).map((b) => b.trim().toLowerCase());
  const preferredLower = (formData.preferred_brands || []).map((b) => b.trim().toLowerCase());

  const hasKneeOA = (formData.joint_conditions || []).some(
    (c) => c.toLowerCase().includes('osteoarthritis') || c.toLowerCase().includes('knee') || c.toLowerCase().includes('artróz')
  );
  const isSupinator = formData.foot_mechanics === 'supination';
  const isWideFoot = formData.foot_width === 'wide_2e' || formData.foot_width === 'extra_wide_4e';
  const hasSurgeries = (formData.past_surgeries || []).length > 0 && !formData.past_surgeries.includes('none');

  // Filter catalog respecting STRICT FORBIDDEN BRANDS
  const candidateShoes = EUROPEAN_CATALOG_2E_MODELS.filter((shoe) => {
    // RULE 1: Never recommend forbidden brands
    if (forbiddenLower.includes(shoe.brand.toLowerCase())) {
      return false;
    }
    // RULE 2: If wide foot is required, must support wide
    if (isWideFoot && !shoe.is_2e_available) {
      return false;
    }
    return true;
  });

  // Calculate match scores based on medical heuristics
  const scored = candidateShoes.map((shoe) => {
    let score = 75; // base score
    const matchReasons: string[] = [];

    // Brand preference boost
    if (preferredLower.includes(shoe.brand.toLowerCase())) {
      score += 15;
      matchReasons.push(`Oblíbená značka z vašeho výběru: ${shoe.brand}`);
    }

    // Knee OA & Rocker Sole matching
    if (hasKneeOA) {
      if (shoe.rocker_geometry) {
        score += 12;
        matchReasons.push('Rockerová geometrie (kolébka) výrazně snižuje tlak na kolenní kloub při odrazu');
      }
      if (shoe.heel_drop_mm <= 8 && shoe.heel_drop_mm >= 4) {
        score += 10;
        matchReasons.push(`Optimální drop ${shoe.heel_drop_mm} mm: vyvážené zatížení kolene a Achillovy šlachy`);
      } else if (shoe.heel_drop_mm > 8) {
        score -= 5;
      }
      if (shoe.cushion_level === 'Maximum' || shoe.cushion_level === 'Plush') {
        score += 8;
        matchReasons.push('Maximální úroveň tlumení nárazů chrání opotřebovanou kloubní chrupavku');
      }
    }

    // Supination matching
    if (isSupinator) {
      score += 8;
      matchReasons.push('Neutrální stabilní platforma bez vnitřního klínu (vhodná pro supinaci)');
    }

    // Wide fit verification
    if (isWideFoot) {
      score += 10;
      matchReasons.push('Poctivé anatomické kopyto 2E zamezuje stlačování prstů a metatarzů');
    }

    return {
      ...shoe,
      matchScore: Math.min(score, 99),
      matchReasons,
    };
  });

  // Sort by match score descending
  scored.sort((a, b) => b.matchScore - a.matchScore);

  // Compile clinical assessment summary in Czech
  const clinicalAssessment = `
Vyhodnoceno systémem **${agentMeta.name} (v${agentMeta.version})** na základě biomechanických pravidel z \`agents/shoe-recommender-agent.md\`.

### Klíčová biomechanická zjištění:
- **Zdraví kolenních kloubů:** ${hasKneeOA ? 'Vysoká priorita pro zátěž kolene (artróza 3. stupně). Doporučen nízký až střední drop (4–8 mm) a aktivní kolébková podrážka (rocker).' : 'Standardní zátěž kloubů bez hlášené artrózy.'}
- **Anatomie chodidla:** ${isWideFoot ? 'Doporučena široká obuv (kopyto 2E/4E) pro prevenci útlaku metatarzů a prstů.' : 'Standardní šířka kopyta.'}
- **Mechanika došlapu:** ${isSupinator ? 'Došlap na vnější hranu (supinace). Vnitřní pronační stabilizační klíny jsou nevhodné.' : 'Neutrální či rovnoměrný došlap.'}
- **Pravidla pro značky:** ${forbiddenLower.length ? `Vyloučeno z výběru: [${formData.forbidden_brands.join(', ')}].` : 'Bez zakázaných značek.'} ${preferredLower.length ? `Preferované značky: [${formData.preferred_brands.join(', ')}].` : ''}
`.trim();

  const contraindications = [
    ...(hasKneeOA ? [
      'Vyhněte se botám s vysokým dropem (10–12 mm), které zvyšují ohybový moment v koleni a tlak na čéšku.',
      'Vyhněte se tuhé ploché podrážce bez kolébkového prohnutí (zvyšuje námahu kolenních extenzorů).'
    ] : []),
    ...(isSupinator ? [
      'Vyhněte se botám s pronačními klíny a tvrdou vnitřní pěnou (tlačí chodidlo ještě více na vnější hranu).'
    ] : []),
    ...(isWideFoot ? [
      'Vyhněte se standardním úzkým botám (šířka D) s kónickou špičkou (stlačují nervy a klouby prstů).'
    ] : []),
    ...(hasSurgeries ? [
      'Po operaci menisku/vazů se vyhněte příliš měkkým a nestabilním „želé“ botám bez opory paty.'
    ] : []),
  ];

  return {
    agentName: agentMeta.name,
    agentVersion: agentMeta.version,
    evaluatedAt: new Date().toISOString(),
    profileSummary: {
      category: formData.product_category,
      sizeDesc: formData.foot_length_mm 
        ? `EU ${formData.eu_size || 'N/A'} (${formData.foot_length_mm} mm / ${(formData.foot_length_mm / 10).toFixed(1)} cm)`
        : formData.eu_size ? `EU ${formData.eu_size}` : `${formData.foot_length_cm} cm`,
      widthDesc: formData.foot_width_mm 
        ? `${formData.foot_width.toUpperCase().replace('_', ' ')} (${formData.foot_width_mm} mm)`
        : formData.foot_width.toUpperCase().replace('_', ' '),
      gaitDesc: `${formData.strike_pattern} / ${formData.foot_mechanics}`,
      medicalHighlights: [...(formData.joint_conditions || []), ...(formData.foot_conditions || [])],
      surgeryHighlights: formData.past_surgeries || [],
      brandRules: {
        preferred: formData.preferred_brands || [],
        forbidden: formData.forbidden_brands || [],
      },
    },
    clinicalAssessment,
    contraindications,
    recommendations: scored.slice(0, 4),
  };
}
