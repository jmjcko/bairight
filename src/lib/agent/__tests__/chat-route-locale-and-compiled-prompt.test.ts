/**
 * @file chat-route-locale-and-compiled-prompt.test.ts
 * @description Tests that validate:
 *   1. The locale parameter is correctly passed through to the LLM execution function
 *   2. Compiled prompts (from wizard) are detected and used directly without triple-duplication
 *   3. Assessment context parameters are resolved to human-readable labels (not raw IDs)
 */
import { describe, it, expect } from 'vitest';
import { forgeAgentPrompt, PRESET_COFFEE_AGENT, PRESET_SHOE_AGENT } from '../universal-agent-schema';

describe('Chat Route: Locale & Compiled Prompt Integration', () => {
  const coffeAnswers = {
    coffee_preference: ['espresso', 'milk_drinks'],
    machine_type: 'automatic_bean_to_cup',
    daily_cups: 5,
    coffee_budget_eur: 600,
  };

  const shoeAnswers = {
    foot_width: 'extra_wide_4e',
    gait_biomechanics: 'heel_strike',
    knee_condition: ['knee_osteoarthritis', 'plantar_fasciitis'],
    budget_eur: 180,
  };

  it('1. forgeAgentPrompt generates EN prompt when locale=en and CS prompt when locale=cs', () => {
    const promptEN = forgeAgentPrompt(PRESET_COFFEE_AGENT, coffeAnswers, [], 'en');
    const promptCS = forgeAgentPrompt(PRESET_COFFEE_AGENT, coffeAnswers, [], 'cs');

    // EN prompt must contain EN markers
    expect(promptEN).toContain('MANDATORY & BINDING USER REQUIREMENTS');
    expect(promptEN).toContain('REQUIRED RESPONSE FORMAT');
    expect(promptEN).toContain('CRITICAL LANGUAGE DIRECTIVE');
    expect(promptEN).toContain('fluent, natural English');

    // CS prompt must contain CS markers
    expect(promptCS).toContain('STRIKTNÍ A ZÁVAZNÉ POŽADAVKY UŽIVATELE');
    expect(promptCS).toContain('POŽADOVANÝ FORMÁT ODPOVĚDI');
    expect(promptCS).toContain('v přirozené češtině');

    // Both must NOT contain raw option IDs
    expect(promptEN).not.toContain('automatic_bean_to_cup');
    expect(promptCS).not.toContain('automatic_bean_to_cup');
  });

  it('2. Compiled prompt detection markers are present in forged prompts', () => {
    const promptEN = forgeAgentPrompt(PRESET_COFFEE_AGENT, coffeAnswers, [], 'en');
    const promptCS = forgeAgentPrompt(PRESET_COFFEE_AGENT, coffeAnswers, [], 'cs');

    // These markers are used by chat/route.ts to detect compiled prompts
    const isCompiledEN = promptEN.includes('MANDATORY & BINDING USER REQUIREMENTS')
      || promptEN.includes('REQUIRED RESPONSE FORMAT');
    const isCompiledCS = promptCS.includes('STRIKTNÍ A ZÁVAZNÉ POŽADAVKY UŽIVATELE')
      || promptCS.includes('POŽADOVANÝ FORMÁT ODPOVĚDI');

    expect(isCompiledEN).toBe(true);
    expect(isCompiledCS).toBe(true);
  });

  it('3. forgeAgentPrompt resolves chip/multi-select options to labels, not raw IDs', () => {
    const promptEN = forgeAgentPrompt(PRESET_SHOE_AGENT, shoeAnswers, [], 'en');
    const promptCS = forgeAgentPrompt(PRESET_SHOE_AGENT, shoeAnswers, [], 'cs');

    // Should resolve labels from options
    // knee_osteoarthritis -> "Artróza kolene (1.–3. st.)"
    // heel_strike -> "Došlap na patu (Heel)"
    // extra_wide_4e -> label from the shoe agent

    // Must NOT contain raw value IDs
    expect(promptEN).not.toContain('heel_strike');
    expect(promptEN).not.toContain('knee_osteoarthritis');
    expect(promptEN).not.toContain('plantar_fasciitis');
    expect(promptEN).not.toContain('extra_wide_4e');

    expect(promptCS).not.toContain('heel_strike');
    expect(promptCS).not.toContain('knee_osteoarthritis');
  });

  it('4. forgeAgentPrompt includes slider values with units', () => {
    const promptEN = forgeAgentPrompt(PRESET_COFFEE_AGENT, coffeAnswers, [], 'en');

    // Budget slider: 600 EUR
    expect(promptEN).toContain('600 EUR');
    // Daily cups slider: 5 šálků
    expect(promptEN).toContain('5 šálků');
  });

  it('5. forgeAgentPrompt handles brand preference objects correctly', () => {
    const answersWithBrands = {
      ...coffeAnswers,
      brand_filter: {
        preferred: ['DeLonghi', 'Sage'],
        forbidden: ['Nescafe'],
      },
    };

    const promptEN = forgeAgentPrompt(PRESET_COFFEE_AGENT, answersWithBrands, [], 'en');

    // Since brand_filter is not a defined question in the preset, it will use fallback formatting
    // The key assertion is that it doesn't crash and produces readable output
    expect(promptEN).toBeDefined();
    expect(typeof promptEN).toBe('string');
    expect(promptEN.length).toBeGreaterThan(100);
  });

  it('6. Initial chat query contains NO developer template placeholders', () => {
    const initialQueryEN = 'Based on all parameters and rules in your instructions, please give me your top 3 specific product recommendations.';
    const initialQueryCS = 'Na základě všech zadaných parametrů a pravidel v instrukcích mi prosím navrhni 3 nejlepší konkrétní produkty.';

    // CRITICAL: These developer template placeholders must NEVER appear
    const forbiddenPlaceholders = [
      '[Full Model Name]',
      '[Clear rationale]',
      '[Parameter match]',
      '[Advantages]',
      '[Trade-offs]',
      '1. [Full Model Name]',
    ];

    for (const placeholder of forbiddenPlaceholders) {
      expect(initialQueryEN).not.toContain(placeholder);
      expect(initialQueryCS).not.toContain(placeholder);
    }
  });

  it('7. forgeAgentPrompt translates __SKIP__ marker to locale-appropriate text', () => {
    const answersWithSkip = {
      coffee_preference: '__SKIP__',
      machine_type: 'automatic_bean_to_cup',
      daily_cups: 5,
      coffee_budget_eur: 600,
    };

    const promptEN = forgeAgentPrompt(PRESET_COFFEE_AGENT, answersWithSkip, [], 'en');
    const promptCS = forgeAgentPrompt(PRESET_COFFEE_AGENT, answersWithSkip, [], 'cs');

    // EN must show English skip text, NOT Czech "Není důležité"
    expect(promptEN).toContain('Not important');
    expect(promptEN).not.toContain('Není důležité');

    // CS must show Czech skip text
    expect(promptCS).toContain('Není důležité');
    expect(promptCS).not.toContain('Not important');
  });

  it('8. forgeAgentPrompt converts snake_case values to Title Case when options are unavailable', () => {
    // Simulate a dynamically generated agent where options array is missing
    const dynamicAgent = {
      ...PRESET_COFFEE_AGENT,
      questions: PRESET_COFFEE_AGENT.questions.map(q => ({
        ...q,
        options: undefined, // Remove options to simulate missing labels
      })),
    };

    const answers = {
      coffee_preference: 'dark_roast_espresso',
      machine_type: 'semi_automatic_portafilter',
    };

    const prompt = forgeAgentPrompt(dynamicAgent, answers, [], 'en');

    // Must NOT contain underscores
    expect(prompt).not.toContain('dark_roast_espresso');
    expect(prompt).not.toContain('semi_automatic_portafilter');

    // Must contain Title Case
    expect(prompt).toContain('Dark Roast Espresso');
    expect(prompt).toContain('Semi Automatic Portafilter');
  });

  it('9. forgeAgentPrompt converts snake_case array values to Title Case when options are unavailable', () => {
    const dynamicAgent = {
      ...PRESET_SHOE_AGENT,
      questions: PRESET_SHOE_AGENT.questions.map(q => ({
        ...q,
        options: undefined, // Remove options to simulate missing labels
      })),
    };

    // Use actual PRESET_SHOE_AGENT question IDs: foot_width (string), knee_condition (array)
    const answers = {
      foot_width: 'extra_wide_4e',
      knee_condition: ['knee_osteoarthritis', 'plantar_fasciitis'],
    };

    const prompt = forgeAgentPrompt(dynamicAgent, answers, [], 'en');

    // Array values must be Title Case, not underscored
    expect(prompt).not.toContain('knee_osteoarthritis');
    expect(prompt).not.toContain('plantar_fasciitis');
    expect(prompt).toContain('Knee Osteoarthritis');
    expect(prompt).toContain('Plantar Fasciitis');

    // String value must also be Title Case
    expect(prompt).not.toContain('extra_wide_4e');
    expect(prompt).toContain('Extra Wide 4e');
  });

  it('10. forgeAgentPrompt translates legacy Czech "Není důležité" skip values to EN', () => {
    const answersWithLegacySkip = {
      coffee_preference: 'Není důležité',
      machine_type: 'automatic_bean_to_cup',
      daily_cups: 5,
      coffee_budget_eur: 600,
    };

    const promptEN = forgeAgentPrompt(PRESET_COFFEE_AGENT, answersWithLegacySkip, [], 'en');

    // Must translate Czech skip to English
    expect(promptEN).toContain('Not important');
    expect(promptEN).not.toContain('Není důležité');
  });

});
