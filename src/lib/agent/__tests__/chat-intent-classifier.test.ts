import { describe, it, expect } from 'vitest';
import { classifyChatIntent, stripReportTemplateFromPrompt } from '../chat-intent-classifier';

describe('chat-intent-classifier: robust classification and template stripping', () => {
  describe('stripReportTemplateFromPrompt', () => {
    it('strips Czech format header and markdown report', () => {
      const prompt = `Jsi expert na kitesurfing.
Závazné požadavky uživatele:
- Rozpočet: 40000 CZK
- Zkušenost: mírně pokročilý

### POŽADOVANÝ FORMÁT ODPOVĚDI (HUMAN-READABLE MARKDOWN):
# Expertní nákupní doporučení: Kitesurfing
## Top 3 Doporučené Modely
### 1. Duotone Rebel`;

      const stripped = stripReportTemplateFromPrompt(prompt);
      expect(stripped).toContain('Jsi expert na kitesurfing.');
      expect(stripped).toContain('Rozpočet: 40000 CZK');
      expect(stripped).not.toContain('POŽADOVANÝ FORMÁT ODPOVĚDI');
      expect(stripped).not.toContain('Expertní nákupní doporučení');
      expect(stripped).not.toContain('Duotone Rebel');
    });

    it('strips English format header and markdown report', () => {
      const prompt = `You are an expert shoe consultant.
Parameters:
- Width: Wide 2E

### REQUIRED RESPONSE FORMAT (HUMAN-READABLE MARKDOWN):
# Expert Purchasing Recommendation: Shoes
## Top 3 Recommended Models`;

      const stripped = stripReportTemplateFromPrompt(prompt);
      expect(stripped).toContain('You are an expert shoe consultant.');
      expect(stripped).toContain('Width: Wide 2E');
      expect(stripped).not.toContain('REQUIRED RESPONSE FORMAT');
      expect(stripped).not.toContain('Expert Purchasing Recommendation');
    });

    it('handles prompts without templates gracefully', () => {
      const prompt = 'Jsi nákupní poradce pro běžeckou obuv.';
      expect(stripReportTemplateFromPrompt(prompt)).toBe(prompt);
    });
  });

  describe('classifyChatIntent - conversational dialogue', () => {
    it('classifies direct questions about brands or choices as conversational_dialogue', () => {
      // Exact user query that exposed the bug
      expect(classifyChatIntent('proč mi nabízíš pouze duotone?')).toBe('conversational_dialogue');
      expect(classifyChatIntent('proc mi nabizis pouze duotone')).toBe('conversational_dialogue');
      expect(classifyChatIntent('proč mi nabízíš pouze jednu značku?')).toBe('conversational_dialogue');
      expect(classifyChatIntent('proč zrovna duotone a ne jinou značku?')).toBe('conversational_dialogue');
      expect(classifyChatIntent('proč tam není značka Core?')).toBe('conversational_dialogue');
      expect(classifyChatIntent('jaktože mi nenabízíš Core XR8?')).toBe('conversational_dialogue');
      expect(classifyChatIntent('proč zrovna tyto tři?')).toBe('conversational_dialogue');
      expect(classifyChatIntent('a co značka Cabrinha nebo Ozone?')).toBe('conversational_dialogue');
      expect(classifyChatIntent('why are you only offering duotone?')).toBe('conversational_dialogue');
      expect(classifyChatIntent('why only one brand?')).toBe('conversational_dialogue');
      expect(classifyChatIntent('why did you recommend this specific brand?')).toBe('conversational_dialogue');
    });

    it('classifies comparisons and differences as conversational_dialogue', () => {
      expect(classifyChatIntent('jaký je rozdíl mezi prvním a druhým modelem?')).toBe('conversational_dialogue');
      expect(classifyChatIntent('srovnej mi model Bondi a Ghost Max')).toBe('conversational_dialogue');
      expect(classifyChatIntent('porovnej výhody a nevýhody')).toBe('conversational_dialogue');
      expect(classifyChatIntent('Duotone Rebel vs Dice')).toBe('conversational_dialogue');
      expect(classifyChatIntent('what is the difference between model 1 and 2?')).toBe('conversational_dialogue');
      expect(classifyChatIntent('compare Herman Miller vs Steelcase')).toBe('conversational_dialogue');
    });

    it('classifies questions inquiring about price, specs, weight as conversational_dialogue', () => {
      expect(classifyChatIntent('kolik ten první model váží?')).toBe('conversational_dialogue');
      expect(classifyChatIntent('jaká je cena toho kávovaru?')).toBe('conversational_dialogue');
      expect(classifyChatIntent('vysvětli mi, jak funguje ten systém tlumení')).toBe('conversational_dialogue');
      expect(classifyChatIntent('explain how the lumbar support works')).toBe('conversational_dialogue');
      expect(classifyChatIntent('je to vhodné i do deště?')).toBe('conversational_dialogue');
      expect(classifyChatIntent('můžu s tím jezdit i v zimě?')).toBe('conversational_dialogue');
      expect(classifyChatIntent('co je lepší na freeride?')).toBe('conversational_dialogue');
      expect(classifyChatIntent('jaká je životnost?')).toBe('conversational_dialogue');
    });

    it('classifies challenging questions containing the word "doporučení" as conversational_dialogue', () => {
      expect(classifyChatIntent('proč je tohle doporučení tak drahé?')).toBe('conversational_dialogue');
      expect(classifyChatIntent('proč v doporučení chybí Nike?')).toBe('conversational_dialogue');
      expect(classifyChatIntent('stojíš si za tímto doporučením?')).toBe('conversational_dialogue');
      expect(classifyChatIntent('co říkáš na to, že mnozí toto doporučení kritizují?')).toBe('conversational_dialogue');
      expect(classifyChatIntent('proč jsi do doporučení nezahrnul levnější variantu?')).toBe('conversational_dialogue');
      expect(classifyChatIntent('why does this recommendation not include Apple?')).toBe('conversational_dialogue');
    });

    it('classifies quick feedback and short chat messages as conversational_dialogue', () => {
      expect(classifyChatIntent('díky za tip')).toBe('conversational_dialogue');
      expect(classifyChatIntent('ahoj')).toBe('conversational_dialogue');
      expect(classifyChatIntent('rozumím')).toBe('conversational_dialogue');
      expect(classifyChatIntent('a co když mám vyšší rozpočet?')).toBe('conversational_dialogue');
      expect(classifyChatIntent('jasně, chápu')).toBe('conversational_dialogue');
    });
  });

  describe('classifyChatIntent - recommendation requests', () => {
    it('classifies explicit requests for 3 models as recommendation_request', () => {
      expect(classifyChatIntent('doporuč mi 3 modely')).toBe('recommendation_request');
      expect(classifyChatIntent('doporuč mi 3 konkrétní produkty')).toBe('recommendation_request');
      expect(classifyChatIntent('doporuč 3 nejlepší modely')).toBe('recommendation_request');
      expect(classifyChatIntent('vyber mi 3 modely')).toBe('recommendation_request');
      expect(classifyChatIntent('navrhni mi 3 alternativy')).toBe('recommendation_request');
      expect(classifyChatIntent('chci 3 nová doporučení')).toBe('recommendation_request');
      expect(classifyChatIntent('ukaz mi top 3')).toBe('recommendation_request');
      expect(classifyChatIntent('recommend top 3 models')).toBe('recommendation_request');
      expect(classifyChatIntent('give me 3 best options')).toBe('recommendation_request');
      expect(classifyChatIntent('suggest 3 new products')).toBe('recommendation_request');
      expect(classifyChatIntent('top 3 modely')).toBe('recommendation_request');
      expect(classifyChatIntent('3 nejlepší produkty')).toBe('recommendation_request');
    });

    it('classifies re-run research and retry commands as recommendation_request', () => {
      expect(classifyChatIntent('proveď průzkum trhu znovu')).toBe('recommendation_request');
      expect(classifyChatIntent('spusť průzkum znovu')).toBe('recommendation_request');
      expect(classifyChatIntent('zkus to znovu')).toBe('recommendation_request');
      expect(classifyChatIntent('přehodnoť doporučení')).toBe('recommendation_request');
      expect(classifyChatIntent('re-run the research')).toBe('recommendation_request');
      expect(classifyChatIntent('re-evaluate recommendations')).toBe('recommendation_request');
    });

    it('classifies wizard quick triggers as recommendation_request', () => {
      expect(classifyChatIntent('Na základě všech zadaných parametrů mi prosím doporuč nejvhodnější modely.')).toBe('recommendation_request');
      expect(classifyChatIntent('Based on all parameters, please recommend the top models.')).toBe('recommendation_request');
    });
  });
});
