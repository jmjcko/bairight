# Story 1.1: Shared UI Primitives Library (`src/components/ui/`)

**BUILDID**: CYCLE-1 | **Jira**: LOCAL | **Epic**: 1 - Shopping Wizard UI Redesign | **ID**: 1.1 | **Date**: 2026-09-16

---

## User Reference
**As a** Developer / UI Designer,  
**I want** a dedicated library of shared visual primitives (`Badge`, `Button`, `Card`, `Toast`) in `src/components/ui/`,  
**So that** all wizard components use reusable, logic-free UI elements with consistent cyber-glass styling.

---

## Description
Create the shared UI primitive components required by the UI Primitive Catalogue rule defined in `docs/architecture/design/01-patterns-and-standards-greenfield.md`. These components must be purely visual (no business logic), accept standard React props, and export typescript interfaces.

---

## RBAC Enforcement
No role-differentiated access — single actor.

---

## System responses + error cases
| Trigger | System Response | Side Effect |
|---------|-----------------|-------------|
| Render `Badge` with `active=true` | Renders cyan active glow badge | None |
| Render `Button` click | Fires `onClick` handler | Applies hover animation |

---

## QA-observable behaviour
- `Badge` displays concise parameter labels (≤ 18 chars) with high contrast background.
- `Button` displays cyber-glass styling and responds to focus/hover events.
- `Card` renders selection container with smooth active state borders.

---

## Prerequisites
- `docs/architecture/design/01-patterns-and-standards-greenfield.md`

---

## Implementation Steps
1. Create `src/components/ui/Badge.tsx` with `BadgeProps` interface (`label`, `active`, `onClick`).
2. Create `src/components/ui/Button.tsx` with `ButtonProps` interface (`variant`, `disabled`, `children`).
3. Create `src/components/ui/Card.tsx` with `CardProps` interface (`active`, `error`, `children`).
4. Create `src/components/ui/Toast.tsx` with `ToastProps` interface (`type`, `message`).
5. Export all primitives from `src/components/ui/index.ts`.

---

## Test Requirements
- Unit tests verifying prop rendering and click events for `Badge`, `Button`, `Card`, and `Toast`.

---

## Completion Evidence
- `npx vitest run src/components/ui/` passes 100%.
- TypeScript compiles cleanly (`npx tsc --noEmit`).
