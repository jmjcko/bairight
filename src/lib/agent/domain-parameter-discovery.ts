/**
 * Domain Parameter Discovery & Expert Prompt Synthesizer
 * 
 * Takes an arbitrary user shopping intent or keyword (e.g. "auto", "boty", "kávovar", "ergonomická židle", etc.)
 * and extracts a comprehensive, deep list of at least 10 core domain decision parameters,
 * synthesizes a tailored expert system prompt with strict evaluation logic,
 * and generates targeted wizard questions.
 */

import { WizardQuestion, UniversalAgentDefinition } from './universal-agent-schema';
import { DomainLearningService } from './domain-learning-service';

export interface ExtractedDomainParameter {
  id: string;
  name: string;
  category: string;
  importance: 'mandatory' | 'recommended' | 'preference';
  rationale: string;
  icon?: string;
  suggestedComponent: 'chips' | 'slider' | 'dropdown' | 'brands';
  suggestedValues?: string[];
}

export const UNIVERSAL_BRAND_PARAMETER: ExtractedDomainParameter = {
  id: 'brand_preferences',
  name: 'Značka & Výrobci (Preferované vs. Zakázané)',
  category: 'Výrobci & Značky',
  importance: 'recommended',
  rationale: 'Umožňuje uvést konkrétní preferované značky, kterým důvěřujete, a naopak striktně vyloučit výrobce, které nechcete.',
  icon: '🏷️',
  suggestedComponent: 'brands',
  suggestedValues: [
    'Všechny ověřené značky (otevřený výběr)',
    'Mám konkrétní preferované značky',
    'Chci vyloučit konkrétní výrobce',
  ],
};

export interface DomainAnalysisResult {
  keyword: string;
  matchedDomain: string;
  categoryName: string;
  agentName: string;
  icon: string;
  description: string;
  parameters: ExtractedDomainParameter[];
  questions: WizardQuestion[];
  systemPrompt: string;
  suggestedAlternatives?: ExtractedDomainParameter[];
}

/**
 * Knowledge base of rich domain profiles for popular consumer & technical categories
 * Each profile is rigorously structured with at least 10 specific decision parameters.
 */
