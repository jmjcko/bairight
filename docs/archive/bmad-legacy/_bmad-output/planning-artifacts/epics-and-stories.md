# Epics & User Stories: bAIright Platform

## Epic 1: Interactive Clinical Dashboard & UX Hierarchy
**Goal:** Deliver a fully interactive, clinically authoritative, and visually balanced dashboard where the Biomechanical Footwear Questionnaire is the dominant element, complemented by responsive shoe recommendations, health telemetry, and working interactive workflows across all menu items and buttons.

---

### Story 1.1: UX Hierarchy Adjustment & Complete Interactive Workflow Activation
**Assigned Role:** Amelia (Senior Software Engineer)  
**Status:** Completed

---

### Story 1.2: 65/35 Master-Detail Layout Exploration
**Assigned Role:** Amelia (Senior Software Engineer) & Sally (UX Designer)  
**Status:** Completed

---

### Story 1.3: Two-Phase Sequential Flow (Intake Stage -> Revealed Results) with Real Links and Modal Clinical Assessment
**Assigned Role:** Amelia (Senior Software Engineer), Sally (UX Designer) & John (PM)  
**Status:** In Progress

#### Description
Product architecture strictly follows the two-phase user journey:
1. **Phase 1 (Intake Stage):** The questionnaire is the SOLE highlighted, dominant element on the screen. No premature shoe cards or distraction.
2. **Phase 2 (Results Stage):** Once the user clicks "Vygenerovat návrhy obuvi", the application "lights up" the results view.
3. **No Fake Discounts or Broken Links:** Remove all fake discount codes and dummy retailer links. Provide 100% real, functional search links (e.g. Google Shopping / Heureka / Brand direct query for the specific 2E model).
4. **Clinical Assessment as an Action Button & Modal Overlay:** The medical evaluation is triggered via a dedicated action button opening an elegant overlay with the full podiatric findings, contraindications, and kinetic data.

#### Acceptance Criteria
- **AC-1.3.1 (Single-Focus Wizard Stage):** In Phase 1, the questionnaire is centered, highlighted, and dominant (max-w-3xl, centered). No shoe cards are shown during form filling.
- **AC-1.3.2 (Results Reveal Stage):** Clicking "Vygenerovat návrhy obuvi" transitions smoothly to the revealed Results Stage.
- **AC-1.3.3 (Zero Fake Info & Real Links):** All cards show verified specs and real search links to Google Shopping / Heureka for the exact 2E model (`https://www.google.com/search?q={brand}+{model}+2E+wide&tbm=shop`). No fake coupon popups.
- **AC-1.3.4 (Clinical Assessment Overlay):** Clinical evaluation is accessible via a prominent action button (*„📋 Zobrazit lékařský posudek a nález“*) that opens an overlay modal with findings and contraindications.
- **AC-1.3.5 (Seamless Return / Edit):** An intuitive button allows jumping back to the wizard to edit inputs at any time.

---

### Story 1.4: Comprehensive QA String Audit & Czech Localization Harmonization
**As a** Czech user seeking accurate podiatric footwear guidance,  
**I want** every single user-facing string across all views, modals, sidebars, badges, and agent chat messages to be localized in natural, podiatrically accurate Czech (`cs`),  
**so that** the experience is completely seamless, adheres strictly to the repository localization rules (`localization.md`), eliminates un-claimable medical promises, and is fully structured for internationalization.

#### Acceptance Criteria
- **AC-1.4.1 (100% Czech UI Coverage):** No English remnants in `page.tsx` (tool badges, quick prompts, placeholders), `BiomechanicalSidebar.tsx`, `ToolExecutionBadge.tsx`, `ShoeRecommendationCard.tsx`, or chat agent responses.
- **AC-1.4.2 (Zero Medical Over-claims):** Replace phrases like *„prokazatelně snižuje“*, *„schváleno komisí“*, *„certifikovaná volba“* with compliant terminology (*„efektivně absorbuje“*, *„biomechanický výpočet“*, *„hlavní doporučení“*).
- **AC-1.4.3 (Centralized i18n Synchronization):** `src/lib/i18n/translations.ts` updated with clean keys and parity between `cs` and `en`.
- **AC-1.4.4 (Agent Chat in Czech):** `processAgentConversation` outputs clarifying questions and recommendations in natural Czech.

---

### Story 1.5: Top-Bar Navigation Unification & Terminology Harmonization
**Assigned Role:** Amelia (Senior Software Engineer) & Sally (UX Designer)  
**Status:** Completed

#### Description
Unify the top bar navigation mental model so that all primary navigation items operate consistently as full workspace view tabs (identical to "Výběr obuvi"), eliminating jarring modal popups when navigating top-level sections, and harmonizing all section terminology across the application.

