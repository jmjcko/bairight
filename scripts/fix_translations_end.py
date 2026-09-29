with open('src/lib/i18n/translations.ts', 'r') as f:
    tr = f.read()

# Make sure file ends with closing brace };
tr = tr.rstrip()
if not tr.endswith('};'):
    tr += '\n  }\n};\n'

with open('src/lib/i18n/translations.ts', 'w') as f:
    f.write(tr)

print("Fixed translations.ts ending")
