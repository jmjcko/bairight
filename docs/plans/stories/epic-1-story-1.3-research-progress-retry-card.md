# Story 1.3: Research Loading Progress Card & Error Retry UI

**BUILDID**: CYCLE-1 | **Jira**: LOCAL | **Epic**: 1 - Shopping Wizard UI Redesign | **ID**: 1.3 | **Date**: 2026-09-16

---

## User Reference
**As a** Shopper,  
**I want** visual progress during AI research and an explicit "Zkusit znovu" retry card on failure,  
**So that** I always know what the AI agent is doing and can retry without losing context or seeing generic fallbacks.

---

## Description
Enhance research status rendering in `AgentCategoryLauncher.tsx`. When Luke researches product parameters via Gemini Flash, display an animated progress card. On API network failure, display a dedicated error card with a prominent "🔄 Zkusit znovu" button.

---

## RBAC Enforcement
| Role | Allowed Permission | Explicitly Denied |
|------|--------------------|-------------------|
| Shopper | `wizard:use` | `admin:access` |

---

## System responses + error cases
| Trigger | System Response | Side Effect |
|---------|-----------------|-------------|
| Research start | Shows animated progress card | Triggers `/api/agent/research-parameters` |
| Research error | Displays retry error card | Hides loading card, keeps user input intact |
| Click "Zkusit znovu" | Retries research API fetch | Clears error state, shows loading progress |

---

## QA-observable behaviour
- Animated loading card displays step indicator ("Analýza parametrů pro [Kategorie]...").
- Error card displays red warning border and functional "Zkusit znovu" button.

---

## Prerequisites
- Story 1.2 (`AgentCategoryLauncher.tsx`)

---

## Implementation Steps
1. Refactor `isResearching` state visualizer into a dedicated glass progress card.
2. Refactor `researchError` state into an explicit error card using `Card` primitive.
3. Wire "Zkusit znovu" click event to re-trigger `handleResearchParameters`.

---

## Test Requirements
- Unit tests verifying progress card rendering and retry button click behavior on simulated 500 API failure.

---

## Completion Evidence
- `npx vitest run src/components/__tests__/` passes 100%.
- TypeScript compiles cleanly (`npx tsc --noEmit`).
