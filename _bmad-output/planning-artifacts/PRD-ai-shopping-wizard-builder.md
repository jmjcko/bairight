# Product Requirements Document (PRD)

## Product Name (working title)
AI Shopping Wizard Builder

## 1. Overview
An application that helps non-technical users find the best product to buy by dynamically generating an interactive, AI-powered "wizard" (questionnaire) for any product category, driven by a general-purpose "Parameter Research Agent." Instead of requiring users to write detailed prompts or build their own AI agents/GPTs, the system researches what parameters and specifications matter for a given product, lets the user pick which ones matter to them, define target values, and saves the result as a reusable, portable "Agent" file. Over time, this agent is refined using historical interaction data (RAG), and produces AI-generated product recommendations (model, brand, reasoning, pros/cons) grounded in real, currently-available market products.

The application is explicitly NOT an e-commerce platform. It does not sell products, handle transactions, or need to show purchase links or prices in v1. It is a decision-support layer on top of AI.

## 2. Problem Statement
Most people struggle to write effective prompts or configure AI agents to get high-quality, personalized product recommendations. They don't know which parameters/specifications matter for a given product category (e.g., trunk size and seating capacity for a car, foot width for shoes, material for a chair). As a result, they get generic, low-quality AI answers or have to do exhaustive manual research.

## 3. Goal / Value Proposition
Let any user go from typing a single keyword, like "car" or "shoes", to a well-reasoned, personalized shortlist of real products, by having the AI first research and surface the relevant decision parameters, then letting the user pick and configure only the ones that matter to them, without ever writing a prompt themselves. The more they use a given agent, the smarter and more personalized it gets.

## 4. Target Users
Non-technical consumers who want high-quality, personalized purchase recommendations but cannot or do not want to write prompts, build AI agents, or manually research product specifications.

## 5. Core User Flow

1. User logs in and is presented with a single input bar. User types any keyword or product name (e.g., "car," "shoes," "office chair") and clicks Generate.
2. A general-purpose Parameter Research Agent runs in the background. It researches the product category and identifies the full set of parameters and specifications that people typically consider when buying that product (e.g., for a car: engine type, size/class, number of seats, trunk/cargo space, fuel type, price range, etc.).
3. The system presents this researched list of parameters to the user as selectable options in the wizard. The user selects which parameters matter to them, and can also add their own custom parameters not suggested by the agent.
4. On the next step(s) of the wizard, for each parameter the user selected, the user sets their desired value or range (e.g., for "trunk size," set "500 liters or more"; for "seats," set "5+"). The system auto-selects an appropriate input component (dropdown, slider, button-select, etc.) per parameter.
5. Once all selected parameters have values set, the system generates an Agent: a portable, human-readable file (e.g., Markdown or YAML) capturing the product category, the selected parameters, and their target values/specification.
6. This Agent file is saved under the user's profile, and can be revisited, edited, or re-run at any time.
7. Using this Agent, the system performs a real-time/live lookup of currently available products on the market matching the specified parameters (not cached/outdated data), and returns for each recommended product: model name, brand, reasoning for the match, and pros/cons.
   - v1 explicitly excludes purchase links, pricing, and images — reasoning-based text recommendations only.
8. User reviews results and can refine/adjust the recommendation conversationally or by revisiting the wizard's parameter/value steps, triggering a re-generation.
9. All interactions, selected parameters, values, adjustments, and results are stored under the user's profile per agent.
10. On any future run of that same agent, the system feeds prior historical data/answers back in via RAG so the experience and prompt quality continuously improve over time.
11. Users can select any previously created agent from a list/dropdown, modify its selected parameters or values, re-run it, and iteratively improve the underlying prompt and results. The AI can proactively suggest additional parameters to increase precision.

**Key design principle:** Rather than the agent asking a fixed, predetermined sequence of category-specific questions directly, the flow is: (1) a general Parameter Research Agent discovers and surfaces the full space of relevant parameters/considerations for whatever product the user typed, (2) the user selects which of those researched parameters matter to them (and may add their own), and (3) only then does the user set target values for their selected parameters. The general Parameter Research Agent is the most critical component of the whole system.

