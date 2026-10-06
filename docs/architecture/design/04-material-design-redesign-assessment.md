# 🏛️ Architektonický Assessment: Přechod bAIright na Google Material Design (M3)

## 1. Manažerské shrnutí & Cíl redesignu
Tento dokument specifikuje architektonický přechod webové aplikace **bAIright** z původního tmavého kybernetického skla (*Cyber-glass dark mode* `#070d18` s těžkými poloprůhlednými blur filtry a neonovými linkami) na autentický, čistý a vysoce ergonomický **Google Material Design** (inspirovaný moderními standardy Material 3 / Material You a podnikovými rozhraními Material Admin).

### Zjištěné slabiny původního Cyber-glass designu:
- **Těžkopádnost a vizuální smog:** Vícenásobné vrstvy `backdrop-blur-xl`, poloprůhledná pozadí a tmavé odstíny vytvářely dojem "pracovní verze" či herního dashboardu namísto seriózního poradenského nástroje.
- **Nižší čitelnost dat:** Tmavé texty na tmavomodrém podkladu snižovaly kontrast a ztěžovaly rychlé skenování technických parametrů a žebříčků.
- **Nekonzistentní hierarchie:** Příliš mnoho svítících rámečků (`cyan-500/30`, `purple-500/30`) soupeřilo o pozornost uživatele.

---

## 2. Cílová barevná paleta (Design Tokens ze screenshotu "MATERIAL ADMIN")

Předloha definuje čisté, přehledné a vzdušné rozhraní:

| Token | Barva | Využití v bAIright |
|---|---|---|
| `--md-surface-ground` | `#f4f6f8` / `#eceff1` | Globální podklad plátna (klidná, světle šedá bez odlesků) |
| `--md-surface-card` | `#ffffff` | Bílé vyvýšené dlaždice a karty (čistý kontrast, `shadow-sm`) |
| `--md-primary-teal` | `#009688` / `#00897b` | Hlavní brandová barva bAIright, primární CTA, aktivní přepínače, procenta shody |
| `--md-primary-teal-light` | `#e0f2f1` / `#b2dfdb` | Pozadí aktivních pilulek, lehký výběrový podklad parametrů |
| `--md-text-primary` | `#263238` / `#212121` | Hlavní text, nadpisy dlaždic, modely produktů (maximální čitelnost) |
| `--md-text-secondary` | `#607d8b` / `#78909c` | Sekundární popisky, metadata, parametry, nápovědy |
| `--md-border-subtle` | `#cfd8dc` / `#e2e8f0` | Decentní ohraničení dlaždic (žádné neonové filtry) |
| `--md-accent-blue` | `#1e88e5` | Horní linka karet pro technické a softwarové kategorie |
| `--md-accent-amber` | `#ff9800` | Horní linka karet pro rozpočet, doporučení a spotřebiče |
| `--md-accent-coral` | `#ef5350` | Horní linka karet pro zdravotní varování a omezení |
| `--md-accent-green` | `#4caf50` | Horní linka karet pro top #1 volbu a potvrzené parametry |

---

## 3. Typografie a Odsazení (Hierarchy & Whitespace)

- **Písmo (Typography):** Google Sans / Inter Tight / Space Grotesk s čistou geometrií a jasnými proporcemi.
- **Nadpisy:** Výrazné, tmavé (`text-slate-900` / `#212121`, font-weight 700–800), bez stínů.
- **Dlaždice (Cards):** Velkorysé vnitřní odsazení (`p-6` pro desktop, `p-4` pro mobil). Zaoblení rohů `rounded-2xl` až `rounded-3xl` (16–24 px).
- **Akcentní horní linka (Accent Top Border):** Každá hlavní dlaždice má volitelnou decentní 2px horní linku v odpovídající barvě (modrá, jantarová, zelená), což vytváří okamžitou orientaci v kategoriích přesně jako na referenčním dashboardu.

---

## 4. Logo Strategie (Material Design Easy Logo)

- **Požadavek:** "Nesmime ztratit logo nebo navrhni nejake material design easy logo."
- **Řešení:**
  1. Zachování textového logotypu `bAIright`:
     - Slovo `b` a `right` v seriózní tmavé barvě `#263238`.
     - Jádro `AI` v charakteristické Material tyrkysové `#009688` s jemným zaobleným čipem.
  2. Elegantní vektorové M3 Logo (`src/components/Logo.tsx`):
     - Zajištěn čistý kontrast jak na bílém podkladu záhlaví, tak při přepnutí.
     - Vektorový symbol tvoří čistá minimalistická geometrická klenba (Material arch / chevron) symbolizující správné rozhodnutí.

---

## 5. Implementační rozpad (Step-by-Step Evolution)

1. **Globals & Theme Engine (`src/app/globals.css`):**
   - Definice globálních proměnných Material palety (`--md-surface-ground`, `--md-primary-teal` atd.).
   - Přepnutí výchozího schématu na čisté světlé rozhraní se zachováním dark přepínače.
2. **Komponenta Logo (`src/components/Logo.tsx`):**
   - Responzivní Material logo s čistou typografií a teal akcentem.
3. **Hlavní záhlaví (`src/components/HeaderEngineSwitcher.tsx`, `UserProfileCapsule.tsx`):**
   - Bílý App Bar, čistá vyhledávací kapsle, jasné stavové tečky bez tmavých glow efektů.
4. **Hlavní plocha (`src/app/page.tsx` & `AgentCategoryLauncher.tsx`):**
   - Výměna tmavých karet za čisté bílé dlaždice s barevnými horními linkami ze screenshotu.
   - Povýšení čitelnosti dotazníků a žebříčku Top 3.
5. **Zachování 100% bilingvicity (CZ/EN) a testovací pokrytí (Vitest + TSC):**
   - Garance nulových regresí a 100% zelených testů.
