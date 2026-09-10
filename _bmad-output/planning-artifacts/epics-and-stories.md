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


