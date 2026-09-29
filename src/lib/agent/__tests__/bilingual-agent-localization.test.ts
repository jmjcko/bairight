import { describe, it, expect } from 'vitest';
import { getLocalizedAgent } from '../agent-localization';
import { discoverDomainParameters } from '../domain-parameter-discovery';
import { UniversalAgentDefinition } from '../universal-agent-schema';

describe('Bilingual Agent Localization & Card Data Formatting (PRD v1)', () => {
  it('1. Correctly translates Czech saved custom agent card to English when EN locale is active', () => {
    const rawCzAgent: UniversalAgentDefinition = {
      id: 'custom_notebook_123',
      name: 'bAIright: Specialista na notebook',
      category: 'Nákupní výběr pro notebook',
      description: 'Nákupní poradce vyladěný na míru s 10 klíčovými parametry.',
      icon: '',
      version: '1.0.0',
      systemPrompt: 'prompt',
      createdAt: '2026-09-01',
      questions: [],
    };

    const localizedEn = getLocalizedAgent(rawCzAgent, 'en');

    expect(localizedEn).not.toBeNull();
    expect(localizedEn?.name).toBe('bAIright: Specialist in notebook');
    expect(localizedEn?.category).toBe('Shopping selection for notebook');
    expect(localizedEn?.description).toBe('Custom shopping agent tailored with 10 key parameters.');
  });

  it('2. Correctly translates English custom agent card back to Czech when CS locale is active', () => {
    const rawEnAgent: UniversalAgentDefinition = {
      id: 'custom_notebook_456',
      name: 'bAIright: Specialist in espresso machine',
      category: 'Shopping selection for espresso machine',
      description: 'Custom shopping agent tailored with 8 key parameters.',
      icon: '',
      version: '1.0.0',
      systemPrompt: 'prompt',
      createdAt: '2026-09-01',
      questions: [],
    };

    const localizedCz = getLocalizedAgent(rawEnAgent, 'cs');

    expect(localizedCz).not.toBeNull();
    expect(localizedCz?.name).toBe('bAIright: Specialista na espresso machine');
    expect(localizedCz?.category).toBe('Nákupní výběr pro espresso machine');
    expect(localizedCz?.description).toBe('Nákupní poradce vyladěný na míru s 8 klíčovými parametry.');
  });

  it('3. Translates Managed Agent definitions based on requested locale', () => {
    const managedShoe: UniversalAgentDefinition = {
      id: 'managed_running_shoes',
      name: 'Běžecká & ortopedická obuv',
      category: 'Sport & Zdraví',
      description: 'CZ desc',
      icon: '',
      version: '1.0.0',
      systemPrompt: 'prompt',
      createdAt: '2026-09-01',
      isManaged: true,
      questions: [],
    };

    const localizedEn = getLocalizedAgent(managedShoe, 'en');

    expect(localizedEn).not.toBeNull();
    expect(localizedEn?.name).toBe('Running & Orthopedic Footwear');
    expect(localizedEn?.category).toBe('Sports & Health');
  });
  it('4. Synthesizes 100% English parameter tiles and headers when discoverDomainParameters is called with EN locale', () => {
    const analysis = discoverDomainParameters('air fryer', 'en');

    expect(analysis.categoryName).toBe('Shopping selection for air fryer');
    expect(analysis.agentName).toBe('bAIright: Specialist in air fryer');
    expect(analysis.parameters.length).toBeGreaterThanOrEqual(8);

    const czNames = analysis.parameters.filter(p => p.name.includes('Typ &') || p.name.includes('Velikost &') || p.name === 'Značky a výrobci');
    expect(czNames.length).toBe(0);

    const brandParam = analysis.parameters.find(p => p.id === 'brand_preferences');
    expect(brandParam?.name).toBe('Brands & Manufacturers');
  });

});
