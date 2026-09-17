# Architektonická Specifikace: Agent Luke 2.0 (Autonomní & Reaktivní Nákupní Agent)

**Verze:** 2.0.0  
**Status:** Schváleno pro bAIright Core Engine  
**Souvislost:** AIRE SDLC Architecture Specification  

---

## 1. Vize a Hlavní Principy

Agent Luke je koncipován jako **100% autonomní, reaktivní a nepředpojatý nákupní analytik**.

### Klíčové Zásady:
1. **Nulová Ruční Správa Kategorií**: Odstranění natvrdo zadrátovaných doménových pravidel. Luke generuje parametry reaktivně pro jakýkoliv uživatelský vstup (od *"dřevěné terasy"* po *"vyšívací stroj"* či *"hrnek"*).
2. **Reverzní Inženýrství Úskalí Trhu (Market Teardown)**: Provolaný prompt provede metodický výzkum pascí výrobců, selhání komponent po záruce, zkušeností z testů a recenzí (např. YouTube teardowns, fóra, hodnocení).
3. **Dvouúrovňová Architektura (L1 DB Cache + L2 Real-Time LLM Researcher)**:
   - **Level 1 (DB & Persistent Knowledge Cache)**: Ukládání vygenerovaných parametrů do databáze (`luke_domain_knowledge`). Nulová latence pro opakované dotazy a možnost rozšiřování pre-indexovaných Top 100 nejčastějších nákupních kategorií.
   - **Level 2 (Reaktivní Gemini 2.0 Flash LLM s Groundingem)**: Pokud kategorie v DB chybí, Luke provede živý LLM výzkum trhu, sestaví 10-14 kritických parametrů, uloží je do L1 DB pro další uživatele a předá je do UI v dlaždicích.
4. **UX Dlaždice (Dominantní Název + 1-Řádkový Popis)**:
   - Zobrazení přehledných dlaždic s tučným nadpisem a stručným jednovětným popisem bez ikonového šumu.

---

## 2. Diagram Architektury

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          UŽIVATELSKÝ VSTUP                              │
│            "vyšívací stroj" / "dřevěná terasa" / "hrnek"                │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      AGENT LUKE ORCHESTRATOR                            │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │ LEVEL 1: PERSISTENT KNOWLEDGE STORE (Supabase / DB Cache)       │   │
│   │ - Kontrola indexované kategorie (Nulová latence)                │   │
│   │ - Offline Pre-indexing Top 100 nákupních kategotií              │   │
│   └────────────────────────────────┬────────────────────────────────┘   │
│                                    │                                    │
│                     (Cache HIT)    │ (Cache MISS)                       │
│                     ┌──────────────┴──────────────┐                     │
│                     ▼                             ▼                     │
│        ┌─────────────────────────┐   ┌──────────────────────────┐       │
│        │  VRÁTÍ INDEXOVANÁ DATA  │   │ LEVEL 2: REAKTIVNÍ LLM   │       │
│        │  Z L1 KNOWLEDGE STORE   │   │  RESERCHER (Gemini Flash)│       │
│        └─────────────────────────┘   └────────────┬─────────────┘       │
│                                                   │                     │
│                                                   │ (Uloží do L1 DB)    │
│                                                   ▼                     │
│                                      ┌──────────────────────────┐       │
│                                      │ INSIGHTS PERSISTENCE ENGIN│       │
│                                      └──────────────────────────┘       │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                  UX PARAMETER SELECTION CARD GRID                       │
│   - Dominantní tučný název parametru (text-sm font-extrabold)           │
│   - 1-řádkový stručný výstižný popis (max 65 znaků, line-clamp-1)        │
│   - Možnost dynamického přidání vlastního kritéria                      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Výzkumný Meta-Prompt Agenta Luke (Level 2 Researcher)

Reaktivní prompt pro provolání LLM obsahuje pokyny pro reverzní inženýrství:

```markdown
Jsi Luke, špičkový produktový analytik a nezávislý nákupčí v expertním systému bAIright.
Proved odborné reverzní inženýrství nákupního rozhodování pro dotaz: "{query}".

Analyzuj:
1. Reálná úskalí nákupu, pasti marketingu a nejčastější příčiny nespokojenosti uživatelů (z testů, fórá a recenzí).
2. Výrobní a materiálové vady, které způsobují selhání po záruce.
3. Klíčové rozlišovací parametry, které oddělují nekvalitní produkty od spolehlivých.

Pravidla pro výstup:
- Generuj 10 až 14 konkrétních nákupních parametrů přímo pro "{query}".
- Názvy parametrů musí být stručné a úderné (≤ 18 znaků, např. "Materiál a rám", "Příkon a výkon", "Záruční podpora").
- Odůvodnění (rationale) MUSÍ být 1 stručná, výstižná věta (max 65 znaků) popisující hlavní úskalí.
- VŽDY zahrň parametr pro značky a výrobce (id: "brand_preferences").
```

---

## 4. Plán Implementace a Governance

1. **Synchronizace Specifikací**: Aktualizace `SPEC/agents/LUKE_RESEARCH_AGENT.md` s novým pravidlem reaktivního výzkumu.
2. **Rozšíření Prompt Engine**: Aktualizace `src/lib/agent/luke-agent-prompt.ts` a `src/app/api/agent/research-parameters/route.ts`.
3. **L1 DB Caching Layer**: Napojení `DomainLearningService` na uložení a načítání ověřených analýz.
4. **Verifikace**: Spuštění unit testů (`vitest`) a kontrola TypeScriptu (`tsc`).
