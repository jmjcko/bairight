# Implementation Plan - bAIright Web Redesign

**Date**: 2026-09-16  
**Author**: PRODUCT_OWNER  
**Status**: Approved  
**Version**: 1.0

---

## Executive Summary

This plan breaks down the **bAIright Web Redesign** into testable, high-impact stories. The redesign focuses on transforming the `AgentCategoryLauncher` shopping wizard into a high-speed, modern minimalist interface with concise parameter labels (≤ 18 chars), clear research status indicators, and an intuitive prompt export workspace.

---

## Architectural Alignment

- **Requirements**: `docs/requirements.md`
- **Architecture**: `docs/architecture/design/00-system-architecture-greenfield.md`
- **Patterns**: `docs/architecture/design/01-patterns-and-standards-greenfield.md`
- **Quality Gates**: 0 TypeScript errors (`npx tsc --noEmit`), 100% test pass rate (`npx vitest run`).

---

## Epics & Stories Breakdown

### Epic 1: Shopping Wizard UI Redesign & UX Optimization

#### Story 1.1: Shared UI Primitives Library (`src/components/ui/`)
- **Objective**: Create reusable visual primitives (`Badge`, `Button`, `Card`, `Toast`) in `src/components/ui/` per the UI Primitive Catalogue rulebook.
- **Key Files**: `src/components/ui/Badge.tsx`, `src/components/ui/Button.tsx`, `src/components/ui/Card.tsx`, `src/components/ui/Toast.tsx`
- **Dependencies**: None
- **Wave**: 1

#### Story 1.2: Concise Parameter Pills & Step Transitions
- **Objective**: Refactor parameter labels in `AgentCategoryLauncher` to be concise (≤ 18 chars, e.g. "Fotoaparát") and render smooth step selection cards.
- **Key Files**: `src/components/AgentCategoryLauncher.tsx`, `src/components/ParameterResearchWizard.tsx`
- **Dependencies**: Story 1.1
- **Wave**: 2

#### Story 1.3: Research Loading Progress Card & Retry Error UI
- **Objective**: Improve research status feedback: smooth animated card during Gemini Flash research and a clear retry card ("Zkusit znovu") on error.
- **Key Files**: `src/components/AgentCategoryLauncher.tsx`
- **Dependencies**: Story 1.2
- **Wave**: 2

#### Story 1.4: Modern Prompt Export Preview Workspace
- **Objective**: Redesign the generated prompt output container into a high-contrast dark-mode preview card with single-click copy feedback.
- **Key Files**: `src/components/AgentCategoryLauncher.tsx`
- **Dependencies**: Story 1.3
- **Wave**: 3

---

## QA Manual Testing Groups

### Epic 1: Shopping Wizard UI Redesign & UX Optimization

**Group 1** — Stories: 1.1 `[backend]`, 1.2, 1.3, 1.4
Once all stories in Epic 1 are complete, QA can verify the full end-to-end shopping consultant flow: typing a product category (e.g. "myčka nádobí"), verifying Luke AI research status / cache lookup, selecting short parameter badges, generating the prompt, and testing single-click copy.
