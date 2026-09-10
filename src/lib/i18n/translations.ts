export type SupportedLocale = 'cs' | 'en';

export interface Translations {
  appName: string;
  appTagline: string;
  appBadge: string;
  nav: {
    wizardTab: string;
    chatTab: string;
    analysisTab: string;
    catalogTab: string;
    newSession: string;
    logoProposals: string;
    searchPlaceholder: string;
  };
  wizard: {
    badge: string;
    agentSource: string;
    title: string;
    subtitle: string;
    stepIndicator: string;
    prescriptionReady: string;
    steps: {
      step1: string;
      step2: string;
      step3: string;
      step4: string;
      step5: string;
      step6: string;
    };
    buttons: {
      previous: string;
      continue: string;
      evaluate: string;
      evaluating: string;
      editAndRetest: string;
      checkStock: string;
      resetForm: string;
    };
    step1: {
      title: string;
      desc: string;
      runningTitle: string;
      runningDesc: string;
      walkingTitle: string;
      walkingDesc: string;
      insolesTitle: string;
      insolesDesc: string;
    };
    step2: {
      title: string;
      desc: string;
      sizeLabel: string;
      lengthMmLabel: string;
      lengthMmHint: string;
      widthMmLabel: string;
      widthMmHint: string;
      widthLabel: string;
      widths: {
        standard: { label: string; desc: string };
        wide2e: { label: string; desc: string };
        wide4e: { label: string; desc: string };
        narrow: { label: string; desc: string };
      };
    };
    step3: {
      title: string;
      desc: string;
      strikeLabel: string;
      strikes: {
        heel: { label: string; desc: string };
        midfoot: { label: string; desc: string };
        forefoot: { label: string; desc: string };
      };
      rollLabel: string;
      rolls: {
        supination: { label: string; desc: string };
        neutral: { label: string; desc: string };
        pronation: { label: string; desc: string };
      };
    };
    step4: {
      title: string;
      activityLabel: string;
      activities: {
        road: string;
        trail: string;
        walking: string;
        standing: string;
      };
      cushionLabel: string;
      cushions: {
        max: { title: string; desc: string };
        balanced: { title: string; desc: string };
        firm: { title: string; desc: string };
      };
    };
    step5: {
      title: string;
      desc: string;
      preferredLabel: string;
      forbiddenLabel: string;
      forbiddenDesc: string;
    };
    step6: {
      title: string;
      desc: string;
      jointLabel: string;
      surgeriesLabel: string;
      conditions: Record<string, string>;
      surgeries: Record<string, string>;
    };
    results: {
      prescriptionTitle: string;
      evaluatedBy: string;
      analysisTitle: string;
      contraindicationsTitle: string;
      matchesTitle: string;
      shoesPassedBadge: string;
      matchScore: string;
    };
  };
  sidebar: {
    title: string;
    subtitle: string;
    unlocked: string;
    gated: string;
    unlockedDesc: string;
    gatedDesc: string;
    metricsTitle: string;
    weight: { label: string; desc: string };
    width: { label: string; desc: string };
    strike: { label: string; desc: string };
    knee: { label: string; desc: string };
    injuries: { label: string; desc: string };
    missing: string;
    noneReported: string;
    directiveTitle: string;
    directiveText: string;
  };
  tools: {
    executedTitle: string;
    forumTitle: string;
    forumDesc: string;
    eshopTitle: string;
    eshopDesc: string;
    executed: string;
    querying: string;
  };
  chat: {
    evaluating: string;
    quickPrompts: string;
    inputPlaceholder: string;
    footerDisclaimer: string;
  };
  analysis: {
    badge: string;
    title: string;
    subtitle: string;
    footDimensions: string;
    kneeLoad: string;
    kneeCondition: string;
    rockerRequirement: string;
    footRotation: string;
    supinationLabel: string;
    contraindicationNoPost: string;
    simulationBadge: string;
    protectionTitle: string;
    point1Title: string;
    point1Desc: string;
    point2Title: string;
    point2Desc: string;
    point3Title: string;
    point3Desc: string;
    telemetryFooter: string;
    backToWizard: string;
    goToCatalog: string;
  };
  catalog: {
    badge: string;
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    allBrands: string;
    itemCount: string;
    inStockEu: string;
    consultInChat: string;
    openChatBtn: string;
    backToWizard: string;
  };
  disclaimer: string;
}

