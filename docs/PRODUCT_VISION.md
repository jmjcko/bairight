# 📖 bAIright – Product Vision & Living Documentation

> **Product Name:** **bAIright** (Slogan: *„Nakupujte správně s AI“ / „Buy Right with AI“*)  
> **Status:** Living Document (Active)  
> **Last Updated:** September 2026  
> **Author & Vision Owner:** Jan Mynar  
> **Framework:** BMAD Agile Specification  

---

## 1. 🌟 Product Vision & Core Mission

### Brand Identity: Why "bAIright"?
The name **bAIright** embodies a clever phonetic and conceptual dual meaning:
* **"Buy Right":** Helping users avoid costly, painful mistakes when buying technical gear and footwear.
* **"bAI (Be AI / Buy with AI)":** The AI acts as an incorruptible, expert personal shopper that puts human anatomy, biomechanics, and medical safety above commercial sales quotas.
* **Scalability:** Starting with footwear, the **bAIright** concept can expand horizontally to orthotics, recovery gear, ergonomic workstations, and sports equipment.

### The Problem
Finding the right footwear—especially for running, walking, and daily wear—is fraught with misinformation. Standard shoe selectors ask superficial questions (e.g., "Do you like road or trail?") while completely ignoring **critical biomechanical constraints**, joint health, past surgeries, and actual foot anatomy (e.g., wide 2E/4E feet, hallux valgus, knee osteoarthritis). 

A shoe that feels comfortable in a store can cause severe patellofemoral pain, plantar fasciitis flare-ups, or metatarsal compression after just a few kilometers.

### The Solution
**bAIright** is an intelligent, medically grounded footwear recommendation system that combines:
1. **An intuitive, elegant frontend intake form / wizard** that captures a comprehensive biomechanical and preference profile.
2. **An "Agent-as-Markdown" engine** (`agents/*.md`) where specialized podiatry and footwear experts are defined as versioned Markdown prompts and rulebooks.
3. **Transparent, clinical shoe recommendations** explaining *why* each shoe matches the user's anatomy, respecting brand bans/preferences, and safeguarding surgical or degenerative conditions.
4. **i18n Localization Architecture:** Native Czech language interface for clarity, built on a modular localization layer ready for instant translation to English, German, and global markets.

---

## 2. 🧩 Architecture & Data Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                        1. Frontend Form / Wizard                       │
│  - Step 1: Product Selection (Shoes / Orthotics / Accessories)         │
│  - Step 2: Foot Dimensions (Length in cm/EU, Width: D / 2E / 4E)       │
│  - Step 3: Intended Use (Road running, Trail, Walking, Standing)       │
│  - Step 4: Brand Affinity (Preferred Brands & Strictly Forbidden)      │
│  - Step 5: Medical History (Joint OA, Pronation/Supination, Flat feet) │
│  - Step 6: Surgical History (ACL, Meniscus, Joint Replacement)         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼ (JSON Profile Payload)
┌────────────────────────────────────────────────────────────────────────┐
│                 2. Agent Execution Layer (Next.js API)                 │
│  - Reads Agent Definition from: `agents/shoe-recommender-agent.md`     │
│  - Injects Intake Parameters into the Prompt Context                   │
│  - Executes LLM / Local Biomechanical Reasoning Engine                 │
│  - Validates outputs against hard constraints (e.g., Brand Blacklist)  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼ (Structured Recommendation Output)
┌────────────────────────────────────────────────────────────────────────┐
│                        3. Frontend Results View                        │
│  - Top Curated Footwear Matches with Match Scores                      │
│  - Podiatric Rationale (Why this shoe works for your joints)           │
│  - Contraindication Warnings (What to avoid with your condition)       │
│  - Direct links to European retail stock (Top4Running, 21run, etc.)    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. 📋 Intake Parameters Specification

The intake form collects the following granular parameters:

