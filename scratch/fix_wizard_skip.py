filepath = '/Users/jan.mynar/Documents/GitHub/bairight/src/components/DynamicAgentWizard.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Replace the SKIP_VALUE constant usage: 'Není důležité / Nevím' and 'Není důležité'
# with a locale-aware internal constant

# 1. The handleToggleChip function — replace hardcoded Czech skip constants
# We use a universal internal constant that forgeAgentPrompt can detect
SKIP_INTERNAL = '__SKIP__'
SKIP_DISPLAY_CS = 'Není důležité / Nevím'
SKIP_STORED_CS = 'Není důležité'

# Replace the chip value comparison
content = content.replace(
    "if (chipValue === 'Není důležité / Nevím') {",
    "if (chipValue === '__SKIP__') {"
)

# Replace the stored value
content = content.replace(
    "          [question.id]: 'Není důležité',\n        };\n      }\n      if (question.isMultiSelect) {",
    "          [question.id]: '__SKIP__',\n        };\n      }\n      if (question.isMultiSelect) {"
)

# Replace the filter in multiselect
content = content.replace(
    "? [...current].filter((x) => x !== 'Není důležité')",
    "? [...current].filter((x) => x !== '__SKIP__')"
)

content = content.replace(
    "typeof current === 'string' && current && current !== 'Není důležité'",
    "typeof current === 'string' && current && current !== '__SKIP__'"
)

# Replace the empty array fallback
content = content.replace(
    "[question.id]: nextArr.length > 0 ? nextArr : 'Není důležité',",
    "[question.id]: nextArr.length > 0 ? nextArr : '__SKIP__',"
)

# Replace the onClick handler for the skip button
content = content.replace(
    "onClick={() => handleToggleChip(question, 'Není důležité / Nevím')}",
    "onClick={() => handleToggleChip(question, '__SKIP__')}"
)

# Replace the active state check for the skip button
content = content.replace(
    "(Array.isArray(val) ? val.includes('Není důležité / Nevím') : val === 'Není důležité' || val === 'Není důležité / Nevím')",
    "(Array.isArray(val) ? val.includes('__SKIP__') : val === '__SKIP__')"
)

with open(filepath, 'w') as f:
    f.write(content)

print("Done: DynamicAgentWizard skip values fixed")
