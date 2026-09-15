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
