import re

with open("src/lib/agent/domain-parameter-discovery.ts", "r", encoding="utf-8") as f:
    text = f.read()

# 1. Update smartphones parameters
smartphones_old = """  smartphones: {
    categoryName: 'Chytré Telefony & Mobilní Technologie',
    agentName: 'Specialista na Chytré Telefony & Mobilní Ekosystémy',
    icon: '📱',
    description: 'Nezávislý nákupní poradce pro výběr chytrých telefonů. Analyzuje velikost snímače fotoaparátu (OIS), délku softwarové podpory, ochranu zraku PWM a výdrž baterie.',
    keywords: ['mobil', 'mobilni telefon', 'smartphone', 'telefon', 'iphone', 'samsung', 'pixel', 'xiaomi', 'android'],
    parameters: [
      {
        id: 'phone_form_factor_ecosystem',
        name: 'Formát a velikost telefonu',
        category: 'Kategorie & Ekosystém',
        importance: 'mandatory',
        rationale: 'Základní tržní zařazení. Kompaktní telefony se vejdou do kapsy a ovládají se jednou rukou, velké displeje jsou skvělé na práci a média, ohebné telefony nabízejí unikátní konstrukci. Volba mezi iOS (Apple) a Androidem (Google, Samsung) určuje kompatibilitu s vašimi stávajícími hodinkami a počítačem. Otázka pro vás: Preferujete kompaktní telefon, velký displej nebo ohebný model a jaký systém používáte?',
        icon: '📱',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Kompaktní vlajková loď do 6.2" (snadné ovládání jednou rukou)',
          'Velký prémiový fotomobil 6.7"+ s periskopickým zoomem',
          'Ohebný smartphone (Flip do kapsy / Fold s velkým vnitřním displejem)',
          'Ekosystém Apple iOS (iPhone)',
          'Ekosystém Android (Google Pixel, Samsung Galaxy, Xiaomi)'
        ],
      },
      {
        id: 'phone_display_pwm',
        name: 'Ochrana zraku (PWM)',
        category: 'Ergonomie & Zrak',
        importance: 'mandatory',
        rationale: 'Mnoho moderních OLED displejů bliká na nízké frekvenci (PWM 240–480 Hz), což u citlivých uživatelů způsobuje pálení očí, únavu a migrény. Vysokofrekvenční PWM (nad 1920 Hz) chrání zrak. Hmotnost nad 220 g navíc unavuje malíček při dlouhém držení. Otázka pro vás: Býváte citliví na bolesti očí při čtení z mobilu za šera?',
        icon: '👁️',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Displej šetrný k očím s vysokofrekvenčním PWM stmíváním (nad 1920 Hz) / DC dimming',
          'Lehká konstrukce pod 190 g pro pohodlné držení bez únavy',
          'Standardní OLED displej'
        ],
      },
      {
        id: 'phone_camera_sensor',
        name: 'Hlavní fotoaparát (OIS)',
        category: 'Fotoaparát',
        importance: 'mandatory',
        rationale: 'Počet megapixelů je marketingový trik. O reálné kvalitě fotek rozhoduje fyzická velikost snímače (1 palec nebo velký 1/1.3" senzor) a optická stabilizace OIS, která zabrání rozmazání snímků dětí a pohybu za šera. Otázka pro vás: Fotíte často v interiéru, večer a v horším osvětlení bez blesku?',
        icon: '📸',
        suggestedComponent: 'chips',
        suggestedValues: ['Špičkový velký fotosenzor s OIS pro dokonalé noční fotky bez šumu', 'Kvalitní standardní fotoaparát na momentky za denního světla'],
      },
      {
        id: 'phone_os_support',
        name: 'Délka aktualizací OS',
        category: 'Životnost & Bezpečnost',
        importance: 'mandatory',
        rationale: 'Telefon bez bezpečnostních záplat je zranitelný při bankovních transakcích a po 2 letech na něj přestanou vycházet aplikace. Výrobci jako Google Pixel, Samsung a Apple garantují 7 let plných aktualizací. Otázka pro vás: Plánujete telefon používat 4 a více let?',
        icon: '🛡️',
        suggestedComponent: 'chips',
        suggestedValues: ['Dlouhá softwarová podpora 5–7 let (dlouhodobá investice)', 'Stačí běžná podpora 2–3 roky'],
      },
      {
        id: 'phone_battery_charging',
        name: 'Baterie a nabíjení',
        category: 'Baterie & Nabíjení',
        importance: 'recommended',
        rationale: 'Rychlé 65W+ nabíjení doplní energii z 0 na 80 % za 20 minut, zatímco pomalé nabíjení trvá hodinu a půl. Standard Qi2 přináší magnetické bezdrátové nabíjení v autě i na nočním stolku. Otázka pro vás: Potřebujete celodenní intenzivní výdrž a rychlé doplnění energie během ranní hygieny?',
        icon: '⚡',
        suggestedComponent: 'chips',
        suggestedValues: ['Baterie 5000+ mAh s rychlým nabíjením 65W+ a bezdrátovým Qi', 'Běžné nabíjení postačí'],
      },
      {
        id: 'phone_display_refresh',
        name: 'Frekvence displeje (Hz)',
        category: 'Displej',
        importance: 'recommended',
        rationale: 'Panel s adaptivní frekvencí 1–120 Hz nabízí dokonale plynulé scrollování a čtení textu bez trhání a při statickém textu sníží frekvenci na 1 Hz, což radikálně šetří baterii.',
        icon: '✨',
        suggestedComponent: 'chips',
        suggestedValues: ['Adaptivní LTPO displej 1–120 Hz', 'Standardní 60Hz panel'],
      },
      {
        id: 'phone_resistance_ip68',
        name: 'Odolnost a vodotěsnost',
        category: 'Odolnost',
        importance: 'recommended',
        rationale: 'Certifikace IP68 zaručuje přežití telefonu při náhodném pádu do vany, louže či bazénu a chrání proti vniknutí jemného prachu do konektorů.',
        icon: '💧',
        suggestedComponent: 'chips',
        suggestedValues: ['Plná vodotěsnost IP68 (odolá ponoření do vody)', 'Základní odolnost proti stříkající vodě'],
      },
      {
        id: 'phone_storage_ram',
        name: 'Kapacita úložiště a RAM',
        category: 'Paměť & Výkon',
        importance: 'recommended',
        rationale: 'Základní 128GB úložiště se při natáčení 4K rodinných videí a ukládání fotek zaplní během prvního roku a telefon začne hlásit nedostatek místa. Paměťové karty už většina vlajkových lodí nepodporuje.',
        icon: '💾',
        suggestedComponent: 'chips',
        suggestedValues: ['256 GB nebo 512 GB interní paměť (jistota do budoucna)', 'Základních 128 GB postačí'],
      },
      {
        id: 'phone_telephoto_zoom',
        name: 'Optický zoom (Teleobjektiv)',
        category: 'Fotoaparát & Zoom',
        importance: 'recommended',
        rationale: 'Digitální výřez z hlavního snímače zrní a maže detaily. Fyzický periskopický teleobjektiv přiblíží vzdálené objekty, sport a portréty s přirozeně rozostřeným pozadím.',
        icon: '🔭',
        suggestedComponent: 'chips',
        suggestedValues: ['Vyžaduji dedikovaný 3x až 5x optický teleobjektiv', 'Stačí hlavní fotoaparát a širokoúhlý'],
      },
      UNIVERSAL_BRAND_PARAMETER,
    ],"""

