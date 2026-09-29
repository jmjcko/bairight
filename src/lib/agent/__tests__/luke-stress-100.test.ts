import { describe, it, expect } from 'vitest';
import { LUKE_100_CATEGORIES, validateAnalysisQuality, computeAnalysisSimilarity } from '../../../../scripts/luke_stress_test_100';
import { discoverDomainParameters } from '../domain-parameter-discovery';
import * as fs from 'fs';
import * as path from 'path';

describe('Agent Luke 100 Categories Benchmark & Quality Suite', () => {
  it('contains exactly 100 categories divided into 4 groups', () => {
    expect(LUKE_100_CATEGORIES).toHaveLength(4);
    const totalItems = LUKE_100_CATEGORIES.reduce((acc, g) => acc + g.items.length, 0);
    expect(totalItems).toBe(100);
  });

  LUKE_100_CATEGORIES.forEach((group) => {
    describe(`Group: ${group.name}`, () => {
      // Test sample items from each group for quality compliance
      group.items.slice(0, 5).forEach((item) => {
        it(`generates high-yield parameters for "${item}"`, () => {
          const analysis = discoverDomainParameters(item);
          expect(analysis).toBeDefined();
          expect(analysis.parameters.length).toBeGreaterThanOrEqual(10);
          expect(analysis.questions.length).toBeGreaterThanOrEqual(2);

          const validation = validateAnalysisQuality(item, analysis);
          expect(validation.hasCorporateJargon).toBe(false);
          expect(validation.invalidNameLengths).toHaveLength(0);
        });
      });
    });
  });

  it('achieves at least 80% similarity threshold against golden baseline snapshot', () => {
    const baselineFilePath = path.join(__dirname, '../../../../scripts/luke_100_golden_baseline.json');
    expect(fs.existsSync(baselineFilePath)).toBe(true);

    const baselineData = JSON.parse(fs.readFileSync(baselineFilePath, 'utf-8'));
    let totalItems = 0;
    let similaritySum = 0;

    LUKE_100_CATEGORIES.forEach((group) => {
      group.items.forEach((item) => {
        totalItems++;
        const analysis = discoverDomainParameters(item);
        const similarity = computeAnalysisSimilarity(analysis, baselineData[item]);
        similaritySum += similarity;
      });
    });

    const overallSimilarity = Math.round(similaritySum / totalItems);
    console.log(`[Vitest Benchmark] Overall Similarity vs Baseline: ${overallSimilarity}% (Threshold: 80%)`);
    expect(overallSimilarity).toBeGreaterThanOrEqual(80);
  });
});
