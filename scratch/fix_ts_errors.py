filepath = '/Users/jan.mynar/Documents/GitHub/bairight/src/app/api/agent/chat/route.ts'
with open(filepath, 'r') as f:
    content = f.read()

old = """        } else if (typeof v === 'object' && v !== null && ('preferred' in v || 'forbidden' in v)) {
          const pref = Array.isArray(v.preferred) ? v.preferred.join(', ') : (v.preferred || '');
          const forb = Array.isArray(v.forbidden) ? v.forbidden.join(', ') : (v.forbidden || '');"""

new = """        } else if (typeof v === 'object' && v !== null && ('preferred' in v || 'forbidden' in v)) {
          const brandObj = v as { preferred?: string[]; forbidden?: string[] };
          const pref = Array.isArray(brandObj.preferred) ? brandObj.preferred.join(', ') : (brandObj.preferred || '');
          const forb = Array.isArray(brandObj.forbidden) ? brandObj.forbidden.join(', ') : (brandObj.forbidden || '');"""

content = content.replace(old, new)

with open(filepath, 'w') as f:
    f.write(content)

print("Done: TS type errors fixed")
