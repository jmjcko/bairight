import { BiomechanicalProfile, MandatoryCheckResult, AgentState } from './types';

export const INITIAL_BIOMECHANICAL_PROFILE: BiomechanicalProfile = {
  weight_kg: null,
  foot_width: null,
  strike_type: null,
  past_injuries: [],
  knee_condition: null,
  activity_type: 'road_running',
};

/**
 * Validates whether all 5 mandatory podiatric parameters are collected.
 * Tools (search forums, scan European e-shops) remain STRICTLY LOCKED
 * until isReady is true.
 */
export function evaluateMandatoryBiomechanicalParameters(
  profile: BiomechanicalProfile,
  hasInjuriesAcknowledged = false
): MandatoryCheckResult {
  const missing: (keyof BiomechanicalProfile)[] = [];
  const present: (keyof BiomechanicalProfile)[] = [];

  // 1. Weight (kg) - required for midsole density / load impact
  if (profile.weight_kg !== null && profile.weight_kg > 0) {
    present.push('weight_kg');
  } else {
    missing.push('weight_kg');
  }

  // 2. Foot Width - critical for 2E wide fit verification
  if (profile.foot_width !== null) {
    present.push('foot_width');
  } else {
    missing.push('foot_width');
  }

  // 3. Strike type / Supination - required for lateral guidance & heel bevel
  if (profile.strike_type !== null) {
    present.push('strike_type');
  } else {
    missing.push('strike_type');
  }

  // 4. Past injuries - acknowledged or specified
  if (
    profile.past_injuries.length > 0 || 
    profile.injuries_acknowledged || 
    hasInjuriesAcknowledged
  ) {
    present.push('past_injuries');
  } else {
    missing.push('past_injuries');
  }

  // 5. Knee Condition - specifically checks for Knee Osteoarthritis Grade 3 or explicit health status
  if (profile.knee_condition !== null) {
    present.push('knee_condition');
  } else {
    missing.push('knee_condition');
  }

  const isReady = missing.length === 0;

  let state: AgentState = 'COLLECTING_BIOMECHANICS';
  let guidanceForPrompt = '';

  if (isReady) {
    state = 'READY_FOR_RECOMMENDATIONS';
    guidanceForPrompt = `
GUARDRAIL PASSED: All 5 mandatory biomechanical parameters are verified.
Profile Summary:
- Weight: ${profile.weight_kg} kg
- Foot Width: ${profile.foot_width?.toUpperCase()} (Focus on 2E Wide offerings)
- Strike / Gait: ${profile.strike_type} (Needs lateral stability if supination)
- Past Injuries: ${profile.past_injuries.length ? profile.past_injuries.join(', ') : 'None documented'}
- Knee Health: ${profile.knee_condition} (Knee Osteoarthritis Grade 3 requires max shock attenuation, early-stage rocker, and moderate drop 4-8mm to reduce knee extensor torque).

ACTION AUTHORIZATION: You are now AUTHORIZED to execute external tools:
1. 'searchRunningForums'
2. 'scanEuropeanEshops' (specifically for 2E wide sizes and EU stock).
`.trim();
  } else {
    state = 'COLLECTING_BIOMECHANICS';
    guidanceForPrompt = `
STRICT GUARDRAIL ACTIVE: External search and e-shop tools are LOCKED.
Do NOT trigger search tools yet. You still lack the following mandatory parameters: [${missing.join(', ')}].

Clinical Reasoning & Instructions:
- Formulate 1-2 empathetic, medically grounded clarifying questions to collect the missing data.
- Explain WHY these parameters matter for their joints (e.g. why Knee Osteoarthritis 3rd degree demands rocker geometry and max cushioning, and why 2E wide width prevents metatarsal compression and gait compensation).
`.trim();
  }

  return {
    isReady,
    missingFields: missing,
    presentFields: present,
    state,
    guidanceForPrompt,
  };
}

/**
 * Intelligent regex/keyword parser that extracts biomechanical parameters
 * from user input text to update the persistent profile state.
 */
