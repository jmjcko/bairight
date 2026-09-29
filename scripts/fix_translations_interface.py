with open('src/lib/i18n/translations.ts', 'r') as f:
    tr = f.read()

# Add optional keys to interface Translations
if "memoryModal?:" not in tr:
    tr = tr.replace(
        "export interface Translations {",
        "export interface Translations {\n  memoryModal?: Record<string, any>;\n  authModal?: Record<string, any>;\n  vaultModal?: Record<string, any>;\n  greetings?: Record<string, any>;"
    )

# Remove any duplicate keys at end of file if any
with open('src/lib/i18n/translations.ts', 'w') as f:
    f.write(tr)

print("Updated Translations interface")
