import { describe, it, expect } from 'vitest';
import { 
  PRESET_SHOE_AGENT, 
  PRESET_ERGO_CHAIR_AGENT, 
  PRESET_COFFEE_AGENT, 
  serializeAgentToMarkdown, 
  parseAgentFromMarkdown, 
  forgeAgentPrompt,
  UniversalAgentDefinition 
} from '../universal-agent-schema';
import { AgentStorageService } from '../agent-storage-service';

describe('Universal Agent Schema & Markdown Parser (PRD v1)', () => {
  it('1. Serializes UniversalAgentDefinition into Markdown with YAML frontmatter and parses it back', () => {
    const markdown = serializeAgentToMarkdown(PRESET_ERGO_CHAIR_AGENT);

    expect(markdown).toContain('---');
    expect(markdown).toContain('"id": "ergo_seating"');
    expect(markdown).toContain('# System Prompt & Evaluation Directives');
    expect(markdown).toContain('certifikovaný ergonom');

    // Parse it back
    const parsed = parseAgentFromMarkdown(markdown);
    expect(parsed.id).toBe('ergo_seating');
    expect(parsed.name).toBe('Ergonomické sezení & kancelář');
    expect(parsed.questions.length).toBeGreaterThan(0);
    expect(parsed.systemPrompt).toContain('certifikovaný ergonom');
  });

  it('2. forgeAgentPrompt constructs structured prompt with answers and RAG facts', () => {
    const answers = {
      daily_hours: 10,
      spine_pain_areas: ['lumbar_pain', 'cervical_pain'],
      body_height_cm: 188,
      chair_budget: 'premium_tier',
    };

    const ragFacts = [
      { fact: 'Prodělaná operace ploténky L5-S1 v roce 2023', category: 'medical' },
      { fact: 'Preference síťovaného opěráku', category: 'preference' },
    ];

    const prompt = forgeAgentPrompt(PRESET_ERGO_CHAIR_AGENT, answers, ragFacts);

    expect(prompt).toContain('### ZADANÉ POŽADAVKY A PARAMETRY UŽIVATELE:');
    expect(prompt).toContain('10 hodin/den');
    expect(prompt).toContain('188 cm');
    expect(prompt).toContain('lumbar_pain, cervical_pain');
    expect(prompt).toContain('Prodělaná operace ploténky L5-S1');
    expect(prompt).toContain('FORMÁT ODPOVĚDI:');
  });

  it('3. AgentStorageService starts with zero default presets per product decision', () => {
    AgentStorageService.resetToDefaults();
    const agents = AgentStorageService.getAllAgents();
    expect(agents).toEqual([]);
  });

  it('4. AgentStorageService allows saving and deleting custom agents', () => {
    AgentStorageService.resetToDefaults();
    const customAgent = {
      ...PRESET_ERGO_CHAIR_AGENT,
      id: 'custom_chair_test',
      name: 'Moje ergonomická židle',
    };

    AgentStorageService.saveAgent(customAgent);
    expect(AgentStorageService.getAllAgents().some((a) => a.id === 'custom_chair_test')).toBe(true);

    const deleted = AgentStorageService.deleteAgent('custom_chair_test');
    expect(deleted).toBe(true);
    expect(AgentStorageService.getAllAgents().some((a) => a.id === 'custom_chair_test')).toBe(false);
  });

  it('5. AgentStorageService.deleteAllAgents removes all custom agents and keeps library empty', () => {
    AgentStorageService.saveAgent({
      ...PRESET_SHOE_AGENT,
      id: 'test_shoe_agent',
    });
    expect(AgentStorageService.getAllAgents().length).toBe(1);

    AgentStorageService.deleteAllAgents();
    expect(AgentStorageService.getAllAgents()).toEqual([]);
  });
});