const DOMAIN_PROFILES: Record<string, {
  keywords: string[];
  categoryName: string;
  agentName: string;
  icon: string;
  description: string;
  parameters: ExtractedDomainParameter[];
  questions: WizardQuestion[];
  systemPrompt: string;
  suggestedAlternatives?: ExtractedDomainParameter[];
}> = {
  electric_cars: {
    keywords: [
      'elektroauto', 'elektromobil', 'elektro auto', 'elektro-auto', 'ev', 'bev',
      'tesla', 'electric car', 'elektricke auto', 'elektricky vuz', 'elektricka auta',
      'auto na baterky', 'enyaq', 'ioniq', 'taycan', 'id.4', 'id.3', 'id.7', 'model y', 'model 3'
    ],
    categoryName: 'Elektromobily & Elektrická Vozidla (EV)',
    agentName: 'Specialista na Elektromobilitu & EV',
    icon: '⚡',
    description: 'Expertní nákupní poradce pro výběr elektromobilu na základě reálného dálničního dojezdu, rychlosti nabíjení (800V vs 400V), tepelného čerpadla a bateriové chemie.',
    parameters: [
      {
        id: 'ev_battery_range',
        name: 'Využitelná kapacita baterie & reálný dálniční dojezd',
        category: 'Baterie & Dojezd',
        importance: 'mandatory',
        rationale: 'Klíčové pro dálkové cesty: kapacita v kWh a reálný dojezd při 130 km/h za běžných podmínek (nikoliv teoretický laboratorní WLTP).',
        icon: '🔋',
        suggestedComponent: 'chips',
        suggestedValues: ['Městský / Příměstský (45-58 kWh / dojezd ~250 km)', 'Univerzální rodinný (60-77 kWh / dojezd ~360 km)', 'Dálniční křižník (78-100+ kWh / dojezd 450+ km)'],
      },
      {
        id: 'ev_charging_architecture',
        name: 'Rychlost DC nabíjení & Architektura (800V vs. 400V)',
        category: 'Nabíjecí výkon',
        importance: 'mandatory',
        rationale: '800V ultrarychlá architektura (Hyundai Ioniq, Kia EV6, Porsche) dobije 10-80 % pod 18 minut; standardní 400V (Škoda Enyaq, VW ID) vyžaduje 28-35 minut.',
        icon: '⚡',
        suggestedComponent: 'chips',
        suggestedValues: ['800V ultrarychlá architektura (200-350 kW)', '400V standardní rychlonabíjení (120-175 kW)'],
      },
      {
        id: 'ev_heat_pump',
        name: 'Tepelné čerpadlo pro zimní provoz',
        category: 'Termomanagement',
        importance: 'mandatory',
        rationale: 'Při mrazech v ČR (-5 až -15 °C) efektivně vytápí kabinu i temperuje baterii a eliminuje propad dojezdu o 30-40 %.',
        icon: '❄️',
        suggestedComponent: 'chips',
        suggestedValues: ['Tepelné čerpadlo nutné (pravidelný zimní provoz)', 'Odporové topení dostačuje (garážované, městský provoz)'],
      },
      {
        id: 'ev_home_charging',
        name: 'Palubní AC nabíječka & Domácí wallbox',
        category: 'Domácí nabíjení',
        importance: 'recommended',
        rationale: 'Třífázové 11 kW (či 22 kW) AC nabíjení umožní plné a bezpečné dobití baterie přes noc během levného nočního tarifu.',
        icon: '🔌',
        suggestedComponent: 'chips',
        suggestedValues: ['Domácí wallbox 11 kW (plné nabití přes noc 6-8 hod.)', 'Zesílená 22 kW AC palubní nabíječka', 'Pouze veřejné nabíjení (bez domácího wallboxu)'],
      },
      {
        id: 'ev_battery_chemistry',
        name: 'Chemie trakční baterie (LFP vs. NMC)',
        category: 'Technologie baterie',
        importance: 'recommended',
        rationale: 'LFP (Lithium-železo-fosfát) netrpí denním nabíjením do 100 % a má extrémní životnost; NMC/NCA má vyšší energetickou hustotu a lepší zimní výkon.',
        icon: '🔬',
        suggestedComponent: 'chips',
        suggestedValues: ['LFP (bezpečné nabíjení na 100 % denně)', 'NMC / NCA (maximální dojezd a hustota energie)'],
      },
      {
        id: 'ev_drivetrain',
        name: 'Pohon náprav (Zadní pohon RWD vs. Dual Motor 4x4 AWD)',
        category: 'Trakce & Dynamika',
        importance: 'recommended',
        rationale: 'Elektromobily mají nízké těžiště; zadní pohon RWD je efektivní a stabilní, Dual Motor AWD přináší brutální zrychlení a jistotu na sněhu.',
        icon: '🏎️',
        suggestedComponent: 'chips',
        suggestedValues: ['Dual Motor (Pohon všech kol 4x4 AWD)', 'Jeden motor (Úsporný zadní pohon RWD)', 'Přední pohon (FWD)'],
      },
      {
        id: 'ev_battery_preconditioning',
        name: 'Automatický předehřev baterie před rychlonabíjením',
        category: 'Cestovní komfort',
        importance: 'recommended',
        rationale: 'Zajišťuje, aby studená baterie dosáhla plného nabíjecího výkonu ihned po připojení k HPC stanici a nestála na stojanu hodinu.',
        icon: '🌡️',
        suggestedComponent: 'chips',
        suggestedValues: ['Automatický předehřev propojený s navigací', 'Manuální předehřev tlačítkem'],
      },
      {
        id: 'ev_route_planner',
        name: 'Inteligentní plánovač tras s obsazeností nabíječek',
        category: 'Software & Infotainment',
        importance: 'recommended',
        rationale: 'Navigace musí sama dynamicky počítat zastávky na nabíjení podle spotřeby, profilu trasy a reálné obsazenosti stojanů.',
        icon: '🗺️',
        suggestedComponent: 'chips',
        suggestedValues: ['Pokročilý EV plánovač tras (Tesla, Google Built-in, BMW)', 'Základní navigace (stačí mi Apple CarPlay / Android Auto)'],
      },
      {
        id: 'ev_body_type',
        name: 'Typ karoserie a aerodynamický profil',
        category: 'Konstrukce',
        importance: 'mandatory',
        rationale: 'Aerodynamický koeficient odporu (Cd) má u EV zásadní vliv na spotřebu: nízký liftback spotřebuje o 20 % méně energie než krabicové SUV.',
        icon: '🚙',
        suggestedComponent: 'chips',
        suggestedValues: ['Elektro SUV / Crossover (vyšší posaz, prostor)', 'Aerodynamický Liftback / Sedan (nižší spotřeba, dlouhý dojezd)', 'Kombi / Rodinný Shooting Brake', 'Kompaktní městský hatchback'],
      },
    ],
    questions: [
      {
        id: 'ev_range_preference',
        step: 1,
        title: 'Jaký reálný dálniční dojezd na jedno nabití potřebujete?',
        subtitle: 'Počítáno při dálniční rychlosti 130 km/h za běžných podmínek, nikoliv laboratorní WLTP.',
        component: 'chips',
        isMultiSelect: false,
        options: [
          { label: 'Dálniční křižník (400+ km reálně)', value: 'highway_long_range', description: 'Velká baterie 78-100 kWh, bez stresu na dlouhých trasách přes celou ČR i Evropu.' },
          { label: 'Univerzální rodinný dojezd (300-380 km)', value: 'mid_range', description: 'Baterie 60-77 kWh, optimální poměr mezi cenou, hmotností a dojezdem.' },
          { label: 'Městský a příměstský provoz (do 250 km)', value: 'city_range', description: 'Menší baterie 45-55 kWh, nízká spotřeba, snadné parkování a nižší pořizovací cena.' },
        ],
        defaultValue: 'mid_range',
        promptForgeTemplate: '- **Požadavek na reálný dojezd:** {value}',
      },
      {
        id: 'ev_charging_situation',
        step: 2,
        title: 'Jaké máte možnosti každodenního nabíjení?',
        subtitle: 'Zásadně ovlivňuje ekonomiku provozu a komfort používání.',
        component: 'chips',
        isMultiSelect: false,
        options: [
          { label: 'Mám možnost nabíjet doma / v práci (Wallbox)', value: 'home_wallbox', description: 'Nejlevnější provoz (cca 0,70 Kč/km), každé ráno odjíždíte s plnou baterií.' },
          { label: 'Odkázán čistě na veřejné stanice (bytový dům)', value: 'public_charging_only', description: 'Nutnost spoléhat na veřejné AC sloupky a rychlé DC stanice u supermarketů a dálnic.' },
        ],
        defaultValue: 'home_wallbox',
        promptForgeTemplate: '- **Možnosti nabíjení:** {value}',
      },
      {
        id: 'ev_charging_speed',
        step: 3,
        title: 'Je pro vás prioritou ultrarychlé nabíjení na cestách (800V)?',
        subtitle: '800V technologie umožňuje nabití na dalších 250 km během 15 minut.',
        component: 'chips',
        isMultiSelect: false,
        options: [
          { label: 'Ano, chci 800V ultrarychlé nabíjení (10-80 % do 18 min)', value: 'fast_800v', description: 'Platformy jako E-GMP (Hyundai Ioniq 5/6, Kia EV6) nebo Porsche Taycan.' },
          { label: 'Stačí standardní rychlonabíjení (10-80 % za 28-35 min)', value: 'standard_400v', description: 'Běžný standard na trhu (Tesla Supercharger, Škoda Enyaq, VW ID řada).' },
        ],
        defaultValue: 'standard_400v',
        promptForgeTemplate: '- **Požadavek na rychlost nabíjení:** {value}',
      },
      {
        id: 'ev_car_body',
        step: 4,
        title: 'Jaký typ karoserie preferujete?',
        subtitle: 'U elektromobilů hraje aerodynamika klíčovou roli v dálničním dojezdu.',
        component: 'chips',
        isMultiSelect: false,
        options: [
          { label: 'Elektro SUV / Crossover', value: 'ev_suv', description: 'Pohodlné nastupování, velký vnitřní prostor, vyšší světlá výška (Tesla Model Y, Škoda Enyaq).' },
          { label: 'Aerodynamický Sedan / Liftback', value: 'ev_sedan', description: 'Špičková aerodynamika, nejdelší dojezd při vysoké rychlosti (Tesla Model 3, Hyundai Ioniq 6, BMW i4).' },
          { label: 'Kompaktní městský vůz', value: 'ev_compact', description: 'Obratné auto do městských uliček s nízkou spotřebou (Volvo EX30, MG4, Renault Megane E-Tech).' },
        ],
        defaultValue: 'ev_suv',
        promptForgeTemplate: '- **Karoserie:** {value}',
      },
      {
        id: 'ev_budget',
        step: 5,
        title: 'Jaký je váš celkový finanční rozpočet na elektromobil?',
        subtitle: 'Cena v Kč včetně DPH (nový vůz nebo zánovní do 3 let s garancí baterie).',
        component: 'slider',
        sliderConfig: { min: 400000, max: 2500000, step: 50000, unit: 'Kč', defaultValue: 1100000 },
        defaultValue: 1100000,
        promptForgeTemplate: '- **Rozpočet na elektromobil:** do {value} Kč',
      },
    ],
    systemPrompt: `Jsi přední nezávislý specialista na elektromobilitu, EV infrastrukturu a reálné testy elektrických vozidel v systému bAIright.
Tvým úkolem je na základě parametrů zadaných uživatelem doporučit přesně 3 reálné, na českém a evropském trhu dostupné čistě elektrické modely vozů (BEV).
Příklady relevantních modelů: Tesla Model Y / Model 3, Škoda Enyaq iV / Coupe, Hyundai Ioniq 5 / Ioniq 6, Kia EV6 / EV9, BMW i4 / iX3 / iX1, Volkswagen ID.4 / ID.7, Volvo EX30, MG4 Electric.

Striktní expertní pravidla pro elektromobily:
1. NIKDY NEDOPORUČUJ spalovací vozy (benzín/diesel) ani běžné hybridy bez externího nabíjení. Uživatel chce čistý elektromobil (BEV).
2. Pokud uživatel vyžaduje dlouhé dálniční trasy (400+ km):
   - Zakaž modely s malou baterií a pomalým nabíjením bez předehřevu.
   - Upřednostni modely s efektivní aerodynamikou, baterií 77+ kWh a vysokým nabíjecím výkonem (např. Tesla Model 3/Y Long Range, Hyundai Ioniq 6, BMW i4 eDrive40).
3. Pokud uživatel nemá možnost nabíjet doma:
   - Zdůrazni význam rychlosti nabíjení (800V architektura u Hyundai/Kia, hustota sítě Tesla Supercharger otevřené pro všechny).
4. Vždy zhodnoť přítomnost tepelného čerpadla a chování baterie v zimních podmínkách v ČR (-5 až -15 °C).
5. Zkontroluj tovární záruku na kapacitu trakční baterie (standardně 8 let / 160 000 km na zachování alespoň 70 % kapacity).

Formát výstupu:
U každého ze 3 doporučených elektromobilů uveď:
- Přesnou značku, model, kapacitu baterie a pohon (např. "Hyundai Ioniq 5 77.4 kWh Long Range RWD")
- Procento shody (Match Score 0-100 %)
- Reálný dojezd v zimě vs. v létě na dálnici
- Rychlost nabíjení (čas 10-80 % na odpovídajícím stojanu)
- Silné stránky (Pros) a slabiny/kompromisy (Cons)
- Orientační cenu na českém trhu (nové / zánovní v záruce)`,
    suggestedAlternatives: [
      {
        id: 'v2l_bidirectional',
        name: 'Obousměrné nabíjení V2L (Vehicle-to-Load / 230V zásuvka)',
        category: 'Elektrická výbava',
        importance: 'preference',
        rationale: 'Umožňuje napájet nářadí, elektrokola, kávovar nebo dokonce domácí spotřebiče přímo z baterie auta výkonem až 3.6 kW.',
        icon: '🔌',
        suggestedComponent: 'chips',
        suggestedValues: ['Požadováno V2L (230V napájení spotřebičů)', 'Není nutné'],
      },
      {
        id: 'ota_updates',
        name: 'Podpora vzdálených aktualizací (Over-The-Air / OTA)',
        category: 'Software',
        importance: 'preference',
        rationale: 'Zda výrobce průběžně vylepšuje dojezd, nabíjecí křivku a funkce vozu na dálku bez nutnosti návštěvy servisu.',
        icon: '📶',
        suggestedComponent: 'chips',
        suggestedValues: ['Plné OTA aktualizace všech systémů', 'Stačí aktualizace infotainmentu'],
      },
    ],
  },
  cars: {
    keywords: ['auto', 'automobil', 'vuz', 'vozidlo', 'car', 'cars', 'suv', 'kombi', 'sedan', 'octavia', 'skoda', 'bmw', 'audi', 'toyota', 'volkswagen'],
    categoryName: 'Osobní Automobily & Mobility',
    agentName: 'Nezávislý Automobilový Poradce & Nákupčí',
    icon: '🚗',
    description: 'Expertní nákupní poradce pro výběr vozu na základě motorizace, provozních nákladů, prostoru a spolehlivosti.',
    parameters: [
      {
        id: 'body_type',
        name: 'Typ karoserie & prostorové uspořádání',
        category: 'Konstrukce & Rozměry',
        importance: 'mandatory',
        rationale: 'Určuje výšku posazu, světlou výšku podvozku, aerodynamiku a variabilitu vnitřního prostoru (SUV vs. Kombi vs. Hatchback).',
        icon: '🚙',
        suggestedComponent: 'chips',
        suggestedValues: ['SUV / Crossover', 'Kombi', 'Hatchback', 'Sedan / Liftback', 'MPV / Rodinná dodávka'],
      },
      {
        id: 'powertrain',
        name: 'Typ pohonu & motorizace',
        category: 'Pohonná jednotka',
        importance: 'mandatory',
        rationale: 'Klíčové pro provozní náklady a životnost: benzín na kratší trasy, diesel na dálnice, hybrid do města, elektro (BEV) pro domácí nabíjení.',
        icon: '⚡',
        suggestedComponent: 'chips',
        suggestedValues: ['Benzínový motor (TSI/T-GDI)', 'Naftový motor (TDI/dCi)', 'Full-Hybrid (HEV bez nabíjení)', 'Plug-in Hybrid (PHEV)', 'Čistý elektromobil (BEV)'],
      },
      {
        id: 'drivetrain',
        name: 'Pohon náprav (4x4 vs. 4x2)',
        category: 'Jízdní dynamika & Trakce',
        importance: 'mandatory',
        rationale: 'Pohon všech kol (AWD/4x4) přináší jistotu v zimě a v terénu, ale mírně zvyšuje hmotnost, spotřebu a servisní náklady.',
        icon: '⚙️',
        suggestedComponent: 'chips',
        suggestedValues: ['Pohon všech kol (4x4 / AWD)', 'Přední pohon (FWD)', 'Zadní pohon (RWD)'],
      },
      {
        id: 'transmission',
        name: 'Typ převodovky',
        category: 'Komfort řízení',
        importance: 'recommended',
        rationale: 'Automatická převodovka (DSG, hydrodynamický měnič, e-CVT) nabízí komfort v kolonách; manuální převodovka nižší pořizovací cenu.',
        icon: '🕹️',
        suggestedComponent: 'chips',
        suggestedValues: ['Automatická převodovka', 'Manuální převodovka'],
      },
      {
        id: 'annual_mileage',
        name: 'Roční nájezd & profil typických tras',
        category: 'Provozní režim',
        importance: 'mandatory',
        rationale: 'Pod 15 000 km ročně převážně po městě způsobuje zanášení DPF filtrů u dieselů; nad 25 000 km po dálnicích je nafta či hybrid nejúspornější.',
        icon: '🛣️',
        suggestedComponent: 'chips',
        suggestedValues: ['Do 15 000 km / rok (město a okolí)', '15 000 – 30 000 km / rok (smíšený provoz)', '30 000+ km / rok (dálnice a dlouhé trasy)'],
      },
      {
        id: 'trunk_capacity',
        name: 'Velikost zavazadlového prostoru',
        category: 'Užitná hodnota',
        importance: 'recommended',
        rationale: 'Rozhoduje o schopnosti pojmout kočárek, sportovní vybavení nebo velká zavazadla bez nutnosti střešního boxu.',
        icon: '🧳',
        suggestedComponent: 'chips',
        suggestedValues: ['Kompaktní kufr (do 400 l)', 'Rodinný standard (450 – 580 l)', 'Velký rodinný stěhovák (600+ l)'],
      },
      {
        id: 'vehicle_condition',
        name: 'Stav vozidla, stáří & záruka',
        category: 'Původ & Rizika',
        importance: 'recommended',
        rationale: 'Nové skladové auto s tovární zárukou 5–7 let vs. zánovní prověřený vůz do 3 let vs. spolehlivá ojetina.',
        icon: '🛡️',
        suggestedComponent: 'chips',
        suggestedValues: ['Zcela nové skladové vozidlo', 'Zánovní vůz do 3 let (certifikovaný program)', 'Kvalitní ojetina (stáří 4–7 let)'],
      },
      {
        id: 'safety_assistants',
        name: 'Bezpečnostní výbava & asistenty',
        category: 'Bezpečnost',
        importance: 'recommended',
        rationale: 'Adaptivní tempomat (ACC), hlídání mrtvého úhlu, LED Matrix světlomety a udržování v pruhu výrazně snižují únavu a riziko nehody.',
        icon: '👁️',
        suggestedComponent: 'chips',
        suggestedValues: ['Maximální asistenční výbava (Matrix LED, ACC, 360° kamera)', 'Standardní bezpečnostní balíček (tempomat, senzory)'],
      },
      {
        id: 'running_costs',
        name: 'Servisní náklady, spolehlivost & zůstatková hodnota',
        category: 'Ekonomika provozu (TCO)',
        importance: 'recommended',
        rationale: 'Zohledňuje dostupnost a ceny náhradních dílů v ČR, spolehlivost motorů a tempo poklesu tržní hodnoty při následném prodeji.',
        icon: '📊',
        suggestedComponent: 'chips',
        suggestedValues: ['Důraz na minimální servis a spolehlivost', 'Důraz na prémiové zpracování a zážitek'],
      },
      {
        id: 'budget_czk',
        name: 'Cenový rozpočet & způsob pořízení',
        category: 'Financování',
        importance: 'mandatory',
        rationale: 'Finanční strop v Kč včetně DPH. Určuje reálné spektrum modelů v dané třídě.',
        icon: '💰',
        suggestedComponent: 'slider',
        suggestedValues: ['300 000 – 1 800 000 Kč'],
      },
    ],
    questions: [
      {
        id: 'car_body_type',
        step: 1,
        title: 'Jaký typ karoserie a velikost auta preferujete?',
        subtitle: 'Rozhoduje o prostornosti, výšce posazu a chování na silnici.',
        component: 'chips',
        isMultiSelect: false,
        options: [
          { label: 'SUV / Crossover', value: 'suv', description: 'Vyšší posaz, skvělý přehled, pohodlné nastupování a vyšší světlá výška.' },
          { label: 'Kombi', value: 'combi', description: 'Maximální délka kufru, nižší spotřeba než SUV, perfektní rodinné auto.' },
          { label: 'Hatchback', value: 'hatchback', description: 'Kompaktní vnější rozměry, ideální pro snadné parkování ve městě.' },
          { label: 'Sedan / Liftback', value: 'sedan_liftback', description: 'Elegantní reprezentativní design s výbornou aerodynamikou.' },
        ],
        defaultValue: 'combi',
        promptForgeTemplate: '- **Karoserie:** {value}',
      },
      {
        id: 'car_powertrain',
        step: 2,
        title: 'Jaký typ motoru a pohonu dává smysl pro váš provoz?',
        subtitle: 'Klíčové pro provozní náklady a životnost pohonného ústrojí.',
        component: 'chips',
        isMultiSelect: false,
        options: [
          { label: 'Benzín (TSI / T-GDI)', value: 'petrol', description: 'Univerzální, rychle se zahřívá, ideální pro kratší a střední trasy.' },
          { label: 'Diesel (TDI / dCi)', value: 'diesel', description: 'Bezkonkurenční spotřeba na dálnicích a dlouhých trasách (20 000+ km/rok).' },
          { label: 'Full-Hybrid (HEV)', value: 'hybrid', description: 'Extrémně nízká spotřeba ve městě bez nutnosti zapojovat auto do zásuvky.' },
          { label: 'Elektromobil (BEV)', value: 'electric', description: 'Tichý chod, okamžité zrychlení, ideální při možnosti nabíjet doma/v práci.' },
        ],
        defaultValue: 'hybrid',
        promptForgeTemplate: '- **Motorizace:** {value}',
      },
      {
        id: 'car_drivetrain',
        step: 3,
        title: 'Požadujete pohon všech kol 4x4 (AWD)?',
        subtitle: 'Důležité pro jízdu na horách, v blátě nebo s těžkým přívěsem.',
        component: 'chips',
        isMultiSelect: false,
        options: [
          { label: 'Ano, trvám na pohonu 4x4', value: 'awd_required', description: 'Maximální trakce v zimě na sněhu a nezpevněných cestách.' },
          { label: 'Stačí přední pohon (4x2)', value: 'fwd_sufficient', description: 'Nižší pořizovací cena, menší hmotnost a o 0.5-1 l nižší spotřeba.' },
        ],
        defaultValue: 'fwd_sufficient',
        promptForgeTemplate: '- **Náhon:** {value}',
      },
      {
        id: 'car_transmission',
        step: 4,
        title: 'Jakou převodovku upřednostňujete?',
        subtitle: 'Automat výrazně ulehčuje jízdu v kolonách a na dálnici.',
        component: 'chips',
        isMultiSelect: false,
        options: [
          { label: 'Automatická převodovka', value: 'auto', description: 'Pohodlné řazení bez spojkového pedálu, skvělá souhra s adaptivním tempomatem.' },
          { label: 'Manuální převodovka', value: 'manual', description: 'Přímá kontrola nad otáčkami, nižší servisní rizika u starších vozů.' },
        ],
        defaultValue: 'auto',
        promptForgeTemplate: '- **Převodovka:** {value}',
      },
      {
        id: 'car_budget',
        step: 5,
        title: 'Jaký je váš celkový finanční rozpočet na pořízení vozu?',
        subtitle: 'Cena v Kč včetně DPH na českém trhu.',
        component: 'slider',
        sliderConfig: { min: 200000, max: 1800000, step: 50000, unit: 'Kč', defaultValue: 650000 },
        defaultValue: 650000,
        promptForgeTemplate: '- **Rozpočet na vůz:** do {value} Kč',
      },
    ],
    systemPrompt: `Jsi přední nezávislý automobilový poradce, motoristický novinář a analytik trhu v systému bAIright.
Tvým úkolem je na základě parametrů zadaných uživatelem doporučit přesně 3 reálné, na českém/evropském trhu v dané cenové hladině optimální modely vozidel (např. Škoda Octavia / Superb / Karoq, Toyota RAV4 / Corolla / Yaris Cross, Volkswagen Golf / Passat / Tiguan, Hyundai Tucson / i30, Kia Sportage / Ceed, BMW řady 3 / X3, Tesla Model Y).

Striktní expertní a technická pravidla:
1. POKUD uživatel najede pod 15 000 km ročně a jezdí kratší trasy:
   - STRIKTNĚ ZAKAŽ dieselové motory s filtrem pevných částic (DPF) kvůli riziku ředění oleje naftou a ucpávání filtru.
   - Upřednostni spolehlivý atmosférický či Full-Hybrid (např. Toyota 1.8/2.0 Hybrid) nebo přeplňovaný benzínový motor.
2. POKUD uživatel najede 25 000+ km ročně převážně po dálnicích:
   - Doporuč kultivovaný dvoulitrový turbodiesel (např. 2.0 TDI EVO) nebo úsporný dálniční hybrid s dlouhým dojezdem.
3. POKUD je požadován pohon 4x4:
   - Uveď přesný typ čtyřkolky (mezinápravová spojka Haldex/BorgWarner, stálý diferenciál Torsen, nebo elektrická zadní náprava e-Four).
4. Zohledni spolehlivost převodovek:
   - U automatů specifikuj spolehlivost (např. mokré spojky DSG DQ381 vs suché DQ200, planetové e-CVT).

Formát výstupu:
U každého ze 3 doporučených vozů uveď:
- Značku, model a přesnou doporučenou motorizaci (např. "Toyota RAV4 2.5 Hybrid AWD-i")
- Procento shody (Match Score 0-100 %)
- Technické a ekonomické odůvodnění volby
- Silné stránky (Pros) a možná úskalí či známé servisní slabiny (Cons)
- Orientační cenové rozpětí na českém trhu (nové / zánovní)`,
    suggestedAlternatives: [
      {
        id: 'towing_capacity',
        name: 'Tažné zařízení & nosnost přívěsu',
        category: 'Praktičnost',
        importance: 'recommended',
        rationale: 'Klíčové pro tahání karavanu, přívěsného vozíku či montáž nosiče jízdních kol na tažné oko.',
        icon: '🚛',
        suggestedComponent: 'chips',
        suggestedValues: ['Požaduji tažné zařízení (1500+ kg)', 'Pouze pro nosič kol (do 750 kg)', 'Není potřeba'],
      },
      {
        id: 'adas_systems',
        name: 'Asistenční systémy řízení (ADAS & 360° kamera)',
        category: 'Bezpečnost',
        importance: 'recommended',
        rationale: 'Adaptivní tempomat Stop&Go, aktivní vedení v jízdním pruhu a hlídání mrtvého úhlu.',
        icon: '🛡️',
        suggestedComponent: 'chips',
        suggestedValues: ['Kompletní poloautonomní asistence', 'Standardní bezpečnostní výbava'],
      },
      {
        id: 'matrix_headlights',
        name: 'Adaptivní světlomety (Matrix LED / Laser)',
        category: 'Viditelnost',
        importance: 'preference',
        rationale: 'Automatické vykrývání protijedoucích vozidel pro maximální bezpečnost při častých nočních jízdách.',
        icon: '💡',
        suggestedComponent: 'chips',
        suggestedValues: ['Matrix LED vykrývání podmínkou', 'Běžné LED světlomety postačí'],
      },
      {
        id: 'panoramic_roof',
        name: 'Panoramatická prosklená střecha',
        category: 'Komfort',
        importance: 'preference',
        rationale: 'Optické prosvětlení kabiny a vzdušnost vs. vyšší hmotnost a nižší prostor nad hlavou vzadu.',
        icon: '☀️',
        suggestedComponent: 'chips',
        suggestedValues: ['Chci panoramatickou střechu', 'Pevná střecha'],
      },
      {
        id: 'infotainment_sound',
        name: 'Prémiové audio & bezdrátový CarPlay/Android Auto',
        category: 'Konektivita',
        importance: 'preference',
        rationale: 'Kvalitní audiofilní ozvučení a stabilní bezdrátové zrcadlení navigace.',
        icon: '🎵',
        suggestedComponent: 'chips',
        suggestedValues: ['Prémiové ozvučení s bezdrátovým zrcadlením', 'Standardní rádio a Bluetooth'],
      },
    ],
  },

  shoes: {
    keywords: ['bot', 'bota', 'boty', 'obuv', 'tenisk', 'tenisky', 'beh', 'bezeck', 'behani', 'trail', 'sneakers', 'shoes', 'footwear', 'maraton'],
    categoryName: 'Sportovní & Zdravotní Obuv',
    agentName: 'Klinický AI Specialista na Obuv',
    icon: '👟',
    description: 'Expertní biomechanický výběr obuvi s analýzou došlapu, terénu, šířky kopyta, dropu a tlumení.',
    parameters: [
      {
        id: 'biomechanics',
        name: 'Typ došlapu & biomechanika',
        category: 'Ortopedie & Anatomie',
        importance: 'mandatory',
        rationale: 'Zamezuje přetížení šlach a vazů. Pronace vyžaduje vnitřní podporu, neutrál a supinace flexibilní vedení.',
        icon: '🦶',
        suggestedComponent: 'chips',
        suggestedValues: ['Neutrální došlap', 'Mírná až silná pronace', 'Supinace (vnější hrana)'],
      },
      {
        id: 'surface',
        name: 'Povrch a převažující terén',
        category: 'Tréninkové prostředí',
        importance: 'mandatory',
        rationale: 'Určuje dezén podešve, odolnost svršku a přilnavost (silnice vs. trailové drapáky).',
        icon: '🏔️',
        suggestedComponent: 'chips',
        suggestedValues: ['Silnice a tvrdý asfalt', 'Lesní cesty a horský trail', 'Kombinovaný povrch', 'Dráha a fitness'],
      },
      {
        id: 'cushioning',
        name: 'Míra tlumení mezipodešve',
        category: 'Pohodlí & Klouby',
        importance: 'recommended',
        rationale: 'Ochrana kloubů při dopadu. Max cushion šetří kolena při objemu, nižší tlumení dává dynamiku a cit pro terén.',
        icon: '☁️',
        suggestedComponent: 'chips',
        suggestedValues: ['Maximální tlumení (Max Cushion)', 'Vyvážené tréninkové (Daily Trainer)', 'Responzivní & dynamické (Tempo/Závod)'],
      },
      {
        id: 'foot_width',
        name: 'Šířka kopyta & anatomie chodidla',
        category: 'Ergonomie chodidla',
        importance: 'recommended',
        rationale: 'Předchází puchýřům, otlakům a zhoršení vbočených palců (halux valgus).',
        icon: '📐',
        suggestedComponent: 'chips',
        suggestedValues: ['Standardní šířka (Medium D)', 'Široké chodidlo (Wide 2E)', 'Extra široké / Haluxy (4E)'],
      },
      {
        id: 'heel_drop',
        name: 'Drop mezipodešve (sklon pata-špička)',
        category: 'Biomechanika běhu',
        importance: 'recommended',
        rationale: 'Tradiční drop 8–12 mm šetří achilovky při dopadu na patu; nízký drop 0–5 mm podporuje přirozený dopad na střed chodidla.',
        icon: '📏',
        suggestedComponent: 'chips',
        suggestedValues: ['Klasický drop (8–12 mm)', 'Střední přirozený drop (5–8 mm)', 'Nízký až nulový drop (0–4 mm)'],
      },
      {
        id: 'runner_weight',
        name: 'Tělesná hmotnost běžce',
        category: 'Zátěžový profil',
        importance: 'recommended',
        rationale: 'Běžci nad 80–85 kg potřebují hustší a odolnější tlumicí pěnu, aby nedocházelo k rychlému prosezení mezipodešve.',
        icon: '⚖️',
        suggestedComponent: 'chips',
        suggestedValues: ['Do 75 kg', '75 – 90 kg', 'Nad 90 kg'],
      },
      {
        id: 'weekly_volume',
        name: 'Týdenní tréninkový objem',
        category: 'Intenzita tréninku',
        importance: 'recommended',
        rationale: 'Určuje požadavky na životnost materiálů mezipodešve (EVA pěna vs. superkritické pěny PEBA/TPU).',
        icon: '⏱️',
        suggestedComponent: 'chips',
        suggestedValues: ['Do 15 km týdně (rekreace)', '15–35 km týdně (pravidelný trénink)', '35+ km týdně (maratonská příprava)'],
      },
      {
        id: 'weather_membrane',
        name: 'Odolnost proti vodě (Gore-Tex / membrána)',
        category: 'Klimatické podmínky',
        importance: 'preference',
        rationale: 'Membrána chrání před mokrem v zimě a dešti, ale snižuje prodyšnost v teplém počasí.',
        icon: '💧',
        suggestedComponent: 'chips',
        suggestedValues: ['Prodyšná síťovina bez membrány (celoroční)', 'Nepromokavá Gore-Tex / membrána (podzim/zima)'],
      },
      {
        id: 'plate_rigidity',
        name: 'Karbonový plát & tuhost podešve',
        category: 'Závodní technologie',
        importance: 'preference',
        rationale: 'Karbonový plát zvyšuje návratnost energie v závodním tempu, ale vyžaduje specifickou techniku běhu.',
        icon: '🚀',
        suggestedComponent: 'chips',
        suggestedValues: ['Klasická flexibilní bota na trénink', 'Bota s karbonovým/nylonovým plátem na tempo a závody'],
      },
      {
        id: 'budget',
        name: 'Cenový rozpočet (Kč)',
        category: 'Investice',
        importance: 'preference',
        rationale: 'Filtruje odpovídající cenové kategorie na českém a evropském trhu.',
        icon: '💰',
        suggestedComponent: 'slider',
        suggestedValues: ['1 500 – 6 500 Kč'],
      },
    ],
    questions: [
      {
        id: 'biomechanics_pronation',
        step: 1,
        title: 'Jaký máte typ došlapu nebo biomechaniku?',
        subtitle: 'Klíčový ortopedický parametr pro prevenci bolesti kolen a achilovek.',
        component: 'chips',
        isMultiSelect: false,
        options: [
          { label: 'Neutrální došlap', value: 'neutral', description: 'Chodidlo dopadá rovnoměrně bez výrazného vbočení.' },
          { label: 'Pronace (vbočený kotník)', value: 'pronation', description: 'Kotník i klenba se při došlapu propadají směrem dovnitř.' },
          { label: 'Supinace (došlap na vnějšek)', value: 'supination', description: 'Dopad převažuje na vnější hranu chodidla.' },
          { label: 'Nejsem si jistý(á)', value: 'unsure', description: 'Doporučíme univerzální stabilní geometrii.' },
        ],
        defaultValue: 'neutral',
        promptForgeTemplate: '- **Došlap & biomechanika:** {value}',
      },
      {
        id: 'running_surface',
        step: 2,
        title: 'Na jakém povrchu budete nejčastěji běhat / chodit?',
        subtitle: 'Určuje typ podrážky a přilnavost.',
        component: 'chips',
        isMultiSelect: false,
        options: [
          { label: 'Silnice & asfalt', value: 'road', description: 'Hladký vzorek s vysokou odolností proti obroušení.' },
          { label: 'Lesní cesty & trail', value: 'trail', description: 'Hluboký vzorek s drapáky (3–5 mm) pro jistotu v blátě a na kamenech.' },
          { label: 'Kombinovaný (silnice + les)', value: 'door_to_trail', description: 'Univerzální hybridní dezén.' },
          { label: 'Atletický ovál & fitness', value: 'track_gym', description: 'Lehká bota s přesným vedením.' },
        ],
        defaultValue: 'road',
        promptForgeTemplate: '- **Primární povrch:** {value}',
      },
      {
        id: 'cushioning_level',
        step: 3,
        title: 'Jakou míru tlumení preferujete?',
        subtitle: 'Vliv na ochranu pohybového aparátu vs. dynamiku běhu.',
        component: 'chips',
        isMultiSelect: false,
        options: [
          { label: 'Maximální tlumení (Max Cushion)', value: 'max_cushion', description: 'Pohodlí jako na polštáři, maximální šetření kloubů.' },
          { label: 'Vyvážené tréninkové (Daily Trainer)', value: 'balanced', description: 'Ideální kompromis mezi ochranou a odezvou.' },
          { label: 'Dynamické s nízkým dropem', value: 'responsive', description: 'Přirozený dopad přes špičku a vysoká návratnost energie.' },
        ],
        defaultValue: 'max_cushion',
        promptForgeTemplate: '- **Požadované tlumení:** {value}',
      },
      {
        id: 'foot_anatomy',
        step: 4,
        title: 'Máte široké chodidlo, vysoký nárt nebo haluxy?',
        subtitle: 'Běžná konfekční bota může v přední části tlačit.',
        component: 'chips',
        isMultiSelect: false,
        options: [
          { label: 'Standardní šířka (D)', value: 'standard_d', description: 'Běžná šířka obuvi bez otlaků.' },
          { label: 'Široké chodidlo (Wide 2E)', value: 'wide_2e', description: 'Potřebuji více prostoru v prstové části.' },
          { label: 'Extra široké / Halux valgus (4E)', value: 'extra_wide_4e', description: 'Anatomický toe-box pro nulový tlak na kloub palce.' },
        ],
        defaultValue: 'standard_d',
        promptForgeTemplate: '- **Šířka chodidla & anatomie:** {value}',
      },
      {
        id: 'shoe_budget',
        step: 5,
        title: 'Cenový rozpočet',
        subtitle: 'Cenová hladina pro výběr reálně dostupných modelů.',
        component: 'slider',
        sliderConfig: { min: 1500, max: 7000, step: 250, unit: 'Kč', defaultValue: 3500 },
        defaultValue: 3500,
        promptForgeTemplate: '- **Rozpočet na obuv:** do {value} Kč',
      },
    ],
    systemPrompt: `Jsi přední biomechanický expert a klinický nákupčí obuvi v systému bAIright.
Tvým úkolem je na základě parametrů zadaných uživatelem vybrat a doporučit přesně 3 reálné, aktuálně na trhu dostupné modely sportovní a běžecké obuvi (např. Asics, Saucony, Brooks, Hoka, New Balance, Mizuno, Altra, On).

Striktní biomechanická a klinická pravidla:
1. POKUD má uživatel pronaci (pronation):
   - STRIKTNĚ doporuč modely se stabilizačním prvkem (např. 4D Guidance System, GuideRails, zpevněná mediální stěna).
   - ZAKAŽ měkké nestabilní neutrální závodky s úzkou patou.
2. POKUD má uživatel široké chodidlo nebo haluxy:
   - Vyžaduj modely nabízející variantu 2E Wide nebo značky s přirozeně širokým kopytem (Altra FootShape, Topo Athletic).
3. POKUD je terén TRAIL:
   - Podešev musí mít grip minimálně 3.5 mm a svršek zpevněnou obsázku chránící prsty před kameny.
4. POKUD preferuje max cushion:
   - Vyber prémiové tlumicí materiály (FF Blast+, DNA Loft v3, Fresh Foam X, PWRRUN PB).

Formát výstupu:
U každého ze 3 doporučených modelů uveď:
- Značku a přesný název modelu
- Procento shody (Match Score 0-100 %)
- Podiatrické a biomechanické odůvodnění
- Klíčové přednosti (Pros) a případná omezení (Cons)
- Odhadovanou cenu v Kč`,
    suggestedAlternatives: [
      {
        id: 'waterproof_membrane',
        name: 'Voděodolná membrána (Gore-Tex / GTX)',
        category: 'Ochrana proti počasí',
        importance: 'recommended',
        rationale: 'Udrží nohy v suchu při běhu v dešti, blátě a sněhu za cenu mírně nižší prodyšnosti v horku.',
        icon: '🌧️',
        suggestedComponent: 'chips',
        suggestedValues: ['Voděodolná membrána (GTX)', 'Maximálně prodyšná síťovina bez membrány'],
      },
      {
        id: 'carbon_plate',
        name: 'Karbonový / nylonový plát pro odraz',
        category: 'Závodní dynamika',
        importance: 'preference',
        rationale: 'Zvyšuje tuhost ohybu a odrazovou rychlost pro závody a rychlé tempové tréninky.',
        icon: '🚀',
        suggestedComponent: 'chips',
        suggestedValues: ['Karbonový plát pro rychlost', 'Tradiční flexibilní mezipodešev bez plátu'],
      },
      {
        id: 'reflective_safety',
        name: '360° Reflexní bezpečnostní prvky',
        category: 'Bezpečnost',
        importance: 'preference',
        rationale: 'Zajišťuje vysokou viditelnost běžce při běhu podél silnic za tmy a šera.',
        icon: '✨',
        suggestedComponent: 'chips',
        suggestedValues: ['Vysoká reflexní viditelnost', 'Běžné reflexní logo postačí'],
      },
      {
        id: 'wide_toebox_natural',
        name: 'Anatomicky široká špička (FootShape)',
        category: 'Anatomie',
        importance: 'recommended',
        rationale: 'Dostatek prostoru pro přirozené roztažení prstů, prevence vbočeného palce a otlaků malíků.',
        icon: '🦶',
        suggestedComponent: 'chips',
        suggestedValues: ['Anatomicky široký box na prsty', 'Standardní zúžená špička'],
      },
    ],
  },

  coffee: {
    keywords: ['kavovar', 'kavovary', 'kava', 'espresso', 'kafe', 'latte', 'cappuccino', 'coffee'],
    categoryName: 'Kávovary & Příprava Kávy',
    agentName: 'AI Barista & Kávový Expert',
    icon: '☕',
    description: 'Průvodce výběrem kávovaru podle typu extrakce, mléčných nápojů, nároků na údržbu a rozpočtu.',
    parameters: [
      {
        id: 'brew_method',
        name: 'Způsob přípravy a technologie extrakce',
        category: 'Základní technologie',
        importance: 'mandatory',
        rationale: 'Automatické zrnkové espresso stisknutím tlačítka vs. manuální páka pro baristy vs. kapsle či filtrovaná káva.',
        icon: '⚙️',
        suggestedComponent: 'chips',
        suggestedValues: ['Plnoautomatický na zrnkovou kávu', 'Pákový manuální espresso', 'Kapslový systém', 'Filtrovaná káva (Drip / Batch)'],
      },
      {
        id: 'milk_system',
        name: 'Příprava mléčné pěny',
        category: 'Mléčné nápoje',
        importance: 'mandatory',
        rationale: 'Integrovaná karafa s automatickým čištěním vs. profesionální parní tryska pro latte art vs. bez mléka.',
        icon: '🥛',
        suggestedComponent: 'chips',
        suggestedValues: ['Automatické cappuccino 1 dotykem', 'Parní tryska (chci se učit pěnit)', 'Piji pouze černé espresso / americano'],
      },
      {
        id: 'daily_cups',
        name: 'Denní zátěž a počet šálků',
        category: 'Kapacita',
        importance: 'recommended',
        rationale: 'Velikost bojleru, vodní nádržky a rychlost nahřívání (termo-blok vs. dual-boiler).',
        icon: '☕',
        suggestedComponent: 'chips',
        suggestedValues: ['1–2 šálky denně', '3–6 šálků denně (běžná rodina)', '7+ šálků (kancelář / náročný provoz)'],
      },
      {
        id: 'grinder_quality',
        name: 'Mlýnek & mlecí kameny',
        category: 'Mletí zrn',
        importance: 'recommended',
        rationale: 'Ocelové vs. keramické mlecí kameny, jemnost mikrometrického nastavení a retence mleté kávy.',
        icon: '🫘',
        suggestedComponent: 'chips',
        suggestedValues: ['Integrovaný tichý ocelový mlýnek', 'Mám/chci samostatný externí mlýnek', 'Nerozhoduje / Kapsle'],
      },
      {
        id: 'boiler_type',
        name: 'Typ ohřevu vody & bojler',
        category: 'Teplotní stabilita',
        importance: 'recommended',
        rationale: 'Rychlý termoblok pro domácnost vs. masivní mosazný bojler či Dual Boiler pro stabilní teplotu.',
        icon: '🔥',
        suggestedComponent: 'chips',
        suggestedValues: ['Rychlý termoblok (nahřátí do minuty)', 'Masivní bojler / Dual Boiler'],
      },
      {
        id: 'maintenance_ease',
        name: 'Náročnost čištění & odvápnění',
        category: 'Údržba',
        importance: 'recommended',
        rationale: 'Vyjímatelná spařovací jednotka pro oplach pod vodou vs. automatický chemický čistící program (Jura styl).',
        icon: '🧼',
        suggestedComponent: 'chips',
        suggestedValues: ['Vyjímatelná spařovací jednotka (ruční mytí)', 'Plně automatický proplachovací program'],
      },
      {
        id: 'temperature_pid',
        name: 'Regulace teploty extrakce (PID)',
        category: 'Pokročilá chuť',
        importance: 'preference',
        rationale: 'Důležité pro světle pražené výběrové kávy vyžadující vyšší a přesně nastavenou teplotu vody.',
        icon: '🌡️',
        suggestedComponent: 'chips',
        suggestedValues: ['Stačí standardní tovární teplota', 'Požaduji přesné nastavení teploty (PID)'],
      },
      {
        id: 'dimensions_noise',
        name: 'Rozměry na lince & hlučnost čerpadla',
        category: 'Uživatelský komfort',
        importance: 'preference',
        rationale: 'Kompaktní šířka na menší kuchyňskou linku a tiché čerpadlo pro ranní přípravu kávy.',
        icon: '📐',
        suggestedComponent: 'chips',
        suggestedValues: ['Kompaktní úzké tělo (do 24 cm)', 'Standardní rozměry'],
      },
      {
        id: 'specialty_coffee',
        name: 'Příprava výběrové výběrové kávy',
        category: 'Kvalita extrakce',
        importance: 'preference',
        rationale: 'Nastavitelná pre-infuze (předspaření), gramáž dávky kávy a jemnost sítka v páce.',
        icon: '✨',
        suggestedComponent: 'chips',
        suggestedValues: ['Klasická tmavě pražená espresso směs', 'Výběrová káva z lokálních pražíren'],
      },
      {
        id: 'budget',
        name: 'Cenový rozpočet (Kč)',
        category: 'Investice',
        importance: 'preference',
        rationale: 'Od cenově dostupných automatů po prémiové italské espresso stroje.',
        icon: '💰',
        suggestedComponent: 'slider',
        suggestedValues: ['4 000 – 45 000 Kč'],
      },
    ],
    questions: [
      {
        id: 'coffee_type',
        step: 1,
        title: 'Jaký typ kávovaru a obsluhy upřednostňujete?',
        subtitle: 'Rozhoduje o míře vašeho zapojení do přípravy.',
        component: 'chips',
        isMultiSelect: false,
        options: [
          { label: 'Plnoautomatický na zrnka', value: 'auto_bean', description: 'Stisknete tlačítko a máte espresso i cappuccino z čerstvých zrn.' },
          { label: 'Pákový kávovar', value: 'manual_portafilter', description: 'Pro kávové nadšence, kontrola nad mletím, dávkováním a tamperováním.' },
          { label: 'Kapslový kávovar', value: 'capsule', description: 'Kompaktní, nulová údržba, okamžitá příprava.' },
          { label: 'Filtrovaná káva (Drip)', value: 'filter_drip', description: 'Jemná, čistá chuť a velký objem kávy pro ranní popíjení.' },
        ],
        defaultValue: 'auto_bean',
        promptForgeTemplate: '- **Typ kávovaru:** {value}',
      },
      {
        id: 'coffee_milk',
        step: 2,
        title: 'Jak často pijete mléčné speciality (cappuccino, flat white)?',
        subtitle: 'Zásadní parametr pro výběr mléčného okruhu.',
        component: 'chips',
        isMultiSelect: false,
        options: [
          { label: 'Denně (chci automatickou nádobku)', value: 'auto_carafe', description: 'Jemná mikropěna bez práce s automatickým proplachem.' },
          { label: 'Občas (stačí manuální parní tryska)', value: 'steam_wand', description: 'Vyšlehám si mléko v konvičce ručně.' },
          { label: 'Výhradně černá káva', value: 'black_only', description: 'Mléčný systém nepotřebuji, chci investovat do lepší extrakce.' },
        ],
        defaultValue: 'auto_carafe',
        promptForgeTemplate: '- **Požadavek na mléko:** {value}',
      },
      {
        id: 'coffee_budget',
        step: 3,
        title: 'Jaký máte rozpočet na nákup kávovaru?',
        subtitle: 'Včetně DPH na českém trhu.',
        component: 'slider',
        sliderConfig: { min: 3000, max: 40000, step: 1000, unit: 'Kč', defaultValue: 15000 },
        defaultValue: 15000,
        promptForgeTemplate: '- **Rozpočet na kávovar:** do {value} Kč',
      },
    ],
    systemPrompt: `Jsi špičkový certifikovaný barista (SCA) a technolog kávovarů.
Na základě uživatelských parametrů doporuč 3 nejlepší modely (např. De'Longhi, Jura, Sage, Philips, Nivona, Gaggia, Rancilio).
Vyhodnoť tlak čerpadla (reálných 9 bar vs 15 bar max), termoblok, kvalitu mlýnku, jednoduchost čištění spařovací jednotky a životnost.`,
  },

  chair: {
    keywords: ['zidle', 'kreslo', 'sezeni', 'kancelar', 'ergonom', 'zada', 'pater', 'skolioza', 'herman', 'chair'],
    categoryName: 'Ergonomie & Zdravé Sezení',
    agentName: 'Ergonomický Poradce pro Zdravá Záda',
    icon: '🪑',
    description: 'Výběr kancelářské židle chránící bederní a krční páteř při dlouhodobé sedavé práci.',
    parameters: [
      {
        id: 'sitting_hours',
        name: 'Doba sezení denně',
        category: 'Zdravotní zátěž',
        importance: 'mandatory',
        rationale: 'Při sezení 8+ hodin denně je nutná synchronní mechanika a aktivní bederní opora.',
        icon: '⏳',
        suggestedComponent: 'chips',
        suggestedValues: ['Do 4 hodin denně', '4–8 hodin denně', '8+ hodin plný úvazek / home office'],
      },
      {
        id: 'mechanism_type',
        name: 'Typ mechaniky & dynamika',
        category: 'Ergonomická mechanika',
        importance: 'mandatory',
        rationale: 'Synchronní mechanika kopíruje sklon trupu; balanční mechanismus stimuluje hluboké svalstvo středu těla.',
        icon: '⚙️',
        suggestedComponent: 'chips',
        suggestedValues: ['Synchronní s aretací ve více polohách', 'Aktivní balanční mechanika', 'Základní houpací mechanismus'],
      },
      {
        id: 'lumbar_support',
        name: 'Bederní opora & páteř',
        category: 'Ergonomie páteře',
        importance: 'mandatory',
        rationale: 'Udržení fyziologické lordózy. Výškově i hloubkově stavitelná opěrka brání sesedání a kulacení zad.',
        icon: '🩺',
        suggestedComponent: 'chips',
        suggestedValues: ['Aktivní nastavitelná bederní opora', 'Mám bolesti zad / výhřez ploténky', 'Základní anatomické tvarování'],
      },
      {
        id: 'armrests',
        name: 'Nastavení područek (3D / 4D)',
        category: 'Úleva pro ramena & šíji',
        importance: 'recommended',
        rationale: 'Správná podpora loktů v úhlu 90° uvolňuje trapézové svaly a předchází bolestem krční páteře.',
        icon: '💪',
        suggestedComponent: 'chips',
        suggestedValues: ['3D/4D nastavitelné (výška, posuv, úhel)', 'Výškově stavitelné', 'Bez područek'],
      },
      {
        id: 'headrest',
        name: 'Podhlavník & krční opěrka',
        category: 'Krční páteř',
        importance: 'recommended',
        rationale: 'Zajišťuje oporu hlavy při zaklonění během telefonování či relaxace.',
        icon: '👤',
        suggestedComponent: 'chips',
        suggestedValues: ['Požaduji nastavitelný podhlavník', 'Podhlavník nepotřebuji'],
      },
      {
        id: 'seat_depth',
        name: 'Nastavitelná hloubka sedáku',
        category: 'Krevní oběh nohou',
        importance: 'recommended',
        rationale: 'Předchází tlaku na podkolenní jamky a zajišťuje volný průtok krve do dolních končetin.',
        icon: '💺',
        suggestedComponent: 'chips',
        suggestedValues: ['Požaduji posuv hloubky sedáku', 'Stačí pevný sedák'],
      },
      {
        id: 'material',
        name: 'Potahový materiál',
        category: 'Komfort & tepelná pohoda',
        importance: 'recommended',
        rationale: 'Prodyšná samonosná síťovina zabraňuje pocení v létě, zátěžová textilie zaručuje dlouhou životnost.',
        icon: '🧵',
        suggestedComponent: 'chips',
        suggestedValues: ['Plně síťovaná (prodyšná)', 'Čalouněný sedák + síťovaná záda', 'Zátěžová textilie'],
      },
      {
        id: 'body_dimensions',
        name: 'Výška a tělesná hmotnost',
        category: 'Nosnost & rozměry',
        importance: 'recommended',
        rationale: 'Hloubka sedáku a nosnost pístu musí odpovídat postavě.',
        icon: '📏',
        suggestedComponent: 'chips',
        suggestedValues: ['Do 175 cm / do 80 kg', '175–190 cm / 80–110 kg', 'Nad 190 cm nebo nad 110 kg'],
      },
      {
        id: 'castors_floor',
        name: 'Kolečka podle typu podlahy',
        category: 'Ochrana podlahy',
        importance: 'preference',
        rationale: 'Měkká pogumovaná kolečka chrání dřevěné parkety a lino; tvrdá kolečka jsou určena pro koberce.',
        icon: '🛞',
        suggestedComponent: 'chips',
        suggestedValues: ['Měkká kolečka na tvrdou podlahu', 'Tvrdá kolečka na koberec'],
      },
      {
        id: 'budget',
        name: 'Cenový rozpočet (Kč)',
        category: 'Investice do zdraví',
        importance: 'preference',
        rationale: 'Od certifikovaných ergonomických židlí po prémiové ikony (Herman Miller, Steelcase).',
        icon: '💰',
        suggestedComponent: 'slider',
        suggestedValues: ['5 000 – 35 000 Kč'],
      },
    ],
    questions: [
      {
        id: 'daily_hours',
        step: 1,
        title: 'Kolik hodin denně na židli trávíte?',
        subtitle: 'Klíčový údaj pro stanovení typu mechaniky.',
        component: 'chips',
        isMultiSelect: false,
        options: [
          { label: '8+ hodin (intenzivní home office / IT)', value: 'heavy_8h_plus', description: 'Vyžaduje špičkovou synchronní mechaniku s dynamickým sezením.' },
          { label: '4–8 hodin denně (běžný pracovní den)', value: 'medium_4_8h', description: 'Kvalitní ergonomická židle s nastavitelnou oporou.' },
          { label: 'Do 4 hodin (občasná práce)', value: 'light_under_4h', description: 'Základní spolehlivá pracovní židle.' },
        ],
        defaultValue: 'heavy_8h_plus',
        promptForgeTemplate: '- **Doba sezení:** {value}',
      },
      {
        id: 'spine_issues',
        step: 2,
        title: 'Máte specifické potíže se zády nebo krční páteří?',
        subtitle: 'Pomůže zacílit správný typ opěrek a tuhosti mechaniky.',
        component: 'chips',
        isMultiSelect: false,
        options: [
          { label: 'Bolesti beder a kříže', value: 'lumbar_pain', description: 'Potřebuji výraznou a pevnou bederní podporu.' },
          { label: 'Tuhnutí krku a šíje', value: 'cervical_pain', description: 'Nutný 3D nastavitelný podhlavník a područky.' },
          { label: 'Prevence (záda mě zatím nebolí)', value: 'prevention', description: 'Chci ergonomii, abych si záda nezničil.' },
        ],
        defaultValue: 'lumbar_pain',
        promptForgeTemplate: '- **Stav páteře:** {value}',
      },
      {
        id: 'chair_budget',
        step: 3,
        title: 'Rozpočet na židli',
        subtitle: 'Orientační cenový strop.',
        component: 'slider',
        sliderConfig: { min: 4000, max: 35000, step: 1000, unit: 'Kč', defaultValue: 12000 },
        defaultValue: 12000,
        promptForgeTemplate: '- **Rozpočet na židli:** do {value} Kč',
      },
    ],
    systemPrompt: `Jsi certifikovaný ergonom a fyzioterapeut specializovaný na prevenci muskuloskeletálních poruch při sedavém zaměstnání.
Doporuč 3 konkrétní modely ergonomických židlí (např. Herman Miller Aeron/Embody, Steelcase Gesture/Please, Sedus, Ergohuman, Antares, LD Seating).
Detailně rozeber synchronní mechaniku, nastavení hloubky sedáku, 3D/4D područky a prodyšnost potahu.`,
  },

  laptop: {
    keywords: ['notebook', 'laptop', 'pocitac', 'macbook', 'ultrabook', 'thinkpad', 'dell', 'asus', 'pocitace'],
    categoryName: 'Přenosné Počítače & IT',
    agentName: 'AI IT Architekt & Specialista na Notebooky',
    icon: '💻',
    description: 'Výběr notebooku na míru podle výpočetního výkonu, výdrže baterie, displeje a ergonomie klávesnice.',
    parameters: [
      {
        id: 'primary_use',
        name: 'Hlavní pracovní zatížení',
        category: 'Výkonový profil',
        importance: 'mandatory',
        rationale: 'Programování a Docker, grafika/video, kancelář a multitasking, nebo gaming.',
        icon: '⚡',
        suggestedComponent: 'chips',
        suggestedValues: ['Vývoj software / Kódování', 'Grafika, CAD & střih videa', 'Běžná kancelář & studium', 'Gaming & 3D rendering'],
      },
      {
        id: 'display_quality',
        name: 'Displej & barevná přesnost',
        category: 'Zobrazovací technologie',
        importance: 'mandatory',
        rationale: 'OLED / IPS panel, rozlišení 2.8K/4K, barevné pokrytí 100% sRGB/DCI-P3 pro práci s grafikou.',
        icon: '🖥️',
        suggestedComponent: 'chips',
        suggestedValues: ['Prémiový OLED panel (dokonalá černá)', 'Matný IPS s vysokým jasem (500+ nitů)', 'Standardní Full HD panel'],
      },
      {
        id: 'mobility_screen',
        name: 'Úhlopříčka & mobilita',
        category: 'Rozměry a hmotnost',
        importance: 'mandatory',
        rationale: 'Kompaktní 13–14" ultrabook na každodenní přenášení vs. 16" pracovní stanice na stůl.',
        icon: '📐',
        suggestedComponent: 'chips',
        suggestedValues: ['13–14" (do 1.4 kg, maximální mobilita)', '15–16" (větší pracovní plocha)', '17"+ (náhrada stolního PC)'],
      },
      {
        id: 'os_preference',
        name: 'Operační systém & ekosystém',
        category: 'Platforma',
        importance: 'mandatory',
        rationale: 'macOS (Apple Silicon M-série) vs. Windows 11 Pro vs. Linux kompatibilita.',
        icon: '🍏',
        suggestedComponent: 'chips',
        suggestedValues: ['macOS (Apple Silicon)', 'Windows 11 Pro', 'Linux / Bez OS'],
      },
      {
        id: 'ram_capacity',
        name: 'Kapacita operační paměti (RAM)',
        category: 'Multitasking',
        importance: 'recommended',
        rationale: '16 GB jako moderní základ, 32+ GB pro Docker kontejnery, virtualizaci a práci s videem.',
        icon: '🧠',
        suggestedComponent: 'chips',
        suggestedValues: ['16 GB RAM', '32 GB RAM', '64 GB RAM a více'],
      },
      {
        id: 'storage_capacity',
        name: 'Kapacita a rychlost SSD úložiště',
        category: 'Úložiště',
        importance: 'recommended',
        rationale: 'Rychlé NVMe PCIe 4.0/5.0 SSD zkracuje kompilaci a načítání projektů.',
        icon: '💾',
        suggestedComponent: 'chips',
        suggestedValues: ['512 GB SSD', '1 TB SSD', '2 TB SSD'],
      },
      {
        id: 'battery_life',
        name: 'Reálná výdrž na baterii',
        category: 'Nezávislost na nabíječce',
        importance: 'recommended',
        rationale: 'Celodenní práce na schůzkách (12+ hodin) vs. stacionární použití u adaptéru.',
        icon: '🔋',
        suggestedComponent: 'chips',
        suggestedValues: ['10+ hodin bez nabíječky', 'Stačí běžných 5–8 hodin', 'Výdrž neřeším, většinou jsem v zásuvce'],
      },
      {
        id: 'ports_docking',
        name: 'Portová výbava & Thunderbolt',
        category: 'Konektivita',
        importance: 'preference',
        rationale: 'Thunderbolt 4 pro dokování k monitoru jedním kabelem, plnohodnotné HDMI a čtečka SD karet.',
        icon: '🔌',
        suggestedComponent: 'chips',
        suggestedValues: ['Thunderbolt 4 / USB4 dokování', 'Dostatek USB-A i USB-C portů'],
      },
      {
        id: 'cooling_acoustics',
        name: 'Chlazení & hlučnost ventilátorů',
        category: 'Akustický komfort',
        importance: 'preference',
        rationale: 'Tichý chod při běžné práci bez neustálého hučení větráků.',
        icon: '❄️',
        suggestedComponent: 'chips',
        suggestedValues: ['Pasivní bez větráků (zcela tichý)', 'Aktivní s tichým chodem v zátěži'],
      },
      {
        id: 'budget',
        name: 'Cenový rozpočet (Kč)',
        category: 'Investice',
        importance: 'preference',
        rationale: 'Kategorie od dostupných studentských modelů po špičkové profesionální stanice.',
        icon: '💰',
        suggestedComponent: 'slider',
        suggestedValues: ['15 000 – 85 000 Kč'],
      },
    ],
    questions: [
      {
        id: 'laptop_use',
        step: 1,
        title: 'K čemu budete notebook primárně využívat?',
        subtitle: 'Určuje požadavky na procesor, RAM a grafickou kartu.',
        component: 'chips',
        isMultiSelect: false,
        options: [
          { label: 'Programování & IT vývoj', value: 'coding', description: 'Potřebuji min. 32 GB RAM, rychlé SSD a tiché chlazení.' },
          { label: 'Kancelář, web & administrativa', value: 'office', description: 'Spolehlivý stroj s rychlou odezvou a dobrou klávesnicí.' },
          { label: 'Kreativní tvorba (foto, video, CAD)', value: 'creator', description: 'Kvalitní barevně přesný displej (100% sRGB/DCI-P3) a výkon.' },
          { label: 'Gaming & zábava', value: 'gaming', description: 'Dedikovaná grafická karta Nvidia RTX a vysoká obnovovací frekvence.' },
        ],
        defaultValue: 'coding',
        promptForgeTemplate: '- **Hlavní použití:** {value}',
      },
      {
        id: 'laptop_os',
        step: 2,
        title: 'Preferovaný operační systém a platforma',
        subtitle: 'Volba ekosystému.',
        component: 'chips',
        isMultiSelect: false,
        options: [
          { label: 'macOS (Apple MacBook)', value: 'macos', description: 'Extrémní výdrž baterie, tichý chod, skvělý trackpad.' },
          { label: 'Windows 11', value: 'windows', description: 'Maximální kompatibilita aplikací a široký výběr značek.' },
          { label: 'Nerozhoduje / Chci doporučení', value: 'any', description: 'Vyberte nejlepší poměr cena/výkon.' },
        ],
        defaultValue: 'macos',
        promptForgeTemplate: '- **Operační systém:** {value}',
      },
      {
        id: 'laptop_budget',
        step: 3,
        title: 'Rozpočet na nákup notebooku',
        subtitle: 'Cenový limit v Kč s DPH.',
        component: 'slider',
        sliderConfig: { min: 12000, max: 80000, step: 2000, unit: 'Kč', defaultValue: 35000 },
        defaultValue: 35000,
        promptForgeTemplate: '- **Rozpočet na notebook:** do {value} Kč',
      },
    ],
    systemPrompt: `Jsi seniorní hardwarový architekt a nákupčí IT techniky.
Vyhodnoť požadavky na notebook a doporuč 3 konkrétní modely (např. Apple MacBook Pro/Air, Lenovo ThinkPad T/X série, Dell XPS, Asus Zenbook, HP EliteBook).
Detailně zhodnoť poměr výkon/watt, jas a barevné pokrytí displeje, ergonomii klávesnice a servisní záruku (On-Site NBD).`,
  },
  scooters: {
    keywords: [
      'kolobezka', 'koloběžka', 'kolobezky', 'koloběžky', 'freestyle kolobezka', 
      'freestyle koloběžka', 'stunt scooter', 'trick scooter', 'pro scooter', 'koloběžku'
    ],
    categoryName: 'Freestyle & Sportovní Koloběžky',
    agentName: 'Expertní Specialista na Freestyle Koloběžky',
    icon: '🛴',
    description: 'Nezávislý nákupní rádce pro výběr freestyle koloběžky podle geometrie, kompresního systému, parametrů desky a výšky jezdce.',
    parameters: [
      {
        id: 'riding_style_geometry',
        name: 'Jezdecký styl & geometrie (Street vs. Skatepark)',
        category: 'Geometrie & Styl',
        importance: 'mandatory',
        rationale: 'Parkové koloběžky jsou kratší a lehčí pro airy a rotace; streetové mají delší, širší desku s rovnými konci (box-cut) pro grindy.',
        icon: '🛹',
        suggestedComponent: 'chips',
        suggestedValues: ['Skatepark (lehká, obratná na airy a triky)', 'Street (robustní, široká box-cut deska na grindy)', 'Univerzální / Hybrid (park i street)'],
      },
      {
        id: 'bar_dimensions',
        name: 'Výška a šířka řídítek (vzhledem k výšce postavy)',
        category: 'Ergonomie & Bezpečnost',
        importance: 'mandatory',
        rationale: 'Správná výška řídítek (obvykle mezi pasem a boky, 55–72 cm) zabraňuje bolesti zad a umožňuje čisté provádění triků.',
        icon: '📏',
        suggestedComponent: 'chips',
        suggestedValues: ['Do 60 cm (pro výšku jezdce do 140 cm)', '60–65 cm (pro výšku 140–165 cm)', '65–70 cm (pro výšku 165–180 cm)', 'Nad 70 cm (pro výšku nad 180 cm)'],
      },
      {
        id: 'compression_system',
        name: 'Typ kompresního systému (SCS vs. IHC / HIC)',
        category: 'Konstrukce & Komprese',
        importance: 'mandatory',
        rationale: 'SCS je nejpevnější a nejodolnější systém na trhu; IHC je lehčí a levnější, ideální pro parkové jezdce a začátečníky.',
        icon: '🔩',
        suggestedComponent: 'chips',
        suggestedValues: ['SCS (Standard Compression System - maximální pevnost)', 'IHC (Integrated Headset Compression - lehký standard)', 'HIC (pro oversize ocelová řídítka)'],
      },
      {
        id: 'wheel_specs',
        name: 'Průměr a tvrdost koleček (110 mm vs. 120 mm / 88A)',
        category: 'Kolečka & Jízda',
        importance: 'mandatory',
        rationale: '110 mm nabízí rychlou odezvu v parku; 120 mm poskytuje vyšší maximální rychlost, hladší přejezd nerovností a delší životnost.',
        icon: '🛞',
        suggestedComponent: 'chips',
        suggestedValues: ['110 mm / hliníkový střed (klasický obratný standard)', '120 mm / hliníkový střed (vyšší rychlost a plynulost)', '100 mm (pouze pro nejmenší děti)'],
      },
      {
        id: 'deck_specs',
        name: 'Materiál a tvar desky (Šířka & Box-cut vs. Peg-cut)',
        category: 'Deska (Deck)',
        importance: 'mandatory',
        rationale: 'Kvalitní tepelně zpracovaný hliník 6061-T6. Širší deska (5.0–6.0") a box-cut konce pro street grindování; užší (4.5–4.8") pro snadné tailwhipy.',
        icon: '📐',
        suggestedComponent: 'chips',
        suggestedValues: ['Šířka 4.5"–4.8" / Peg-cut (park)', 'Šířka 5.0"–5.5" / Box-cut (univerzál)', 'Šířka 5.5"–6.0" / Box-cut (čistý street)'],
      },
      {
        id: 'bar_material',
        name: 'Materiál řídítek (Chromoly 4130 ocel vs. Hliník vs. Titan)',
        category: 'Konstrukce řídítek',
        importance: 'recommended',
        rationale: 'Ocel 4130 je prakticky nezničitelná pro street; hliník je extrémně lehký pro park; titan spojuje nízkou váhu s vysokou pružností.',
        icon: '🛡️',
        suggestedComponent: 'chips',
        suggestedValues: ['Chromoly 4130 ocel (maximální pevnost a spolehlivost)', 'Hliník 6061-T6 (lehká ovladatelnost pro park)', 'Titan (prémiová pevnost při minimální váze)'],
      },
      {
        id: 'total_weight',
        name: 'Celková hmotnost kompletu (Lehká vs. Robustní)',
        category: 'Hmotnost & Ovladatelnost',
        importance: 'recommended',
        rationale: 'Pro park a menší jezdce je ideální váha 3.0–3.6 kg; pro streetové dropy a starší jezdce stabilních 3.8–4.4 kg.',
        icon: '⚖️',
        suggestedComponent: 'chips',
        suggestedValues: ['Ultralehká (do 3.4 kg - ideální na park)', 'Střední (3.4–3.9 kg - všestranný hybrid)', 'Těžší streetová (nad 4.0 kg - nezničitelná)'],
      },
      {
        id: 'brake_type',
        name: 'Typ brzdy (Flex fender vs. Odpružená)',
        category: 'Brzdový systém',
        importance: 'recommended',
        rationale: 'Ocelová brzda typu Flex fender je přišroubovaná a pružná – nevydává žádné nepříjemné rezonance a neničí kolečka.',
        icon: '🛑',
        suggestedComponent: 'chips',
        suggestedValues: ['Flex fender (bezhlučná ocelová flex brzda)', 'Brzda s pružinkou (pouze u levných základních modelů)'],
      },
      {
        id: 'headset_bearings',
        name: 'Hlavové složení & ložiska (Integrované & ABEC 9/11)',
        category: 'Ložiska & Hladkost rotace',
        importance: 'preference',
        rationale: 'Integrované bezzávitové hlavové složení (Integrated Headset) se zapouzdřenými průmyslovými ložisky zaručuje hladké rotace řídítek bez vůle.',
        icon: '🔄',
        suggestedComponent: 'chips',
        suggestedValues: ['Integrované bezzávitové headset + ložiska ABEC 9', 'Standardní ložiska ABEC 7'],
      },
      {
        id: 'rider_weight_capacity',
        name: 'Maximální nosnost & dimenzování vidlice',
        category: 'Nosnost & Odolnost',
        importance: 'mandatory',
        rationale: 'Pevná jednodílná CNC frézovaná hliníková vidlice s nosností 100 kg zvládne i tvrdé skoky ze schodů bez ohnutí.',
        icon: '💪',
        suggestedComponent: 'chips',
        suggestedValues: ['Nosnost 100 kg / CNC jednodílná vidlice', 'Nosnost do 60 kg (dětská kategorie)'],
      },
    ],
    questions: [
      {
        id: 'scooter_riding_style',
        step: 1,
        title: 'Kde a jakým stylem plánujete na koloběžce nejčastěji jezdit?',
        subtitle: 'Zvolte styl jízdy pro výběr optimální geometrie desky a hmotnosti.',
        component: 'chips',
        isMultiSelect: false,
        options: [
          { label: 'Skatepark & U-rampa', value: 'skatepark', description: 'Lehká konstrukce pro vysoké výskoky a rotace' },
          { label: 'Street & Město', value: 'street', description: 'Široká deska s box-cut konci pro grindování na překážkách' },
          { label: 'Univerzální začátečník / Hybrid', value: 'hybrid', description: 'Vyvážený komplet do parku i na ulici' },
        ],
        defaultValue: 'hybrid',
        promptForgeTemplate: '- **Styl jízdy na koloběžce:** {value}',
      },
      {
        id: 'rider_height_bracket',
        step: 2,
        title: 'Jaká je výška postavy jezdce?',
        subtitle: 'Klíčový údaj pro správnou výšku řídítek a správné držení těla.',
        component: 'chips',
        isMultiSelect: false,
        options: [
          { label: 'Do 140 cm (řídítka do 58 cm)', value: 'under_140' },
          { label: '140–160 cm (řídítka 58–63 cm)', value: '140_160' },
          { label: '160–175 cm (řídítka 63–68 cm)', value: '160_175' },
          { label: 'Nad 175 cm (řídítka nad 68 cm)', value: 'above_175' },
        ],
        defaultValue: '140_160',
        promptForgeTemplate: '- **Výška jezdce:** {value}',
      },
      {
        id: 'scooter_budget',
        step: 3,
        title: 'Orientační rozpočet na freestyle koloběžku',
        subtitle: 'Kvalitní základní komplety začínají kolem 3 000 Kč, pokročilé modely 5 000–9 000 Kč.',
        component: 'slider',
        sliderConfig: { min: 2500, max: 12000, step: 500, unit: 'Kč', defaultValue: 4500 },
        defaultValue: 4500,
        promptForgeTemplate: '- **Rozpočet na koloběžku:** do {value} Kč',
      },
    ],
    systemPrompt: `Jsi špičkový specialista a trenér jízdy na freestyle koloběžkách (Scootering Expert).
Vyhodnoť požadavky jezdce a doporuč přesně 3 konkrétní, na českém a evropském trhu reálně dostupné freestyle koloběžky (např. od ověřených značek jako Blunt/Envy (Prodigy, KOS), Striker, Ethic DTC (Erawan, Pandemonium), MGP Madd Gear, District, Native nebo Triad).
Detailně zhodnoť výšku řídítek vůči jezdci, typ komprese (IHC vs. SCS), průměr koleček a odolnost desky. Uveď klíčová pro a proti každého modelu a orientační cenu v Kč.`,
    suggestedAlternatives: [
      {
        id: 'pegs_included',
        name: 'Součástí balení grindovací pegy',
        category: 'Příslušenství',
        importance: 'preference',
        rationale: 'Hliníkové nebo ocelové kolíky na osách koleček pro grindování po zábradlích.',
        icon: '🔩',
        suggestedComponent: 'chips',
        suggestedValues: ['S pegy v balení', 'Bez pegů postačí'],
      },
      {
        id: 'griptape_coarseness',
        name: 'Hrubost a přilnavost griptapu',
        category: 'Grip & Bezpečnost',
        importance: 'preference',
        rationale: 'Hrubší zrno griptapu zabraňuje sklouznutí boty při tvrdých dopadech z triků.',
        icon: '🛹',
        suggestedComponent: 'chips',
        suggestedValues: ['Extra hrubý griptape', 'Standardní griptape'],
      },
    ],
  },
};

