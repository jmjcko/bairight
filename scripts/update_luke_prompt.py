with open("src/app/api/agent/research-parameters/route.ts", "r", encoding="utf-8") as f:
    text = f.read()

# Find and replace the bike_type example name and the service warranty example
old = '"name": "Typ kola & disciplína (Silniční vs. Gravel vs. Horské MTB vs. Městské vs. E-bike)",'
new = '"name": "Typ kola a disciplína",'
text = text.replace(old, new)
print("Fixed bike_type name:", old in text)

old = '"name": "Dostupnost servisu & doživotní záruka na rám",'
new = '"name": "Záruka a servis",'
text = text.replace(old, new)
print("Fixed service warranty name")

# Update the final instruction at end of metaPrompt to add short name rule
old_ending = """Nyní zpracuj uživatelský dotaz: "${categoryQuery}".
Vygeneruj MINIMÁLNĚ 10 AŽ 14 takových špičkových parametrů seřazených od tržního zařazení přes biometrii až po technické detaily + 3 až 5 alternativních do poolu návrhů.
Odpověz STRIKTNĚ jako validní JSON podle výše uvedené struktury, bez jakéhokoliv doplňkového markdownového textu."""

new_ending = """## PRAVIDLA PRO VÝSTUP (MANDATORY):
1. 📛 KRÁTKÉ NÁZVY PARAMETRŮ: Pole \"name\" u každého parametru MUSÍ BÝT MAXIMÁLNĚ 4 SLOVA. Žádné závorky, žádné technické zkratky v závorce, žádné spojky \"vs.\" nebo \"&\". Správně: \"Typ kola\", \"Materiál rámu\", \"Záruka a servis\". Špatně: \"Typ kola & disciplína (Silniční vs. Gravel vs. Horské MTB)\".
2. 📋 BOHATÉ MOŽNOSTI: Pole \"suggestedValues\" musí mít MINIMÁLNĚ 3 A MAXIMÁLNĚ 5 konkrétních, dobře popsaných možností. Každá možnost může obsahovat krátký popis v závorce pro kontext. Nikdy méně než 3 možnosti.
3. ✅ Výstup musí být STRIKTNĚ validní JSON bez jakéhokoliv markdownu nebo komentářů.

Nyní zpracuj uživatelský dotaz: "${categoryQuery}".
Vygeneruj MINIMÁLNĚ 10 AŽ 14 takových špičkových parametrů seřazených od tržního zařazení přes biometrii až po technické detaily + 3 až 5 alternativních do poolu návrhů.
Odpověz STRIKTNĚ jako validní JSON podle výše uvedené struktury, bez jakéhokoliv doplňkového markdownového textu."""

if old_ending in text:
    text = text.replace(old_ending, new_ending)
    print("Updated Luke ending prompt with short name rule!")
else:
    print("WARNING: old_ending not found exactly!")

with open("src/app/api/agent/research-parameters/route.ts", "w", encoding="utf-8") as f:
    f.write(text)
