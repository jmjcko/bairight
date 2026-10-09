export type SupportedLocale = 'cs' | 'en';

export interface Translations {
  appName: string;
  appTagline: string;
  appBadge: string;
  theme: {
    light: string;
    dark: string;
    system: string;
    mode: string;
  };
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
      desc: string;
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
  header: {
    wizardTab: string;
    chatTab: string;
    modelConnected: string;
    modelDisconnected: string;
    connectBtn: string;
    settingsBtn: string;
    modelConnectedDesc: string;
    modelDisconnectedDesc: string;
    ragMemory: string;
    manageBtn: string;
    ragFactsDesc: string;
    openWizardBtn: string;
    activeAgentTitle: string;
    changeBtn: string;
    storedAgentsTitle: string;
    noStoredAgents: string;
    createInWizardBtn: string;
  };
  launcher: {
    badge: string;
    heroTitle: string;
    heroSubtitle: string;
    searchPlaceholder: string;
    btnStart: string;
    btnResearching: string;
    btnBuilding: string;
    popularTitle: string;
    researchedTitle: string;
    researchedSubtitle: string;
    selectedCount: string;
    allSelectedHint: string;
    btnCreateWizard: string;
    addCustomPlaceholder: string;
    btnAddCustom: string;
    btnSuggestMore: string;
    btnResetParams: string;
    myAgentsTitle: string;
    deleteAllAgents: string;
    deleteAgentConfirm: string;
    deleteAllAgentsConfirm: string;
    tabActiveMissions: string;
    tabPurchasedHistory: string;
    btnMarkPurchased: string;
    btnRestoreActive: string;
    emptyPurchasedTitle: string;
    emptyPurchasedDesc: string;
    purchasedBadge: string;
  };
  brandSelector: {
    preferredTitle: string;
    forbiddenTitle: string;
    preferredBadgeSelected: string;
    preferredBadgeOpen: string;
    forbiddenBadgeSelected: string;
    forbiddenBadgeNone: string;
    preferredPlaceholder: string;
    forbiddenPlaceholder: string;
    clearRestrictions: string;
    openSelectionHint: string;
    strictRulesHint: string;
  };
  dynamicWizard: {
    stepIndicator: string;
    btnPrevious: string;
    btnContinue: string;
    btnEvaluate: string;
    btnEvaluating: string;
    btnCancel: string;
    btnEdit: string;
    btnInspectPrompt: string;
    btnDownloadMarkdown: string;
    btnSave: string;
    summaryTitle: string;
    prosTitle: string;
    consTitle: string;
    reasoningTitle: string;
    priceHint: string;
    customChoiceTitle: string;
    customChoicePlaceholder: string;
    writeCustomOption: string;
    resetProgressConfirm: string;
  };

  missionSelector: {
    selectFromMyAgents: string;
    readyForTuning: string;
    historyAccount: string;
    myCreatedAgents: string;
    account: string;
    recently: string;
    active: string;
    advisorForCategory: string;
    parameters: string;
    savedDate: string;
    download: string;
    downloadTitle: string;
    deleteConfirm: string;
    deleteTitle: string;
    noAgentsTitle: string;
    noAgentsDesc: string;
    managedTemplates: string;
    templateVersion: string;
    downloadTemplate: string;
    createNewAgent: string;
  };
  dynamicWizardLoading: {
    wakingUp: string;
    loadingDetails: string;
    multipleSelection: string;
    multiselectInfo: string;
    skipChip: string;
    customChoice: string;
    communicationError: string;
    notImportant: string;
  };
  promptTuner: {
    title: string;
    subtitle: string;
    systemPromptLabel: string;
    liveEditable: string;
    resetDefault: string;
    directInfluence: string;
    directInfluenceDesc: string;
    medicalRigor: string;
    budgetStrictness: string;
    reasoningDepth: string;
    bannedBrands: string;
    strictProtection: string;
    standardTolerance: string;
    hardLimit: string;
    softLimit: string;
    detailedReasoning: string;
    compactReasoning: string;
    addBannedPlaceholder: string;
    banButton: string;
  };
  chatTab: {
    byokBadge: string;
    byokTitle: string;
    byokDesc: string;
    connectModelBtn: string;
    inputPlaceholder: string;
    sendBtn: string;
    thinking: string;
    chatError: string;
    clearChat: string;
  };
  productTour: {
    navLink: string;
    badge: string;
    modalTitle: string;
    modalSubtitle: string;
    step1Title: string;
    step1Desc: string;
    step1Pill: string;
    step2Title: string;
    step2Desc: string;
    step2Pill: string;
    step3Title: string;
    step3Desc: string;
    step3Pill: string;
    step4Title: string;
    step4Desc: string;
    step4Pill: string;
    prevBtn: string;
    nextBtn: string;
    startBtn: string;
    closeBtn: string;
    openLandingPageBtn: string;
  };
  productGuide: {
    badge: string;
    heroTitle: string;
    heroSubtitle: string;
    startAppBtn: string;
    backToAppBtn: string;
    videoBadge: string;
    videoTitle: string;
    videoSubtitle: string;
    showcaseStep1Tab: string;
    showcaseStep1Title: string;
    showcaseStep1Desc: string;
    showcaseStep1Highlight: string;
    showcaseStep2Tab: string;
    showcaseStep2Title: string;
    showcaseStep2Desc: string;
    showcaseStep2Highlight: string;
    showcaseStep3Tab: string;
    showcaseStep3Title: string;
    showcaseStep3Desc: string;
    showcaseStep3Highlight: string;
    showcaseStep4Tab: string;
    showcaseStep4Title: string;
    showcaseStep4Desc: string;
    showcaseStep4Highlight: string;
    comparisonTitle: string;
    comparisonSubtitle: string;
    colFeature: string;
    colStandard: string;
    colBairight: string;
    row1Feature: string;
    row1Standard: string;
    row1Bairight: string;
    row2Feature: string;
    row2Standard: string;
    row2Bairight: string;
    row3Feature: string;
    row3Standard: string;
    row3Bairight: string;
    row4Feature: string;
    row4Standard: string;
    row4Bairight: string;
    pillarsTitle: string;
    pillar1Title: string;
    pillar1Desc: string;
    pillar1Pill: string;
    pillar2Title: string;
    pillar2Desc: string;
    pillar2Pill: string;
    pillar3Title: string;
    pillar3Desc: string;
    pillar3Pill: string;
    pillar4Title: string;
    pillar4Desc: string;
    pillar4Pill: string;
    faqTitle: string;
    faq1Q: string;
    faq1A: string;
    faq2Q: string;
    faq2A: string;
    faq3Q: string;
    faq3A: string;
  };
  disclaimer: string;
}

