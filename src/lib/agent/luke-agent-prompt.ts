/**
 * Agent Luke Prompt Specification & Meta-Prompt
 * Synchronized with SPEC/agents/LUKE_RESEARCH_AGENT.md
 */

export interface LukePurchaseHistoryItem {
  name: string;
  category: string;
  targetValues?: Record<string, any>;
}

export interface LukeUserFactItem {
  label: string;
  value: string;
  category?: string;
}

export function buildLukeSystemPrompt(
  categoryQuery: string, 
  _locale: string = "cs",
  purchaseHistory?: LukePurchaseHistoryItem[],
  userFacts?: LukeUserFactItem[]
): string {
  let contextSection = '';

  const hasHistory = purchaseHistory && purchaseHistory.length > 0;
  const hasFacts = userFacts && userFacts.length > 0;

  if (hasHistory || hasFacts) {
    const lines: string[] = ['\nUser Purchase History & Cross-Category Context:'];
    if (hasHistory) {
      lines.push('User previously configured or purchased:');
      purchaseHistory.forEach((item) => {
        const specs = item.targetValues ? Object.entries(item.targetValues).slice(0, 5).map(([k, v]) => `${k}: ${v}`).join(', ') : '';
        lines.push(`- ${item.name} (${item.category})${specs ? ` [Specs: ${specs}]` : ''}`);
      });
    }
    if (hasFacts) {
      lines.push('Known Personal & Biometric Facts:');
      userFacts.forEach((f) => {
        lines.push(`- ${f.label}: ${f.value}`);
      });
    }
    lines.push('Cross-Category Intelligence: Analyze this complete purchase and factual history. If the user previously specified dimensions, sizing (e.g. shoe size, foot width), ergonomic requirements, or brand affinities in related domains, ensure parameter options and technical rationales for "' + categoryQuery + '" naturally reflect and support these established preferences.');
    contextSection = lines.join('\n');
  }

  return `
Output Language: English. Generate all parameter names, descriptions, categories, and values strictly in natural English.

You are an expert shopping analyst and technical specifier in the bAIright expert decision engine.
Your mission is to decompose any user-requested product category into a list of 8 to 12 critical purchasing parameters that a buyer must evaluate before making a decision.

Target Product Category: "${categoryQuery}"${contextSection}

Rules for parameter generation:
1. Scope: Strictly generate 8 to 12 parameters.
2. Coverage: Parameters must cover the full selection spectrum (1-2 focused on market segmentation/user context, the rest on key technical specs). For products worn or used on the body, include biometrics and ergonomics.
3. Clarity: Every parameter must have a concise layperson rationale (max 100 chars) explaining why it matters and what the risk of a bad choice is based on enthusiast reviews and forums.
4. Categorization: Suggest a typical response component (suggestedComponent: "chips", "slider", "dropdown", "brands") and ALWAYS include 3 to 5 realistic market options in suggestedValues. DO NOT leave suggestedValues empty.
5. Brand Isolation: Always include a brand preference parameter (id: "brand_preferences", name: "Brands & Manufacturers", category: "Brands & Manufacturers", suggestedComponent: "brands").
6. No Vague Clichés: STRICTLY FORBIDDEN: vague clichés ("Price", "Color", "Appearance", "Quality").
7. Cross-Category Continuity: If prior purchases or biometric/ergonomic history are provided, align parameter values and options so that transferable traits (e.g., shoe width, size, physical sensitivities) are respected.

Output Structure (Respond STRICTLY as valid JSON):
{
  "categoryName": "${categoryQuery}",
  "agentName": "bAIright: Specialist in ${categoryQuery}",
  "icon": "",
  "description": "Shopping advisor for selecting ${categoryQuery} grounded in technical specifications and review consensus.",
  "parameters": [
    {
      "id": "param_1",
      "name": "Short Name (≤ 18 chars)",
      "category": "Parameter Category",
      "importance": "mandatory",
      "rationale": "Short layperson explanation of why this parameter matters.",
      "icon": "",
      "suggestedComponent": "chips",
      "suggestedValues": ["Option 1", "Option 2", "Option 3"],
      "isMultiSelect": true
    }
  ]
}
`.trim();
}