/**
 * Normalizes an input string by removing diacritics and converting to lowercase
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Discovers domain parameters and synthesizes a tailored UniversalAgentDefinition
 * from a user query or keyword.
 */
export function discoverDomainParameters(query: string): DomainAnalysisResult {
  const normalized = normalizeText(query);

  // Find best domain profile match (prioritizing longest/most specific keyword)
  let bestMatch: { key: string; profile: (typeof DOMAIN_PROFILES)[string]; matchedKwLength: number } | null = null;

  for (const [key, profile] of Object.entries(DOMAIN_PROFILES)) {
    for (const kw of profile.keywords) {
      const normKw = normalizeText(kw);
      if (normalized.includes(normKw)) {
        if (!bestMatch || normKw.length > bestMatch.matchedKwLength) {
          bestMatch = { key, profile, matchedKwLength: normKw.length };
        }
      }
    }
  }

  if (bestMatch) {
    const { key, profile } = bestMatch;
    const learned = DomainLearningService.getLearnedParametersForDomain(key);
    const existingAlternatives = profile.suggestedAlternatives || [];
    const mergedAlternatives: ExtractedDomainParameter[] = [
      ...learned,
      ...existingAlternatives,
    ].filter((item, idx, arr) =>
      !profile.parameters.some((p) => p.id === item.id || normalizeText(p.name) === normalizeText(item.name)) &&
      arr.findIndex((x) => x.id === item.id || normalizeText(x.name) === normalizeText(item.name)) === idx
    );

    // INTENT FILTER:
    // If the user's query already explicitly specified a constraint, eliminate redundant/contradictory questions!
    let effectiveQuestions = [...profile.questions];
    let effectiveParameters = [...profile.parameters];

    const isElectricIntent = /elektro|electric|bater|bev|ev/i.test(normalized);
    const isDieselIntent = /diesel|naft/i.test(normalized);
    const isPetrolIntent = /benzin|petrol/i.test(normalized);
    const isAutomaticIntent = /automat/i.test(normalized);

    // If cars domain was matched with explicit powertrain in query, remove powertrain question
    if (isElectricIntent || isDieselIntent || isPetrolIntent) {
      effectiveQuestions = effectiveQuestions.filter((q) => q.id !== 'car_powertrain');
      effectiveParameters = effectiveParameters.filter((p) => p.id !== 'powertrain');
    }
    if (isAutomaticIntent) {
      effectiveQuestions = effectiveQuestions.filter((q) => q.id !== 'car_transmission');
      effectiveParameters = effectiveParameters.filter((p) => p.id !== 'transmission');
    }

    // Ensure Luke ALWAYS offers brand/manufacturer preferences
    const hasBrandParam = effectiveParameters.some(
      (p) => p.id === 'brand_preferences' || p.id.includes('brand') || normalizeText(p.name).includes('znack') || normalizeText(p.name).includes('vyrobc')
    );
    if (!hasBrandParam) {
      effectiveParameters.push(UNIVERSAL_BRAND_PARAMETER);
    }

    const hasBrandQuestion = effectiveQuestions.some(
      (q) => q.id.includes('brand') || normalizeText(q.title).includes('znack') || normalizeText(q.title).includes('vyrobc')
    );
    if (!hasBrandQuestion) {
      effectiveQuestions.push({
        id: 'brand_preferences_q',
        step: effectiveQuestions.length + 1,
        title: 'Preferované a zakázané značky / výrobci',
        subtitle: 'Uveďte značky, kterým důvěřujete a chcete je doporučit, a naopak ty, které si nepřejete.',
        component: 'brands',
        isMultiSelect: false,
        defaultValue: { preferred: '', forbidden: '' },
        promptForgeTemplate: '- **Pravidla pro výrobce & značky:** {value}',
      });
    }

    return {
      keyword: query,
      matchedDomain: key,
      categoryName: profile.categoryName,
      agentName: profile.agentName,
      icon: profile.icon,
      description: profile.description,
      parameters: effectiveParameters,
      questions: effectiveQuestions,
      systemPrompt: profile.systemPrompt,
      suggestedAlternatives: mergedAlternatives,
    };
  }

  // If no predefined profile matched, dynamically synthesize an intelligent, deep 10-parameter profile
  return synthesizeGenericDomainProfile(query);
}

