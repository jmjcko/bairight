# Product Requirements Document (PRD)

## Product Name (working title)
AI Shopping Wizard Builder

## 1. Overview
An application that helps non-technical users find the best product to buy by dynamically generating an interactive, AI-powered "wizard" (questionnaire) for any product category. Instead of requiring users to write detailed prompts or build their own AI agents/GPTs, the system builds a structured, reusable wizard/agent for them, refines it over time using historical interaction data (RAG), and produces a final AI-generated product recommendation (model, brand, reasoning, pros/cons) grounded in real, currently-available market products.

The application is explicitly NOT an e-commerce platform. It does not sell products, handle transactions, or need to show purchase links or prices in v1. It is a decision-support layer on top of AI.

## 2. Problem Statement
Most people struggle to write effective prompts or configure AI agents to get high-quality, personalized product recommendations. They don't know which questions matter for a given product category (e.g., shoe width, foot conditions, chair usage context, material preferences). As a result, they get generic, low-quality AI answers or have to do exhaustive manual research.

## 3. Goal / Value Proposition
Let any user go from "I want to buy shoes" to a well-reasoned, personalized shortlist of real products, by answering a small, smart, dynamically generated set of questions, without ever writing a prompt themselves. The more they use a given wizard, the smarter and more personalized it gets.

## 4. Target Users
Non-technical consumers who want high-quality, personalized purchase recommendations but cannot or do not want to write prompts, build AI agents, or manually research product specifications.

## 5. Core User Flow

1. User enters a free-text starting point: "I want to buy shoes."
2. The system identifies the product category and invokes an AI process to determine the relevant decision parameters for that category, based on the AI model's general knowledge of the category and its typical specifications (no live scraping needed at this stage).
3. The system dynamically builds a step-by-step Wizard UI from a small fixed library of input components (dropdowns, sliders, single/multi-select buttons for short option sets, etc.), choosing the appropriate component per question automatically.
4. User answers each step (e.g., foot width, foot length, medical conditions like knee/heel issues, brand preference, budget, etc.). No manual prompt writing required.
5. The underlying prompt is being incrementally constructed/"forged" behind the scenes as the user answers.
6. This wizard configuration (questions, chosen components, answers, resulting prompt) is saved as an "Agent" file under the user's profile, in a portable, human-readable format (e.g., Markdown or YAML) so it can be quickly rebuilt/re-rendered without persisting full custom app pages.
7. User clicks "Generate."
8. At generation time, the system performs a real-time/live lookup of currently available products on the market matching the specified parameters (not cached/outdated data), and returns for each recommended product: model name, brand, reasoning for the match, and pros/cons.
   - v1 explicitly excludes purchase links, pricing, and images — reasoning-based text recommendations only.
9. User reviews results and can refine/adjust the recommendation conversationally (by typed feedback) or via additional wizard-provided options, triggering a re-generation.
10. All interactions, answers, adjustments, and results are stored under the user's profile per agent.
11. On any future run of that same agent (e.g., revisiting the "Shoes" agent later), the system feeds prior historical data/answers back in via RAG so the experience and prompt quality continuously improve over time, without the user re-entering information.
12. Users can select any previously created agent from a list/dropdown, modify its wizard/questions, re-run it, and iteratively improve the underlying prompt and results. The AI can proactively suggest additional questions/parameters to increase precision.

## 6. Key Features (v1 Scope)

### 6.1 Dynamic Wizard Generation
- Given a product category, AI determines the relevant parameters/questions for that category using general model knowledge (no live web access required at this step).
- Automatically maps each question to an appropriate UI component from a fixed component library (dropdown, slider, button-select for small option sets, etc.).

### 6.2 No-Prompt-Writing UX
- Users interact purely via UI controls (clicking, sliding, selecting) — the system builds the underlying AI prompt for them, invisibly.

### 6.3 Agent Persistence (Portable Format)
- Each wizard configuration + its underlying prompt + user's answers is saved as an "Agent" under the user's profile.
- Stored in a lightweight, portable, easily-rebuildable file format (e.g., Markdown or YAML) rather than a heavy stateful app structure — enabling fast reconstruction of the wizard UI from the file alone.
- Users can browse/select their previously created agents from a list and reopen, edit, or re-run them.

### 6.4 Editable, Iterative Refinement
- After generation, users can adjust results using natural language feedback or additional wizard inputs, triggering regeneration.
- AI can suggest additional or refined questions to improve result precision over time.

### 6.5 RAG-Powered Historical Memory (Core Differentiator)
- All past answers, adjustments, and results for a given agent are stored under the user's profile.
- On every future invocation of that agent, historical data is retrieved via RAG and fed back into the prompt-building process, so recommendations get progressively more personalized and accurate the more the user uses that agent.
- This continuous improvement loop is considered the single most important feature of the product.

### 6.6 Real-Time Product Grounding at Generation Time
- The final "Generate" step performs a real-time check/search to ensure recommended products currently exist and are available on the market (not relying on stale training data).
- Output per recommended product: model name, brand, reasoning, pros, and cons. No links, prices, or images in v1.

### 6.7 Bring-Your-Own-AI
- Users connect their own AI model access via API key or their own subscription/credentials, rather than the platform providing/paying for underlying model usage.

## 7. Explicitly Out of Scope (v1)
- Acting as an e-commerce or shopping/checkout platform.
- Providing live purchase links, real-time pricing, or product images in recommendations.
- Persisting full custom-built front-end pages per agent — only the portable config file is persisted, and the UI is rebuilt from it on demand.
- Platform-provided/paid AI model access (users must bring their own).

## 8. Data & Storage Model (Conceptual)
- User Profile: top-level container per user.
- Agents: one file per created wizard/agent (e.g., "Shoes," "Office Chair"), stored in a portable markdown/YAML format containing:
  - Category
  - Question set + associated UI component types
  - Underlying constructed prompt template
  - Historical answers/interactions
  - Historical generated results and user adjustments/feedback
- RAG layer: indexes historical agent data per user/per agent to enrich future prompt construction.

## 9. Success Criteria (Proposed — to validate with stakeholder)
- A user can go from category input to a usable recommendation without writing a single prompt manually.
- Recommendations measurably improve (in relevance/precision) across repeated uses of the same agent, attributable to RAG-fed historical context.
- Agents can be exported/reconstructed purely from their stored file, without needing persisted custom UI code.

## 10. Open Questions for Future Iteration
- Should v2 introduce live purchase links, pricing, and images?
- Should agents be shareable/exportable between users?
- What specific AI providers/APIs need to be supported for "bring your own AI"?
- What are the limits/guardrails if the AI's category knowledge is outdated or wrong for a niche product category?

## 11. Intended Next Step
This PRD is intended to be used as an input document for the BMAD method to structure and kick off development planning.