| Category | Parameter | Type | Options / Description |
| :--- | :--- | :--- | :--- |
| **Product** | `product_category` | Single Select | `Running Shoes`, `Walking Shoes`, `Recovery/Everyday`, `Insoles/Orthotics` |
| **Dimensions** | `foot_length_cm` / `eu_size` | Number | Foot length in cm or standard EU shoe size (36–49) |
| **Dimensions** | `foot_width` | Single Select | `Narrow (B)`, `Standard (D)`, `Wide (2E)`, `Extra Wide (4E)` |
| **Gait & Strike**| `strike_pattern` | Single Select | `Forefoot`, `Midfoot`, `Heel Strike`, `Don't know` |
| **Gait & Strike**| `foot_mechanics` | Single Select | `Supination (outer roll)`, `Neutral`, `Overpronation (inner roll)` |
| **Usage** | `activity_type` | Multi-select | `Road Running`, `Trail Running`, `Daily Walking`, `Long Standing at Work` |
| **Usage** | `weekly_volume` | Single Select | `< 10 km`, `10–25 km`, `25–50 km`, `50+ km` |
| **Usage** | `cushioning_preference`| Single Select | `Maximum Plush`, `Balanced / Medium`, `Firm / Ground feel` |
| **Brands** | `preferred_brands` | Multi-select | User favorites (e.g., Hoka, Brooks, Asics, New Balance, Altra, Saucony) |
| **Brands** | `forbidden_brands` | Multi-select | Strictly excluded brands (e.g., bad previous experience with Nike, On, etc.) |
| **Medical** | `joint_conditions` | Multi-select | `Knee Osteoarthritis (Grade 1/2/3)`, `Hip Pain`, `Lower Back Pain` |
| **Medical** | `foot_conditions` | Multi-select | `Plantar Fasciitis`, `Hallux Valgus (Bunions)`, `Morton's Neuroma`, `Achilles Tendonitis`, `Flat Feet` |
| **Surgical** | `past_surgeries` | Text / Tags | `ACL Reconstruction`, `Meniscus Repair/Meniscectomy`, `Ankle Arthrodesis`, `Hip/Knee Replacement`, `None` |
| **Budget** | `budget_eur` | Range | Price threshold in EUR (€100 – €250+) |

---

## 4. 🤖 Agent-as-Markdown Architecture (`agents/`)

Instead of hardcoding agent prompts inside backend logic, agents are maintained as **modular Markdown files** in the `agents/` directory.

### Why Agent-as-Markdown?
- **Version Controlled:** Agent personas, medical guidelines, and scoring heuristics live directly in Git alongside the code.
- **Easily Editable:** You can tweak the agent's tone, rules, or medical considerations simply by editing a Markdown file without touching API code.
- **Inspectable & Testable:** Anyone can read `agents/shoe-recommender-agent.md` and understand exactly how the AI makes decisions.

---

## 5. 🎨 Design System: Option B – Clinical Bio-Tech / Frosted Cyan

The visual identity of **bAIright** is anchored in high-precision biomedical technology and modern athletic engineering:
- **Palette:** Deep Slate foundation (`#070d18` / `#0b1628`), frosted glass panels (`backdrop-blur-md`), with glowing cyan (`#06b6d4`) and surgical teal (`#14b8a6`) highlights.
- **Typography:** Google Font **Inter Tight** (`--font-inter-tight`) for ultra-clean, technical readability and clinical authority.
- **Aesthetic Feel:** Modern, high-trust podiatric lab meets cutting-edge running tech. High contrast, crisp metrics, glow borders for active states, and distinct badges for orthotic criteria (Rocker, 2E/4E, Knee OA Grade 3).

---

## 6. 🗺️ Product Roadmap

### Phase 1: Interactive Wizard, Design System B & Markdown Agent (Completed ✅)
- [x] Product Documentation & Living Vision defined (`docs/PRODUCT_VISION.md`).
- [x] Agent Markdown specification (`agents/shoe-recommender-agent.md`).
- [x] Design System Option B (Clinical Bio-Tech / Frosted Cyan + Inter Tight typography).
- [x] Step-by-step visual intake wizard on Frontend with full biomechanical parameters (`src/components/IntakeWizard.tsx`).
- [x] Centralized i18n dictionary supporting Czech (`cs`) and English (`en`) (`src/lib/i18n/translations.ts`).
- [x] Backend loader that reads `agents/*.md` and evaluates form submissions against clinical rules and brand bans.
- [x] Interactive results display with match breakdowns, contraindications, and European retail links (`src/components/ShoeRecommendationCard.tsx`).

### Phase 2: Knowledge & Catalog Expansion (Next Up 🚀)
- [ ] Real-time database catalog of European 2E/4E shoe models (Hoka, Brooks, Asics, Saucony, New Balance, Altra).
- [ ] Custom insole and orthotic accessory recommendations (Superfeet, Currex, Formthotics).
- [ ] User accounts & saved foot profiles via Supabase database persistence.
- [ ] PDF Prescription export ("Podiatrický nákupní list pro prodejnu / lékaře").

### Phase 3: Long-Horizon Follow-ups
- [ ] Shoe mileage tracker and replacement reminders (wear & tear alerts).
- [ ] Gait video upload analysis (computer vision assessment).

