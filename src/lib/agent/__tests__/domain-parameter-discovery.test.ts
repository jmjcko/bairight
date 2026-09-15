import { describe, it, expect } from 'vitest';
import { 
  discoverDomainParameters, 
  buildAgentFromDomainAnalysis 
} from '../domain-parameter-discovery';

describe('Domain Parameter Discovery & Prompt Synthesizer Test Suite', () => {
  it('1. Detekuje kategorii "auto" a odvodí minimálně 10 detailních automobilových parametrů', () => {
    const analysis = discoverDomainParameters('auto');

    expect(analysis.matchedDomain).toBe('cars');
    expect(analysis.categoryName).toContain('Automobily');
    expect(analysis.agentName).toContain('Automobilový Poradce');

    // Minimálně 10 parametrů
    expect(analysis.parameters.length).toBeGreaterThanOrEqual(10);

    const paramIds = analysis.parameters.map((p) => p.id);
    expect(paramIds).toContain('body_type');
    expect(paramIds).toContain('powertrain');
    expect(paramIds).toContain('drivetrain');
    expect(paramIds).toContain('transmission');
    expect(paramIds).toContain('annual_mileage');
    expect(paramIds).toContain('trunk_capacity');
    expect(paramIds).toContain('vehicle_condition');
    expect(paramIds).toContain('safety_assistants');
    expect(paramIds).toContain('running_costs');
    expect(paramIds).toContain('budget_czk');

    // Otázky pro nákup vozu
    const questionIds = analysis.questions.map((q) => q.id);
    expect(questionIds).toContain('car_body_type');
    expect(questionIds).toContain('car_powertrain');
    expect(questionIds).toContain('car_drivetrain');
    expect(questionIds).toContain('car_budget');

    // Expertní prompt
    expect(analysis.systemPrompt).toContain('automobilový poradce');
    expect(analysis.systemPrompt).toContain('DPF');
  });

  it('2. Detekuje kategorii "boty" a odvodí minimálně 10 biomechanických parametrů a expertní prompt', () => {
    const analysis = discoverDomainParameters('běžecké boty');

    expect(analysis.matchedDomain).toBe('shoes');
    expect(analysis.parameters.length).toBeGreaterThanOrEqual(10);

    const paramIds = analysis.parameters.map((p) => p.id);
    expect(paramIds).toContain('biomechanics');
    expect(paramIds).toContain('surface');
    expect(paramIds).toContain('cushioning');
    expect(paramIds).toContain('foot_width');
    expect(paramIds).toContain('heel_drop');
    expect(paramIds).toContain('runner_weight');
    expect(paramIds).toContain('weekly_volume');
    expect(paramIds).toContain('weather_membrane');
    expect(paramIds).toContain('plate_rigidity');
    expect(paramIds).toContain('budget');

    // Ověření expertního systémového promptu s podiatrickými pravidly
    expect(analysis.systemPrompt).toContain('biomechanický expert');
    expect(analysis.systemPrompt).toContain('pronaci');
    expect(analysis.systemPrompt).toContain('stabilizačním');
    expect(analysis.systemPrompt).toContain('2E Wide');
  });

  it('3. Detekuje dotaz na "kávovar" a odvodí minimálně 10 baristických parametrů', () => {
    const analysis = discoverDomainParameters('kávovar do domácnosti');

    expect(analysis.matchedDomain).toBe('coffee');
    expect(analysis.parameters.length).toBeGreaterThanOrEqual(10);
    expect(analysis.parameters.some((p) => p.id === 'brew_method')).toBe(true);
    expect(analysis.parameters.some((p) => p.id === 'milk_system')).toBe(true);
    expect(analysis.parameters.some((p) => p.id === 'boiler_type')).toBe(true);
    expect(analysis.parameters.some((p) => p.id === 'grinder_quality')).toBe(true);
    expect(analysis.systemPrompt).toContain('barista');
  });

  it('4. Detekuje dotaz na "židle" a odvodí minimálně 10 ergonomických parametrů sezení a páteře', () => {
    const analysis = discoverDomainParameters('kancelářská židle na bolavá záda');

    expect(analysis.matchedDomain).toBe('chair');
    expect(analysis.parameters.length).toBeGreaterThanOrEqual(10);
    expect(analysis.parameters.some((p) => p.id === 'sitting_hours')).toBe(true);
    expect(analysis.parameters.some((p) => p.id === 'mechanism_type')).toBe(true);
    expect(analysis.parameters.some((p) => p.id === 'lumbar_support')).toBe(true);
    expect(analysis.parameters.some((p) => p.id === 'armrests')).toBe(true);
    expect(analysis.systemPrompt).toContain('ergonom');
  });

  it('5. Detekuje dotaz na "notebook" a odvodí minimálně 10 parametrů výpočetního výkonu a mobility', () => {
    const analysis = discoverDomainParameters('notebook na programování');

    expect(analysis.matchedDomain).toBe('laptop');
    expect(analysis.parameters.length).toBeGreaterThanOrEqual(10);
    expect(analysis.parameters.some((p) => p.id === 'primary_use')).toBe(true);
    expect(analysis.parameters.some((p) => p.id === 'display_quality')).toBe(true);
    expect(analysis.parameters.some((p) => p.id === 'mobility_screen')).toBe(true);
    expect(analysis.parameters.some((p) => p.id === 'os_preference')).toBe(true);
    expect(analysis.parameters.some((p) => p.id === 'ram_capacity')).toBe(true);
  });

  it('6. Zvládne neznámé klíčové slovo a syntetizuje minimálně 10 univerzálních produktových parametrů a prompt', () => {
    const analysis = discoverDomainParameters('elektrická sekačka na trávu');

    expect(analysis.matchedDomain).toBe('generic');
    expect(analysis.parameters.length).toBeGreaterThanOrEqual(10);
    expect(analysis.questions.length).toBeGreaterThanOrEqual(3);
    expect(analysis.systemPrompt).toContain('elektrická sekačka na trávu');

    const paramIds = analysis.parameters.map((p) => p.id);
    expect(paramIds).toContain('primary_purpose');
    expect(paramIds).toContain('technical_class');
    expect(paramIds).toContain('capacity_sizing');
    expect(paramIds).toContain('dimensions_installation');
    expect(paramIds).toContain('controls_ui');
    expect(paramIds).toContain('energy_efficiency');
    expect(paramIds).toContain('materials_durability');
    expect(paramIds).toContain('maintenance_service');
    expect(paramIds).toContain('safety_certification');
    expect(paramIds).toContain('total_budget');

    const builtAgent = buildAgentFromDomainAnalysis(analysis);
    expect(builtAgent.id).toContain('agent-');
    expect(builtAgent.questions.length).toBe(analysis.questions.length);
    expect(builtAgent.isCustom).toBe(true);
  });

  it('7. Detekuje "elektroauto" jako samostatnou kategorii EV a NIKDY nenabízí výběr motorizace (benzín/diesel)', () => {
    const analysis = discoverDomainParameters('elektroauto');

    expect(analysis.matchedDomain).toBe('electric_cars');
    expect(analysis.categoryName).toContain('Elektromobily');
    expect(analysis.agentName).toContain('Elektromobilitu');

    // EV parametry
    const paramIds = analysis.parameters.map((p) => p.id);
    expect(paramIds).toContain('ev_battery_range');
    expect(paramIds).toContain('ev_charging_architecture');
    expect(paramIds).toContain('ev_heat_pump');
    expect(paramIds).toContain('ev_battery_chemistry');

    // Striktní zákaz dotazování na motorizaci benzín/diesel
    const questionIds = analysis.questions.map((q) => q.id);
    expect(questionIds).not.toContain('car_powertrain');

    // Žádná otázka nesmí nabízet benzín nebo naftu
    const allOptionLabels = analysis.questions.flatMap((q) => q.options?.map((o) => o.label) || []);
    expect(allOptionLabels.some((l) => /benzín|diesel|nafta/i.test(l))).toBe(false);

    // Otázky musí řešit reálný dojezd a nabíjení
    expect(questionIds).toContain('ev_range_preference');
    expect(questionIds).toContain('ev_charging_situation');
  });

  it('8. Luke VŽDY nabízí "značku" jako parametr napříč všemi kategoriemi a generuje pro ni otázku s pravidly pro preferované a zakázané značky', () => {
    // Ověříme několik různých kategorií včetně neznámé generické
    const categories = ['auto', 'kávovar', 'kancelářská židle', 'běžecké boty', 'sekačka na trávu'];

    for (const cat of categories) {
      const analysis = discoverDomainParameters(cat);
      const hasBrandParam = analysis.parameters.some(
        (p) => p.id === 'brand_preferences' || p.id.includes('brand') || p.name.toLowerCase().includes('značk') || p.name.toLowerCase().includes('výrobc')
      );
      expect(hasBrandParam, `Kategorie "${cat}" musí obsahovat parametr pro značky`).toBe(true);

      const agent = buildAgentFromDomainAnalysis(analysis);
      const hasBrandQuestion = agent.questions.some(
        (q) => q.component === 'brands' || q.id.includes('brand') || q.title.toLowerCase().includes('značk')
      );
      expect(hasBrandQuestion, `Agent pro kategorii "${cat}" musí obsahovat otázku pro značky`).toBe(true);
    }
  });
});
