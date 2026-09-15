import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { discoverDomainParameters } from '../domain-parameter-discovery';

describe('Agent Luke: Prompt Governance & Contract Integrity Test Suite', () => {
  const rootDir = process.cwd();
  const lukeSpecPath = path.join(rootDir, 'agents', 'luke-general-agent.md');
  const routeCodePath = path.join(rootDir, 'src', 'app', 'api', 'agent', 'research-parameters', 'route.ts');

  // =========================================================================
  // 1. STATICKÁ KONTROLA SPECIFIKACE AGENTA (agents/luke-general-agent.md)
  // =========================================================================
  describe('1. Kanonická integrita specifikace Agenta Luke (luke-general-agent.md)', () => {
    it('1.1 Soubor agents/luke-general-agent.md existuje a má platnou verzi >= 1.1.0', () => {
      expect(fs.existsSync(lukeSpecPath), 'Soubor agents/luke-general-agent.md musí existovat').toBe(true);

      const content = fs.readFileSync(lukeSpecPath, 'utf-8');
      const versionMatch = content.match(/version:\s*"([0-9.]+)"/);
      expect(versionMatch, 'Specifikace musí obsahovat verzi').not.toBeNull();

      const version = versionMatch![1];
      const [major, minor] = version.split('.').map(Number);
      expect(major > 1 || (major === 1 && minor >= 1), `Verze Lukea musí být >= 1.1.0, aktuální: ${version}`).toBe(true);
    });

    it('1.2 Specifikace obsahuje explicitní zákaz generických nákupních klišé', () => {
      const content = fs.readFileSync(lukeSpecPath, 'utf-8');
      const bannedWords = ['Cena', 'Barva', 'Vzhled', 'Kvalita', 'Ergonomie', 'Technologický standard'];

      expect(content).toContain('STRIKTNÍ ZÁKAZ VÁGNÍCH KLIŠÉ');
      for (const word of bannedWords) {
        expect(content, `Zákaz klišé musí zmiňovat slovo "${word}"`).toContain(word);
      }
    });

    it('1.3 Specifikace nařizuje elementární tržní segmentaci jako Parametr č. 1', () => {
      const content = fs.readFileSync(lukeSpecPath, 'utf-8');
      expect(content).toMatch(/Elementární rozdělení trhu VŽDY jako Parametr č\.\s*1/i);
      expect(content).toContain('jízdní kolo');
      expect(content).toContain('Silniční');
      expect(content).toContain('Gravel');
      expect(content).toContain('MTB');
    });

    it('1.4 Specifikace nařizuje povinnou biometrii a zdravotní anamnézu (výška, váha, operace)', () => {
      const content = fs.readFileSync(lukeSpecPath, 'utf-8');
      expect(content).toMatch(/Povinné tělesné biometrické a zdravotní parametry/i);
      expect(content).toMatch(/výška\s*\(cm\)/i);
      expect(content).toMatch(/hmotnost\s*\(kg\)/i);
      expect(content).toMatch(/operace/i);
      expect(content).toMatch(/šířka chodidla/i);
      expect(content).toMatch(/páteř/i);
    });

    it('1.5 Specifikace garantuje minimálně 10 parametrů pro každou kategorii', () => {
      const content = fs.readFileSync(lukeSpecPath, 'utf-8');
      expect(content).toMatch(/Garance minimálně 10 parametrů/i);
      expect(content).toMatch(/10 až 14/);
    });

    it('1.6 Specifikace nařizuje povinnou izolaci značek (brand_preferences)', () => {
      const content = fs.readFileSync(lukeSpecPath, 'utf-8');
      expect(content).toContain('POVINNÁ IZOLACE ZNAČEK');
      expect(content).toContain('brand_preferences');
      expect(content).toContain('`suggestedComponent`: `"brands"`');
    });
  });

  // =========================================================================
  // 2. KONTROLA SYNCHRONIZACE S RUNTIME PROMPTEM (src/app/api/agent/.../route.ts)
  // =========================================================================
  describe('2. Kontrola synchronizace runtime promptu v API (Anti-Drift Guardrail)', () => {
    it('2.1 API route obsahuje shodná striktní pravidla jako kanonický Luke', () => {
      expect(fs.existsSync(routeCodePath), 'API route pro research musí existovat').toBe(true);
      const routeContent = fs.readFileSync(routeCodePath, 'utf-8');

      // 1. Zlaté pravidlo: Elementární segmentace č. 1
      expect(routeContent).toMatch(/ELEMENTÁRNÍ ROZDĚLENÍ TRHU VŽDY JAKO PARAMETR Č\.\s*1/i);
      expect(routeContent).toContain('bike_type_category');

      // 2. Zlaté pravidlo: Povinná biometrie a operace
      expect(routeContent).toMatch(/POVINNÉ TĚLESNÉ BIOMETRICKÉ A ZDRAVOTNÍ PARAMETRY/i);
      expect(routeContent).toContain('bike_rider_biometrics');
      expect(routeContent).toMatch(/výška/i);
      expect(routeContent).toMatch(/hmotnost/i);
      expect(routeContent).toMatch(/operace/i);

      // 3. Zlaté pravidlo: Minimálně 10 až 14 parametrů
      expect(routeContent).toMatch(/MINIMÁLNĚ 10 AŽ 14/i);

      // 4. Izolace značek
      expect(routeContent).toContain('brand_preferences');
      expect(routeContent).toContain('suggestedComponent');

      // 5. Zákaz klišé
      expect(routeContent).toContain('STRIKTNÍ ZÁKAZ VÁGNÍCH KLIŠÉ');
    });
  });

  // =========================================================================
  // 3. KONTROLA FUNKČNÍHO VÝSTUPU ENGINGU (Contract Compliance)
  // =========================================================================
  describe('3. Kontrola funkčního výstupu enginu (Contract Compliance)', () => {
    const representativeDomains = [
      { query: 'jízdní kolo na výlety', expectedFirstId: 'bike_type_category', hasBio: true },
      { query: 'sjezdové lyže', expectedFirstId: 'skis_terrain_purpose', hasBio: true },
      { query: 'kancelářská židle', expectedFirstId: 'chair_category_type', hasBio: true },
      { query: 'zdravotní matrace', expectedFirstId: 'mattress_user_biometrics_health', hasBio: true },
      { query: 'běžecké boty', expectedFirstId: 'biomechanics', hasBio: true },
      { query: 'automatická pračka', expectedFirstId: 'washer_construction_format', hasBio: false },
      { query: 'chytrá televize oled', expectedFirstId: 'tv_display_technology', hasBio: false },
      { query: 'robotický vysavač', expectedFirstId: 'vacuum_type_format', hasBio: false },
      { query: 'robotická sekačka na trávu', expectedFirstId: 'mower_category_power', hasBio: false },
      { query: 'kombinovaný dětský kočárek', expectedFirstId: 'stroller_type_segment', hasBio: true },
      { query: 'smartphone telefon', expectedFirstId: 'phone_form_factor_ecosystem', hasBio: true },
      { query: 'tepelné čerpadlo', expectedFirstId: 'hp_category_type', hasBio: false },
      { query: 'expediční batoh do hor', expectedFirstId: 'elemental_market_segment', hasBio: true },
    ];

    for (const testCase of representativeDomains) {
      it(`3.x Kategorie "${testCase.query}" splňuje kontrakt (>= 10 parametrů, správný 1. parametr, biometrie, značky)`, () => {
        const result = discoverDomainParameters(testCase.query);

        // A) Počet parametrů
        expect(
          result.parameters.length,
          `"${testCase.query}" musí mít minimálně 10 parametrů (má ${result.parameters.length})`
        ).toBeGreaterThanOrEqual(10);

        // B) První parametr odpovídá elementární segmentaci
        expect(
          result.parameters[0].id,
          `První parametr pro "${testCase.query}" musí být ${testCase.expectedFirstId}`
        ).toBe(testCase.expectedFirstId);

        // C) Tělesné kategorie musí obsahovat biometrický parametr
        if (testCase.hasBio) {
          const hasBiometrics = result.parameters.some((p) =>
            p.id.includes('biometric') ||
            p.id.includes('body') ||
            p.id.includes('spine') ||
            p.id.includes('foot') ||
            p.id.includes('rider') ||
            p.id.includes('weight') ||
            p.name.toLowerCase().includes('biometrie') ||
            p.name.toLowerCase().includes('tělesn') ||
            p.name.toLowerCase().includes('anatomie') ||
            p.rationale.toLowerCase().includes('výška') ||
            p.rationale.toLowerCase().includes('hmotnost')
          );
          expect(hasBiometrics, `Kategorie "${testCase.query}" musí obsahovat biometrický/tělesný parametr`).toBe(true);
        }

        // D) Žádný parametr nesmí být zakázané klišé jako samostatný název
        const bannedExactNames = [
          'cena', 'barva', 'vzhled', 'kvalita', 'kvalita zpracování',
          'ergonomie', 'technologický standard', 'základní výbava'
        ];
        for (const param of result.parameters) {
          const lowerName = param.name.toLowerCase().trim();
          expect(
            bannedExactNames.includes(lowerName),
            `Parametr "${param.name}" v kategorii "${testCase.query}" je zakázané vágní klišé!`
          ).toBe(false);
        }

        // E) Každý parametr musí mít detailní technické odůvodnění (rationale >= 35 znaků)
        for (const param of result.parameters) {
          expect(
            param.rationale.length,
            `Parametr "${param.name}" v kategorii "${testCase.query}" musí mít detailní technické odůvodnění`
          ).toBeGreaterThanOrEqual(35);
        }

        // F) Značkový parametr je vždy přítomen
        const hasBrandParam = result.parameters.some(
          (p) => p.id === 'brand_preferences' || p.suggestedComponent === 'brands' || p.name.toLowerCase().includes('značk')
        );
        expect(hasBrandParam, `Kategorie "${testCase.query}" musí mít parametr pro značky`).toBe(true);
      });
    }
  });
});