## 6. Key Features (v1 Scope)

### 6.1 Parameter Research Agent (Core Engine)
- A general-purpose agent that, given any typed product keyword, researches and generates the relevant set of parameters/specifications that matter for that product category.
- This is the most important and foundational feature of the entire application.

### 6.2 Parameter Selection Step
- User is shown the researched parameters as selectable options and picks the ones relevant to them.
- User can add their own custom parameters not surfaced by the agent.

### 6.3 Dynamic Value-Setting Wizard
- For each parameter the user selected, a wizard step lets them define their target value or range.
- Automatically maps each parameter to an appropriate UI component from a fixed component library (dropdown, slider, single/multi-select buttons for short option sets, etc.).

### 6.4 No-Prompt-Writing UX
- Users interact purely via typing an initial keyword and then UI controls — the system builds the underlying AI prompt/agent for them, invisibly.

### 6.5 Agent Persistence (Portable Format)
- Each configuration (category, selected parameters, target values, underlying prompt, history) is saved as an "Agent" under the user's profile.
- Stored in a lightweight, portable, easily-rebuildable file format (e.g., Markdown or YAML).
- Users can browse/select their previously created agents from a list and reopen, edit, or re-run them.

### 6.6 Editable, Iterative Refinement
- After generation, users can adjust results using natural language feedback or by revisiting parameter/value wizard steps, triggering regeneration.
- AI can suggest additional or refined parameters to improve result precision over time.

### 6.7 RAG-Powered Historical Memory (Core Differentiator)
- All past parameter selections, values, adjustments, and results for a given agent are stored under the user's profile.
- On every future invocation of that agent, historical data is retrieved via RAG and fed back into the prompt-building process, so recommendations get progressively more personalized and accurate.
- This continuous improvement loop is considered one of the most important features of the product, alongside the Parameter Research Agent.

### 6.8 Real-Time Product Grounding at Generation Time
- The final "Generate" step performs a real-time check/search to ensure recommended products currently exist and are available on the market.
- Output per recommended product: model name, brand, reasoning, pros, and cons. No links, prices, or images in v1.

### 6.9 Bring-Your-Own-AI
- Users connect their own AI model access via API key or their own subscription/credentials.

## 7. Explicitly Out of Scope (v1)
- Acting as an e-commerce or shopping/checkout platform.
- Providing live purchase links, real-time pricing, or product images in recommendations.
- Persisting full custom-built front-end pages per agent — only the portable config file is persisted.
- Platform-provided/paid AI model access (users must bring their own).

## 8. Data & Storage Model (Conceptual)
- User Profile: top-level container per user.
- Agents: one file per created wizard/agent, stored in a portable markdown/YAML format containing:
  - Category
  - Researched parameter set (from the Parameter Research Agent)
  - User-selected parameters (including any custom ones added)
  - Target values/ranges per selected parameter
  - Associated UI component types per parameter
  - Underlying constructed prompt template
  - Historical interactions, adjustments, and results
- RAG layer: indexes historical agent data per user/per agent to enrich future prompt construction.

## 9. Success Criteria (Proposed — to validate with stakeholder)
- A user can go from typing a single keyword to a usable recommendation without writing a single prompt manually.
- The Parameter Research Agent surfaces parameters that users find relevant and complete enough that few need to add many custom ones.
- Recommendations measurably improve across repeated uses of the same agent, attributable to RAG-fed historical context.
- Agents can be exported/reconstructed purely from their stored file, without needing persisted custom UI code.

## 10. Open Questions for Future Iteration
- Should v2 introduce live purchase links, pricing, and images?
- Should agents be shareable/exportable between users?
- What specific AI providers/APIs need to be supported for "bring your own AI"?
- What are the limits/guardrails if the Parameter Research Agent's category knowledge is outdated or wrong for a niche product category?
- How many parameters should be surfaced by default before overwhelming the user?

## 11. Intended Next Step
This PRD is intended to be used as an input document for the BMAD method to structure and kick off development planning.