smartphones_new = """  smartphones: {
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
        rationale: 'Mnoho moderních OLED displejů bliká na nízké frekvenci (PWM 240–480 Hz), což u citlivých uživatelů způsobuje pálení očí, únavu a migrény. Vysokofrekvenční PWM (nad 1920 Hz) chrání zrak. Otázka pro vás: Býváte citliví na bolesti očí při čtení z mobilu za šera?',
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
    ],"""

if smartphones_old in text:
    text = text.replace(smartphones_old, smartphones_new)
    print("Updated smartphones domain!")
else:
    print("WARNING: smartphones_old not found in text exactly!")

# 2. Update buildCustomAgentFromParameters option parser
old_opt_marker = "const options = (param.suggestedValues && param.suggestedValues.length > 0)"
start_idx = text.find(old_opt_marker)
if start_idx != -1:
    end_idx = text.find("tunedQuestions.push({", start_idx)
    replacement = """const options = (param.suggestedValues && param.suggestedValues.length > 0)
      ? param.suggestedValues.map((v) => {
          const parenMatch = v.match(/^([^(]+?)\\s*\\(([^)]+)\\)$/);
          if (parenMatch) {
            return {
              label: parenMatch[1].trim(),
              description: parenMatch[2].trim(),
              value: parenMatch[1].toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''),
            };
          }
          const colonMatch = v.match(/^([^:]+?)\\s*:\\s*(.+)$/);
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

    """
    text = text[:start_idx] + replacement + text[end_idx:]
    print("Updated buildCustomAgentFromParameters option parsing!")
else:
    print("WARNING: old_opt_marker not found!")

with open("src/lib/agent/domain-parameter-discovery.ts", "w", encoding="utf-8") as f:
    f.write(text)

print("Saved domain-parameter-discovery.ts")