#### Acceptance Criteria
- **AC-1.5.1 (Consistent In-Place Workspace Views):** Clicking any top bar navigation item (`Výběr obuvi`, `Analýza pohybu`, `Katalog obuvi`, `Podiatrický chat`) transitions the main workspace view in-place without opening any modal dialog overlay.
- **AC-1.5.2 (Unified Active Tab Indicator & Styling):** All 4 navigation tabs have identical active indicators (cyan text, drop shadow, bottom cyan-teal gradient underline bar).
- **AC-1.5.3 (Dedicated Workspace Views):** Movement Analysis (`MovementAnalysisView.tsx`) and Shoe Catalog (`ShoeCatalogView.tsx`) render cleanly as full workspace views with rich data, search, and telemetry.
- **AC-1.5.4 (Terminology Harmonization):** All primary section labels, subtitles, and badges across the top bar, wizard, catalog, and `translations.ts` use standardized, natural Czech terminology.
- **AC-1.5.5 (Internal Navigation Synergy):** Links and action buttons in the wizard (e.g. "Zobrazit kinetický model", "Zobrazit katalog") smoothly switch the active tab.

---

### Story 1.6: bAIright 4C Chromatic Unification & Emerald-to-Cyan Palette Migration
**Assigned Role:** Amelia (Senior Software Engineer), Sally (UX Designer) & Quinn (QA)  
**Status:** Completed

#### Description
Eradicate legacy grassy/emerald greens inherited from the initial prototype and unify the entire frontend palette to match the exact sampled chromatic values of Logo Concept 4C (`bAIright`), adhering strictly to `DESIGN-SYSTEM-4C.md`. All UI components, badges, gradients, and chat modules must reflect the pure contrast of surgical white, electric ice cyan, and deep oceanic ribbon teal on an obsidian OLED background.

#### Acceptance Criteria
- **AC-1.6.1 (Formal Design Token Specification):** `DESIGN-SYSTEM-4C.md` authored and approved with exact sampled hex values (`#000000`/`#050811`, `#FFFFFF`, `#37CFD9`/`#22D3EE`, `#1BCBC5`/`#06B6D4`, `#158292`/`#0E7490`).
- **AC-1.6.2 (Global CSS Variable Realignment):** `src/app/globals.css` updated to eliminate `--brand-emerald` and ground all themes on 4C tokens.
- **AC-1.6.3 (Comprehensive Component Migration):** Zero legacy `emerald` classes remaining in `src/app/page.tsx`, `BiomechanicalSidebar.tsx`, `AgentConfigModal.tsx`, `MovementAnalysisView.tsx`, `ToolExecutionBadge.tsx`, `AnalysisModal.tsx`, `AppointmentsModal.tsx`, `ShoeCatalogView.tsx`, and shoe cards.
- **AC-1.6.4 (Agent Chat & Interactive State Harmony):** Agent chat bubbles, send button, live telemetry dots, and focus rings transitioned to Cyan/Teal.
- **AC-1.6.5 (QA & Asset Integrity Gate):** Quinn runs `tsc --noEmit` and verifies 0 compile errors and HTTP 200 on all assets.

---

## Epic 2: Multi-Domain Shopping Missions, BYOK Subscriptions & Persistent RAG Memory
**Goal:** Transform bAIright into a full-fledged intelligent multi-category buying platform, workflow orchestrator, and RAG knowledge database. Users can switch between specialized buying agents (shoes, ergonomic chairs, bikes, custom), manage their persistent biometric & preference history, and unlock unlimited evaluations by bringing their own AI subscription keys (Claude, Gemini, ChatGPT) within a motivating freemium model.

---

### Story 2.1: Multi-Domain Mission Switcher, User Auth State & BYOK AI Engine Studio
**Assigned Role:** Amelia (Senior Software Engineer), Sally (UX Designer), Winston (Architect) & Quinn (QA)  
**Status:** Completed

#### Description
Implement the frontend foundations for the multi-domain bAIright vision:
1. **Top Bar Mission & Domain Selector:** Next to the 4C logo, a sleek dropdown allows switching between active missions (`👟 Běžecká & ortopedická obuv`, `🪑 Ergonomické sezení & židle`, `🚲 Gravel & silniční kola`, `➕ Vytvořit nového agenta...`).
2. **User Profile & Freemium Quota Capsule:** Header widget displaying user account (`Jan Mynář`), quota usage (*„1/3 bezplatných vyhodnocení zbývá“*), and call-to-action to unlock unlimited reasoning with own AI key.
3. **AI Brain & BYOK Subscription Modal:** Panel enabling users to toggle between the free default engine and their own subscriptions (Anthropic Claude 3.5 Sonnet, Google Gemini 2.0 Flash, OpenAI GPT-4o) with secure local API key storage.
4. **Persistent RAG Knowledge Memory Inspector:** UI view revealing stored anamnesis facts (biometrics, medical findings, brand preferences, past purchase missions) that automatically enrich prompts sent to the LLM.

