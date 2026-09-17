import os

os.makedirs('docs/reports', exist_ok=True)

report = """# Extenzivní Výzkumný Report: Agent Luke 2.0 & Doménová Heuristika

**Verze:** 2.1.0  
**Autor:** AIRE SDLC Architect & Agent Engineering Team  
**Datum:** 17. září 2026  
**Stav:** Schváleno v produkční architektuře bAIright  

---

## 1. Manažerské Shrnutí & Kontext

Agent Luke je jádrem nákupního poradce bAIright. Jeho úkolem je reverzní inženýrství nákupních rozhodnutí — extrakce klíčových technických, ergonomických a uživatelských parametrů z libovolného zadání uživatele.

Při auditu chování u běžného spotřebního zboží (např. dotaz **"hrnek"**, **"sklenice"**, **"tričko"**, **"talíř"**) byla identifikována kritická odchylka:
- **Původní chování (Před opravou):** U obecných dotazů záložní generátor předpokládal složitá technická zařízení a vrátil irelevantní parametry typu *"Bezpečnost a certifikace (chybějící tepelná pojistka či dětská pojistka)"*, *"Servis a náhradní díly v ČR po 2 letech"* nebo *"Plastové spojky a kryty praskající při nárazu"*.
- **Nové chování (Po opravě):** Luke nyní striktně rozlišuje **Strojní/Elektro technologie** vs. **Domácí, kuchyňské a životní potřeby**. Pro hrnek vracejí nákupní parametry zaměřené na *Materiál & Odolnost*, *Objem & Kapacitu*, *Tepelnou izolaci (např. dvoustěnné sklo / nerez)*, *Vhodnost do myčky a mikrovlnky* a *Ergonomii ucha*.

---

## 2. Architektura Agenta Luke

```
┌────────────────────────────────────────────────────────────────────────┐
│                        UŽIVATELSKÝ DOTAZ                              │
│                    (např. "hrnek" / "silniční kolo")                    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   DVOUPÁSMOVÝ ENGINE AGENTA LUKE                       │
│                                                                        │
│   1. PÁSMO (Primární): Gemini 2.0 Flash LLM s Prompty Luke v2.0       │
│      - Pod-kategoriální specificita                                    │
│      - Stručné názvy (<= 18 znaků)                                     │
│      - Izolace značek (brand_preferences)                              │
│                                                                        │
│   2. PÁSMO (Záložní): High-Availability Domain Heuristic Discovery     │
│      - Doménový slovník (Sport, Elektro, Auto, Domácnost/Kuchyně)      │
│      - Adaptivní generování pro spotřební zboží                        │
│      - Komunitní učení (DomainLearningService)                         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   UX PARAMETER SELECTION CARD GRID                      │
│   - Dominantní tučný název parametru                                   │
│   - 1-řádkový stručný výstižný popis (max 65 znaků)                    │
│   - Interaktivní možnost přidání vlastního parametru                   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Výzkumná Zpráva: Analýza Selhání u Kategorií Domácnosti

### 3.1 Identifikovaný Problém u Dotazu "hrnek"
Uživatel zadal: `"chtěl bych koupit hrnek"`
Původní heuristický záložní engine vytvořil tyto parametry:
1. ❌ *Materiály a odolnost:* "Plastové spojky a tenkostěnné kryty praskají při prvním nárazu..."
2. ❌ *Servis a náhradní díly:* "U neznačkových dovozů nelze po 2 letech sehnat ani těsnění a funkční zařízení končí ve sběrném dvoře..."
3. ❌ *Bezpečnost a certifikace:* "Chybějící tepelná pojistka nebo dětská pojistka může způsobit zkrat..."

### 3.2 Kořenová Příčina
Generický záložní algoritmus měl nastaveny výchozí texty odůvodnění určené pro mechanická zařízení a elektroniku. Vzhledem k absenci specifického pravidla pro užitkové zboží a nádobí aplikoval tato pravidla i na keramiku.

### 3.3 Systémové Řešení
Vytvořen nový doménový modul **Tableware & Household Items** (`household_drinkware`):
- **Relevantní parametry:**
  - `material_type`: **Materiál & Zpracování** (*Porcelán, keramika, kamenina, nerez, borosilikátové sklo*)
  - `volume_capacity`: **Objem a kapacita** (*Espresso 90 ml, Běžný 350 ml, Velký 500+ ml*)
  - `thermal_insulation`: **Tepelná izolace** (*Jednostěnný, dvoustěnný termo, cestovní s víčkem*)
  - `dishwasher_microwave`: **Myčka & Mikrovlnka** (*100% vhodné do myčky i mikrovlnné trouby, pouze ruční mytí*)
  - `ergonomics_handle`: **Ergonomie a ucho** (*Široké pohodlné ucho, protiskluzové dno, cestovní uzávěr*)
  - `brand_preferences`: **Značky a výrobci**

---

## 4. UX Redesign Karet Parametrů (Dominantní Název + Krátký Popis)

Podle požadavků UX byl proveden redesign výběrové mřížky parametrů v UI (`AgentCategoryLauncher.tsx`):

### Před Redesignem:
- Název parametru byl zobrazen menším pínem spolu s dlouhým odstavcem textu o 3-4 větách.
- Karta působila nepřehledně a vyžadovala dlouhé čtení.

### Po Redesignem:
- **Dominantní Název Parametru:** Výrazný tučný nadpis (`text-sm font-bold tracking-tight text-slate-100 group-hover:text-cyan-300`).
- **Stručný 1-Řádkový Popis:** Funkce `formatShortDescription()` zkracuje odůvodnění na 1 výstižnou větu (max 65 znaků), s elegantním `line-clamp-1`.
- **Čistší Vizuální Hierarchie:** Okamžitě skenovatelné karty na mobilu i desktopu.

---

## 5. Pravidla Governance a Testování

Všechny změny Agenta Luke podléhají automatizovaným testům:
1. `src/lib/agent/__tests__/domain-parameter-discovery.test.ts` — Ověřuje, že dotazy jako `"hrnek"`, `"termohrnek"`, `"sklenice"`, `"tričko"` vracejí věcně správné parametry domácnosti bez zmínek o servisu či pojistkách.
2. `src/lib/agent/__tests__/luke-prompt-governance.test.ts` — Ověřuje dodržování délky názvů (<= 18 znaků) a izolaci značek.

---

## 6. Závěr a Další Krok

Agent Luke je v této verzi výrazně robusnější a připravený i na běžné spotřební zboží. Dalším krokem je průběžné rozšiřování komunitní databáze učení (`DomainLearningService`) o nové zákaznické preference.
"""

with open('docs/reports/luke_agent_extensive_research_report.md', 'w') as f:
    f.write(report)

print('Successfully created docs/reports/luke_agent_extensive_research_report.md')
