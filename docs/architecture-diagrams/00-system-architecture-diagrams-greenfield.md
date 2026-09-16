# Architecture Diagrams - bAIright Web Redesign (Wizard & UX)

**Source**: `docs/architecture/design/00-system-architecture-greenfield.md`  
**Generated**: 2026-09-16

> This file contains Mermaid diagrams extracted from the architecture document for easy preview.
> For full architecture details, refer to the source `.md` file.

---

## System Context Diagram

```mermaid
flowchart TD
  User["👤 Shopper / PowerUser"]
  
  subgraph Client ["Next.js Frontend Client"]
    UI["AgentCategoryLauncher Component"]
  end
  
  subgraph Server ["Next.js Server API"]
    Route["/api/agent/research-parameters"]
    CacheSvc["ParameterCacheService"]
  end
  
  subgraph Storage ["Database & External Services"]
    SupaDB[("Supabase DB (parameter_cache)")]
    GeminiAPI["🤖 Google Gemini 2.0 Flash API"]
  end
  
  User -->|Interacts with Wizard| UI
  UI -->|POST /api/agent/research-parameters| Route
  Route -->|1. Lookup Cache| CacheSvc
  CacheSvc -->|Read / Write| SupaDB
  Route -->|2. Cache MISS: Research Parameters| GeminiAPI
```

---

## Component Architecture Diagram

```mermaid
flowchart TB
  subgraph Presentation ["Presentation Layer (Client)"]
    Launcher["AgentCategoryLauncher.tsx"]
    WizardStep["Parameter Wizard Step Renderer"]
    OptionPills["Concise Option Badges (≤18 chars)"]
    StatusCard["Research Progress / Retry Card"]
    PromptCard["Prompt Export Preview Workspace"]
  end
  
  subgraph Controller ["API & Business Logic Layer (Server)"]
    ResearchRoute["POST /api/agent/research-parameters"]
    LukeAgent["Luke Parameter Research Logic"]
  end
  
  subgraph Persistence ["Caching & Storage Layer"]
    CacheService["ParameterCacheService (In-Memory + Supabase)"]
    DB[("parameter_cache Table")]
  end
  
  Launcher --> WizardStep
  WizardStep --> OptionPills
  Launcher --> StatusCard
  Launcher --> PromptCard
  
  Launcher -->|Fetch Research| ResearchRoute
  ResearchRoute --> CacheService
  CacheService --> DB
  ResearchRoute -->|On Cache MISS| LukeAgent
```

---

## Data Model / ER Diagram

```mermaid
erDiagram
  parameter_cache {
    uuid id PK
    string category_normalized UK "Normalized lookup key (e.g. mycka_nadobi)"
    string display_title "Human readable title (e.g. Myčka nádobí)"
    jsonb parameters_json "Structured parameters & options array"
    timestamp created_at "Timestamp of research"
    timestamp expires_at "TTL expiration (30 days)"
  }
```