/**
 * Creates a custom UniversalAgentDefinition specifically tailored to the user's
 * active, tuned selection of parameters (handling removals, additions, and custom params).
 */
export function buildCustomAgentFromParameters(
  analysis: DomainAnalysisResult,
  activeParameters: ExtractedDomainParameter[]
): UniversalAgentDefinition {
  const slug = normalizeText(analysis.keyword)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'custom-agent';

  // 1. Build questions matching user-chosen parameters
  const existingQuestionsMap = new Map<string, WizardQuestion>();
  for (const q of analysis.questions) {
    existingQuestionsMap.set(q.id, q);
  }

  const tunedQuestions: WizardQuestion[] = [];
  let stepIndex = 1;

  for (const param of activeParameters) {
    const isBrandParam = param.id === 'brand_preferences' || param.id.includes('brand') || normalizeText(param.name).includes('znack') || normalizeText(param.name).includes('vyrobc');
    if (isBrandParam) {
      tunedQuestions.push({
        id: param.id,
        step: stepIndex,
        title: param.name || 'Preferované a zakázané značky / výrobci',
        subtitle: param.rationale || 'Napište výrobce, které preferujete, a značky, které chcete z výběru striktně vyloučit.',
        component: 'brands',
        isMultiSelect: false,
        defaultValue: { preferred: '', forbidden: '' },
        promptForgeTemplate: `- **Pravidla pro výrobce & značky:** {value}`,
      });
      stepIndex++;
      continue;
    }

    const existing = existingQuestionsMap.get(param.id);
    if (existing) {
      tunedQuestions.push({
        ...existing,
        step: stepIndex,
      });
      stepIndex++;
      continue;
    }

    // Match by partial name or keyword
    const matchedByName = analysis.questions.find(
      (q) => q.id.includes(param.id) || param.name.toLowerCase().includes(q.title.toLowerCase())
    );
    if (matchedByName) {
      tunedQuestions.push({
        ...matchedByName,
        step: stepIndex,
      });
      stepIndex++;
      continue;
    }

    // Synthesize question for custom or newly added parameter
    const options = (param.suggestedValues && param.suggestedValues.length > 0)
      ? param.suggestedValues.map((v) => ({
          label: v,
          value: v.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
          description: undefined,
        }))
      : [
          { label: 'Vysoká priorita (Požadováno)', value: 'required', description: 'Striktní podmínka výběru' },
          { label: 'Doporučeno (Výhodou)', value: 'preferred', description: 'Uvítám, pokud to nabídka a cena dovolí' },
          { label: 'Není nutné', value: 'optional', description: 'Neovlivňuje výsledné doporučení' },
        ];

    tunedQuestions.push({
      id: param.id,
      step: stepIndex,
      title: param.name,
      subtitle: param.rationale || 'Vyberte variantu odpovídající vašim potřebám.',
      component: param.suggestedComponent || 'chips',
      isMultiSelect: false,
      options,
      defaultValue: options[0].value,
      promptForgeTemplate: `- **${param.name}:** {value}`,
    });

    stepIndex++;
  }

  // 2. Synthesize updated system prompt with explicit tuned parameters
  const tunedParametersSummary = activeParameters
    .map((p, idx) => `${idx + 1}. **${p.name}** (${p.importance === 'mandatory' ? 'Kritický' : 'Doporučený'}): ${p.rationale}`)
    .join('\n');

  const tunedSystemPrompt = `${analysis.systemPrompt}

---
### Uživatelsky specifikované a vytuněné parametry:
Uživatel před zahájením výběru aktivně vyladil tyto klíčové parametry:
${tunedParametersSummary}

Při vyhodnocení striktně zkontroluj shodu všech doporučených modelů s každým z těchto vybraných parametrů!`;

  return {
    id: `agent-${slug}-${Date.now().toString(36)}`,
    name: analysis.agentName,
    category: analysis.categoryName,
    icon: analysis.icon,
    version: '1.1.0',
    description: `Nákupní poradce vyladěný na míru s ${activeParameters.length} klíčovými parametry.`,
    systemPrompt: tunedSystemPrompt,
    questions: tunedQuestions.length > 0 ? tunedQuestions : analysis.questions,
    createdAt: new Date().toISOString(),
    isCustom: true,
    researchedParametersPool: analysis.parameters,
    selectedParameters: activeParameters,
  };
}

