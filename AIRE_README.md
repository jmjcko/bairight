<!-- Copyright Notice -->
| version | copyright | license | date | component | legal_notice |
|---------|-----------|---------|------|-----------|--------------|
| v0.0.3 | Copyright © 2026 3Pillar Global, Inc. | Proprietary - 3Pillar Background IP | 2026-03-03 | AIRE SDLC Agentic Framework | PROPERTY OF 3PILLAR GLOBAL, INC. - CONFIDENTIAL & PROPRIETARY. Component: AIRE SDLC Agentic Framework Copyright © 2026 3Pillar Global, Inc. All Rights Reserved. This file contains 3Pillar Pre-Existing Materials. When used in client deliveries, this component is licensed pursuant to the Master Services Agreement between 3Pillar Global and the client. USE RESTRICTIONS: Unauthorized use, reproduction, or distribution is strictly prohibited. |

---

# AIRE SDLC Agentic Framework

> **AIRE SDLC Agentic Framework** - Bring structure, quality, and repeatability to AI-assisted development

AIRE SDLC Agentic Framework transforms how you build software with AI. Instead of free-form prompting, use **13 specialized AI agents**, **structured workflows**, and **enforced coding standards** to produce consistent, production-quality code.

---

## Table of Contents

- [What is AIRE SDLC Agentic Framework?](#what-is-AIRE-SDLC-Agentic-Framework)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [How It Works](#how-it-works)
- [The 13 Agents](#the-13-agents)
- [The Workflows](#the-workflows)
- [Greenfield vs Brownfield](#greenfield-vs-brownfield)
- [Dependency Graph & Waves](#dependency-graph--waves)
- [DevOps Workflows](#devops-workflows)
- [Data Engineering Workflow](#data-engineering-workflow)
- [Workflow Examples](#workflow-examples)
- [Daily Development Workflow](#daily-development-workflow)
- [Writing Jira Stories for AIRE SDLC Agentic Framework](#writing-jira-stories-for-aire-sdlc-agentic-framework)
- [Jira MCP Integration Guide](#jira-mcp-integration-guide)
- [GitHub Projects Integration](#github-projects-integration)
- [Azure DevOps Integration](#azure-devops-integration)
- [Archive & Reset](#archive--reset)
- [Helix Platform Integration (Helix MCP)](#helix-platform-integration-helix-mcp)
- [Bug & Incident Reporting](#bug--incident-reporting)
- [Command Reference](#command-reference)
- [Folder Structure](#folder-structure)
- [.gitignore Management](#gitignore-management)
- [Security & Compliance](#security--compliance)
 

---

## What is AIRE SDLC Agentic Framework?

AIRE SDLC Agentic Framework is a **framework for AI-assisted development** that provides:

| Component | What It Does |
|-----------|--------------|
| **Agents** | 13 specialized AI personas (Analyst, Architect, Product Owner, Build Cycle Planner, UI/UX Designer, Dev, Reviewer, QA, DevOps, Requirements Steward, Data Engineer etc.) |
| **Workflows** | Step-by-step processes for every development task |
| **Rulebooks** | Quality standards (SOLID principles, clean architecture, testing) |

**The result**: Every AI-generated code follows the same standards, patterns, and principles—regardless of which developer or AI tool is used.

### Key Benefits

- ✅ **Consistent Quality** - SOLID principles enforced in every file
- ✅ **No Assumptions** - AI always asks before assuming
- ✅ **Full Traceability** - Requirements → Design → Code → Review documented
- ✅ **IDE Agnostic** - Works with Cursor, Windsurf, GitHub Copilot, Claude, Kiro, Antigravity, Codex
- ✅ **Safe for Legacy Code** - Brownfield workflows prevent breaking changes
- ✅ **Helix Platform Integration** - Connect AIRE to the Helix platform over MCP — query the pre-indexed code knowledge graph and read/write solution documents, live, scoped to one Helix solution. See [Helix Platform Integration](#helix-platform-integration-helix-mcp).

---

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [Git](https://git-scm.com/)
- An AI-powered IDE (Cursor, Windsurf, VS Code with Copilot, Claude, Kiro, Antigravity, or Codex)

### First-Time Installation

**For users installing AIRE SDLC Agentic Framework CLI for the first time:**

*(For Windows users, Command Prompt is the preferred terminal)*

> **Note:** This framework integrates the **[AI-CoE-Security-and-Compliance-Coding-Assistants](https://github.com/3PillarGlobal/AI-CoE-Security-and-Compliance-Coding-Assistants)** rule set (CodeGuard + OWASP) into the IDE folder corresponding to the IDE you select during `aire init`. If your project already contains files with the same names as those provided by this framework, please consider renaming them prior to initialization to avoid conflicts.

#### Step 1: Clone the Repository

```bash
git clone https://github.com/3PillarGlobal/AIRE-SDLC-Agentic-Framework.git
```

#### Step 2: Navigate to the AIRE SDLC Agentic Framework Directory

```bash
cd SPEC_cli_node_package
```

#### Step 3: Install Dependencies

```bash
npm install
```

#### Step 4: Link the AIRE SDLC Agentic Framework CLI Globally

This makes the `aire` command available from anywhere:

```bash
npm link
```

#### Step 5: Verify Installation

```bash
aire --help
```

**Mac Users:** If you get a "permission denied" error (or similar) when running the `aire` command, navigate to the AIRE SDLC Agentic Framework repo, then run:
```bash
 cd SPEC_cli_node_package
 chmod +x bin/spec.js
```
After that, try `aire --help` again to verify.

You should see:

```
AIRE Method CLI - AIRE SDLC Agentic Framework

Usage:
  aire init        Initialize workspace (smart merge, preserves existing files)
      --force      Force clean installation (overwrites all existing files)
  aire update      Update to latest version (smart merge, preserves user files)
      --force      Force update (overwrites all existing files)
  aire read        Extract text from .docx/.pdf reference documents
      <file>       Read and convert to .md format
  aire status      Check status and generated docs (.md files)
  aire helix <sub> Connect this project to the Helix platform MCP server
                   Subcommand: connect --solution-id <id> [--ide <name>]
                   Try 'aire helix --help' for the full flag reference.

IDE Support: Cursor, Claude Code, Windsurf, Antigravity, GitHub Copilot, Kiro, Codex

Workflows:
  Brownfield: aire-brownfield-inspect, aire-brownfield-deep-dive, aire-brownfield-requirements, aire-brownfield-architecture, aire-brownfield-patterns, aire-brownfield-plan
  Greenfield: aire-project-kickoff, aire-greenfield-requirements, aire-greenfield-architecture, aire-greenfield-patterns, aire-greenfield-plan
  Planning:   aire-build-cycles
  Design:     aire-ui-ux-design
  Execution:  aire-dev-implement, aire-dev-remediate, aire-enhancement, aire-drift, aire-review-code, aire-qa-test-plan, aire-qa-validate, aire-qa-regression, aire-qa-triage, aire-raise-defect
  DevOps:     aire-devops-discover, aire-devops-pipeline, aire-devops-deploy, aire-devops-infra-evolve
  Helix:      aire-helix-sync
  Lifecycle:  aire-archive, aire-pr-generator, aire-pr-reviewer
  Data:       aire-data-design
```

**🎉 Installation complete!**

### Updating the AIRE SDLC Agentic Framework to the latest version (Existing Users)

**For users who have already installed the AIRE SDLC Agentic Framework and want to update to the latest version:**

*(For Windows users, Command Prompt is the preferred terminal)*

> **Note:** This framework integrates the **[AI-CoE-Security-and-Compliance-Coding-Assistants](https://github.com/3PillarGlobal/AI-CoE-Security-and-Compliance-Coding-Assistants)** rule set (CodeGuard + OWASP) into the IDE folder corresponding to the IDE you select during `aire update`. If your project already contains files with the same names as those provided by this framework, please consider renaming them prior to running the update to avoid conflicts.

#### Step 1: Navigate to the Framework Directory

```bash
cd /path/to/AIRE-SDLC-Agentic-Framework
```

#### Step 2: Pull Latest Changes

```bash
git pull origin main
```

#### Step 3: Navigate to SPEC_cli_node_package Directory

```bash
cd SPEC_cli_node_package
```

#### Step 4: Install Updated Dependencies

```bash
npm install
```

#### Step 5: Re-link the AIRE SDLC Agentic Framework CLI

```bash
npm link
```

#### Step 6: Update Your Existing Projects

Navigate to each of your existing projects where you have used the AIRE SDLC Agentic Framework and run:

```bash
cd /path/to/your/project
aire update
```
**Mac Users:** If you get a "permission denied" error (or similar) when running the `aire` command, navigate to the AIRE SDLC Agentic Framework repo, then run:
```bash
 cd SPEC_cli_node_package
 chmod +x bin/spec.js
```
After that, try `aire update` again to verify.

This will update all agents, workflows, and rulebooks to the latest version while preserving your generated documents.

**🎉 Update complete!**

> ⚠️ **`aire update` adds AIRE SDLC Agentic Framework files to `.gitignore`. Do not commit the AIRE SDLC Agentic Framework files or remove their entries from `.gitignore`.**

---

## Quick Start

*(For Windows users, Command Prompt is the preferred terminal)*

### 1. Start Your IDE

Open Cursor, Windsurf, VS Code with Copilot, Claude, Kiro, Antigravity, or Codex.

### 2. Open Your Project in the IDE

Navigate to and open your project directory in the IDE.

### 3. Initialize AIRE SDLC Agentic Framework

```bash
cd /path/to/your/project
aire init
```

This creates a `docs/` folder, a `SPEC/` folder with all agents, workflows, and rulebooks, the IDE configuration folder for your selected IDE, and updates or creates `.gitignore`.

> ⚠️ **Do not manually edit agents, workflows, and rulebooks files inside `SPEC/`.** Running `aire init` or `aire update` will overwrite this folder with the latest framework version.

> ⚠️ **`aire init` adds AIRE SDLC Agentic Framework files to `.gitignore`. Do not commit the AIRE SDLC Agentic Framework files or remove their entries from `.gitignore`.**

### 4. Use a Workflow Trigger

Type one of these in your AI chat to activate the corresponding workflow:

> 💡 **Tip:** Start a new chat window for each workflow (and for each story in `aire-dev-implement`) — every workflow reads its own context, so separate sessions help manage token usage and limits.

| Workflow Trigger | What It Does | When to Use |
|------------------|--------------|-------------|
| `aire-project-kickoff` | Initializes a new project from scratch. Creates project structure, sets up documentation folders, and initiates the requirements gathering process. | Use when starting a brand new project with no existing codebase. This is your entry point for greenfield development. |
| `aire-greenfield-requirements` | Conducts an interactive requirements gathering session. The AI will ask targeted questions about features, user roles, technical constraints, and business objectives to create comprehensive requirement documentation. | Use after project kickoff or when you need to formally document requirements for a new feature or project. Ideal for projects where requirements need to be clearly defined before design and implementation. |
| `aire-brownfield-inspect` | Performs a comprehensive analysis of your existing codebase. Generates documentation on system architecture, technology stack, coding patterns, dependencies, and test coverage. | Use when working with legacy code or an existing project that needs documentation. Essential first step before making any changes to unfamiliar codebases. |
| `aire-brownfield-deep-dive [subsystem]` | Conducts detailed analysis of a specific component, module, or subsystem within your existing codebase. Provides in-depth understanding of implementation details, dependencies, and potential impact areas. | Use after `aire-brownfield-inspect` when you need to understand a specific area in detail before making modifications. Helps identify risks and dependencies for targeted refactoring or feature additions. |
| `aire-helix-sync` | Syncs Helix platform artifacts (solution documents, session context, and on-demand graph query outputs) **down** into a local `docs/helix/` tree with frontmatter + an `INDEX.md` manifest. Read-only against Helix. Downstream workflows (`aire-project-kickoff`, brownfield/greenfield requirements & architecture, `aire-brownfield-inspect`, `aire-brownfield-deep-dive`) then read this tree as read-only reference context during their Reference Check steps. | Use when the project is connected to Helix (`aire helix connect …`) and you want the Helix solution's documents/context versioned alongside the code — and available as prior context to the rest of the SDLC. Governed by `aire-helix-rulebook.md`. |



The AI will now follow AIRE SDLC Agentic Framework workflows!

---

## How It Works

AIRE SDLC Agentic Framework has 3 core components that work together:

```
┌─────────────────────────────────────────────────────────────┐
│                        YOU (Human)                          │
│                              │                              │
│                              ▼                              │
│     ┌─────────────────────────────────────────────────┐     │
│     │              TRIGGER A WORKFLOW                 │     │
│     │         (e.g., "aire-dev-implement")            │     │
│     └─────────────────────────────────────────────────┘     │
│                              │                              │
│                              ▼                              │
│  ┌────────────┐    ┌────────────┐    ┌────────────┐         │
│  │   AGENT    │───>│  WORKFLOW  │───>│  RULEBOOK  │         │
│  │(AIRE_DEV)  │    │  (steps)   │    │(standards) │         │
│  └────────────┘    └────────────┘    └────────────┘         │
│                              │                              │
│                              ▼                              │
│     ┌─────────────────────────────────────────────────┐     │
│     │              DOCUMENTED OUTPUT                  │     │
│     │     (code + tests + review in docs/)            │     │
│     └─────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Agents
AI Agents with specific roles. Each agent has:
- **Identity** - Persona, who they are (e.g., "Senior Developer")
- **Task** - What they do
- **Constraints** - Rules they must follow


### Workflows
Step-by-step processes with:
- **Command to trigger** - How to activate them
- **Execution steps** - Checkboxes to follow
- **Output templates** - What gets produced

### Rulebooks
Quality standards, few example:
- **SOLID principles** - Single Responsibility, Open/Closed, etc.
- **Clean Architecture** - Layer separation
- **Testing standards** - ≥85% coverage required

---

## The 13 Agents

| Agent | Role |
|-------|------|
| **AIRE_ANALYST_PM_GREENFIELD** | Gathers requirements for new projects |
| **AIRE_ANALYST_PM_BROWNFIELD** | Turns Jira tickets into implementation-ready stories grounded in deep-dive artifacts |
| **AIRE_ARCHITECT** | Greenfield: creates technical designs and project-wide patterns. Brownfield: reverse-engineers existing codebases into architecture/pattern documentation |
| **AIRE_BUILD_CYCLE_PLANNER** | Breaks requirements into build cycles |
| **AIRE_UI_UX_DESIGNER** | Creates token-efficient UI/UX design specifications |
| **AIRE_PRODUCT_OWNER** | Authors implementation plans and per-story files |
| **AIRE_INITIALIZER** | Initializes greenfield project kickoff |
| **AIRE_DEV** | Implements code with unit tests |
| **AIRE_REVIEWER** | Code review & quality checks |
| **AIRE_QA** | QA testing, validation, regression & triage |
| **AIRE_DEVOPS** | CI/CD pipelines, IaC, deployment automation, infra evolution |
| **AIRE_REQUIREMENTS_STEWARD** | Detects requirement drift, stages Change Request bundles, and direct-edits planned stories — sole sanctioned producer of CR-folder content (drives `aire-drift`) |
| **AIRE_DATA_ENGINEER** | Designs and builds data platforms — architecture, modeling, ingestion, transformation, contracts, quality, governance, and DataOps (greenfield + brownfield migration) |

> Apart from these, we also have an agent called **Commercial Agent** that tracks and provides analytics for GitHub repositories that use AIRE Build. It is available on our AI CoE site.

---

## The Workflows

### Trigger Words Quick Reference

| # | Type | Command | What It Does |
|---|----------|---------|--------------|
| 1 | **Start Greenfield Project** | `aire-project-kickoff` | Start a new project |
| 2 | **Greenfield Requirements** | `aire-greenfield-requirements` | Gather requirements |
| 3 | **Greenfield Architecture** | `aire-greenfield-architecture` | Design system architecture |
| 4 | **Greenfield Patterns** | `aire-greenfield-patterns` | Define design patterns for the project |
| 5 | **UI/UX Design** | `aire-ui-ux-design` | Create UI/UX design specification |
| 6 | **Build Cycles** | `aire-build-cycles` | Break requirements into build cycles (CYCLE-1, CYCLE-2, etc.) |
| 7 | **Greenfield Planning** | `aire-greenfield-plan` | Create implementation plan with stories |
| 8 | **Brownfield Codebase Documentation** | `aire-brownfield-inspect` | Analyze existing codebase |
| 9 | **Brownfield Detailed Component Analysis** | `aire-brownfield-deep-dive [subsystem]` | Deep dive into specific area |
| 10 | **Brownfield Requirements** | `aire-brownfield-requirements` | Define requirements from brownfield analysis |
| 11 | **Brownfield Target Architecture** | `aire-brownfield-architecture` | Design target state architecture for brownfield changes |
| 12 | **Brownfield Patterns** | `aire-brownfield-patterns` | Compare existing codebase patterns against rulebook and define standards |
| 13 | **Brownfield Planning** | `aire-brownfield-plan` | Plan changes to existing code |
| 14 | **Code Development** | `aire-dev-implement`| Implement stories |
| 15 | **Reviewing Code** | `aire-review-code` | Perform code review |
| 16 | **Remediate Issues** | `aire-dev-remediate` | Fix defects from a code-review or QA-triage report |
| 17 | **Minor Enhancement** | `aire-enhancement` | Document and implement a minor enhancement on an ongoing AIRE SDLC Agentic Framework project. |
| 18 | **Requirement Drift / Change Request** | `aire-drift` | Detect impact of a requirement change; stage Change Request bundle, direct-edit planned stories, create new stories, and apply foundation writes behind one preview-then-confirm gate |
| 19 | **QA Test Plan** | `aire-qa-test-plan` | Create a structured QA test plan for a story from acceptance criteria or feature |
| 20 | **QA Validate** | `aire-qa-validate` | Validate implementation against requirements and acceptance criteria and test plan |
| 21 | **QA Regression** | `aire-qa-regression` | Run regression tests to ensure existing functionality is unbroken |
| 22 | **QA Triage** | `aire-qa-triage` | Triage and prioritize bugs or test failures found during QA Validate or QA Regression |
| 23 | **DevOps Discovery** | `aire-devops-discover` | Auto-detect app profile, gather deployment requirements|
| 24 | **DevOps Pipeline** | `aire-devops-pipeline` | Create CI/CD pipelines, Docker, Terraform, DevSecOps |
| 25 | **DevOps Deploy** | `aire-devops-deploy` | Full infra setup — Terraform, server, SSL, monitoring, runbooks |
| 26 | **DevOps Infra Evolve** | `aire-devops-infra-evolve` | Brownfield infra analysis and evolution planning |
| 27 | **Archive & Reset** | `aire-archive` | Zip the `docs/` tree into `docs/archive/` (named per-sprint snapshot via `aire archive`), then reset `docs/` for the next sprint |
| 28 | **PR Generator** | `aire-pr-generator` | Repair `docs/status.md` (dedupe merge=union duplication, reconcile against story/review artifacts), then raise a GitHub PR from the current branch with an evidence-grounded, AI-labeled description |
| 29 | **PR Reviewer** | `aire-pr-reviewer` | Agentic PR review — scan for secrets/PII, find bugs, edge cases, and security issues; post inline comments plus one structured summary (issues / questions / suggestions / human review); comment-only, never approves or merges |
| 30 | **Raise Defect** | `aire-raise-defect` | Turn one or many QA findings into individually trackable Bug issues in Jira (Atlassian MCP), Azure DevOps (`az` CLI), or GitHub (`gh` CLI) — consumes an existing bugs document or interviews the tester for missing fields, validates steps for contradictions, confirm-first — defects live in the tracker only |
| 31 | **Helix Sync** | `aire-helix-sync` | Sync Helix platform artifacts (solution documents, session context, graph query outputs) down into the local docs/helix/ tree over the Helix MCP server — downstream workflows read the synced tree as reference context |
| 32 | **Data Design** | `aire-data-design` | Design/build a data platform, pipeline, or dataset — discovery, ADR, data model, contracts, quality & DataOps (greenfield + brownfield migration) |

---

## Greenfield vs Brownfield

### Greenfield (New Projects)

Use when building something **from scratch**.

**Workflow**:
1. `aire-project-kickoff` → Initialize project
2. `aire-greenfield-requirements` → Gather requirements (AI asks questions)
3. `aire-greenfield-architecture` → Design system
4. `aire-greenfield-patterns` → Define coding patterns and standards for the project
5. `aire-data-design` → Design the data platform, model & contracts *(optional, when there's scope for Data Engineering & Data Architecture)*
6. `aire-build-cycles` → Break requirements into build cycles *(optional)*
7. `aire-ui-ux-design` → Create UI/UX design specification *(optional)*
8. `aire-greenfield-plan` → Create step-by-step implementation plan (stories carry BUILDID if cycles used)
9. `aire-dev-implement` → Build each story
10. `aire-review-code` → Review each story *(optional)*
11. `aire-dev-remediate` → Fix any issues found in review *(optional)*
12. `aire-qa-test-plan` → Create QA test plan *(optional)*
13. `aire-qa-validate` → Validate against requirements *(optional)*
14. `aire-qa-regression` → Run regression tests *(optional)*
15. `aire-qa-triage` → Triage any failures found *(optional)*
16. `aire-dev-remediate` → Fix triaged bugs *(optional)*

> **Utility workflows** (invoke as needed at any point):
> - `aire-enhancement` → Document and implement a minor enhancement on an ongoing project
> - `aire-drift` → Detect impact of a requirement change; stage Change Request bundle, edit planned stories, create new stories
> - `aire-archive` → Snapshot `docs/` at end of sprint/cycle and optionally reset workspace for the next sprint
> - `aire-pr-generator` → Repair `docs/status.md` (dedupe merge-union duplication) and raise a PR from the current branch with an evidence-grounded description
> - `aire-pr-reviewer` → Review an open PR: secrets/PII scan, bug/edge-case/security findings, inline comments + one structured summary with a human-review section
> - `aire-raise-defect` → Raise one or many well-formed defects from QA findings into Jira / Azure DevOps / GitHub, individually trackable, confirm-first

**Example**:
```
You: "aire-project-kickoff - I want to build a task management API"
AI: "Great! Let me ask some questions..."
    1. What user roles do you need?
    2. What authentication method?
    3. What database?
```

### Brownfield (Existing Code)

Use when working with **existing codebases**.

**Workflow**:
1. `aire-brownfield-inspect` → AI analyzes entire codebase
2. `aire-brownfield-deep-dive [area]` → Detailed analysis of specific area
3. `aire-brownfield-requirements` → Define requirements from analysis
4. `aire-brownfield-architecture` → Design target state architecture for the changes 
5. `aire-brownfield-patterns` → Compare existing patterns against rulebook; define coding standards 
6. `aire-data-design` → Design or migrate the data platform, model & contracts *(optional, when there's scope for Data Engineering & Data Architecture)*
7. `aire-build-cycles` → Break requirements into build cycles *(optional)*
8. `aire-ui-ux-design` → Create UI/UX design specification *(optional)*
9. `aire-brownfield-plan` → Plan changes (stories carry BUILDID if cycles used)
10. `aire-dev-implement` → Make changes safely
11. `aire-review-code` → Review changes *(optional)*
12. `aire-dev-remediate` → Fix issues raised in review *(optional)*
13. `aire-qa-test-plan` → Create QA test plan *(optional)*
14. `aire-qa-validate` → Validate against requirements *(optional)*
15. `aire-qa-regression` → Run regression tests *(optional)*
16. `aire-qa-triage` → Triage and prioritize bugs found during validation/regression *(optional)*
17. `aire-dev-remediate` → Fix triaged bugs *(optional)*

> **Utility workflows** (invoke as needed at any point):
> - `aire-enhancement` → Document and implement a minor enhancement on an ongoing project
> - `aire-drift` → Detect impact of a requirement change; stage Change Request bundle, edit planned stories, create new stories
> - `aire-archive` → Snapshot `docs/` at end of sprint/cycle and optionally reset workspace for the next sprint
> - `aire-pr-generator` → Repair `docs/status.md` (dedupe merge-union duplication) and raise a PR from the current branch with an evidence-grounded description
> - `aire-pr-reviewer` → Review an open PR: secrets/PII scan, bug/edge-case/security findings, inline comments + one structured summary with a human-review section
> - `aire-raise-defect` → Raise one or many well-formed defects from QA findings into Jira / Azure DevOps / GitHub, individually trackable, confirm-first

**Example**:
```
You: "aire-brownfield-inspect"
AI: "I'll analyze the codebase..."
    
    System Overview:
    - Architecture: Monolithic MVC
    - Stack: Node.js/Express
    - Database: PostgreSQL
    - Test Coverage: 78%
```

---

## Dependency Graph & Waves

When a plan has 2+ stories, both the Greenfield and Brownfield planning workflows generate `docs/plans/dependency-graph.yml` — a machine-readable map of which stories depend on which, derived from each story's `files_touched` and `requires` fields.

### What is a wave?

A **wave** is a group of stories that have **no dependencies on each other** and can therefore be worked on **in parallel**.

- **Wave 1** = stories with no prerequisites (`requires: []`).
- **Wave N+1** = stories whose prerequisites are all satisfied by waves ≤ N. Therefore, to begin developing **Wave N+1**, all preceding waves must be implemented.
- Every story carries a `wave: N` field.

### Team distribution 

At plan time you're asked `team_size`. Each wave is split across that many developers into an `assignments:` block (round-robin), so every dev gets a **slice** of independent stories per wave. 

### Parallel implementation

When you run `aire-dev-implement`, if the wave is parallelizable it asks two things up front: **which dev slot you are**, and **one-by-one vs in one go**. 

### Where to find it

- `docs/plans/dependency-graph.yml` — the source of truth (YAML): `team_size`, per-story `wave`/`requires`/`files_touched`, and per-wave `assignments`.
- `docs/plans/implementation-plan.md` → top `## Dependency Graph` section — Mermaid `graph TD` mirror color-coded by wave, plus wave summary + workload-distribution tables.

---

## DevOps Workflows

The DEVOPS agent handles CI/CD, infrastructure as code, and deployment through 4 workflows.

### The `SPEC/references/devops/` Folder

Drop any existing DevOps documentation here **before** running a DevOps workflow — infrastructure PDFs, architecture diagrams, network topology images or deployment runbooks.

```
SPEC/references/devops/
├── infra-architecture.pdf
├── network-topology.png
└── target-state.md
```

Both `aire-devops-discover` (greenfield) and `aire-devops-infra-evolve` (brownfield) run a **mandatory reference check** — they read every `.docx`, `.pdf`, `.md`, `.txt` and view every image in this folder before asking any discovery questions. Values extracted from these references (cloud provider, regions, resource names, SKUs, module choices, operator IPs, compliance requirements) are **pre-filled as defaults** in the discovery questions — you confirm or override each one. On conflict, your answer wins.


### Scenario 1: Greenfield — New Infrastructure from Scratch

```
aire-devops-discover  →  aire-devops-pipeline  →  aire-devops-deploy
```

| Step | Command | What It Does |
|------|---------|--------------|
| 1 | `aire-devops-discover` | Auto-detects app language/framework, asks deployment questions (cloud, modules, naming), generates `docs/deployment/discovery-report.md` |
| 2 | `aire-devops-pipeline` | Creates CI/CD pipelines (GitHub/GitLab/Bitbucket), Dockerfile, Compose, Terraform IaC|
| 3 | `aire-devops-deploy` | Reads discovery report, creates server setup scripts, SSL, monitoring, health checks, and runbooks — everything needed to go from zero to deployed |

### Scenario 2: Brownfield — Evolving Existing Infrastructure

```
aire-devops-infra-evolve  →  aire-devops-pipeline (evolution mode)  →  aire-devops-deploy
```

| Step | Command | What It Does |
|------|---------|--------------|
| 1 | `aire-devops-infra-evolve` | Scans existing IaC/pipelines/Docker/K8s, generates architecture design, gathers change requirements, produces a safe evolution plan |
| 2 | `aire-devops-pipeline` | Detects the evolution plan and enters **Evolution Mode** — refactors/upgrades existing pipelines and IaC per the plan with rollback safety |
| 3 | `aire-devops-deploy` | Reads discovery report + evolution plan, applies evolved Terraform/configs, validates no regression, generates updated runbooks |

---

## Data Engineering Workflow

The **DATA_ENGINEER** agent designs and builds production-grade data platforms — data architecture, modeling, ingestion, transformation, storage, orchestration, quality, governance, and DataOps — through a single, phased workflow that adapts to greenfield or brownfield context.

### The `aire-data-design` Workflow

```
aire-data-design
```

| Aspect | What It Does |
|--------|--------------|
| **Discovery** | Auto-detects existing data assets (warehouses, lakes, streaming, orchestrators, dbt, catalog, quality tooling) and asks only what it cannot detect — regulatory scope, consumers, SLAs, volumes, cost ceiling, residency. Writes `docs/data/discovery-report.md`. |
| **Architecture (ADR)** | Chooses an architecture style (Medallion / Lambda / Kappa / Data Mesh / Data Vault / Kimball / Inmon / Lakehouse) with documented alternatives, then storage, processing, modeling, privacy, and cost decisions. Writes `docs/data/architecture-decision-record.md`. |
| **Data Model & Contracts** | Produces conceptual/logical/physical models and a versioned **data contract** (schema, owner, SLA, quality checks, classification, retention) per published dataset before any pipeline code. |
| **Quality & DataOps** | Designs DAMA-aligned quality tests (schema, freshness, completeness, uniqueness, referential integrity), lineage emission, observability, orchestration, and CI/CD — handing off to `aire-devops-pipeline` for infra wiring. |

### Mode Detection: Greenfield vs Brownfield

The workflow detects its mode automatically:

- **Greenfield** (no `docs/data/current-state.md`) — the full quality bar applies from day one: first dataset ships with contract, tests, lineage, classification, and a catalog entry.
- **Brownfield** (`docs/data/current-state.md` exists) — migrates a legacy DW/lake progressively using **Strangler Fig + dual-write + shadow read**, with reconciliation that must stay green for ≥1 SLA cycle before any per-dataset, user-approved cutover. Never a flag-day cutover.

> The agent reads `SPEC/rulebooks/aire-data-engineering-rulebook.md` first and writes its outputs to `docs/data/`, `data_contracts/`, `dbt/`, `dags/`, and `schemas/` (or language-appropriate equivalents). It hands off to **DEVOPS** for CI/CD/IaC, **QA** for business-level acceptance testing, and **REVIEWER** for PR-ready code.

---

## Workflow Examples

### Example 1: Building a New Feature (Greenfield)

```
Step 1: Start the project
────────────────────────
You: "aire-project-kickoff"
AI:  Creates project structure

Step 2: Gather requirements
───────────────────────────
You: "aire-greenfield-requirements"
AI:  Asks questions, creates docs/requirements.md

Step 3: Design architecture
───────────────────────────
You: "aire-greenfield-architecture"
AI:  Creates technical design with Clean Architecture layers

Step 4: Define design patterns
──────────────────────────────
You: "aire-greenfield-patterns"
AI:  Captures project-wide design patterns and conventions

Step 5: Break into build cycles
───────────────────────────────────────────
You: "aire-build-cycles"
AI:  Proposes cycle structure (CYCLE-1, CYCLE-2, etc.)
     Creates docs/plans/builds/cycle-[N]/cycle-plan.md

Step 6: UI/UX design 
───────────────────────────────
You: "aire-ui-ux-design"
AI:  Produces token-efficient UI/UX design specs

Step 7: Design the data platform (optional, for data-intensive projects)
────────────────────────────────────────────────────────────────────────
You: "aire-data-design"
AI:  - No docs/data/current-state.md found → enters Greenfield Mode
     - Auto-detects existing data assets and stack (warehouse, lake, orchestrator, dbt, catalog)
     - Asks only what cannot be detected: regulatory scope, consumers, SLAs, volumes,
       cost ceiling, residency
     - Writes docs/data/discovery-report.md (STOP — user approves)
     - Picks architecture style (Medallion / Lambda / Kappa / Data Mesh / Vault / Kimball / Lakehouse)
       with alternatives + rationale → docs/data/architecture-decision-record.md (STOP — user approves)
     - Produces conceptual / logical / physical model + ERDs in docs/data/diagrams/
     - Publishes data_contracts/<domain>/<dataset>.yml per dataset
       (schema + SLA + owner + classification + quality checks)
     - Writes docs/data/implementation-plan.md — DAMA-aligned quality tests,
       lineage (OpenLineage), orchestration, CI/CD
     - First dataset ships with the full bar: contract + tests + lineage + classification + catalog
     - Hands off to DEVOPS (CI/CD + IaC), QA (acceptance tests), REVIEWER (PR-ready code)

Step 8: Create implementation plan
──────────────────────────────────
You: "aire-greenfield-plan"
AI:  Creates stories in docs/plans/stories/ (with BUILDID if cycles used)

Step 9: Implement each story
───────────────────────────
You: "aire-dev-implement"
AI:  - Writes tests first
     - Implements code
     - Creates self-review in docs/stories-implemented

Step 10: Code review
────────────────────
You: "aire-review-code story 1.1"
AI:  - Checks SOLID compliance
     - Checks patterns
     - Approves or requests changes (report only — no code edits)

Step 11: Fix review findings (only if review reports issues)
────────────────────────────────────────────────────────────
You: "aire-dev-remediate"
AI:  - Lists available review/triage reports, asks which one
     - Reads plan, architecture, affected story files
     - Confirms scope (which issues will be fixed)
     - TDD-fixes each issue, marks ✅ Resolved in the source report
     - Re-runs full test suite, updates docs/status.md
```

### Example 2: Adding to Existing Code (Brownfield)

```
Step 1: Analyze codebase
────────────────────────
You: "aire-brownfield-inspect"
AI:  Creates docs/architecture/current/00-system-overview.md

Step 2: Deep dive into relevant area
────────────────────────────────────
You: "aire-brownfield-deep-dive auth"
AI:  Analyzes auth subsystem in detail

Step 3: Gather requirements
─────────────────────────
You: "aire-brownfield-requirements"

AI:  📋 How would you like to define requirements?
     [J] I have stories in Jira — pull from active sprint to generate requirements
     [L] I want to describe what we're building from scratch

─── PATH J: Import from Jira ──────────────────────────────────

You: "J"

AI:  ❓ Jira project key? (e.g., PROJ)

You: "CRM"

AI:  Fetching from active sprint via @atlassian-rovo...

     📊 Active Sprint: Sprint 12
        Found 3 technical stories (excluding Done/Closed and non-technical):

     | # | ID      | Title                | Priority | Status  | Epic    |
     |---|---------|----------------------|----------|---------|---------|
     | 1 | CRM-101 | Export leads to CSV   | High     | To Do   | Leads   |
     | 2 | CRM-102 | PDF report for leads  | Medium   | To Do   | Reports |
     | 3 | CRM-103 | Bulk lead assignment  | Medium   | Backlog | Leads   |

     ⏭️ Skipped 1 non-technical story:
        - CRM-104: "Conduct stakeholder interviews" (discovery)

     📊 Story Completeness Analysis:

     Story CRM-101: Export leads to CSV
     Status: ⚠️ INCOMPLETE — Missing: Out of Scope

     Story CRM-102: PDF report for leads
     Status: ✅ COMPLETE

     Story CRM-103: Bulk lead assignment
     Status: ⚠️ INCOMPLETE — Missing: Acceptance Criteria

AI:  ❓ Clarifying Questions for CRM-101: Export leads to CSV
     This story is missing: Out of Scope.
     Based on my analysis of your LeadsPage component:

     1. What should this story NOT include?
        (e.g., should PDF export, server-side export be excluded?)

You: "Exclude PDF export, server-side processing, and custom column selection"

AI:  ❓ Clarifying Questions for CRM-103: Bulk lead assignment
     This story is missing: Acceptance Criteria.
     Based on my analysis of your leads module:

     1. What does "done" look like? Give me 2-3 testable outcomes.

You: "User selects multiple leads, assigns to a rep, confirmation shown"

AI:  ✅ All stories complete. Synthesizing into requirements...

     ✅ docs/requirements.md generated from 3 Jira stories (Sprint 12).
     📄 Review the requirements document and confirm:
       A) Approved
       B) Edit needed — I'll update specific sections

You: "A"

─── PATH L: Define Requirements Locally ────────────────────────

You: "L"

AI:  Current System Understanding:
     Architecture: Monolithic MVC
     Tech Stack: Node.js/Express, PostgreSQL
     Key Modules: auth, leads, reports, users

     What changes/features are we building?

You: "Add password reset feature"

AI:  Based on my analysis of your auth module (JWT middleware, bcrypt hashing,
     existing /auth routes), I have a few questions:

     1. Should reset use email link or SMS OTP?
     2. How long should the reset token be valid?
     3. Is this backend only, or does it include a frontend reset form?
     4. Should expired tokens return a specific error message?

You: "Email link, 1 hour expiry, both BE and FE, yes show expiry message"

AI:  ✅ docs/requirements.md generated.
     📄 Review the requirements document and confirm:
       A) Approved
       B) Edit needed

You: "A"

Step 4: Design target architecture
──────────────────────────────────
You: "aire-brownfield-architecture"
AI:  Creates docs/architecture/design/02-target-architecture-brownfield.md
     (target state for the changes, delta vs current system)

Step 5: Define coding patterns and standards
────────────────────────────────────────────
You: "aire-brownfield-patterns"
AI:  Compares existing patterns against rulebook
     Creates docs/architecture/design/03-patterns-and-standards-brownfield.md

Step 6: Break into build cycles
───────────────────────────────────────────
You: "aire-build-cycles"
AI:  Proposes cycle structure (CYCLE-1, CYCLE-2, etc.)
     Creates docs/plans/builds/cycle-[N]/cycle-plan.md

Step 7: UI/UX design 
───────────────────────────────
You: "aire-ui-ux-design"
AI:  Creates token-efficient UI/UX design specification

Step 8: Design / migrate the data platform (optional, for data-intensive changes)
─────────────────────────────────────────────────────────────────────────────────
You: "aire-data-design"
AI:  - docs/data/current-state.md exists → enters Brownfield Mode
     - Re-verifies legacy inventory (warehouse, lake, orchestrator, contracts) against repo + cloud
     - Captures characterization snapshots for legacy pipeline outputs (no behavior change)
     - Extracts implicit contracts to data_contracts/legacy/*.yml as explicit baselines
     - Writes docs/data/discovery-report.md + docs/data/architecture-decision-record.md
       (STOP at each — user approves)
     - Plans new datasets alongside legacy using Strangler Fig + dual-write + shadow read
     - Schedules reconciliation jobs (row count + key checksum + sum-of-amounts) per migrated dataset
     - Writes docs/data/migration-plan.md per dataset with rollback path
     - Per-dataset cutover gate: reconciliation green ≥1 full SLA cycle, consumer-by-consumer
     - USER APPROVAL GATE at each cutover (never bulk, never flag-day)
     - Tracks every action in docs/data/migration-changelog.md

Step 9: Plan implementation stories
────────────────────────────────────
You: "aire-brownfield-plan"

AI:  Reading docs/requirements.md and architecture analysis...

     📎 Reference files found in SPEC/references/:
        - SPEC/references/leads-mockup.png (image)
     Are any of these relevant to the stories being planned? (Y/N)

You: "Y — leads-mockup.png is relevant to the leads stories"

AI:  Planning with vertical slices based on requirements...

     Epic 2: Leads Enhancements
       Story 2.1: Export leads to CSV (CRM-101)
       Story 2.2: PDF report for leads (CRM-102)
       Story 2.3: Bulk lead assignment (CRM-103)

     Deriving implementation details from codebase...
     - Context files: inferred from architecture deep-dive
     - Patterns: following existing patterns from codebase
     - Steps + tests: derived from existing test structure
     - Includes: SPEC/references/leads-mockup.png in Must Read

     Writing stories...
     ✅ docs/plans/stories/epic-2-story-2.1-Export-leads-to-CSV.md
     ✅ docs/plans/stories/epic-2-story-2.2-PDF-report-for-leads.md
     ✅ docs/plans/stories/epic-2-story-2.3-Bulk-lead-assignment.md

     ✅ All stories written (3 total)
     📁 Stories saved to: docs/plans/stories/
     docs/status.md updated — Progress: 0/3 stories (0%)

     🚀 Next Steps — start implementation:
        aire-dev-implement   ← start here

Step 10: Implement safely
─────────────────────────
You: "aire-dev-implement 2.1"
AI:  - Reads story file (self-contained, no re-explanation needed)
     - Runs existing tests first (baseline)
     - Makes required changes following existing patterns
     - Adds new tests
     - Runs ALL tests
     - Reports: "245 existing tests passing, 8 new tests added"

```

## Daily Development Workflow

Real-world development isn't linear — you'll resume work across sessions, handle QA bugs, and context-switch between stories. This section covers those daily scenarios.

### Resuming Work the Next Day

Each story file created by Planning agent is **self-contained** — it includes all the context an AI agent needs. No warm-up or re-explanation required.

**If you ended yesterday on Story 1.3, start today with:**

```
aire-dev-implement
```

That's it.

**Useful commands when resuming:**

| Command | Purpose |
| ------- | ------- |
| Check `docs/status.md` | See overall project progress |
| Check `docs/stories-implemented/` | See which stories have completed review files |

### Quick Reference — Daily Scenarios

| Scenario | What to Do |
| -------- | ---------- |
| Start of day, continuing stories | `aire-dev-implement` |
| Forgot where I left off | check `docs/stories-implemented/` |
| Finished a story, want review | `aire-review-code` |
| Need to check project progress | Check `docs/status.md` |

---

## Writing Jira Stories for AIRE SDLC Agentic Framework

When importing stories from Jira into the AIRE SDLC Agentic Framework (via the `aire-brownfield-requirements` workflow), the **quality of your Jira stories directly impacts the quality of the output**. The AIRE SDLC Agentic Framework agents can derive implementation steps, context files, patterns, and test requirements from your codebase — but they need three key fields from you.

### Required Fields

Your Jira stories should include:

| Field | What to Provide |
|-------|----------------|
| **Description** | A clear summary of what the story delivers and the user's goal |
| **Acceptance Criteria** | Specific, testable requirements (functional, UI/UX, validation, permissions) |
| **Out of Scope** | Explicit exclusions — what this story does NOT cover |

### Story Template

Refer to the **[Story Format Template](SPEC_cli_node_package/templates/examples/STORY_FORMAT_TEMPLATE.md)** for the recommended structure and examples of each field.

---

## Jira MCP Integration Guide

The AIRE SDLC Agentic Framework supports Jira integration through Atlassian's official MCP (Model Context Protocol) server. This allows AI agents to interact with your Jira workspace during workflows like `aire-dev-implement` and `aire-greenfield-plan`.

### What is Jira MCP?

Jira MCP enables AI agents to:
- Fetch issue details from Jira
- Update issue status and fields
- Create new issues and subtasks
- Link implementation to Jira tickets
- Maintain traceability between code and requirements

### Automatic Setup

When you run `aire init` or `aire update`, you'll be prompted to enable Jira integration. The CLI automatically configures the appropriate MCP settings for your selected IDE.

### IDE-Specific Configuration

The MCP configuration varies by IDE. Below are the configurations automatically created by `aire init`:

#### GitHub Copilot (VS Code)

Configuration file: `.vscode/mcp.json`

```json
{
  "servers": {
    "atlassian-rovo": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://mcp.atlassian.com/v1/mcp"
      ]
    }
  }
}
```

**Next Steps:**
1. Restart your IDE 
2. Open Copilot Chat
3. Follow the browser prompt to log in to Atlassian
4. Verify connection in Chat Window Settings > MCP Servers
---

#### Cursor IDE

Configuration file: `.cursor/mcp.json`

```json
{
  "mcpServers": {
    "atlassian-rovo": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://mcp.atlassian.com/v1/mcp"
      ]
    }
  }
}
```

**Next Steps:**
1. Restart your IDE 
2. Open Cursor Chat
3. Follow the browser prompt to log in to Atlassian
4. Verify connection in Settings > Tools & Integrations > MCP Tools

---

#### Claude Code 

Configuration file: `.mcp.json` (project root)

```json
{
  "mcpServers": {
    "atlassian-rovo": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://mcp.atlassian.com/v1/mcp"
      ]
    }
  }
}
```

**Next Steps:**
1. Approve the server when prompted by Claude Code
2. Follow the browser prompt to log in to Atlassian
3. Verify with: `/mcp` inside Claude Code
4. If the failure message appears, click "Reconnect" or Restart the Claude code.



---

#### Windsurf IDE

Configuration file: `.windsurf/mcp_config.json`

```json
{
  "mcpServers": {
    "atlassian-rovo": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://mcp.atlassian.com/v1/mcp"
      ]
    }
  }
}
```

**Important for Windsurf Users:**

After running `aire init`, you need to copy the MCP configuration to Windsurf's global config location:

**Windows:** (For Windows users, Command Prompt is the preferred terminal)
```cmd
copy .windsurf\mcp_config.json %USERPROFILE%\.codeium\windsurf\mcp_config.json
```

**macOS/Linux:**
```bash
cp .windsurf/mcp_config.json ~/.codeium/windsurf/mcp_config.json
```

**Next Steps:**
1. Copy the config file to global location (see above)
2. Restart your IDE
3. Open Cascade panel
4. Click MCPs icon (top right) to view installed servers
5. Follow browser prompt to authenticate with Atlassian

**Tip:** Configure tools from Windsurf Settings > Cascade > MCP Servers.

---

#### Antigravity

Configuration file: `.gemini/antigravity/mcp_config.json`

```json
{
  "mcpServers": {
    "atlassian-mcp-server": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://mcp.atlassian.com/v1/mcp"
      ]
    }
  }
}
```

**Important for Antigravity Users:**

After running `aire init`, you need to copy the MCP configuration to Antigravity's global config location:

**Windows:** (For Windows users, Command Prompt is the preferred terminal)
```cmd
copy .gemini\antigravity\mcp_config.json %USERPROFILE%\.gemini\config\mcp_config.json
```

**macOS/Linux:**
```bash
cp .gemini/antigravity/mcp_config.json ~/.gemini/config/mcp_config.json
```

**Example (Windows):**
```cmd
copy .gemini\antigravity\mcp_config.json C:\Users\YourUsername\.gemini\config\mcp_config.json
```

**Next Steps:**
1. Copy the config file to global location (see above)
2. Reload your IDE window
3. Follow the browser prompt to log in to Atlassian
4. Verify connection by opening the MCP store via the "..." dropdown at the top of the editor's agent panel.

---

#### Kiro IDE

Configuration file: `.kiro/settings/mcp.json`

```json
{
  "mcpServers": {
    "atlassian-rovo": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://mcp.atlassian.com/v1/mcp"
      ],
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

**Next Steps:**
1. Restart Kiro IDE
2. The MCP server will reconnect automatically
3. Follow the browser prompt to log in to Atlassian
4. Verify connection in MCP Server view in Kiro feature panel

**Tip:** View MCP servers from the command palette: 'Open Kiro MCP UI'

---

#### Codex

**MCP configuration file:** `.codex/config.toml` (project-scoped, trusted projects only). For a global install, use `~/.codex/config.toml` instead.

```toml
[mcp_servers.atlassian-rovo]
command = "npx"
args = ["-y", "mcp-remote", "https://mcp.atlassian.com/v1/mcp"]
```

**Next Steps:**
1. Restart Codex (CLI or IDE extension) so it reloads `config.toml`
2. Follow the browser prompt to log in to Atlassian
3. Verify with `/mcp` in the Codex TUI, or `codex mcp list` from the CLI

**Tip:** You can also add the server without editing TOML by hand:
```bash
codex mcp add atlassian-rovo -- npx -y mcp-remote https://mcp.atlassian.com/v1/mcp
```

---

### Manual Configuration

If you skipped Jira integration during `aire init`, you can manually add the configuration:

1. Create the appropriate config file for your IDE (see above)
2. Add the JSON configuration matching your IDE's format
3. Reload your IDE
4. Authenticate when prompted

### Authentication

All IDEs use OAuth 2.1 browser-based authentication:

1. When you first use a Jira-related feature, your browser will open
2. Log in to your Atlassian account
3. Grant permissions to the MCP server
4. Return to your IDE - connection is now active

### Using Jira in Workflows

Once configured, AI agents can access Jira during workflows. The agents are trained to interact with Jira, fetch stories, update statuses, and add comments.

#### 1. Fetching & Implementing a Story
When you run `aire-dev-implement`, you can ask the agent to pick a specific story from your board.

**User Interaction:**
```
You: "aire-dev-implement"

AI: Which story would you like to implement?
    ... [list of local stories] ...
    
You: "From jira pick ACI-447"

AI: Found: ACI-447 "Implement User Login"
    Status: To Do
    Priority: High
    
    ❓ Should I update Jira status to "In Progress"? (yes/no)

You: "yes"

AI: @atlassian-mcp-server Update story ACI-447:
    - Status: In Progress
    - Assign to: [Current User]
    - Comment: "Development started via AIRE SDLC Agentic Framework Method"
```

#### 2. Updating Status & Comments
The agent maintains the Jira lifecycle automatically.

**Completing a Story:**
```
✅ Story implementation complete!
❓ This story exists in Jira as ACI-447.
   Would you like me to mark it "Done" in Jira? (yes/no/skip)
```

**If you say YES, the agent will:**
- Update status to "Done"
- Add a comment with test results and coverage
- Link any relevant PRs

#### 3. Creating Issues from Plan
During `aire-greenfield-plan`, the agent can export the entire plan to Jira, creating Epics and Stories automatically.

**User Interaction:**
```
AI: ❓ Export plan to Jira? (yes/no/skip)

You: "Yes, use project key ACI and assign all stories to me"

AI: Perfect! Now I'll create the epics and stories in the ACI project.
    
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    📝 Creating Jira Issues in ACI Project
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    Creating 4 Epics...
    
    ✓ Created Epic: ACI-450 "Project Foundation"
    ✓ Created Epic: ACI-451 "User Authentication"
    
    Creating 8 Stories...
    
    ✓ Created Story: ACI-452 "Backend Skeleton" (Linked to ACI-450)
       - Assigned to: @You
    ✓ Created Story: ACI-453 "Frontend Skeleton" (Linked to ACI-450)
       - Assigned to: @You

    ✅ Jira export complete! 12 issues created.
```

---

## GitHub Projects Integration

The AIRE SDLC Agentic Framework now supports **GitHub Projects (V2)** tracking option alongside Jira and local-only tracking. The agent uses the GitHub CLI (`gh`) to create the project, link it to the repository, bootstrap labels, custom fields and milestones, and then create issues directly from the planned epics and stories.

### Prerequisite: Install the GitHub CLI

The agent drives GitHub through the `gh` CLI. You must install it once on your machine before running the workflows below:

➡️ **Download / install: <https://cli.github.com/>**

After install, authenticate with the scopes the workflows need:

```bash
gh auth login -s repo,project,read:org
```

---

## Azure DevOps Integration

The AIRE SDLC Agentic Framework supports **Azure Boards** as a work item tracking option alongside Jira and GitHub Projects. The agent uses the **Azure CLI** (`az`) with the **azure-devops extension** to create work items, update statuses, and link stories to your Azure DevOps board.


### Prerequisite: Install Azure CLI (One-Time Manual Setup)

The agent drives Azure DevOps through the `az` CLI. You must install it **once on your machine**.

➡️ **Download / install: <https://learn.microsoft.com/en-us/cli/azure/install-azure-cli>**

After install, add the DevOps extension and authenticate:

```bash
# Install the Azure DevOps extension
az extension add --name azure-devops

# Log in with your Azure / Entra ID account
az login
```

`az login` opens a browser window. The session stays active until you run `az logout`. This is a one-time setup per machine.

---

## Archive & Reset

The `aire-archive` workflow is a **lifecycle command** run at the end of a sprint. It snapshots the entire `docs/` tree into a compressed archive, then optionally resets the workspace for the next sprint.

### When to Use

Use `aire-archive` when you have completed a sprint and want to:
- Preserve a named snapshot of all generated artifacts (requirements, architecture, plans, reviews, test reports)
- Reset `docs/` for the next cycle while retaining the folder structure


### What Is Preserved

| Always kept | Removed by `--clean` |
|-------------|----------------------|
| `docs/status.md` | `docs/requirements.md` |
| `docs/bugs.md` | `docs/architecture/**` |
| `docs/archive/` | `docs/plans/**` |

### Next Step After Archive

After running `aire-archive`, the recommended next step is:

```
aire-brownfield-inspect
```

This starts a fresh brownfield cycle on the current (now-clean) workspace.

---

## Helix Platform Integration (Helix MCP)

> ⚠️ **Status: test AND prod endpoints both verified live (MCP-native OAuth 2.1).** **Test** `https://lab-helix-mcp.3pillarglobal.com/helix-atlas/mcp` (auth realm `3pg-innovation` on `lab-auth.3pillarglobal.com`) is the framework default. **Prod** `https://helix-mcp.3pillarglobal.com/helix-atlas/mcp` (auth realm `nexus` on `nexus-auth.3pillarglobal.com`) — reach it with `--prod --url https://helix-mcp.3pillarglobal.com/helix-atlas/mcp`. The MCP host is a dedicated subdomain, **not** the Studio host (`lab-swarch…`/`helix.3pillarglobal.com`), which only supplies the solution id. Tool names and behavior may still change.

The **Helix integration** connects AIRE to the **Helix platform itself** — giving your agent the pre-indexed **code knowledge graph** (read) and **solution documents** (read + write), live, scoped to one Helix solution. The framework talks only to Helix; **Helix** is what connects to the underlying code repositories (GitHub, GitLab, Bitbucket, Azure DevOps, AWS CodeCommit), so no per-provider setup is needed on the framework side.

| Aspect | How it works |
|---|---|
| Reaches | The Helix platform (which owns the repo-provider connections) |
| Gives you | Code knowledge graph (read) + solution documents (read + write) |
| Transport | Remote HTTP via the `mcp-remote` stdio bridge |
| Auth | OAuth 2.1 (browser redirect to Helix on first contact) |
| Binding | One solution via the `x-solution-id` header |

### Connecting

Easiest — let the framework generate it:

```bash
# On demand, for one or all IDEs:
aire helix connect --solution-id <your-solution-id> --ide claude
aire helix connect --solution-id <your-solution-id> --ide all

# Just print the equivalent native command (write nothing):
aire helix connect --solution-id <your-solution-id> --print

# Override the endpoint for a non-default Helix instance (e.g. a Test environment).
# Pass the full MCP path (…/helix-atlas/mcp), not just the host — see the note below.
aire helix connect --solution-id <your-solution-id> --url <mcp-endpoint-url>

# Use a pre-registered OAuth client (skips dynamic client registration) where the
# auth server blocks DCR — e.g. Keycloak "Trusted Hosts" → "Host not trusted".
aire helix connect --solution-id <your-solution-id> --client-id <client-id-from-admin>

# Add a second connection (e.g. production) without overwriting the default
# `helix` entry. --prod is shorthand for `--name helix-prod`; it always requires
# --url (no prod endpoint is baked in) — use the verified prod host below.
aire helix connect --solution-id 784 --ide claude                                                                  # → server `helix` (test)
aire helix connect --solution-id 383 --prod --url https://helix-mcp.3pillarglobal.com/helix-atlas/mcp --ide claude  # → server `helix-prod`
aire helix connect --solution-id <id> --name helix-solnB --url <its-mcp-url>                                       # → any custom key
```

> **Tip:** pass the **bare** solution id (`784`) to `--solution-id`. A pasted Studio URL (`https://…/studio/784`) is automatically reduced to `784` — the `x-solution-id` header must hold the id only, never the URL.

Or answer **y** at the **HELIX INTEGRATION SETUP** prompt during `aire init` / `aire update`.

Or by hand for Claude Code (the native form the above command prints):

```bash
claude mcp add helix https://lab-helix-mcp.3pillarglobal.com/helix-atlas/mcp \
  --transport http --client-id helix-local-mcp-agent --callback-port 8765 \
  -H "x-solution-id: <your-solution-id>"
```

> The `\` line-continuations are bash/zsh (Linux/macOS/Git Bash). On Windows `cmd` use `^`, in PowerShell use a backtick `` ` ``, or paste as one line. `aire helix connect --solution-id <id> --print` emits the single-line form for any shell.

Find your Solution ID in the Helix Studio URL for your solution, or ask your Helix Super Admin. It is an identifier, not a secret (OAuth handles auth), so it is safe to commit in project-scoped MCP config.

> ⚠️ **The Studio host is NOT the MCP host.** The Helix Studio URL (`https://<studio-host>/studio/<N>`) is a web UI behind browser SSO — pointing an MCP client at it just 302-redirects to a login page and the handshake fails. Take **only the solution id `<N>`** from that URL for the `x-solution-id` header; use the separate **MCP host** with the `/helix-atlas/mcp` path for the `url`.
>
> | From the Studio URL | Use in MCP config |
> | --- | --- |
> | host, e.g. `lab-swarch.3pillarglobal.com` (Studio UI) | the paired **MCP** host, e.g. `lab-helix-mcp.3pillarglobal.com` |
> | path `/studio/<N>` | endpoint path `/helix-atlas/mcp` |
> | trailing `<N>` | `x-solution-id: <N>` |
>
> Example: Studio `https://lab-swarch.3pillarglobal.com/studio/784` → MCP url `https://lab-helix-mcp.3pillarglobal.com/helix-atlas/mcp`, `x-solution-id: 784`. (Confirm the exact MCP host for your environment with your Helix team if it isn't documented.)

### `aire helix` subcommands

| Command | Description |
|---|---|
| `aire helix connect --solution-id <id> [--ide <name>]` | Generate + write the Helix MCP config (default `--ide all`). |
| `aire helix connect --solution-id <id> --url <endpoint>` | Override the Helix MCP endpoint (alias `--endpoint`); defaults to the verified **test** endpoint. |
| `aire helix connect --solution-id <id> --name <key>` | Register under a custom server key (alias `--server-key`); add a second connection without overwriting `helix`. |
| `aire helix connect --solution-id <id> --prod --url <endpoint>` | Shorthand for `--name helix-prod`; **requires** `--url`. Verified prod endpoint: `https://helix-mcp.3pillarglobal.com/helix-atlas/mcp` (auth realm `nexus`). |
| `aire helix connect --solution-id <id> --client-id <id>` | Override the pinned client `helix-local-mcp-agent` with a different *registered* client. (The default is baked into every config; Helix rejects dynamic registration.) |
| `aire helix connect --solution-id <id> --print` | Print the equivalent `claude mcp add` command only; write nothing. |
| `aire helix --help` | Full flag reference. |

### The 15 tools

- **Solution documents (read + write):** `save_solution_document_tool`, `get_solution_document_tool`, `list_solution_documents_tool`, `append_to_solution_document_tool`, `rewrite_solution_document_tool`, `delete_solution_document_tool`, `update_document_metadata_tool`, `change_document_lifecycle_tool` (governed lifecycle transition — optimistic locking + rationale required; official docs are UI-only)
- **Graph (read):** `codebase_agent_query`, `codebase_cypher_query`, `graph_change_impact`
- **Knowledge Q&A (read):** `document_chatbot_query` (natural-language Q&A over the solution's docs/knowledge base), `platform_docs_query` (Helix platform product help — the explicit `/help` channel, not solution-scoped)
- **Context / utility:** `get_session_context_tool`, `get_current_date_tool` (today's date, UTC; for a date inside a saved doc use the `{{date}}` token instead)

### Which workflows use it?

| Workflow | How it uses `helix` |
|---|---|
| [`aire-brownfield-inspect`](SPEC_cli_node_package/templates/workflows/aire-brownfield-inspect.md) | `codebase_agent_query` for a fast structural orientation; optional `save_solution_document_tool` to persist the overview into Helix. |
| [`aire-brownfield-deep-dive`](SPEC_cli_node_package/templates/workflows/aire-brownfield-deep-dive.md) | `codebase_cypher_query` for precise dependency/inheritance questions; `graph_change_impact` to scope a change. |
| [`aire-helix-sync`](SPEC_cli_node_package/templates/workflows/aire-helix-sync.md) | Reads Helix artifacts — `list_solution_documents_tool` / `get_solution_document_tool`, `get_session_context_tool`, and on-demand graph queries — to sync them **down** into `docs/helix/`. Governed by `aire-helix-rulebook.md`. Once synced, seven workflows (`aire-project-kickoff`, `aire-brownfield-inspect`, `aire-brownfield-deep-dive`, brownfield/greenfield requirements & architecture) consume the tree as **read-only reference context** via `INDEX.md` — no live Helix connection needed. |

### Further reading

| Document | Covers |
|---|---|
| [`Helix-MCP-Connect.md`](Helix-MCP-Connect.md) | Hands-on connection guide — OAuth flow, per-IDE config, the 15 tools, finding your Solution ID, troubleshooting, limitations |
| [`docs/helix-mcp/usage-examples.md`](docs/helix-mcp/usage-examples.md) | How to actually use the 15 tools — example chat prompts per tool, end-to-end cycles, and how workflows drive them |
| [`docs/helix-mcp/architecture-diagrams.md`](docs/helix-mcp/architecture-diagrams.md) | Architecture diagrams (HLD/LLD) — system context, the 15 tools, the connect/OAuth/live read-write flow, and credential/solution binding |

---

## Command Reference

| Command | Description |
|---------|-------------|
| `aire init` | Initialize AIRE SDLC Agentic Framework in current directory |
| `aire init --force` | Force clean installation (overwrites all existing files) |
| `aire update` | Update to latest version (preserves your generated documents) |
| `aire update --force` | Force update (overwrites all existing files) |
| `aire status` | Show installed agents/workflows, reference docs, and generated documentation counts |
| `aire read <file>` | Extract text from .docx/.pdf reference documents and convert to MD format |
| `aire archive "<label>"` | Snapshot `docs/` into `docs/archive/<label>-<YYYY-MM-DD>.zip` |
| `aire archive "<label>" --clean` | Snapshot and reset `docs/` contents (keeps folder structure; preserves  `bugs.md`, `archive/`) |
| `aire helix connect --solution-id <id> [--ide <name>]` | Generate + write the Helix platform MCP config (default `--ide all`) |
| `aire helix connect --solution-id <id> --print` | Print the equivalent `claude mcp add` command only; write nothing |
| `aire helix --help` | Full flag reference for the Helix integration |
| `aire --help` | Show help information |

## Folder Structure

After running `aire init`, your project will have:

```
your-project/
├── SPEC/                              # AIRE SDLC Agentic Framework Method files (methodology)
│   ├── agents/                        # 13 AI agent definitions
│   │   ├── AIRE_ANALYST_PM_BROWNFIELD.md
│   │   ├── AIRE_ANALYST_PM_GREENFIELD.md
│   │   ├── AIRE_ARCHITECT.md
│   │   ├── AIRE_PRODUCT_OWNER.md
│   │   ├── AIRE_DEV.md
│   │   ├── AIRE_REVIEWER.md
│   │   ├── AIRE_QA.md
│   │   ├── AIRE_BUILD_CYCLE_PLANNER.md
│   │   ├── AIRE_UI_UX_DESIGNER.md
│   │   ├── AIRE_INITIALIZER.md
│   │   ├── AIRE_DEVOPS.md
│   │   ├── AIRE_REQUIREMENTS_STEWARD.md
│   │   └── AIRE_DATA_ENGINEER.md
│   │
│   ├── rulebooks/                     # Quality standards
│   │   ├── aire-brownfield-rulebook.md
│   │   ├── aire-greenfield-rulebook.md
│   │   ├── aire-implementation-rulebook.md
│   │   ├── aire-review-rulebook.md
│   │   ├── aire-qa-rulebook.md
│   │   ├── aire-devops-rulebook.md
│   │   ├── aire-requirements-steward-rulebook.md
│   │   ├── aire-data-engineering-rulebook.md
│   │   ├── aire-design-patterns.md
│   │   ├── aire-helix-rulebook.md
│   │   └── aire-clean-architecture.md
│   │
│   ├── workflows/                     # Step-by-step processes
│   │   ├── aire-project-kickoff.md
│   │   ├── aire-greenfield-requirements.md
│   │   ├── aire-greenfield-architecture.md
│   │   ├── aire-greenfield-patterns.md
│   │   ├── aire-greenfield-plan.md
│   │   ├── aire-ui-ux-design.md
│   │   ├── aire-brownfield-inspect.md
│   │   ├── aire-brownfield-deep-dive.md
│   │   ├── aire-brownfield-requirements.md
│   │   ├── aire-brownfield-architecture.md
│   │   ├── aire-brownfield-patterns.md
│   │   ├── aire-brownfield-plan.md
│   │   ├── aire-build-cycles.md
│   │   ├── aire-helix-sync.md
│   │   ├── aire-dev-implement.md
│   │   ├── aire-dev-remediate.md
│   │   ├── aire-enhancement.md
│   │   ├── aire-drift.md
│   │   ├── aire-review-code.md
│   │   ├── aire-qa-test-plan.md
│   │   ├── aire-qa-validate.md
│   │   ├── aire-qa-regression.md
│   │   ├── aire-qa-triage.md
│   │   ├── aire-devops-discover.md
│   │   ├── aire-devops-pipeline.md
│   │   ├── aire-devops-deploy.md
│   │   ├── aire-devops-infra-evolve.md
│   │   ├── aire-archive.md
│   │   ├── aire-data-design.md
│   │   ├── aire-pr-generator.md
│   │   ├── aire-pr-reviewer.md
│   │   ├── aire-raise-defect.md
│   │
│   ├── templates/                     # Template files
│   │   ├── IMPLEMENTATION_PLAN_FORMAT.md
│   │   ├── STATUS_FORMAT.md           # Canonical status.md format
│   │   └── enhancement.TEMPLATE.md    # Enhancement intake template
│   │
│   └── references/                    # Your documents go here
│       ├── (PRD, Figma exports, technical specs)
│       ├── builds/                    # Sequential build phase documents
│       │   ├── build-1.pdf            # Phase 1 scope & features
│       │   ├── build-2.pdf            # Phase 2 scope & features
│       │   └── build-N.pdf            # Phase N ...
│       └── devops/                    # DevOps reference docs (infra, runbooks)
│
├── docs/                              # Generated documentation (OUTPUT)
│   ├── requirements.md                # Project requirements (generated by requirements workflows)
│   ├── status.md                      # Live project status — updated by every workflow
│   ├── bugs.md                        # Bug & incident tracker
│   ├── architecture/
│   │   ├── current/                   # Brownfield: system analysis
│   │   └── design/                    # New/target architecture design
│   ├── architecture-diagrams/         # Architecture diagrams (.md files)
│   │   └── 00-system-architecture-diagrams-greenfield.md
│   ├── plans/                         # Implementation plans
│   │   ├── implementation-plan.md     # Master plan index
│   │   ├── dependency-graph.yml       # Machine-readable story dependency map (wave assignments)
│   │   ├── build-cycles.md            # Build cycles overview (if cycles used)
│   │   ├── builds/                    # Cycle plan documents
│   │   │   ├── cycle-1/cycle-plan.md
│   │   │   └── cycle-2/cycle-plan.md
│   │   └── stories/                   # Individual story files
│   ├── stories-implemented/           # Completed stories with self-reviews
│   │   └── story-{N.M}-review.md
│   ├── enhancements/                  # Minor enhancement specs (aire-enhancement)
│   │   ├── enhancement-{NNN}.md
│   │   └── screenshots/               # Screenshots reference for enhancements
│   ├── deployment/                    # DevOps workflow output
│   │   ├── discovery-report.md        # Deployment requirements (aire-devops-discover)
│   │   ├── deployment-plan.md         # Full deployment plan (aire-devops-deploy)
│   │   ├── pipeline-secrets.md        # Required secrets/variables list
│   │   ├── infra-current-state.md     # Existing infra architecture (aire-devops-infra-evolve)
│   │   ├── infra-evolution-plan.md    # Brownfield evolution plan
│   │   └── runbook-*.md               # Deploy, rollback, and troubleshoot runbooks
│   ├── reviews/                       # Code review reports
│   ├── testing/                       # Test/validation reports
│   └── data/                          # Data engineering outputs (aire-data-design)
│       ├── discovery-report.md
│       ├── architecture-decision-record.md
│       ├── diagrams/                  # ERDs per domain (Mermaid/PlantUML)
│       ├── implementation-plan.md
│       ├── current-state.md           # Brownfield: legacy baseline
│       ├── migration-plan.md          # Brownfield: per-dataset cutover plan
│       └── migration-changelog.md     # Brownfield: dual-write/cutover history
│
├── data_contracts/                    # Versioned dataset contracts (schema + SLA + owner + quality checks)
├── dbt/                               # Transformation models (staging / intermediate / marts) — or chosen engine equivalent
├── dags/                              # Orchestration code (Airflow / Dagster / Prefect) — created by aire-data-design when applicable
├── .ide/                              # Selected IDE configuration (e.g., .cursor, .github, .claude, .windsurf, .agent, .kiro, .codex)
├── .agents/                           # Codex companion folder (skills) — created when Codex is selected
└── AGENTS.md                          # Codex root loader file — created when Codex is selected
```

### The `SPEC/references/` Folder

Provide your meeting transcripts, PRDs, or designs below. The agent will reference these files to generate requirements, architecture documents, and implementation plans:

```
SPEC/references/
├── PRD.md
├── figma-export.png
└── architecture-diagram.pdf
```

#### Reading .docx and .pdf Files

The framework supports extracting text from Word and PDF documents:

```bash
# Extract text from a Word document
aire read SPEC/references/requirements.docx

# Extract text from a PDF
aire read SPEC/references/architecture.pdf
```

This command will:
1. Extract all text content from the document
2. Convert it to MD format for token optimization
3. Save the output to `SPEC/references/[filename].md`
4. Print the content to console for immediate AI ingestion

When reference documents exist, agents will:
- ✅ **STRICTLY FOLLOW** your requirements
- ✅ **NOT suggest changes** to your designs
- ✅ Only ask for clarification on ambiguous points
- ✅ **Use `aire read` to verify contents** before making assumptions about .docx/.pdf files

### The `docs/enhancements/screenshots/` Folder

When you run the `aire-enhancement` workflow to request a minor change on an ongoing project, drop any supporting screenshots into this folder. The workflow agents will view them directly when scoping and implementing the enhancement.

```
docs/enhancements/
├── enhancement-1.md            # Auto-created by aire-enhancement (intake + impact scan record)
├── enhancement-2.md
└── screenshots/                # ← put your reference images here
    ├── enhancement-1.png   

```

**Who views the images:**
- **Analyst (Phase 1B)** — confirms intake against the screenshots
- **Architect (Phase 2)** — uses visual cues to locate the affected component in the codebase
- **Dev (Phase 6)** — references screenshots while implementing the change

**Notes:**
- Screenshots are **optional** — the workflow proceeds regardless of whether any images are present.
- Both PNG and JPG are fine. File names are free-form; prefixing with `enhancement-<N>-` makes it easy to associate images with a specific run, but is not required.
- The folder is created automatically by `aire init` / `aire update` alongside `docs/enhancements/`.

### The `SPEC/references/builds/` Folder

Use this folder when your project is planned across **multiple sequential build phases** — each build representing a distinct scope of work (e.g., MVP, v1.1, v2.0).

```
SPEC/references/builds/
├── build-1.pdf       # Phase 1: core features / MVP
├── build-2.pdf       # Phase 2: extended features
└── build-3.pdf       # Phase 3: advanced capabilities
```

#### How It Works with Greenfield Workflows

When build documents are present, the greenfield agents read them **in order** and use them to drive the full planning pipeline:

| Workflow | What the Agent Does with Build Docs |
|----------|--------------------------------------|
| `aire-greenfield-requirements` | Reads all build files in sequence and generates a `requirements.md` that maps features to build phases |
| `aire-greenfield-architecture` | Designs the system architecture to accommodate all phases, noting what is needed per build |
| `aire-greenfield-patterns` | Designs the system coding patterns for each build |
| `aire-greenfield-plan` | Creates epics and stories **grouped by build phase**, so each build has its own independent epics and stories that can be implemented by the dev agent |


### The `docs/architecture-diagrams/` Folder

Architecture diagrams are generated here by AI workflows (e.g., during `aire-greenfield-architecture`) in markdown format:

```
docs/architecture-diagrams/
├── 00-system-architecture-diagrams-greenfield.md
```

These diagrams provide visual reference for:
- System architecture overview
- Component relationships
- Data flow and interactions
- Technology stack visualization

### The `docs/stories-implemented/` Folder

When implementing stories, the Dev agent automatically creates this directory and generates self-review files here:

```
docs/stories-implemented/
├── story-1.1-review.md
├── story-1.2-review.md
└── story-2.1-review.md
```

Each self-review contains:
- Implementation summary
- Test results and coverage
- Code quality checks
- SOLID principles compliance
- Clear traceability of finished work

---

## .gitignore Management

During every `aire init` and `aire update`, the AIRE SDLC Agentic Framework automatically maintains a managed block inside your project's `.gitignore` file. The file is created if it does not already exist.

### What is added

The managed block covers:

- **`SPEC/`** — the framework's agents, rulebooks, workflows, and templates directory. `SPEC/references/` is not added in .gitignore.
- **IDE folders** — only the framework-managed paths inside each IDE folder you selected (for example `.claude/agents/`, `.claude/skills/`, `.kiro/skills/`, `.kiro/steering/`, `.cursor/rules/`, `.windsurf/rules/`).
- **`.github/`** — only the AIRE SDLC Agentic Framework-managed paths (`.github/agents/`, `.github/instructions/`, `.github/copilot-instructions.md`). Your `.github/workflows/` directory and any other CI/CD files remain tracked.

> ⚠️ **Do not commit the AIRE SDLC Agentic Framework files or remove their entries from `.gitignore`.**.

---

## Security & Compliance

The **3Pillar Global Code Review & Security Framework** (CodeGuard + OWASP) is integrated into AIRE SDLC Agentic Framework. Running `aire init` or `aire update` installs the secure-coding rules for your selected IDE as part of the setup, alongside the workflows, agents, and rulebooks.

Coverage includes:
- **23 CodeGuard Security Rules** — Language-specific secure coding patterns
- **86 OWASP Top 10 Rules** — Protection against common vulnerabilities
- **IDE Integration** — Cursor, Windsurf, GitHub Copilot, Claude Code, Kiro, Codex, and Antigravity

For more details please refer: **🔒 [AI-CoE-Security-and-Compliance-Coding-Assistants](https://github.com/3PillarGlobal/AI-CoE-Security-and-Compliance-Coding-Assistants)**

---

## Project Status Tracking

The AIRE SDLC Agentic Framework automatically maintains a comprehensive project status file at `docs/status.md`. This file is your single source of truth for tracking project progress.

### What's in status.md?

The status file provides real-time visibility into:

| Section | What It Shows |
|---------|---------------|
| **Project Overview** | Project name, type (Greenfield/Brownfield), start date, active build cycle |
| **Overall Status** | 🟢 ON TRACK / 🟡 IN PROGRESS / 🔴 BLOCKED |
| **Progress Summary** | Overall completion percentage and a step-by-step table showing status, owner, date, and evidence for each workflow step (Requirements, Architecture, Build Cycles, Epic rows, Review, QA, etc.) |
| **Current Step Details** | What is actively being worked on, with sub-step checklist progress |
| **Build Cycles** | Cycle-by-cycle breakdown — BUILDID, scope, story count, status, start/end dates |
| **Story Tracker** | Every story listed with BUILDID, start date, and end date — updated by DEV as stories are implemented |
| **Completed Steps** | Finished steps and stories with evidence file paths |
| **Upcoming** | Next stories and workflow steps to tackle |
| **Blockers** | Critical issues preventing progress, with owner and status |
| **Agent Activity** | Which agents are active, idle, or on standby and their last action |


## Bug & Incident Reporting

All bugs and production incidents must be reported using the standardized format in `docs/bugs.md`. This file is automatically created when you run `aire init` or `aire update`, ensuring every project has a consistent place to track defects and incidents across build cycles.

Refer to the **[Bug & Incident Tracker Template](SPEC_cli_node_package/templates/examples/bugs.md)** for the full format and field definitions.

---

## Summary

| What | How |
|------|-----|
| **Install** | `git clone` → `npm install` → `npm link` |
| **Initialize** | `aire init` in your project |
| **New project** | Use `aire-project-kickoff`, `aire-greenfield-requirements`, etc. |
| **Existing code** | Use `aire-brownfield-inspect`, `aire-brownfield-deep-dive`, etc. |
| **Implement** | Use `aire-dev-implement` |
| **Review** | Use `aire-review-code` |
| **Remediate** | Use `aire-dev-remediate` after a review or triage report flags issues |
| **QA & Validate** | Use `aire-qa-test-plan`, `aire-qa-validate`, `aire-qa-regression`, `aire-qa-triage` |
| **DevOps** | Use `aire-devops-discover` → `aire-devops-pipeline` → `aire-devops-deploy` (or `aire-devops-infra-evolve` for brownfield) |
| **Archive sprint** | Use `aire-archive` to snapshot `docs/` and reset for the next cycle |
| **Data platforms** | Use `aire-data-design` (greenfield or brownfield migration) |
| **Raise a PR** | Use `aire-pr-generator` to repair `docs/status.md` and open an evidence-grounded, AI-labeled PR |
| **Review a PR** | Use `aire-pr-reviewer` for an agentic review — inline comments plus a structured summary (issues / questions / suggestions / human review) |
| **Track progress** | Check `docs/status.md` anytime |
| **Report bugs** | Use `docs/bugs.md` format |
| **Raise defects** | Use `aire-raise-defect` to turn bug findings into individually trackable Bug issues in Jira / Azure DevOps / GitHub |

---

© 3Pillar Global - AIRE SDLC Agentic Framework
