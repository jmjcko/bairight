import sys
import os

print("Applying Exact Letter-for-Letter Match & Direct Prompt Calling Policy...")

# 1. Update src/lib/agent/domain-parameter-discovery.ts
disc_path = "src/lib/agent/domain-parameter-discovery.ts"
with open(disc_path, "r", encoding="utf-8") as f:
    disc_code = f.read()

# Replace discoverDomainParameters to directly synthesize for cleanTitle without ANY dictionary keyword matching
old_discover_fn = '''export function discoverDomainParameters(query: string): DomainAnalysisResult {
  const normalized = normalizeText(query);

  // Find best domain profile match (prioritizing longest/most specific keyword)
  let bestMatch: { key: string; profile: (typeof DOMAIN_PROFILES)[string]; matchedKwLength: number } | null = null;

  for (const [key, profile] of Object.entries(DOMAIN_PROFILES)) {
    for (const kw of profile.keywords) {
      const normKw = normalizeText(kw);
      // For short keywords (<= 3 chars like 'ev', 'tv'), require distinct word boundaries to avoid false substring matches (e.g. 'televize' matching 'ev')
      const isMatch = normKw.length <= 3
        ? new RegExp(`(^|\\\\s|[.,;!?])${normKw}($|\\\\s|[.,;!?])`, 'i').test(normalized)
        : normalized.includes(normKw);

      if (isMatch) {
        if (!bestMatch || normKw.length > bestMatch.matchedKwLength) {
          bestMatch = { key, profile, matchedKwLength: normKw.length };
        }
      }
    }
  }

  if (bestMatch) {
    const { key, profile } = bestMatch;
    const learned = DomainLearningService.getLearnedParametersForDomain(key);
    const existingAlternatives = profile.suggestedAlternatives || [];
    const mergedAlternatives: ExtractedDomainParameter[] = [
      ...learned,
      ...existingAlternatives,
    ].filter((item, idx, arr) =>
      !profile.parameters.some((p) => p.id === item.id || normalizeText(p.name) === normalizeText(item.name)) &&
      arr.findIndex((x) => x.id === item.id || normalizeText(x.name) === normalizeText(item.name)) === idx
    );

    // INTENT FILTER:
    // If the user's query already explicitly specified a constraint, eliminate redundant/contradictory questions!
    const cleanTitle = extractCleanProductTitle(query);
    const filteredQuestions = profile.questions.filter((q) => {
      const qTitleNorm = normalizeText(q.title);
      // Filter out fuel question if query specifies electric
      if (normalized.includes('elektr') || normalized.includes('ev') || normalized.includes('bater')) {
        if (qTitleNorm.includes('paliv') || qTitleNorm.includes('pohon') || qTitleNorm.includes('benz') || qTitleNorm.includes('naft')) {
          return false;
        }
      }
      return true;
    });

    return {
      keyword: cleanTitle,
      matchedDomain: key,
      categoryName: profile.categoryName,
      agentName: profile.agentName,
      icon: profile.icon,
      description: profile.description,
      parameters: profile.parameters,
      questions: filteredQuestions,
      systemPrompt: profile.systemPrompt,
      suggestedAlternatives: mergedAlternatives,
    };
  }

  const cleanTitle = extractCleanProductTitle(query);
  return synthesizeGenericDomainProfile(cleanTitle);
}'''

new_discover_fn = '''export function discoverDomainParameters(query: string): DomainAnalysisResult {
  // Direct query synthesis for exact input — NO keyword dictionary matching or domain guessing
  const cleanTitle = extractCleanProductTitle(query);
  return synthesizeGenericDomainProfile(cleanTitle);
}'''

if old_discover_fn in disc_code:
    disc_code = disc_code.replace(old_discover_fn, new_discover_fn)
    with open(disc_path, "w", encoding="utf-8") as f:
        f.write(disc_code)
    print("✅ discovery.ts updated: removed keyword dictionary matching logic!")
else:
    print("⚠️ Could not match old_discover_fn in discovery.ts")

# 2. Update agents/luke-general-agent.md & SPEC/agents/LUKE_RESEARCH_AGENT.md
gen_path = "agents/luke-general-agent.md"
with open(gen_path, "r", encoding="utf-8") as f:
    gen_text = f.read()

exact_match_rule = '''
### 8. 🎯 Pravidlo přesné shody do písmene pro databázi (Letter-for-Letter Match Only)
- Systém smí použít uložený záznam z databáze **POUZE POKUD zadaný vstup od uživatele sedí do písmene** s dotazem, který již dříve v repozitáři/databázi **prošel celým průvodcem a byl ověřen zákazníkem**.
- Pokud dotaz nesedí do písmene s ověřeným záznamem: Systém jakoukoliv nápovědu či statický slovník ignoruje a **PROVOLÁ PROMPT PŘÍMO NA LLM GEMINI**.
- Žádné vyhledávání podle podřetězců (jako slovo "kolo" v "tretry na kolo"), žádné odhadování kategorií z offline tabulek.
'''

if "Pravidlo přesné shody do písmene" not in gen_text:
    gen_text += exact_match_rule
    with open(gen_path, "w", encoding="utf-8") as f:
        f.write(gen_text)
    print("✅ Updated agents/luke-general-agent.md with Exact Letter Match Rule.")

spec_path = "SPEC/agents/LUKE_RESEARCH_AGENT.md"
with open(spec_path, "r", encoding="utf-8") as f:
    spec_text = f.read()

if "Pravidlo přesné shody do písmene" not in spec_text:
    spec_text += exact_match_rule
    with open(spec_path, "w", encoding="utf-8") as f:
        f.write(spec_text)
    print("✅ Updated SPEC/agents/LUKE_RESEARCH_AGENT.md with Exact Letter Match Rule.")

