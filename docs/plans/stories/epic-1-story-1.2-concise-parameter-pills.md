# Story 1.2: Concise Parameter Pills & Step Transitions

**BUILDID**: CYCLE-1 | **Jira**: LOCAL | **Epic**: 1 - Shopping Wizard UI Redesign | **ID**: 1.2 | **Date**: 2026-09-16

---

## User Reference
**As a** Shopper,  
**I want** concise parameter badges (≤ 18 characters) and clean step transitions in the wizard,  
**So that** I can scan options rapidly without being overwhelmed by lengthy descriptions.

---

## Description
Refactor `AgentCategoryLauncher.tsx` and `ParameterResearchWizard.tsx` to consume the newly created `Badge` and `Card` primitives. Ensure parameter titles are truncated/formatted to concise terms (e.g. "Fotoaparát" instead of "Požadované rozlišení a kvalita snímače fotoaparátu").

---

## RBAC Enforcement
| Role | Allowed Permission | Explicitly Denied |
|------|--------------------|-------------------|
| Shopper | `parameters:select` | `admin:access` |

---

## System responses + error cases
| Trigger | System Response | Side Effect |
|---------|-----------------|-------------|
| Parameter badge click | Toggles option selection state | Updates wizard prompt accumulator |
| Step Next click | Advances wizard to next parameter | Smooth CSS fade transition |

---

## QA-observable behaviour
- Parameter titles never exceed 18 characters on screen.
- Active parameter options highlight with cyan/teal glow accents.

---

## Prerequisites
- Story 1.1 (`src/components/ui/`)

---

## Implementation Steps
1. Import `Badge` and `Card` from `@/components/ui` inside `AgentCategoryLauncher.tsx`.
2. Format parameter names to concise Czech labels.
3. Update option selection grid to render clean card choices with active states.

---

## Test Requirements
- Unit tests verifying parameter label shortening and option selection state updates in `AgentCategoryLauncher.test.tsx`.

---

## Completion Evidence
- `npx vitest run src/components/__tests__/` passes 100%.
- TypeScript compiles cleanly (`npx tsc --noEmit`).
