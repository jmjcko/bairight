export type SupportedLocale = 'cs' | 'en';

export interface Translations {
  appName: string;
  appTagline: string;
  appBadge: string;
  nav: {
    wizardTab: string;
    chatTab: string;
    newSession: string;
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
  disclaimer: string;
}

export const translations: Record<SupportedLocale, Translations> = {
  cs: {
    appName: 'bAIright',
    appTagline: 'Nakupujte správně s AI • Osobní podiatrický nákupčí bot',
    appBadge: 'AI Podiatr',
    nav: {
      wizardTab: '📝 Průvodce výběrem (Formulář)',
      chatTab: '💬 Podiatrický chat',
      newSession: 'Nové vyšetření',
    },
    wizard: {
      badge: 'Formulář & Agent-as-Markdown',
      agentSource: 'agents/shoe-recommender-agent.md',
      title: 'Biomechanický průvodce výběrem obuvi',
      subtitle: 'Sbírá kompletní anatomii, operace končetin a pravidla pro značky a předává je našemu AI agentovi.',
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
        previous: 'Zpět',
        continue: 'Pokračovat',
        evaluate: 'Vyhodnotit pomocí AI Podiatra',
        evaluating: 'Agent vyhodnocuje pravidla v agents/shoe-recommender-agent.md...',
        editAndRetest: 'Upravit profil a přetestovat',
        checkStock: 'Ověřit sklad v EU',
      },
      step1: {
        title: 'Co přesně potřebujete vybrat?',
        desc: 'Zvolte primární kategorii obuvi nebo ortopedické podpory.',
        runningTitle: 'Běžecká a tréninková obuv',
        runningDesc: 'Silniční a trailový běh s přesným tlumením nárazů a ochranou kloubů.',
        walkingTitle: 'Každodenní chůze a práce vestoje',
        walkingDesc: 'Maximální úleva od únavy nohou při chůzi, dojíždění či směnném provozu.',
        insolesTitle: 'Ortopedické vložky do bot (Připravujeme)',
        insolesDesc: 'Podpora podélné i příčné klenby a metatarzální podložky na míru.',
      },
      step2: {
        title: 'Rozměry a šířka chodidla',
        desc: 'Zásadní parametr pro prevenci tlaku na metatarzy a puchýře.',
        sizeLabel: 'Orientační velikost obuvi (EU)',
        widthLabel: 'Šířka chodidla (Kritické pro výběr 2E/4E kopyta)',
        widths: {
          standard: { label: 'Standardní (D)', desc: 'Běžná šířka nohy' },
          wide2e: { label: 'Široká (2E) ⭐', desc: 'Extra prostor ve špičce pro prsty' },
          wide4e: { label: 'Extra široká (4E)', desc: 'Maximální objem kopyta' },
          narrow: { label: 'Úzká (B)', desc: 'Štíhlé anatomické chodidlo' },
        },
      },
      step3: {
        title: 'Analýza došlapu a mechanika odrazu',
        desc: 'Určuje, zda potřebujete neutrální základnu (při supinaci) nebo jemné dynamické vedení.',
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
        desc: 'Náš agent striktně ctí zákaz značek: jakoukoliv značku na blacklistu VÁM NIKDY nedoporučí.',
        preferredLabel: 'Preferované značky (Prioritizováno agentem)',
        forbiddenLabel: 'Striktně zakázané značky (Agent má zákaz je doporučit)',
        forbiddenDesc: 'Pokud máte špatnou zkušenost např. s Nike či On, označte je zde.',
      },
      step6: {
        title: 'Zdravotní potíže, diagnózy a prodělané operace',
        desc: 'Klíčové podiatrické vstupy. Pro artrózu 3. stupně aktivují požadavek na rockerovou kolébku a drop 4–8 mm.',
        jointLabel: 'Zdravotní problémy kloubů a chodidel',
        surgeriesLabel: 'Prodělané operace a zákroky končetin',
        conditions: {
          'Knee Osteoarthritis Grade 3': 'Artróza kolene 3. stupně (Knee OA)',
          'Knee Osteoarthritis Grade 1/2': 'Artróza kolene 1./2. stupně',
          'Plantar Fasciitis (Heel Spur)': 'Plantární fascitida (patní ostruha)',
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
        prescriptionTitle: 'Klinické doporučení obuvi bAIright',
        evaluatedBy: 'Vyhodnoceno agentem',
        analysisTitle: 'Podiatrická analýza vašeho profilu',
        contraindicationsTitle: 'Klinické kontraindikace (Čemu se musíte vyhnout)',
        matchesTitle: 'Nejvhodnější doporučené modely bot',
        shoesPassedBadge: 'modelů prošlo lékařskými pravidly',
        matchScore: 'Shoda:',
      },
    },
    disclaimer: 'bAIright využívá podiatrickou biomechaniku a skenuje evropské 2E sklady. V případě akutních potíží vždy konzultujte svého lékaře či ortopeda.',
  },
  en: {
    appName: 'bAIright',
    appTagline: 'Buy Right with AI • Personal Podiatric Shoe Shopper',
    appBadge: 'AI Podiatrist',
    nav: {
      wizardTab: '📝 Intake Form (Wizard)',
      chatTab: '💬 Podiatry Chat',
      newSession: 'New Session',
    },
    wizard: {
      badge: 'Form Intake & Agent-as-Markdown',
      agentSource: 'agents/shoe-recommender-agent.md',
      title: 'Biomechanical Footwear Intake Wizard',
      subtitle: 'Collects comprehensive anatomy, surgical history, and brand rules to feed our Markdown Podiatry Agent.',
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
        evaluate: 'Evaluate with AI Podiatrist Agent',
        evaluating: 'Evaluating rules in agents/shoe-recommender-agent.md...',
        editAndRetest: 'Edit Profile & Retest',
        checkStock: 'Check EU Stock',
      },
      step1: {
        title: 'Select What You Are Looking For',
        desc: 'Choose the primary category of footwear or biomechanical support.',
        runningTitle: 'Running & Training Shoes',
        runningDesc: 'Road & trail running with calibrated shock dissipation and stability.',
        walkingTitle: 'Daily Walking & Standing',
        walkingDesc: 'Maximum fatigue relief for daily walking, commuting, or shift work.',
        insolesTitle: 'Insoles & Orthotics (Coming Soon)',
        insolesDesc: 'Custom arch supports and metatarsal pads.',
      },
      step2: {
        title: 'Foot Dimensions & Width Profile',
        desc: 'Crucial for preventing metatarsal pinching and lateral foot bulging.',
        sizeLabel: 'EU Shoe Size (Rough Reference)',
        widthLabel: 'Foot Width (Critical for 2E/4E lasts)',
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
        desc: 'Our agent strictly enforces brand bans: any brand in forbidden will NEVER be recommended.',
        preferredLabel: 'Preferred Brands (Prioritized by Agent)',
        forbiddenLabel: 'Strictly Forbidden Brands (Agent Rule: Never Recommend)',
        forbiddenDesc: 'If you had a bad experience with Nike or On, mark them here.',
      },
      step6: {
        title: 'Medical Diagnoses & Limb Surgeries',
        desc: 'Critical podiatric inputs. Triggers rocker-sole requirements and drop constraints.',
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
        prescriptionTitle: 'Clinical Footwear Prescription by bAIright',
        evaluatedBy: 'Evaluated by',
        analysisTitle: 'Podiatric Analysis of Your Profile',
        contraindicationsTitle: 'Clinical Contraindications (What You Must Avoid)',
        matchesTitle: 'Top Recommended Footwear Matches',
        shoesPassedBadge: 'models passed medical rules',
        matchScore: 'Match:',
      },
    },
    disclaimer: 'bAIright applies podiatric biomechanics & scans European 2E retail stock. Always consult your physician for official medical diagnosis.',
  },
};
