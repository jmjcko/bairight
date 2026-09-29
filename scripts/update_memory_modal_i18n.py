with open('src/components/UserRAGMemoryModal.tsx', 'r') as f:
    mem = f.read()

# Make UserRAGMemoryModal 100% bilingual
mem = mem.replace(
    "Paměť AI & Historie Posudků",
    "{locale === 'en' ? 'AI Memory & Assessment History' : 'Paměť AI & Historie Posudků'}"
).replace(
    "Osobní RAG biometrie, preference a uložená historie posudků pro personalizaci agenta",
    "{locale === 'en' ? 'Personal RAG biometrics, preferences, and saved prescription history for agent personalization' : 'Osobní RAG biometrie, preference a uložená historie posudků pro personalizaci agenta'}"
).replace(
    "Biometrie & Míry ({userFacts.length})",
    "{locale === 'en' ? `Biometrics & Specs (${userFacts.length})` : `Biometrie & Míry (${userFacts.length})`}"
).replace(
    "Historie Posudků ({assessments.length})",
    "{locale === 'en' ? `Assessment History (${assessments.length})` : `Historie Posudků (${assessments.length})`}"
).replace(
    "Historie Promptů ({promptLogs.length})",
    "{locale === 'en' ? `Prompt History (${promptLogs.length})` : `Historie Promptů (${promptLogs.length})`}"
).replace(
    "Přidat fakt",
    "{locale === 'en' ? 'Add Fact' : 'Přidat fakt'}"
).replace(
    "Smazat fakt z databáze",
    "{locale === 'en' ? 'Delete fact from database' : 'Smazat fakt z databáze'}"
).replace(
    "Smazat všechny prompty",
    "{locale === 'en' ? 'Clear All Prompts' : 'Smazat všechny prompty'}"
).replace(
    "Uložit do DB",
    "{locale === 'en' ? 'Save to DB' : 'Uložit do DB'}"
).replace(
    "Biometrie & Rozměry",
    "{locale === 'en' ? 'Biometrics & Dimensions' : 'Biometrie & Rozměry'}"
).replace(
    "Ergonomie & komfort",
    "{locale === 'en' ? 'Ergonomics & Health' : 'Ergonomie & komfort'}"
).replace(
    "Zobrazit detail posudku",
    "{locale === 'en' ? 'Show Assessment Detail' : 'Zobrazit detail posudku'}"
)

with open('src/components/UserRAGMemoryModal.tsx', 'w') as f:
    f.write(mem)
print("Updated UserRAGMemoryModal.tsx with 100% i18n support")