/**
 * Creates a structured UniversalAgentDefinition from the analysis result,
 * optionally applying custom user parameters if provided.
 */
export function buildAgentFromDomainAnalysis(
  analysis: DomainAnalysisResult,
  customParameters?: ExtractedDomainParameter[]
): UniversalAgentDefinition {
  if (customParameters && customParameters.length > 0) {
    return buildCustomAgentFromParameters(analysis, customParameters);
  }

  const slug = normalizeText(analysis.keyword)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'custom-agent';

  return {
    id: `agent-${slug}-${Date.now().toString(36)}`,
    name: analysis.agentName,
    category: analysis.categoryName,
    icon: analysis.icon,
    version: '1.0.0',
    description: analysis.description,
    systemPrompt: analysis.systemPrompt,
    questions: analysis.questions,
    createdAt: new Date().toISOString(),
    isCustom: true,
  };
}

/**
 * Deep semantic synthesizer for unknown custom queries (e.g. "tepelné čerpadlo", "matrace", "sekačka", etc.)
 * Produces AT LEAST 10 structured, product-requirement parameters covering technical, functional,
 * ergonomic, reliability, and budgetary aspects.
 */
function synthesizeGenericDomainProfile(query: string): DomainAnalysisResult {
  const cleanTitle = query.trim().slice(0, 40);

  const parameters: ExtractedDomainParameter[] = [
    {
      id: 'primary_purpose',
      name: 'Primární účel & typické provozní scénáře',
      category: 'Způsob využití',
      importance: 'mandatory',
      rationale: 'Definuje hlavní funkci produktu, očekávanou zátěž a specifická prostředí nasazení.',
      icon: '🎯',
      suggestedComponent: 'chips',
      suggestedValues: ['Intenzivní každodenní používání', 'Vyvážené běžné použití', 'Příležitostné / Hobby'],
    },
    {
      id: 'technical_class',
      name: 'Technologický standard & výkonová třída',
      category: 'Výkon & Technologie',
      importance: 'mandatory',
      rationale: 'Určuje úroveň motoru, procesoru, kapacity či klíčových technologických komponent.',
      icon: '⚡',
      suggestedComponent: 'chips',
      suggestedValues: ['Špičková profesionální třída', 'Zlatý střed (optimální poměr cena/výkon)', 'Základní spolehlivá řada'],
    },
    {
      id: 'capacity_sizing',
      name: 'Kapacita, zátěžový faktor & dimenzování',
      category: 'Dimenzování',
      importance: 'mandatory',
      rationale: 'Zajišťuje, aby produkt nebyl poddimenzovaný ani zbytečně předimenzovaný pro vaše potřeby.',
      icon: '⚖️',
      suggestedComponent: 'chips',
      suggestedValues: ['Vysoká zátěžová rezerva', 'Standardní dimenzování'],
    },
    {
      id: 'dimensions_installation',
      name: 'Prostorové nároky, rozměry & instalace',
      category: 'Ergonomie & Umístění',
      importance: 'recommended',
      rationale: 'Ověření rozměrů pro umístění v prostoru, požadavky na montáž, připojení a manipulaci.',
      icon: '📐',
      suggestedComponent: 'chips',
      suggestedValues: ['Kompaktní / Snadná instalace', 'Standardní rozměry'],
    },
    {
      id: 'controls_ui',
      name: 'Ergonomie, ovládání & uživatelské rozhraní',
      category: 'Uživatelský komfort',
      importance: 'recommended',
      rationale: 'Přívětivost obsluhy, intuitivní rozhraní, možnost automatizace nebo propojení s aplikací.',
      icon: '📱',
      suggestedComponent: 'chips',
      suggestedValues: ['Chytré ovládání (aplikace / displej)', 'Jednoduché manuální tlačítkové'],
    },
    {
      id: 'energy_efficiency',
      name: 'Energetická efektivita & provozní náklady',
      category: 'Ekonomika provozu',
      importance: 'recommended',
      rationale: 'Spotřeba elektřiny, vody, paliva či spotřebního materiálu v průběhu celého životního cyklu.',
      icon: '🌿',
      suggestedComponent: 'chips',
      suggestedValues: ['Maximálně úsporné (třída A/A+)', 'Standardní energetická náročnost'],
    },
    {
      id: 'materials_durability',
      name: 'Materiálové provedení, odolnost & konstrukce',
      category: 'Kvalita konstrukce',
      importance: 'recommended',
      rationale: 'Použití kvalitních kovů, tvrzených plastů či ochranných prvků proti opotřebení a povětrnosti.',
      icon: '🛡️',
      suggestedComponent: 'chips',
      suggestedValues: ['Robustní prémiové materiály', 'Běžná odolná konstrukce'],
    },
    {
      id: 'maintenance_service',
      name: 'Náročnost údržby & servisní zázemí v ČR',
      category: 'Servis & Podpora',
      importance: 'recommended',
      rationale: 'Dostupnost náhradních dílů, autorizovaného servisu v Česku a jednoduchost pravidelného čištění.',
      icon: '🔧',
      suggestedComponent: 'chips',
      suggestedValues: ['Bezúdržbové s autorizovaným servisem v ČR', 'Běžná uživatelská údržba'],
    },
    {
      id: 'safety_certification',
      name: 'Bezpečnostní prvky & certifikace',
      category: 'Bezpečnost',
      importance: 'preference',
      rationale: 'Pojistky proti přetížení, dětské zámky, atesty a garance bezpečného provozu.',
      icon: '🔒',
      suggestedComponent: 'chips',
      suggestedValues: ['Pokročilé bezpečnostní senzory a atesty', 'Standardní jištění'],
    },
    {
      id: 'total_budget',
      name: 'Celkový rozpočet & kalkulace TCO (cena vs. životnost)',
      category: 'Investice',
      importance: 'mandatory',
      rationale: 'Cenový rámec pro nákup s ohledem na celkovou návratnost a předpokládanou dobu používání.',
      icon: '💰',
      suggestedComponent: 'slider',
      suggestedValues: ['Dle cenové hladiny'],
    },
    UNIVERSAL_BRAND_PARAMETER,
  ];

  const questions: WizardQuestion[] = [
    {
      id: 'generic_primary_usage',
      step: 1,
      title: `Jak budete "${cleanTitle}" nejčastěji používat?`,
      subtitle: 'Pomůže určit potřebnou odolnost, výbavu a konstrukci.',
      component: 'chips',
      isMultiSelect: false,
      options: [
        { label: 'Intenzivní / Poloprofesionální provoz', value: 'heavy_duty', description: 'Důraz na maximální odolnost, životnost a výkonovou rezervu.' },
        { label: 'Pravidelné rodinné / běžné použití', value: 'standard_home', description: 'Důraz na vyvážený poměr cena / výkon a komfort.' },
        { label: 'Občasné / Nenáročné použití', value: 'casual', description: 'Základní osvědčené a cenově dostupné řešení.' },
      ],
      defaultValue: 'standard_home',
      promptForgeTemplate: '- **Hlavní využití:** {value}',
    },
    {
      id: 'generic_priorities',
      step: 2,
      title: 'Jaké jsou vaše klíčové priority a technologické požadavky?',
      subtitle: 'Vyberte vlastnosti, na kterých vám nejvíce záleží.',
      component: 'chips',
      isMultiSelect: true,
      options: [
        { label: 'Špičková životnost a záruční servis v ČR', value: 'durability' },
        { label: 'Nízké provozní náklady a energetická úspornost', value: 'efficiency' },
        { label: 'Jednoduché a intuitivní ovládání', value: 'easy_to_use' },
        { label: 'Kompaktní rozměry a snadná manipulace', value: 'compactness' },
      ],
      defaultValue: ['durability', 'efficiency'],
      promptForgeTemplate: '- **Klíčové priority:** {value}',
    },
    {
      id: 'generic_brands',
      step: 3,
      title: 'Preferované a zakázané značky / výrobci',
      subtitle: 'Napište výrobce, které preferujete (chcete doporučit), a naopak ty, které chcete z výběru striktně vyloučit.',
      component: 'brands',
      isMultiSelect: false,
      defaultValue: { preferred: '', forbidden: '' },
      promptForgeTemplate: '- **Pravidla pro výrobce & značky:** {value}',
    },
    {
      id: 'generic_budget',
      step: 4,
      title: 'Orientační rozpočet na nákup',
      subtitle: 'Cenová hladina v Kč pro výběr optimálního modelu.',
      component: 'slider',
      sliderConfig: { min: 2000, max: 80000, step: 1000, unit: 'Kč', defaultValue: 15000 },
      defaultValue: 15000,
      promptForgeTemplate: '- **Cenový rozpočet:** do {value} Kč',
    },
  ];

  const systemPrompt = `Jsi nezávislý a expertní nákupní rádce pro kategorii "${cleanTitle}".
Tvým úkolem je na základě parametrů zadaných uživatelem doporučit přesně 3 reálné, aktuálně na trhu dostupné modely, které nejlépe splňují jeho požadavky.

Pravidla pro vyhodnocení:
1. Zvaž poměr cena/výkon, spolehlivost značky a reference uživatelů.
2. U každého modelu uveď přesnou značku a modelové označení.
3. Poskytni technické odůvodnění srovnané s požadavky uživatele.
4. Uveď klíčová pozitiva (Pros), možná omezení (Cons) a orientační cenu v Kč.`;

  const suggestedAlternatives: ExtractedDomainParameter[] = [
    {
      id: 'warranty_service',
      name: 'Délka záruky & dostupnost autorizovaného servisu v ČR',
      category: 'Spolehlivost & Podpora',
      importance: 'recommended',
      rationale: 'Dostupnost náhradních dílů, rychlost vyřízení servisu a možnost prodloužené záruky.',
      icon: '🛡️',
      suggestedComponent: 'chips',
      suggestedValues: ['Prodloužená záruka (3–5 let) a servis v ČR', 'Standardní 2letá záruka'],
    },
    {
      id: 'energy_efficiency',
      name: 'Energetická náročnost & nízké provozní náklady',
      category: 'Ekonomie provozu',
      importance: 'recommended',
      rationale: 'Vysoká účinnost a úsporný provoz šetřící náklady během celé doby životnosti.',
      icon: '🌱',
      suggestedComponent: 'chips',
      suggestedValues: ['Maximální energetická úspornost', 'Běžná spotřeba'],
    },
    {
      id: 'noise_level_acoustic',
      name: 'Tichý provoz & akustický komfort',
      category: 'Komfort',
      importance: 'preference',
      rationale: 'Nízká provozní hlučnost vhodná pro použití v obytných a klidových prostorách.',
      icon: '🤫',
      suggestedComponent: 'chips',
      suggestedValues: ['Extra tichý chod', 'Běžná hlučnost'],
    },
  ];

  const learned = DomainLearningService.getLearnedParametersForDomain('generic');
  const mergedAlternatives: ExtractedDomainParameter[] = [
    ...learned,
    ...suggestedAlternatives,
  ].filter((item, idx, arr) =>
    !parameters.some((p) => p.id === item.id || normalizeText(p.name) === normalizeText(item.name)) &&
    arr.findIndex((x) => x.id === item.id || normalizeText(x.name) === normalizeText(item.name)) === idx
  );

  return {
    keyword: query,
    matchedDomain: 'generic',
    categoryName: `Výběr: ${cleanTitle}`,
    agentName: `Specialista na ${cleanTitle}`,
    icon: '🎯',
    description: `Inteligentní nákupní rádce pro výběr ideálního modelu v kategorii "${cleanTitle}".`,
    parameters,
    questions,
    systemPrompt,
    suggestedAlternatives: mergedAlternatives,
  };
}
