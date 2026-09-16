# Requirements - bAIright Web Redesign (Wizard & UX)

**Date**: 2026-09-16  
**Author**: ANALYST_PM_GREENFIELD  
**Status**: Approved  
**Version**: 1.0

---

## Project Overview

### Vision
Transform the **bAIright** user interface into a high-speed, modern minimalist web application that wows users through ultra-clean aesthetics, intuitive parameter selection, and seamless prompt generation workflows.

### Problem Statement
The current interface contains long parameter names, verbose options, and complex layouts that hinder rapid shopping prompt engineering. Users require a streamlined, visually minimal, and highly functional shopping consultant wizard.

### Target Users
- **General Shoppers**: Seeking quick, expert AI-driven buying advice for arbitrary product categories.
- **Power Users / Prompt Engineers**: Customizing specific parameters, adjusting advanced models, and managing BYOK keys.

### Business Value
Elevates user engagement, speeds up the parameter selection flow, and establishes bAIright as a premier AI shopping consultant platform.

---

## Roles & Permissions Matrix

> Canonical source of truth for all personas/roles. Every story's User Flow by Persona
> and RBAC Enforcement block references these role names + permission keys verbatim.

| Role (canonical) | Description | Key Permissions (allow) | Explicitly Denied | Auth Source |
|------------------|-------------|-------------------------|-------------------|-------------|
| Shopper | General user searching for shopping recommendations | `wizard:use`, `parameters:select`, `prompt:generate` | `cache:purge`, `admin:access` | Anonymous / Client Session |
| PowerUser | User configuring custom API keys & advanced LLM settings | `wizard:use`, `parameters:select`, `prompt:generate`, `byok:configure`, `advanced:tune` | `cache:purge` | Local Storage / Session |
| Admin | System maintainer managing caches and prompt templates | `wizard:use`, `cache:purge`, `admin:access`, `templates:manage` | none | System / Auth Header |

**Permission keys**:
`wizard:use`, `parameters:select`, `prompt:generate`, `byok:configure`, `advanced:tune`, `cache:purge`, `admin:access`

---

## Project Type

| Attribute | Value |
|-----------|-------|
| Type | Greenfield Redesign (Web Interface & Wizard UX) |
| Quality Level | Production-Ready MVP |
| Timeline | 1 Week |
| Hard Deadline | Flexible |

---

## Success Criteria (MUST HAVE)

| ID | Criterion | Measurement | Target |
|----|-----------|-------------|--------|
| SC-1 | UI Performance & Responsiveness | Time to interactive & component render transition | < 100ms for UI step transitions |
| SC-2 | Shortened Parameter Labels | Maximum character length for wizard parameter pills | ≤ 18 characters (e.g. "Fotoaparát") |
| SC-3 | Visual Clarity & Layout Focus | User completion rate of parameter research wizard flow | 100% test pass rate across wizard flows |
| SC-4 | System Stability & Quality | Automated test suite execution | 100% passing tests (npx vitest run) |

---

## Failure Criteria (UNACCEPTABLE)

| ID | Criterion | Description |
|----|-----------|-------------|
| FC-1 | Generic Fallback Parameters | Displaying generic fallback parameters (e.g. biometrics for a dishwasher) |
| FC-2 | Cluttered / Overcrowded Layout | Overwhelming users with long text labels and unstyled input lists |
| FC-3 | Build or Type Errors | Any TypeScript compilation errors or broken test suites |

---

## Technical Constraints

| Constraint | Value | Rationale |
|------------|-------|-----------|
| Framework | Next.js 15 (App Router), React 19, TypeScript | Existing application stack |
| Styling | Vanilla CSS Design System (Cyber-glass / Minimal dark mode `#070d18` + Cyan/Teal accents) | Modern aesthetic, maximum performance & control |
| Testing | Vitest + React Testing Library | Existing test suite |
| API Layer | Server-side Gemini 2.0 Flash + Supabase parameter cache | Fast research without client-side secret exposure |

---

## Quality Gates

