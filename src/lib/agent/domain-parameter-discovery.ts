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
  name: 'Značky a výrobci',
  category: 'Výrobci & Značky',
  importance: 'recommended',
  rationale: 'Umožňuje uvést konkrétní preferované značky, kterým důvěřujete, a naopak striktně vyloučit výrobce, které nechcete. Otázka pro vás: Máte oblíbené značky, nebo chcete nějaké vyloučit?',
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
        name: 'Reálný dojezd',
        category: 'Baterie & Dojezd',
        importance: 'mandatory',
        rationale: 'Klíčové pro dálkové cesty: kapacita v kWh a reálný dojezd při 130 km/h za běžných podmínek (nikoliv teoretický laboratorní WLTP).',
        icon: '🔋',
        suggestedComponent: 'chips',
        suggestedValues: ['Městský / Příměstský (45-58 kWh / dojezd ~250 km)', 'Univerzální rodinný (60-77 kWh / dojezd ~360 km)', 'Dálniční křižník (78-100+ kWh / dojezd 450+ km)'],
      },
      {
        id: 'ev_charging_architecture',
        name: 'Rychlost nabíjení',
        category: 'Nabíjecí výkon',
        importance: 'mandatory',
        rationale: '800V ultrarychlá architektura (Hyundai Ioniq, Kia EV6, Porsche) dobije 10-80 % pod 18 minut; standardní 400V (Škoda Enyaq, VW ID) vyžaduje 28-35 minut.',
        icon: '⚡',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Ultrarychlá 800V architektura (nabití 10–80 % za cca 18 minut na dálničních HPC)',
          'Osvědčený standard 400V (nabití 10–80 % za 28–35 minut – Tesla, VW, Škoda)',
          'Dostatečné základní DC nabíjení (vhodné při převážně domácím nočním nabíjení)',
        ],
      },
      {
        id: 'ev_heat_pump',
        name: 'Tepelné čerpadlo',
        category: 'Termomanagement',
        importance: 'mandatory',
        rationale: 'Při mrazech v ČR (-5 až -15 °C) efektivně vytápí kabinu i temperuje baterii a eliminuje propad dojezdu o 30-40 %.',
        icon: '❄️',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Úsporné tepelné čerpadlo (šetří až 30 % dojezdu při zimním vytápění)',
          'Standardní elektrický PTC ohřev (vhodné pro kratší příměstské jízdy)',
          'Předehřev interiéru přes mobilní aplikaci při připojení na nabíječku',
        ],
      },
      {
        id: 'ev_home_charging',
        name: 'Domácí nabíjení',
        category: 'Domácí nabíjení',
        importance: 'recommended',
        rationale: 'Třífázové 11 kW (či 22 kW) AC nabíjení umožní plné a bezpečné dobití baterie přes noc během levného nočního tarifu.',
        icon: '🔌',
        suggestedComponent: 'chips',
        suggestedValues: ['Domácí wallbox 11 kW (plné nabití přes noc 6-8 hod.)', 'Zesílená 22 kW AC palubní nabíječka', 'Pouze veřejné nabíjení (bez domácího wallboxu)'],
      },
      {
        id: 'ev_battery_chemistry',
        name: 'Typ baterie',
        category: 'Technologie baterie',
        importance: 'recommended',
        rationale: 'LFP (Lithium-železo-fosfát) netrpí denním nabíjením do 100 % a má extrémní životnost; NMC/NCA má vyšší energetickou hustotu a lepší zimní výkon.',
        icon: '🔬',
        suggestedComponent: 'chips',
        suggestedValues: ['LFP baterie (bezpečné nabíjení na 100 % denně a extrémní životnost)', 'NMC / NCA baterie (maximální dojezd a nejlepší výkon v mrazech)', 'Nerozhoduje / nechám si doporučit optimální typ dle využití'],
      },
      {
        id: 'ev_drivetrain',
        name: 'Pohon náprav',
        category: 'Trakce & Dynamika',
        importance: 'recommended',
        rationale: 'Elektromobily mají nízké těžiště; zadní pohon RWD je efektivní a stabilní, Dual Motor AWD přináší brutální zrychlení a jistotu na sněhu.',
        icon: '🏎️',
        suggestedComponent: 'chips',
        suggestedValues: ['Dual Motor 4x4 AWD (maximální trakce na sněhu a blesková akcelerace)', 'Úsporný zadní pohon RWD (ideální vyvážení a delší dojezd)', 'Přední pohon FWD (pro klidnou a úspornou městskou jízdu)'],
      },
      {
        id: 'ev_battery_preconditioning',
        name: 'Předehřev baterie',
        category: 'Cestovní komfort',
        importance: 'recommended',
        rationale: 'Zajišťuje, aby studená baterie dosáhla plného nabíjecího výkonu ihned po připojení k HPC stanici a nestála na stojanu hodinu.',
        icon: '🌡️',
        suggestedComponent: 'chips',
        suggestedValues: ['Automatický předehřev propojený s navigací (baterie je připravena před příjezdem k HPC)', 'Manuální předehřev tlačítkem v infotainmentu', 'Nepotřebuji předehřev (nabíjím primárně doma na AC wallboxu)'],
      },
      {
        id: 'ev_route_planner',
        name: 'Plánovač tras',
        category: 'Software & Infotainment',
        importance: 'recommended',
        rationale: 'Navigace musí sama dynamicky počítat zastávky na nabíjení podle spotřeby, profilu trasy a reálné obsazenosti stojanů.',
        icon: '🗺️',
        suggestedComponent: 'chips',
        suggestedValues: ['Pokročilý plánovač tras (automatické zastávky na nabíjení a živá obsazenost)', 'Základní vestavěná navigace', 'Používám výhradně Apple CarPlay / Android Auto (Waze, Google Maps)'],
      },
      {
        id: 'ev_body_type',
        name: 'Typ karoserie',
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
        name: 'Zásuvka 230V',
        category: 'Elektrická výbava',
        importance: 'preference',
        rationale: 'Umožňuje napájet nářadí, elektrokola, kávovar nebo dokonce domácí spotřebiče přímo z baterie auta výkonem až 3.6 kW.',
        icon: '🔌',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Plná podpora V2L 230V / 3.6 kW (napájení elektrokol, grilu a kempingového vybavení)',
          'Základní 12V / USB-C napájení pro drobnou elektroniku',
          'Bez požadavku na externí 230V napájení',
        ],
      },
      {
        id: 'ota_updates',
        name: 'Vzdálené aktualizace',
        category: 'Software',
        importance: 'preference',
        rationale: 'Zda výrobce průběžně vylepšuje dojezd, nabíjecí křivku a funkce vozu na dálku bez nutnosti návštěvy servisu.',
        icon: '📶',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Plná vzdálená OTA podpora (pravidelná vylepšení motoru, dojezdu i infotainmentu)',
          'Základní OTA aktualizace (mapové podklady a multimediální systém)',
          'Tradiční servisní aktualizace u autorizovaného dealera',
        ],
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
        name: 'Typ karoserie',
        category: 'Konstrukce & Rozměry',
        importance: 'mandatory',
        rationale: 'Určuje výšku posazu, světlou výšku podvozku, aerodynamiku a variabilitu vnitřního prostoru (SUV vs. Kombi vs. Hatchback).',
        icon: '🚙',
        suggestedComponent: 'chips',
        suggestedValues: ['SUV / Crossover', 'Kombi', 'Hatchback', 'Sedan / Liftback', 'MPV / Rodinná dodávka'],
      },
      {
        id: 'powertrain',
        name: 'Typ motoru',
        category: 'Pohonná jednotka',
        importance: 'mandatory',
        rationale: 'Klíčové pro provozní náklady a životnost: benzín na kratší trasy, diesel na dálnice, hybrid do města, elektro (BEV) pro domácí nabíjení.',
        icon: '⚡',
        suggestedComponent: 'chips',
        suggestedValues: ['Benzínový motor (TSI/T-GDI)', 'Naftový motor (TDI/dCi)', 'Full-Hybrid (HEV bez nabíjení)', 'Plug-in Hybrid (PHEV)', 'Čistý elektromobil (BEV)'],
      },
      {
        id: 'drivetrain',
        name: 'Pohon náprav',
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
        suggestedValues: [
          'Automatická převodovka (maximální komfort a plynulost v městských kolonách)',
          'Manuální převodovka (přímá kontrola otáček, nižší pořizovací i servisní náklady)',
          'Dvouspojkový automat s pádly pod volantem (sportovní dynamika a bleskové řazení)',
        ],
      },
      {
        id: 'annual_mileage',
        name: 'Roční nájezd',
        category: 'Provozní režim',
        importance: 'mandatory',
        rationale: 'Pod 15 000 km ročně převážně po městě způsobuje zanášení DPF filtrů u dieselů; nad 25 000 km po dálnicích je nafta či hybrid nejúspornější.',
        icon: '🛣️',
        suggestedComponent: 'chips',
        suggestedValues: ['Do 15 000 km / rok (město a okolí)', '15 000 – 30 000 km / rok (smíšený provoz)', '30 000+ km / rok (dálnice a dlouhé trasy)'],
      },
      {
        id: 'trunk_capacity',
        name: 'Objem kufru',
        category: 'Užitná hodnota',
        importance: 'recommended',
        rationale: 'Rozhoduje o schopnosti pojmout kočárek, sportovní vybavení nebo velká zavazadla bez nutnosti střešního boxu.',
        icon: '🧳',
        suggestedComponent: 'chips',
        suggestedValues: ['Kompaktní kufr (do 400 l)', 'Rodinný standard (450 – 580 l)', 'Velký rodinný stěhovák (600+ l)'],
      },
      {
        id: 'vehicle_condition',
        name: 'Stav vozidla',
        category: 'Původ & Rizika',
        importance: 'recommended',
        rationale: 'Nové skladové auto s tovární zárukou 5–7 let vs. zánovní prověřený vůz do 3 let vs. spolehlivá ojetina.',
        icon: '🛡️',
        suggestedComponent: 'chips',
        suggestedValues: ['Zcela nové skladové vozidlo', 'Zánovní vůz do 3 let (certifikovaný program)', 'Kvalitní ojetina (stáří 4–7 let)'],
      },
      {
        id: 'safety_assistants',
        name: 'Bezpečnostní výbava',
        category: 'Bezpečnost',
        importance: 'recommended',
        rationale: 'Adaptivní tempomat (ACC), hlídání mrtvého úhlu, LED Matrix světlomety a udržování v pruhu výrazně snižují únavu a riziko nehody.',
        icon: '👁️',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Maximální bezpečnostní balík (aktivní udržování v pruhu, adaptivní tempomat a nouzové brzdění)',
          'Standardní bezpečnostní výbava (tempomat, parkovací senzory a sledování únavy)',
          'Základní pasivní bezpečnost (airbagy a ABS/ESP postačí)',
        ],
      },
      {
        id: 'running_costs',
        name: 'Provozní náklady',
        category: 'Ekonomika provozu (TCO)',
        importance: 'recommended',
        rationale: 'Zohledňuje dostupnost a ceny náhradních dílů v ČR, spolehlivost motorů a tempo poklesu tržní hodnoty při následném prodeji.',
        icon: '📊',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Minimální provozní a servisní náklady (vysoká spolehlivost a levné náhradní díly)',
          'Vyvážený poměr ceny servisu a komfortu (běžný evropský standard)',
          'Prémiový servis s plnou tovární zárukou a mobilitou',
        ],
      },
      {
        id: 'budget_czk',
        name: 'Rozpočet',
        category: 'Financování',
        importance: 'mandatory',
        rationale: 'Finanční strop v Kč včetně DPH. Určuje reálné spektrum modelů v dané třídě.',
        icon: '💰',
        suggestedComponent: 'slider',
        suggestedValues: [
          'Dostupná kategorie do 400 000 Kč (spolehlivá ojetina s jasnou historií)',
          'Střední třída 400 000 – 800 000 Kč (zánovní rodinný vůz v plné výbavě)',
          'Vyšší střední třída 800 000 – 1 400 000 Kč (nový prémiový vůz nebo moderní EV)',
          'Prémiový segment nad 1 400 000 Kč (maximální luxus, výkon a technologie)',
        ],
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
        name: 'Tažné zařízení',
        category: 'Praktičnost',
        importance: 'recommended',
        rationale: 'Klíčové pro tahání karavanu, přívěsného vozíku či montáž nosiče jízdních kol na tažné oko.',
        icon: '🚛',
        suggestedComponent: 'chips',
        suggestedValues: ['Požaduji tažné zařízení (1500+ kg)', 'Pouze pro nosič kol (do 750 kg)', 'Není potřeba'],
      },
      {
        id: 'adas_systems',
        name: 'Asistenty řízení',
        category: 'Bezpečnost',
        importance: 'recommended',
        rationale: 'Adaptivní tempomat Stop&Go, aktivní vedení v jízdním pruhu a hlídání mrtvého úhlu.',
        icon: '🛡️',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Autonomní jízda Level 2+ s 360° kamerami (automatické parkování a dálniční asistent)',
          'Adaptivní tempomat s vedením v pruhu (komfort na dlouhých dálničních trasách)',
          'Základní parkovací senzory a couvací kamera',
        ],
      },
      {
        id: 'matrix_headlights',
        name: 'Adaptivní světlomety',
        category: 'Viditelnost',
        importance: 'preference',
        rationale: 'Automatické vykrývání protijedoucích vozidel pro maximální bezpečnost při častých nočních jízdách.',
        icon: '💡',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Inteligentní Matrix LED / Laser světla (vykrývání protijedoucích aut bez oslnění)',
          'Standardní Full LED světlomety (vysoký světelný výkon s automatickým přepínáním)',
          'Základní halogenové / LED světlomety',
        ],
      },
      {
        id: 'panoramic_roof',
        name: 'Panoramatická střecha',
        category: 'Komfort',
        importance: 'preference',
        rationale: 'Optické prosvětlení kabiny a vzdušnost vs. vyšší hmotnost a nižší prostor nad hlavou vzadu.',
        icon: '☀️',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Otevíratelná panoramatická střecha (vzdušnost kabiny a větrání v létě)',
          'Pevné prosklené panoramatické okno s elektrickou clonou',
          'Klasická plná plechová střecha (nejlepší tepelná izolace a nižší hmotnost)',
        ],
      },
      {
        id: 'infotainment_sound',
        name: 'Audio a konektivita',
        category: 'Konektivita',
        importance: 'preference',
        rationale: 'Kvalitní audiofilní ozvučení a stabilní bezdrátové zrcadlení navigace.',
        icon: '🎵',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Prémiový audiosystém (Harman Kardon, Bose nebo B&O se subwooferem)',
          'Bezdrátový Apple CarPlay / Android Auto se standardním ozvučením',
          'Základní bluetooth rádio a handsfree',
        ],
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
        name: 'Typ došlapu',
        category: 'Ortopedie & Anatomie',
        importance: 'mandatory',
        rationale: 'Zamezuje přetížení šlach a vazů. Pronace vyžaduje vnitřní podporu, neutrál a supinace flexibilní vedení.',
        icon: '🦶',
        suggestedComponent: 'chips',
        suggestedValues: ['Neutrální došlap', 'Mírná až silná pronace', 'Supinace (vnější hrana)'],
      },
      {
        id: 'surface',
        name: 'Převažující terén',
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
        name: 'Šířka chodidla',
        category: 'Ergonomie chodidla',
        importance: 'recommended',
        rationale: 'Předchází puchýřům, otlakům a zhoršení vbočených palců (halux valgus).',
        icon: '📐',
        suggestedComponent: 'chips',
        suggestedValues: ['Standardní šířka (Medium D)', 'Široké chodidlo (Wide 2E)', 'Extra široké / Haluxy (4E)'],
      },
      {
        id: 'heel_drop',
        name: 'Drop mezipodešve',
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
        name: 'Voděodolnost',
        category: 'Klimatické podmínky',
        importance: 'preference',
        rationale: 'Membrána chrání před mokrem v zimě a dešti, ale snižuje prodyšnost v teplém počasí.',
        icon: '💧',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Gore-Tex nepromokavá membrána (ochrana proti mokré trávě, blátu a sněhu)',
          'Hustě tkaná vodoodpudivá síťovina DWR (slušná ochrana s dobrou prodyšností)',
          'Ultraprodyšný letní svršek bez membrány (rychle schne a skvěle větrá)',
        ],
      },
      {
        id: 'plate_rigidity',
        name: 'Karbonový plát',
        category: 'Závodní technologie',
        importance: 'preference',
        rationale: 'Karbonový plát zvyšuje návratnost energie v závodním tempu, ale vyžaduje specifickou techniku běhu.',
        icon: '🚀',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Karbonový plát po celé délce (maximální odraz a rychlost pro závodní tempo)',
          'Nylonový / sklolaminátový plát (pružnější odraz vhodný i na svižný trénink)',
          'Tradiční mezipodešev bez plátu (přirozený pohyb chodidla a šetření achilovek)',
        ],
      },
      {
        id: 'budget',
        name: 'Orientační rozpočet',
        category: 'Investice',
        importance: 'preference',
        rationale: 'Filtruje odpovídající cenové kategorie na českém a evropském trhu.',
        icon: '💰',
        suggestedComponent: 'slider',
        suggestedValues: [
          'Dostupná cenová hladina s nejlepším poměrem ceny a výkonu',
          'Zlatá střední třída s vyšší odolností a pokročilejšími funkcemi',
          'Prémiová kategorie s nekompromisními materiály a maximální výbavou',
        ],
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
        name: 'Voděodolná membrána',
        category: 'Ochrana proti počasí',
        importance: 'recommended',
        rationale: 'Udrží nohy v suchu při běhu v dešti, blátě a sněhu za cenu mírně nižší prodyšnosti v horku.',
        icon: '🌧️',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Gore-Tex nepromokavá membrána (ochrana proti mokré trávě, blátu a sněhu)',
          'Hustě tkaná vodoodpudivá síťovina DWR (slušná ochrana s dobrou prodyšností)',
          'Ultraprodyšný letní svršek bez membrány (rychle schne a skvěle větrá)',
        ],
      },
      {
        id: 'carbon_plate',
        name: 'Karbonový plát',
        category: 'Závodní dynamika',
        importance: 'preference',
        rationale: 'Zvyšuje tuhost ohybu a odrazovou rychlost pro závody a rychlé tempové tréninky.',
        icon: '🚀',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Karbonový plát po celé délce (maximální odraz a rychlost pro závodní tempo)',
          'Nylonový / sklolaminátový plát (pružnější odraz vhodný i na svižný trénink)',
          'Tradiční mezipodešev bez plátu (přirozený pohyb chodidla a šetření achilovek)',
        ],
      },
      {
        id: 'reflective_safety',
        name: 'Reflexní prvky',
        category: 'Bezpečnost',
        importance: 'preference',
        rationale: 'Zajišťuje vysokou viditelnost běžce při běhu podél silnic za tmy a šera.',
        icon: '✨',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Výrazné 360° reflexní prvky a reflexní tkaničky (maximální viditelnost za šera a v noci)',
          'Základní reflexní logo na patě',
          'Bez požadavku na reflexní prvky (běhám výhradně za denního světla)',
        ],
      },
      {
        id: 'wide_toebox_natural',
        name: 'Široká špička',
        category: 'Anatomie',
        importance: 'recommended',
        rationale: 'Dostatek prostoru pro přirozené roztažení prstů, prevence vbočeného palce a otlaků malíků.',
        icon: '🦶',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Anatomicky široká špička FootShape (prsty mají prostor pro přirozený vějířovitý rozptyl)',
          'Standardní šířka kopyta (univerzální anatomický střih většiny značek)',
          'Užší závodní střih (pevné sevření nártu a maximální cit pro terén)',
        ],
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
        name: 'Způsob přípravy',
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
        suggestedValues: [
          'Dvojitý bojler Dual Boiler (současná příprava espressa a šlehání mikropěny)',
          'Jeden bojler s výměníkem Heat Exchanger (profesionální výkon v kompaktním těle)',
          'Rychlý termoblok (nahřátí přístroje za 30 sekund – úspora času ráno)',
        ],
      },
      {
        id: 'maintenance_ease',
        name: 'Čištění a údržba',
        category: 'Údržba',
        importance: 'recommended',
        rationale: 'Vyjímatelná spařovací jednotka pro oplach pod vodou vs. automatický chemický čistící program (Jura styl).',
        icon: '🧼',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Plně automatické parní čištění mléčného okruhu po každém šálku',
          'Vyjímatelná spařovací jednotka s možností snadného opláchnutí pod vodou',
          'Integrovaný automatický odvápňovací program s vodním filtrem',
        ],
      },
      {
        id: 'temperature_pid',
        name: 'Regulace teploty',
        category: 'Pokročilá chuť',
        importance: 'preference',
        rationale: 'Důležité pro světle pražené výběrové kávy vyžadující vyšší a přesně nastavenou teplotu vody.',
        icon: '🌡️',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Přesná digitální regulace PID po 1 °C (nastavení ideální extrakce pro světle pražená zrna)',
          'Třístupňová volba teploty (Nízká / Střední / Vysoká)',
          'Pevná tovární teplota extrakce 92 °C',
        ],
      },
      {
        id: 'dimensions_noise',
        name: 'Rozměry a hlučnost',
        category: 'Uživatelský komfort',
        importance: 'preference',
        rationale: 'Kompaktní šířka na menší kuchyňskou linku a tiché čerpadlo pro ranní přípravu kávy.',
        icon: '📐',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Kompaktní rozměry do malé kuchyně s tichým rotačním čerpadlem',
          'Standardní rozměry s odhlučněným vibračním čerpadlem',
          'Robustní nerezové provedení bez omezení prostoru',
        ],
      },
      {
        id: 'specialty_coffee',
        name: 'Výběrová káva',
        category: 'Kvalita extrakce',
        importance: 'preference',
        rationale: 'Nastavitelná pre-infuze (předspaření), gramáž dávky kávy a jemnost sítka v páce.',
        icon: '✨',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Příprava výběrové světle pražené kávy (pre-infuze, PID regulace a jemné mletí)',
          'Univerzální profil pro středně i tmavěji pražená zrna a mléčné speciality',
          'Tradiční italské espresso (hustá crema, čokoládovo-oříškový profil)',
        ],
      },
      {
        id: 'budget',
        name: 'Orientační rozpočet',
        category: 'Investice',
        importance: 'preference',
        rationale: 'Od cenově dostupných automatů po prémiové italské espresso stroje.',
        icon: '💰',
        suggestedComponent: 'slider',
        suggestedValues: [
          'Základní domácí kávovar (do 8 000 Kč)',
          'Kvalitní automatický kávovar s mlékem (8 000 – 20 000 Kč)',
          'Prémiový pákový nebo luxusní automatický stroj (nad 20 000 Kč)',
        ],
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
        id: 'chair_category_type',
        name: 'Typ židle a mechanika',
        category: 'Kategorie & Typologie',
        importance: 'mandatory',
        rationale: 'Základní tržní zařazení. Synchronní židle poskytuje pevnou oporu při celodenním sezení, balanční židle s pohyblivým sedlem posiluje hluboké svaly a křeslo nabízí měkké polstrování. Otázka pro vás: Hledáte synchronní ergonomickou židli, balanční pro aktivní sezení, nebo křeslo?',
        icon: '🪑',
        suggestedComponent: 'chips',
        suggestedValues: ['Synchronní ergonomická kancelářská židle', 'Aktivní balanční židle se sedlem na 3D kloubu', 'Manažerské reprezentativní křeslo'],
      },
      {
        id: 'user_body_dimensions_spine',
        name: 'Výška, váha a stav páteře',
        category: 'Biometrie & Zdraví',
        importance: 'mandatory',
        rationale: 'Výška postavy určuje rozsah zdvihu pístu a výšku opěráku hlavy. Hmotnost určuje tuhost přítlaku mechaniky. Lidé po operaci ploténky či s kostrční bolestí vyžadují specifický odlehčovací kanálek a nafukovací bederní oporu. Otázka pro vás: Jaká je vaše výška, váha a máte potíže s bederní či krční páteří?',
        icon: '🧬',
        suggestedComponent: 'chips',
        suggestedValues: ['Výška do 175 cm / Hmotnost do 80 kg', 'Vyšší postava (180+ cm) / Hmotnost 80–100 kg', 'Vysoká zátěž 100+ kg (těžký zátěžový píst)', 'Po operaci páteře / chronické bolesti beder (požadavek na zdravotní certifikaci)'],
      },
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
        name: 'Typ mechaniky',
        category: 'Ergonomická mechanika',
        importance: 'mandatory',
        rationale: 'Synchronní mechanika kopíruje sklon trupu; balanční mechanismus stimuluje hluboké svalstvo středu těla.',
        icon: '⚙️',
        suggestedComponent: 'chips',
        suggestedValues: ['Synchronní s aretací ve více polohách', 'Aktivní balanční mechanika', 'Základní houpací mechanismus'],
      },
      {
        id: 'lumbar_support',
        name: 'Bederní opěrka',
        category: 'Ergonomie páteře',
        importance: 'mandatory',
        rationale: 'Udržení fyziologické lordózy. Výškově i hloubkově stavitelná opěrka brání sesedání a kulacení zad.',
        icon: '🩺',
        suggestedComponent: 'chips',
        suggestedValues: ['Aktivní nastavitelná bederní opora', 'Mám bolesti zad / výhřez ploténky', 'Základní anatomické tvarování'],
      },
      {
        id: 'armrests',
        name: 'Nastavení područek',
        category: 'Úleva pro ramena & šíji',
        importance: 'recommended',
        rationale: 'Správná podpora loktů v úhlu 90° uvolňuje trapézové svaly a předchází bolestem krční páteře.',
        icon: '💪',
        suggestedComponent: 'chips',
        suggestedValues: ['3D/4D nastavitelné (výška, posuv, úhel)', 'Výškově stavitelné', 'Bez područek'],
      },
      {
        id: 'headrest',
        name: 'Podhlavník',
        category: 'Krční páteř',
        importance: 'recommended',
        rationale: 'Zajišťuje oporu hlavy při zaklonění během telefonování či relaxace.',
        icon: '👤',
        suggestedComponent: 'chips',
        suggestedValues: [
          '3D stavitelný podhlavník (výška i úhel sklonu pro relaxaci a oporu krku)',
          'Pevný integrovaný podhlavník v opěráku',
          'Bez podhlavníku (preferuji volnost pohybu ramen a krku)',
        ],
      },
      {
        id: 'seat_depth',
        name: 'Hloubka sedáku',
        category: 'Krevní oběh nohou',
        importance: 'recommended',
        rationale: 'Předchází tlaku na podkolenní jamky a zajišťuje volný průtok krve do dolních končetin.',
        icon: '💺',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Nastavitelný posuv hloubky sedáku (nezbytné pro správné prokrvení nohou)',
          'Pevná ergonomická hloubka sedáku s měkčenou přední hranou',
          'Zkrácený sedák pro drobnější postavy do 165 cm',
        ],
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
        name: 'Nosnost pístu',
        category: 'Nosnost & rozměry',
        importance: 'recommended',
        rationale: 'Hloubka sedáku a nosnost pístu musí odpovídat postavě.',
        icon: '📏',
        suggestedComponent: 'chips',
        suggestedValues: ['Do 175 cm / do 80 kg', '175–190 cm / 80–110 kg', 'Nad 190 cm nebo nad 110 kg'],
      },
      {
        id: 'castors_floor',
        name: 'Kolečka podle podlahy',
        category: 'Ochrana podlahy',
        importance: 'preference',
        rationale: 'Měkká pogumovaná kolečka chrání dřevěné parkety a lino; tvrdá kolečka jsou určena pro koberce.',
        icon: '🛞',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Měkká pogumovaná kolečka na tvrdé podlahy (parkety, vinyl, plovoucí podlaha)',
          'Tvrdá plastová kolečka na koberce a zátěžové krytiny',
          'Univerzální brzděná kolečka s bezpečnostní zátěžovou brzdou',
        ],
      },
      {
        id: 'budget',
        name: 'Orientační rozpočet',
        category: 'Investice do zdraví',
        importance: 'preference',
        rationale: 'Od certifikovaných ergonomických židlí po prémiové ikony (Herman Miller, Steelcase).',
        icon: '💰',
        suggestedComponent: 'slider',
        suggestedValues: [
          'Základní ergonomická židle (do 8 000 Kč)',
          'Kvalitní synchronní židle se síťovinou (8 000 – 18 000 Kč)',
          'Prémiová zdravotní židle (Herman Miller / SpinaliS – nad 18 000 Kč)',
        ],
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
        name: 'Kvalita displeje',
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
        name: 'Operační systém',
        category: 'Platforma',
        importance: 'mandatory',
        rationale: 'macOS (Apple Silicon M-série) vs. Windows 11 Pro vs. Linux kompatibilita.',
        icon: '🍏',
        suggestedComponent: 'chips',
        suggestedValues: ['macOS (Apple Silicon)', 'Windows 11 Pro', 'Linux / Bez OS'],
      },
      {
        id: 'ram_capacity',
        name: 'Operační paměť RAM',
        category: 'Multitasking',
        importance: 'recommended',
        rationale: '16 GB jako moderní základ, 32+ GB pro Docker kontejnery, virtualizaci a práci s videem.',
        icon: '🧠',
        suggestedComponent: 'chips',
        suggestedValues: ['16 GB RAM', '32 GB RAM', '64 GB RAM a více'],
      },
      {
        id: 'storage_capacity',
        name: 'SSD úložiště',
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
        name: 'Konektory a porty',
        category: 'Konektivita',
        importance: 'preference',
        rationale: 'Thunderbolt 4 pro dokování k monitoru jedním kabelem, plnohodnotné HDMI a čtečka SD karet.',
        icon: '🔌',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Plná výbava včetně Thunderbolt 4 / USB4 a HDMI (dokování jedním kabelem)',
          'Standardní USB-C s podporou Power Delivery a klasické USB-A',
          'Minimalistická portová výbava (používám externí USB-C rozbočovač)',
        ],
      },
      {
        id: 'cooling_acoustics',
        name: 'Chlazení a hlučnost',
        category: 'Akustický komfort',
        importance: 'preference',
        rationale: 'Tichý chod při běžné práci bez neustálého hučení větráků.',
        icon: '❄️',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Tiché pasivní chlazení bez ventilátoru (zcela bezhlučný chod – např. Apple MacBook Air)',
          'Inteligentní duální ventilátory s tichým profilem při běžné kancelářské práci',
          'Maximální chladicí výkon pro náročný render a hraní her',
        ],
      },
      {
        id: 'budget',
        name: 'Orientační rozpočet',
        category: 'Investice',
        importance: 'preference',
        rationale: 'Kategorie od dostupných studentských modelů po špičkové profesionální stanice.',
        icon: '💰',
        suggestedComponent: 'slider',
        suggestedValues: [
          'Cenově dostupný studentský notebook (do 18 000 Kč)',
          'Všestranná střední třída pro práci i zábavu (18 000 – 35 000 Kč)',
          'Prémiový ultrabook nebo grafická stanice (nad 35 000 Kč)',
        ],
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
        name: 'Jezdecký styl',
        category: 'Geometrie & Styl',
        importance: 'mandatory',
        rationale: 'Parkové koloběžky jsou kratší a lehčí pro airy a rotace; streetové mají delší, širší desku s rovnými konci (box-cut) pro grindy.',
        icon: '🛹',
        suggestedComponent: 'chips',
        suggestedValues: ['Skatepark (lehká, obratná na airy a triky)', 'Street (robustní, široká box-cut deska na grindy)', 'Univerzální / Hybrid (park i street)'],
      },
      {
        id: 'bar_dimensions',
        name: 'Rozměry řídítek',
        category: 'Ergonomie & Bezpečnost',
        importance: 'mandatory',
        rationale: 'Správná výška řídítek (obvykle mezi pasem a boky, 55–72 cm) zabraňuje bolesti zad a umožňuje čisté provádění triků.',
        icon: '📏',
        suggestedComponent: 'chips',
        suggestedValues: ['Do 60 cm (pro výšku jezdce do 140 cm)', '60–65 cm (pro výšku 140–165 cm)', '65–70 cm (pro výšku 165–180 cm)', 'Nad 70 cm (pro výšku nad 180 cm)'],
      },
      {
        id: 'compression_system',
        name: 'Kompresní systém',
        category: 'Konstrukce & Komprese',
        importance: 'mandatory',
        rationale: 'SCS je nejpevnější a nejodolnější systém na trhu; IHC je lehčí a levnější, ideální pro parkové jezdce a začátečníky.',
        icon: '🔩',
        suggestedComponent: 'chips',
        suggestedValues: ['SCS (Standard Compression System - maximální pevnost)', 'IHC (Integrated Headset Compression - lehký standard)', 'HIC (pro oversize ocelová řídítka)'],
      },
      {
        id: 'wheel_specs',
        name: 'Parametry koleček',
        category: 'Kolečka & Jízda',
        importance: 'mandatory',
        rationale: '110 mm nabízí rychlou odezvu v parku; 120 mm poskytuje vyšší maximální rychlost, hladší přejezd nerovností a delší životnost.',
        icon: '🛞',
        suggestedComponent: 'chips',
        suggestedValues: ['110 mm / hliníkový střed (klasický obratný standard)', '120 mm / hliníkový střed (vyšší rychlost a plynulost)', '100 mm (pouze pro nejmenší děti)'],
      },
      {
        id: 'deck_specs',
        name: 'Konstrukce desky',
        category: 'Deska (Deck)',
        importance: 'mandatory',
        rationale: 'Kvalitní tepelně zpracovaný hliník 6061-T6. Širší deska (5.0–6.0") a box-cut konce pro street grindování; užší (4.5–4.8") pro snadné tailwhipy.',
        icon: '📐',
        suggestedComponent: 'chips',
        suggestedValues: ['Šířka 4.5"–4.8" / Peg-cut (park)', 'Šířka 5.0"–5.5" / Box-cut (univerzál)', 'Šířka 5.5"–6.0" / Box-cut (čistý street)'],
      },
      {
        id: 'bar_material',
        name: 'Materiál řídítek',
        category: 'Konstrukce řídítek',
        importance: 'recommended',
        rationale: 'Ocel 4130 je prakticky nezničitelná pro street; hliník je extrémně lehký pro park; titan spojuje nízkou váhu s vysokou pružností.',
        icon: '🛡️',
        suggestedComponent: 'chips',
        suggestedValues: ['Chromoly 4130 ocel (maximální pevnost a spolehlivost)', 'Hliník 6061-T6 (lehká ovladatelnost pro park)', 'Titan (prémiová pevnost při minimální váze)'],
      },
      {
        id: 'total_weight',
        name: 'Hmotnost kompletu',
        category: 'Hmotnost & Ovladatelnost',
        importance: 'recommended',
        rationale: 'Pro park a menší jezdce je ideální váha 3.0–3.6 kg; pro streetové dropy a starší jezdce stabilních 3.8–4.4 kg.',
        icon: '⚖️',
        suggestedComponent: 'chips',
        suggestedValues: ['Ultralehká (do 3.4 kg - ideální na park)', 'Střední (3.4–3.9 kg - všestranný hybrid)', 'Těžší streetová (nad 4.0 kg - nezničitelná)'],
      },
      {
        id: 'brake_type',
        name: 'Typ brzdy',
        category: 'Brzdový systém',
        importance: 'recommended',
        rationale: 'Ocelová brzda typu Flex fender je přišroubovaná a pružná – nevydává žádné nepříjemné rezonance a neničí kolečka.',
        icon: '🛑',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Pružná ocelová brzda Flex Fender (tichá, bez chrastění a šetrná ke kolečkům)',
          'Pružinová nášlapná brzda (jednoduché a lehké sešlápnutí)',
          'Bez zadní brzdy / brakeless (preferováno čistě pro streetový styl)',
        ],
      },
      {
        id: 'headset_bearings',
        name: 'Ložiska a hlavové složení',
        category: 'Ložiska & Hladkost rotace',
        importance: 'preference',
        rationale: 'Integrované bezzávitové hlavové složení (Integrated Headset) se zapouzdřenými průmyslovými ložisky zaručuje hladké rotace řídítek bez vůle.',
        icon: '🔄',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Integrované průmyslové hlavové složení s ložisky ABEC 9 / ABEC 11',
          'Kvalitní zapouzdřená ložiska se snadnou údržbou',
          'Základní kuličkové hlavové složení',
        ],
      },
      {
        id: 'rider_weight_capacity',
        name: 'Nosnost vidlice',
        category: 'Nosnost & Odolnost',
        importance: 'mandatory',
        rationale: 'Pevná jednodílná CNC frézovaná hliníková vidlice s nosností 100 kg zvládne i tvrdé skoky ze schodů bez ohnutí.',
        icon: '💪',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Zesílená nosnost do 120 kg (masivní kovaná vidlice a odolné svary pro skoky)',
          'Standardní nosnost do 100 kg (univerzální pro dospívající a dospělé jezdce)',
          'Dětská a juniorská zátěž do 70 kg',
        ],
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
        name: 'Grindovací pegy',
        category: 'Příslušenství',
        importance: 'preference',
        rationale: 'Hliníkové nebo ocelové kolíky na osách koleček pro grindování po zábradlích.',
        icon: '🔩',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Součástí balení jsou přední i zadní grindovací pegy',
          'Příprava na montáž pegů bez pegů v balení',
          'Bez pegů (pro parkové polety a triky ve vzduchu nejsou potřeba)',
        ],
      },
      {
        id: 'griptape_coarseness',
        name: 'Griptape',
        category: 'Grip & Bezpečnost',
        importance: 'preference',
        rationale: 'Hrubší zrno griptapu zabraňuje sklouznutí boty při tvrdých dopadech z triků.',
        icon: '🛹',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Hrubý protiskluzový griptape s maximálním gripem pro street',
          'Jemný komfortní griptape šetrný k podrážkám bot',
          'Středně hrubý designový griptape',
        ],
      },
    ],
  },
  skis: {
    keywords: ['lyze', 'lyzovani', 'lyzaky', 'sjezdovky', 'snowboard', 'bezky', 'skialpy', 'skis', 'skiing', 'slalom', 'sjezdove lyze'],
    categoryName: 'Zimní Sporty & Lyžování',
    agentName: 'Ski & Snowboard Expert',
    icon: '🎿',
    description: 'Nezávislý nákupní rádce pro výběr sjezdových, all-mountain a skialpových lyží podle rádiusu oblouku, šířky pod patou, torzní tuhosti dřevěného jádra s Titanalem a typu vázání.',
    parameters: [
      {
        id: 'skis_terrain_purpose',
        name: 'Typ lyží a terén',
        category: 'Jezdecký styl & Terén',
        importance: 'mandatory',
        rationale: 'Rozlišuje čistě sjezdovkové lyže (Piste) držící na ledu od univerzálních All-Mountain 50:50 na odpolední rozbitou sjezdovku a širokých Freeride/Skialp lyží do volného terénu. Otázka pro vás: Kde a v jakých podmínkách nejčastěji lyžujete?',
        icon: '🏔️',
        suggestedComponent: 'chips',
        suggestedValues: ['Upravená sjezdovka (Piste)', 'All-Mountain 50:50 (ranní led i odpolední muldy)', 'Skialp / Skitouring (lehká konstrukce na výšlapy)', 'Freeride (hluboký neupravený prašan)'],
      },
      {
        id: 'skier_biometrics_health',
        name: 'Výška, váha a kolena',
        category: 'Biometrie & Zdraví',
        importance: 'mandatory',
        rationale: 'Výška a váha určují optimální délku lyží a vypínací sílu vázání DIN. Lyžaři po operaci křížového vazu v koleni (ACL) nebo s artrózou potřebují měkčí flexi a včasné bezpečné vypínání vázání bez torzního přetížení kloubu. Otázka pro vás: Jaká je vaše výška, váha a máte potíže s koleny či klouby?',
        icon: '🧬',
        suggestedComponent: 'chips',
        suggestedValues: ['Standardní postava bez omezení kolen', 'Vyšší hmotnost (90+ kg) / silový styl', 'Po operaci kolen / citlivé klouby (požadavek na šetrný flex a bezpečné vázání)'],
      },
      {
        id: 'skis_turn_radius',
        name: 'Rádius oblouku',
        category: 'Geometrie & Ovladatelnost',
        importance: 'mandatory',
        rationale: 'Rádius určuje přirozenou délku oblouku: krátký (11-13 m) pro dynamické krátké oblouky, střední univerzální (14-16 m) pro celodenní jízdu a dlouhý (17+ m) pro rychlou stabilitu. Otázka pro vás: Jaký styl oblouků vás nejvíce baví?',
        icon: '🔄',
        suggestedComponent: 'chips',
        suggestedValues: ['Krátký slalomový oblouk (11–13 m)', 'Střední univerzální oblouk (14–16 m)', 'Dlouhý rychlý obřákový oblouk (17–20+ m)'],
      },
      {
        id: 'skis_waist_width',
        name: 'Šířka středu lyže',
        category: 'Geometrie lyže',
        importance: 'mandatory',
        rationale: 'Užší střed (68–74 mm) bleskově přehraňuje na tvrdém podkladu; širší střed (78–88 mm) dává stabilitu v měkkém jarním firnu a novém sněhu. Otázka pro vás: Preferujete ranní tvrdou pistu, nebo celodenní jízdu v jakémkoliv sněhu?',
        icon: '📐',
        suggestedComponent: 'chips',
        suggestedValues: ['Sportovní úzká (68–74 mm, bleskové přehranění na ledu)', 'Univerzální celodenní (75–84 mm, zvládne i odpolední břečku)', 'Široká All-mountain (85–98 mm, do rozbitého terénu)'],
      },
      {
        id: 'skis_core_titanal',
        name: 'Konstrukce jádra',
        category: 'Materiál & Torzní tuhost',
        importance: 'mandatory',
        rationale: 'Dřevěné jádro s 1-2 pláty Titanalu eliminuje vibrace a drží stopu i v 80 km/h, vyžaduje však sílu. Pěnové jádro bez kovu v rychlosti kmitá a ztrácí hranu. Otázka pro vás: Jaká je vaše fyzická kondice a agresivita jízdy?',
        icon: '🪵',
        suggestedComponent: 'chips',
        suggestedValues: ['Dřevěné sendvičové jádro s 1–2 pláty Titanalu (sportovní/závodní grip)', 'Dřevěné jádro vyztužené karbonem (dynamické a lehčí)', 'Kompozitní jádro odpouštějící chyby (pro rekreační pohodovou jízdu)'],
      },
      {
        id: 'skis_profile_rocker',
        name: 'Profil prohnutí',
        category: 'Profil & Záběr hrany',
        importance: 'recommended',
        rationale: 'Plný Camber nabízí maximální délku účinné hrany na tvrdém sněhu; Tip Rocker (přizvednutá špička) usnadňuje zahájení oblouku a zamezuje zakousnutí špičky. Otázka pro vás: Požadujete maximální agresivitu, nebo snadné zahájení oblouku?',
        icon: '🎿',
        suggestedComponent: 'chips',
        suggestedValues: ['Tip Rocker (snadné zahájení oblouku + stabilita)', 'Klasický sportovní Camber (maximální odraz a grip po celé délce)', 'Tip & Tail Rocker (oboustranně přizvednuté, hravé)'],
      },
      {
        id: 'skis_skier_level',
        name: 'Pokročilost a tuhost',
        category: 'Fyzická náročnost',
        importance: 'recommended',
        rationale: 'Příliš tvrdá sportovní lyže unaví rekreačního jezdce po dvou jízdách; příliš měkká lyže selže pod těžším či agresivním jezdcem. Otázka pro vás: Jak hodnotíte svou jezdeckou úroveň?',
        icon: '⛷️',
        suggestedComponent: 'chips',
        suggestedValues: ['Pokročilý sportovní jezdec (rychlá jízda po hranách)', 'Zkušený expert / Bývalý závodník (agresivní silová jízda)', 'Mírně pokročilý / Rekreační lyžař (kontrolovaná jízda, smýkání)'],
      },
      {
        id: 'skis_binding_gripwalk',
        name: 'Vázání a GripWalk',
        category: 'Bezpečnost & Vázání',
        importance: 'recommended',
        rationale: 'Vázání musí odpovídat vaší hmotnosti a výšce (DIN rozsah obvykle 3–11 nebo 4–14) a podporovat moderní zaoblené podrážky GripWalk (GW). Otázka pro vás: Jaké lyžáky vlastníte a jaká je vaše hmotnost?',
        icon: '🔒',
        suggestedComponent: 'chips',
        suggestedValues: ['Integrované systémové vázání GripWalk s DIN do 11–12', 'Zesílené sportovní vázání s DIN do 14–16', 'Skialpové pinové vázání (Tech / Tour)'],
      },
      {
        id: 'skis_length_sizing',
        name: 'Délka lyží',
        category: 'Geometrie & Dimenzování',
        importance: 'recommended',
        rationale: 'Slalomka se volí o 10–20 cm kratší než postava; univerzální all-mountain o 5–12 cm kratší; obřačka nebo freeride v plné výšce postavy. Otázka pro vás: Kolik měříte a vážíte?',
        icon: '📏',
        suggestedComponent: 'chips',
        suggestedValues: ['Kratší o 10–18 cm k postavě (snadná točivost a slalom)', 'Kratší o 5–10 cm k postavě (zlatý střed)', 'Na výšku postavy (maximální stabilita ve vysoké rychlosti)'],
      },
      {
        id: 'skis_budget',
        name: 'Rozpočet na lyže',
        category: 'Investice',
        importance: 'preference',
        rationale: 'Kvalitní sendvičové lyže s dřevěným jádrem a Titanalem začínají na 13 000 Kč; špičkové modely se pohybují mezi 18 000 až 35 000 Kč.',
        icon: '💰',
        suggestedComponent: 'slider',
        suggestedValues: [
          'Dostupná kategorie do 12 000 Kč včetně vázání (rekreační lyžování)',
          'Sportovní střední třída 12 000 – 22 000 Kč (univerzální all-mountain a sportovní carve)',
          'Prémiové a závodní modely nad 22 000 Kč (dřevěné jádro s dvojitým titanalem)',
        ],
      },
      UNIVERSAL_BRAND_PARAMETER,
    ],
    questions: [
      {
        id: 'skis_q_terrain',
        step: 1,
        title: 'Kde a v jakých podmínkách nejčastěji lyžujete?',
        subtitle: 'Rozhoduje o optimální šířce středu lyže a profilu prohnutí.',
        component: 'chips',
        isMultiSelect: false,
        options: [
          { label: 'Upravená sjezdovka (Piste)', value: 'piste', description: 'Ranní upravený svah, důraz na čisté carvingové vedení po hraně.' },
          { label: 'Celodenní sjezdovka (All-mountain)', value: 'all_mountain', description: 'Ráno tvrdý manšestr, odpoledne měkké muldy a rozježděný sníh.' },
          { label: 'Skialp / Skitour výšlapy', value: 'skitour', description: 'Lehká konstrukce pro stoupání na pásech a sjezdy ve volném terénu.' }
        ],
        defaultValue: 'piste',
        promptForgeTemplate: '- **Převažující terén & styl:** {value}',
      },
      {
        id: 'skis_q_radius',
        step: 2,
        title: 'Jakou délku oblouku preferujete?',
        subtitle: 'Rádius určuje přirozenou točivost a stabilitu v rychlosti.',
        component: 'chips',
        isMultiSelect: false,
        options: [
          { label: 'Krátký slalomový oblouk (11–13 m)', value: 'short_slalom', description: 'Hravé rychlé přehranění, dynamická točivost.' },
          { label: 'Střední univerzální oblouk (14–16 m)', value: 'medium_radius', description: 'Pohodový celodenní rytmus, zvládne krátký i delší oblouk.' },
          { label: 'Dlouhý rychlý obřákový oblouk (17+ m)', value: 'long_gs', description: 'Vysoká rychlost, stabilita a dlouhé táhlé carvingové oblouky.' }
        ],
        defaultValue: 'medium_radius',
        promptForgeTemplate: '- **Preferovaný rádius oblouku:** {value}',
      },
      {
        id: 'skis_q_level',
        step: 3,
        title: 'Jaká je vaše jezdecká pokročilost a fyzická kondice?',
        subtitle: 'Určuje nutnost výztuh Titanalem a tvrdost jádra lyže.',
        component: 'chips',
        isMultiSelect: false,
        options: [
          { label: 'Sportovní / Agresivní jezdec', value: 'sport', description: 'Tvrdé dřevěné jádro s titanalovými pláty, vyžaduje sílu a techniku.' },
          { label: 'Pokročilý rekreační lyžař', value: 'advanced', description: 'Dřevěné jádro s karbonem, výborný grip bez přehnané únavy nohou.' },
          { label: 'Pohodový rekreační lyžař', value: 'recreational', description: 'Měkčí konstrukce odpouštějící chyby při smýkání.' }
        ],
        defaultValue: 'sport',
        promptForgeTemplate: '- **Úroveň lyžaře & tuhost:** {value}',
      },
      {
        id: 'brand_preferences_q',
        step: 4,
        title: 'Preferované a zakázané značky lyží',
        subtitle: 'Uveďte výrobce, kterým důvěřujete (např. Atomic, Salomon, Head, Fischer, Völkl), a značky, které nechcete.',
        component: 'brands',
        isMultiSelect: false,
        defaultValue: { preferred: '', forbidden: '' },
        promptForgeTemplate: '- **Pravidla pro výrobce & značky:** {value}',
      }
    ],
    systemPrompt: `Jsi špičkový servisman, certifikovaný instruktor a technolog sjezdových lyží v systému bAIright.
Na základě zadaných parametrů doporuč přesně 3 konkrétní reálné modely lyží (např. Atomic Redster, Salomon S/Max, Head Worldcup Rebels, Fischer RC4, Völkl Deacon/Racetiger, Blizzard Brahma, Rossignol Hero).

Striktní pravidla pro hodnocení lyží:
1. Zohledni šířku pod patou: pro čistou pistu doporuč 68–73 mm, pro celodenní univerzál 75–82 mm.
2. Pokud uživatel vyžaduje sportovní vedení na ledu, trvej na dřevěném sendvičovém jádru vyztuženém alespoň jedním plátem Titanalu.
3. Pro rekreačního lyžaře nikdy nenabízej ostré FIS závodní modely bez rockeru, které by trestaly chyby.
4. U každého modelu uveď přesnou značku, modelové označení včetně vázání, rádius v doporučené délce, klíčové silné a slabé stránky a orientační cenu v Kč.`,
    suggestedAlternatives: [
      {
        id: 'skis_edge_tuning',
        name: 'Úhel broušení hran',
        category: 'Servis & Tuning',
        importance: 'preference',
        rationale: 'Ostrý závodní úhel 87° zařízne led jako žiletka, vyžaduje však častější broušení a bezchybnou techniku.',
        icon: '🔪',
        suggestedComponent: 'chips',
        suggestedValues: ['Sportovní úhel 88° (ideál pro české hory)', 'Závodní úhel 87°', 'Tovární standard 89°'],
      }
    ]
  },

  tv: {
    categoryName: 'Televize & Domácí Kino',
    agentName: 'Specialista na Televize & Displeje',
    icon: '📺',
    description: 'Technický nákupní poradce pro výběr televizí. Analyzuje technologie panelu (OLED vs. MiniLED), pozorovací vzdálenost, herní funkce 120Hz/HDMI 2.1 a audio propustnost.',
    keywords: ['tv', 'televize', 'televizor', 'oled', 'qled', 'miniled', 'smart tv', 'soundbar'],
    parameters: [
      {
        id: 'tv_display_technology',
        name: 'Technologie panelu',
        category: 'Obrazová technologie',
        importance: 'mandatory',
        rationale: 'Klíčové rozhodnutí pro kvalitu obrazu. OLED zaručuje nekonečný kontrast a nulový blooming ve tmě, zatímco MiniLED dosahuje extrémního jasu v prosvětlených místnostech bez rizika vypálení. Otázka pro vás: Sledujete televizi převážně večer za tmy (filmy), nebo ve dne ve světlém pokoji?',
        icon: '🖥️',
        suggestedComponent: 'chips',
        suggestedValues: [
          'OLED / QD-OLED (dokonalá černá a nekonečný kontrast pro večerní sledování)',
          'MiniLED s lokálním stmíváním (extrémní jas pro světlé obýváky)',
          'QLED / LED (cenově dostupný standard s vysokým jasem)'
        ],
      },
      {
        id: 'room_distance_dimensions',
        name: 'Úhlopříčka a vzdálenost',
        category: 'Rozměry & Ergonomie',
        importance: 'mandatory',
        rationale: 'Špatně zvolená úhlopříčka kazí zážitek – malá obrazovka nutí mhouřit oči a neužijete si 4K detaily, příliš velká na krátkou vzdálenost unavuje zrak. Otázka pro vás: Jaká je vaše přesná pozorovací vzdálenost od sedačky k televizi?',
        icon: '📐',
        suggestedComponent: 'chips',
        suggestedValues: ['55" úhlopříčka (pozorovací vzdálenost 1.8 až 2.2 metru)', '65" úhlopříčka (pozorovací vzdálenost 2.3 až 2.8 metru)', '75" až 85" úhlopříčka (pozorovací vzdálenost 2.9 metru a více)'],
      },
      {
        id: 'tv_refresh_rate_gaming',
        name: 'Frekvence displeje',
        category: 'Plynulost & Gaming',
        importance: 'mandatory',
        rationale: 'Základní 60Hz panel způsobuje trhání obrazu při rychlých sportovních přenosech (hokej, fotbal). Pro herní konzole PS5/Xbox je nutný nativní 120Hz panel s HDMI 2.1 a variabilní frekvencí VRR. Otázka pro vás: Plánujete na televizi hrát hry na konzoli / PC nebo sledovat rychlé sporty?',
        icon: '🎮',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Pravých 120 Hz / 144 Hz panel s HDMI 2.1 (plynulé sportovní přenosy a gaming na PS5/Xbox)',
          'Střední třída 100 Hz s dopočtem pohybu MEMC',
          'Základní 60 Hz panel (postačí pro běžné sledování TV vysílání)',
        ],
      },
      {
        id: 'tv_audio_passthrough',
        name: 'Audio a eARC',
        category: 'Zvuk & Konektivita',
        importance: 'recommended',
        rationale: 'Integrované reproduktory tenkých televizí postrádají basy a srozumitelnost dialogů. Port HDMI eARC umožňuje bezztrátový přenos Dolby Atmos přímo do soundbaru bez zpoždění zvuku. Otázka pro vás: Budete k TV připojovat externí soundbar nebo domácí kino?',
        icon: '🔊',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Podpora Dolby Atmos / DTS:X a HDMI eARC (připojení kvalitního soundbaru nebo domácího kina)',
          'Kvalitní integrované reproduktory se subwooferem',
          'Základní stereo zvuk (postačí pro sledování zpráv a seriálů)',
        ],
      },
      {
        id: 'tv_processor_upscaling',
        name: 'Obrazový procesor a AI',
        category: 'Zpracování obrazu',
        importance: 'recommended',
        rationale: 'Většina českého televizního vysílání je pouze v rozlišení 720p/1080i. Špičkový procesor (Sony Cognitive XR, LG Alpha, Samsung Neo) dokáže dopočítat čistý obraz bez šumu a rozmazání.',
        icon: '🧠',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Špičkový neuronový AI procesor (dokonalý upscaling staršího vysílání a redukce šumu)',
          'Kvalitní čtyřjádrový procesor s plynulým dopočtem snímků',
          'Standardní procesor (postačí pro sledování Netflixu a YouTube v nativním 4K)',
        ],
      },
      {
        id: 'tv_hdr_formats',
        name: 'Podpora HDR formátů',
        category: 'Kontrast & Barvy',
        importance: 'recommended',
        rationale: 'Dynamické HDR upravuje jas a barvy scénu po scéně podle senzoru okolního osvětlení v místnosti. Dolby Vision je standardem pro Netflix a Apple TV.',
        icon: '✨',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Plná podpora Dolby Vision IQ i HDR10+ (dynamické přizpůsobení jasu světlu v místnosti)',
          'Základní HDR10 a HLG pro běžné streamovací služby',
          'Standardní SDR/HDR bez specifických formátů',
        ],
      },
      {
        id: 'tv_smart_os',
        name: 'Chytrý systém OS',
        category: 'Systém & Aplikace',
        importance: 'recommended',
        rationale: 'Google TV nabízí nejširší podporu lokálních českých aplikací (Voyo, O2 TV, Kuki, Skylink, Lepší.TV) a Chromecast. webOS a Tizen jsou rychlé a jednoduché.',
        icon: '📱',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Google TV / Android TV (nejširší nabídka aplikací, KODI, O2 TV, Skylink)',
          'Rychlý a intuitivní systém LG webOS / Samsung Tizen',
          'Systém Apple AirPlay 2 a HomeKit integrace',
        ],
      },
      {
        id: 'tv_viewing_angles',
        name: 'Pozorovací úhly',
        category: 'Pozorovací úhly',
        importance: 'recommended',
        rationale: 'Levnější VA panely při pohledu z úhlu 30° a více ztrácejí kontrast a barvy šednou. OLED panely a MiniLED s širokoúhlou optickou vrstvou drží barvy z libovolného úhlu.',
        icon: '👀',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Široké pozorovací úhly bez blednutí barev (ideální pro rohovou sedačku a rodinu)',
          'Vysoký kontrast z přímého pohledu (postačí sezení přímo proti televizi)',
          'Antireflexní vrstva pro potlačení odlesků oken a lamp',
        ],
      },
      {
        id: 'tv_mount_construction',
        name: 'Montáž na zeď a stojan',
        category: 'Montáž & Design',
        importance: 'recommended',
        rationale: 'Televize se středovým podstavcem se vejdou i na úzký TV stolek, zatímco nožičky na krajích vyžadují stolek široký jako celá TV. Při montáži na zeď je klíčový tenký profil bez vyčnívající elektroniky.',
        icon: '🧱',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Ultra tenká montáž na zeď Slim Fit (televize přiléhá ke zdi jako obraz)',
          'Otočný kloubový držák na stěnu s nastavením sklonu',
          'Stabilní středový nebo nožičkový stojan na televizní stolek',
        ],
      },
      UNIVERSAL_BRAND_PARAMETER,
    ],
    questions: [
      {
        id: 'tv_q_tech',
        step: 1,
        title: 'V jakých světelných podmínkách a co budete na televizi nejvíce sledovat?',
        subtitle: 'Klíčové rozhodnutí pro volbu mezi technologií OLED a MiniLED.',
        component: 'chips',
        isMultiSelect: false,
        options: [
          { label: 'Večerní filmy a seriály v temnější místnosti (OLED)', value: 'oled', description: 'Perfektní černá, žádný svit kolem titulků, špičkový filmový zážitek.' },
          { label: 'Světlý obývací pokoj přes den a sport (MiniLED)', value: 'miniled', description: 'Extrémní jas, který přesvítí slunce, nulové riziko vypálení statického obrazu.' },
          { label: 'Hraní her na konzoli PS5 / Xbox (120 Hz VRR)', value: 'gaming', description: 'Plynulý obraz bez zpoždění s bleskovou odezvou a HDMI 2.1.' },
        ],
        defaultValue: 'oled',
        promptForgeTemplate: '- **Hlavní scénář využití TV:** {value}',
      },
    ],
    suggestedAlternatives: [
      {
        id: 'tv_antireflective',
        name: 'Antireflexní úprava',
        category: 'Komfort sledování',
        importance: 'preference',
        rationale: 'Matný povrch (jako u Samsung The Frame) absorbuje odrazy světla a zabraňuje tomu, aby televize fungovala jako zrcadlo ve světlém pokoji.',
        icon: '🛡️',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Špičkový matný antireflexní panel (žádné zrcadlení oken za jasného dne)',
          'Pololesklá úprava s filtrem odlesků',
          'Lesklý panel pro maximální hloubku a sytost černé barvy v zatemněné místnosti',
        ],
      },
    ],
    systemPrompt: `Jsi expertní technik televizní techniky a obrazové kalibrace.
Doporuč přesně 3 špičkové modely televizí dle zadané úhlopříčky, světelných podmínek, technologie panelu a rozpočtu. Respektuj pravidla pro značky.`,
  },

  vacuum: {
    categoryName: 'Vysavače & Úklidová Technika',
    agentName: 'Specialista na Vysavače & Robotický Úklid',
    icon: '🧹',
    description: 'Nezávislý nákupní rádce pro výběr vysavačů. Analyzuje konstrukční formát (robotický vs. tyčový vs. sáčkový), sací podtlak v kPa, HEPA filtraci a údržbu zvířecí srsti.',
    keywords: ['vysavac', 'vysavač', 'vysavace', 'vysavače', 'roboticky vysavac', 'tycovy vysavac', 'dyson', 'roborock', 'roomba'],
    parameters: [
      {
        id: 'vacuum_type_format',
        name: 'Typ vysavače',
        category: 'Kategorie & Konstrukce',
        importance: 'mandatory',
        rationale: 'Základní tržní zařazení. Robot uklízí denně sám, tyčový aku vysavač je okamžitě po ruce pro rychlý úklid drobků a schodů, sáčkový vysavač s kabelem má nepřekonatelný sací výkon a nejčistší vyprazdňování pro alergiky. Otázka pro vás: Hledáte autonomního robota, lehký tyčový aku vysavač, nebo silný klasický sáčkový stroj?',
        icon: '🧹',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Robotický vysavač s multifunkční mopovací a vyprazdňovací stanicí',
          'Tyčový akumulátorový vysavač pro rychlý a lehký každodenní úklid',
          'Klasický sáčkový vysavač s kabelem (maximální podtlak a filtrace)'
        ],
      },
      {
        id: 'household_ergonomics_health',
        name: 'Typ podlah a zvířecí srst',
        category: 'Ergonomie & Zdraví',
        importance: 'mandatory',
        rationale: 'Domácnosti se zvířaty vyžadují motorizovaný rotační kartáč proti namotávání chlupů. Alergici potřebují hermeticky utěsněný prachový sáček s HEPA H13, aby při vysypávání nevdechovali prach. Těžký tyčový vysavač (nad 3 kg v ruce) navíc namáhá zápěstí a rameno. Otázka pro vás: Máte v bytě chlupaté mazlíčky, alergiky a jaký podíl tvoří koberce?',
        icon: '🧬',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Tvrdé podlahy (vinyl, dlažba, parkety) bez zvířat',
          'Kombinace koberce + tvrdé podlahy + línající mazlíčci (pes / kočka)',
          'Silní alergici / astmatici v domácnosti (nutnost uzavřeného sáčku a HEPA filtru)'
        ],
      },
      {
        id: 'vacuum_suction_power',
        name: 'Sací výkon a podtlak',
        category: 'Sací výkon',
        importance: 'mandatory',
        rationale: 'Levné tyčové vysavače pouze zametají povrch koberce rotačním kartáčkem, ale jemný roztočový prach z hloubky vláken nevytáhnou. Pro hloubkové čištění je nutný skutečný podtlak alespoň 20–25 kPa. Otázka pro vás: Vyžadujete hloubkové čištění hustých koberců a matrací?',
        icon: '💨',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Maximální sací výkon 200+ AW / 25+ kPa (hloubkové čištění vysokých koberců a zvířecích chlupů)',
          'Střední sací výkon 140–180 AW (ideální pro kombinaci tvrdých podlah a kusových koberců)',
          'Úsporný výkon 100–120 AW (postačí na hladké plovoucí podlahy a dlažbu)',
        ],
      },
      {
        id: 'vacuum_filtration_hepa',
        name: 'Filtrace pro alergiky',
        category: 'Filtrace & Čistota vzduchu',
        importance: 'mandatory',
        rationale: 'Pokud šasi vysavače netěsní, mikroprach a alergeny unikají spárami kolem motoru zpět do vzduchu ještě před filtrem. Certifikovaná hermetická filtrace zachytí 99,97 % částic od velikosti 0,3 mikronu. Otázka pro vás: Trpí někdo v domácnosti alergií na roztoče či prach?',
        icon: '🛡️',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Certifikovaný HEPA H14 filtr s 99.99% účinností (zachytí roztoče, pyl a mikroprach)',
          'Omyvatelný HEPA filtr H12/H13 (vysoká ochrana pro běžnou domácnost)',
          'Vícevrstvý mikrofiltr s jednoduchou údržbou',
        ],
      },
      {
        id: 'vacuum_brush_antitangle',
        name: 'Kartáč proti vlasům',
        category: 'Hubice & Údržba',
        importance: 'recommended',
        rationale: 'Běžný rotační kartáč se po týdnu ucpe dlouhými vlasy a chlupy, které je nutné složitě odstřihávat nůžkami. Anti-tangle kuželové nebo hřebenové kartáče vlasy automaticky stahují přímo do sací trubice.',
        icon: '🪮',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Speciální kónický kartáč s automatickým nožem proti namotávání dlouhých vlasů a chlupů',
          'Měkký rotační válec z mikrovlákna šetrný k náchylným dřevěným podlahám',
          'Kombinovaná univerzální hubice pro koberce i tvrdé povrchy',
        ],
      },
      {
        id: 'vacuum_battery_runtime',
        name: 'Výdrž baterie',
        category: 'Baterie & Výdrž',
        importance: 'recommended',
        rationale: 'Integrovaná baterie po 3 letech degraduje a její servisní výměna je drahá. Výměnný click-in akumulátor prodlužuje životnost vysavače a umožní nepřetržitý úklid velkého domu.',
        icon: '🔋',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Dlouhá výdrž 60+ minut s vyměnitelnou baterií (úklid velkého rodinného domu)',
          'Výdrž 40–50 minut (ideální pro běžný byt 3+1)',
          'Výdrž do 30 minut (rychlý denní úklid drobků a kuchyně)',
        ],
      },
      {
        id: 'vacuum_cleaning_station',
        name: 'Samočisticí stanice',
        category: 'Autonomie & Hygiena',
        importance: 'recommended',
        rationale: 'U robotických vysavačů bez sušení mopovacích textilií začne vlhký hadr za 24 hodin silně zapáchat plísní. Stanice s horkovzdušným sušením zaručuje hygienický provoz po dobu několika týdnů bez zásahu.',
        icon: '🧰',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Multifunkční dokovací stanice (automatické odsátí prachu do sáčku a praní mopů)',
          'Kompaktní nabíjecí stanice s automatickým vyprázdněním prachové nádoby',
          'Klasická nástěnná nabíječka (manuální vysypávání nádoby do koše)',
        ],
      },
      {
        id: 'vacuum_navigation_sensors',
        name: 'Senzory a navigace',
        category: 'Navigace robotů',
        importance: 'recommended',
        rationale: 'Roboti bez 3D kamery se zamotávají do pohozených nabíjecích kabelů, ponožek a mohou rozmazat psí exkrementy po celém bytě. AI kamera s laserem překážky s předstihem objede.',
        icon: '👁️',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Přesná LiDAR navigace s 3D kamerou a AI rozpoznáváním kabelů a ponožek',
          'Laserová LiDAR navigace (spolehlivý úklid i v naprosté tmě)',
          'Gyroskopická navigace s infračervenými senzory pádu',
        ],
      },
      {
        id: 'vacuum_acoustic_comfort',
        name: 'Hlučnost vysavače',
        category: 'Komfort',
        importance: 'recommended',
        rationale: 'Hlučný vysavač děsí domácí mazlíčky a brání sledování televize či hovoru. Tichý chod motoru s tlumením vibrací umožňuje vysávání v kteroukoli denní dobu.',
        icon: '🔇',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Mimořádně tichý provoz pod 65 dB (neruší děti ani domácí mazlíčky)',
          'Standardní úroveň hluku 70–75 dB',
          'Výkonový režim bez ohledu na hlučnost',
        ],
      },
      UNIVERSAL_BRAND_PARAMETER,
    ],
    questions: [
      {
        id: 'vacuum_q_type',
        step: 1,
        title: 'Jaký typ vysavače a způsob úklidu preferujete?',
        subtitle: 'Klíčová volba formátu určující pohodlí a míru vaší práce.',
        component: 'chips',
        isMultiSelect: false,
        options: [
          { label: 'Robotický vysavač se samočisticí stanicí (plná autonomie)', value: 'robot', description: 'Denně vysává i vytírá bez vaší asistence, stanice sama pere mop i odsává prach.' },
          { label: 'Tyčový akumulátorový vysavač (rychlý ruční úklid)', value: 'stick', description: 'Lehký a okamžitě připravený k úklidu podlah, schodů, sedačky i auta.' },
          { label: 'Klasický sáčkový vysavač s kabelem (maximální výkon pro alergiky)', value: 'bagged', description: 'Obrovský sací podtlak, nulový kontakt s prachem a nejdelší životnost.' },
        ],
        defaultValue: 'stick',
        promptForgeTemplate: '- **Požadovaný typ vysavače:** {value}',
      },
    ],
    suggestedAlternatives: [
      {
        id: 'vacuum_illuminated_nozzle',
        name: 'LED osvětlení hubice',
        category: 'Efektivita úklidu',
        importance: 'preference',
        rationale: 'Speciální zelené laserové nebo LED světlo nasvítí podlahu pod úhlem a zviditelní mikroskopický prach, který je pouhým okem neviditelný.',
        icon: '🔦',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Zelené laserové / širokoúhlé LED osvětlení hubice (odhalí i neviditelný mikroskopický prach)',
          'Standardní bílé LED přisvícení pro úklid pod gaučem a postelí',
          'Bez osvětlení hubice',
        ],
      },
    ],
    systemPrompt: `Jsi nezávislý specialista na úklidovou a vysávací techniku.
Doporuč přesně 3 konkrétní modely vysavačů dle zvoleného formátu, dispozic domácnosti (zvířata, koberce, alergici) a rozpočtu. Respektuj pravidla pro značky.`,
  },

  smartphones: {
    categoryName: 'Chytré Telefony & Mobilní Technologie',
    agentName: 'Specialista na Chytré Telefony & Mobilní Ekosystémy',
    icon: '📱',
    description: 'Nezávislý nákupní poradce pro výběr chytrých telefonů. Analyzuje velikost snímače fotoaparátu (OIS), délku softwarové podpory, ochranu zraku PWM a výdrž baterie.',
    keywords: ['mobil', 'mobilni telefon', 'smartphone', 'telefon', 'iphone', 'samsung', 'pixel', 'xiaomi', 'android'],
    parameters: [
      {
        id: 'phone_form_factor_ecosystem',
        name: 'Formát a systém',
        category: 'Kategorie & Ekosystém',
        importance: 'mandatory',
        rationale: 'Základní tržní zařazení. Kompaktní telefony se vejdou do kapsy a ovládají se jednou rukou, velké displeje jsou skvělé na práci a média, ohebné telefony nabízejí unikátní konstrukci. Otázka pro vás: Preferujete kompaktní telefon, velký displej nebo ohebný model a jaký systém používáte?',
        icon: '📱',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Kompaktní vlajková loď do 6.2" (snadné ovládání jednou rukou)',
          'Velký multimediální displej 6.7"+ (práce, videa, fotky a hry)',
          'Ohebný smartphone (Flip do kapsy nebo rozkládací Fold tablet)',
          'Ekosystém Apple iOS (iPhone s návazností na Mac / Apple Watch)',
          'Ekosystém Android (Google Pixel, Samsung Galaxy, Xiaomi)',
        ],
      },
      {
        id: 'phone_display_pwm',
        name: 'Displej a zrak',
        category: 'Ergonomie & Zrak',
        importance: 'mandatory',
        rationale: 'Mnoho moderních OLED displejů bliká na nízké frekvenci (PWM 240–480 Hz), což u citlivých uživatelů způsobuje pálení očí, únavu a migrény. Vysokofrekvenční PWM (nad 1920 Hz) chrání zrak. Telefony nad 220 g hmotnosti unavují malíček při dlouhém držení — důležité pro lidi s menšíma rukama. Otázka pro vás: Býváte citliví na bolesti očí nebo unavené ruce při čtení z mobilu za šera?',
        icon: '👁️',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Šetrný displej s vysokofrekvenčním PWM (nad 1920 Hz / DC dimming proti únavě očí)',
          'Lehká ergonomická konstrukce pod 190 g (pohodlné držení bez namáhání ruky)',
          'Vysoký jas na slunci (1500+ nitů pro perfektní čitelnost za přímého světla)',
          'Standardní kvalitní OLED displej (bez specifických požadavků na stmívání)',
        ],
      },
      {
        id: 'phone_camera_sensor',
        name: 'Fotoaparát',
        category: 'Fotoaparát',
        importance: 'mandatory',
        rationale: 'Počet megapixelů je marketingový trik. O reálné kvalitě fotek rozhoduje fyzická velikost snímače (1 palec nebo velký 1/1.3" senzor) a optická stabilizace OIS, která zabrání rozmazání snímků dětí a pohybu za šera. Otázka pro vás: Fotíte často v interiéru, večer a v horším osvětlení bez blesku?',
        icon: '📸',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Absolutní fotomobil s 1" snímačem (velký senzor, OIS, RAW a špičkové noční fotky)',
          'Pokročilý fotoaparát s OIS (stabilizované momentky dětí v pohybu a rodinná videa)',
          'Běžný spolehlivý fotoaparát (postačí ostré denní fotky, dokumenty a momentky)',
          'Zaměření na video a vlogging (4K/60fps HDR, plynulá stabilizace a čistý zvuk)',
        ],
      },
      {
        id: 'phone_os_support',
        name: 'Podpora a aktualizace',
        category: 'Životnost & Bezpečnost',
        importance: 'mandatory',
        rationale: 'Telefon bez bezpečnostních záplat je zranitelný při bankovních transakcích a po 2 letech na něj přestanou vycházet aplikace. Výrobci jako Google Pixel, Samsung a Apple garantují 7 let plných aktualizací. Otázka pro vás: Plánujete telefon používat 4 a více let?',
        icon: '🛡️',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Dlouhodobá podpora 5–7 let (Apple, Google Pixel, Samsung Galaxy – investice na dlouho)',
          'Střední podpora 3–4 roky (běžná vyšší střední třída s pravidelnými záplatami)',
          'Základní podpora 2 roky (telefon plánuji po 2 letech obměnit za nový)',
        ],
      },
      {
        id: 'phone_battery_charging',
        name: 'Baterie a nabíjení',
        category: 'Baterie & Nabíjení',
        importance: 'recommended',
        rationale: 'Rychlé 65W+ nabíjení doplní energii z 0 na 80 % za 20 minut, zatímco pomalé nabíjení trvá hodinu a půl. Standard Qi2 přináší magnetické bezdrátové nabíjení v autě i na nočním stolku. Otázka pro vás: Potřebujete celodenní intenzivní výdrž a rychlé doplnění energie během ranní hygieny?',
        icon: '⚡',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Bleskové nabíjení 65W+ a bezdrátové Qi (nabito za 20 minut a bezdrátové podložky)',
          'Maximální výdrž baterie 5000+ mAh (s jistotou zvládne 1,5 až 2 dny provozu)',
          'Vyvážená celodenní výdrž s běžným nočním nabíjením (25–30W)',
          'Podpora reverzního bezdrátového nabíjení (pro dobití hodinek či sluchátek na cestách)',
        ],
      },
      {
        id: 'phone_display_refresh',
        name: 'Plynulost displeje',
        category: 'Displej',
        importance: 'recommended',
        rationale: 'Panel s adaptivní frekvencí 1–120 Hz nabízí dokonale plynulé scrollování a čtení textu bez trhání a při statickém textu sníží frekvenci na 1 Hz, což radikálně šetří baterii.',
        icon: '✨',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Adaptivní LTPO 1–120 Hz (dokonalá plynulost s automatickou úsporou baterie)',
          'Rychlý 90Hz / 120Hz displej bez LTPO (plynulý obraz za dostupnější cenu)',
          'Standardní 60Hz panel (postačí na běžné čtení a messaging)',
        ],
      },
      {
        id: 'phone_resistance_ip68',
        name: 'Odolnost a voděodolnost',
        category: 'Odolnost',
        importance: 'recommended',
        rationale: 'Certifikace IP68 zaručuje přežití telefonu při náhodném pádu do vany, louže či bazénu a chrání proti vniknutí jemného prachu do konektorů.',
        icon: '💧',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Plná vodotěsnost IP68 (odolá ponoření do vody, silnému dešti i pádu do vany)',
          'Základní odolnost IP54 (ochrana proti stříkající vodě a mírnému dešti)',
          'Zvýšená mechanická odolnost (odolné tělo nebo prémiové sklo Gorilla Armor)',
          'Běžná odolnost (telefon budu chránit vlastním ochranným pouzdrem)',
        ],
      },
      {
        id: 'phone_storage_ram',
        name: 'Úložiště a paměť',
        category: 'Paměť & Výkon',
        importance: 'recommended',
        rationale: 'Základní 128GB úložiště se při natáčení 4K rodinných videí a ukládání fotek zaplní během prvního roku a telefon začne hlásit nedostatek místa. Paměťové karty už většina vlajkových lodí nepodporuje.',
        icon: '💾',
        suggestedComponent: 'chips',
        suggestedValues: [
          '256 GB úložiště + 8–12 GB RAM (optimální zlatý střed s rezervou na roky)',
          '512 GB nebo 1 TB (velká kapacita pro 4K/8K videa, RAW fotky a offline aplikace)',
          '128 GB interní paměť (postačí při ukládání fotek a videí do cloudu)',
        ],
      },
      {
        id: 'phone_telephoto_zoom',
        name: 'Teleobjektiv a zoom',
        category: 'Fotoaparát & Zoom',
        importance: 'recommended',
        rationale: 'Digitální výřez z hlavního snímače zrní a maže detaily. Fyzický periskopický teleobjektiv přiblíží vzdálené objekty, sport a portréty s přirozeně rozostřeným pozadím.',
        icon: '🔭',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Periskopický teleobjektiv 5x až 10x optický zoom (vzdálené detaily a sport)',
          'Portrétní teleobjektiv 2x až 3x zoom (přirozené proporce tváře bez rybího oka)',
          'Bez optického teleobjektivu (postačí mi širokoúhlý a hlavní fotoaparát)',
        ],
      },
      UNIVERSAL_BRAND_PARAMETER,
    ],
    questions: [
      {
        id: 'phone_q_priority',
        step: 1,
        title: 'Jaká je vaše hlavní priorita u nového telefonu a jaký systém preferujete?',
        subtitle: 'Klíčové rozhodnutí pro zúžení výběru mezi iOS a Androidem a velikostí displeje.',
        component: 'chips',
        isMultiSelect: false,
        options: [
          { label: 'Špičkový fotoaparát a video na úrovni zrcadlovky', value: 'camera', description: 'Velký snímač s OIS, optický zoom a věrné podání barev i v noci.' },
          { label: 'Kompaktní rozměry do jedné ruky s vysokým výkonem', value: 'compact', description: 'Úhlopříčka do 6.2", lehká váha a pohodlí v kapse.' },
          { label: 'Maximální výdrž baterie a spolehlivost na mnoho let', value: 'battery_longevity', description: 'Velká 5000+ mAh baterie, rychlé nabíjení a 7letá softwarová podpora.' },
        ],
        defaultValue: 'camera',
        promptForgeTemplate: '- **Hlavní priorita u smartphonu:** {value}',
      },
    ],
    suggestedAlternatives: [
      {
        id: 'phone_esim_dual',
        name: 'Podpora eSIM',
        category: 'Konektivita',
        importance: 'preference',
        rationale: 'eSIM umožňuje bleskové nahrání datového tarifu přes aplikaci při cestách mimo EU bez nutnosti kupovat fyzickou plastovou kartu na letišti.',
        icon: '📶',
        suggestedComponent: 'chips',
        suggestedValues: ['Plná podpora eSIM (rychlé nahrání zahraničních datových tarifů online)', 'Kombinace Dual SIM (fyzická nanoSIM karta + druhá volitelná eSIM)', 'Pouze klasická fyzická nanoSIM karta'],
      },
    ],
    systemPrompt: `Jsi nezávislý analytik mobilních technologií a chytrých telefonů.
Doporuč přesně 3 konkrétní modely smartphonů dle zadaných priorit, preferovaného ekosystému, kvality fotoaparátu a rozpočtu. Respektuj pravidla pro značky.`,
  },

  washing_machines: {
    categoryName: 'Pračky & Péče o Prádlo',
    agentName: 'Specialista na Pračky & Bílou Techniku',
    icon: '🧺',
    description: 'Technický nákupní poradce pro výběr praček. Analyzuje konstrukční formát (předem vs. vrchem plněná), DirectDrive invertor, rozebíratelnost ložisek a parní cykly.',
    keywords: ['pracka', 'pračka', 'pracky', 'pračky', 'pracka se susickou', 'miele', 'bosch', 'aeg', 'lg'],
    parameters: [
      {
        id: 'washer_construction_format',
        name: 'Rozměry a typ plnění',
        category: 'Kategorie & Konstrukce',
        importance: 'mandatory',
        rationale: 'Základní tržní zařazení. Standardní pračka nabízí největší buben a stabilitu při odstřeďování. Slim pračka se vejde do úzké koupelny, vrchem plněná šetří místo do šířky (pouze 40 cm) a pračka se sušičkou 2v1 vyřeší sušení tam, kde není prostor na dva spotřebiče. Otázka pro vás: Jaké máte prostorové dispozice v koupelně a jaký formát plnění preferujete?',
        icon: '🧺',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Předem plněná standardní hloubka 60 cm (maximální kapacita a stabilita)',
          'Slim předem plněná hloubka 40–45 cm do menších koupelen',
          'Vrchem plněná pračka (šířka pouze 40 cm pro velmi úzké prostory)',
          'Kombinovaná pračka se sušičkou 2v1 (řešení nedostatku místa na dva stroje)'
        ],
      },
      {
        id: 'household_capacity_biometrics',
        name: 'Kapacita bubnu',
        category: 'Kapacita & Domácnost',
        importance: 'mandatory',
        rationale: 'Přeplňování malého bubnu způsobuje nedostatečné vymáchání pracího prášku a nadměrné opotřebení tlumičů. Buben o kapacitě 9+ kg bez problémů pojme objemné zimní deky, péřové bundy a ložní prádlo celé rodiny. Otázka pro vás: Kolik osob žije v domácnosti a perete často objemné deky či bundy?',
        icon: '👨‍👩‍👧‍👦',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Velká kapacita 9–10 kg (ideální pro 4+ člennou rodinu, deky a ložní prádlo)',
          'Standardní kapacita 7–8 kg (optimální pro běžnou 2–3 člennou domácnost)',
          'Kompaktní kapacita 5–6 kg (pro jednotlivce či pár v menším bytě)',
        ],
      },
      {
        id: 'washer_motor_type',
        name: 'Typ motoru',
        category: 'Motor & Pohon',
        importance: 'mandatory',
        rationale: 'Tradiční motory s uhlíkovými kartáči pískají, jiskří a po 5 letech vyžadují servis. Bezkartáčový invertorový motor s přímým napojením na buben (Direct Drive) je mimořádně tichý, nepřenáší vibrace klínového řemenu a výrobci na něj poskytují záruku 10–20 let.',
        icon: '⚙️',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Direct Drive s přímým pohonem na ose bubnu (minimální vibrace, ticho a dlouhá životnost)',
          'Klasický invertorový motor s řemenem (tichý chod a nízká spotřeba)',
          'Tradiční motor s uhlíky (cenově dostupnější řešení)',
        ],
      },
      {
        id: 'washer_drum_bearings',
        name: 'Opravitelnost ložisek',
        category: 'Servisovatelnost & Životnost',
        importance: 'mandatory',
        rationale: 'U mnoha levných praček je plastová vana svařená v celku. Když po 4–6 letech odejde ložisko za 300 Kč, nelze jej samostatně vyměnit a oprava celé vany stojí 8 000 Kč (fakticky konec životnosti pračky). Šroubovaná vana umožňuje levnou výměnu ložisek. Otázka pro vás: Hledáte spotřebič s důrazem na dlouhou životnost a snadnou opravitelnost?',
        icon: '🔧',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Rozebíratelná vana se šroubovanými ložisky (možnost levné výměny ložisek i po 8 letech)',
          'Prémiová nerezová vana s prodlouženou zárukou (např. Miele)',
          'Běžná svařovaná plastová vana (oprava po záruce se řeší výměnou celého bubnu)',
        ],
      },
      {
        id: 'washer_steam_allergy',
        name: 'Parní cyklus pro alergiky',
        category: 'Hygiena & Zdraví',
        importance: 'recommended',
        rationale: 'Parní program pronikne hluboko do textilních vláken, zničí 99,9 % roztočů a bakterií a odstraní zvířecí alergeny i při nižší teplotě vody, což chrání citlivou dětskou pokožku i alergiky.',
        icon: '💨',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Parní program SteamCare s certifikací pro alergiky (odstraní 99.9 % bakterií a roztočů)',
          'Parní osvěžení pro vyhlazení záhybů bez nutnosti žehlení',
          'Tradiční praní bez parních funkcí',
        ],
      },
      {
        id: 'washer_acoustic_comfort',
        name: 'Hlučnost odstřeďování',
        category: 'Akustický komfort',
        importance: 'recommended',
        rationale: 'Hlučné ždímání nad 76 dB roztřese celou koupelnu a znemožňuje noční praní při levném nočním proudu. Zesílené boční stěny AntiVibration a tichý podvozek udrží hluk pod 70 dB.',
        icon: '🔇',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Extrémně tichý provoz při odstřeďování pod 70 dB (vhodné pro noční praní v paneláku)',
          'Standardní hlučnost 72–75 dB s antivibračními prolisy bočnic',
          'Běžná hlučnost nad 76 dB (umístění v technické místnosti či suterénu)',
        ],
      },
      {
        id: 'washer_spin_speed',
        name: 'Otáčky odstřeďování',
        category: 'Odstřeďování',
        importance: 'recommended',
        rationale: 'Pokud prádlo po vyprání dáváte do sušičky, pračka s 1400–1600 ot./min zkrátí dobu sušení až o třetinu, čímž zásadně ušetří drahou elektřinu sušičky.',
        icon: '🌀',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Vysoké otáčky 1400–1600 ot./min (prádlo schne mnohem rychleji v sušičce)',
          'Standardní otáčky 1200 ot./min (šetrné k bavlně i syntetice)',
          'Šetrné odstřeďování 1000 ot./min pro jemné tkaniny',
        ],
      },
      {
        id: 'washer_water_protection',
        name: 'Ochrana proti vytopení',
        category: 'Bezpečnost',
        importance: 'recommended',
        rationale: 'Při prasknutí přívodní hadice mechanický nebo elektromagnetický ventil AquaStop okamžitě uzavře přívod vody přímo na kohoutu a zabrání vytopení sousedů.',
        icon: '🛑',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Kompletní ochrana AquaStop s dvojitou hadicí a plovákem (garance proti vytopení sousedů)',
          'Vícenásobná ochrana proti úniku vody',
          'Základní bezpečnostní hadice',
        ],
      },
      {
        id: 'washer_energy_efficiency',
        name: 'Dávkování pracího gelu',
        category: 'Úspora & Provoz',
        importance: 'recommended',
        rationale: 'Automatické dávkování odměří přesné množství pracího gelu podle váhy prádla a tvrdosti vody, což ušetří až 30 % pracího prostředku a zabrání zbytkům mýdla v prádle.',
        icon: '💧',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Plně automatické dávkování tekutého pracího gelu i-DOS / TwinDos (až na 20 praní)',
          'Zásobník na prací kapsle a manuální dávkování gelu',
          'Tradiční manuální zásuvka na prášek',
        ],
      },
      UNIVERSAL_BRAND_PARAMETER,
    ],
    questions: [
      {
        id: 'washer_q_space',
        step: 1,
        title: 'Jaký rozměrový formát a kapacitu pračky potřebujete?',
        subtitle: 'Zásadní parametr pro stavební umístění do koupelny a potřeby rodiny.',
        component: 'chips',
        isMultiSelect: false,
        options: [
          { label: 'Standardní předem plněná pračka (hloubka 60 cm, 8–10 kg)', value: 'standard_front', description: 'Maximální stabilita, velký buben a možnost postavit sušičku do věže.' },
          { label: 'Úzká Slim pračka do menší koupelny (hloubka 40–45 cm)', value: 'slim', description: 'Ušetří cenné centimetry průchodu v menších panelákových koupelnách.' },
          { label: 'Kombinovaná pračka se sušičkou 2v1', value: 'washer_dryer', description: 'Vyprané prádlo rovnou usuší v jednom bubnu bez nutnosti věšení.' },
        ],
        defaultValue: 'standard_front',
        promptForgeTemplate: '- **Konstrukční formát pračky:** {value}',
      },
    ],
    suggestedAlternatives: [
      {
        id: 'washer_add_item',
        name: 'Dvířka pro přidání prádla',
        category: 'Pohodlí',
        importance: 'preference',
        rationale: 'Umožňuje bezpečně vhodit zapomenutou ponožku nebo tričko i po spuštění pracího cyklu bez vypouštění vody.',
        icon: '🚪',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Samostatná dvířka AddWash pro přidání zapomenutého prádla během praní',
          'Elektronická funkce pauzy s možností otevření hlavních dvířek',
          'Bez požadavku na přidávání prádla po spuštění cyklu',
        ],
      },
    ],
    systemPrompt: `Jsi špičkový servisní technik bílé techniky a specialista na pračky.
Doporuč přesně 3 spolehlivé modely praček dle rozměrového formátu, kapacity rodiny, servisní opravitelnosti a rozpočtu. Respektuj pravidla pro značky.`,
  },

  smartwatch: {
    categoryName: 'Chytré & Sportovní Hodinky',
    agentName: 'Specialista na Sporttestery & Chytré Hodinky',
    icon: '⌚',
    description: 'Nezávislý nákupní poradce pro chytré a sportovní hodinky. Analyzuje segment (sporttester s tlačítky vs. městské s LTE), obvod zápěstí, výdrž baterie a přesnost GPS.',
    keywords: ['hodinky', 'smartwatch', 'chytre hodinky', 'chytré hodinky', 'sporttester', 'garmin', 'apple watch', 'coros', 'polar', 'suunto'],
    parameters: [
      {
        id: 'watch_category_segment',
        name: 'Typ a zaměření hodinek',
        category: 'Kategorie & Segment',
        importance: 'mandatory',
        rationale: 'Základní tržní zařazení. Sporttestery (Garmin, Coros) se ovládají spolehlivými tlačítky za deště i v rukavicích a mají výdrž v týdnech. Městské hodinky (Apple Watch, Samsung Galaxy Watch) mají dotykový displej, umožňují telefonovat a odpovídat na zprávy, ale nabíjí se denně. Outdoorové modely snesou nárazy a mráz. Otázka pro vás: Hledáte tréninkový sporttester pro sport a hory, nebo městské hodinky jako prodlouženou ruku telefonu?',
        icon: '⌚',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Sportovní tréninkový sporttester s mechanickými tlačítky a výdrží 7–20+ dní (Garmin / Coros)',
          'Chytré městské hodinky s voláním, odpovídáním na zprávy a LTE (Apple Watch / Galaxy Watch)',
          'Odolné expediční outdoorové hodinky s vojenskou certifikací'
        ],
      },
      {
        id: 'wrist_biometrics_fit',
        name: 'Velikost pouzdra',
        category: 'Biometrie & Ergonomie',
        importance: 'mandatory',
        rationale: 'Příliš velká a těžká luneta (nad 75 g) tlačí do zápěstní kosti, odstává od kůže (což zkresluje měření tepu) a vadí při spánku, takže si nezměříte noční regeneraci. Na štíhlé zápěstí patří pouzdro 40–42 mm. Otázka pro vás: Jaký je obvod vašeho zápěstí a vadí vám těžké hodinky při spaní?',
        icon: '🧬',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Štíhlé zápěstí (dámská/unisex velikost pouzdra 40–43 mm, lehká váha do 45 g)',
          'Střední až robustní zápěstí (velikost pouzdra 45–47 mm)',
          'Robustní pánské zápěstí (velikost 50–51 mm s velkým displejem a baterií)'
        ],
      },
      {
        id: 'watch_battery_runtime',
        name: 'Výdrž baterie',
        category: 'Baterie & Výdrž',
        importance: 'mandatory',
        rationale: 'Denní nabíjení hodinek je pro sportovce a outdoorové nadšence dealbreakerem, zejména na vícedenních túrách nebo při nepřetržitém sledování spánku a regenerace HRV. Otázka pro vás: Požadujete výdrž baterie v týdnech, nebo jste ochotni hodinky nabíjet každý den?',
        icon: '🔋',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Extrémní výdrž 14–30 dní (outdoorové a sportovní modely Garmin, Coros)',
          'Týdenní výdrž 5–10 dní (vyvážené chytré hodinky Huawei, Amazfit)',
          'Jednodenní až dvoudenní výdrž s bohatým systémem aplikací (Apple Watch, Samsung Galaxy Watch)',
        ],
      },
      {
        id: 'watch_gps_multiband',
        name: 'Přesnost GPS',
        category: 'GPS & Navigace',
        importance: 'mandatory',
        rationale: 'Jednofrekvenční GPS v hlubokém lese, mezi skalami nebo městskými výškovými budovami uskakuje o desítky metrů a zkresluje tempo běhu. Dvoufrekvenční Multi-Band čip drží přesnou stopu s odchylkou do 1 metru.',
        icon: '🛰️',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Dvoufrekvenční Multi-Band GPS L1+L5 (maximální přesnost v hustém lese, horách i mezi budovami)',
          'Standardní multi-GNSS systém (GPS, GLONASS, Galileo pro běh v parku)',
          'Základní GPS s optimalizací na co nejdelší výdrž baterie',
        ],
      },
      {
        id: 'watch_display_technology',
        name: 'Technologie displeje',
        category: 'Displej',
        importance: 'recommended',
        rationale: 'Transflektivní MIP displej využívá okolní sluneční světlo – čím více slunce svítí, tím lépe je vidět, a nespotřebovává téměř žádnou energii. AMOLED je krásný a zářivý jako telefon, ale na přímém slunci vyžaduje maximální jas a vybíjí baterii.',
        icon: '☀️',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Zářivý AMOLED displej s vysokým jasem a živými barvami',
          'Transflektivní Memory-in-Pixel (MIP) displej (dokonalá čitelnost na přímém slunci s minimální spotřebou)',
          'Úsporný pasivní displej s analogovými ručičkami (hybridní hodinky)',
        ],
      },
      {
        id: 'watch_sensors_health',
        name: 'Zdravotní senzory a HRV',
        category: 'Zdravotní senzory',
        importance: 'recommended',
        rationale: 'Noční variabilita srdečního tepu (HRV status) je nejlepším ukazatelem regenerace těla, blížící se nemoci a připravenosti k tréninku. Spolehlivý senzor tepu eliminuje nutnost hrudního pásu při běžném běhu.',
        icon: '❤️',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Kompletní zdravotní diagnostika: EKG, krevní tlak, HRV status a noční monitoring spánku',
          'Standardní měření tepu, okysličení krve SpO2 a celodenní kroky',
          'Základní sportovní tracker se záznamem kalorií a tepu',
        ],
      },
      {
        id: 'watch_glass_sapphire',
        name: 'Safírové sklíčko a luneta',
        category: 'Odolnost & Materiály',
        importance: 'recommended',
        rationale: 'Minerální sklo se při náhodném škrtnutí o skálu, omítku nebo kovové zábradlí okamžitě poškrábe. Safírové sklo nelze poškrábat prakticky ničím kromě diamantu.',
        icon: '💎',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Nezničitelné safírové sklíčko s titanovou lunetou (odolné proti poškrábání o skálu a klíče)',
          'Odolné tvrzené sklo Gorilla Glass s hliníkovým pouzdrem',
          'Standardní minerální sklíčko s ochrannou fólií',
        ],
      },
      {
        id: 'watch_water_resistance',
        name: 'Vodotěsnost a plavání',
        category: 'Vodotěsnost',
        importance: 'recommended',
        rationale: 'Hodinky s 5 ATM snesou klidné plavání na hladině, ale skoky do vody či vodní sporty mohou způsobit dynamický tlak a průsak vody. Pro jistotu na divoké vodě a potápění je nutné 10 ATM.',
        icon: '🏊',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Vodotěsnost 10 ATM / 100 m s potápěčským hloubkoměrem (vhodné pro plavání i potápění)',
          'Standardní vodotěsnost 5 ATM / 50 m (sprchování a rekreační plavání v bazénu)',
          'Základní odolnost proti stříkající vodě a potu IP68',
        ],
      },
      {
        id: 'watch_smart_connectivity',
        name: 'Placení a offline mapy',
        category: 'Chytré funkce',
        importance: 'recommended',
        rationale: 'Plnohodnotné offline topografické mapy v hodinkách umožňují navigaci na křižovatkách v horách bez nutnosti vytahovat telefon z batohu.',
        icon: '🗺️',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Plná nezávislost s LTE eSIM (volání a poslech hudby bez telefonu v kapse)',
          'Bezkontaktní placení hodinkami (Garmin Pay, Apple Pay, Google Pay) a offline mapy',
          'Základní bluetooth zrcadlení notifikací z telefonu',
        ],
      },
      UNIVERSAL_BRAND_PARAMETER,
    ],
    questions: [
      {
        id: 'watch_q_use',
        step: 1,
        title: 'K čemu budete hodinky primárně používat a co je pro vás důležitější?',
        subtitle: 'Zásadní rozdělení mezi sportovním sporttesterem a chytrými hodinkami k telefonu.',
        component: 'chips',
        isMultiSelect: false,
        options: [
          { label: 'Trénink, běh, hory a regenerace (důraz na výdrž v týdnech a tlačítka)', value: 'sports', description: 'Odolnost, spolehlivé ovládání tlačítky a výdrž 7–20+ dní bez nabíječky.' },
          { label: 'Prodloužená ruka smartphonu (volání, notifikace, rychlé odpovědi)', value: 'smart', description: 'Zářivý AMOLED displej, možnost telefonovat a odepisovat na zprávy.' },
        ],
        defaultValue: 'sports',
        promptForgeTemplate: '- **Hlavní účel hodinek:** {value}',
      },
    ],
    suggestedAlternatives: [
      {
        id: 'watch_solar_charging',
        name: 'Solární dobíjení',
        category: 'Baterie',
        importance: 'preference',
        rationale: 'Integrovaný fotovoltaický prstenec v lunetě prodlužuje výdrž baterie při venkovních aktivitách za slunečného počasí.',
        icon: '☀️',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Integrované solární dobíjení Power Glass (prodloužení výdrže při pobytu na slunci)',
          'Výhradně kabelové / magnetické nabíjení',
          'Bezdrátové nabíjení standardem Qi',
        ],
      },
    ],
    systemPrompt: `Jsi špičkový sportovní fyziolog a odborník na sporttestery a chytré hodinky.
Doporuč přesně 3 konkrétní modely hodinek dle zadaného zaměření (sport vs. lifestyle), obvodu zápěstí, požadované výdrže a rozpočtu. Respektuj pravidla pro značky.`,
  },

  mattress: {
    categoryName: 'Matrace & Zdravý Spánek',
    agentName: 'Ortopedický Specialista na Spánek & Matrace',
    icon: '🛏️',
    description: 'Nezávislý nákupní rádce pro výběr ortopedických matrací. Analyzuje hmotnost spáče, technologii jádra (taštičky vs. HR pěna vs. latex), tuhost H1-H5 a zonaci páteře.',
    keywords: ['matrace', 'matraci', 'spanek', 'spánek', 'postel', 'rost', 'rošt', 'ortopedicka matrace', 'pater', 'plotenky'],
    parameters: [
      {
        id: 'mattress_user_biometrics_health',
        name: 'Hmotnost a stav páteře',
        category: 'Biometrie & Zdravotní profil',
        importance: 'mandatory',
        rationale: 'Hmotnost spáče je nejdůležitějším parametrem pro volbu tuhosti (při 95 kg na měkké matraci se páteř prohne do luku). Lidé po operaci ploténky či s chronickou bolestí beder vyžadují zpevněnou bederní oporu a zónování, které drží páteř v absolutní rovině. Otázka pro vás: Jaká je vaše přesná váha, výška a máte potíže s bolestmi páteře či kloubů?',
        icon: '🧬',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Hmotnost do 75 kg (potřeba poddajnější matrace pro zanoření ramen)',
          'Hmotnost 75–95 kg (střední tuhost se stabilní oporou)',
          'Hmotnost 95+ kg (zvýšená nosnost jádra a vyšší objemová hmotnost pěn)',
          'Zdravotní potíže s páteří (výhřez ploténky / operace zad / skolióza)'
        ],
      },
      {
        id: 'mattress_core_technology',
        name: 'Typ jádra matrace',
        category: 'Jádro & Materiál',
        importance: 'mandatory',
        rationale: 'Základní tržní zařazení. Taštičkové pružiny poskytují dokonalou bodovou elasticitu a jsou bezkonkurenčně nejprodyšnější (vhodné pro lidi, kteří se potí). Studená HR pěna s otevřenou buněčnou strukturou je tvarově stálá a tichá. Přírodní latex nabízí luxusní pružnost a je přirozeně antibakteriální. Otázka pro vás: Preferujete prodyšné taštičkové pružiny, nebo celopěnové ortopedické jádro?',
        icon: '🛏️',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Taštičkové pružiny s mikropružinami (špičková prodyšnost a bodová podpora)',
          'Studená HR pěna vysoké hustoty (minimálně 45–50 kg/m³)',
          'Přírodní latex s vysokým podílem kaučuku (luxusní poddajnost a antialergenní vlastnosti)'
        ],
      },
      {
        id: 'mattress_firmness_h1_h5',
        name: 'Tuhost matrace',
        category: 'Tuhost matrace',
        importance: 'mandatory',
        rationale: 'Příliš měkká matrace způsobuje prohnutí páteře do tvaru písmene U a ranní ztuhlost beder. Příliš tvrdá matrace tlačí na kyčle a ramena a omezuje krevní oběh.',
        icon: '⚖️',
        suggestedComponent: 'chips',
        suggestedValues: ['H2 měkká (do 70 kg nebo pro spaní na boku)', 'H3 středně tuhá (70–95 kg, univerzální ortopedická volba)', 'H4 tuhá (95–125 kg nebo pro spaní na zádech/břiše)'],
      },
      {
        id: 'mattress_zones_support',
        name: 'Anatomické zóny',
        category: 'Ergonomie páteře',
        importance: 'mandatory',
        rationale: 'Lidské tělo nemá tvar válce. Změkčená ramenní zóna umožní zanoření ramene při spánku na boku, zatímco pevná bederní zóna podepře těžkou pánev a udrží páteř v přirozené rovině.',
        icon: '📏',
        suggestedComponent: 'chips',
        suggestedValues: [
          '7 anatomických zón s rozdílnou tuhostí (dokonalé uvolnění ramen a opora beder)',
          '3 až 5 anatomických zón pro vyváženou oporu páteře',
          'Jednozónová matrace s rovnoměrnou tuhostí po celé délce',
        ],
      },
      {
        id: 'mattress_sleep_position',
        name: 'Poloha při spánku',
        category: 'Spánkové návyky',
        importance: 'recommended',
        rationale: 'Při spánku na boku je nutná vyšší poddajnost v ramenou a bocích. Pro spánek na zádech a břiše je nutná tužší matrace, aby se neprohýbala bederní lordóza.',
        icon: '💤',
        suggestedComponent: 'chips',
        suggestedValues: ['Spaní převážně na boku (nutnost hlubšího zanoření ramene)', 'Spaní na zádech nebo na břiše (potřeba tužší stabilní opory)', 'Kombinovaná poloha se střídáním'],
      },
      {
        id: 'mattress_height_dimensions',
        name: 'Výška matrace',
        category: 'Výška & Konstrukce',
        importance: 'recommended',
        rationale: 'Nízké matrace pod 18 cm se rychleji proleží a vstávání z nízké postele silně namáhá kolenní a kyčelní klouby. Matrace o výšce 24+ cm nabízí prémiový komfort a šetří klouby seniorů i sportovců.',
        icon: '📐',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Vysoká prémiová matrace 24–30 cm (snadné vstávání z postele a luxusní pocit)',
          'Standardní výška 18–22 cm (vhodná pro většinu moderních lůžek)',
          'Nižší výška 14–16 cm (do dětských postelí či na patrové postele)',
        ],
      },
      {
        id: 'mattress_cover_hygiene',
        name: 'Pratelný potah',
        category: 'Hygiena & Údržba',
        importance: 'recommended',
        rationale: 'Roztoči a alergeny hynou až při teplotě praní 60 °C. Rozdělení zipem dokola umožní vyprat v běžné domácí pračce vždy jednu polovinu potahu, zatímco na druhé lze spát.',
        icon: '🧼',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Snímatelný potah dělitelný na 2 poloviny pratelný na 60 °C (likvidace roztočů a snadné praní)',
          'Běžný zipový snímatelný potah pratelný na 40 °C',
          'Antibakteriální potah s vlákny stříbra nebo aloe vera',
        ],
      },
      {
        id: 'mattress_bed_base_compat',
        name: 'Kompatibilita s roštem',
        category: 'Rošt & Podklad',
        importance: 'recommended',
        rationale: 'Taštičkové matrace se nesmí dávat na polohovací rošty ani na rošty s mezerami mezi latěmi většími než 4 cm (pružiny by propadávaly). Pěnové matrace naopak vyžadují pružné lamely.',
        icon: '🪵',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Lamelový polohovací rošt (vyžaduje elastickou pěnovou či latexovou matraci)',
          'Pevný laťový rošt s mezerami (ideální pro taštičkové pružinové jádro)',
          'Pevná deska / kontinentální postel Boxspring',
        ],
      },
      {
        id: 'mattress_partner_dual',
        name: 'Partnerská dvojí tuhost',
        category: 'Partnerská řešení',
        importance: 'recommended',
        rationale: 'Pokud muž váží 95 kg a žena 60 kg, jedna společná matrace bude pro jednoho příliš tvrdá a pro druhého měkká. Partnerská matrace nabízí dvě odlišně tuhé poloviny v jednom potahu bez mezery.',
        icon: '👫',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Partnerská matrace s dvojí tuhostí (jedna strana měkčí, druhá tužší)',
          'Dvě samostatné matrace se společným zipovým potahem',
          'Jednotná tuhost po celé ploše manželské postele',
        ],
      },
      UNIVERSAL_BRAND_PARAMETER,
    ],
    questions: [
      {
        id: 'mattress_q_health',
        step: 1,
        title: 'Jaká je vaše tělesná hmotnost a máte zdravotní potíže s páteří?',
        subtitle: 'Klíčový údaj pro správnou volbu tuhosti H1–H5 a zónování matrace.',
        component: 'chips',
        isMultiSelect: false,
        options: [
          { label: 'Hmotnost do 75 kg bez bolestí zad', value: 'light', description: 'Vhodná poddajnější matrace H2/H3 pro příjemné zanoření.' },
          { label: 'Hmotnost 75–95 kg (univerzální postava)', value: 'medium', description: 'Střední ortopedická tuhost H3 se stabilní oporou páteře.' },
          { label: 'Hmotnost nad 95 kg nebo potíže s ploténkami / bolestmi beder', value: 'heavy_ortho', description: 'Tužší ortopedické jádro H4 se zesílenou bederní výztuhou.' },
        ],
        defaultValue: 'medium',
        promptForgeTemplate: '- **Hmotnost a zdravotní profil spáče:** {value}',
      },
    ],
    suggestedAlternatives: [
      {
        id: 'mattress_cooling_gel',
        name: 'Chladivá pěna',
        category: 'Termoregulace',
        importance: 'preference',
        rationale: 'Pěna s chladivým gelem nebo PCM kapslemi odvádí přebytečné tělesné teplo a zabraňuje nepříjemnému probouzení v horku.',
        icon: '❄️',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Chladivá gelová pěna GelFoam / termoaktivní potah (pro lidi náchylné k nočnímu pocení)',
          'Prodyšná latexová vrstva s perforací pro přirozené odvětrávání',
          'Standardní paměťová pěna s hřejivým efektem',
        ],
      },
    ],
    systemPrompt: `Jsi špičkový ortopedický specialista na zdravý spánek a ergonomii páteře.
Doporuč přesně 3 konkrétní ortopedické matrace dle hmotnosti uživatele, zdravotního stavu zad, polohy spánku a rozpočtu. Respektuj pravidla pro značky.`,
  },

  heat_pumps: {
    categoryName: 'Tepelná Čerpadla & Energetika Domu',
    agentName: 'Specialista na Tepelná Čerpadla & HVAC',
    icon: '♨️',
    description: 'Nezávislý nákupní rádce pro výběr tepelných čerpadel. Analyzuje typ (vzduch-voda vs. země-voda), tepelnou ztrátu domu, SCOP při -15 °C, chladivo R290 a dotace NZÚ.',
    keywords: ['tepelne cerpadlo', 'tepelné čerpadlo', 'cerpadlo', 'čerpadlo', 'vytapeni', 'vytápění', 'topeni', 'topení', 'nibe', 'viessmann', 'vaillant', 'daikin'],
    parameters: [
      {
        id: 'hp_category_type',
        name: 'Typ tepelného čerpadla',
        category: 'Kategorie & Typologie',
        importance: 'mandatory',
        rationale: 'Základní tržní zařazení. Vzduch-voda monoblok má celý chladivový okruh hermeticky uzavřený ve venkovní jednotce (nepotřebuje revize chladiva a nezabírá místo uvnitř). Split vyžaduje propojení chladivem chlaďařem. Země-voda nabízí stabilní výkon i při -20 °C s nejvyšším SCOP, ale vyžaduje vrty. Otázka pro vás: Hledáte bezúdržbový monoblok vzduch-voda, splitové řešení, nebo systém země-voda?',
        icon: '♨️',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Vzduch-voda monoblok (hermetický venkovní okruh, bezpečný a bez revizí chladiva)',
          'Vzduch-voda split (venkovní jednotka + vnitřní hydrobox s chladivovým propojením)',
          'Země-voda s hlubinnými vrty (maximální energetická efektivita bez ohledu na mráz)'
        ],
      },
      {
        id: 'house_biometrics_heatloss',
        name: 'Tepelná ztráta a topení',
        category: 'Dům & Otopná soustava',
        importance: 'mandatory',
        rationale: 'Předimenzované čerpadlo cykluje a ničí kompresor, poddimenzované spíná drahý elektrokotel. Nízkoteplotní podlahové topení dosahuje o 30 % vyšší účinnosti než staré litinové radiátory. Otázka pro vás: Jaká je tepelná ztráta vašeho domu a topíte podlahovkou, nebo radiátory?',
        icon: '🏡',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Novostavba / Nízkoenergetický dům (tepelná ztráta do 5 kW, podlahové topení 35 °C)',
          'Zateplený starší dům (tepelná ztráta 6–10 kW, kombinace podlahovka + radiátory)',
          'Starší nezateplený dům (tepelná ztráta 11–16+ kW, vysokoteplotní radiátory 55–65 °C)'
        ],
      },
      {
        id: 'hp_scop_subzero',
        name: 'Topný faktor v mrazu',
        category: 'Účinnost & Výkon v mrazu',
        importance: 'mandatory',
        rationale: 'Tabulkový výkon při +7 °C uváděný v letácích je zavádějící. Klíčový je sezónní faktor SCOP (min. 4.5+) a schopnost dodat dostatek tepla i při -15 °C bez nutnosti spínat bivalentní elektrokotel. Otázka pro vás: Bydlíte v horské oblasti s častými mrazy, nebo v nížině?',
        icon: '❄️',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Špičkový topný faktor SCOP > 4.8 s garancí plného výkonu i při -20 °C',
          'Velmi dobrý SCOP 4.2–4.6 (optimální pro zateplené domy v podmínkách ČR)',
          'Standardní SCOP kolem 3.8–4.0 pro ekonomické řešení',
        ],
      },
      {
        id: 'hp_refrigerant_propane',
        name: 'Chladivo R290',
        category: 'Chladivo & Ekologie',
        importance: 'mandatory',
        rationale: 'Syntetická chladiva (R410A, R32) podléhají přísným kvótám EU F-plynů a v budoucnu hrozí jejich zákaz a drahé doplňování. Přírodní propan R290 je ekologický, umožňuje vysokou výstupní teplotu 70–75 °C pro radiátory a má neomezenou budoucnost.',
        icon: '🔬',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Přírodní ekologické chladivo R290 propan (výstupní voda až 75 °C – skvělé pro radiátory)',
          'Moderní syntetické chladivo R32 (vysoká účinnost pro podlahové topení)',
          'Osvědčené chladivo R410A s širokou servisní podporou',
        ],
      },
      {
        id: 'hp_noise_level',
        name: 'Hlučnost jednotky',
        category: 'Hlučnost & Hygiena',
        importance: 'mandatory',
        rationale: 'Hlučné tepelné čerpadlo překračuje noční hygienický limit 35 dB u hranice pozemku, což vede k sousedským sporům a pokutám od hygienické stanice. Špičková čerpadla s pomaloběžnými ventilátory v noci téměř neslyšíte.',
        icon: '🔇',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Mimořádně tichá venkovní jednotka pod 35 dB(A) ve vzdálenosti 3 m (vhodné pro hustou zástavbu)',
          'Standardní hlučnost 38–42 dB(A) s nočním tichým režimem',
          'Běžná hlučnost bez omezení sousedskými vztahy',
        ],
      },
      {
        id: 'hp_inverter_modulation',
        name: 'Regulace kompresoru',
        category: 'Kompresor & Regulace',
        importance: 'recommended',
        rationale: 'Schopnost kompresoru plynule stáhnout výkon v přechodných obdobích (jaro/podzim) zabraňuje neustálému zapínání a vypínání (cyklování), které ničí elektroniku a zkracuje životnost kompresoru.',
        icon: '⚡',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Plynulá modulace kompresoru Inverter 20–100 % (přesné přizpůsobení aktuální tepelné ztrátě domu)',
          'Dvoustupňový kompresor s ekonomickým režimem',
          'On/Off kompresor s akumulační nádrží',
        ],
      },
      {
        id: 'hp_dhw_tank_volume',
        name: 'Zásobník teplé vody',
        category: 'Teplá voda TUV',
        importance: 'recommended',
        rationale: 'Tepelné čerpadlo ohřívá vodu pomaleji než plynový kotel. Pro 4člennou rodinu s vanou je nutný kvalitně zaizolovaný nerezový zásobník o objemu alespoň 200–250 litrů s velkou teplosměnnou plochou výměníku.',
        icon: '🚿',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Integrovaný nerezový zásobník na 180–230 l vnitřní jednotky (úspora místa v domě)',
          'Samostatný externí bojler 250–300 l (pro velkou rodinu a časté napouštění vany)',
          'Pouze vytápění domu bez ohřevu TUV (ohřev vody řešen samostatně)',
        ],
      },
      {
        id: 'hp_subsidy_compliance',
        name: 'Státní dotace NZÚ',
        category: 'Dotace & Financování',
        importance: 'recommended',
        rationale: 'Čerpadlo musí mít platný kód SVT (Seznam výrobků a technologií) u Státního fondu životního prostředí, aby bylo možné čerpat dotaci NZÚ ve výši až 100 000 – 140 000 Kč.',
        icon: '📜',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Plná certifikace a splnění podmínek pro dotaci Nová zelená úsporám (kotlíková dotace)',
          'Instalace bez dotačního programu',
          'Kombinace s dotací na fotovoltaiku a zateplení',
        ],
      },
      {
        id: 'hp_service_connectivity',
        name: 'Vzdálená správa a servis',
        category: 'Servis & Podpora',
        importance: 'recommended',
        rationale: 'Při poruše v třeskutém mrazu potřebujete servisního technika s náhradními díly na místě do 24 hodin, ne za dva týdny. Vzdálená online diagnostika umožní servisnímu technikovi odhalit závadu přes internet.',
        icon: '📶',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Vzdálený online monitoring a servisní diagnostika výrobcem přes Wi-Fi/LAN',
          'Místní ovládání nástěnným pokojovým termostatem s mobilní aplikací',
          'Základní manuální ovládání na displeji jednotky',
        ],
      },
      UNIVERSAL_BRAND_PARAMETER,
    ],
    questions: [
      {
        id: 'hp_q_house',
        step: 1,
        title: 'Jaký typ domu vytápíte a jaké otopné tělesa používáte?',
        subtitle: 'Klíčové pro dimenzování potřebného výkonu čerpadla a teploty otopné vody.',
        component: 'chips',
        isMultiSelect: false,
        options: [
          { label: 'Novostavba s podlahovým vytápěním (nízká teplota vody 35 °C)', value: 'new_build', description: 'Maximální účinnost a nízké provozní náklady.' },
          { label: 'Zrekonstruovaný dům s radiátory nebo kombinací', value: 'renovated', description: 'Střední teplota vody vyžadující čerpadlo s teplotním spádem do 55 °C.' },
          { label: 'Starší dům s původními litinovými radiátory', value: 'old_house', description: 'Vysokoteplotní čerpadlo s výstupní teplotou až 75 °C (chladivo R290).' },
        ],
        defaultValue: 'new_build',
        promptForgeTemplate: '- **Typ stavby a otopná soustava:** {value}',
      },
    ],
    suggestedAlternatives: [
      {
        id: 'hp_cooling_active',
        name: 'Aktivní chlazení v létě',
        category: 'Letní komfort',
        importance: 'preference',
        rationale: 'Umožňuje obrátit chod čerpadla a v horkých letních dnech chladit dům přes podlahové topení nebo fan-coily.',
        icon: '❄️',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Aktivní reverzní chlazení v parném létě (přes podlahové topení či fancoily)',
          'Pasivní chlazení z hlubinného vrtu (u čerpadel země-voda)',
          'Pouze vytápění a ohřev teplé vody bez chlazení',
        ],
      },
    ],
    systemPrompt: `Jsi špičkový certifikovaný energetický auditor a specialista na tepelná čerpadla.
Doporuč přesně 3 konkrétní modely tepelných čerpadel dle typu stavby, tepelné ztráty, typu chladiva a rozpočtu s ohledem na dotaci NZÚ. Respektuj pravidla pro značky.`,
  },
  bicycles: {
    categoryName: 'Jízdní Kola & Elektromobilita',
    agentName: 'Specialista na Jízdní Kola & E-biky',
    icon: '🚲',
    description: 'Technický nákupní poradce pro jízdní kola a elektrokola. Analyzuje disciplínu, biometrii jezdce, geometrii rámu, materiál (karbon vs. hliník), sadu řazení Shimano/SRAM, odpružení a motorové parametry.',
    keywords: ['kolo', 'kola', 'horske kolo', 'horské kolo', 'elektrokolo', 'ebike', 'e-bike', 'gravel', 'silnicni kolo', 'silniční kolo', 'bicykl', 'bicykly'],
    parameters: [
      {
        id: 'bike_type_category',
        name: 'Typ kola a disciplína',
        category: 'Kategorie & Disciplína',
        importance: 'mandatory',
        rationale: 'Klíčové elementární zařazení na trhu, které určuje celou geometrii, šířku plášťů i typ řídítek. Špatný výběr typu je nejčastějším zklamáním. Otázka pro vás: Po jakém povrchu a v jakém terénu budete na kole nejčastěji jezdit?',
        icon: '🚲',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Gravel (rychlý a univerzální na silnici, cyklostezky i šotolinu)',
          'Horské kolo MTB (kořeny, kameny, lesní traily a hory)',
          'Silniční kolo (čistý hladký asfalt a maximální rychlost)',
          'Městské / Trekingové (vzpřímený posed, nosiče a dojíždění)',
          'Elektrokolo E-bike (středový motor pro výjezdy bez vyčerpání)'
        ],
      },
      {
        id: 'bike_rider_biometrics',
        name: 'Biometrie jezdce & zdraví',
        category: 'Biometrie & Zdraví',
        importance: 'mandatory',
        rationale: 'Výška a vnitřní délka nohou (inseam) určují velikost rámu (S/M/L/XL), hmotnost je nutná pro natlakování vzduchové vidlice. Jezdci po operaci kolen či s výhřezem ploténky vyžadují vzpřímenější geometrii a celoodpružený rám pro šetření beder. Otázka pro vás: Jaká je vaše přesná výška, hmotnost a máte zdravotní limity zad či kolen?',
        icon: '🧬',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Výška do 175 cm / Hmotnost do 75 kg (rám S/M, běžný posed)',
          'Výška 175–185 cm / Hmotnost 75–90 kg (rám M/L, standardní vidlice)',
          'Výška nad 185 cm / Hmotnost nad 90 kg (rám L/XL, vyztužený rám a silné brzdy)',
          'Zdravotní omezení zad/kolen (požadavek na vzpřímený posed a celoodpružení)'
        ],
      },
      {
        id: 'bike_frame_material',
        name: 'Materiál rámu',
        category: 'Rám & Jízdní vlastnosti',
        importance: 'mandatory',
        rationale: 'Tuhý hliníkový rám bez karbonových prvků přenáší veškeré rázy z polních cest do zápěstí a krční páteře. Karbon tlumí vibrace a šetří energii. Otázka pro vás: Preferujete nízkou hmotnost a pohodlné tlumení vibrací, nebo robustnost a odolnost proti pádům?',
        icon: '📐',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Lehký karbonový rám (vynikající pohlcování vibrací a maximální tuhost v záběru)',
          'Odolný hliníkový rám (nejlepší poměr ceny, odolnosti a nízké váhy)',
          'Ocelový Cr-Mo rám (poddajnost a vysoká opravitelnost pro cestování)',
          'Titanový rám (exkluzivní materiál s doživotní trvanlivostí)',
        ],
      },
      {
        id: 'bike_suspension_system',
        name: 'Systém odpružení',
        category: 'Odpružení',
        importance: 'mandatory',
        rationale: 'Levná pružinová vidlice nelze nastavit na hmotnost jezdce a v zimě tuhne. Vzduchovou vidlici natlakujete přesně na své tělo a celoodpružený rám šetří páteř v terénu. Otázka pro vás: Vyžadujete citlivé žehlení nerovností a možnost vidlici zamknout na asfaltu?',
        icon: '🚵',
        suggestedComponent: 'chips',
        suggestedValues: ['Pevná karbonová vidlice (rychlost na silnici a gravelu)', 'Přední vzduchová odpružená vidlice s lockoutem na řídítkách (Hardtail)', 'Celoodpružený rám (Full-suspension pro šetření zad v terénu)'],
      },
      {
        id: 'bike_drivetrain_groupset',
        name: 'Převody a sada řazení',
        category: 'Pohon & Řazení',
        importance: 'mandatory',
        rationale: 'Jednopřevodník 1x12 zjednodušuje řazení a zabraňuje padání řetězu v terénu, zatímco na dlouhé silniční rovinky je vhodnější jemnější odstupňování 2x11. Otázka pro vás: Jezdíte převážně v kopcovitém terénu a na trailech, nebo po asfaltových rovinách?',
        icon: '⚙️',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Elektronické bezdrátové řazení (SRAM AXS / Shimano Di2 – bleskové a přesné řazení)',
          'Osvědčená mechanická sada Shimano Deore / GRX / XT s jednopřevodníkem 1x12',
          'Klasické dvoupřevodníkové zpřevodování 2x11 pro jemné odstupňování na silnici',
        ],
      },
      {
        id: 'bike_brakes_hydraulic',
        name: 'Brzdový systém',
        category: 'Bezpečnost',
        importance: 'mandatory',
        rationale: 'Mechanické lankové brzdy vadnou v dlouhých sjezdech a vyžadují velkou sílu prstů, zatímco hydraulické kotouče zastaví kolo jedním prstem za mokra i bláta. Otázka pro vás: Sjíždíte prudké kopce s plnou zátěží nebo elektrokolem?',
        icon: '🛑',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Hydraulické kotoučové brzdy Shimano / SRAM s chlazenými destičkami (jistota za mokra i v dlouhých sjezdech)',
          'Základní hydraulické kotoučovky s jednoduchým servisem',
          'Mechanické kotoučové brzdy nebo ráfkové V-brzdy',
        ],
      },
      {
        id: 'bike_wheel_tire_size',
        name: 'Rozměr kol a plášťů',
        category: 'Kola & Trakce',
        importance: 'recommended',
        rationale: '29" kola lépe překonávají kameny a drží rychlost, 27.5" jsou obratnější v technických točkách. Bezdušový tmel eliminuje procvaknutí duše. Otázka pro vás: Preferujete stabilitu a rychlost na rovinách, nebo hravost?',
        icon: '🛞',
        suggestedComponent: 'chips',
        suggestedValues: ['29" kola (skvělá průchodnost terénem a setrvačnost)', 'Gravel pláště 40–45 mm s bezdušovým tmelem', '27.5" kola pro menší postavu a hravost'],
      },
      {
        id: 'bike_ebike_motor_battery',
        name: 'Elektropohon a baterie',
        category: 'Elektropohon (u E-biků)',
        importance: 'recommended',
        rationale: 'Levné motory v náboji kola zabírají skokově a ztrácejí trakci, zatímco středový motor s torzním snímačem dávkuje asistenci přirozeně podle tlaku na pedál. Otázka pro vás: Plánujete celodenní vyjížďky v horách na 80+ km s převýšením?',
        icon: '⚡',
        suggestedComponent: 'chips',
        suggestedValues: ['Středový motor Bosch CX / Shimano EP8 (85 Nm) + baterie 700+ Wh', 'Lehčí středový motor SL (50–60 Nm, baterie 400 Wh) pro přirozený pocit z jízdy', 'Běžné jízdní kolo bez motoru'],
      },
      {
        id: 'bike_cockpit_ergonomics',
        name: 'Ergonomie kokpitu a sedlo',
        category: 'Ergonomie & Pohodlí',
        importance: 'recommended',
        rationale: 'Příliš široká řídítka způsobují brnění rukou a bolesti trapézů. Správná šířka sedla podle sedacích kostí je klíčem k jízdě bez otlaků. Otázka pro vás: Míváte při delších vyjížďkách potíže s brněním prstů nebo tlakem v sedací oblasti?',
        icon: '🖐️',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Ergonomické gripy s opěrkou dlaně a gelové sedlo pro komfortní vzpřímený posed',
          'Sportovní sedlo s odlehčovacím kanálkem pro delší sportovní vyjížďky',
          'Závodní aerodynamický posed s nízkým úchopem',
        ],
      },
      {
        id: 'bike_weight_capacity',
        name: 'Nosnost kola a nosiče',
        category: 'Praktičnost & Nosnost',
        importance: 'recommended',
        rationale: 'Běžné sportovní rámy mají limit nosnosti 115 kg včetně kola. Pro těžší jezdce nebo výpravy s brašnami je nutný rám s nosností 135–150 kg.',
        icon: '🎒',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Zvýšená nosnost 130–150 kg (vhodné pro těžší jezdce i expediční brašny)',
          'Standardní nosnost do 115–120 kg (běžné sportovní kolo)',
          'Ultralehký závodní speciál s limitem do 100 kg',
        ],
      },
      UNIVERSAL_BRAND_PARAMETER,
    ],
    questions: [
      {
        id: 'bike_q_type',
        step: 1,
        title: 'V jakém terénu a na jakých površích budete nejčastěji jezdit?',
        subtitle: 'Klíčové elementární rozdělení určující celou geometrii a typ rámu.',
        component: 'chips',
        isMultiSelect: false,
        options: [
          { label: 'Gravel / Rychlé polní cesty a asfalt', value: 'gravel', description: 'Berany řídítka, lehký rám, pláště 40–45 mm, vysoká rychlost a univerzalita.' },
          { label: 'Horské kolo (MTB) / Lesní stezky, kořeny a traily', value: 'mtb', description: 'Široká rovná řídítka, pláště 2.2–2.4", odpružená vidlice a jistota v terénu.' },
          { label: 'Elektrokolo (E-MTB / Krosové)', value: 'ebike', description: 'Asistence středového motoru do prudkých kopců a na dlouhé výlety bez vyčerpání.' },
        ],
        defaultValue: 'gravel',
        promptForgeTemplate: '- **Hlavní typ kola a terénu:** {value}',
      },
      {
        id: 'bike_q_biometrics',
        step: 2,
        title: 'Jaká je vaše výška, váha a máte zdravotní omezení?',
        subtitle: 'Určuje přesnou velikost rámu, dimenzování odpružení a ergonomii posedu.',
        component: 'chips',
        isMultiSelect: false,
        options: [
          { label: 'Standardní postava bez omezení', value: 'standard', description: 'Sportovní posed a běžné nastavení odpružení.' },
          { label: 'Vyšší hmotnost (90+ kg) / Vyšší postava', value: 'heavy', description: 'Požadavek na vyšší tuhost rámu, vzduchovou vidlici a silné brzdy.' },
          { label: 'Zdravotní limity (bolavá záda / kolena po operaci)', value: 'orthopedic', description: 'Požadavek na vzpřímenější geometrii a šetrné odpružení pro páteř.' },
        ],
        defaultValue: 'standard',
        promptForgeTemplate: '- **Biometrie a zdravotní profil jezdce:** {value}',
      },
    ],
    suggestedAlternatives: [
      {
        id: 'bike_dropper_post',
        name: 'Teleskopická sedlovka',
        category: 'Komfort & Bezpečnost',
        importance: 'preference',
        rationale: 'Umožňuje snížit sedlo za jízdy před prudkým sjezdem, což radikálně snižuje riziko pádu přes řídítka v terénu.',
        icon: '📏',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Teleskopická sedlovka ovládaná z řídítek (okamžité snížení sedla ve sjezdech a technických pasážích)',
          'Pevná karbonová sedlovka tlumící vibrace',
          'Odpružená sedlovka pro maximální pohodlí zad na polních cestách',
        ],
      },
      {
        id: 'bike_service_warranty',
        name: 'Záruka na rám',
        category: 'Záruka & Podpora',
        importance: 'preference',
        rationale: 'Výrobci jako Trek či Specialized poskytují prvnímu majiteli doživotní záruku na rám kola.',
        icon: '🛡️',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Doživotní tovární záruka na rám kola (Trek, Specialized, Orbea)',
          'Prodloužená 5letá záruka po registraci',
          'Standardní zákonná záruka 2 roky',
        ],
      },
    ],
    systemPrompt: `Jsi špičkový cyklistický mechanik a biomechanický poradce.
Tvým úkolem je doporučit přesně 3 konkrétní modely jízdních kol nebo elektrokol dle zadaných požadavků, tělesné biometrie a rozpočtu.

Pravidla pro doporučení:
1. Respektuj zvolenou disciplínu (gravel vs. MTB vs. silnice vs. e-bike) a terén.
2. Zohledni biometrii jezdce (výška pro velikost rámu, váha pro vidlici, případné zdravotní limity zad či kolen).
3. U každého kola uveď přesný model, materiál rámu, sadu řazení (např. Shimano Deore/XT, SRAM GX), typ vidlice a orientační cenu v Kč.
4. Striktně respektuj preferované a zakázané značky uživatele.`,
  },
  strollers: {
    categoryName: 'Dětské Kočárky & Cestování s Dětmi',
    agentName: 'Specialista na Dětské Kočárky & Bezpečnost',
    icon: '👶',
    description: 'Nezávislý nákupní rádce pro výběr dětských kočárků. Analyzuje odpružení, skládání do kufru, rozměry korbičky a terénní prostupnost.',
    keywords: ['kocarek', 'kočárek', 'kocarky', 'kočárky', 'dvojkombinace', 'trojkombinace', 'golfky', 'sportak', 'sporťák', 'stroller'],
    parameters: [
      {
        id: 'stroller_type_segment',
        name: 'Typ kočárku',
        category: 'Kategorie & Typologie',
        importance: 'mandatory',
        rationale: 'Základní tržní zařazení určuje celou konstrukci podvozku. Kombinovaný kočárek poslouží od narození po batole, sportovní projede kořeny a cestovní se vejde do letadla. Otázka pro vás: Hledáte kočárek od narození s hlubokou korbou, sportovní do terénu, nebo kompaktní na cestování?',
        icon: '👶',
        suggestedComponent: 'chips',
        suggestedValues: ['Kombinovaný kočárek 2v1 / 3v1 (od narození po batole)', 'Sportovní terénní kočárek s nafukovacími koly', 'Lehký kompaktní cestovní kočárek (golfky do auta a letadla)'],
      },
      {
        id: 'parent_child_biometrics',
        name: 'Výška rodičů a kufr auta',
        category: 'Biometrie & Ergonomie',
        importance: 'mandatory',
        rationale: 'Vysocí rodiče (180+ cm) bez teleskopického madla zakopávají při chůzi o osu kočárku a hrubě namáhají záda. Kočárek se navíc musí vejít do kufru auta a projet dveřmi výtahu. Otázka pro vás: Jaká je výška rodičů a jaké jsou prostorové limity kufru auta či výtahu?',
        icon: '🧬',
        suggestedComponent: 'chips',
        suggestedValues: ['Rodiče do 175 cm (běžná výška madla)', 'Vysocí rodiče 180+ cm (nutné teleskopické prodloužení madla)', 'Omezený prostor (malý kufr auta / úzký výtah do 65 cm)'],
      },
      {
        id: 'stroller_suspension_wheels',
        name: 'Odpružení a typ kol',
        category: 'Podvozek & Terén',
        importance: 'mandatory',
        rationale: 'Tvrdá nenafukovací kola na dlažebních kostkách vytřesou z miminka duši. Na polní cesty a dlažbu je nutné 4bodové odpružení s velkými pěnovými nebo nafukovacími koly. Otázka pro vás: Budete jezdit po kočičích hlavách a polních cestách, nebo pouze v nákupních centrech a parcích?',
        icon: '🛞',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Nafukovací nebo gelová velká kola s měkkým nastavitelným odpružením všech 4 kol (do terénu a na kočičí hlavy)',
          'Pěnová PU bezúdržbová kola s odpružením zadní nápravy (univerzální do města a parků)',
          'Lehká menší plastová kola pro maximální skladnost',
        ],
      },
      {
        id: 'stroller_fold_mechanism',
        name: 'Skládání jednou rukou',
        category: 'Manipulace',
        importance: 'mandatory',
        rationale: 'Rodiče často drží dítě v jedné ruce a druhou musí složit kočárek do kufru. Možnost složení v celku bez sundávání sedadla šetří čas i nervy. Otázka pro vás: Budete kočárek denně nakládat do auta?',
        icon: '🤏',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Bleskové složení jednou rukou i se sportovním sedákem (ideální při nastupování do MHD)',
          'Dvoudílné kompaktní skládání do malého kufru městského auta',
          'Tradiční robustní skládání pro prostorný rodinný kombík',
        ],
      },
      {
        id: 'stroller_bassinet_dimensions',
        name: 'Rozměry hluboké korby',
        category: 'Pohodlí miminka',
        importance: 'mandatory',
        rationale: 'Pokud se dítě narodí na jaře či v létě, v zimě bude mít 6 měsíců a do krátké designové korby (pod 75 cm) se s teplým zimním fusakem nevejde. Otázka pro vás: V jakém ročním období se miminko narodí?',
        icon: '🛏️',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Prostorná XL hluboká korba (délka 80+ cm – dostatek místa pro zimní fusak)',
          'Standardní korba pro jarní a letní miminka (délka 75 cm)',
          'Skládací měkká vložná taška do sportovního kočárku',
        ],
      },
      {
        id: 'stroller_seat_reversibility',
        name: 'Otočné sportovní sezení',
        category: 'Sportovní sezení',
        importance: 'recommended',
        rationale: 'Menší děti potřebují oční kontakt s rodičem pro pocit bezpečí, starší batolata chtějí pozorovat svět před sebou. Otázka pro vás: Požadujete možnost otočit sportovní sedák oběma směry a polohovat do úplného lehu?',
        icon: '🔄',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Obousměrné otočné sezení (čelem k rodičům pro kontakt s miminkem i po směru jízdy na objevování světa)',
          'Pevné sezení výhradně po směru jízdy (lehčí a skladnější konstrukce)',
          'Překlápěcí rukojeť pro okamžitou změnu směru',
        ],
      },
      {
        id: 'stroller_canopy_sun_rain',
        name: 'Stříška s UV 50+ ochranou',
        category: 'Ochrana',
        importance: 'recommended',
        rationale: 'Krátká stříška nechrání spící dítě před nízkým ranním sluncem ani větrem a nutí rodiče používat pleny s kolíčky, které přehřívají vnitřek kočárku.',
        icon: '☀️',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Prodloužitelná stříška s UV 50+ ochranou, větrací síťkou a tichým magnetickým okénkem',
          'Běžná stříška se sluneční clonou',
          'Přídavný slunečník a pláštěnka v balení',
        ],
      },
      {
        id: 'stroller_basket_capacity',
        name: 'Nosnost nákupního košíku',
        category: 'Praktičnost',
        importance: 'recommended',
        rationale: 'Košík s nízkou nosností do 3 kg se pod váhou nákupu prověsí a dře o obrubníky. Důležitý je nosnost min. 5–10 kg a přístup i při sklopeném sedadle.',
        icon: '🧺',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Velký uzavíratelný nákupní košík s nosností 5–10 kg',
          'Otevřený přístupný košík na drobnosti a hračky',
          'Základní košík s nosností do 3 kg',
        ],
      },
      {
        id: 'stroller_safety_harness',
        name: 'Bezpečnostní pásy a spona',
        category: 'Bezpečnost',
        importance: 'mandatory',
        rationale: 'Tradiční zacvakávací přezky jsou u vzpouzejícího se batolete noční můrou. Magnetické rychlozámky upevní dítě během sekundy.',
        icon: '🔒',
        suggestedComponent: 'chips',
        suggestedValues: [
          '5bodové magnetické zapínání pásů s měkkým polstrováním',
          'Klasická pětibodová spona s nastavením výšky',
          'Snadné zapínání s odnímatelným bezpečnostním madlem před dítětem',
        ],
      },
      UNIVERSAL_BRAND_PARAMETER,
    ],
    questions: [
      {
        id: 'stroller_q_type',
        step: 1,
        title: 'V jakém terénu a pro jaký věk dítěte budete kočárek používat?',
        subtitle: 'Určuje velikost kol, odpružení a typ nástaveb.',
        component: 'chips',
        isMultiSelect: false,
        options: [
          { label: 'Kombinovaný kočárek od narození (dvojkombinace 2v1)', value: 'combo_2in1', description: 'Hluboká korba + sportovní sezení na 0 až 3 roky.' },
          { label: 'Terénní sportovní kočárek na nerovnosti a sport', value: 'all_terrain', description: 'Velká kola a silné odpružení na polní cesty, les a běh.' },
          { label: 'Kompaktní cestovní kočárek do města a auta', value: 'compact', description: 'Lehká váha pod 8 kg a bleskové složení do kufru.' },
        ],
        defaultValue: 'combo_2in1',
        promptForgeTemplate: '- **Typ kočárku a terén:** {value}',
      },
    ],
    suggestedAlternatives: [
      {
        id: 'stroller_handbrake',
        name: 'Ruční brzda na madle',
        category: 'Bezpečnost',
        importance: 'preference',
        rationale: 'Při chůzi z prudkého kopce s těžkým dítětem ruční kotoučová brzda zabraňuje tomu, aby kočárek táhl rodiče dolů.',
        icon: '🛑',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Ruční přibrzďovací brzda na madle (bezpečné přibrzďování při chůzi z prudkého kopce a in-line bruslení)',
          'Nožní centrální nášlapná brzda (šetrná k botám)',
          'Kombinovaná ruční a nožní brzda',
        ],
      },
    ],
    systemPrompt: `Jsi expertní nezávislý poradce pro výběr dětských kočárků s důrazem na ergonomii a bezpečnost.
Doporuč přesně 3 reálné modely kočárků dle typu terénu, výšky rodičů, prostornosti korbičky a rozpočtu. Respektuj pravidla pro značky.`,
  },

  lawnmowers: {
    categoryName: 'Sekačky & Péče o Trávník',
    agentName: 'Specialista na Sekačky & Zahradní Techniku',
    icon: '🌱',
    description: 'Nezávislý nákupní rádce pro výběr sekaček. Analyzuje plochu trávníku, typ pohonu (robotická RTK vs. aku vs. benzín), šířku záběru a servisní spolehlivost.',
    keywords: ['sekacka', 'sekačka', 'sekacky', 'sekačky', 'trakturek', 'traktůrek', 'mulcovac', 'roboticka sekacka', 'mower'],
    parameters: [
      {
        id: 'mower_category_power',
        name: 'Typ sekačky a pohon',
        category: 'Kategorie & Pohon',
        importance: 'mandatory',
        rationale: 'Základní tržní zařazení. Robot seká denně bez vaší přítomnosti, aku sekačka je tichá a bezúdržbová pro pozemky do 600 m², benzín zvládne vysokou trávu a traktor velké zahrady nad 1 500 m². Otázka pro vás: Hledáte bezpracného robota, tichou aku sekačku, nebo silný benzínový stroj?',
        icon: '🌱',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Robotická sekačka bez obvodového drátu (autonomní údržba)',
          'Akumulátorová rotační sekačka (tichá a bezúdržbová do 600 m²)',
          'Benzínová sekačka s pojezdem (vysoký výkon na velké a členité plochy)',
          'Zahradní traktor / Rider (pro rozlehlé pozemky nad 1 500 m²)'
        ],
      },
      {
        id: 'lawn_area_terrain',
        name: 'Plocha pozemku a svah',
        category: 'Pozemek & Terén',
        importance: 'mandatory',
        rationale: 'Při sklonu svahu nad 20° (35 %) ztrácí sekačky bez pohonu všech kol trakci a běžné motory se zadírají kvůli odlití oleje. Otázka pro vás: Jak velkou plochu trávníku sekáte a jaký je sklon vašeho pozemku?',
        icon: '📐',
        suggestedComponent: 'chips',
        suggestedValues: ['Malá rovinatá zahrada do 400 m²', 'Střední zahrada 400–1 000 m² s mírným sklonem', 'Velký pozemek nad 1 000 m² nebo svažitý terén nad 20°'],
      },
      {
        id: 'mower_nav_wirefree',
        name: 'Satelitní navigace RTK',
        category: 'Navigace (u robotů)',
        importance: 'mandatory',
        rationale: 'Obvodový drát se často přesekne při provzdušňování trávníku a jeho pokládka trvá hodiny. Satelitní RTK navigace funguje bez drátů s přesností na centimetry. Otázka pro vás: Chcete robota bez nutnosti zakopávat drát do země?',
        icon: '🛰️',
        suggestedComponent: 'chips',
        suggestedValues: ['Satelitní RTK-GPS + AI kamera bez obvodového drátu', 'Klasický obvodový naváděcí kabel v zemi', 'Tradiční sekačka s ručním vedením'],
      },
      {
        id: 'mower_drive_speed',
        name: 'Regulace pojezdu',
        category: 'Pojezd & Ergonomie',
        importance: 'mandatory',
        rationale: 'Pevná rychlost pojezdu u levných sekaček buď nutí obsluhu běžet, nebo popojíždí příliš pomalu. Plynulá regulace rychlosti páčkou na madle je zásadní pro pohodlí. Otázka pro vás: Vyžadujete možnost plynule měnit rychlost pojezdu podle tempa chůze?',
        icon: '⚡',
        suggestedComponent: 'chips',
        suggestedValues: ['Plynulý variabilní pojezd s nastavením rychlosti na madle', 'Pohon všech kol 4x4 (pro strmé svahy)', 'Bez pojezdu (pouze pro malé rovinky)'],
      },
      {
        id: 'mower_cut_width',
        name: 'Šířka záběru sečení',
        category: 'Výkon & Efektivita',
        importance: 'mandatory',
        rationale: 'Široký záběr (51+ cm) zkrátí dobu sečení velké zahrady na polovinu, ale neprojede mezi záhony a stromy. Otázka pro vás: Máte otevřenou plochu, nebo zahradu plnou stromků a záhonů?',
        icon: '✂️',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Široký záběr 51–56 cm (rychlé posečení velkých ploch nad 1 200 m²)',
          'Univerzální záběr 46–48 cm (optimální manévrovatelnost i na členité zahradě)',
          'Kompaktní záběr 38–42 cm pro menší zahrady do 500 m²',
        ],
      },
      {
        id: 'mower_chassis_material',
        name: 'Materiál šasi',
        category: 'Odolnost & Životnost',
        importance: 'recommended',
        rationale: 'Běžné tenké plechy po 4 letech proreznou od kyselé travní šťávy. Šasi z hliníkového odlitku nebo tvrzeného polymeru nikdy nezrezne. Otázka pro vás: Hledáte stroj s dlouhou životností bez koroze?',
        icon: '🛡️',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Robustní ocelové šasi s antikorozním nátěrem (dlouhá životnost)',
          'Tvrzené hliníkové šasi (nepodléhá korozi a tlumí vibrace motoru)',
          'Lehké polypropylenové plastové šasi (snadné zvedání a manipulace)',
        ],
      },
      {
        id: 'mower_cutting_system',
        name: 'Mulčování a sběrný koš',
        category: 'Funkčnost sečení',
        importance: 'recommended',
        rationale: 'Mulčování rozseká trávu na mikroskopické kousky, které slouží jako hnojivo a šetří čas s vyvážením koše. Otázka pro vás: Chcete posekanou trávu sbírat, nebo mulčovat zpět do trávníku?',
        icon: '🔄',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Systém 4v1: sběr do koše, mulčování, zadní i boční výhoz trávy',
          'Kvalitní sběr do velkého textilního koše s indikátorem naplnění',
          'Čistě mulčovací sekačka bez nutnosti vysypávat koš',
        ],
      },
      {
        id: 'mower_wheel_bearings',
        name: 'Ložiska kol',
        category: 'Podvozek',
        importance: 'recommended',
        rationale: 'Kola uložená na kluzných plastových pouzdrech se za dvě sezóny vyviklají a tlačení sekačky se stane dřinou. Kuličková ložiska zaručují hladký chod i po letech.',
        icon: '🛞',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Kuličková ložiska ve všech kolech (lehký pojezd a dlouhá životnost bez viklání)',
          'Kluzná ložiska s mosaznými pouzdry',
          'Jednoduché plastové uložení kol',
        ],
      },
      {
        id: 'mower_acoustic_comfort',
        name: 'Hlučnost sekačky',
        category: 'Komfort',
        importance: 'recommended',
        rationale: 'V husté zástavbě je hlučná benzínová sekačka zdrojem sousedských sporů o víkendech. Tichá aku či robotická sekačka může běžet kdykoliv.',
        icon: '🔇',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Tichý akumulátorový motor (možnost sečení v neděli a za přítomnosti sousedů)',
          'Tichý benzínový motor s velkým tlumičem výfuku',
          'Standardní úroveň hluku benzínového motoru',
        ],
      },
      UNIVERSAL_BRAND_PARAMETER,
    ],
    questions: [
      {
        id: 'mower_q_power',
        step: 1,
        title: 'Jaký pohon a typ sekačky preferujete pro vaši zahradu?',
        subtitle: 'Zásadní rozhodnutí ovlivňující hlučnost, údržbu a množství vaší práce.',
        component: 'chips',
        isMultiSelect: false,
        options: [
          { label: 'Robotická sekačka bez drátu (nulová práce)', value: 'robot', description: 'Trávník je neustále posekaný bez nutnosti vysypávat koš.' },
          { label: 'Akumulátorová rotační sekačka (tichá a lehká)', value: 'battery', description: 'Start stiskem tlačítka, žádný benzín, minimální údržba.' },
          { label: 'Benzínová sekačka s pojezdem (silný výkon)', value: 'petrol', description: 'Zvládne přerostlou trávu i nerovné velké plochy.' },
        ],
        defaultValue: 'robot',
        promptForgeTemplate: '- **Preferovaný pohon sekačky:** {value}',
      },
    ],
    suggestedAlternatives: [
      {
        id: 'mower_electric_start',
        name: 'Elektrické startování',
        category: 'Ergonomie',
        importance: 'preference',
        rationale: 'Eliminuje namáhavé tahání za startovací šňůru – motor naskočí okamžitě po stisku tlačítka díky malé li-ion baterii.',
        icon: '🔘',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Elektrický startér tlačítkem na madle s Li-Ion baterií (snadný start bez tahání za šňůru)',
          'Klasický startér s automatickým sytičem ReadyStart',
          'Tradiční ruční tahací startér s pumpičkou paliva',
        ],
      },
    ],
    systemPrompt: `Jsi expertní technik zahradní techniky a specialista na péči o trávník.
Doporuč přesně 3 spolehlivé modely sekaček dle zadané plochy trávníku, sklonu terénu, typu pohonu a rozpočtu. Respektuj pravidla pro preferované a zakázané značky.`,
  },
};

