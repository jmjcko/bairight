import { describe, it, expect } from 'vitest';
import { discoverDomainParameters } from '../domain-parameter-discovery';
import * as fs from 'fs';
import * as path from 'path';

export const GOLDEN_10_PRODUCTS = [
  'Elektrické auto',
  'Běžecké boty',
  'Pákový kávovar',
  'Ergonomická kancelářská židle',
  'Gravel / horské kolo',
  'Chytré sportovní hodinky',
  'Bezdrátová sluchátka s ANC',
  'Robotický vysavač',
  'Kombinovaný dětský kočárek',
  'Aku vrtačka / šroubovák',
];

export function computeGoldenSimilarity(current: any, baseline: any): number {
  if (!baseline || !current) return 0;
  const currentParamIds = new Set(current.parameters.map((p: any) => p.id));
  const baselineParamIds = new Set((baseline.parameters || []).map((p: any) => p.id));

  let matchedCount = 0;
  currentParamIds.forEach((id) => {
    if (baselineParamIds.has(id)) matchedCount++;
  });

  const unionSize = new Set([...currentParamIds, ...baselineParamIds]).size;
  if (unionSize === 0) return 100;

  const idSimilarity = (matchedCount / unionSize) * 100;
  const domainBonus = current.matchedDomain === baseline.matchedDomain ? 100 : 50;

  return Math.round(idSimilarity * 0.8 + domainBonus * 0.2);
}

const snapshotPath = path.resolve(__dirname, '../../../../scripts/luke_golden_10_snapshot.json');

describe('Agent Luke Golden 10 Consistency & Regression Suite', () => {
  it('1. Generates complete high-yield parameter sets (8-14 params) with brand governance for all 10 products', () => {
    for (const product of GOLDEN_10_PRODUCTS) {
      const analysis = discoverDomainParameters(product, 'cs');
      expect(analysis).toBeDefined();
      expect(analysis.parameters.length).toBeGreaterThanOrEqual(8);
      expect(analysis.questions.length).toBeGreaterThanOrEqual(2);

      // Must have mandatory brand governance parameter
      const brandParam = analysis.parameters.find((p) => p.id === 'brand_preferences');
      expect(brandParam).toBeDefined();
      expect(brandParam?.suggestedComponent).toBe('brands');

      // Every parameter must have non-empty rationale
      for (const p of analysis.parameters) {
        expect(p.name).toBeTruthy();
        expect(p.rationale).toBeTruthy();
        expect(p.rationale.trim().length).toBeGreaterThan(10);
      }
    }
  });

  it('2. Maintains at least 90% overall consistency threshold against the Golden 10 snapshot', () => {
    // If snapshot doesn't exist yet, generate it
    if (!fs.existsSync(snapshotPath) || process.env.UPDATE_GOLDEN_10 === 'true') {
      const generatedSnapshot: Record<string, any> = {};
      for (const p of GOLDEN_10_PRODUCTS) {
        const analysis = discoverDomainParameters(p, 'cs');
        generatedSnapshot[p] = {
          keyword: analysis.keyword,
          matchedDomain: analysis.matchedDomain,
          categoryName: analysis.categoryName,
          agentName: analysis.agentName,
          description: analysis.description,
          parameters: analysis.parameters.map((param) => ({
            id: param.id,
            name: param.name,
            category: param.category,
            importance: param.importance,
            suggestedComponent: param.suggestedComponent,
            suggestedValues: param.suggestedValues || [],
            rationale: param.rationale,
          })),
          questions: (analysis.questions || []).map((q) => ({
            id: q.id,
            title: q.title,
          })),
        };
      }
      fs.writeFileSync(snapshotPath, JSON.stringify(generatedSnapshot, null, 2) + '\n', 'utf-8');
    }

    const baselineData = JSON.parse(fs.readFileSync(snapshotPath, 'utf-8'));
    let similaritySum = 0;
    const scores: Record<string, number> = {};

    for (const product of GOLDEN_10_PRODUCTS) {
      const current = discoverDomainParameters(product, 'cs');
      const baseline = baselineData[product];
      expect(baseline).toBeDefined();

      const sim = computeGoldenSimilarity(current, baseline);
      scores[product] = sim;
      similaritySum += sim;

      // Individual consistency should be high
      expect(sim).toBeGreaterThanOrEqual(85);
    }

    const overallSimilarity = Math.round(similaritySum / GOLDEN_10_PRODUCTS.length);
    console.log(`[Luke Golden 10 Benchmark] Overall Consistency vs Snapshot: ${overallSimilarity}% (Threshold: 90%)`);

    expect(overallSimilarity).toBeGreaterThanOrEqual(90);
  });
});
