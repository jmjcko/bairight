filepath = '/Users/jan.mynar/Documents/GitHub/bairight/src/lib/agent/__tests__/chat-route-locale-and-compiled-prompt.test.ts'
with open(filepath, 'r') as f:
    content = f.read()

# Fix test 9: use actual PRESET_SHOE_AGENT question IDs
old_test9 = """  it('9. forgeAgentPrompt converts snake_case array values to Title Case when options are unavailable', () => {
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
  });"""

new_test9 = """  it('9. forgeAgentPrompt converts snake_case array values to Title Case when options are unavailable', () => {
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
  });"""

content = content.replace(old_test9, new_test9)

with open(filepath, 'w') as f:
    f.write(content)

print("Done: test 9 fixed")
