# 🏀 HOOPS TRAINER - Project Plan

## 🎯 Cíl projektu
Vytvořit profesionální "Basketbalovou Laboratoř" pro ukládání, kategorizaci a analýzu tréninkových drilů z různých zdrojů (YouTube, Instagram, TikTok).

## 🛠 Tech Stack
- **Framework:** Next.js 14+ (App Router)
- **Database:** Supabase (PostgreSQL)
- **Styling:** Dark Lab Theme (Background: `#0A0A0B`, Primary: `#F57C00`, Accent: `#00FF41`)
- **Font:** Monospaced (pro technický vzhled)

## 🏗 Architektura (Refaktorizace)
Agent by měl rozdělit současný monolitický `page.tsx` na menší komponenty pro lepší udržovatelnost:

### 1. Databáze (Tabulka `exercises`)
| Sloupec | Typ | Popis |
| :--- | :--- | :--- |
| `id` | UUID | Primární klíč |
| `title` | Text | Název cvičení |
| `url` | Text | Odkaz na video (libovolný zdroj) |
| `difficulty` | Text | Tagy oddělené čárkou |

### 2. Komponenty k vytvoření
- `components/AddExercise.tsx`: Formulář pro vkládání + správa tagů.
- `components/ExerciseCard.tsx`: Karta videa s detekcí YouTube náhledu a tlačítkem Delete.
- `components/LabHeader.tsx`: Stylový hlavičkový modul.

## 🚀 Priority vývoje
1. **Modularizace:** Přesunout inline styly a logiku do samostatných komponent.
2. **Univerzální zdroje:** Upravit zobrazení tak, aby aplikace nepadala při vložení odkazu mimo YouTube (použít placeholder ikonu).
3. **Mazání:** Implementovat funkci `deleteEx(id)` propojenou na Supabase.
4. **Persistence tagů:** Ukládat nově vytvořené tagy do `localStorage` nebo nové tabulky `tags`.

## 🤖 Instrukce pro Agenta
> "Analyze the repository and refactor `app/page.tsx`. Break it down into modular components in the `/components` folder. Maintain the 'Dark Lab' aesthetic using the defined color palette. Ensure the YouTube ID extraction is robust (regex) and add a fallback UI for non-YouTube links. Implement a delete functionality for each exercise card."
