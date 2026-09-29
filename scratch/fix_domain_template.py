filepath = '/Users/jan.mynar/Documents/GitHub/bairight/src/lib/agent/domain-parameter-discovery.ts'
with open(filepath, 'r') as f:
    content = f.read()

# Remove the RESPONSE FORMATTING MANDATE with [Full Model Name] template
# from BOTH EN and CS versions in buildCustomAgentFromParameters

old_en_template = """Strictly verify that all recommended models match every single one of these selected parameters!

RESPONSE FORMATTING MANDATE:
You MUST format your top 3 product recommendations clearly using Markdown with the following structure for EACH model:

### 1. [Full Model Name & Designation]
- **Why Recommended:** [Clear 1-2 sentence rationale matching user's specific parameters]
- **Key Specs:** [Key technical specifications and why it fits]
- **Pros:** [Advantage 1, Advantage 2]
- **Cons:** [Disadvantage / Trade-off 1]"""

new_en_template = """Strictly verify that all recommended models match every single one of these selected parameters!"""

old_cs_template = """Při vyhodnocení striktně zkontroluj shodu všech doporučených modelů s každým z těchto vybraných parametrů!

MANDÁT FORMÁTOVÁNÍ ODPOVĚDI:
VŠECHNY doporučené modely MUSÍŠ formátovat přehledně pomocí Markdown struktury pro KAŽDÝ model:

### 1. [Přesný název modelu a označení]
- **Proč doporučujeme:** [Stručné odůvodnění]
- **Klíčové parametry:** [Shoda s parametry]
- **Výhody:** [Hlavní plusy]
- **Nevýhody:** [Hlavní mínusy a kompromisy]"""

new_cs_template = """Při vyhodnocení striktně zkontroluj shodu všech doporučených modelů s každým z těchto vybraných parametrů!"""

content = content.replace(old_en_template, new_en_template)
content = content.replace(old_cs_template, new_cs_template)

with open(filepath, 'w') as f:
    f.write(content)

print("Done: Removed [Full Model Name] template from domain-parameter-discovery")
