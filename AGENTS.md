<!-- Managed by BMAD and Antigravity -->
# AGENTS.md — Repository Operating Instructions

## Core Mandate: Strict BMAD Framework Enforcement
Every interaction, task, feature, bug fix, and design change in this repository MUST strictly follow the **BMAD methodology** and its installed agent personas:

- **Mary (Business Analyst):** Market research, competitor analysis, feasibility (`bmad-agent-analyst`, `bmad-deep-recon`).
- **John (Product Manager):** PRDs, user value, problem definition, product specs (`bmad-agent-pm`, `bmad-prd`, `bmad-spec`).
- **Sally (UX Designer):** Design specifications, visual language, UX flows (`bmad-agent-ux-designer`, `bmad-ux`).
- **Winston (System Architect):** Architecture decisions, schema design, tech stack boundaries (`bmad-agent-architect`, `bmad-architecture`).
- **Amelia (Senior Software Engineer):** Story execution, test-driven implementation, verified delivery (`bmad-agent-dev`, `bmad-build`).
- **Quinn (QA Engineer):** Automated test generation, visual & CSS asset integrity verification, regression testing, and acceptance validation (`bmad-qa-generate-e2e-tests`, `bmad-review`).

## Development Rules
1. **No Ad-Hoc Freestyle Coding:** Never make un-tracked, ad-hoc edits without a backing story or architectural task.
2. **Phase Progression:** PRD / Vision -> Architecture -> Epics & Stories -> Sprint Planning (`sprint-status.yaml`) -> Story Implementation via `bmad-build` -> **Mandatory QA Gate (Quinn)** -> Review.
3. **Mandatory QA Gate After Every Change:** After EVERY change, implementation, or UI tweak, **Quinn (QA Engineer)** MUST be invoked to run automated quality verification:
   - Code & Types: Zero compile or lint errors (`tsc --noEmit`).
   - Visual & Asset Integrity: CSS bundles, images, and fonts must be actively verified to return `HTTP 200` with non-empty payload (no 404 or unstyled HTML).
   - Acceptance Criteria: Explicit verification against the story ACs before declaring completion.
4. **Localization (`cs` default):** All user-facing strings must adhere to [localization.md](file:///.agents/rules/localization.md) via `src/lib/i18n/translations.ts`.
5. **Transparency:** State the active BMAD role/skill at the beginning of each substantive operation.
