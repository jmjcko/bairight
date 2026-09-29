import { describe, it, expect } from "vitest";
import { discoverDomainParameters, buildAgentFromDomainAnalysis } from "../domain-parameter-discovery";

describe("Domain Parameter Discovery & Prompt Synthesizer Test Suite", () => {
  it("1. Generuje pro neprověřené dotazy čistou parametrizaci (matchedDomain: generic, >= 10 parametrů)", () => {
    const analysis = discoverDomainParameters("auto");
    expect(analysis.matchedDomain).toBe("generic");
    expect(analysis.parameters.length).toBeGreaterThanOrEqual(10);
  });

  it("2. Generuje pro boty čistou univerzální parametrizaci (>= 10 parametrů)", () => {
    const analysis = discoverDomainParameters("běžecké boty");
    expect(analysis.matchedDomain).toBe("generic");
    expect(analysis.parameters.length).toBeGreaterThanOrEqual(10);
  });

  it("3. Generuje pro kávovar čistou univerzální parametrizaci (>= 10 parametrů)", () => {
    const analysis = discoverDomainParameters("kávovar do domácnosti");
    expect(analysis.matchedDomain).toBe("generic");
    expect(analysis.parameters.length).toBeGreaterThanOrEqual(10);
  });

  it("4. Generuje pro židle čistou univerzální parametrizaci (>= 10 parametrů)", () => {
    const analysis = discoverDomainParameters("kancelářská židle na bolest zad");
    expect(analysis.matchedDomain).toBe("generic");
    expect(analysis.parameters.length).toBeGreaterThanOrEqual(10);
  });

  it("5. Generuje pro notebook čistou univerzální parametrizaci (>= 10 parametrů)", () => {
    const analysis = discoverDomainParameters("notebook na programování");
    expect(analysis.matchedDomain).toBe("generic");
    expect(analysis.parameters.length).toBeGreaterThanOrEqual(10);
  });

  it("7. Generuje pro elektroauto čistou univerzální parametrizaci bez spotřebičových klišé", () => {
    const analysis = discoverDomainParameters("elektroauto");
    expect(analysis.matchedDomain).toBe("generic");
    expect(analysis.parameters.length).toBeGreaterThanOrEqual(10);
  });

  it("8. Luke VŽDY nabízí značkový parametr napříč všemi kategoriemi", () => {
    const categories = ["auto", "kávovar", "kancelářská židle", "běžecké boty", "sekačka na trávu"];
    for (const cat of categories) {
      const analysis = discoverDomainParameters(cat);
      const hasBrandParam = analysis.parameters.some(
        (p) => p.id === "brand_preferences" || p.id.includes("brand") || p.name.toLowerCase().includes("značk") || p.name.toLowerCase().includes("výrobc")
      );
      expect(hasBrandParam, `Kategorie "${cat}" musí obsahovat parametr pro značky`).toBe(true);
    }
  });

  it("9. Detekuje čistý požadavek na parametrizaci neznámého dotazu bez statických fuzzy profilů", () => {
    const analysis = discoverDomainParameters("mobilní telefon smartphone");
    expect(analysis.matchedDomain).toBe("generic");
    expect(analysis.parameters.length).toBeGreaterThanOrEqual(10);
  });

  it("10. Generuje čistých 10 parametrů pro automatickou pračku bez spotřebičových klišé", () => {
    const analysis = discoverDomainParameters("automatická pračka");
    expect(analysis.matchedDomain).toBe("generic");
    expect(analysis.parameters.length).toBeGreaterThanOrEqual(10);
  });

  it("11. Generuje čistých 10 parametrů pro televizi", () => {
    const analysis = discoverDomainParameters("chytrá televize do obýváku");
    expect(analysis.matchedDomain).toBe("generic");
    expect(analysis.parameters.length).toBeGreaterThanOrEqual(10);
  });

  it("12. Generuje čistých 10 parametrů pro robotickou sekačku", () => {
    const analysis = discoverDomainParameters("robotická sekačka na trávu");
    expect(analysis.matchedDomain).toBe("generic");
    expect(analysis.parameters.length).toBeGreaterThanOrEqual(10);
  });

  it("13. Generuje čistých 10 parametrů pro jízdní kolo", () => {
    const analysis = discoverDomainParameters("chci nové jízdní kolo");
    expect(analysis.matchedDomain).toBe("generic");
    expect(analysis.parameters.length).toBeGreaterThanOrEqual(10);
  });

  it("14. Tělesně vázané produkty obsahují biometrický parametr", () => {
    const skiAnalysis = discoverDomainParameters("sjezdové lyže");
    expect(skiAnalysis.parameters.some((p) => p.id === "user_biometrics_health")).toBe(true);
  });

  it("15. Luke VŽDY navrhne minimálně 10 parametrů pro KAŽDOU zkoumanou kategorii", () => {
    const testQueries = ["auto", "kávovar", "běžecké boty", "notebook", "sekačka na trávu"];
    for (const query of testQueries) {
      const result = discoverDomainParameters(query);
      expect(result.parameters.length).toBeGreaterThanOrEqual(10);
    }
  });
});