| Gate | Target | Required |
|------|--------|----------|
| Unit Test Coverage | 100% pass | Yes |
| TypeScript Checks | `npx tsc --noEmit` pass | Yes |
| No Critical Bugs | 0 | Yes |
| Performance | < 100ms UI response | Yes |
| Security Scan | CodeGuard + OWASP compliance | Yes |
| Code Review | Approved | Yes |

---

## Design References

**Location**: `docs/architecture-diagrams/` & `src/app/`

| File | Type | Description | Used In |
|------|------|-------------|---------|
| `00-system-overview-diagrams.md` | Architecture Diagram | System component flow | System Overview |
| `src/components/AgentCategoryLauncher.tsx` | Component | Main wizard UI container | Wizard Redesign |
| `src/app/globals.css` | Stylesheet | Core design system tokens | Layout & Styling |

---

## Functional Requirements

### Feature 1: Minimalist Wizard Interface (`AgentCategoryLauncher`)
**Priority**: Must Have

**User Story**: As a Shopper, I want a clean, concise parameter selection wizard so that I can quickly pick my shopping preferences without visual clutter.

**Acceptance Criteria**:
- Parameter badges/pills use concise labels (e.g. "Fotoaparát", "Baterie", "Hlučnost").
- Each parameter step presents visually distinct option cards with active selection states.
- Research status indicator clearly shows when Luke is analyzing parameters via Gemini Flash.

### Feature 2: High-Speed Research Status & Error Handling
**Priority**: Must Have

**User Story**: As a Shopper, I want immediate visual feedback during AI research so that I know the research status or can retry if needed.

**Acceptance Criteria**:
- Cache HIT returns parameters instantly without spinner delay.
- Cache MISS displays smooth animated research progress card.
- Network/API failure displays a clear retry card ("Zkusit znovu") without breaking UI state.

### Feature 3: Modern Minimalist Prompt Output Workspace
**Priority**: Must Have

**User Story**: As a Shopper/PowerUser, I want to review and copy the generated prompt in a clean high-contrast preview box so that I can immediately use it.

**Acceptance Criteria**:
- High contrast dark-mode prompt box with syntax-highlighted placeholders.
- Single-click "Kopírovat prompt" button with clear success toast/feedback.

---

## Non-Functional Requirements

| Category | Requirement | Target |
|----------|-------------|--------|
| Performance | UI Transition Speed | < 100ms |
| Accessibility | Contrast & Readability | WCAG AA compliant contrast |
| Usability | Compact Labels | Concise Czech terminology |
| Security | Key Handling | Server-side Gemini API key protection |

---

## Explicit Scope

### IN Scope ✅
- Redesign of the Interactive Shopping Wizard (`AgentCategoryLauncher.tsx`).
- Streamlined short parameter labels and modern card selection UI.
- Improved research loading animation and retry error card.
- Clean prompt preview and single-click export workspace.

### OUT of Scope ❌
- Complete overhaul of backend Supabase schema (existing migration suffices).
- Multi-language translation beyond existing Czech/English `translations.ts`.

---

## Assumptions

| Assumption | Impact if Wrong |
|------------|-----------------|
| Users prefer short parameter titles ("Fotoaparát") over long descriptions ("Rozlišení a vlastnosti fotoaparátu") | If users need more detail, tooltips can be added on hover |
| Existing Gemini 2.0 Flash API integration remains primary research provider | Server-side BYOK key must be configured in `.env.local` |

---

## Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| API rate limit during research | Low | Medium | Supabase parameter cache handles repeated queries |
| Visual regression in wizard test cases | Low | High | Run `npx vitest run` and `npx tsc --noEmit` after all UI updates |

---

## Timeline

| Milestone | Date | Deliverables |
|-----------|------|--------------|
| Requirements Complete | 2026-09-16 | `docs/requirements.md` |
| Architecture Design | 2026-09-16 | `docs/architecture/` update (`aire-greenfield-architecture`) |
| Implementation Plan | 2026-09-16 | `aire-greenfield-plan` |
| UI Implementation & Validation | 2026-09-16 | Updated wizard components & 100% test pass |

---

## Approval

| Role | Name | Date | Status |
|------|------|------|--------|
| Stakeholder | User | 2026-09-16 | Approved |
| Technical Lead | ANALYST_PM_GREENFIELD | 2026-09-16 | Approved |
