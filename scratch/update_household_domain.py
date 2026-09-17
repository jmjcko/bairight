import re

with open('src/lib/agent/domain-parameter-discovery.ts', 'r') as f:
    content = f.read()

# Add household_drinkware profile to DOMAIN_PROFILES dictionary
household_profile = '''  household_drinkware: {
    keywords: [
      'hrnek', 'hrnky', 'termohrnek', 'sklenice', 'sklenicky', 'skleničky',
      'talir', 'taliř', 'talíře', 'talire', 'nadobi', 'nádobí', 'panve', 'pánve',
      'hrnec', 'hrnce', 'kavovy hrnek', 'šálek', 'salek', 'šálky', 'salky',
      'termoska', 'lahev', 'láhev', 'konvice', 'dóza', 'doza', 'příbory', 'pribory'
    ],
    categoryName: 'Stolování, Nápoje & Kuchyňské Potřeby',
    agentName: 'Specialista na Stolování & Nápoje',
    icon: '☕',
    description: 'Expertní nákupní poradce pro výběr hrnků, termohrnků, nádobí a nápojového skla na základě materiálu, tepelné izolace, objemu a ergonomie.',
    parameters: [
      {
        id: 'material_type_build',
        name: 'Materiál & Zpracování',
        category: 'Materiál',
        importance: 'mandatory',
        rationale: 'Porcelán, keramika, kamenina, nerez či dvoustěnné borosilikátové sklo s vysokou mechanickou odolností.',
        icon: '🏺',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Prémiový porcelán a jemná keramika',
          'Tvrzená kamenina a masivní keramika',
          'Nerezová ocel s vakuovou dvoustěnnou izolací',
          'Borosilikátové dvoustěnné sklo (odolné tepelným šokům)',
        ],
      },
      {
        id: 'volume_capacity',
        name: 'Objem a kapacita',
        category: 'Kapacita',
        importance: 'mandatory',
        rationale: 'Přesný objem určený pro espresso (90ml), běžný čaj/kávu (350ml) nebo velký nápoj (500ml+).',
        icon: '📏',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Espresso / Lungo (90 ml – 180 ml)',
          'Standardní hrnek na kávu / čaj (300 ml – 400 ml)',
          'Velkoobjemový hrnek / termoláhev (500 ml – 750 ml)',
        ],
      },
      {
        id: 'thermal_insulation',
        name: 'Tepelná izolace',
        category: 'Funkčnost',
        importance: 'recommended',
        rationale: 'Schopnost udržet nápoj horký nebo ledový po dlouhou dobu bez pálení rukou.',
        icon: '🔥',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Standardní jednostěnný hrnek pro okamžité pití doma',
          'Dvoustěnné termo provedení (chladné na dotek, udrží teplotu 2-4 hodiny)',
          'Vakuová cestovní izolace s nepropustným uzávěrem (udrží 6-12 hodin)',
        ],
      },
      {
        id: 'dishwasher_microwave',
        name: 'Myčka & Mikrovlnka',
        category: 'Údržba',
        importance: 'mandatory',
        rationale: 'Odolnost potisku a materiálu vůči vysokým teplotám v myčce a ohřevu v mikrovlnné troubě.',
        icon: '🧽',
        suggestedComponent: 'chips',
        suggestedValues: [
          '100% vhodné do myčky i mikrovlnné trouby',
          'Vhodné do myčky (nevhodné do mikrovlnky kvůli kovovým prvkům)',
          'Pouze ruční mytí (šetrný ruční dekor / ruční výroba)',
        ],
      },
      {
        id: 'ergonomics_handle',
        name: 'Ergonomie a ucho',
        category: 'Ergonomie',
        importance: 'recommended',
        rationale: 'Pohodlné uchopení pro 3-4 prsty, protiskluzové dno a nekapající okraj.',
        icon: '✋',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Pohodlné velké ucho se stabilním úchopem',
          'Cestovní tvar bez ucha přesně do držáku v nápojovém autě',
          'Minimalistický tvar s protiskluzovým silikonovým návlekem',
        ],
      },
      {
        id: 'design_style',
        name: 'Design a styl',
        category: 'Estetika',
        importance: 'preference',
        rationale: 'Vzhledové provedení odpovídající vašemu interiéru či osobnímu stylu.',
        icon: '🎨',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Ruční autorská keramika / Žíhaná glazura',
          'Moderní minimalistický skandinávský styl',
          'Retro / Vzorovaný / Motivační design',
        ],
      },
      {
        id: 'spill_proof_lid',
        name: 'Těsnění a víčko',
        category: 'Cestování',
        importance: 'preference',
        rationale: '100% nepropustný uzávěr proti vylití nápoje v batohu či tašce.',
        icon: '🔒',
        suggestedComponent: 'chips',
        suggestedValues: [
          '100% těsnicí uzávěr s tlačítkovým otevřením jedním prstem',
          'Základní krycí víčko proti vystříknutí při chůzi',
          'Klasické provedení bez víčka pro domácí použití',
        ],
      },
      {
        id: 'durability_chip',
        name: 'Odolnost povrchu',
        category: 'Odolnost',
        importance: 'recommended',
        rationale: 'Glazura vysoce odolná proti poškrábání příborovým kovem a odprýsknutí okrajů.',
        icon: '🛡️',
        suggestedComponent: 'chips',
        suggestedValues: [
          'Vysoko pálená glazura odolná proti odštěpení okrajů',
          'Prémiový nerez / tvrzené sklo odolné pádu z malé výšky',
          'Běžná keramická glazura',
        ],
      },
      {
        id: 'total_budget',
        name: 'Orientační rozpočet',
        category: 'Rozpočet',
        importance: 'mandatory',
        rationale: 'Cenová hladina za kus pro optimální poměr kvality a ceny.',
        icon: '💰',
        suggestedComponent: 'slider',
        suggestedValues: [
          'Dostupné provedení (do 250 Kč / ks)',
          'Kvalitní střední třída (250 – 600 Kč / ks)',
          'Prémiový autorský / nerezový segment (600+ Kč / ks)',
        ],
      },
      UNIVERSAL_BRAND_PARAMETER,
    ],
    questions: [
      {
        id: 'drinkware_primary_use',
        step: 1,
        title: 'Kde budete hrnek či nádobí nejčastěji používat?',
        subtitle: 'Určí potřebnou izolaci, materiál a typ uzávěru.',
        component: 'chips',
        isMultiSelect: false,
        options: [
          { label: 'Doma & v kanceláři', value: 'home_office', description: 'Porcelán, keramika, dvoustěnné sklo. Pohodlné ucho.' },
          { label: 'Na cestách & v autě', value: 'travel_car', description: 'Nerezový termohrnek, 100% těsnění, pasuje do auto-držáku.' },
          { label: 'Outdoors & kempování', value: 'outdoor', description: 'Extrémně odolný nerez nebo smalt, nízká hmotnost.' },
        ],
        defaultValue: 'home_office',
        promptForgeTemplate: '- **Hlavní použití:** {value}',
      },
      {
        id: 'drinkware_material_pref',
        step: 2,
        title: 'Jaký materiál a vlastnosti údržby preferujete?',
        subtitle: 'Zvolte požadavky na myčku a odolnost.',
        component: 'chips',
        isMultiSelect: true,
        options: [
          { label: '100% vhodné do myčky a mikrovlnky', value: 'dishwasher_micro' },
          { label: 'Vakuová termoizolace (udrží nápoj teplý celé hodiny)', value: 'vacuum_thermo' },
          { label: 'Ruční autorská keramika / Unikátní design', value: 'artisan_design' },
        ],
        defaultValue: ['dishwasher_micro'],
        promptForgeTemplate: '- **Materiálové požadavky:** {value}',
      },
      {
        id: 'drinkware_brands',
        step: 3,
        title: 'Preferované a zakázané značky / výrobci',
        subtitle: 'Zadejte vybrané značky (např. Frank Green, Stanley, Contigo, Orion, Villeroy & Boch).',
        component: 'brands',
        isMultiSelect: false,
        defaultValue: { preferred: '', forbidden: '' },
        promptForgeTemplate: '- **Značky:** {value}',
      },
      {
        id: 'drinkware_budget',
        step: 4,
        title: 'Orientační rozpočet na nákup',
        subtitle: 'Cenová hladina v Kč za kus.',
        component: 'slider',
        sliderConfig: { min: 100, max: 2500, step: 50, unit: 'Kč', defaultValue: 450 },
        defaultValue: 450,
        promptForgeTemplate: '- **Rozpočet:** do {value} Kč',
      },
    ],
    systemPrompt: `Jsi expertní nákupní rádce pro stolování, hrnky, nápoje a kuchyňské potřeby.
Doporuč přesně 3 reálné modely odpovídající zadání uživatele.
Uveď přesný materiál, objem, hlavní vlastnosti (myčka, termoizolace, těsnění), výhody, rizika a orientační cenu v Kč.`,
  },
'''

if 'household_drinkware:' not in content:
  content = content.replace('electric_cars:', household_profile + '\n  electric_cars:')
  with open('src/lib/agent/domain-parameter-discovery.ts', 'w') as f:
      f.write(content)
  print('Successfully added household_drinkware profile')
else:
  print('household_drinkware already exists')