export const translations: Record<SupportedLocale, Translations> = {
  cs: {
    appName: 'bAIright',
    appTagline: 'Nakupujte správně s AI • Osobní podiatrický nákupčí bot',
    appBadge: 'AI Asistent',
    nav: {
      wizardTab: 'Výběr obuvi',
      chatTab: 'Podiatrický chat',
      analysisTab: 'Analýza pohybu',
      catalogTab: 'Katalog obuvi',
      newSession: 'Nové vyšetření',
      logoProposals: 'Návrhy loga',
      searchPlaceholder: 'Hledat model, kopyto...',
    },
    wizard: {
      badge: 'Formulář & Biomechanická analýza',
      agentSource: 'agents/shoe-recommender-agent.md',
      title: 'Biomechanický průvodce výběrem obuvi',
      subtitle: 'Sbírá kompletní anatomii, operace končetin a pravidla pro značky a předává je našemu AI asistentovi.',
      stepIndicator: 'Krok:',
      prescriptionReady: 'Doporučení připraveno',
      steps: {
        step1: '1. Produkt',
        step2: '2. Rozměry',
        step3: '3. Došlap',
        step4: '4. Využití',
        step5: '5. Značky',
        step6: '6. Zdraví & Operace',
      },
      buttons: {
        previous: 'Předchozí krok',
        continue: 'Pokračovat',
        evaluate: 'Vyhodnotit pomocí AI Asistenta',
        evaluating: 'Asistent vyhodnocuje parametry v agents/shoe-recommender-agent.md...',
        editAndRetest: 'Upravit zadání dotazníku',
        checkStock: 'Ověřit sklad v EU',
        resetForm: 'Reset formuláře',
      },
      step1: {
        title: 'Co přesně potřebujete vybrat?',
        desc: 'Zvolte primární kategorii obuvi nebo ortopedické podpory.',
        runningTitle: 'Běžecká a tréninková obuv',
        runningDesc: 'Silniční a trailový běh s přesným tlumením nárazů a šetřením kloubů.',
        walkingTitle: 'Každodenní chůze a práce vestoje',
        walkingDesc: 'Maximální úleva od únavy nohou při chůzi, dojíždění či směnném provozu.',
        insolesTitle: 'Ortopedické vložky do bot (Připravujeme)',
        insolesDesc: 'Podpora podélné i příčné klenby a metatarzální podložky na míru.',
      },
      step2: {
        title: 'Rozměry chodidla a typická velikost',
        desc: 'Zásadní parametry: přesná délka a šířka v milimetrech zajistí ideální prostor v kopytu a nulový tlak na klouby.',
        sizeLabel: 'Typická nakupovaná velikost obuvi (EU)',
        lengthMmLabel: 'Délka chodidla (v mm / cm)',
        lengthMmHint: 'Měřeno od paty k nejdelšímu prstu při plném došlapu',
        widthMmLabel: 'Šířka chodidla v nejširším místě (v mm)',
        widthMmHint: 'Změřte obrys v oblasti záprstních kloubů (metatarzů)',
        widthLabel: 'Kategorie šířky kopyta (Biomechanický standard)',
        widths: {
          standard: { label: 'Standardní (D)', desc: 'Běžná šířka nohy' },
          wide2e: { label: 'Široká (2E) ⭐', desc: 'Extra prostor ve špičce pro prsty' },
          wide4e: { label: 'Extra široká (4E)', desc: 'Maximální objem kopyta' },
          narrow: { label: 'Úzká (B)', desc: 'Štíhlé anatomické chodidlo' },
        },
      },
      step3: {
        title: 'Analýza došlapu a mechanika odrazu',
        desc: 'Určuje, zda potřebujete neutrální základnu (při supinaci) nebo dynamické vedení.',
        strikeLabel: 'Typ došlapu (první kontakt se zemí)',
        strikes: {
          heel: { label: 'Došlap na patu', desc: 'Dopad přes patní kost (vyžaduje zkosenou patu a vysoké tlumení)' },
          midfoot: { label: 'Došlap na střed chodidla', desc: 'Rovnoměrný dopad pod klenbu' },
          forefoot: { label: 'Došlap na špičku / bříška', desc: 'Dopad vpředu na hlavičky metatarzů' },
        },
        rollLabel: 'Vedení a rotace chodidla',
        rolls: {
          supination: { label: 'Supinace (došlap na vnější hranu) ⭐', desc: 'Vyžaduje neutrální širokou platformu, striktně BEZ vnitřního klínu!' },
          neutral: { label: 'Neutrální', desc: 'Vyvážený a přirozený pohyb chodidla' },
          pronation: { label: 'Mírná pronace (propad dovnitř)', desc: 'Chodidlo se při zátěži mírně stáčí do vnitřní klenby' },
        },
      },
      step4: {
        title: 'Využití, povrch a preference tlumení',
        activityLabel: 'Kde budete boty nejčastěji používat?',
        activities: {
          road: 'Silnice / Asfalt',
          trail: 'Trail / Přírodní terén',
          walking: 'Běžná chůze',
          standing: 'Celodenní stání v práci',
        },
        cushionLabel: 'Požadovaná míra a pocit tlumení',
        cushions: {
          max: { title: 'Maximální plyšové (Plush)', desc: 'Nejvyšší vrstva pěny pro maximální šetření kloubů' },
          balanced: { title: 'Vyvážené (Medium)', desc: 'Rozumný kompromis mezi tlumením a stabilitou' },
          firm: { title: 'Pevné / Responzivní', desc: 'Tužší odezva s lepším citem pro povrch' },
        },
      },
      step5: {
        title: 'Správa značek: Oblíbené a zakázané (Blacklist)',
        desc: 'Náš asistent striktně ctí zákaz značek: jakoukoliv značku na blacklistu VÁM NIKDY nedoporučí.',
        preferredLabel: 'Preferované značky (Prioritizováno systémem)',
        forbiddenLabel: 'Striktně zakázané značky (Asistent má zákaz je doporučit)',
        forbiddenDesc: 'Pokud máte špatnou zkušenost např. s Nike či On, označte je zde.',
      },
      step6: {
        title: 'Zdravotní potíže, diagnózy a prodělané operace',
        desc: 'Klíčové biometrické vstupy. Pro artrózu 3. stupně aktivují požadavek na rockerovou kolébku a drop 4–8 mm.',
        jointLabel: 'Zdravotní problémy kloubů a chodidel',
        surgeriesLabel: 'Prodělané operace a zákroky končetin',
        conditions: {
          'Knee Osteoarthritis Grade 3': 'Artróza kolene 3. stupně (Gonartróza)',
          'Knee Osteoarthritis Grade 1/2': 'Artróza kolene 1./2. stupně',
          'Plantar Fasciitis (Heel Spur)': 'Plantární fasciitida (patní ostruha)',
          'Hallux Valgus (Bunions)': 'Vbočený palec (Hallux Valgus)',
          'Mortons Neuroma': 'Mortonův neurom (bolest mezi prsty)',
          'Achilles Tendonitis': 'Zánět Achillovy šlachy',
          'None': 'Žádné zdravotní potíže',
        },
        surgeries: {
          'Meniscus Partial Resection': 'Operace menisku (resekce / sešití)',
          'ACL Reconstruction': 'Plastika předního zkříženého vazu (ACL)',
          'Ankle Ligament Surgery': 'Operace vazů kotníku',
          'Total Knee/Hip Replacement': 'Totální endoprotéza kolene / kyčle (TEP)',
          'None': 'Žádné operace',
        },
      },
      results: {
        prescriptionTitle: 'Doporučený výběr vhodné obuvi bAIright',
        evaluatedBy: 'Vyhodnoceno asistentem',
        analysisTitle: 'Biomechanická analýza vašeho profilu',
        contraindicationsTitle: 'Biomechanická omezení (Čemu se vyhnout)',
        matchesTitle: 'Nejvhodnější doporučené modely bot',
        shoesPassedBadge: 'modelů splnilo biomechanická kritéria',
        matchScore: 'Shoda:',
      },
    },
    sidebar: {
      title: 'Biometrický profil',
      subtitle: 'Vstupní formulář',
      unlocked: 'Vyhledávací nástroje odemčeny',
      gated: 'Vyhledávací nástroje uzamčeny',
      unlockedDesc: 'Všech 5 klíčových parametrů získáno. Vyhledávání v evropských skladech 2E obuvi povoleno.',
      gatedDesc: 'AI asistent se doptá na chybějící parametry před zahájením vyhledávání v katalozích.',
      metricsTitle: 'Klíčové parametry',
      weight: { label: 'Tělesná hmotnost', desc: 'Kalibrace hustoty mezipodešve' },
      width: { label: 'Šířka chodidla', desc: 'Ověření šířky 2E / 4E' },
      strike: { label: 'Došlap a vedení', desc: 'Zátěž vnější vs. vnitřní hrany' },
      knee: { label: 'Stav kolen', desc: 'Filtr rockerové geometrie' },
      injuries: { label: 'Prodělaná zranění a operace', desc: 'Kontrola kontraindikací' },
      missing: 'Chybí',
      noneReported: 'Nehlášeno',
      directiveTitle: 'Doporučení pro artrózu kolene 3. st.',
      directiveText: 'U pokročilé artrózy kolene je doporučena bota s kolébkovou podešví (rocker), vysokou absorpcí rázů, dropem 4–8 mm a poctivou šířkou 2E pro snížení tlaku na patelofemorální kloub.',
    },
    tools: {
      executedTitle: 'Provedené externí nástroje agenta',
      forumTitle: 'Konzensus běžecké komunity',
      forumDesc: 'Prohledána fóra Reddit r/RunningShoeGeeks, RunRepeat & DoctorOfRunning',
      eshopTitle: 'Sken evropských 2E skladů',
      eshopDesc: 'Skenováno Top4Running, RunningWarehouse EU, 21run & Zalando (2E)',
      executed: 'Dokončeno',
      querying: 'Vyhledávám...',
    },
    chat: {
      evaluating: 'bAIright vyhodnocuje biometrický profil...',
      quickPrompts: 'Rychlé dotazy:',
      inputPlaceholder: 'Zadejte své potíže, preference obuvi, šířku chodidla či stav kloubů...',
      footerDisclaimer: 'bAIright aplikuje podiatrickou biomechaniku a ověřuje evropské 2E sklady. V případě akutních potíží vždy konzultujte lékaře či fyzioterapeuta.',
    },
    analysis: {
      badge: 'Kinetický model těla • Telemetrie v2.4',
      title: 'Analýza pohybu a kinetického řetězce',
      subtitle: 'Přímé biomechanické vyhodnocení sil, zátěže kloubů a úhlu došlapu z vašeho biometrického profilu.',
      footDimensions: 'Délka & Šířka chodidla',
      kneeLoad: 'Zatížení kolenní chrupavky',
      kneeCondition: 'Artróza kolene 3. st.',
      rockerRequirement: 'Požadavek na rocker podrážku a drop 4–8 mm',
      footRotation: 'Stav rotace chodidla',
      supinationLabel: 'Supinace (Vnější hrana)',
      contraindicationNoPost: 'Kontraindikace: Zákaz pronačních klínů',
      simulationBadge: '3D SIMULACE TLAKU V KOLENI',
      protectionTitle: 'Jak bAIright chrání vaše klouby před opotřebením:',
      point1Title: 'Eliminace patellofemorálního tlaku:',
      point1Desc: 'Snížením dropu na 4–8 mm dochází k narovnání osy holenní kosti, což redukuje tření v kolenní štěrbině až o 23%.',
      point2Title: 'Kolébkový přechod (Rocker Geometry):',
      point2Desc: 'Zakřivení přední části podrážky přebírá práci za ztuhlé klouby prstů a ulevuje kolenním extenzorům při odrazu.',
      point3Title: 'Prostor pro kosti záprstí (2E Last):',
      point3Desc: 'Šířka kopyta zabraňuje stlačení cév a nervů (Mortonova neuralgie) i deformitě vbočeného palce.',
      telemetryFooter: 'Biomechanický výpočet optimalizovaný pro ochranu pohybového aparátu.',
      backToWizard: 'Zpět do výběru obuvi',
      goToCatalog: 'Zobrazit doporučené modely v katalogu',
    },
    catalog: {
      badge: 'Databáze 2E & Rocker modelů',
      title: 'Katalog doporučené obuvi',
      subtitle: 'Ověřené modely se širokým kopytem 2E, kolébkovou geometrií a certifikací pro ochranu kolenních kloubů.',
      searchPlaceholder: 'Filtrovat podle modelu, diagnózy nebo vlastnosti...',
      allBrands: 'Všechny značky',
      itemCount: 'Zobrazeno {count} modelů obuvi se širokým kopytem 2E.',
      inStockEu: 'Skladem v EU',
      consultInChat: 'Potřebujete poradit s konkrétním kopytem?',
      openChatBtn: 'Otevřít Podiatrický chat',
      backToWizard: 'Zpět do výběru obuvi',
    },
    disclaimer: 'Veškerá doporučení a výpočty mají výhradně informativní a orientační charakter. Systém neprovádí lékařskou diagnostiku a nenahrazuje odborné vyšetření lékařem či ortopedem.',
  },
  en: {
    appName: 'bAIright',
    appTagline: 'Buy Right with AI • Personal Podiatric Shoe Shopper',
    appBadge: 'AI Assistant',
    nav: {
      wizardTab: 'Footwear Selection',
      chatTab: 'Podiatry Chat',
      analysisTab: 'Gait Analysis',
      catalogTab: 'Shoe Catalog',
      newSession: 'New Session',
      logoProposals: 'Logo Concepts',
      searchPlaceholder: 'Search model, last width...',
    },
    wizard: {
      badge: 'Form Intake & Biomechanical Analysis',
      agentSource: 'agents/shoe-recommender-agent.md',
      title: 'Biomechanical Footwear Intake Wizard',
      subtitle: 'Collects comprehensive anatomy, surgical history, and brand rules to feed our AI Podiatry Assistant.',
      stepIndicator: 'Step:',
      prescriptionReady: 'Prescription Ready',
      steps: {
        step1: '1. Product',
        step2: '2. Foot Sizing',
        step3: '3. Gait & Strike',
        step4: '4. Activity',
        step5: '5. Brands',
        step6: '6. Health & Surgeries',
      },
      buttons: {
        previous: 'Previous',
        continue: 'Continue',
        evaluate: 'Evaluate with AI Assistant',
        evaluating: 'Assistant is evaluating rules in agents/shoe-recommender-agent.md...',
        editAndRetest: 'Edit Questionnaire Inputs',
        checkStock: 'Check EU Stock',
        resetForm: 'Reset Form',
      },
      step1: {
        title: 'Select What You Are Looking For',
        desc: 'Choose the primary category of footwear or biomechanical support.',
        runningTitle: 'Running & Training Shoes',
        runningDesc: 'Road & trail running with calibrated shock dissipation and joint protection.',
        walkingTitle: 'Daily Walking & Standing',
        walkingDesc: 'Maximum fatigue relief for daily walking, commuting, or shift work.',
        insolesTitle: 'Insoles & Orthotics (Coming Soon)',
        insolesDesc: 'Custom arch supports and metatarsal pads.',
      },
      step2: {
        title: 'Foot Dimensions & Size Profile',
        desc: 'Crucial biomechanical parameters: exact length and width in millimeters ensure true anatomic fit and zero metatarsal impingement.',
        sizeLabel: 'Typical Purchased Shoe Size (EU)',
        lengthMmLabel: 'Foot Length (in mm / cm)',
        lengthMmHint: 'Measured heel-to-longest-toe under full body weight',
        widthMmLabel: 'Foot Width at Widest Metatarsal Point (in mm)',
        widthMmHint: 'Circumference or caliper width at ball of foot',
        widthLabel: 'Last Width Category (Biomechanic Standard)',
        widths: {
          standard: { label: 'Standard (D)', desc: 'Regular fit' },
          wide2e: { label: 'Wide (2E) ⭐', desc: 'Extra room in toe-box' },
          wide4e: { label: 'Extra Wide (4E)', desc: 'Maximum volume' },
          narrow: { label: 'Narrow (B)', desc: 'Slim anatomical foot' },
        },
      },
      step3: {
        title: 'Gait Analysis & Strike Mechanics',
        desc: 'Determines whether you need neutral platforms or gentle dynamic guidance.',
        strikeLabel: 'Strike Pattern (Initial Ground Contact)',
        strikes: {
          heel: { label: 'Heel Strike', desc: 'Lands on heel first (Needs bevel & damping)' },
          midfoot: { label: 'Midfoot Strike', desc: 'Lands evenly under the arch' },
          forefoot: { label: 'Forefoot Strike', desc: 'Lands forward on balls of feet' },
        },
        rollLabel: 'Foot Roll / Mechanics',
        rolls: {
          supination: { label: 'Supination (Underpronation) ⭐', desc: 'Rolls on outer edge. Requires neutral wide base, strictly no medial post!' },
          neutral: { label: 'Neutral', desc: 'Even, balanced inward roll' },
          pronation: { label: 'Mild Overpronation', desc: 'Rolls slightly inward into the arch' },
        },
      },
      step4: {
        title: 'Activity Type & Cushioning Profile',
        activityLabel: 'Intended Activities (Select all that apply)',
        activities: {
          road: 'Road Running',
          trail: 'Trail / Nature',
          walking: 'Daily Walking',
          standing: 'Shift Work / Standing',
        },
        cushionLabel: 'Cushioning Density Preference',
        cushions: {
          max: { title: 'Maximum Plush', desc: 'Highest stack & shock absorption' },
          balanced: { title: 'Balanced', desc: 'Moderate stack with road feel' },
          firm: { title: 'Responsive / Firm', desc: 'Snappy ground feedback' },
        },
      },
      step5: {
        title: 'Brand Preferences & Absolute Blacklist',
        desc: 'Our assistant strictly enforces brand bans: any brand in forbidden will NEVER be recommended.',
        preferredLabel: 'Preferred Brands (Prioritized by System)',
        forbiddenLabel: 'Strictly Forbidden Brands (Assistant Rule: Never Recommend)',
        forbiddenDesc: 'If you had a bad experience with Nike or On, mark them here.',
      },
      step6: {
        title: 'Medical Diagnoses & Limb Surgeries',
        desc: 'Critical biomechanical inputs. Triggers rocker-sole requirements and drop constraints.',
        jointLabel: 'Joint & Foot Conditions',
        surgeriesLabel: 'Past Surgeries & Structural Interventions',
        conditions: {
          'Knee Osteoarthritis Grade 3': 'Knee Osteoarthritis Grade 3',
          'Knee Osteoarthritis Grade 1/2': 'Knee Osteoarthritis Grade 1/2',
          'Plantar Fasciitis (Heel Spur)': 'Plantar Fasciitis (Heel Spur)',
          'Hallux Valgus (Bunions)': 'Hallux Valgus (Bunions)',
          'Mortons Neuroma': 'Morton\'s Neuroma',
          'Achilles Tendonitis': 'Achilles Tendonitis',
          'None': 'None',
        },
        surgeries: {
          'Meniscus Partial Resection': 'Meniscus Partial Resection',
          'ACL Reconstruction': 'ACL Reconstruction',
          'Ankle Ligament Surgery': 'Ankle Ligament Surgery',
          'Total Knee/Hip Replacement': 'Total Knee/Hip Replacement',
          'None': 'None',
        },
      },
      results: {
        prescriptionTitle: 'Recommended Footwear Selection by bAIright',
        evaluatedBy: 'Evaluated by',
        analysisTitle: 'Biomechanical Analysis of Your Profile',
        contraindicationsTitle: 'Biomechanical Contraindications (What You Must Avoid)',
        matchesTitle: 'Top Recommended Footwear Matches',
        shoesPassedBadge: 'models passed biomechanical rules',
        matchScore: 'Match:',
      },
    },
    sidebar: {
      title: 'Biomechanical Profile',
      subtitle: 'Clinical Podiatry Intake',
      unlocked: 'Search Tools Unlocked',
      gated: 'Search Tools Gated',
      unlockedDesc: 'All 5 mandatory parameters collected. European 2E stock scans authorized.',
      gatedDesc: 'AI assistant will autonomously query missing items before searching external inventories.',
      metricsTitle: 'Mandatory Metrics',
      weight: { label: 'Body Weight', desc: 'Foam density calibration' },
      width: { label: 'Foot Width', desc: '2E Wide verification' },
      strike: { label: 'Gait & Strike', desc: 'Lateral vs medial load' },
      knee: { label: 'Knee Condition', desc: 'Rocker geometry filter' },
      injuries: { label: 'Past Injuries', desc: 'Contraindications check' },
      missing: 'Missing',
      noneReported: 'None Reported',
      directiveTitle: 'Grade 3 Knee OA Directive',
      directiveText: 'For Grade 3 Knee Osteoarthritis, shoes must feature an early-stage rocker sole, maximum compliant foam, a 4–8mm drop, and a genuine 2E wide platform to disperse axial impact and minimize patellofemoral torque.',
    },
    tools: {
      executedTitle: 'Executed External Agent Tools',
      forumTitle: 'Running Community Consensus',
      forumDesc: 'Queried Reddit r/RunningShoeGeeks, RunRepeat & DoctorOfRunning',
      eshopTitle: 'European E-Shop 2E Scanner',
      eshopDesc: 'Scanned Top4Running, RunningWarehouse EU, 21run & Zalando (Wide 2E)',
      executed: 'Executed',
      querying: 'Querying...',
    },
    chat: {
      evaluating: 'bAIright is evaluating biomechanical profile...',
      quickPrompts: 'Quick Prompts:',
      inputPlaceholder: 'Type your symptoms, shoe preferences, foot width, or joint conditions...',
      footerDisclaimer: 'bAIright applies podiatric biomechanics & scans European 2E retail stock. Always consult your physician for medical diagnosis.',
    },
    analysis: {
      badge: 'Kinetic Body Model • Telemetry v2.4',
      title: 'Movement Analysis & Kinetic Chain',
      subtitle: 'Direct biomechanical evaluation of joint loads, force vectors, and foot strike angles from your profile.',
      footDimensions: 'Foot Length & Width',
      kneeLoad: 'Knee Cartilage Stress',
      kneeCondition: 'Grade 3 Knee Osteoarthritis',
      rockerRequirement: 'Rocker sole & 4–8 mm drop required',
      footRotation: 'Foot Rotation State',
      supinationLabel: 'Supination (Lateral Edge)',
      contraindicationNoPost: 'Contraindication: No medial posting',
      simulationBadge: '3D KNEE PRESSURE SIMULATION',
      protectionTitle: 'How bAIright protects your joints from wear:',
      point1Title: 'Patellofemoral Pressure Reduction:',
      point1Desc: 'Lowering drop to 4–8 mm aligns the tibial axis, reducing patellofemoral cartilage friction by up to 23%.',
      point2Title: 'Rocker Sole Geometry:',
      point2Desc: 'Curved forefoot reduces toe extension demands and relieves knee extensor loads during push-off.',
      point3Title: 'Metatarsal Room (2E Last):',
      point3Desc: 'Appropriate width prevents nerve compression (Morton\'s neuroma) and bunion pressure.',
      telemetryFooter: 'Biomechanical calculation calibrated for joint preservation.',
      backToWizard: 'Back to Footwear Selection',
      goToCatalog: 'View Recommended Models in Catalog',
    },
    catalog: {
      badge: '2E & Rocker Database',
      title: 'Recommended Shoe Catalog',
      subtitle: 'Verified footwear with 2E wide lasts, rocker geometry, and knee joint protection certifications.',
      searchPlaceholder: 'Filter by model, diagnosis, or spec...',
      allBrands: 'All Brands',
      itemCount: 'Showing {count} footwear models with 2E wide fitting.',
      inStockEu: 'In Stock in EU',
      consultInChat: 'Need tailored fitting advice?',
      openChatBtn: 'Open Podiatry Chat',
      backToWizard: 'Back to Footwear Selection',
    },
    disclaimer: 'All recommendations and calculations are strictly for informational and guidance purposes. The system does not provide medical diagnosis and does not replace specialist medical examination.',
  },
};