/**
 * Normalizes an input string by removing diacritics and converting to lowercase
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

export function discoverDomainParameters(query: string): DomainAnalysisResult {
  const normalized = normalizeText(query);

  // Find best domain profile match (prioritizing longest/most specific keyword)
  let bestMatch: { key: string; profile: (typeof DOMAIN_PROFILES)[string]; matchedKwLength: number } | null = null;

  for (const [key, profile] of Object.entries(DOMAIN_PROFILES)) {
    for (const kw of profile.keywords) {
      const normKw = normalizeText(kw);
      // For short keywords (<= 3 chars like 'ev', 'tv'), require distinct word boundaries to avoid false substring matches (e.g. 'televize' matching 'ev')
      const isMatch = normKw.length <= 3
        ? new RegExp(`(^|\\s|[.,;!?])${normKw}($|\\s|[.,;!?])`, 'i').test(normalized)
        : normalized.includes(normKw);

      if (isMatch) {
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
      ? param.suggestedValues.map((v) => {
          const parenMatch = v.match(/^([^(]+?)\s*\(([^)]+)\)$/);
          if (parenMatch) {
            return {
              label: parenMatch[1].trim(),
              description: parenMatch[2].trim(),
              value: parenMatch[1].toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''),
            };
          }
          const colonMatch = v.match(/^([^:]+?)\s*:\s*(.+)$/);
          if (colonMatch) {
            return {
              label: colonMatch[1].trim(),
              description: colonMatch[2].trim(),
              value: colonMatch[1].toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''),
            };
          }
          return {
            label: v.trim(),
            value: v.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''),
            description: undefined,
          };
        })
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

  const isPersonalBodyProduct = /(kolo|kola|lyže|lyze|boty|bota|obuv|židle|zidle|křeslo|kreslo|matrace|batoh|helma|přilba|prilba|oblečení|obleceni|bunda|kalhoty|sport|sedad|sedák|brusle|rukavice)/i.test(query);

  const parameters: ExtractedDomainParameter[] = [
    {
      id: 'elemental_market_segment',
      name: `Základní typové rozdělení a tržní segment produktu "${cleanTitle}"`,
      category: 'Kategorie & Typologie',
      importance: 'mandatory',
      rationale: `Klíčové elementární zařazení na trhu, které určuje celý směr výběru. Než se začnou řešit dílčí součástky a technologie, je nutné určit přesnou podkategorii a disciplínu. Otázka pro vás: Jaký konkrétní typ nebo konstrukční variantu produktu "${cleanTitle}" hledáte?`,
      icon: '🧭',
      suggestedComponent: 'chips',
      suggestedValues: ['Univerzální standardní provedení', 'Vysoce výkonná / Profesionální varianta', 'Kompaktní / Odlehčené provedení pro mobilitu'],
    },
    ...(isPersonalBodyProduct ? [{
      id: 'user_biometrics_health',
      name: 'Výška, váha a proporce',
      category: 'Biometrie & Ergonomie',
      importance: 'mandatory' as const,
      rationale: 'U produktů přicházejících do přímého kontaktu s lidským tělem určují výška, hmotnost a zdravotní historie (např. operace páteře, kloubů, vbočený palec či chronické bolesti) optimální velikost, tvrdost i ergonomii. Otázka pro vás: Jaká je vaše výška, váha a máte nějaká zdravotní či pohybová omezení?',
      icon: '🧬',
      suggestedComponent: 'chips' as const,
      suggestedValues: ['Běžná postava bez pohybových omezení', 'Vyšší postava / Hmotnost nad 90 kg', 'Specifická ergonomická a zdravotní omezení (páteř/klouby)'],
    }] : []),

    {
      id: 'primary_purpose',
      name: 'Způsob využití',
      category: 'Způsob využití',
      importance: 'mandatory',
      rationale: 'Rozdíl mezi poloprofesionálním a základním modelem spočívá v dimenzování ložisek a chlazení pro trvalý nepřetržitý provoz. Otázka pro vás: Jak často a jak dlouho v kuse budete produkt reálně používat?',
      icon: '🎯',
      suggestedComponent: 'chips',
      suggestedValues: ['Každodenní intenzivní provoz s vysokou zátěží', 'Pravidelné rodinné / víkendové použití', 'Příležitostné / Hobby'],
    },
    {
      id: 'technical_class',
      name: 'Konstrukční třída',
      category: 'Výkon & Technologie',
      importance: 'mandatory',
      rationale: 'Levné komponenty s hliníkovým vinutím se při zátěži rychle přehřívají a ztrácejí výkon. Otázka pro vás: Vyžadujete špičkovou výkonovou rezervu pro náročné situace?',
      icon: '⚡',
      suggestedComponent: 'chips',
      suggestedValues: ['Špičková profesionální třída s výkonovou rezervou', 'Zlatý střed (optimální poměr cena / výkon)', 'Základní spolehlivá řada pro nenáročné nasazení'],
    },
    {
      id: 'capacity_sizing',
      name: 'Kapacita a dimenzování',
      category: 'Dimenzování',
      importance: 'mandatory',
      rationale: 'Poddimenzovaná kapacita vede k neustálému přetěžování stroje a frustraci uživatele. Otázka pro vás: Jak velkou zátěž nebo dávku potřebujete najednou zpracovat?',
      icon: '⚖️',
      suggestedComponent: 'chips',
      suggestedValues: [
          'Velká kapacita pro rodinu či intenzivní zátěž (maximální prostorová i výkonová rezerva)',
          'Standardní střední velikost pro běžné každodenní použití',
          'Kompaktní úsporné provedení do menších prostor či pro občasné použití',
        ],
    },
    {
      id: 'dimensions_installation',
      name: 'Rozměry a montáž',
      category: 'Ergonomie & Umístění',
      importance: 'recommended',
      rationale: 'Ověření rozměrů pro umístění v prostoru a manipulační prostor pro servis. Otázka pro vás: Máte omezený prostor pro uskladnění nebo transport v autě?',
      icon: '📐',
      suggestedComponent: 'chips',
      suggestedValues: [
          'Kompaktní rozměry pro snadné umístění bez nutnosti stavebních úprav',
          'Standardní rozměry odpovídající běžným evropským normám',
          'Velkorysé rozměry s důrazem na maximální vnitřní objem',
        ],
    },
    {
      id: 'controls_ui',
      name: 'Způsob ovládání',
      category: 'Uživatelský komfort',
      importance: 'recommended',
      rationale: 'Dotyková tlačítka a displeje mohou selhávat v chladu, vlhku nebo při ovládání v rukavicích. Otázka pro vás: Preferujete jednoduchá nerozbitná tlačítka, nebo chytré digitální funkce?',
      icon: '📱',
      suggestedComponent: 'chips',
      suggestedValues: [
          'Intuitivní fyzická mechanická tlačítka a otočné voliče (spolehlivost a ovládání poslepu)',
          'Moderní dotykový displej s přehlednou grafikou a českým menu',
          'Chytré ovládání přes mobilní aplikaci a Wi-Fi / Bluetooth',
        ],
    },
    {
      id: 'energy_efficiency',
      name: 'Provozní náklady',
      category: 'Ekonomika provozu',
      importance: 'recommended',
      rationale: 'Levný produkt s vysokou spotřebou a drahým spotřebním materiálem vyjde po 2 letech provozu dráž než prémiový úsporný model. Otázka pro vás: Záleží vám na minimalizaci dlouhodobých provozních nákladů?',
      icon: '🌿',
      suggestedComponent: 'chips',
      suggestedValues: [
          'Nejvyšší energetická třída A (minimální spotřeba elektřiny a vody)',
          'Vyvážená energetická třída B/C s výhodným poměrem ceny a provozních nákladů',
          'Základní energetická třída pro méně frekventované využití',
        ],
    },
    {
      id: 'materials_durability',
      name: 'Materiály a odolnost',
      category: 'Kvalita konstrukce',
      importance: 'mandatory',
      rationale: 'Plastové spojky a tenkostěnné kryty praskají při prvním nárazu nebo přetížení. Otázka pro vás: Bude produkt vystaven hrubšímu zacházení nebo náročnému prostředí?',
      icon: '🛡️',
      suggestedComponent: 'chips',
      suggestedValues: [
          'Prémiové kovové a nerezové komponenty s vysokou odolností proti opotřebení',
          'Kvalitní tvrzený plast a kompozitní slitiny',
          'Základní materiálové provedení s důrazem na dostupnou cenu',
        ],
    },
    {
      id: 'maintenance_service',
      name: 'Servis a náhradní díly',
      category: 'Servis & Podpora',
      importance: 'recommended',
      rationale: 'U neznačkových dovozů nelze po 2 letech sehnat ani těsnění a funkční zařízení končí ve sběrném dvoře. Otázka pro vás: Požadujete ověřenou značku se servisem a díly v ČR?',
      icon: '🔧',
      suggestedComponent: 'chips',
      suggestedValues: [
          'Snadná samoobslužná údržba a široce dostupné náhradní díly v ČR',
          'Autorizovaný servis s rychlou dostupností techniků po celé ČR',
          'Základní bezúdržbové provedení',
        ],
    },
    {
      id: 'safety_certification',
      name: 'Bezpečnost a certifikace',
      category: 'Bezpečnost',
      importance: 'preference',
      rationale: 'Chybějící tepelná pojistka nebo dětská pojistka může způsobit zkrat, požár či úraz obsluhy. Otázka pro vás: Vyžadujete certifikované jištění proti selhání a bezpečnostní atesty?',
      icon: '🔒',
      suggestedComponent: 'chips',
      suggestedValues: [
          'Špičková bezpečnostní certifikace s automatickým vypnutím a ochranou proti přetížení',
          'Standardní evropská certifikace CE a TÜV',
          'Základní bezpečnostní prvky dle platných norem',
        ],
    },
    {
      id: 'total_budget',
      name: 'Orientační rozpočet',
      category: 'Investice',
      importance: 'mandatory',
      rationale: 'Investice do kvalitnějších komponent se vrací v delší životnosti bez nutnosti opakovaného nákupu. Otázka pro vás: Jaký je váš orientační rozpočet na nákup?',
      icon: '💰',
      suggestedComponent: 'slider',
      suggestedValues: [
          'Ekonomická kategorie s nejlepším poměrem ceny a užitné hodnoty',
          'Zlatá střední třída s vyváženou kvalitou a dlouhou životností',
          'Prémiový segment bez kompromisů v materiálech a technologiích',
        ],
    },
    UNIVERSAL_BRAND_PARAMETER,
  ];

  const questions: WizardQuestion[] = [
    {
      id: 'generic_primary_usage',
      step: 1,
      title: `Jak budete "${cleanTitle}" nejčastěji používat?`,
      subtitle: 'Pomůže určit potřebnou odolnost, výbavu a dimenzování.',
      component: 'chips',
      isMultiSelect: false,
      options: [
        { label: 'Intenzivní / Poloprofesionální provoz', value: 'heavy_duty', description: 'Důraz na maximální odolnost, životnost a výkonovou rezervu.' },
        { label: 'Pravidelné rodinné / běžné použití', value: 'standard_home', description: 'Důraz na vyvážený poměr cena / výkon a spolehlivost.' },
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
      subtitle: 'Napište výrobce, které preferujete, a značky, které chcete z výběru striktně vyloučit.',
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
1. Zvaž poměr cena/výkon, spolehlivost značky a reference uživatelů z dlouhodobých testů.
2. U každého modelu uveď přesnou značku a modelové označení.
3. Poskytni technické odůvodnění srovnané s požadavky uživatele.
4. Uveď klíčová pozitiva (Pros), možná omezení (Cons) a orientační cenu v Kč.
5. Striktně respektuj zadané preferované a zakázané značky.`;

  const suggestedAlternatives: ExtractedDomainParameter[] = [
    {
      id: 'warranty_service',
      name: 'Záruka a servis',
      category: 'Spolehlivost & Podpora',
      importance: 'recommended',
      rationale: 'Dostupnost náhradních dílů, rychlost vyřízení servisu a možnost prodloužené záruky.',
      icon: '🛡️',
      suggestedComponent: 'chips',
      suggestedValues: [
          'Prodloužená 5letá až 10letá záruka od výrobce s opravou přímo u zákazníka',
          'Standardní 3letá záruka s autorizovaným servisem v ČR',
          'Zákonná 2letá záruka',
        ],
    },
    {
      id: 'noise_level_acoustic',
      name: 'Hlučnost a akustika',
      category: 'Komfort',
      importance: 'preference',
      rationale: 'Nízká provozní hlučnost vhodná pro použití v obytných a klidových prostorách.',
      icon: '🤫',
      suggestedComponent: 'chips',
      suggestedValues: [
          'Extra tichý chod (vhodné pro použití v noci a v otevřených obytných prostorech)',
          'Standardní akustická hladina běžná v dané kategorii',
          'Výkonový režim bez specifických požadavků na tichost',
        ],
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
