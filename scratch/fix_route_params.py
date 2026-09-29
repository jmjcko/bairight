import re

filepath = '/Users/jan.mynar/Documents/GitHub/bairight/src/app/api/agent/chat/route.ts'
with open(filepath, 'r') as f:
    content = f.read()

# Fix: Replace the paramsText generation to resolve labels from agent questions
old_params = """    const paramsText = Object.entries(assessmentContext.keyParameters || {})
      .map(([k, v]) => `- **${k}:** ${typeof v === 'object' ? JSON.stringify(v) : v}`)
      .join('\\n');"""

new_params = """    // Resolve raw answer IDs to human-readable labels using agent question definitions
    const paramsText = Object.entries(assessmentContext.keyParameters || {})
      .map(([k, v]) => {
        const question = agent?.questions?.find((q: any) => q.id === k);
        const label = question?.title || k.replace(/_/g, ' ');
        let displayVal = v;
        if (typeof v === 'string' && question?.options) {
          const opt = question.options.find((o: any) => o.value === v);
          if (opt?.label) displayVal = opt.label;
          else displayVal = String(v).replace(/_/g, ' ');
        } else if (Array.isArray(v) && question?.options) {
          displayVal = v.map((item: any) => {
            const opt = question.options?.find((o: any) => o.value === item);
            return opt?.label || String(item).replace(/_/g, ' ');
          }).join(', ');
        } else if (typeof v === 'object' && v !== null && ('preferred' in v || 'forbidden' in v)) {
          const pref = Array.isArray(v.preferred) ? v.preferred.join(', ') : (v.preferred || '');
          const forb = Array.isArray(v.forbidden) ? v.forbidden.join(', ') : (v.forbidden || '');
          displayVal = pref ? `Preferred: [${pref}]` : 'Open selection';
          if (forb) displayVal += `; Forbidden: [${forb}]`;
        } else if (question?.sliderConfig) {
          displayVal = `${v} ${question.sliderConfig.unit}`;
        }
        return `- **${label}:** ${displayVal}`;
      })
      .join('\\n');"""

content = content.replace(old_params, new_params)

with open(filepath, 'w') as f:
    f.write(content)

print("Done: paramsText resolution fixed")
