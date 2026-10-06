# Architektonický Assessment & Specifikace: Dark / Light Mode v bAIright

**Datum zaznamenání:** 6. října 2026  
**Status:** Zaznamenáno k budoucí realizaci (Deferred / On-Demand)  
**Framework:** Next.js 15, React 19, Tailwind CSS / Vanilla Design Tokens

---

## 1. Cíl iniciativy
Umožnit uživatelům plynulé přepínání mezi:
- **Material Light módem** (`#f4f6f8`, `#ffffff`, text `#263238`, Material Info Blue `#0099cc`)
- **Cyber-glass Dark módem** (`#070d18`, `#0f172a`, text `#f8fafc`, glowing cyan/teal `#00a8cc`)

Volba uživatele musí být perzistentní (`localStorage`), respektovat systémové preference (`prefers-color-scheme`) a eliminovat FOUC (probliknutí bílé při SSR).

---

## 2. As-Is Analýza kódu
1. **Globals CSS:** Prvních cca 80 řádků v `src/app/globals.css` obsahuje tvrdá `!important` pravidla přepisující dřívější dark třídy na světlé.
2. **Hardcoded třídy v komponentách:**
   - 78× `bg-white`
   - 176× `text-[#263238]`
   - Desítky `border-slate-200` a `bg-slate-50`
3. **Připravený Context:** V `src/lib/theme/ThemeContext.tsx` existuje základní kostra pro obsluhu motivů.
4. **Logo assety:** Nové horizontální logo (`public/images/bairight-horizontal-logo.png`) má písmena `b` a `right` v tmavě modré `#0f2e4a`. V dark módu je nutný invertovaný/světlý asset (`bairight-horizontal-logo-dark.png`).

---

## 3. Cílová architektura (Token-Driven)

```css
/* Globální CSS proměnné v src/app/globals.css */
html[data-theme="light"] {
  --bg-canvas: #f4f6f8;
  --bg-card: #ffffff;
  --bg-subtle: #f8fafc;
  --border-card: #e2e8f0;
  --text-primary: #263238;
  --text-muted: #607d8b;
  --header-bg: #ffffff;
}

html[data-theme="dark"] {
  --bg-canvas: #070d18;
  --bg-card: #0f172a;
  --bg-subtle: #1e293b;
  --border-card: #1e293b;
  --text-primary: #f8fafc;
  --text-muted: #94a3b8;
  --header-bg: #070d18;
}
```

---

## 4. Rozpad pracnosti (12–16 člověko-hodin)
1. **State & Anti-FOUC:** Rozšíření `ThemeContext.tsx` + synchronní inline script v `src/app/layout.tsx` (<head>).
2. **UI Přepínač v hlavičce:** Segmentovaný minimalistický switch `LIGHT / DARK` vedle jazykového `CZ / EN`.
3. **Refaktoring globals.css:** Zapouzdření `!important` pravidel pod selektory `[data-theme="light"]`.
4. **Adaptace komponent:** Provedení povrchů (Launcher, Wizard, Delivery Hub, Modaly, Chat View) na adaptivní CSS tokeny.
5. **Logo:** Vytvoření Dark varianty loga se světlým textem a dynamické přepínání v `src/components/Logo.tsx`.
6. **QA & Validace:** 100% zachování unit testů (`npx vitest run`), TypeScript validace (`npx tsc --noEmit`).

---

## 5. Rizika & Mitigace
- **Riziko kontrastu loga:** Vyřešeno samostatným assetem `bairight-horizontal-logo-dark.png`.
- **Riziko FOUC:** Vyřešeno synchronním inline skriptem před DOM renderem.
- **Riziko neviditelného textu:** Vyřešeno striktní tokenizací `--text-primary` místo ad-hoc Tailwind přepisů.
