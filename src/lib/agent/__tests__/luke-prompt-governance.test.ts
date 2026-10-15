import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { discoverDomainParameters } from '../domain-parameter-discovery';
import { buildLukeSystemPrompt } from '../luke-agent-prompt';

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
      expect(content).toMatch(/Garance 10 až 14/i);
      expect(content).toMatch(/10 až 14/);
    });

    it('1.6 Specifikace nařizuje povinnou izolaci značek (brand_preferences)', () => {
      const content = fs.readFileSync(lukeSpecPath, 'utf-8');
      expect(content).toContain('POVINNÁ IZOLACE ZNAČEK');
      expect(content).toContain('brand_preferences');
      expect(content).toContain('`suggestedComponent`: `"brands"`');
    });
  });

    it("1.8 Specifikace nařizuje striktní zákaz statického fallbacku a kontrolu historie dotazů na webu", () => {
      const content = fs.readFileSync(lukeSpecPath, "utf-8");
      expect(content).toMatch(/Striktní Zákaz Statického Fallbacku|Strict No Fallback/i);
      expect(content).toMatch(/zda se na tento produkt.*na našem webu/i);

      const canonicalSpec = fs.readFileSync(path.join(rootDir, "SPEC", "agents", "LUKE_RESEARCH_AGENT.md"), "utf-8");
      expect(canonicalSpec).toMatch(/Striktní Zákaz Statického Fallbacku|Strict No Fallback/i);
      expect(canonicalSpec).toMatch(/zda se na tento produkt.*na našem webu/i);
    });

    it("1.7 Specifikace nařizuje povinný multi-zdrojový výzkum (fóra, YouTube rozbory, technické specifikace)", () => {
      const content = fs.readFileSync(lukeSpecPath, "utf-8");
      expect(content).toMatch(/Metodologie a informační zdroje|Multi-Source/i);
      expect(content).toMatch(/fóra|forums|diskusní/i);
      expect(content).toMatch(/YouTube/i);
      expect(content).toMatch(/specifikace|specs/i);
    });

    it("1.9 Specifikace nařizuje pravidlo Nulové redundance a kontextového zoomu (Zero Redundancy & Context Zooming)", () => {
      const canonicalSpec = fs.readFileSync(path.join(rootDir, "SPEC", "agents", "LUKE_RESEARCH_AGENT.md"), "utf-8");
      expect(canonicalSpec).toMatch(/Zero Redundancy & Context Zooming/i);
      expect(canonicalSpec).toContain("silniční endurance kolo");

      const generalSpec = fs.readFileSync(lukeSpecPath, "utf-8");
      expect(generalSpec).toMatch(/Zero Redundancy & Context Zooming/i);
    });

    it("1.10 Specifikace nařizuje praktickou biometrickou personalizaci a reálné rozměry", () => {
      const canonicalSpec = fs.readFileSync(path.join(rootDir, "SPEC", "agents", "LUKE_RESEARCH_AGENT.md"), "utf-8");
      expect(canonicalSpec).toMatch(/Practical Biometric Personalization/i);
      expect(canonicalSpec).toMatch(/Výška postavy & Velikost rámu/i);

      const generalSpec = fs.readFileSync(lukeSpecPath, "utf-8");
      expect(generalSpec).toMatch(/Praktická volba velikosti/i);
    });

    it("1.11 Specifikace nařizuje přirozenou saturaci parametrů a zákaz umělé vaty (Natural Saturation & Anti-Padding)", () => {
      const canonicalSpec = fs.readFileSync(path.join(rootDir, "SPEC", "agents", "LUKE_RESEARCH_AGENT.md"), "utf-8");
      expect(canonicalSpec).toMatch(/Natural Parameter Saturation & Anti-Padding/i);
      expect(canonicalSpec).toMatch(/ceramic coffee mug/i);

      const generalSpec = fs.readFileSync(lukeSpecPath, "utf-8");
      expect(generalSpec).toMatch(/Anti-Padding/i);

      const routeContent = fs.readFileSync(routeCodePath, "utf-8");
      expect(routeContent).toMatch(/Natural Saturation/i);
      expect(routeContent).toMatch(/Přirozená saturace/i);
    });

    it("1.12 Specifikace nařizuje 5 nákupních pilířů včetně Technické & Technologické vyspělosti", () => {
      const canonicalSpec = fs.readFileSync(path.join(rootDir, "SPEC", "agents", "LUKE_RESEARCH_AGENT.md"), "utf-8");
      expect(canonicalSpec).toMatch(/Five Universal Purchasing Pillars/i);
      expect(canonicalSpec).toMatch(/Technological Maturity/i);

      const generalSpec = fs.readFileSync(lukeSpecPath, "utf-8");
      expect(generalSpec).toMatch(/Technická & Technologická vyspělost/i);
    });

  // =========================================================================
  // 2. KONTROLA SYNCHRONIZACE S RUNTIME PROMPTEM (src/app/api/agent/.../route.ts)
  // =========================================================================
  describe('2. Kontrola synchronizace runtime promptu v API (Anti-Drift Guardrail)', () => {
    it('2.1 API route obsahuje shodná striktní pravidla jako kanonický Luke', () => {
      expect(fs.existsSync(routeCodePath), 'API route pro research musí existovat').toBe(true);
      const routeContent = fs.readFileSync(routeCodePath, 'utf-8');

      // 1. Persona a vstup
      expect(routeContent).toMatch(/expertní nákupní analytik a technický specifikátor/i);

      // 2. Rozsah 8 až 12 parametrů
      expect(routeContent).toMatch(/(?:8|10|11) až (?:10|12|14)/i);
      expect(routeContent).toMatch(/11 až 14/i);
      expect(routeContent).toMatch(/11 to 14/i);

      // 3. Izolace značek
      expect(routeContent).toContain('brand_preferences');
      expect(routeContent).toContain('suggestedComponent');

      // 4. Zákaz klišé
      expect(routeContent).toContain('STRIKTNÍ ZÁKAZ VÁGNÍCH KLIŠÉ');
    });
  });

    it("2.3 API route prompt obsahuje instrukci pro kontrolu historie dotazů na webu a zákaz statického fallbacku", () => {
      const routeContent = fs.readFileSync(routeCodePath, "utf-8");
      expect(routeContent).toMatch(/Ověření historie webu|KONTROLA HISTORIE/i);
    });

    it("2.2 API route prompt nařizuje výzkum z recenzí, fór a technických specifikací", () => {
      const routeContent = fs.readFileSync(routeCodePath, "utf-8");
      expect(routeContent).toMatch(/expertní nákupní analytik a technický specifikátor/i);
      expect(routeContent).toMatch(/recenzí/i);
      expect(routeContent).toMatch(/fór/i);
      expect(routeContent).toMatch(/technické specifikace/i);
    });

    it("2.4 API route a buildLukeSystemPrompt obsahují pravidlo Nulové redundance a kontextového zoomu v EN i CZ verzi", () => {
      const routeContent = fs.readFileSync(routeCodePath, "utf-8");
      // EN route prompt
      expect(routeContent).toContain("Zero Redundancy & Context Zooming");
      // CZ route prompt
      expect(routeContent).toContain("Nulová redundance & Hloubkový zoom kontextu");

      // System prompt
      const systemPrompt = buildLukeSystemPrompt("silniční endurance kolo", "en");
      expect(systemPrompt).toContain("Zero Redundancy & Context Zooming");
    });

    it("2.5 API route a buildLukeSystemPrompt obsahují pravidlo Technické & Technologické vyspělosti v EN i CZ verzi", () => {
      const routeContent = fs.readFileSync(routeCodePath, "utf-8");
      // EN route prompt
      expect(routeContent).toContain("Technical & Technological Maturity");
      // CZ route prompt
      expect(routeContent).toContain("Technická & Technologická vyspělost");

      // System prompt
      const systemPrompt = buildLukeSystemPrompt("aku vrtačka", "en");
      expect(systemPrompt).toContain("Technical & Technological Maturity");
    });

    it("2.6 API route a buildLukeSystemPrompt obsahují pravidlo Nativního mechanického rozhraní (Native Interface Integrity)", () => {
      const routeContent = fs.readFileSync(routeCodePath, "utf-8");
      expect(routeContent).toContain("Native Interface & Mounting Standard Integrity");
      expect(routeContent).toContain("Nativní mechanická a montážní rozhraní");

      const systemPrompt = buildLukeSystemPrompt("cyklosvětlo garmin", "en");
      expect(systemPrompt).toContain("Native Interface & Mounting Standard Integrity");
    });

    it("2.7 API route a buildLukeSystemPrompt obsahují pravidlo Ověření geografického původu značek (Tchaj-wan vs Čína)", () => {
      const routeContent = fs.readFileSync(routeCodePath, "utf-8");
      expect(routeContent).toContain("Brand Origin & Geography Verification Protocol");
      expect(routeContent).toContain("Protokol ověření geografického původu značek");

      const systemPrompt = buildLukeSystemPrompt("cyklosvětlo ravemen", "en");
      expect(systemPrompt).toContain("Brand Origin & Geography Verification Protocol");
      expect(systemPrompt).toContain("Taiwan (ROC)");
    });

  // =========================================================================
  // 3. KONTROLA FUNKČNÍHO VÝSTUPU ENGINGU (Contract Compliance)
  // =========================================================================
  describe('3. Kontrola funkčního výstupu enginu (Contract Compliance)', () => {
    const representativeDomains = [
      { query: 'jízdní kolo na výlety', expectedFirstId: 'primary_product_type', hasBio: true },
      { query: 'sjezdové lyže', expectedFirstId: 'primary_product_type', hasBio: true },
      { query: 'kancelářská židle', expectedFirstId: 'primary_product_type', hasBio: true },
      { query: 'zdravotní matrace', expectedFirstId: 'primary_product_type', hasBio: true },
      { query: 'běžecké boty', expectedFirstId: 'primary_product_type', hasBio: true },
      { query: 'automatická pračka', expectedFirstId: 'primary_product_type', hasBio: false },
      { query: 'chytrá televize oled', expectedFirstId: 'primary_product_type', hasBio: false },
      { query: 'robotický vysavač', expectedFirstId: 'primary_product_type', hasBio: false },
      { query: 'robotická sekačka na trávu', expectedFirstId: 'primary_product_type', hasBio: false },
      { query: 'kombinovaný dětský kočárek', expectedFirstId: 'primary_product_type', hasBio: true },
      { query: 'smartphone telefon', expectedFirstId: 'primary_product_type', hasBio: true },
      { query: 'tepelné čerpadlo', expectedFirstId: 'primary_product_type', hasBio: false },
      { query: 'expediční batoh do hor', expectedFirstId: 'primary_product_type', hasBio: true },
      { query: 'tiskárna', expectedFirstId: 'primary_product_type', hasBio: false },
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
          'ergonomie', 'technologický standard', 'základní výbava',
          'konstrukční třída', 'procesní koncepce', 'architektonická úroveň'
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
