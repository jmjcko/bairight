# Target Architecture — 100% Bilingual (CZ / EN) System

**Date**: 2026-09-21  
**Author**: ARCHITECT  
**Status**: Approved  
**Version**: 2.0  
**Based On**: AGENTS.md rules & user request for 100% bilingual UI, wizards, modals, and AI prompt generation outputs  

---

## Executive Overview

### Current State Issue
- Switching language to English (`EN`) left multiple components and AI outputs unlocalized:
  - API call `/api/agent/research-parameters` did not receive `locale` parameter, defaulting to Czech generated JSON fields (`agentName`, `parameters.name`, `parameters.rationale`).
  - `UserRAGMemoryModal.tsx`, `GoogleLoginModal.tsx`, `AIEngineSubscriptionModal.tsx` contained hardcoded Czech strings.
  - `buildLukeSystemPrompt` in `luke-agent-prompt.ts` lacked full English instructions for AI agent prompt assembly.
  - Initial greeting message and suggested prompt chips on homepage were hardcoded in Czech.

### Target Architecture Solution
- **Centralized Dictionary**: Expand `src/lib/i18n/translations.ts` with complete `cs` and `en` keys for all modals, memories, auth, BYOK vault, wizards, and greetings.
- **Locale-Aware API Proxy**: Update `AgentCategoryLauncher.tsx` to pass `?locale=${locale}` to `/api/agent/research-parameters`.
- **Locale-Aware Meta-Prompting**: Update `buildLukeSystemPrompt` and `/api/agent/research-parameters/route.ts` to output 100% natural English JSON parameters and system prompts when `locale === 'en'`.
- **UI Harmonization**: Wrap all UI strings in `t.<section>.<key>` using `useI18n()`.

---

## Component i18n Delta Summary

| Component / Subsystem | Status | Change Description |
| :--- | :--- | :--- |
| `translations.ts` | 🟡 Modified | Added `memoryModal`, `authModal`, `vaultModal`, `greeting`, `suggestedPrompts` dictionaries for `cs` & `en` |
| `page.tsx` | 🟡 Modified | Dynamic `INITIAL_GREETING` & `SUGGESTED_PROMPTS` based on `locale` |
| `AgentCategoryLauncher.tsx` | 🟡 Modified | Pass `?locale=${locale}` to API; localize community badges & custom labels |
| `research-parameters/route.ts` | 🟡 Modified | Full English research prompt and JSON output structure when `locale === 'en'` |
| `luke-agent-prompt.ts` | 🟡 Modified | Full English meta-prompt for Agent Luke system prompt construction |
| `UserRAGMemoryModal.tsx` | 🟡 Modified | Wrap all titles, tabs, category labels, buttons in `t.memoryModal` |
| `AIEngineSubscriptionModal.tsx` | 🟡 Modified | Wrap vault modal titles, key inputs, and security badges in `t.vaultModal` |
| `GoogleLoginModal.tsx` | 🟡 Modified | Wrap login modal titles and descriptions in `t.authModal` |
| `DynamicAgentWizard.tsx` | 🟡 Modified | Localize parameter titles, steps, and prompt inspector tabs |
| `IntakeWizard.tsx` | 🟡 Modified | Localize intake steps, joint warnings, and catalog recommendations |

---

## Quality Gate Verification
- **TypeScript**: `npx tsc --noEmit` ➔ 0 errors.
- **Vitest Unit Tests**: `npx vitest run` ➔ 100% passing rate.
- **OWASP/CodeGuard**: Zero API key leakage; safe i18n fallback handling.
