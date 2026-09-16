# AGENTS.md — Repository Operating Instructions

## Framework Context: 3Pillar AIRE SDLC Agentic Framework
This repository (`bAIright` / `shoes`) operates under the **3Pillar AIRE SDLC Agentic Framework** with CodeGuard & OWASP compliance standards.

---

## 🎯 Project Overview
- **Product:** **bAIright** (Universal AI Shopping Consultant & Prompt Engineering Engine).
- **Core Technology Stack:**
  - **Framework:** Next.js 15 (App Router), React 19, TypeScript.
  - **Styling:** Vanilla CSS design system (Cyber-glass aesthetic, dark mode `#070d18` with glowing cyan `#06b6d4` & teal `#14b8a6` accents).
  - **AI & Reasoning Engine:** Multi-Model Orchestration (Google Gemini 2.0 / 1.5, OpenAI GPT-4o, Anthropic Claude 3.5, Local Ollama via BYOK).
  - **Testing:** Vitest + React Testing Library (100% test pass rate required).
  - **Localization:** Bilingual (Czech `cs` default / English `en` selectable).

---

## 🛡️ AIRE SDLC Workflows & Operating Guidelines

1. **Brownfield Workflows (Existing Codebase Inspection):**
   - Use `aire-brownfield-inspect`, `aire-brownfield-requirements`, and `aire-brownfield-architecture` to map and analyze existing implementations without breaking established patterns.
2. **Execution Workflows:**
   - Follow `aire-dev-implement` for structured, test-driven feature development and refactoring.
   - Run `aire-review-code` for architectural alignment, security verification, and regression prevention.
3. **Quality & Validation Gate:**
   - Zero TypeScript errors (`npx tsc --noEmit`).
   - 100% passing automated unit tests (`npx vitest run`).
   - Security: CodeGuard + OWASP compliance (safe handling of API keys, no secret leakage in client bundle).
4. **Communication & Language:**
   - Clear, professional engineering communication in Czech (`cs`) or English (`en`) according to user preference.
   - User-facing UI strings must be localized via `src/lib/i18n/translations.ts`.


## 🤖 Agent Luke Specification & Maintenance Protocol
- **Canonical Specification**: [`SPEC/agents/LUKE_RESEARCH_AGENT.md`](file:///Users/jan.mynar/Documents/GitHub/bairight/SPEC/agents/LUKE_RESEARCH_AGENT.md)
- **AI Assistant Maintenance Responsibility**: When the user requests improvements, tweaks, or new behaviors for Agent Luke:
  1. The AI Assistant updates [`SPEC/agents/LUKE_RESEARCH_AGENT.md`](file:///Users/jan.mynar/Documents/GitHub/bairight/SPEC/agents/LUKE_RESEARCH_AGENT.md) with the new rule or persona requirement.
  2. The AI Assistant synchronizes the runtime system prompt in `src/lib/agent/luke-agent-prompt.ts` and `src/app/api/agent/research-parameters/route.ts`.
  3. The AI Assistant updates or creates automated unit tests in `src/lib/agent/__tests__/` to enforce the new rule.
  4. The AI Assistant runs `npx vitest run` and `npx tsc --noEmit` to guarantee zero regressions.



## ⚡ Autonomous AIRE SDLC Workflow Execution (No Manual Trigger Required)

The user does NOT need to type explicit workflow trigger commands (e.g., `aire-greenfield-requirements`, `aire-brownfield-inspect`, `aire-dev-implement`, `aire-review-code`, `aire-qa-validate`).

**AUTOMATIC DISPATCH PROTOCOL**:
For ANY prompt or request submitted by the user:
1. **Automatic Workflow Mapping**:
   - **New Feature / Refactoring on existing code**: Automatically sequence through `aire-brownfield-inspect` -> `aire-brownfield-requirements` -> `aire-brownfield-architecture` -> `aire-brownfield-plan` -> `aire-dev-implement`.
   - **Feature Implementation**: Automatically read `SPEC/workflows/aire-dev-implement.md` and execute implementation steps.
   - **Review / Code Audit**: Automatically read `SPEC/workflows/aire-review-code.md` and run the audit.
   - **Bug / Remediation**: Automatically read `SPEC/workflows/aire-dev-remediate.md` and apply TDD fixes.
   - **Testing & QA**: Automatically execute `SPEC/workflows/aire-qa-validate.md` or `SPEC/workflows/aire-qa-regression.md`.
2. **Read Workflow File**: Always load the exact file from `SPEC/workflows/<workflow-name>.md` before running steps.
3. **Seamless Execution**: Execute all required steps (inspections, TDD, code review, QA checks, TypeScript validation, Vitest runs) automatically.
4. **Transparent Status**: Display a short banner notifying the user which AIRE SDLC workflow is active (e.g., `🔄 [AIRE SDLC Auto-Workflow: aire-dev-implement]`).


## 📋 AIRE SDLC Transparency, Reporting & Local Git Control Rules

1. **Mandatory AIRE SDLC Execution Audit Table**:
   In EVERY response reporting completed development, refactoring, or bug fixes, the AI Assistant MUST include a structured **AIRE SDLC Audit Table** detailing:
   - 🔄 **Workflows Executed**: (e.g. `aire-brownfield-inspect` -> `aire-dev-implement` / `aire-dev-remediate` -> `aire-review-code` -> `aire-qa-validate`).
   - 🤖 **AIRE Role Agents Active**: (e.g. `AIRE_ARCHITECT`, `AIRE_DEV`, `AIRE_REVIEWER`, `AIRE_QA`).
   - 📑 **Workflow Files Loaded**: (e.g. `SPEC/workflows/aire-dev-implement.md`, `SPEC/workflows/aire-qa-validate.md`).
   - 🛡️ **Quality Gates Verified**: TypeScript compilation (`npx tsc --noEmit`), Vitest unit tests (`npx vitest run`), CodeGuard/OWASP security audit.

2. **Local Worktree Integrity & User Push Gate (NO Auto-Push)**:
   - The AI Assistant MUST save all edits directly to local workspace files so they are immediately visible as uncommitted changes (`git diff`) in the user's IDE.
   - The AI Assistant MUST NOT execute `git commit` or `git push` automatically.
   - The user retains 100% control over committing and pushing changes to GitHub.
