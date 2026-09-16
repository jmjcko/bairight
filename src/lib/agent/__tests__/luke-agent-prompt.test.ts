import { describe, it, expect } from 'vitest';
import { buildLukeSystemPrompt } from '../luke-agent-prompt';

describe('Agent Luke System Prompt Specification', () => {
  it('builds system prompt with category query', () => {
    const prompt = buildLukeSystemPrompt('endurance silniční kolo', 'cs');
    expect(prompt).toContain('endurance silniční kolo');
    expect(prompt).toContain('SPECIFICITA POD-KATEGORIE');
    expect(prompt).toContain('brand_preferences');
  });

  it('supports English locale instructions', () => {
    const prompt = buildLukeSystemPrompt('endurance road bike', 'en');
    expect(prompt).toContain('endurance road bike');
    expect(prompt).toContain('English');
  });
});
