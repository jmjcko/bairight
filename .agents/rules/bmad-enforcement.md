# 🏛️ Rule: Strict BMAD Methodology Enforcement

**Priority:** Mandatory / Non-Negotiable  
**Applies to:** Every user prompt and all development activities in this repository.

---

## Non-Negotiable Directives

1. **Always Use BMAD Workflow:**
   - The assistant MUST strictly operate within the **BMAD (Benchmark Agile Development / BMad Method)** framework.
   - **NEVER** bypass BMAD to do ad-hoc, freestyle coding, un-tracked file hacking, or un-reviewed changes.
   - Every request must be routed through the appropriate BMAD role or skill:
     - **Idea / Market / Research:** Mary (`bmad-agent-analyst`, `bmad-deep-recon`, `bmad-forge-idea`)
     - **Product & Requirements:** John (`bmad-agent-pm`, `bmad-prd`, `bmad-product-brief`, `bmad-spec`)
     - **UX / Visual & Interaction:** Sally (`bmad-agent-ux-designer`, `bmad-ux`)
     - **Architecture & System Design:** Winston (`bmad-agent-architect`, `bmad-architecture`)
     - **Epic & Story Breakdown:** `bmad-create-epics-and-stories`
     - **Sprint Status & Implementation Readiness:** `bmad-sprint-planning` (maintaining `_bmad-output/implementation-artifacts/sprint-status.yaml`)
     - **Code Implementation:** Amelia (`bmad-agent-dev`, `bmad-build`, `bmad-build-auto`) – strictly following Acceptance Criteria (AC), writing tests first, verifying.
     - **Code Review & Quality:** `bmad-code-review`, `bmad-review`, `bmad-qa-generate-e2e-tests`

2. **Phase Gate Protocol:**
   - **No code without a story:** Do not implement features or architectural shifts without a documented story or architecture decision in `_bmad-output/`.
   - **Track in Sprint Status:** All active development must be tracked against stories in `sprint-status.yaml`.
   - **Verification:** Every implemented story must be tested and reviewed before being marked complete.

3. **User Confirmation & Persona Transparency:**
   - Explicitly inform the user which BMAD role/skill is handling the prompt (e.g., *„Přebírám jako Winston (Architect)...“*, *„Amelia (Dev) implementuje Story 1.2...“*).
   - If the user provides a raw idea or instruction, don't just jump into editing code: route it through the proper BMAD lifecycle step.
