# 📐 Design System Specification: bAIright Visual Identity & Chromatic Tokens

**Author:** Sally (UX Designer)  
**Status:** Approved & Binding  
**Date:** 2026-09-10  
**Version:** 1.0 (Harmonized with Logo Concept 4C)

---

## 1. Brand Core & Visual Metaphor

- **Brand Mark:** `bAIright` (Concept 4C Wordmark).
- **Metaphor:** Seamless combination of **"Buy Right"** (rational, clinical precision) and **"AI-Driven"** (podiatric agent intelligence).
- **Core Visual Element:** The letters `A` and `I` are synthesized into a continuous, aerodynamic, 3D kinetic ribbon that conveys forward biomechanical motion and algorithmic precision.
- **Lettering:** Surgical, ultra-crisp white (`#FFFFFF`) for `b` and `right`.

---

## 2. Master Chromatic Palette (Sampled from Logo 4C Master Asset)

The brand does **NOT** use warm emeralds, grassy greens, or muddy olives (`#10B981` / Tailwind `emerald` is strictly deprecated).  
All chromatic accents stem directly from the 3D ribbon and deep space contrast:

```
[#000000 / #050A14]  -->  Deep Space Obsidian (Background & Canvas)
[#FFFFFF]            -->  Surgical White (Typography & Maximum Contrast)
[#37CFD9 / #22D3EE]  -->  Electric Ice Cyan (Highlight Apex, Glow, Focus States)
[#1BCBC5 / #06B6D4]  -->  Kinetic Wave Cyan (Ribbon Body, Primary Buttons, Active Tabs)
[#158292 / #0E7490]  -->  Oceanic Teal (3D Shadow, Secondary Accents, Outer Borders)
[#196B75 / #042F2E]  -->  Deep Shaded Crease (Inner Borders, Subtle Badges)
```

### Color Token Reference Table

| Token Name | Hex Code | RGB | HSL | Semantic Usage |
| :--- | :--- | :--- | :--- | :--- |
| `--color-canvas-base` | `#050811` | `5, 8, 17` | `225°, 55%, 4%` | Root page background, OLED obsidian canvas |
| `--color-panel-glass` | `rgba(8, 16, 30, 0.82)` | `8, 16, 30` | `218°, 58%, 7%` | Glassmorphic floating cards and headers |
| `--color-border-subtle` | `rgba(34, 211, 238, 0.18)` | `34, 211, 238` | `187°, 85%, 53%` | Idle card borders, separators, grid lines |
| `--color-border-active` | `rgba(34, 211, 238, 0.65)` | `34, 211, 238` | `187°, 85%, 53%` | Active tabs, focused inputs, hovered cards |
| `--color-brand-highlight` | `#22D3EE` | `34, 211, 238` | `187°, 85%, 53%` | Electric cyan highlights, glow effects, key badges |
| `--color-brand-cyan` | `#06B6D4` | `6, 182, 212` | `189°, 95%, 43%` | Primary CTAs, active status dots, brand gradients |
| `--color-brand-teal` | `#0E7490` | `14, 116, 144` | `193°, 82%, 31%` | Secondary badges, deep ribbon tone, shadow gradients |
| `--color-brand-ocean` | `#158292` | `21, 130, 146` | `188°, 75%, 33%` | Telemetry secondary graphs, biomechanical indicators |
| `--color-text-primary` | `#FFFFFF` | `255, 255, 255` | `0°, 0%, 100%` | Primary headings, logo lettering, critical specs |
| `--color-text-secondary` | `#94A3B8` | `148, 163, 184` | `215°, 20%, 65%` | Body copy, secondary labels, helper descriptions |

---

## 3. UI Component Mapping Guidelines

1. **Header & Navigation:**
   - Background: `rgba(5, 10, 20, 0.85)` with `backdrop-blur-md`.
   - Bottom border: `rgba(34, 211, 238, 0.15)`.
   - Active Tab: Electric cyan pill with `text-cyan-300`, `bg-cyan-500/15`, `border-cyan-400/40`.

2. **Agent Capsule & Chat:**
   - Agent Status Badge: `bg-cyan-950/80 border-cyan-500/40 text-cyan-300` with pulsing `bg-cyan-400` ping dot.
   - User Bubble: `bg-cyan-600 text-white shadow-cyan-950/40`.
   - Agent Bubble: `bg-slate-900 border-cyan-500/20 text-slate-100`.
   - Send Button: `bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-bold hover:brightness-110`.

3. **Biomechanical HUD & Telemetry:**
   - Progress / Score Bars: Gradient from `#06B6D4` (Cyan) to `#14B8A6` (Teal) to `#22D3EE` (Ice Highlight).
   - Positive/Safe indicators (e.g., "Vhodné pro OA 3", "2E Last"): Replaced from `emerald-400` to `cyan-400` / `teal-300` with subtle cyan glow.
   - Warning indicators: Retain high-contrast Amber `#F59E0B` / `#FBBF24` for clinical neutrality.
   - Danger / Contraindication indicators: Retain Rose/Red `#F43F5E` for clinical contraindications.

---

## 4. Quality & Governance Rule

Any pull request, commit, or agent response introducing `emerald-400`, `emerald-500`, or `#10B981` without an explicit clinical necessity is considered a **Design System Violation**. Quinn (QA) must fail any build violating these chromatic bounds.
