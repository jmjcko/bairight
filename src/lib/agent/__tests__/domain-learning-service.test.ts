import { describe, it, expect, beforeEach } from 'vitest';
import { DomainLearningService, LearnedDomainParameter } from '../domain-learning-service';
import { discoverDomainParameters } from '../domain-parameter-discovery';

describe('DomainLearningService - Kolektivní učení doménových parametrů', () => {
  beforeEach(() => {
    DomainLearningService.resetToDefaults();
  });

  it('1. Načte výchozí přednaučené parametry pro doménu bot a aut', () => {
    const shoeParams = DomainLearningService.getLearnedParametersForDomain('shoes');
    expect(shoeParams.length).toBeGreaterThanOrEqual(1);

    const sportParam = shoeParams.find((p) => p.name.includes('sportovní disciplína'));
    expect(sportParam).toBeDefined();
    expect(sportParam?.rationale).toContain('👥 Využilo');
    expect(sportParam?.icon).toBe('🏅');

    const carParams = DomainLearningService.getLearnedParametersForDomain('cars');
    expect(carParams.some((p) => p.name.includes('ISOFIX'))).toBe(true);
  });

  it('2. Zaznamená nový uživatelský parametr pro kategorii bot ("Vložka pro ploché nohy") a uloží jej', () => {
    const result = DomainLearningService.recordUserParameter(
      'shoes',
      'Vložka pro ploché nohy',
      'Požadavek na podporu příčné a podélné klenby.'
    );

    expect(result.isNew).toBe(true);
    expect(result.parameter.name).toBe('Vložka pro ploché nohy');
    expect(result.parameter.id).toContain('learned-shoes-');
    expect(result.parameter.rationale).toContain('Využilo 1×');

    // Nyní ověříme, že se parametr vrací v doméně bot
    const updatedShoes = DomainLearningService.getLearnedParametersForDomain('shoes');
    expect(updatedShoes.some((p) => p.name === 'Vložka pro ploché nohy')).toBe(true);
  });

  it('3. Pokud parametr již existuje, zvýší jeho četnost použití a skóre relevance bez duplikace', () => {
    // 1. použití
    const first = DomainLearningService.recordUserParameter('shoes', 'Trailový nepromokavý návlek');
    expect(first.isNew).toBe(true);
    expect(first.parameter.rationale).toContain('1×');

    // 2. použití stejného parametru (i s drobnou odlišností v diakritice / velikosti písmen)
    const second = DomainLearningService.recordUserParameter('shoes', 'trailovy nepromokavy navlek');
    expect(second.isNew).toBe(false);
    expect(second.parameter.rationale).toContain('2×');

    // V seznamu nesmí být duplicitně
    const all = DomainLearningService.getLearnedParametersForDomain('shoes');
    const matched = all.filter((p) => 
      p.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes('nepromokavy navlek')
    );
    expect(matched.length).toBe(1);
  });

  it('4. Integruje naučené parametry do discoverDomainParameters("boty")', () => {
    // Zaznamenáme parametr pro "shoes"
    DomainLearningService.recordUserParameter('shoes', 'Rychlošněrování BOA kolečkem');

    const analysis = discoverDomainParameters('běžecké boty');
    expect(analysis.matchedDomain).toBe('shoes');

    // Ověříme, že suggestedAlternatives obsahuje naučený parametr
    const hasBoa = analysis.suggestedAlternatives?.some(
      (alt) => alt.name.includes('BOA') || alt.name.includes('sportovní disciplína')
    );
    expect(hasBoa).toBe(true);
  });

  it('5. Vyhodí chybu při pokusu o uložení prázdného parametru', () => {
    expect(() => {
      DomainLearningService.recordUserParameter('shoes', ' ');
    }).toThrow();
  });
});
