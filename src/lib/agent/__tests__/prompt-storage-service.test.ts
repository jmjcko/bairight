import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PromptStorageService, CompletedPromptRecord } from '../prompt-storage-service';

describe('PromptStorageService: Ukládání výhradně hotových promptů po posledním kroku', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('1. Úložiště je zpočátku prázdné', () => {
    const prompts = PromptStorageService.getCompletedPrompts();
    expect(prompts).toEqual([]);
  });

  it('2. Uloží hotový prompt po dokončení dotazníku a vrátí ho v getCompletedPrompts', () => {
    const saved = PromptStorageService.saveCompletedPrompt({
      agentId: 'running_shoes',
      agentName: 'Podiatrický Agent v1.1',
      category: 'Footwear & Orthotics',
      prompt: 'Jsi přední biomechanický expert... EU 43, 2E wide...',
      answersSummary: 'EU 43 (275 mm), 2E wide',
    });

    expect(saved.id).toBeDefined();
    expect(saved.prompt).toContain('Jsi přední biomechanický expert');
    expect(saved.dateFormatted).toBeDefined();

    const stored = PromptStorageService.getCompletedPrompts();
    expect(stored.length).toBe(1);
    expect(stored[0].prompt).toBe(saved.prompt);
    expect(stored[0].agentName).toBe('Podiatrický Agent v1.1');
  });

  it('3. Mazání konkrétního promptu z úložiště', () => {
    const p1 = PromptStorageService.saveCompletedPrompt({
      agentId: 'agent-1',
      agentName: 'Agent 1',
      category: 'Cat 1',
      prompt: 'Prompt 1 text',
    });

    const p2 = PromptStorageService.saveCompletedPrompt({
      agentId: 'agent-2',
      agentName: 'Agent 2',
      category: 'Cat 2',
      prompt: 'Prompt 2 text',
    });

    expect(PromptStorageService.getCompletedPrompts().length).toBe(2);

    const deleted = PromptStorageService.deleteCompletedPrompt(p1.id);
    expect(deleted).toBe(true);

    const remaining = PromptStorageService.getCompletedPrompts();
    expect(remaining.length).toBe(1);
    expect(remaining[0].id).toBe(p2.id);
  });

  it('4. Zabrání duplikaci při rychlém dvojkliku na odeslání hotového kroku', () => {
    PromptStorageService.saveCompletedPrompt({
      agentId: 'auto_expert',
      agentName: 'Auto Poradce',
      category: 'Automotive',
      prompt: 'Hledám rodinné kombi v benzínu...',
    });

    // Druhé volání s totožným promptem bezprostředně poté
    PromptStorageService.saveCompletedPrompt({
      agentId: 'auto_expert',
      agentName: 'Auto Poradce',
      category: 'Automotive',
      prompt: 'Hledám rodinné kombi v benzínu...',
    });

    const list = PromptStorageService.getCompletedPrompts();
    expect(list.length).toBe(1);
  });

  it('5. Promazání všech hotových promptů (clearAll)', () => {
    PromptStorageService.saveCompletedPrompt({
      agentId: 'agent-a',
      agentName: 'Agent A',
      category: 'Cat A',
      prompt: 'Prompt A',
    });
    expect(PromptStorageService.getCompletedPrompts().length).toBe(1);

    PromptStorageService.clearAll();
    expect(PromptStorageService.getCompletedPrompts().length).toBe(0);
  });
});