export function extractBiomechanicalProfileUpdates(
  userText: string,
  current: BiomechanicalProfile
): { updatedProfile: BiomechanicalProfile; injuriesAcknowledged: boolean } {
  const text = userText.toLowerCase();
  const updated: BiomechanicalProfile = { ...current };
  let injuriesAcknowledged = current.past_injuries.length > 0;

  // 1. Weight Extraction (e.g., "85 kg", "85kg", "190 lbs", "vážím 80 kilo")
  const kgMatch = text.match(/(\d{2,3}(?:\.\d+)?)\s*(?:kg|kilo|kilograms|kilos)/i);
  if (kgMatch) {
    updated.weight_kg = parseFloat(kgMatch[1]);
  } else {
    const lbsMatch = text.match(/(\d{2,3}(?:\.\d+)?)\s*(?:lbs|pounds)/i);
    if (lbsMatch) {
      updated.weight_kg = Math.round(parseFloat(lbsMatch[1]) * 0.453592);
    }
  }

  // 2. Foot Width Extraction (2E, wide, 4E, standard, narrow)
  if (text.includes('4e') || text.includes('extra wide') || text.includes('velmi širok')) {
    updated.foot_width = 'extra_wide_4e';
  } else if (text.includes('2e') || text.includes('wide') || text.includes('širok') || text.includes('sirsi')) {
    updated.foot_width = 'wide_2e';
  } else if (text.includes('standard') || text.includes('regular') || text.includes('normal width') || text.includes('střední')) {
    updated.foot_width = 'standard_d';
  } else if (text.includes('narrow') || text.includes('úzk')) {
    updated.foot_width = 'narrow_b';
  }

  // 3. Strike Type / Supination / Pronation
  if (text.includes('supinat') || text.includes('supinac') || text.includes('outer edge') || text.includes('vnější hran')) {
    updated.strike_type = 'supination';
  } else if (text.includes('overpronat') || text.includes('pronac') || text.includes('flat feet') || text.includes('vnitřní hran')) {
    updated.strike_type = 'mild_overpronation';
  } else if (text.includes('heel strike') || text.includes('došlap na patu') || text.includes('na patu')) {
    updated.strike_type = 'heel_strike';
  } else if (text.includes('midfoot') || text.includes('na střed')) {
    updated.strike_type = 'midfoot_strike';
  } else if (text.includes('neutral') || text.includes('neutrální')) {
    updated.strike_type = 'neutral';
  }

  // 4. Knee Osteoarthritis / Knee conditions
  if (
    text.includes('osteoarthritis') || 
    text.includes('artróz') || 
    text.includes('osteoartróz') ||
    text.includes('gonarthrosis') ||
    text.includes('gonartróz') ||
    text.includes('3rd degree') ||
    text.includes('3. stupeň') ||
    text.includes('grade 3') ||
    text.includes('stage 3')
  ) {
    updated.knee_condition = 'osteoarthritis_grade_3';
  } else if (text.includes('meniscus') || text.includes('menisk')) {
    updated.knee_condition = 'meniscus_tear';
  } else if (text.includes('healthy knees') || text.includes('kolena v pořádku') || text.includes('no knee pain')) {
    updated.knee_condition = 'none';
  }

  // 5. Past Injuries
  const injuriesFound: string[] = [...updated.past_injuries];
  if (text.includes('plantar') || text.includes('plantární fasciitid')) {
    if (!injuriesFound.includes('Plantar Fasciitis')) injuriesFound.push('Plantar Fasciitis');
  }
  if (text.includes('achilles') || text.includes('achillovk')) {
    if (!injuriesFound.includes('Achilles Tendinopathy')) injuriesFound.push('Achilles Tendinopathy');
  }
  if (text.includes('shin splint') || text.includes('okostice')) {
    if (!injuriesFound.includes('Shin Splints')) injuriesFound.push('Shin Splints');
  }
  if (text.includes('runner\'s knee') || text.includes('běžecké koleno')) {
    if (!injuriesFound.includes("Runner's Knee")) injuriesFound.push("Runner's Knee");
  }
  if (
    /(?:no|never|zero|without|žádn|neměl|nemam|nemám|bez)\s+(?:\w+\s+)*(?:injur|zraněn|operac)/i.test(text) ||
    text.includes('no injuries') ||
    text.includes('none') ||
    text.includes('žádná zranění') ||
    text.includes('zadna zraneni') ||
    text.includes('žádné operace') ||
    text.includes('nemám operace') ||
    text.includes('nemám zranění')
  ) {
    injuriesAcknowledged = true;
  }
  if (injuriesFound.length > 0) {
    injuriesAcknowledged = true;
  }
  updated.past_injuries = injuriesFound;
  updated.injuries_acknowledged = injuriesAcknowledged || updated.injuries_acknowledged;

  // Activity type
  if (text.includes('walking') || text.includes('chůze') || text.includes('chodit')) {
    updated.activity_type = text.includes('run') || text.includes('běh') ? 'hybrid' : 'walking';
  } else if (text.includes('trail')) {
    updated.activity_type = 'trail';
  }

  return { updatedProfile: updated, injuriesAcknowledged };
}
