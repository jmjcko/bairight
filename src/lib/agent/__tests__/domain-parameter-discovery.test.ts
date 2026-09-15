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
    const analysis = discoverDomainParameters('akvarijní set s LED osvětlením');

    expect(analysis.matchedDomain).toBe('generic');
    expect(analysis.parameters.length).toBeGreaterThanOrEqual(10);
    expect(analysis.questions.length).toBeGreaterThanOrEqual(3);
    expect(analysis.systemPrompt).toContain('akvarijní set s LED osvětlením');

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
  it('9. Detekuje kategorii "chytrý telefon / mobil" a odvodí OIS, PWM a délku podpory', () => {
    const analysis = discoverDomainParameters('mobilní telefon smartphone');
    expect(analysis.matchedDomain).toBe('smartphones');
    expect(analysis.parameters.some((p) => p.id === 'phone_camera_sensor')).toBe(true);
    expect(analysis.parameters.some((p) => p.id === 'phone_display_pwm')).toBe(true);
    expect(analysis.parameters.some((p) => p.id === 'phone_os_support')).toBe(true);
    expect(analysis.parameters.some((p) => p.id === 'phone_battery_charging')).toBe(true);
  });

  it('10. Detekuje kategorii "pračka" a odvodí DirectDrive motor a rozebíratelnou vanu', () => {
    const analysis = discoverDomainParameters('automatická pračka');
    expect(analysis.matchedDomain).toBe('washing_machines');
    expect(analysis.parameters.some((p) => p.id === 'washer_motor_type')).toBe(true);
    expect(analysis.parameters.some((p) => p.id === 'washer_drum_bearings')).toBe(true);
    expect(analysis.parameters.some((p) => p.id === 'washer_steam_allergy')).toBe(true);
  });

  it('11. Detekuje kategorii "televize" a odvodí OLED/MiniLED a 120Hz bez záměny za EV', () => {
    const analysis = discoverDomainParameters('chytrá televize do obýváku');
    expect(analysis.matchedDomain).toBe('tv');
    expect(analysis.categoryName).toContain('Televize');
    expect(analysis.parameters.some((p) => p.id === 'tv_display_technology')).toBe(true);
    expect(analysis.parameters.some((p) => p.id === 'tv_refresh_rate_gaming')).toBe(true);
  });

  it('12. Detekuje kategorii "sekačka" jako lawnmowers s RTK navigací a variabilním pojezdem', () => {
    const analysis = discoverDomainParameters('robotická sekačka na trávu');
    expect(analysis.matchedDomain).toBe('lawnmowers');
    expect(analysis.parameters.some((p) => p.id === 'mower_nav_wirefree')).toBe(true);
    expect(analysis.parameters.some((p) => p.id === 'mower_drive_speed')).toBe(true);
  });

  it('13. Jízdní kolo má VŽDY jako 1. parametr elementární tržní segment (Silniční vs. Gravel vs. MTB vs. E-bike) a jako 2. parametr biometrii jezdce a operace zad/kolen s celkem min. 10 parametry', () => {
    const analysis = discoverDomainParameters('chci nové jízdní kolo');

    expect(analysis.matchedDomain).toBe('bicycles');
    expect(analysis.parameters.length).toBeGreaterThanOrEqual(10);

    // Parametr č. 1 MUSÍ BÝT typ kola na trhu, nikoliv vidlice nebo materiál rámu
    expect(analysis.parameters[0].id).toBe('bike_type_category');
    expect(analysis.parameters[0].name).toContain('Typ kola & disciplína');
    expect(analysis.parameters[0].suggestedValues).toEqual(
      expect.arrayContaining([expect.stringContaining('Gravel'), expect.stringContaining('Horské kolo MTB')])
    );

    // Parametr č. 2 MUSÍ BÝT biometrie a zdravotní profil jezdce
    expect(analysis.parameters[1].id).toBe('bike_rider_biometrics');
    expect(analysis.parameters[1].name).toContain('Biometrie jezdce');
    expect(analysis.parameters[1].rationale).toMatch(/výška|hmotnost|operac|záda|kolen/i);

    // Otázky musí respektovat tuto hierarchii
    expect(analysis.questions[0].id).toBe('bike_q_type');
    expect(analysis.questions[1].id).toBe('bike_q_biometrics');
  });

  it('14. Tělesně vázané produkty (lyže, židle, matrace, boty) VŽDY obsahují parametr pro tělesné rozměry a zdravotní profil (výška, váha, operace páteře/kolen)', () => {
    // Lyže
    const skiAnalysis = discoverDomainParameters('sjezdové lyže');
    expect(skiAnalysis.parameters[0].id).toBe('skis_terrain_purpose');
    expect(skiAnalysis.parameters.some((p) => p.id === 'skier_biometrics_health')).toBe(true);

    // Kancelářská židle
    const chairAnalysis = discoverDomainParameters('ergonomická kancelářská židle');
    expect(chairAnalysis.parameters[0].id).toBe('chair_category_type');
    expect(chairAnalysis.parameters.some((p) => p.id === 'user_body_dimensions_spine')).toBe(true);

    // Matrace
    const mattressAnalysis = discoverDomainParameters('zdravotní ortopedická matrace');
    expect(mattressAnalysis.parameters[0].id).toBe('mattress_user_biometrics_health');
    expect(mattressAnalysis.parameters.some((p) => p.id === 'mattress_core_technology')).toBe(true);

    // Běžecké boty
    const shoeAnalysis = discoverDomainParameters('běžecké boty na maraton');
    expect(shoeAnalysis.parameters.some((p) => p.id === 'runner_weight' || p.id === 'foot_biometrics_anatomy' || p.id === 'foot_width')).toBe(true);
  });

  it('15. Luke VŽDY navrhne minimálně 10 parametrů pro KAŽDOU zkoumanou kategorii (napříč všemi 18 doménami i neznámým vstupem)', () => {
    const testQueries = [
      'elektroauto',
      'rodinné auto kombi',
      'běžecké boty',
      'pákový kávovar',
      'kancelářská židle',
      'herní notebook',
      'freestyle koloběžka',
      'sjezdové lyže',
      'chytrá televize oled',
      'robotický vysavač',
      'mobilní telefon smartphone',
      'automatická pračka',
      'sportovní hodinky garmin',
      'zdravotní matrace',
      'tepelné čerpadlo monoblok',
      'jízdní kolo',
      'kombinovaný kočárek',
      'robotická sekačka',
      'sportovní batoh s bederním pásem', // neznámá tělesná kategorie
      'vrtačka s příklepem' // neznámá technická kategorie
    ];

    for (const query of testQueries) {
      const result = discoverDomainParameters(query);
      expect(
        result.parameters.length,
        `Dotaz "${query}" musí mít minimálně 10 parametrů (má ${result.parameters.length})`
      ).toBeGreaterThanOrEqual(10);
    }
  });
});
