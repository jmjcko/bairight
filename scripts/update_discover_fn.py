path = "src/lib/agent/domain-parameter-discovery.ts"
with open(path, "r", encoding="utf-8") as f:
    code = f.read()

# Find export function discoverDomainParameters
start_marker = "export function discoverDomainParameters(query: string): DomainAnalysisResult {"
end_marker = "return synthesizeGenericDomainProfile(cleanTitle);\n}"

start_idx = code.find(start_marker)
end_idx = code.find(end_marker, start_idx)

if start_idx != -1 and end_idx != -1:
    new_fn = '''export function discoverDomainParameters(query: string): DomainAnalysisResult {
  // Direct clean title synthesis — NO fuzzy substring matching or dictionary keyword guessing.
  // Unless exact letter-for-letter verified match exists in database, query is synthesized directly for LLM/clean title.
  const cleanTitle = extractCleanProductTitle(query);
  return synthesizeGenericDomainProfile(cleanTitle);
}'''
    code = code[:start_idx] + new_fn + code[end_idx + len(end_marker):]
    with open(path, "w", encoding="utf-8") as f:
        f.write(code)
    print("✅ discoverDomainParameters simplified to clean direct synthesis without fuzzy dictionary loops!")
else:
    print(f"⚠️ Markers not found: start_idx={start_idx}, end_idx={end_idx}")
