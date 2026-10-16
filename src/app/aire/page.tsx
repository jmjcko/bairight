'use client';

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface RoleCard {
  role: string;
  name: string;
  description: string;
}

interface FeatureCard {
  number: string;
  title: string;
  text: string;
}

interface SlideData {
  id: number;
  badge: string;
  tag: string;
  title: string;
  subtitle: string;
  mainTakeaway: string;
  cards?: FeatureCard[];
  roleCards?: RoleCard[];
  skillsList?: {
    category: string;
    description: string;
  }[];
  architectureFlow?: {
    step: string;
    title: string;
    desc: string;
  }[];
  keyPointsTitle?: string;
  keyPoints?: string[];
  exampleBox?: {
    title: string;
    lines: string[];
  };
  speakerNotes: string;
}

const SLIDES: SlideData[] = [
  {
    id: 1,
    badge: "01 / PRINCIP AIRE",
    tag: "SNÍMEK 1 ZE 5",
    title: "4 role a specializované AIRE Skills",
    subtitle: "Inženýrské rozdělení odpovědností místo jednoho obecného chatu",
    mainTakeaway: "Základem AIRE metodiky je rozdělení vývoje mezi 4 přesně definované role a knihovnu dovedností (Skills), které se aktivují podle typu úkolu. Každá role má své mantinely a zodpovídá za konkrétní fázi vývoje.",
    roleCards: [
      {
        role: "ARCHITECT",
        name: "Architekt řešení",
        description: "Zkoumá existující kód (brownfield inspect), vyhodnocuje závislosti, navrhuje datové toky a specifikuje komponenty před zahájením vývoje."
      },
      {
        role: "DEVELOPER",
        name: "Implementátor",
        description: "Píše kód výhradně podle schváleného plánu a metodiky TDD – nejprve vytvoří unit test, ověří jeho selhání a teprve poté implementuje funkcionalitu."
      },
      {
        role: "REVIEWER",
        name: "Bezpečnostní auditor",
        description: "Provádí nezávislý audit kvality a bezpečnosti. Zásadní pravidlo: Reviewer kód nikdy sám neupravuje, pouze vystavuje strukturovaný nález."
      },
      {
        role: "QA VALIDATOR",
        name: "Testovací inženýr",
        description: "Ověřuje celkovou funkčnost systému, spouští kompletní testovací sadu, kontroluje TypeScript a hlídá, že nevznikla žádná regrese."
      }
    ],
    skillsList: [
      {
        category: "Co je to Skill v AIRE?",
        description: "Modulární znalostní balíček s přesnými pravidly pro konkrétní doménu, který si agent načte přesně ve chvíli, kdy jej potřebuje."
      },
      {
        category: "Příklady dovedností",
        description: "Standardy moderního webu, pravidla bezpečnosti CodeGuard (ochrana API klíčů), bilingvní překlady (CZ/EN parita) či TDD postupy."
      }
    ],
    speakerNotes: "Co říct kolegům: Většina lidí používá AI jako jeden generický chat, kde se míchá vše dohromady. V AIRE metodice máme vývoj rozdělený na 4 striktní role: Architekt nejdřív zanalyzuje situaci, Dev programuje podle TDD, Reviewer kód pouze audituje (sám na něj nesmí sáhnout) a QA vše otestuje. K tomu mají agenti knihovnu specializovaných Skills, které si načítají podle potřeby. Žádný chaos, ale standardní inženýrská dělba práce."
  },
  {
    id: 2,
    badge: "02 / AUTOMATIZACE",
    tag: "SNÍMEK 2 ZE 5",
    title: "Agent řídí agenty: Nulový micromanagement",
    subtitle: "Pravidla v repozitáři řídí celý cyklus – člověk zadává záměr, AI koordinuje kroky",
    mainTakeaway: "Původní metodika vyžadovala ruční zadávání jednotlivých fází. Nastavil jsem repozitář tak, že agent v IDE si nastudoval pravidla a celou mašinérii AIRE workflows koordinuje zcela autonomně.",
    cards: [
      {
        number: "01",
        title: "Pravidla v repozitáři",
        text: "Pravidla a návody jsou uloženy přímo v repu (soubory pravidel a AGENTS.md). Agent si je při startu načte a zná přesné mantinely."
      },
      {
        number: "02",
        title: "Autonomní řetězení fází",
        text: "Zadám byznysový úkol přirozenou řečí a agent sám za sebou poskládá kroky: průzkum kódu ➔ návrh architektury ➔ TDD vývoj ➔ QA validace."
      },
      {
        number: "03",
        title: "Člověk řeší byznys, ne režii",
        text: "Nemusím hlídat, zda proběhly testy nebo code review. Inženýrskou disciplínu drží agent, já se věnuji pouze logice produktu."
      }
    ],
    architectureFlow: [
      { step: "KROK 1", title: "Zadání v češtině", desc: "Formulace záměru bez nutnosti znát technické příkazy" },
      { step: "KROK 2", title: "Autonomní sekvence", desc: "Inspect ➔ Architecture ➔ TDD Implement ➔ Review ➔ QA" },
      { step: "KROK 3", title: "Ověření testy", desc: "Spuštění 386 testů a TypeScript kontroly bez chyb" },
      { step: "KROK 4", title: "Hotový výsledek", desc: "Připravený kód v lokálním gitu a auditní report" }
    ],
    speakerNotes: "Co říct kolegům: Normálně byste museli AI složitě instruovat krok za krokem: teď buď architekt, teď buď tester. Já jsem agenta naučil pravidla tím, že jsem je uložil do repozitáře. Teď stačí napsat normální lidské zadání v češtině a agent sám na pozadí zorganizuje celý řetězec rolí a fází, od inspekce přes testy až po code review."
  },
  {
    id: 3,
    badge: "03 / TRANSPARENTNOST",
    tag: "SNÍMEK 3 ZE 5",
    title: "Vždy přesně vím, co se stalo: Auditní tabulka",
    subtitle: "Povinná vizitka v každé jedné odpovědi od AI s tvrdými fakty o kódu",
    mainTakeaway: "AI nesmí být černá skříňka. U každé úpravy kódu musí agent na konci své odpovědi předložit přehlednou tabulku s přesným soupisem provedených fází, zapojených rolí a výsledků testů.",
    cards: [
      {
        number: "01",
        title: "Přehled proběhlých fází",
        text: "Vidím jasnou stopu: která workflows proběhla (např. brownfield-inspect ➔ dev-implement ➔ qa-validate) bez nutnosti číst nepřehledné logy."
      },
      {
        number: "02",
        title: "Zapojené role",
        text: "Okamžitá kontrola, které persony pracovaly (ARCHITECT, DEV, REVIEWER nebo QA) a jaké inženýrské principy uplatnily."
      },
      {
        number: "03",
        title: "Tvrdá data z testů",
        text: "Černé na bílém: 0 chyb v TypeScriptu, 386/386 úspěšných unit testů a stav změn v lokálním git stromu."
      }
    ],
    exampleBox: {
      title: "Reálná podoba auditní tabulky na konci odpovědi agenta:",
      lines: [
        "[Workflows Executed]   aire-brownfield-inspect -> aire-dev-implement -> aire-qa-validate",
        "[Role Agents Active]   AIRE_ARCHITECT, AIRE_DEV, AIRE_QA",
        "[Quality Gates]        TypeScript: 0 chyb | Vitest: 62 souborů, 386/386 testů (100% PASS)",
        "[Local Git Control]    Změny uloženy lokálně jako necommitovaný diff (plná kontrola vývojáře)"
      ]
    },
    speakerNotes: "Co říct kolegům: Velká obava u AI je ztráta přehledu nad tím, co vlastně v projektu provedla. V našem setupu má agent přísnou povinnost: na konci každého kroku vystavit auditní tabulku. Během dvou sekund vidím, kdo na tom dělal, co proběhlo a že prošlo všech 386 testů bez jediné chyby."
  },
  {
    id: 4,
    badge: "04 / BEZPEČNOST",
    tag: "SNÍMEK 4 ZE 5",
    title: "Vývojář zůstává pánem: Dva tvrdé mantinely",
    subtitle: "Pojistky, které zabraňují nechtěným změnám a ztrátě kontroly nad projektem",
    mainTakeaway: "Vývojář se nemusí bát, že mu AI poškodí kód nebo svévolně odešle změny na server. Dva striktní mantinely garantují, že konečné slovo má vždy člověk.",
    cards: [
      {
        number: "01",
        title: "Zákaz auto-commitu a pushu",
        text: "Agent NIKDY sám necommituje ani nepushuje kód na vzdálený GitHub. Všechny úpravy zůstávají v mém počítači v lokálním gitu jako necommitovaný diff k mé osobní revizi."
      },
      {
        number: "02",
        title: "Konzultace před změnou kódu",
        text: "Když položím otázku typu \"PROČ?\" nebo chci návrh řešení, agent nesmí sáhnout do kódu. Musí nejdřív vysvětlit koncept a počkat na mé výslovné schválení."
      }
    ],
    keyPointsTitle: "Co tím vývojář a tým v praxi získávají:",
    keyPoints: [
      "100% osobní kontrola nad každým změněným řádkem před odesláním do repozitáře.",
      "Ochrana proti nechtěnému přepisování funkčního kódu při pouhých analytických dotazech.",
      "Klid a bezpečí pro tým – AI funguje jako disciplinovaný asistent, nikoliv neřízená střela."
    ],
    speakerNotes: "Co říct kolegům: Manažeři i vývojáři mívají strach, že AI nekontrolovaně přepíše kód nebo něco pushne do produkce. My máme dvě železná pravidla: Zaprvé, agent nikdy sám necommituje a nepushuje. Vše kontroluji v gitu já. Zadruhé, když se ptám na radu nebo analýzu, agent má přísně zakázáno editovat kód – musí nejdřív vysvětlit návrh a počkat, až řeknu \"Schvaluji\"."
  },
  {
    id: 5,
    badge: "05 / ARCHITEKTURA & FUNKCE",
    tag: "SNÍMEK 5 ZE 5",
    title: "Aplikace bAIright: Architektura & Klíčové funkce",
    subtitle: "Univerzální nákupní poradce a pokročilý prompt engineering engine",
    mainTakeaway: "bAIright pomáhá uživatelům vybrat komplexní produkty (od běžeckých bot po kávovary či elektromobily). Místo obecného dotazu provede hloubkový výzkum domény, zjistí skryté parametry a sestaví expertní prompt pro frontier AI modely.",
    cards: [
      {
        number: "01",
        title: "Agent Luke: Průzkum domény",
        text: "Specializovaný agent prozkoumá jakoukoliv produktovou kategorii a odhalí netriviální parametry výběru (biomechanika, materiály, technické specifikace), na které se běžný vyhledávač nezeptá."
      },
      {
        number: "02",
        title: "Dynamický nákupní průvodce",
        text: "Na základě zjištěných parametrů systém vygeneruje interaktivní vícekrokový formulář (wizard). Uživatel odpoví na klíčové otázky přizpůsobené jeho reálným potřebám."
      },
      {
        number: "03",
        title: "Prompt Forge & Multi-LLM Orchestrace",
        text: "Zkompiluje vysoce přesný nákupní prompt a spustí jej přes vybraný model (Google Gemini, OpenAI GPT-4o, Claude 3.5, lokální Ollama) s využitím bezpečného BYOK."
      }
    ],
    architectureFlow: [
      { step: "KLIENT", title: "Next.js 15 & React 19", desc: "Material Design, 100% bilingvní podpora (CZ/EN), nulové ikony/emotikony" },
      { step: "API VRSTVA", title: "Serverless Route Handlers", desc: "End-pointy pro výzkum parametrů, generování průvodců a streaming chatu" },
      { step: "REASONING", title: "Agent Luke & LLM Orchestrator", desc: "Syntéza parametrů, dynamický fallback kaskády při přetížení modelů" },
      { step: "AI MODELY", title: "Frontier Modely & BYOK", desc: "Gemini 2.0 / 1.5, GPT-4o, Claude 3.5 Sonnet a lokální privátní Ollama" }
    ],
    speakerNotes: "Co říct kolegům: A co je vlastně bAIright, na kterém jsme AIRE nasadili? Je to univerzální nákupní konzultant. Když vybíráte běžecké boty, kávovar nebo auto, systém přes Agenta Luka nejdřív prozkoumá skryté inženýrské parametry, vytvoří vám dynamický formulář na míru a nakonec sestaví precizní prompt, který pošle do špičkových modelů jako Gemini, GPT-4o nebo Claude. A teď se můžeme podívat přímo do živé aplikace."
  }
];

