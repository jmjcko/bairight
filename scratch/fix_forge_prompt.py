filepath = '/Users/jan.mynar/Documents/GitHub/bairight/src/lib/agent/universal-agent-schema.ts'
with open(filepath, 'r') as f:
    content = f.read()

# Replace the forgeAgentPrompt value resolution logic
old_block = """  for (const q of agent.questions) {
    const val = answers[q.id];
    if (val !== undefined && val !== null && val !== '') {
      let formattedVal = val;
      if (typeof val === 'object' && val !== null && !Array.isArray(val) && ('preferred' in val || 'forbidden' in val)) {
        const pref = Array.isArray(val.preferred) ? val.preferred.join(', ') : (typeof val.preferred === 'string' ? val.preferred.trim() : '');
        const forb = Array.isArray(val.forbidden) ? val.forbidden.join(', ') : (typeof val.forbidden === 'string' ? val.forbidden.trim() : '');
        const prefText = pref 
          ? (isEn ? `Preferred Brands: [${pref}]` : `Preferované značky: [${pref}]`) 
          : (isEn ? 'No brand restrictions (Open selection)' : 'Bez omezení značek (otevřený výběr)');
        const forbText = forb 
          ? (isEn ? `Strictly Forbidden Brands (NEVER recommend): [${forb}]` : `Striktně zakázané značky (NIKDY nedoporučovat): [${forb}]`) 
          : (isEn ? 'No forbidden brands' : 'Žádné zakázané značky');
        formattedVal = `${prefText}; ${forbText}`;
      } else if (typeof val === 'string' && q.options) {
        const matchedOpt = q.options.find((o) => o.value === val);
        if (matchedOpt && matchedOpt.label) {
          formattedVal = matchedOpt.label;
        } else {
          formattedVal = val.replace(/_/g, ' ');
        }
      } else if (Array.isArray(val)) {
        if (q.options) {
          const labels = val.map((v) => {
            const opt = q.options?.find((o) => o.value === v);
            return opt?.label || String(v).replace(/_/g, ' ');
          });
          formattedVal = labels.length > 0 ? labels.join(', ') : (isEn ? 'No specific choice' : 'Žádná specifická volba');
        } else {
          formattedVal = val.length > 0 ? val.map((v) => String(v).replace(/_/g, ' ')).join(', ') : (isEn ? 'No specific choice' : 'Žádná specifická volba');
        }
      }
      if (q.sliderConfig) {
        formattedVal = `${val} ${q.sliderConfig.unit}`;
      }"""

new_block = """  // Helper: convert snake_case to Title Case (e.g. "road_running" -> "Road Running")
  const toTitleCase = (s: string): string =>
    s.replace(/_/g, ' ').replace(/\\b\\w/g, (c) => c.toUpperCase());

  // Helper: translate hardcoded Czech skip values to locale-appropriate text
  const translateSkipValue = (v: string): string => {
    const skipPatterns = ['není důležité', 'neni dulezite', 'nevím', 'přeskočit'];
    const normalized = v.toLowerCase().trim();
    if (skipPatterns.some((p) => normalized.includes(p))) {
      return isEn ? 'Not important / No preference' : v;
    }
    return v;
  };

  for (const q of agent.questions) {
    const val = answers[q.id];
    if (val !== undefined && val !== null && val !== '') {
      let formattedVal = val;
      if (typeof val === 'object' && val !== null && !Array.isArray(val) && ('preferred' in val || 'forbidden' in val)) {
        const pref = Array.isArray(val.preferred) ? val.preferred.join(', ') : (typeof val.preferred === 'string' ? val.preferred.trim() : '');
        const forb = Array.isArray(val.forbidden) ? val.forbidden.join(', ') : (typeof val.forbidden === 'string' ? val.forbidden.trim() : '');
        const prefText = pref 
          ? (isEn ? `Preferred Brands: [${pref}]` : `Preferované značky: [${pref}]`) 
          : (isEn ? 'No brand restrictions (Open selection)' : 'Bez omezení značek (otevřený výběr)');
        const forbText = forb 
          ? (isEn ? `Strictly Forbidden Brands (NEVER recommend): [${forb}]` : `Striktně zakázané značky (NIKDY nedoporučovat): [${forb}]`) 
          : (isEn ? 'No forbidden brands' : 'Žádné zakázané značky');
        formattedVal = `${prefText}; ${forbText}`;
      } else if (typeof val === 'string') {
        // 1) Check for hardcoded Czech skip values first
        formattedVal = translateSkipValue(val);
        // 2) Resolve label from options if available
        if (q.options) {
          const matchedOpt = q.options.find((o) => o.value === val);
          if (matchedOpt && matchedOpt.label) {
            formattedVal = translateSkipValue(matchedOpt.label);
          } else if (formattedVal === val) {
            // No option match and not a skip value — convert snake_case to Title Case
            formattedVal = toTitleCase(val);
          }
        } else if (formattedVal === val && val.includes('_')) {
          // No options array at all — convert snake_case to Title Case
          formattedVal = toTitleCase(val);
        }
      } else if (Array.isArray(val)) {
        const resolveItem = (v: any): string => {
          const s = String(v);
          // Check for skip values first
          const translated = translateSkipValue(s);
          if (translated !== s) return translated;
          // Try to resolve label from question options
          if (q.options) {
            const opt = q.options.find((o) => o.value === s);
            if (opt?.label) return translateSkipValue(opt.label);
          }
          // Fallback: convert snake_case to Title Case
          return toTitleCase(s);
        };
        formattedVal = val.length > 0 
          ? val.map(resolveItem).join(', ') 
          : (isEn ? 'No specific choice' : 'Žádná specifická volba');
      }
      if (q.sliderConfig) {
        formattedVal = `${val} ${q.sliderConfig.unit}`;
      }"""

content = content.replace(old_block, new_block)

with open(filepath, 'w') as f:
    f.write(content)

print("Done: forgeAgentPrompt value resolution fixed")
