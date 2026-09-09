# 🌐 Rule: Localization (i18n) & Language Architecture

**Priority:** Mandatory / High  
**Active Default Locale:** `cs` (Czech)  
**Supported Translation Targets:** `en` (English), `de` (German), `sk` (Slovak)

---

## Directives for AI Agents & Developers

1. **No Hardcoded UI Strings in Components:**
   - All user-facing text, button labels, step titles, error messages, and descriptions must be managed through the central i18n translation dictionary located at:
     `src/lib/i18n/translations.ts`
   - Always export matching keys across `cs` and `en`.

2. **Tone of Voice in Czech (`cs`):**
   - Professional, encouraging, clear, and podiatrically accurate.
   - Use natural Czech terminology (e.g., *„došlap na patu“*, *„supinace (vnější hrana)“*, *„osteoartróza kolene 3. stupně“*, *„široké kopyto 2E“*, *„rockerová podrážka (kolébka)“*).

3. **Agent Markdown Prompts & Responses:**
   - Agents in `agents/*.md` must support generating medical and product evaluations in the user's active locale (defaulting to Czech), while retaining standardized medical metrics and brand names.

4. **Product Naming:**
   - Brand name is **bAIright** (capitalization: lowercase 'b', uppercase 'AI', lowercase 'right', or `bAIright`).
   - Slogan: *„Nakupujte správně s AI“ / „Buy Right with AI“*.