#### Acceptance Criteria
- **AC-2.1.1 (Mission & Domain Switcher):** Interactive dropdown next to Logo 4C displaying active mission and available category agents with active indicator.
- **AC-2.1.2 (User Profile & Quota Badge):** Header capsule showing authenticated user avatar, name, and live Freemium demo quota counter (e.g. 1/3 demo runs remaining).
- **AC-2.1.3 (BYOK AI Provider Modal):** Comprehensive model selector supporting Claude 3.5, Gemini 2.0 Flash, and GPT-4o with API key inputs, quota motivation banner, and active connection status.
- **AC-2.1.4 (Persistent RAG Memory Inspector):** Visual database memory inspector displaying stored anamnesis facts (weight, 2E width, OA 3, brand rules) used for prompt enrichment.
- **AC-2.1.5 (Strict 4C Design & QA Gate):** Adheres 100% to `DESIGN-SYSTEM-4C.md` (no emerald greens), zero TypeScript errors (`tsc --noEmit`), and full Czech localization.

---

### Story 2.2: Live Assessment Persistence into RAG Knowledge Memory & System Prompt Injection
**Assigned Role:** Amelia (Senior Software Engineer), Sally (UX Designer) & Quinn (QA)  
**Status:** Completed

#### Description
Connect the real assessment data flow into the persistent RAG memory database. Every completed assessment from `IntakeWizard` is automatically captured with an exact timestamp, diagnosis summary, key parameters, and recommended 2E models. The `UserRAGMemoryModal` is enhanced with a dedicated "Dokončená vyhodnocení & Zprávy" history tab displaying full expandable medical reports alongside active anamnesis facts.

#### Acceptance Criteria
- **AC-2.2.1 (Full Assessment Data Model):** Typed `CompletedAssessmentRecord` capturing date, time, mission, clinical findings, parameters, and recommended shoes.
- **AC-2.2.2 (Dual-Tab RAG Modal):** `UserRAGMemoryModal` features a "Dokončená vyhodnocení" tab and an "Anamnestická fakta" tab with item counts.
- **AC-2.2.3 (Live Evaluation Hook):** Completing the questionnaire in `IntakeWizard` automatically generates a timestamped assessment record and updates RAG facts.
- **AC-2.2.4 (LocalStorage Persistence):** Assessments and anamnesis facts persist in browser localStorage across page refreshes.
- **AC-2.2.5 (QA & Integrity Gate):** Quinn verifies zero TypeScript errors (`tsc --noEmit`) and HTTP 200.

---

### Story 2.3: Medical De-Risking, Product/UX Optimization & Interactive Assessment Feedback Loop into RAG DB
**Assigned Role:** Amelia (Senior Software Engineer), Sally (UX Designer), John (Product Manager) & Quinn (QA)  
**Status:** Completed

#### Description
1. **Medical De-Risking:** Eliminate risky regulatory/medical terminology across all UI strings, RAG memory modals, and data models (replacing "lékařský posudek/zpráva", "diagnóza", "recept", "MUDr" with biomechanical fitting report, joint movement comfort, fitting specialist).
2. **Interactive Assessment Feedback Loop (`AssessmentFeedbackLoop`):** Embed an interactive refinement console directly below the top 3 recommendations in `IntakeWizard`. Users can select quick feedback chips (e.g., lower budget, lighter dynamic ride, exclude specific brand) or input custom notes, and trigger dynamic recalculation.
3. **Permanent RAG Learning & Persistence:** Feedback immediately translates into a learned preference fact in the user's RAG memory database, saves to localStorage, and immediately recalculates the top 3 shoe selections.
4. **Wizard Product & UX Optimization:** Introduce a Quick Size selector (EU size + width sensation) in Step 1 to eliminate measurement friction for casual users, and rephrase Step 4 around joint comfort and running zones.
5. **Product & UX Assessment:** Deliver an executive assessment by John (PM) and Sally (UX) detailing product-market fit, retention mechanics, and optimization insights.

#### Acceptance Criteria
- **AC-2.3.1 (Medical De-Risking Audit):** 100% eradication of clinical/medical claims from RAG modals, engine config, and intake wizard in favor of biomechanical fitting specifications.
- **AC-2.3.2 (Interactive Feedback Loop Component):** `AssessmentFeedbackLoop.tsx` created with quick-action chips, custom prompt textarea, and dynamic re-evaluation trigger.
- **AC-2.3.3 (Immediate Persistence into RAG DB & Dynamic Recalculation):** Applying feedback writes directly to RAG facts, persists to localStorage, and updates recommendation cards in real-time.
- **AC-2.3.4 (Wizard UX Optimization):** Dual-mode input in Step 1 (Quick EU size vs precise mm sliders) and rephrased Step 4 (joint comfort & movement preferences).
- **AC-2.3.5 (Product & UX Assessment Report):** Comprehensive BMAD PM/UX assessment documenting user flow, friction analysis, and strategic recommendations.
- **AC-2.3.6 (QA & Asset Integrity Gate via Quinn):** Zero TypeScript compile errors (`tsc --noEmit`), valid HTTP 200, and strict Logo 4C Obsidian Cyan-Teal palette adherence.

