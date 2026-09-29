filepath = '/Users/jan.mynar/Documents/GitHub/bairight/src/lib/agent/universal-agent-schema.ts'
with open(filepath, 'r') as f:
    content = f.read()

# Update the translateSkipValue helper to also handle the __SKIP__ internal marker
old_translate = """  // Helper: translate hardcoded Czech skip values to locale-appropriate text
  const translateSkipValue = (v: string): string => {
    const skipPatterns = ['není důležité', 'neni dulezite', 'nevím', 'přeskočit'];
    const normalized = v.toLowerCase().trim();
    if (skipPatterns.some((p) => normalized.includes(p))) {
      return isEn ? 'Not important / No preference' : v;
    }
    return v;
  };"""

new_translate = """  // Helper: translate skip values to locale-appropriate text
  // Handles both the internal __SKIP__ marker and legacy hardcoded Czech skip values
  const translateSkipValue = (v: string): string => {
    if (v === '__SKIP__') {
      return isEn ? 'Not important / No preference' : 'Není důležité';
    }
    const skipPatterns = ['není důležité', 'neni dulezite', 'nevím', 'přeskočit'];
    const normalized = v.toLowerCase().trim();
    if (skipPatterns.some((p) => normalized.includes(p))) {
      return isEn ? 'Not important / No preference' : 'Není důležité';
    }
    return v;
  };"""

content = content.replace(old_translate, new_translate)

with open(filepath, 'w') as f:
    f.write(content)

print("Done: __SKIP__ marker support added to forgeAgentPrompt")
