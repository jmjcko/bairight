import { describe, it, expect } from 'vitest';
import { buildEvaluationPrompt, ALL_KNOWN_BRANDS } from '../real-llm-service';
import { evaluateIntakeFormWithAgent, IntakeFormData } from '../markdown-agent-loader';

describe('Brand Isolation & Prompt Verification', () => {
  const baseForm: IntakeFormData = {
    product_category: 'running_shoes',
    foot_length_mm: 280,
    foot_width_mm: 106,
    foot_length_cm: 28.0,
    eu_size: 43,
    foot_width: 'wide_2e',
    strike_pattern: 'heel_strike',
    foot_mechanics: 'mild_overpronation',
    cushioning_preference: 'maximum',
    weekly_volume: '15_to_35_km',
    activity_type: ['road_running'],
    joint_conditions: ['knee_arthrosis_grade_3'],
    foot_conditions: [],
    past_surgeries: [],
    budget_eur: 180,
    preferred_brands: ['Hoka', 'Brooks'],
    forbidden_brands: ['Asics'],
  };

  it('1. buildEvaluationPrompt strictly isolates allowed brands and explicitly forbids Asics', () => {
    const prompt = buildEvaluationPrompt(baseForm);

    // Must mention VÝHRADNĚ POVOLENÉ ZNAČKY: Hoka, Brooks
    expect(prompt).toContain('VÝHRADNĚ POVOLENÉ ZNAČKY:');
    expect(prompt).toContain('Hoka, Brooks');

    // Must explicitly forbid Asics
    expect(prompt).toContain('PŘÍSNĚ ZAKÁZANÉ ZNAČKY (NESMÍ BÝT DOPORUČENY):');
    expect(prompt).toContain('Asics');

    // The verified sample catalog inside the prompt must NOT contain Asics
    expect(prompt).not.toContain('Gel-Kayano 30');
    expect(prompt).not.toContain('"brand": "Asics"');

    // Allowed brands should be present in the sample catalog
    expect(prompt).toContain('Bondi 8');
  });

  it('2. evaluateIntakeFormWithAgent never recommends Asics when Asics is not in preferred brands', async () => {
    const result = await evaluateIntakeFormWithAgent(baseForm);

    expect(result.recommendations.length).toBeGreaterThan(0);

    const asicsShoes = result.recommendations.filter(
      (s) => s.brand.toLowerCase() === 'asics'
    );
    expect(asicsShoes).toHaveLength(0);

    // All recommended shoes must belong to Hoka or Brooks
    for (const shoe of result.recommendations) {
      expect(['hoka', 'brooks']).toContain(shoe.brand.toLowerCase());
    }
  });

  it('3. When user specifies no preferred brands, all known brands are allowed and catalog is open', () => {
    const openForm: IntakeFormData = {
      ...baseForm,
      preferred_brands: [],
      forbidden_brands: [],
    };
    const prompt = buildEvaluationPrompt(openForm);

    expect(prompt).toContain('Všechny značky jsou povoleny.');
    expect(prompt).not.toContain('PŘÍSNĚ ZAKÁZANÉ ZNAČKY');
  });
});
