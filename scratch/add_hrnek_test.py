with open('src/lib/agent/__tests__/domain-parameter-discovery.test.ts', 'r') as f:
    content = f.read()

test_code = '''
  it('16. Detekuje kategorii stolování a hrnků ("hrnek", "termohrnek", "sklenice") a odvodí materiál, objem, myčku a termoizolaci BEZ zmínek o servisu či pojistkách', () => {
    const analysis = discoverDomainParameters('chtěl bych koupit hrnek');
    expect(analysis.matchedDomain).toBe('household_drinkware');
    expect(analysis.parameters.some((p) => p.id === 'material_type_build')).toBe(true);
    expect(analysis.parameters.some((p) => p.id === 'volume_capacity')).toBe(true);
    expect(analysis.parameters.some((p) => p.id === 'dishwasher_microwave')).toBe(true);
    expect(analysis.parameters.some((p) => p.id === 'thermal_insulation')).toBe(true);

    // Nesmí obsahovat irelevantní elektropojistky a servis náhradních dílů po 2 letech
    const allRationale = analysis.parameters.map((p) => p.rationale.toLowerCase()).join(' ');
    expect(allRationale).not.toContain('tepelná pojistka');
    expect(allRationale).not.toContain('náhradní díly v čr');
    expect(allRationale).not.toContain('plastové spojky');
  });
});
'''

if 'Detekuje kategorii stolování a hrnků' not in content:
    content = content.rstrip().rstrip('});') + test_code
    with open('src/lib/agent/__tests__/domain-parameter-discovery.test.ts', 'w') as f:
        f.write(content)
    print('Successfully added hrnek test')
else:
    print('Hrnek test already exists')
