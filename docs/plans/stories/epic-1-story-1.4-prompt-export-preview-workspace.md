# Story 1.4: Modern Prompt Export Preview Workspace

**BUILDID**: CYCLE-1 | **Jira**: LOCAL | **Epic**: 1 - Shopping Wizard UI Redesign | **ID**: 1.4 | **Date**: 2026-09-16

---

## User Reference
**As a** Shopper / PowerUser,  
**I want** a modern high-contrast prompt preview box with a single-click copy button,  
**So that** I can review the generated shopping prompt and immediately copy it for LLM execution.

---

## Description
Redesign the generated prompt result container in `AgentCategoryLauncher.tsx`. Create a high-contrast dark-mode preview workspace featuring syntax-highlighted parameter tags, character count, and a single-click "Kopírovat prompt" button with temporary success feedback ("Copied!").

---

## RBAC Enforcement
| Role | Allowed Permission | Explicitly Denied |
|------|--------------------|-------------------|
| Shopper | `prompt:generate` | `admin:access` |
| PowerUser | `prompt:generate` | `admin:access` |

---

## System responses + error cases
| Trigger | System Response | Side Effect |
|---------|-----------------|-------------|
| Complete wizard steps | Generates and formats prompt | Renders prompt preview workspace |
| Click "Kopírovat prompt" | Copies text to clipboard | Shows temporary Toast ("Copied!") |

---

## QA-observable behaviour
- Prompt preview displays structured parameters with clear line breaks.
- Click "Kopírovat prompt" copies verbatim text to system clipboard.

---

## Prerequisites
- Story 1.3 (`AgentCategoryLauncher.tsx`)

---

## Implementation Steps
1. Create high-contrast prompt preview container with cyber-glass styling.
2. Add single-click copy handler using `navigator.clipboard.writeText`.
3. Wire `Toast` primitive for "Kopírováno do schránky!" notification.

---

## Test Requirements
- Unit tests verifying prompt text rendering and clipboard copy invocation.

---

## Completion Evidence
- `npx vitest run` passes 100% (all test suites).
- TypeScript check `npx tsc --noEmit` clean.
