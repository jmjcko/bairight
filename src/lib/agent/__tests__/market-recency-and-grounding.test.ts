import { describe, it, expect } from 'vitest';
import { getMarketRecencyDirective, compileAgentSystemPrompt, PRESET_SHOE_AGENT } from '../universal-agent-schema';

describe('Market Recency Directive & Grounding Constraint Suite', () => {
  const currentYear = new Date().getFullYear();
  const minAllowedYear = currentYear - 2;

  it('1. getMarketRecencyDirective dynamically computes current year and current year - 2 max', () => {
    const directiveEN = getMarketRecencyDirective(true);
    const directiveCS = getMarketRecencyDirective(false);

    // English directive assertions
    expect(directiveEN).toContain(`Current Calendar / Market Year:** ${currentYear}`);
    expect(directiveEN).toContain(`Earliest Allowed Release / Model Year:** ${minAllowedYear}`);
    expect(directiveEN).toContain('CURRENT YEAR - 2 MAX');
    expect(directiveEN).toContain(`prior to ${minAllowedYear}`);

    // Czech directive assertions
    expect(directiveCS).toContain(`Aktuální rok trhu:** ${currentYear}`);
    expect(directiveCS).toContain(`Nejstarší povolený modelový rok / datum uvedení:** ${minAllowedYear}`);
    expect(directiveCS).toContain('SOUČASNÝ ROK - 2 MAX');
    expect(directiveCS).toContain(`před rokem ${minAllowedYear}`);
  });

  it('2. compileAgentSystemPrompt includes Market Recency Directive for both EN and CS', () => {
    const compiledEN = compileAgentSystemPrompt(PRESET_SHOE_AGENT, { budget_eur: 150 }, [], 'en');
    const compiledCS = compileAgentSystemPrompt(PRESET_SHOE_AGENT, { budget_eur: 150 }, [], 'cs');

    expect(compiledEN).toContain('MARKET RECENCY DIRECTIVE');
    expect(compiledEN).toContain(String(minAllowedYear));
    expect(compiledEN).toContain('STRICT PROHIBITION ON OUTDATED / DISCONTINUED MODELS');

    expect(compiledCS).toContain('ZÁVAZNÉ PRAVIDLO AKTUÁLNOSTI NABÍDKY');
    expect(compiledCS).toContain(String(minAllowedYear));
    expect(compiledCS).toContain('STRIKTNÍ ZÁKAZ STARÝCH A VYBĚHOVÝCH PRODUKTŮ');
  });

  it('3. Directive mandates automatic generational upgrade for legacy models', () => {
    const directiveEN = getMarketRecencyDirective(true);
    const directiveCS = getMarketRecencyDirective(false);

    expect(directiveEN).toContain('automatically upgrade to its modern active generation/successor');
    expect(directiveCS).toContain('provést automatický generační posun');
  });

  it('4. Directive enforces Direct Action Mandate prohibiting empty promises or deferred research', () => {
    const directiveEN = getMarketRecencyDirective(true);
    const directiveCS = getMarketRecencyDirective(false);

    expect(directiveEN).toContain('DIRECT ACTION MANDATE');
    expect(directiveEN).toContain('NEVER respond with an empty confirmation or future promise');
    expect(directiveEN).toContain('MUST IMMEDIATELY execute the research');

    expect(directiveCS).toContain('PŘÍKAZ OKAMŽITÉHO VÝKONU');
    expect(directiveCS).toContain('NIKDY neodpovídej pouhým zdvořilostním potvrzením');
    expect(directiveCS).toContain('MUSÍŠ OKAMŽITĚ v této jediné odpovědi provést kompletní průzkum');
  });
    it('5. compileAgentSystemPrompt enforces Mandatory 3-Model Output and Niche Relaxation Protocol in EN and CS', () => {
    const compiledEN = compileAgentSystemPrompt(PRESET_SHOE_AGENT, { budget_eur: 150 }, [], 'en');
    const compiledCS = compileAgentSystemPrompt(PRESET_SHOE_AGENT, { budget_eur: 150 }, [], 'cs');

    // English assertions
    expect(compiledEN).toContain('MANDATORY 3-MODEL OUTPUT REQUIREMENT');
    expect(compiledEN).toContain('Under NO circumstances are you allowed to output only 1 or 2 products!');
    expect(compiledEN).toContain('NICHE CONSTRAINT RELAXATION PROTOCOL');
    expect(compiledEN).toContain('closest top-tier market contenders');

    // Czech assertions
    expect(compiledCS).toContain('GARANCE PŘESNĚ 3 DOPORUČENÝCH PRODUKTŮ');
    expect(compiledCS).toContain('Za ŽÁDNÝCH okolností nesmíš vygenerovat pouze 1 nebo 2 modely!');
    expect(compiledCS).toContain('PROTOKOL PRO ÚZKÉ / NICHE POŽADAVKY');
    expect(compiledCS).toContain('nejbližší špičkové tržní alternativy');
  });

  it('6. Template structure specifies full distinct sections for all 3 models without ellipses (...)', () => {
    const compiledEN = compileAgentSystemPrompt(PRESET_SHOE_AGENT, { budget_eur: 150 }, [], 'en');
    const compiledCS = compileAgentSystemPrompt(PRESET_SHOE_AGENT, { budget_eur: 150 }, [], 'cs');

    // Ensure all 3 model headers exist
    expect(compiledEN).toContain('### 1. [Brand & Exact Model Name #1]');
    expect(compiledEN).toContain('### 2. [Brand & Exact Model Name #2]');
    expect(compiledEN).toContain('### 3. [Brand & Exact Model Name #3]');

    expect(compiledCS).toContain('### 1. [Značka a přesný název modelu #1]');
    expect(compiledCS).toContain('### 2. [Značka a přesný název modelu #2]');
    expect(compiledCS).toContain('### 3. [Značka a přesný název modelu #3]');

    // Ensure no standalone ellipses line exists under model sections
    expect(compiledEN).not.toMatch(/### 2\..*?\n\.\.\./);
    expect(compiledEN).not.toMatch(/### 3\..*?\n\.\.\./);
    expect(compiledCS).not.toMatch(/### 2\..*?\n\.\.\./);
    expect(compiledCS).not.toMatch(/### 3\..*?\n\.\.\./);
  });
});