export default function AirePresentationPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showNotes, setShowNotes] = useState(false);

  const totalSlides = SLIDES.length;
  const slide = SLIDES[currentSlide];

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev < totalSlides - 1 ? prev + 1 : 0));
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev > 0 ? prev - 1 : totalSlides - 1));
  }, [totalSlides]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        nextSlide();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevSlide();
      } else if (e.key.toLowerCase() === "n") {
        setShowNotes((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] flex flex-col font-sans selection:bg-[#0284c7] selection:text-white">
      {/* Top Header Bar */}
      <header className="border-b border-[#cbd5e1] bg-white sticky top-0 z-50 px-6 lg:px-12 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-xs uppercase tracking-wider font-mono font-bold px-3.5 py-2 rounded-lg bg-[#f1f5f9] border border-[#cbd5e1] text-[#0f172a] hover:bg-[#e2e8f0] transition-colors"
          >
            ← Přejít do aplikace bAIright
          </Link>
          <div className="h-4 w-px bg-[#cbd5e1] hidden sm:block" />
          <span className="text-xs font-mono font-bold text-[#334155] uppercase tracking-wider hidden sm:inline">
            3Pillar AIRE SDLC & bAIright (5 snímků)
          </span>
        </div>

        {/* Center Progress Indicators */}
        <div className="flex items-center gap-2.5">
          {SLIDES.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentSlide(idx)}
              className={`h-3 transition-all rounded-full ${
                idx === currentSlide
                  ? "w-12 bg-[#01579b]"
                  : idx < currentSlide
                  ? "w-4 bg-[#0284c7]"
                  : "w-3 bg-[#cbd5e1] hover:bg-[#94a3b8]"
              }`}
              title={`Snímek ${idx + 1}: ${s.title}`}
            />
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNotes(!showNotes)}
            className={`text-xs font-mono font-bold px-3.5 py-2 rounded-lg transition-colors border ${
              showNotes
                ? "bg-[#01579b] text-white border-[#01579b]"
                : "bg-white text-[#0f172a] border-[#cbd5e1] hover:bg-[#f1f5f9]"
            }`}
          >
            {showNotes ? "Skrýt tahák [N]" : "Tahák co říct [N]"}
          </button>
          <span className="text-xs font-mono font-bold text-[#0f172a] bg-[#f1f5f9] px-3 py-2 rounded-lg border border-[#cbd5e1]">
            {currentSlide + 1} / {totalSlides}
          </span>
        </div>
      </header>

      {/* Main Slide Presentation Stage - Full Width & Height Utilization */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16 py-8 flex flex-col justify-between">
        <div className="w-full">
          {/* Header Metadata */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs font-mono uppercase tracking-widest text-[#01579b] font-bold bg-[#e0f2fe] px-3.5 py-1.5 rounded-md border border-[#bae6fd]">
              {slide.badge}
            </span>
            <span className="text-xs font-mono font-bold text-[#334155]">
              {slide.tag}
            </span>
          </div>

          {/* Slide Heading & Subtitle */}
          <h1 className="text-3xl md:text-5xl font-black text-[#0f172a] tracking-tight leading-tight mb-2">
            {slide.title}
          </h1>
          <p className="text-lg md:text-2xl text-[#01579b] font-bold mb-6">
            {slide.subtitle}
          </p>

          {/* Main Takeaway Banner */}
          <div className="bg-[#f0f9ff] border-l-4 border-[#0284c7] border-y border-r border-[#bae6fd] rounded-xl p-5 md:p-6 mb-8 text-[#0f172a] font-medium leading-relaxed text-base md:text-lg shadow-sm">
            <span className="font-bold text-[#01579b] font-mono uppercase text-xs tracking-wider block mb-1.5">
              Hlavní sdělení snímku:
            </span>
            {slide.mainTakeaway}
          </div>

          {/* SLIDE 1 SPECIFIC: 4 Roles Grid & Skills Overview */}
          {slide.roleCards && (
            <div className="mb-8">
              <div className="text-xs font-mono uppercase tracking-wider text-[#334155] font-bold mb-3">
                4 inženýrské persony v AIRE frameworku:
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {slide.roleCards.map((rc, idx) => (
                  <div
                    key={idx}
                    className="bg-white border-2 border-[#cbd5e1] rounded-xl p-6 shadow-sm hover:border-[#01579b] transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#0284c7] mb-1">
                        ROLE {idx + 1}
                      </div>
                      <div className="text-lg font-black text-[#0f172a] mb-3">
                        {rc.role}
                      </div>
                      <div className="text-xs font-mono font-bold text-[#01579b] mb-2 pb-2 border-b border-[#e2e8f0]">
                        {rc.name}
                      </div>
                      <div className="text-sm text-[#1e293b] leading-relaxed font-normal">
                        {rc.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {slide.skillsList && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {slide.skillsList.map((sk, idx) => (
                    <div
                      key={idx}
                      className="bg-white border-2 border-[#cbd5e1] rounded-xl p-5 shadow-sm"
                    >
                      <div className="text-sm font-bold text-[#01579b] font-mono uppercase tracking-wider mb-1.5">
                        {sk.category}
                      </div>
                      <div className="text-sm text-[#0f172a] font-medium leading-relaxed">
                        {sk.description}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SLIDES 2, 3, 4, 5: Pillars / Cards (2 or 3 columns responsive) */}
          {slide.cards && (
            <div className={`grid grid-cols-1 ${slide.cards.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"} gap-6 mb-8`}>
              {slide.cards.map((c, i) => (
                <div
                  key={i}
                  className="bg-white border-2 border-[#cbd5e1] rounded-xl p-6 shadow-sm hover:border-[#01579b] transition-all flex flex-col"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold text-[#0284c7] bg-[#e0f2fe] px-2.5 py-1 rounded">
                      {slide.id === 4 ? `MANTINEL ${c.number}` : `PILÍŘ ${c.number}`}
                    </span>
                  </div>
                  <div className="text-lg font-bold text-[#0f172a] mb-2.5 leading-snug">
                    {c.title}
                  </div>
                  <div className="text-sm md:text-base text-[#1e293b] leading-relaxed font-normal flex-1">
                    {c.text}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Architecture / Process Flow (Used on Slide 2 & Slide 5) */}
          {slide.architectureFlow && (
            <div className="bg-white border-2 border-[#cbd5e1] rounded-xl p-6 mb-8 shadow-sm">
              <div className="text-xs font-mono uppercase tracking-wider text-[#334155] font-bold mb-4">
                Tok zpracování a architektura:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {slide.architectureFlow.map((af, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-lg bg-[#f8fafc] border border-[#cbd5e1] relative"
                  >
                    <div className="text-xs font-mono font-bold text-[#01579b] uppercase tracking-wider mb-1.5">
                      {af.step}
                    </div>
                    <div className="text-base font-bold text-[#0f172a] mb-1.5">
                      {af.title}
                    </div>
                    <div className="text-sm text-[#1e293b] leading-relaxed">
                      {af.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Example Code / Audit Box (Used on Slide 3) - High Contrast & Guaranteed Readability */}
          {slide.exampleBox && (
            <div className="bg-[#f1f5f9] border-2 border-[#94a3b8] rounded-xl p-6 mb-8 shadow-sm">
              <div className="text-xs font-mono uppercase text-[#01579b] font-black tracking-wider mb-4 pb-2 border-b-2 border-[#cbd5e1]">
                {slide.exampleBox.title}
              </div>
              <div className="space-y-3 font-mono text-sm md:text-base">
                {slide.exampleBox.lines.map((line, idx) => {
                  const parts = line.split("]");
                  const tag = parts.length > 1 ? parts[0] + "]" : "";
                  const content = parts.length > 1 ? parts.slice(1).join("]") : line;

                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-lg bg-white border-2 border-[#cbd5e1] text-[#0f172a] font-bold leading-relaxed shadow-xs flex flex-col sm:flex-row sm:items-center gap-2"
                      style={{ color: "#0f172a", backgroundColor: "#ffffff" }}
                    >
                      {tag && (
                        <span className="text-[#01579b] font-black bg-[#e0f2fe] px-2.5 py-1 rounded text-xs tracking-wider shrink-0 border border-[#bae6fd]">
                          {tag.replace("[", "").replace("]", "")}
                        </span>
                      )}
                      <span className="text-[#0f172a] font-semibold tracking-tight">
                        {content.trim()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Key Points (Used on Slide 4) */}
          {slide.keyPoints && (
            <div className="bg-white border-2 border-[#cbd5e1] rounded-xl p-6 mb-8 shadow-sm">
              <div className="text-xs font-mono uppercase tracking-wider text-[#334155] font-bold mb-3">
                {slide.keyPointsTitle}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {slide.keyPoints.map((point, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg bg-[#f1f5f9] border border-[#cbd5e1] text-sm md:text-base text-[#0f172a] font-medium leading-relaxed"
                  >
                    <span className="text-[#01579b] font-bold mr-2">✓</span>
                    {point}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Speaker Notes Box (Collapsible) */}
          {showNotes && (
            <div className="bg-[#f0fdf4] border-2 border-[#86efac] rounded-xl p-6 mb-6 shadow-sm">
              <div className="text-xs font-mono uppercase font-bold text-[#166534] tracking-wider mb-2">
                Tahák pro vás (co říct kolegům svými slovy):
              </div>
              <p className="text-base md:text-lg text-[#14532d] leading-relaxed font-medium">
                "{slide.speakerNotes}"
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Navigation Toolbar */}
      <footer className="border-t border-[#cbd5e1] bg-white px-6 lg:px-12 py-4 flex items-center justify-between shadow-inner">
        <div className="flex items-center gap-2 text-xs font-mono text-[#334155]">
          <span className="font-bold">Ovládání klávesnicí:</span>
          <kbd className="px-2 py-1 rounded bg-[#f1f5f9] border border-[#cbd5e1] font-bold text-[#0f172a]">←</kbd>
          <kbd className="px-2 py-1 rounded bg-[#f1f5f9] border border-[#cbd5e1] font-bold text-[#0f172a]">→</kbd>
          <span>nebo</span>
          <kbd className="px-2.5 py-1 rounded bg-[#f1f5f9] border border-[#cbd5e1] font-bold text-[#0f172a]">Mezerník</kbd>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={prevSlide}
            className="text-xs font-mono font-bold px-5 py-2.5 rounded-lg bg-[#f1f5f9] border border-[#cbd5e1] text-[#0f172a] hover:bg-[#e2e8f0] transition-colors"
          >
            ← Předchozí snímek
          </button>
          <button
            onClick={nextSlide}
            className="text-xs font-mono font-bold px-6 py-2.5 rounded-lg bg-[#01579b] text-white hover:bg-[#0284c7] transition-colors shadow-sm"
          >
            Další snímek →
          </button>
        </div>
      </footer>
    </div>
  );
}