export const translations: Record<SupportedLocale, Translations> = {
  cs: {
    theme: {
      light: 'Světlý',
      dark: 'Tmavý',
      system: 'Auto',
      mode: 'Režim zobrazení',
    },
    appName: 'bAIright',
    appTagline: 'Vyberte správně s AI • Osobní nákupní poradce',
    appBadge: 'AI Asistent',
    nav: {
      wizardTab: 'Průvodce nákupem',
      chatTab: 'Diskuse s agentem',
      analysisTab: 'Pohybová analýza',
      catalogTab: 'Katalog obuvi',
      newSession: 'Nová relace',
      logoProposals: 'Koncepty Loga',
      searchPlaceholder: 'Hledat model, kopyto...',
    },
    wizard: {
      badge: 'Zadání parametrů & Biomechanická analýza',
      agentSource: 'Zdroj agenta: Univerzální Nákupní Rádce bAIright v2.4',
      title: 'Průvodce výběrem ideální obuvi pro vaše klouby a došlap',
      subtitle: 'Vyplňte 6 krátkých kroků. AI vyhodnotí biomechaniku vašeho došlapu a vyfiltruje certifikované 2E modely s rocker podrážkou.',
      stepIndicator: 'Krok {current} z {total}',
      prescriptionReady: 'Preskripce obuvi vygenerována',
      steps: {
        step1: 'Účel obuvi',
        step2: 'Rozměry & Šířka',
        step3: 'Došlap & Pronace',
        step4: 'Zátěž & Tlumení',
        step5: 'Značky & Rozpočet',
        step6: 'Kloubní komfort',
      },
      buttons: {
        previous: 'Zpět',
        continue: 'Pokračovat',
        evaluate: 'Vygenerovat návrhy obuvi',
        evaluating: 'AI vyhodnocuje parametry...',
        editAndRetest: 'Upravit zadání a přetestovat',
        checkStock: 'Ověřit skladovou dostupnost',
        resetForm: 'Nové zadání',
      },
      step1: {
        title: 'Pro jaký hlavní účel obuv hledáte?',
        desc: 'Zvolte primární aktivitu. Algoritmus upraví požadované tlumení a torzní tuhost mezipodešve.',
        runningTitle: 'Běh po silnici & asfaltu',
        runningDesc: 'Vysoká nárazová zátěž, nutné tlumení pěnami s vysokou návratností energie.',
        walkingTitle: 'Chůze, les & zpevněné cesty',
        walkingDesc: 'Stabilita a trakce, širší základna podešve pro jistý došlap na nerovnostech.',
        insolesTitle: 'Celodenní stání v práci / Home Office',
        insolesDesc: 'Prevence únavy beder a patní ostruhy (Plantar Fasciitis), maximální komfort.',
      },
      step2: {
        title: 'Velikost chodidla & Požadovaná šířka kopyta (2E / 4E)',
        desc: 'Pro správnou funkci rocker sole a prevenci útlaku prstů je klíčový dostatečný prostor v prstové části.',
        sizeLabel: 'Obvyklá velikost obuvi (EU)',
        lengthMmLabel: 'Délka chodidla (mm)',
        lengthMmHint: 'Měřeno od paty k nejdelšímu prstu s ponožkou.',
        widthMmLabel: 'Šířka chodidla v nejširším místě (mm)',
        widthMmHint: 'Měřeno napříč přes prstní klouby (metatarzy).',
        widthLabel: 'Požadovaná šířka kopyta',
        widths: {
          standard: { label: 'Standardní (D)', desc: 'Běžná šířka obuvi bez útlaku prstů' },
          wide2e: { label: 'Široká 2E (Wide)', desc: 'Doporučeno při otocích, širším kopytu nebo bolesti kloubů' },
          wide4e: { label: 'Extra široká 4E (Extra Wide)', desc: 'Pro výrazně široké chodidlo, haluxy nebo vložky' },
          narrow: { label: 'Užší (B / Narrow)', desc: 'Pro úzká kopyta vyžadující pevné sevření' },
        },
      },
      step3: {
        title: 'Typ došlapu & Pronační zakřivení',
        desc: 'Správné vedení paty zabraňuje stáčení kotníku dovnitř a chrání kolenní chrupavku před smykovým napětím.',
        strikeLabel: 'Oblast prvního kontaktu s podložkou',
        strikes: {
          heel: { label: 'Došlap přes patu (Heel Strike)', desc: 'Vyžaduje vyšší drop (8–12 mm) a tlumení patního klínu.' },
          midfoot: { label: 'Došlap na střed chodidla (Midfoot)', desc: 'Ideální pro rocker podrážku s nízkým dropem (4–8 mm).' },
          forefoot: { label: 'Došlap na špičku (Forefoot Strike)', desc: 'Běh přes špičku, vyžaduje flexibilitu v metatarzech.' },
        },
        rollLabel: 'Stáčení kotníku při zatížení (Pronace / Supinace)',
        rolls: {
          supination: { label: 'Supinace (Vnější hrana)', desc: 'Došlap po vnější hraně, vyšší tuhost klenby, nutné max tlumení.' },
          neutral: { label: 'Neutralita (Rovný došlap)', desc: 'Rovnoměrné rozložení tlaku, bez nutnosti pronační podpory.' },
          pronation: { label: 'Pronace (Vnitřní stáčení)', desc: 'Kotník se hroutí dovnitř, doporučena širší platforma (NE tvrdý klin).' },
        },
      },
      step4: {
        title: 'Týdenní objem zátěže & Požadovaná úroveň tlumení',
        desc: 'Vyšší objem kilometrů vyžaduje odolnější mezipodešev s dlouhou životností komprese.',
        activityLabel: 'Předpokládaný týdenní nájezd',
        activities: {
          road: 'Do 15 km / týden (Rekreační)',
          trail: '15–35 km / týden (Pravidelný trénink)',
          walking: '35–60 km / týden (Intenzivní objem)',
          standing: '60+ km / týden (Maratonská příprava)',
        },
        cushionLabel: 'Úroveň tlumení mezipodešve',
        cushions: {
          max: { title: 'Maximální tlumení (Max Cushioning)', desc: 'Maximální objem kompresní pěny pro maximální ochranu kloubů.' },
          balanced: { title: 'Vyvážené tlumení (Balanced)', desc: 'Kompromis mezi kompresním komfortem a odezvou při odrazu.' },
          firm: { title: 'Firmní / Odezva (Responsive)', desc: 'Tužší mezipodešev pro rychlé tempo a přímý kontakt.' },
        },
      },
      step5: {
        title: 'Preferované a Zakázané značky obuvi & Rozpočet',
        desc: 'Filtrujte pouze výrobce s ověřenou kvalitou kopyt a nastavitelným cenovým stropem.',
        preferredLabel: 'Preferované značky (Priorita ve výsledcích)',
        forbiddenLabel: 'Zakázané / Vyloučené značky',
        forbiddenDesc: 'Značky, které nechcete vidět v doporučeních.',
      },
      step6: {
        title: 'Kloubní komfort, Bolesti & Způsobilost',
        desc: 'Doporučení bude přímo přizpůsobeno prevenci bolestí beder, kolen a pat.',
        jointLabel: 'Citlivé klouby & Diagnostikované potíže',
        surgeriesLabel: 'Historie operací či úrazů',
        conditions: {
          knee_oa: 'Gonartróza / Bolesti kolen při zátěži',
          plantar: 'Plantární fasciitida / Bolest patní ostruhy',
          back: 'Bolesti bederní páteře při stání/chůzi',
          bunions: 'Vbočený palec (Hallux Valgus)',
        },
        surgeries: {
          meniscus: 'Operace menisku / Plastika vazů',
          achilles: 'Zánět Achillovy šlachy',
          none: 'Bez předchozích chirurgických zákroků',
        },
      },
      results: {
        prescriptionTitle: 'Certifikovaná Preskripce Obuvi v2.4',
        evaluatedBy: 'Vyhodnoceno expertním agentem bAIright RAG',
        analysisTitle: 'Biomechanický posudek & Doporučení',
        contraindicationsTitle: 'Kontraindikace & Bezpečnostní varování',
        matchesTitle: 'Doporučené modely obuvi (Shoda s profilem)',
        shoesPassedBadge: '{count} modelů splňuje kritéria 2E & Rocker',
        matchScore: 'Shoda {score}%',
      },
    },
    sidebar: {
      title: 'Biomechanický Profil',
      subtitle: 'Osobní nastavení došlapu',
      unlocked: 'Odeknuto',
      gated: 'Uzamčeno',
      unlockedDesc: 'Preskripce obuvi aktivní',
      gatedDesc: 'Vyplňte nákupního průvodce',
      metricsTitle: 'Metriky Došlapu',
      weight: { label: 'Hmotnost', desc: 'Nárazový vektor' },
      width: { label: 'Kopyto', desc: 'Šířka klenby' },
      strike: { label: 'Došlap', desc: 'Kontakt s silnicí' },
      knee: { label: 'Klouby', desc: 'Stav kolenního kloubu' },
      injuries: { label: 'Diagnózy', desc: 'Zdravotní profily' },
      missing: 'Chybí',
      noneReported: 'Bez nahlášených potíží',
      directiveTitle: 'Směrnice pro Gonartrózu st. 3',
      directiveText: 'Při pokročilé gonartróze kolene musí obuv obsahovat rocker sole, tlumení s vysokou poddajností pěny, drop 4–8 mm a široké kopyto 2E.',
    },
    tools: {
      executedTitle: 'Spuštěné expertní nástroje agenta',
      forumTitle: 'Analýza komunitního konsenzu',
      forumDesc: 'Dotázána fóra Reddit r/RunningShoeGeeks, RunRepeat & DoctorOfRunning',
      eshopTitle: 'Skener evropských e-shopů 2E',
      eshopDesc: 'Naskenovány zásoby Top4Running, RunningWarehouse EU & 21run (Šířka 2E)',
      executed: 'Spuštěno',
      querying: 'Dotazuji...',
    },
    chat: {
      evaluating: 'bAIright vyhodnocuje biomechanický profil...',
      quickPrompts: 'Rychlé dotazy:',
      inputPlaceholder: 'Napište své symptomy, preference obuvi, šířku chodidla nebo stav kloubů...',
      footerDisclaimer: 'bAIright aplikuje podiatrickou biomechaniku & skenuje evropské 2E zásoby. Zdravotní potíže vždy konzultujte s lékařem.',
    },
    analysis: {
      badge: 'Kinetický Model Těla • Telemetrie v2.4',
      title: 'Pohybová Analýza & Kinetický Řetězec',
      subtitle: 'Přímé biomechanické vyhodnocení kloubní zátěže, sílových vektorů a úhlů došlapu.',
      footDimensions: 'Rozměry & Šířka Chodidla',
      kneeLoad: 'Zátěž Kolenní Chrupavky',
      kneeCondition: 'Gonartróza Kolenního Kloubu III. stupně',
      rockerRequirement: 'Vyžadován kolébkový přechod & drop 4–8 mm',
      footRotation: 'Stav Rotace Chodidla',
      supinationLabel: 'Supinace (Vnější hrana)',
      contraindicationNoPost: 'Kontraindikace: Zákaz vnitřního klinu',
      simulationBadge: '3D SIMULACE TLAKU V KOLENI',
      protectionTitle: 'Jak bAIright chrání vaše klouby před opotřebením:',
      point1Title: 'Snížení tlaku na čéšku:',
      point1Desc: 'Nízký drop (4–8 mm) vyrovnává osu holenní kosti a snižuje tření v kloubu až o 23%.',
      point2Title: 'Geometrie Kolébkové Podrážky (Rocker Sole):',
      point2Desc: 'Zakulacená špička snižuje nároky na extenzi prstů a ulevuje úponům při odrazu.',
      point3Title: 'Prostor pro metatarzy (2E Kopyto):',
      point3Desc: 'Dostatečná šířka brání stlačení nervových zakončení (Mortonova neuroma).',
      telemetryFooter: 'Biomechanický výpočet kalibrován pro ochranu kloubního aparátu.',
      backToWizard: 'Zpět do průvodce výběrem',
      goToCatalog: 'Zobrazit doporučené modely v katalogu',
    },
    catalog: {
      badge: 'Databáze 2E & Rocker Obuvi',
      title: 'Katalog Doporučené Obuvi',
      subtitle: 'Ověřená obuv se širokým 2E kopytem, rocker geometrií a certifikací pro ochranu kolen.',
      searchPlaceholder: 'Filtrovat podle modelu, diagnózy či specifikace...',
      allBrands: 'Všechny značky',
      itemCount: 'Zobrazeno {count} modelů obuvi se širokým kopytem 2E.',
      inStockEu: 'Skladem v EU',
      consultInChat: 'Potřebujete poradit s výběrem?',
      openChatBtn: 'Otevřít Podiatrický Chat',
      backToWizard: 'Zpět do průvodce výběrem',
    },
    header: {
      wizardTab: 'Průvodce nákupem',
      chatTab: 'Diskuse s agentem',
      modelConnected: 'Model Připojen',
      modelDisconnected: 'Model Nepřipojen',
      connectBtn: 'Připojit',
      settingsBtn: 'Nastavení',
      modelConnectedDesc: 'Aktivní: {provider}. Živá diskuse běží přes vaše předplatné.',
      modelDisconnectedDesc: 'Pro diskusi je nutné připojit AI model (BYOK).',
      ragMemory: 'RAG Paměť',
      manageBtn: 'Správa klíčů',
      ragFactsDesc: '{count} preferenčních faktů vloženo do kontextu.',
      openWizardBtn: 'Otevřít Průvodce Nákupem',
      activeAgentTitle: 'Aktivní agent pro diskusi',
      changeBtn: 'Přepnout',
      storedAgentsTitle: 'Uložení agenti na vašem účtu:',
      noStoredAgents: 'Na svém účtu zatím nemáte uloženého žádného nákupního agenta.',
      createInWizardBtn: 'Vytvořit agenta v průvodci',
    },
    launcher: {
      badge: 'Intelligent Shopping Advisor & Explorer',
      heroTitle: 'Co si dnes přejete koupit?',
      heroSubtitle: 'Zadejte libovolný produkt a společně navrhneme nákupního agenta na míru.',
      searchPlaceholder: 'např. Kancelářská ergonomická židle, dětská koloběžka, kávovar, běžecké boty...',
      btnStart: 'Začít',
      btnResearching: 'Zjišťuji...',
      btnBuilding: 'Sestavuji...',
      popularTitle: 'Nebo vyberte z oblíbených nákupních agentů:',
      researchedTitle: 'Klíčová rozhodovací kritéria pro:',
      researchedSubtitle: 'Vychází z komunitních fór, rozborů a technických specifikací. Upravte si parametry:',
      selectedCount: 'Vybráno {selected} z {total} parametrů',
      allSelectedHint: 'Všechny parametry jsou aktivní pro vygenerování průvodce.',
      btnCreateWizard: 'Pokračovat k vytvoření průvodce ({count} parametrů)',
      addCustomPlaceholder: 'Přidat vlastní parametr (např. Vhodné pro alergiky, Hlučnost)...',
      btnAddCustom: 'Přidat parametr',
      btnSuggestMore: 'Navrhnout další parametry',
      btnResetParams: 'Obnovit parametry',
      myAgentsTitle: 'Moje vytvořené nákupní agenty',
      deleteAllAgents: 'Smazat všechny agenty',
      deleteAgentConfirm: 'Opravdu si přejete smazat tohoto agenta ze své knihovny?',
      deleteAllAgentsConfirm: 'Opravdu si přejete smazat všechny uložené nákupní agenty?',
      tabActiveMissions: 'Aktivní nákupy',
      tabPurchasedHistory: 'Zakoupeno & Historie',
      btnMarkPurchased: 'Zakoupeno',
      btnRestoreActive: 'Vrátit mezi aktivní',
      emptyPurchasedTitle: 'Zatím žádné zakoupené položky',
      emptyPurchasedDesc: 'Až nákup dokončíte, označte agenta tlačítkem Zakoupeno. Přesune se vám přehledně sem do historie.',
      purchasedBadge: 'Zakoupeno',
    },
    brandSelector: {
      preferredTitle: 'Preferované značky (prioritní):',
      forbiddenTitle: 'Zakázané / vyloučené značky (vyhýbat se):',
      preferredBadgeSelected: '{count} vybráno',
      preferredBadgeOpen: 'Otevřený výběr',
      forbiddenBadgeSelected: '{count} vyloučeno',
      forbiddenBadgeNone: 'Bez omezení',
      preferredPlaceholder: 'např. DeLonghi, Sage, Jura, Philips (napište a oddělte čárkou)...',
      forbiddenPlaceholder: 'např. Sencor, Silvercrest, generic (napište a oddělte čárkou)...',
      clearRestrictions: 'Vyčistit omezení značek',
      openSelectionHint: 'Bez omezení značek — asistent vyhodnotí všechny kvalitní značky na trhu.',
      strictRulesHint: 'Asistent bude striktně vymáhat pravidla preferovaných a zakázaných značek.',
    },
    dynamicWizard: {
      stepIndicator: 'Krok {current} z {total}',
      btnPrevious: 'Předchozí krok',
      btnContinue: 'Pokračovat',
      btnEvaluate: 'Dokončit a sestavit agenta',
      btnEvaluating: 'Sestavuji agenta...',
      btnCancel: 'Zavřít / Zahodit progress',
      btnEdit: 'Upravit wizard',
      btnInspectPrompt: 'Zkontrolovat prompt pro AI',
      btnDownloadMarkdown: 'Stáhnout agenta (.md)',
      btnSave: 'Uložit',
      summaryTitle: 'Souhrn & Expertní posudek',
      prosTitle: 'Klíčové výhody & Proč koupit',
      consTitle: 'Kompromisy & Na co si dát pozor',
      reasoningTitle: 'Odůvodnění doporučení expertů',
      priceHint: 'Cena na trhu',
      customChoiceTitle: 'Vlastní specifická volba:',
      customChoicePlaceholder: 'Napište vlastní odpověď nebo upřesnění...',
      writeCustomOption: 'Napsat vlastní možnost (jiný specifický požadavek)...',
      resetProgressConfirm: 'Opravdu si přejete opustit průvodce a zrušit rozpracované zadání?',
    },

    missionSelector: {
      selectFromMyAgents: 'Vybrat z mých vytvořených agentů',
      readyForTuning: 'Připraven k detailnímu výběru či ladění',
      historyAccount: 'Historicky vytvoření agenti vašeho účtu ({userName})',
      myCreatedAgents: 'Moji vytvoření agenti',
      account: 'Účet:',
      recently: 'Nedávno',
      active: 'Aktivní',
      advisorForCategory: 'Nákupní poradce pro kategorii {category}',
      parameters: 'parametrů',
      savedDate: 'Uloženo:',
      download: 'Stáhnout',
      downloadTitle: 'Stáhnout {name} jako soubor .agent.md',
      deleteConfirm: 'Opravdu chcete smazat agenta "{name}" z vašeho účtu?',
      deleteTitle: 'Smazat agenta z účtu',
      noAgentsTitle: 'Zatím žádní vytvoření agenti',
      noAgentsDesc: 'Pod účtem {userName} zatím nemáte vytvořeného žádného nákupního agenta. Zadejte produkt výše a vytvořte si prvního agenta na míru.',
      managedTemplates: 'Oficiální doporučené šablony ({count})',
      templateVersion: 'Šablona v{version}',
      downloadTemplate: 'Stáhnout šablonu {name}',
      createNewAgent: 'Nadefinovat nového agenta zadáním produktu nahoře',
    },
    dynamicWizardLoading: {
      wakingUp: 'Probouzím agenta a načítám profil...',
      loadingDetails: 'Načítám zkalibrované váhy parametrů, profilovou RAG paměť a připravuji Agent Delivery Hub...',
      multipleSelection: 'Možno vybrat více',
      multiselectInfo: 'Můžete vybrat více možností (Multiselect)',
      skipChip: 'Přeskočit tento krok • Nemám vyhraněnou preferenci',
      customChoice: 'Vlastní specifická volba:',
      communicationError: 'Chyba při komunikaci s vyhodnocovacím agentem.',
      notImportant: 'Není důležité',
    },
    promptTuner: {
      title: 'Živý AI Prompt Tuner & Guardrails',
      subtitle: 'Vylaďte instrukce a mantinely pro doporučovacího agenta.',
      systemPromptLabel: 'Systémový prompt agenta:',
      liveEditable: 'ŽIVĚ UPRAVITELNÉ',
      resetDefault: 'Obnovit výchozí',
      directInfluence: 'Přímý vliv na generování',
      directInfluenceDesc: 'Jakákoliv úprava textu výše okamžitě mění uvažování agenta při generování doporučení v pravém panelu.',
      medicalRigor: 'Klinická přísnost došlapu & kopyta',
      budgetStrictness: 'Striktnost rozpočtu (Cenový strop)',
      reasoningDepth: 'Hloubka odůvodnění (Reasoning)',
      bannedBrands: 'Negativní prompt (Zakázané značky)',
      strictProtection: 'Striktní anatomická ochrana',
      standardTolerance: 'Běžná tolerance',
      hardLimit: 'Tvrdý strop (ani korunu navíc)',
      softLimit: 'Tolerance ±15%',
      detailedReasoning: 'Detailní biomechanické zdůvodnění',
      compactReasoning: 'Kompaktní souhrn',
      addBannedPlaceholder: 'Přidat další zákaz (např. Nike, Hoka)...',
      banButton: 'Zakázat',
    },
    chatTab: {
      byokBadge: 'Diskuse s agentem • Vyžaduje vlastní model (BYOK)',
      byokTitle: 'Propojte své AI předplatné pro živou diskusi',
      byokDesc: 'Pro vedení neomezené hloubkové diskuse nad vybraným produktem zadejte svůj API klíč (Google Gemini, OpenAI, Anthropic).',
      connectModelBtn: 'Zadat API klíč (BYOK)',
      inputPlaceholder: 'Zeptejte se agenta na cokoliv ohledně parametrů a výběru...',
      sendBtn: 'Odeslat',
      thinking: 'Agent přemýšlí...',
      chatError: 'Došlo k chybě při spojení s AI konzultantem.',
      clearChat: 'Vyčistit historii konverzace',
    },
    disclaimer: 'Veškerá doporučení a výpočty mají výhradně informativní a orientační charakter. Systém neprovádí lékařskou diagnostiku a nenahrazuje odborné vyšetření lékařem či ortopedem.',
    productTour: {
      navLink: 'Jak to funguje',
      badge: 'Průvodce architekturou',
      modalTitle: 'Poznejte sílu bAIright',
      modalSubtitle: 'Osobní nákupní konzultant a prompt inženýr nové generace bez komerčních vlivů.',
      step1Title: '100% Nezávislost bez sponzorovaných pozic',
      step1Desc: 'Tradiční srovnávače cen a vyhledávače upřednostňují e-shopy s nejvyšší provizí. bAIright funguje na principu přísné objektivity – analyzuje pouze fyzické a technické parametry produktů bez reklam.',
      step1Pill: 'Architektura: Objektivní AI',
      step2Title: 'Parametrická diagnostika a syntéza promptu',
      step2Desc: 'Místo vágních dotazů vás systém provede strukturovaným wizardem (došlap, rozměry, účel, rozpočet). Výsledkem je detailně sestavený prompt zkonstruovaný dle pokročilého prompt inženýrství.',
      step2Pill: 'Engine: Diagnostický Wizard',
      step3Title: 'RAG Paměťové jádro s dlouhodobou kontinuitou',
      step3Desc: 'Systém si pamatuje vaše anatomické parametry, cenové limity a averze ke značkám. Nemusíte je opakovat v každé konverzaci. Svá uložená fakta máte kdykoliv pod plnou kontrolou v Paměťové kapsli.',
      step3Pill: 'Paměť: Kontextová perzistence',
      step4Title: 'BYOK a Zero-Knowledge bezpečnost',
      step4Desc: 'Zvolte si libovolný model (Google Gemini, OpenAI GPT-4o, Anthropic Claude, lokální Ollama). Vaše API klíče se nikdy neukládají do databáze – zůstávají bezpečně v šifrovaném trezoru vašeho prohlížeče.',
      step4Pill: 'Zabezpečení: Lokální šifrovaný Vault',
      prevBtn: 'Předchozí',
      nextBtn: 'Další',
      startBtn: 'Spustit asistenta',
      closeBtn: 'Zavřít',
      openLandingPageBtn: 'Kompletní prezentace produktu',
    },
    productGuide: {
      badge: 'Prezentace & Produktový manifest',
      heroTitle: 'Konec nákupních kompromisů a manipulativních reklam',
      heroSubtitle: 'bAIright je univerzální AI nákupní poradce a prompt inženýr. Místo sponzorovaných odkazů analyzuje skutečné fyzické, biomechanické a technické parametry produktů.',
      startAppBtn: 'Spustit nákupního asistenta',
      backToAppBtn: 'Zpět do aplikace',
      videoBadge: 'Živá ukázka v akci',
      videoTitle: 'Podívejte se, jak bAIright funguje v praxi',
      videoSubtitle: 'Záznam reálného průchodu: od výběru kategorie a parametrické diagnostiky přes prompt inženýrství až po konzultaci.',
      showcaseStep1Tab: '01 Zadání a kategorie',
      showcaseStep1Title: 'Napište, co přesně chcete koupit',
      showcaseStep1Desc: 'Zadejte své přání v přirozeném jazyce nebo zvolte z doporučených oblastí. Ať už hledáte silniční maratonské boty s širokou špičkou, ergonomickou židli nebo kávovar, bAIright okamžitě dekomponuje váš nákupní záměr.',
      showcaseStep1Highlight: 'Přirozený jazyk • Okamžitá dekompozice záměru • Žádné reklamy ani sponzoring',
      showcaseStep2Tab: '02 AI Parametry',
      showcaseStep2Title: 'Automatická extrakce parametrů a spuštění průvodce',
      showcaseStep2Desc: 'bAIright identifikuje klíčové technické, biomechanické a cenové parametry specifické pro vaši kategorii. Můžete přidat vlastní parametry nebo odebrat nepotřebné a jedním kliknutím přejít k nastavení hodnot.',
      showcaseStep2Highlight: 'Specializovaná kritéria • Vlastní volitelné parametry • Nulový balast',
      showcaseStep3Tab: '03 Diagnostický průvodce',
      showcaseStep3Title: 'Vyplnění cílových hodnot a zkušeností z minulosti',
      showcaseStep3Desc: 'Projděte intuitivní dotazník krok za krokem. Zadejte předchozí model, specifické požadavky na tlumení či rozměry, preferované značky i zakázané výrobce pro stoprocentní vyloučení chybného nákupu.',
      showcaseStep3Highlight: 'Srovnání s předchozím modelem • Přísné filtry značek • 100% strukturovaná data',
      showcaseStep4Tab: '04 Result Hub & Možnosti',
      showcaseStep4Title: 'Result Hub: Zvolte si, jak chcete nakalibrovaného agenta využít',
      showcaseStep4Desc: 'Po dokončení diagnostiky vám Result Hub dává maximální svobodu: (1) Spustit živou konzultaci přímo v bAIright přes BYOK, (2) Jedním kliknutím zkopírovat vyladěný prompt pro bezplatný ChatGPT, Claude či Perplexity bez nutnosti API klíče, (3) Stáhnout otevřenou .agent.md konfiguraci pro Custom GPTs či lokální agenty, nebo (4) Kdykoliv upravit wizard a zpětně doladit parametry.',
      showcaseStep4Highlight: 'Interaktivní BYOK chat • Kopírování promptu (bez API klíče) • Stažení .agent.md • Nástroje pro úpravu dotazníku',
      comparisonTitle: 'Proč tradiční vyhledávače a srovnávače selhávají',
      comparisonSubtitle: 'Rozdíl mezi placeným zprostředkovatelem a vaším nezávislým nákupním zástupcem.',
      colFeature: 'Vlastnost / Přístup',
      colStandard: 'Srovnávače & Google',
      colBairight: 'bAIright AI',
      row1Feature: 'Objektivita doporučení',
      row1Standard: 'Řazeno podle provizí (affiliate) a placených PPC pozic.',
      row1Bairight: 'Čistá parametrická analýza bez jakýchkoliv sponzorů.',
      row2Feature: 'Personalizace potřeb',
      row2Standard: 'Generické filtry, nulové porozumění biomechanice či detailům.',
      row2Bairight: 'Diagnostický wizard extrahuje přesná kritéria na míru.',
      row3Feature: 'Dlouhodobá paměť (RAG)',
      row3Standard: 'Po zavření okna se vše zapomene, musíte hledat od nuly.',
      row3Bairight: 'Atomická paměť si pamatuje vaše míry, rozpočty a preference.',
      row4Feature: 'Volba AI modelů & Soukromí',
      row4Standard: 'Uzavřený black-box sbírající data pro cílení reklamy.',
      row4Bairight: 'BYOK architektura (Gemini/OpenAI/Claude) a zero-knowledge trezor.',
      pillarsTitle: 'Čtyři technologické pilíře',
      pillar1Title: 'Parametrický Discovery Engine',
      pillar1Desc: 'Strukturovaný systém otázek a diagnostických vah, který převádí vágní přání na exaktní nákupní specifikaci.',
      pillar1Pill: 'Pilíř 1: Diagnostika',
      pillar2Title: 'RAG Paměťové jádro',
      pillar2Desc: 'Hybridní synchronizace paměťových karet přes Supabase s Row-Level Security ochranou a možností offline provozu.',
      pillar2Pill: 'Pilíř 2: Kontinuita',
      pillar3Title: 'Multi-Model Orchestrace',
      pillar3Desc: 'Možnost provozovat asistenta nad nejmodernějšími jazykovými modely s adaptivní syntézou promptů.',
      pillar3Pill: 'Pilíř 3: Inteligence',
      pillar4Title: 'Zero-Knowledge Bezpečnost',
      pillar4Desc: 'Vaše privátní API klíče a finanční limity nikdy neopustí zařízení bez vašeho vědomí.',
      pillar4Pill: 'Pilíř 4: Důvěra',
      faqTitle: 'Často kladené otázky',
      faq1Q: 'Je bAIright spojen s nějakým konkrétním e-shopem?',
      faq1A: 'Ne. bAIright je 100% nezávislý systém. Neprodává zboží ani nepřijímá provize z prodejů. Jediným cílem je vybrat produkt, který nejlépe odpovídá vašim skutečným potřebám.',
      faq2Q: 'Co znamená zkratka BYOK?',
      faq2A: 'Bring Your Own Key. Můžete si vložit vlastní bezplatný či placený API klíč pro Google Gemini, OpenAI nebo Claude. Klíč se ukládá lokálně a nikdy se neposílá na náš server.',
      faq3Q: 'Jak funguje paměťové jádro (RAG)?',
      faq3A: 'Když v průvodci zadáte např. velikost 44 nebo preferenci tichého chodu, systém si toto pravidlo zapamatuje pro budoucí konverzace. V Paměťové kapsli můžete tato fakta kdykoliv upravit či smazat.',
    },
  },
  en: {
    theme: {
      light: 'Light',
      dark: 'Dark',
      system: 'Auto',
      mode: 'Color mode',
    },
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
      agentSource: 'Agent Source: Universal Shopping Advisor bAIright v2.4',
      title: 'Wizard for Selecting Ideal Footwear for Your Joints & Stride',
      subtitle: 'Fill out 6 quick steps. AI will evaluate your stride biomechanics and filter certified 2E models with rocker sole.',
      stepIndicator: 'Step {current} of {total}',
      prescriptionReady: 'Footwear Prescription Generated',
      steps: {
        step1: 'Footwear Purpose',
        step2: 'Dimensions & Last Width',
        step3: 'Stride & Pronation',
        step4: 'Load & Cushioning',
        step5: 'Brands & Budget',
        step6: 'Joint Comfort',
      },
      buttons: {
        previous: 'Previous',
        continue: 'Continue',
        evaluate: 'Generate Shoe Proposals',
        evaluating: 'AI evaluating parameters...',
        editAndRetest: 'Edit Inputs & Retest',
        checkStock: 'Check Stock Availability',
        resetForm: 'New Form Input',
      },
      step1: {
        title: 'What is the main purpose of the footwear?',
        desc: 'Pick your primary activity. The algorithm will adjust required cushioning and midsole torsional rigidity.',
        runningTitle: 'Road Running & Asphalt',
        runningDesc: 'High impact load, requires foam cushioning with high energy return.',
        walkingTitle: 'Walking, Forest & Trail',
        walkingDesc: 'Stability and traction, wide outsole base for secure stride on uneven ground.',
        insolesTitle: 'Full-day Standing at Work / Home Office',
        insolesDesc: 'Prevention of lower back fatigue and heel spur (Plantar Fasciitis), maximum comfort.',
      },
      step2: {
        title: 'Foot Size & Required Last Width (2E / 4E)',
        desc: 'For proper rocker sole function and preventing toe pinch, adequate forefoot room is essential.',
        sizeLabel: 'Usual Shoe Size (EU)',
        lengthMmLabel: 'Foot Length (mm)',
        lengthMmHint: 'Measured from heel to longest toe wearing socks.',
        widthMmLabel: 'Foot Width at Widest Point (mm)',
        widthMmHint: 'Measured across metatarsal joint heads.',
        widthLabel: 'Required Last Width',
        widths: {
          standard: { label: 'Standard (D)', desc: 'Regular shoe width without toe pressure' },
          wide2e: { label: 'Wide 2E (Wide)', desc: 'Recommended for swelling, wide feet, or joint pain' },
          wide4e: { label: 'Extra Wide 4E (Extra Wide)', desc: 'For very wide feet, bunions, or custom orthotics' },
          narrow: { label: 'Narrow (B / Narrow)', desc: 'For narrow feet requiring snug lockdown' },
        },
      },
      step3: {
        title: 'Foot Strike Type & Pronation Roll',
        desc: 'Proper heel guidance prevents inward ankle roll and protects knee cartilage from shear torque.',
        strikeLabel: 'First Contact Zone with Ground',
        strikes: {
          heel: { label: 'Heel Strike', desc: 'Requires higher drop (8–12 mm) and heel wedge cushioning.' },
          midfoot: { label: 'Midfoot Strike', desc: 'Ideal for rocker sole with low drop (4–8 mm).' },
          forefoot: { label: 'Forefoot Strike', desc: 'Running on toes, requires metatarsal flexibility.' },
        },
        rollLabel: 'Ankle Roll Under Load (Pronation / Supination)',
        rolls: {
          supination: { label: 'Supination (Outer Edge)', desc: 'Outer edge strike, high arch rigidity, max cushioning required.' },
          neutral: { label: 'Neutral (Straight Strike)', desc: 'Even force distribution, no medial support needed.' },
          pronation: { label: 'Pronation (Inward Roll)', desc: 'Ankle collapses inward, wide platform recommended (NO hard wedge).' },
        },
      },
      step4: {
        title: 'Weekly Training Mileage & Cushioning Level',
        desc: 'Higher weekly volume requires a more durable midsole with compression longevity.',
        activityLabel: 'Expected Weekly Mileage',
        activities: {
          road: 'Under 15 km / week (Recreational)',
          trail: '15–35 km / week (Regular Training)',
          walking: '35–60 km / week (Intensive Volume)',
          standing: '60+ km / week (Marathon Prep)',
        },
        cushionLabel: 'Midsole Cushioning Level',
        cushions: {
          max: { title: 'Max Cushioning', desc: 'Maximum volume compliant foam for peak joint protection.' },
          balanced: { title: 'Balanced Cushioning', desc: 'Compromise between compression comfort and energetic rebound.' },
          firm: { title: 'Firm / Responsive', desc: 'Firmer midsole for fast tempo and direct ground feel.' },
        },
      },
      step5: {
        title: 'Preferred & Forbidden Shoe Brands & Budget',
        desc: 'Filter strictly by manufacturers with verified last fitting quality and set price caps.',
        preferredLabel: 'Preferred Brands (Priority in Results)',
        forbiddenLabel: 'Forbidden / Excluded Brands',
        forbiddenDesc: 'Brands you do not wish to see in recommendations.',
      },
      step6: {
        title: 'Joint Comfort, Pain & Medical Clearance',
        desc: 'Recommendations will be customized directly to prevent lower back, knee, and heel pain.',
        jointLabel: 'Sensitive Joints & Diagnosed Conditions',
        surgeriesLabel: 'History of Surgeries or Injuries',
        conditions: {
          knee_oa: 'Knee Osteoarthritis / Joint Pain Under Load',
          plantar: 'Plantar Fasciitis / Heel Spur Pain',
          back: 'Lower Back Pain When Standing/Walking',
          bunions: 'Bunions (Hallux Valgus)',
        },
        surgeries: {
          meniscus: 'Meniscus Surgery / ACL Reconstruction',
          achilles: 'Achilles Tendonitis',
          none: 'No Previous Surgical Procedures',
        },
      },
      results: {
        prescriptionTitle: 'Certified Footwear Prescription v2.4',
        evaluatedBy: 'Evaluated by Expert Agent bAIright RAG',
        analysisTitle: 'Biomechanical Report & Recommendations',
        contraindicationsTitle: 'Contraindications & Safety Warnings',
        matchesTitle: 'Recommended Shoe Models (Profile Match)',
        shoesPassedBadge: '{count} models meet 2E & Rocker criteria',
        matchScore: 'Match {score}%',
      },
    },
    sidebar: {
      title: 'Biomechanical Profile',
      subtitle: 'Personal Stride Settings',
      unlocked: 'Unlocked',
      gated: 'Locked',
      unlockedDesc: 'Shoe Prescription Active',
      gatedDesc: 'Complete Shopping Wizard',
      metricsTitle: 'Stride Metrics',
      weight: { label: 'Weight', desc: 'Impact Vector' },
      width: { label: 'Last Width', desc: 'Arch Width' },
      strike: { label: 'Foot Strike', desc: 'Ground Contact' },
      knee: { label: 'Joints', desc: 'Knee Joint State' },
      injuries: { label: 'Diagnoses', desc: 'Medical Profiles' },
      missing: 'Missing',
      noneReported: 'No Issues Reported',
      directiveTitle: 'Directive for Grade 3 Knee OA',
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
    header: {
      wizardTab: 'Shopping Wizard',
      chatTab: 'Agent Discussion',
      modelConnected: 'Model Connected',
      modelDisconnected: 'Model Not Connected',
      connectBtn: 'Connect',
      settingsBtn: 'Settings',
      modelConnectedDesc: 'Active: {provider}. Live discussion runs via your subscription.',
      modelDisconnectedDesc: 'Discussion requires connecting your AI model (BYOK).',
      ragMemory: 'RAG Memory',
      manageBtn: 'Manage Keys',
      ragFactsDesc: '{count} preference facts injected into system context.',
      openWizardBtn: 'Open Shopping Wizard',
      activeAgentTitle: 'Active Discussion Agent',
      changeBtn: 'Switch',
      storedAgentsTitle: 'Saved agents on your account:',
      noStoredAgents: 'You do not have any shopping agents saved on your account yet.',
      createInWizardBtn: 'Create an Agent in Wizard',
    },
    launcher: {
      badge: 'Intelligent Shopping Advisor & Explorer',
      heroTitle: 'What would you like to buy today?',
      heroSubtitle: 'Enter any product and let\'s craft a tailored shopping agent together to guide your selection.',
      searchPlaceholder: 'e.g. Ergonomic office chair, stunt scooter, espresso machine, running shoes...',
      btnStart: 'Start',
      btnResearching: 'Researching...',
      btnBuilding: 'Building...',
      popularTitle: 'Or choose from popular shopping agents:',
      researchedTitle: 'Key decision parameters for:',
      researchedSubtitle: 'Grounded in enthusiast forums, teardowns, and engineering specs. Tailor your parameters:',
      selectedCount: 'Selected {selected} of {total} parameters',
      allSelectedHint: 'All parameters are active for wizard generation.',
      btnCreateWizard: 'Proceed to Wizard Creation ({count} parameters)',
      addCustomPlaceholder: 'Add custom parameter (e.g. Allergy friendly, Noise level)...',
      btnAddCustom: 'Add Parameter',
      btnSuggestMore: 'Suggest More Parameters',
      btnResetParams: 'Reset Parameters',
      myAgentsTitle: 'My Created & Tuned Shopping Agents',
      deleteAllAgents: 'Delete All Agents',
      deleteAgentConfirm: 'Are you sure you want to delete this agent from your library?',
      deleteAllAgentsConfirm: 'Are you sure you want to delete all saved shopping agents?',
      tabActiveMissions: 'Active Missions',
      tabPurchasedHistory: 'Purchased & History',
      btnMarkPurchased: 'Purchased',
      btnRestoreActive: 'Restore to Active',
      emptyPurchasedTitle: 'No purchased items yet',
      emptyPurchasedDesc: 'When you complete a purchase, mark the shopping advisor as Purchased to archive it here.',
      purchasedBadge: 'Purchased',
    },
    brandSelector: {
      preferredTitle: 'Preferred brands (prioritized):',
      forbiddenTitle: 'Forbidden / excluded brands (strictly avoid):',
      preferredBadgeSelected: '{count} selected',
      preferredBadgeOpen: 'Open Selection',
      forbiddenBadgeSelected: '{count} excluded',
      forbiddenBadgeNone: 'No Exclusions',
      preferredPlaceholder: 'e.g. DeLonghi, Sage, Jura, Philips (type and separate with comma)...',
      forbiddenPlaceholder: 'e.g. Sencor, Silvercrest, generic (type and separate with comma)...',
      clearRestrictions: 'Clear Brand Restrictions',
      openSelectionHint: 'No brand restrictions set — the assistant will evaluate all quality brands on the market.',
      strictRulesHint: 'The assistant will strictly enforce your brand preference rules.',
    },
    dynamicWizard: {
      stepIndicator: 'Step {current} of {total}',
      btnPrevious: 'Previous Step',
      btnContinue: 'Continue',
      btnEvaluate: 'Finish & Assemble Agent',
      btnEvaluating: 'Assembling agent...',
      btnCancel: 'Cancel Wizard',
      btnEdit: 'Edit Wizard',
      btnInspectPrompt: 'Inspect Prompt',
      btnDownloadMarkdown: 'Download Agent (.md)',
      btnSave: 'Save',
      summaryTitle: 'Summary & Expert Assessment',
      prosTitle: 'Key Advantages & Why Buy',
      consTitle: 'Trade-offs & What to Watch Out For',
      reasoningTitle: 'Expert Recommendation Rationale',
      priceHint: 'Market Price',
      customChoiceTitle: 'Custom Specific Choice:',
      customChoicePlaceholder: 'Write your custom answer or specific clarification...',
      writeCustomOption: 'Write a custom option (different specific requirement)...',
      resetProgressConfirm: 'Are you sure you want to exit the wizard and discard your current progress?',
    },

    missionSelector: {
      selectFromMyAgents: 'Select from my created agents',
      readyForTuning: 'Ready for tailored selection & tuning',
      historyAccount: 'Historical agents for your account ({userName})',
      myCreatedAgents: 'My Created Agents',
      account: 'Account:',
      recently: 'Recently',
      active: 'Active',
      advisorForCategory: 'Shopping advisor for category {category}',
      parameters: 'parameters',
      savedDate: 'Saved:',
      download: 'Download',
      downloadTitle: 'Download {name} as .agent.md file',
      deleteConfirm: 'Are you sure you want to delete agent "{name}" from your account?',
      deleteTitle: 'Delete agent from account',
      noAgentsTitle: 'No created agents yet',
      noAgentsDesc: 'Under account {userName} you have no created shopping agents yet. Enter a product above to build your first tailored agent.',
      managedTemplates: 'Official recommended templates ({count})',
      templateVersion: 'Template v{version}',
      downloadTemplate: 'Download template {name}',
      createNewAgent: 'Define a new agent by entering a product above',
    },
    dynamicWizardLoading: {
      wakingUp: 'Waking up agent and loading profile...',
      loadingDetails: 'Loading calibrated parameter weights, RAG memory profile, and preparing Agent Delivery Hub...',
      multipleSelection: 'Multiple selection allowed',
      multiselectInfo: 'You can select multiple options (Multiselect)',
      skipChip: "Skip this step • No specific preference",
      customChoice: 'Custom specific choice:',
      communicationError: 'Error communicating with evaluation agent.',
      notImportant: 'Not important',
    },
    promptTuner: {
      title: 'Live AI Prompt Tuner & Guardrails',
      subtitle: 'Fine-tune system instructions and guardrails for the agent.',
      systemPromptLabel: 'Agent System Prompt:',
      liveEditable: 'LIVE EDITABLE',
      resetDefault: 'Reset to default',
      directInfluence: 'Direct influence on generation',
      directInfluenceDesc: "Any edit above immediately alters the agent's reasoning when generating recommendations in the right panel.",
      medicalRigor: 'Clinical Rigor & Anatomy Protection',
      budgetStrictness: 'Budget Strictness (Price Ceiling)',
      reasoningDepth: 'Reasoning Depth & Rigor',
      bannedBrands: 'Negative Prompt (Forbidden Brands)',
      strictProtection: 'Strict anatomical protection',
      standardTolerance: 'Standard tolerance',
      hardLimit: 'Hard limit (no overspend)',
      softLimit: 'Tolerance ±15%',
      detailedReasoning: 'Detailed biomechanical reasoning',
      compactReasoning: 'Compact summary',
      addBannedPlaceholder: 'Add exclusion (e.g. Nike, Hoka)...',
      banButton: 'Exclude',
    },
    chatTab: {
      byokBadge: 'Agent Discussion • Requires Your Own Model (BYOK)',
      byokTitle: 'Connect your AI subscription for live discussion',
      byokDesc: 'To avoid token waste and allow unlimited deep discussion about your chosen product, enter your API key (Google Gemini, OpenAI, Anthropic).',
      connectModelBtn: 'Enter API Key (BYOK)',
      inputPlaceholder: 'Ask the agent anything regarding specifications and recommendations...',
      sendBtn: 'Send',
      thinking: 'Agent is thinking...',
      chatError: 'An error occurred while connecting to the AI consultant.',
      clearChat: 'Clear Conversation History',
    },
    disclaimer: 'All recommendations and calculations are strictly for informational and guidance purposes. The system does not provide medical diagnosis and does not replace specialist medical examination.',
    productTour: {
      navLink: 'How it works',
      badge: 'Architecture Guide',
      modalTitle: 'Discover the Power of bAIright',
      modalSubtitle: 'Next-generation personal shopping consultant and prompt engineer free from commercial bias.',
      step1Title: '100% Independence Without Sponsored Listings',
      step1Desc: 'Traditional price comparison platforms and search engines prioritize retailers paying the highest commission. bAIright operates with strict objectivity—analyzing physical and technical specifications without ads.',
      step1Pill: 'Architecture: Objective AI',
      step2Title: 'Parametric Diagnostics & Prompt Synthesis',
      step2Desc: 'Instead of vague questions, a structured diagnostic wizard measures your precise criteria (fit, dimensions, purpose, budget), synthesizing a high-precision prompt based on advanced prompt engineering.',
      step2Pill: 'Engine: Diagnostic Wizard',
      step3Title: 'RAG Memory Core with Cross-Session Continuity',
      step3Desc: 'The system remembers your anatomical dimensions, budget caps, and brand aversions across categories. You never have to repeat them. Retain complete control over your facts in the Memory Capsule.',
      step3Pill: 'Memory: Context Persistence',
      step4Title: 'BYOK & Zero-Knowledge Security',
      step4Desc: 'Choose your preferred intelligence model (Google Gemini, OpenAI GPT-4o, Anthropic Claude, or local Ollama). Your API keys are never stored in any cloud database—they remain encrypted in your local browser vault.',
      step4Pill: 'Security: Local Encrypted Vault',
      prevBtn: 'Previous',
      nextBtn: 'Next',
      startBtn: 'Launch Consultant',
      closeBtn: 'Close',
      openLandingPageBtn: 'View Complete Product Showcase',
    },
    productGuide: {
      badge: 'Product Showcase & Manifesto',
      heroTitle: 'The End of Shopping Compromises & Manipulative Ads',
      heroSubtitle: 'bAIright is a universal AI shopping consultant and prompt engineer. Instead of sponsored links, it objectively analyzes authentic physical, biomechanical, and engineering specifications.',
      startAppBtn: 'Launch Shopping Assistant',
      backToAppBtn: 'Back to Application',
      videoBadge: 'Live Action Showcase',
      videoTitle: 'See How bAIright Works in Real Action',
      videoSubtitle: 'Authentic walkthrough recording: from category discovery and parametric diagnostics to compiled prompts and consultation.',
      showcaseStep1Tab: '01 Query & Category',
      showcaseStep1Title: 'Tell bAIright what you want to buy',
      showcaseStep1Desc: 'Enter any natural language query or choose from popular shopping domains. Whether it is marathon running shoes with a wide toe box, an ergonomic chair, or an espresso machine, bAIright instantly decomposes your purchase intent.',
      showcaseStep1Highlight: 'Natural language input • Instant category decomposition • No ads or sponsored bias',
      showcaseStep2Tab: '02 AI Parameters',
      showcaseStep2Title: 'Automated parameter extraction & wizard setup',
      showcaseStep2Desc: 'bAIright extracts critical technical, biomechanical, and budgetary parameters tailored to your exact product category. You can add custom criteria or remove unneeded items before launching the intake wizard.',
      showcaseStep2Highlight: 'Tailored criteria • Dynamic custom parameters • Zero unneeded questions',
      showcaseStep3Tab: '03 Diagnostic Wizard',
      showcaseStep3Title: 'Answer focused questions with baseline experience',
      showcaseStep3Desc: 'Step through an intuitive diagnostic questionnaire. Define your previous baseline products, comfort requirements, prioritized brands, and forbidden manufacturers to eliminate mismatched recommendations.',
      showcaseStep3Highlight: 'Baseline experience comparison • Strict brand filters • 100% structured criteria',
      showcaseStep4Tab: '04 Result Hub & AI Delivery',
      showcaseStep4Title: 'Result Hub: Choose how you want to deploy your calibrated agent',
      showcaseStep4Desc: 'Once diagnostic intake is complete, the Result Hub puts you in total control: (1) Launch live interactive consultation directly in bAIright using BYOK, (2) Copy the calibrated prompt with one click to use in free ChatGPT, Claude, or Perplexity without needing any API key, (3) Download the portable .agent.md specification for Custom GPTs or local agents, or (4) Revisit and fine-tune your criteria anytime.',
      showcaseStep4Highlight: 'Interactive BYOK Chat • One-click Prompt Copy (No API Key) • Portable .agent.md Download • Non-destructive Wizard Editing',
      comparisonTitle: 'Why Traditional Comparison Sites Fail',
      comparisonSubtitle: 'The definitive difference between paid middlemen and your dedicated, independent shopping representative.',
      colFeature: 'Capability / Approach',
      colStandard: 'Comparison Sites & Google',
      colBairight: 'bAIright AI',
      row1Feature: 'Recommendation Objectivity',
      row1Standard: 'Ranked by affiliate commissions and paid PPC placements.',
      row1Bairight: 'Pure parametric evaluation without any sponsorship bias.',
      row2Feature: 'Need Personalization',
      row2Standard: 'Generic filters with zero comprehension of ergonomics or nuance.',
      row2Bairight: 'Diagnostic wizard extracts tailored specifications.',
      row3Feature: 'Persistent Memory (RAG)',
      row3Standard: 'Everything forgotten when tab closes; restart from scratch.',
      row3Bairight: 'Atomic memory preserves dimensions, budgets, and preferences.',
      row4Feature: 'Model Selection & Privacy',
      row4Standard: 'Closed black-box monetizing user telemetry for ad targeting.',
      row4Bairight: 'BYOK architecture (Gemini/OpenAI/Claude) and local zero-knowledge vault.',
      pillarsTitle: 'Four Core Pillars',
      pillar1Title: 'Parametric Discovery Engine',
      pillar1Desc: 'A structured assessment weighting system translating vague aspirations into exact shopping specifications.',
      pillar1Pill: 'Pillar 1: Diagnostics',
      pillar2Title: 'RAG Memory Core',
      pillar2Desc: 'Hybrid synchronization of memory cards via Supabase with Row-Level Security and resilient offline fallback.',
      pillar2Pill: 'Pillar 2: Continuity',
      pillar3Title: 'Multi-Model Orchestration',
      pillar3Desc: 'Deploy across flagship generative reasoning models with adaptive prompt compiling.',
      pillar3Pill: 'Pillar 3: Intelligence',
      pillar4Title: 'Zero-Knowledge Security',
      pillar4Desc: 'Your private credentials and budgets remain exclusively client-side in an encrypted sandbox.',
      pillar4Pill: 'Pillar 4: Trust',
      faqTitle: 'Frequently Asked Questions',
      faq1Q: 'Is bAIright affiliated with any specific retailer?',
      faq1A: 'No. bAIright is 100% independent. We do not sell inventory or take referral kickbacks. Our sole objective is identifying products that align with your genuine needs.',
      faq2Q: 'What does BYOK mean?',
      faq2A: 'Bring Your Own Key. Connect your own free or paid API key from Google Gemini, OpenAI, or Claude. Keys are stored locally and never transmitted to our backend.',
      faq3Q: 'How does the RAG memory core work?',
      faq3A: 'When specifying size 44 or requesting low noise in a wizard, the engine retains this parameter across sessions. You can review, toggle, or delete any fact anytime in the Memory Capsule.',
    },
  },
};
