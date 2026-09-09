# 📋 BMAD Product Requirements Document (PRD)

## Project: OrthoStride Shoe Recommender
- **Target Release:** MVP v1.0
- **Architectural Pattern:** Wizard Intake Form + Agent-as-Markdown Engine
- **Primary Source:** [`docs/PRODUCT_VISION.md`](file:///Users/jan.mynar/Documents/GitHub/shoes/docs/PRODUCT_VISION.md)

---

## 1. Executive Summary
OrthoStride delivers personalized, medically calibrated footwear prescriptions. The application captures an exhaustive biomechanical profile through a guided multi-step form and evaluates it against an autonomous podiatry agent defined in a Markdown prompt file (`agents/shoe-recommender-agent.md`).

---

## 2. User Personas
1. **The Injured / Degenerative Runner (e.g. Knee Osteoarthritis):** Needs maximum shock attenuation, specific drop (4–8mm), and rocker geometry to minimize knee adduction and patellofemoral torque.
2. **The Wide-Foot Athlete (2E / 4E):** Suffers from foot numbness, blisters, and metatarsal compression from standard narrow shoes; needs authentic wide lasts.
3. **The Post-Surgical Patient (ACL / Meniscus repair):** Requires strict stability, balanced heel-to-toe transition, and zero aggressive medial posting.
4. **The Fitness Walker / Healthcare Worker:** Spends 8+ hours on hard surfaces and needs durable, plush cushioning with arch fatigue relief.

---

## 3. Detailed Functional Requirements

### FR-1: Frontend Intake Wizard
- **Step 1: Product Selection** – Default: Running & Walking Shoes (with future option for Insoles/Orthotics).
- **Step 2: Biometrics & Dimensions** – Foot length (cm/EU size) and Foot Width (`standard_d`, `wide_2e`, `extra_wide_4e`, `narrow_b`).
- **Step 3: Gait & Mechanics** – Strike pattern (heel, midfoot, forefoot) and roll (supination, neutral, overpronation).
- **Step 4: Activity & Surface** – Road running, trail, daily walking, standing volume.
- **Step 5: Brand Governance** – Select preferred brands AND strictly forbidden brands (blacklist).
- **Step 6: Medical Diagnoses** – Knee OA (Grades 1–3), plantar fasciitis, bunions, Morton's neuroma, Achilles issues.
- **Step 7: Surgical History** – ACL repair, meniscectomy, joint replacement, ankle surgeries.

### FR-2: Agent-as-Markdown Pipeline
- Location: `agents/shoe-recommender-agent.md`
- The system reads this markdown file at runtime, parses system instructions, rules, and medical heuristics.
- Injects user form JSON into the evaluation prompt.
- Enforces hard constraints:
  - **Rule A:** NEVER recommend a brand from `forbidden_brands`.
  - **Rule B:** If `foot_width === 'wide_2e'` or `'extra_wide_4e'`, strictly enforce that models have verified wide options in European distribution.
  - **Rule C:** If `knee_osteoarthritis` is present, recommend rocker soles with drops <= 8mm.
  - **Rule D:** If `supination` is present, avoid traditional medial posts/pronation wedges.

### FR-3: Recommendation Display
- Card-based layout with match percentage.
- Badges: `2E Wide Fit`, `Knee Safe`, `Rocker Sole`.
- Detailed podiatric rationale explaining why the shoe fits the user's specific surgeries, pain points, and brand constraints.
- Direct European retail availability.
