import { describe, it, expect, beforeEach } from 'vitest';
import { resolveAgentIcon } from '../universal-agent-schema';
import { AgentStorageService } from '../agent-storage-service';

describe('Agent Icon Resolution & Zero-Emoji Sanitation Suite', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('1. Enforces Zero-Emoji policy by returning empty string for Material Icon strings', () => {
    const icon = resolveAgentIcon('SportsBasketball', 'Basketball Selection Expert');
    expect(icon).toBe('');
  });

  it('2. Enforces Zero-Emoji policy by stripping emojis', () => {
    expect(resolveAgentIcon('🏀')).toBe('');
    expect(resolveAgentIcon('☕')).toBe('');
    expect(resolveAgentIcon('👟')).toBe('');
    expect(resolveAgentIcon('🚲')).toBe('');
  });

  it('3. Enforces Zero-Emoji policy for common product categories and contextText', () => {
    expect(resolveAgentIcon('CoffeeMaker')).toBe('');
    expect(resolveAgentIcon('directions_bike')).toBe('');
    expect(resolveAgentIcon('', 'Specialista na běžeckou obuv')).toBe('');
    expect(resolveAgentIcon(undefined, 'Espresso machine consultant')).toBe('');
    expect(resolveAgentIcon(undefined, 'Gaming laptop advisor')).toBe('');
  });

  it('4. Never returns raw string or emoji fallback', () => {
    const icon = resolveAgentIcon('UnknownRandomIconNameXYZ', 'Unknown Category');
    expect(icon).toBe('');
  });

  it('5. AgentStorageService normalizes stored icon to empty string on load and save', () => {
    AgentStorageService.saveAgent({
      id: 'basketball_agent_test',
      name: 'Basketball Selection Expert',
      category: 'Sports',
      icon: 'SportsBasketball',
      version: '1.0.0',
      description: 'Expert for basketball gear',
      systemPrompt: 'You are an expert.',
      questions: [],
      createdAt: new Date().toISOString(),
      isCustom: true,
    });

    const loaded = AgentStorageService.getAllAgents();
    const found = loaded.find((a) => a.id === 'basketball_agent_test');
    expect(found).toBeDefined();
    expect(found?.icon).toBe('');
  });
});
