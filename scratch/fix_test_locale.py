filepath = '/Users/jan.mynar/Documents/GitHub/bairight/src/lib/agent/__tests__/chat-route-locale-and-compiled-prompt.test.ts'
with open(filepath, 'r') as f:
    content = f.read()

# Add new tests for __SKIP__ and underscore resolution
new_tests = """
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
        options: undefined,
      })),
    };

    const answers = {
      gait_biomechanics: 'heel_strike',
      knee_condition: ['knee_osteoarthritis', 'plantar_fasciitis'],
    };

    const prompt = forgeAgentPrompt(dynamicAgent, answers, [], 'en');

    expect(prompt).not.toContain('heel_strike');
    expect(prompt).not.toContain('knee_osteoarthritis');
    expect(prompt).not.toContain('plantar_fasciitis');
    expect(prompt).toContain('Heel Strike');
    expect(prompt).toContain('Knee Osteoarthritis');
    expect(prompt).toContain('Plantar Fasciitis');
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
"""

# Insert before the closing }); of the describe block
content = content.rstrip()
if content.endswith('});'):
    content = content[:-3] + new_tests + '\n});\n'

with open(filepath, 'w') as f:
    f.write(content)

print("Done: added 4 new tests for skip/underscore handling")
