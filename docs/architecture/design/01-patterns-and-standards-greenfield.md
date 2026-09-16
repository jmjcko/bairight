# Coding Patterns & Standards - bAIright Web Redesign

**Date**: 2026-09-16  
**Author**: ARCHITECT  
**Status**: Approved  
**Version**: 1.0

---

## 1. Project Organization & Structure

### Directory Structure
```
src/
├── app/                        # Next.js App Router Pages & API Routes
│   ├── api/agent/research-parameters/
│   │   └── route.ts            # Server-side Gemini Flash & Supabase cache API
│   ├── globals.css             # Design tokens, cyber-glass theme & dark mode
│   ├── layout.tsx              # Root app layout
│   └── page.tsx                # Main shopping consultant page
├── components/                 # Feature-Specific Components
│   ├── AgentCategoryLauncher.tsx # Wizard container & step orchestration
│   ├── ParameterResearchWizard.tsx # Wizard parameter renderer
│   └── ui/                     # UI Primitive Catalogue (Shared Visual Primitives)
│       ├── Badge.tsx           # Compact option pills (≤ 18 chars)
│       ├── Button.tsx          # Cyber-glass buttons with hover effects
│       ├── Card.tsx            # Selection cards & visual feedback containers
│       └── Toast.tsx           # Success/error alert toasts
└── lib/                        # Services & Utility Core
    ├── agent/
    │   └── parameter-cache-service.ts # Supabase & In-Memory Cache Service
    └── i18n/
        └── translations.ts     # Czech (default) & English translations
```

---

## 2. UI Primitive Catalogue (Shared Library Rule)

### Rule Definition
Any visual element that has **no business logic and is reusable across features** MUST be placed in `src/components/ui/`. Re-creating primitive elements inside feature folders is strict violation.

| Primitive Component | Location | Props Interface | Description |
|---------------------|----------|-----------------|-------------|
| `Badge` | `src/components/ui/Badge.tsx` | `{ label: string, active?: boolean }` | Compact parameter pill (max 18 chars) |
| `Button` | `src/components/ui/Button.tsx` | `{ variant: 'primary' | 'secondary' | 'ghost' }` | Cyber-glass button with micro-animations |
| `Card` | `src/components/ui/Card.tsx` | `{ active?: boolean, error?: boolean }` | Selection container for wizard options |
| `Toast` | `src/components/ui/Toast.tsx` | `{ type: 'success' | 'error', message: string }` | Toast alert notification |

---

## 3. Coding Patterns

### API Design Pattern
API routes must validate inputs, handle errors gracefully, return standardized JSON responses, and never leak server secrets.

#### ✅ DO (Good Pattern):
```typescript
import { NextResponse } from 'next/server';
import { ParameterCacheService } from '@/lib/agent/parameter-cache-service';

export async function POST(req: Request) {
  try {
    const { category } = await req.json();
    if (!category || typeof category !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'Category string is required' },
        { status: 400 }
      );
    }
    
    // Check cache first
    const cached = await ParameterCacheService.get(category);
    if (cached) {
      return NextResponse.json({ ok: true, source: 'cache', analysis: cached });
    }

    // Call LLM
    const analysis = await researchWithGemini(category);
    await ParameterCacheService.set(category, analysis);

    return NextResponse.json({ ok: true, source: 'llm', analysis });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
```

#### ❌ DON'T (Anti-Pattern):
```typescript
// BAD: Missing validation, unhandled exceptions, returning raw status without structure
export async function POST(req: Request) {
  const data = await req.json();
  const res = await fetch(`https://api.gemini.com?key=${process.env.GEMINI_KEY}`); // Bad: inline fetch without cache
  return NextResponse.json(res.json()); // Bad: returns unhandled data
}
```

---

### Error Handling Pattern
Always present clear UI feedback on failures. Never display generic fallback data (e.g. biometrics for dishwashers) when an API fails. Show an explicit retry card instead.

#### ✅ DO (Good Pattern):
```tsx
{researchError ? (
  <div className="error-card glass-panel">
    <p>⚠️ {researchError}</p>
    <button onClick={() => handleResearch(category)} className="btn-retry">
      🔄 Zkusit znovu
    </button>
  </div>
) : (
  <WizardSteps />
)}
```

#### ❌ DON'T (Anti-Pattern):
```tsx
// BAD: Swallowing errors and using generic fallback data
try {
  fetchParameters();
} catch (e) {
  setParameters(DEFAULT_GENERIC_BIOMETRIC_PARAMS); // Anti-pattern!
}
```

---

### UI Label Length Pattern
Keep parameter titles concise (≤ 18 characters) to maintain clean card layouts and fast user scannability.

#### ✅ DO (Good Pattern):
- `"Fotoaparát"`
- `"Hlučnost"`
- `"Kapacita"`

#### ❌ DON'T (Anti-Pattern):
- `"Požadované rozlišení a kvalita snímače integrovaného fotoaparátu"`

---

## 4. Testing Patterns (Vitest + React Testing Library)

Tests must follow the **AAA Pattern (Arrange, Act, Assert)** and mock network interactions deterministically.

#### ✅ DO (Good Test Pattern):
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AgentCategoryLauncher } from '@/components/AgentCategoryLauncher';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('AgentCategoryLauncher Redesign Flow', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        source: 'cache',
        analysis: {
          category: 'myčka nádobí',
          displayTitle: 'Myčka Nádobí',
          parameters: [{ id: 'hlucnost', name: 'Hlučnost', options: ['Tichá'] }]
        }
      })
    }));
  });

  it('renders research parameters with short badge titles', async () => {
    // 1. Arrange
    render(<AgentCategoryLauncher />);
    const input = screen.getByPlaceholderText(/Zadej např\. myčka nádobí/i);

    // 2. Act
    fireEvent.change(input, { target: { value: 'myčka nádobí' } });
    fireEvent.click(screen.getByText(/Prozkoumat parametry/i));

    // 3. Assert
    await waitFor(() => {
      expect(screen.getByText('Hlučnost')).toBeInTheDocument();
    });
  });
});
```

---

## 5. File/Module Boundary Map

| Logical Concern | Owning Directory / Globs | Description |
|-----------------|--------------------------|-------------|
| Wizard Frontend UI | `src/components/AgentCategoryLauncher.tsx`, `src/components/ui/*` | Client wizard container and UI primitives |
| Agent API & Cache | `src/app/api/agent/research-parameters/route.ts`, `src/lib/agent/*` | Server-side research route & Supabase cache service |
| Styling & Theme | `src/app/globals.css` | Cyber-glass tokens, dark mode `#070d18`, Cyan `#06b6d4` & Teal `#14b8a6` |
| Localization | `src/lib/i18n/translations.ts` | Czech & English translations |

### Shared Files (`shared_files`)
The following central files touch multiple concerns:
- `src/app/globals.css` (global theme styling)
- `src/lib/i18n/translations.ts` (global translation registry)
- `package.json` (dependency management)

---

## 6. Quality Checklist

- [x] Zero TypeScript compilation errors (`npx tsc --noEmit`)
- [x] 100% unit & integration test pass rate (`npx vitest run`)
- [x] Concise parameter titles (≤ 18 characters)
- [x] UI primitives located in `src/components/ui/`
- [x] No hardcoded API keys or client-side secret exposure
- [x] Explicit error states with retry buttons ("Zkusit znovu")
