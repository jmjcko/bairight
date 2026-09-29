import re

# 1. Update src/lib/i18n/translations.ts with complete memoryModal, authModal, vaultModal, greeting & prompts
with open('src/lib/i18n/translations.ts', 'r') as f:
    tr_code = f.read()

# Expand translations dictionary
cs_addition = """    memoryModal: {
      title: 'Paměť AI & Historie Posudků',
      subtitle: 'Osobní RAG biometrie, preference a uložená historie posudků',
      tabFacts: 'Biometrie & Míry ({count})',
      tabAssessments: 'Historie Posudků ({count})',
      tabPrompts: 'Historie Promptů ({count})',
      addFactBtn: 'Přidat fakt',
      saveToDb: 'Uložit do DB',
      deleteFactTitle: 'Smazat fakt z databáze',
      clearAllPrompts: 'Smazat všechny prompty',
      catBiometrics: 'Biometrie & Míry',
      catMedical: 'Ergonomie & Zdraví',
      catPreference: 'Preference & Styl',
      catHistory: 'Historie & Použití',
      noFacts: 'Žádné osobní faktu nebyly dosud zaznamenány.',
      noAssessments: 'Zatím nemáte uloženy žádné posudky.',
      noPrompts: 'Historie vygenerovaných promptů je prázdná.',
    },
    authModal: {
      title: 'Přihlášení k bAIright',
      subtitle: 'Získejte přístup ke své osobní AI paměti a uloženým agentům',
      googleBtn: 'Pokračovat přes Google',
      disclaimer: 'Vaše údaje jsou šifrovány a slouží výhradně pro personalizaci nákupního poradce.',
    },
    vaultModal: {
      title: 'Správa AI Modelů & Vault Klíčů (BYOK)',
      subtitle: 'Propojte své předplatné Google Gemini, OpenAI nebo Anthropic pro neomezenou diskusi.',
      activeModel: 'Aktivní poskytovatel: {name}',
      apiKeyLabel: 'Váš API Klíč ({provider}):',
      saveKeyBtn: 'Uložit klíč do šifrovaného trezoru',
      keySavedOk: 'Klíč byl bezpečně uložen v lokálním trezoru (Vault).',
      noKeyWarning: 'Bez zadaného klíče nelze spustit živou diskusi s agentem.',
    },
    greetings: {
      title: '### 🤖 Vítejte v bAIright: Váš univerzální nákupní rádce & prompt inženýr\\n\\nJsem váš nezávislý nákupní expert poháněný umělou inteligencí s kontextovou RAG pamětí.\\nPomohu vám vybrat jakýkoliv produkt na základě vašich technických, ergonomických a cenových požadavků:\\n\\n- 🚗 **Automobily & rodinné vozy** (motorizace, prostor, provozní náklady)\\n- 👟 **Sportovní & zdravotní obuv** (biomechanika, došlap, šířka kopyta, tlumení)\\n- ☕ **Kávovary & příprava kávy** (espresso, mléčný systém, mlecí kameny)\\n- 🪑 **Ergonomické sezení & židle** (ochrana páteře, mechanika, područky)\\n- 🎯 **Jakákoliv další kategorie na míru**\\n\\nZadejte své požadavky nebo vyberte agenta výše pro spuštění interaktivního průvodce.',
    },"""

en_addition = """    memoryModal: {
      title: 'AI Memory & Assessment History',
      subtitle: 'Personal RAG biometrics, preferences, and saved prescription history',
      tabFacts: 'Biometrics & Specs ({count})',
      tabAssessments: 'Assessment History ({count})',
      tabPrompts: 'Prompt History ({count})',
      addFactBtn: 'Add Fact',
      saveToDb: 'Save to DB',
      deleteFactTitle: 'Delete fact from database',
      clearAllPrompts: 'Clear All Prompts',
      catBiometrics: 'Biometrics & Dimensions',
      catMedical: 'Ergonomics & Health',
      catPreference: 'Preferences & Style',
      catHistory: 'History & Usage',
      noFacts: 'No personal facts have been recorded yet.',
      noAssessments: 'No saved assessment reports yet.',
      noPrompts: 'Generated prompt history is empty.',
    },
    authModal: {
      title: 'Sign in to bAIright',
      subtitle: 'Access your personal AI memory and saved shopping agents',
      googleBtn: 'Continue with Google',
      disclaimer: 'Your data is encrypted and used strictly for shopping consultant personalization.',
    },
    vaultModal: {
      title: 'AI Model Management & Vault Keys (BYOK)',
      subtitle: 'Connect your Google Gemini, OpenAI, or Anthropic subscription for unlimited discussion.',
      activeModel: 'Active Provider: {name}',
      apiKeyLabel: 'Your API Key ({provider}):',
      saveKeyBtn: 'Save Key to Encrypted Vault',
      keySavedOk: 'API Key safely stored in your local encrypted vault.',
      noKeyWarning: 'Without an API key, live agent discussion cannot be initiated.',
    },
    greetings: {
      title: '### 🤖 Welcome to bAIright: Your Universal Shopping Advisor & Prompt Engineer\\n\\nI am your independent AI shopping expert powered by contextual RAG memory.\\nI will help you choose any product based on your technical, ergonomic, and budgetary requirements:\\n\\n- 🚗 **Family cars & SUVs** (engine specs, interior space, running costs)\\n- 👟 **Running & orthopedic footwear** (biomechanics, stride, 2E width, cushioning)\\n- ☕ **Espresso & coffee machines** (pressure, milk system, grinder types)\\n- 🪑 **Ergonomic seating & office chairs** (lumbar support, mechanism, armrests)\\n- 🎯 **Any custom category tailored for you**\\n\\nEnter your requirements or pick an agent above to launch the interactive wizard.',
    },"""

if 'memoryModal:' not in tr_code:
    tr_code = tr_code.replace("    launcher: {", cs_addition + "\n    launcher: {")
    tr_code = tr_code.replace("    launcher: {\n      badge: 'Intelligent Shopping Advisor & Explorer',", en_addition + "\n    launcher: {\n      badge: 'Intelligent Shopping Advisor & Explorer',")

with open('src/lib/i18n/translations.ts', 'w') as f:
    f.write(tr_code)
print("Updated translations.ts with memoryModal, authModal, vaultModal, greetings")

# 2. Update src/lib/agent/luke-agent-prompt.ts for 100% English Meta-Prompt
luke_prompt_code = ''''/**
 * Agent Luke Prompt Specification & Meta-Prompt
 * Synchronized with SPEC/agents/LUKE_RESEARCH_AGENT.md
 */

export function buildLukeSystemPrompt(categoryQuery: string, locale: string = 'cs'): string {
  const isEn = locale === 'en';

  if (isEn) {
    return `
You are an expert shopping analyst and technical specifier in the bAIright expert decision engine.
Your mission is to decompose any user-requested product category into a list of 8 to 10 critical purchasing parameters that a buyer must evaluate before making a decision.

Target Product Category: "${categoryQuery}"

Rules for parameter generation:
1. Scope: Strictly generate 8 to 10 parameters.
2. Coverage: Parameters must cover the full selection spectrum (1-2 focused on market segmentation/user context, the rest on key technical specs). For products worn or used on the body, include biometrics and ergonomics.
3. Clarity: Every parameter must have a concise layperson rationale (max 100 chars) explaining why it matters and what the risk of a bad choice is based on enthusiast reviews and forums.
4. Categorization: Suggest a typical response component (suggestedComponent: "chips", "slider", "dropdown", "brands") and ALWAYS include 3 to 5 realistic market options in suggestedValues. DO NOT leave suggestedValues empty.
5. Brand Isolation: Always include a brand preference parameter (id: "brand_preferences", name: "Brands & Manufacturers", category: "Brands & Manufacturers", suggestedComponent: "brands").
6. No Vague Clichés: STRICTLY FORBIDDEN: vague clichés ("Price", "Color", "Appearance", "Quality").

Output Structure (Respond STRICTLY as valid JSON):
{
  "categoryName": "${categoryQuery}",
  "agentName": "Luke: Specialist in ${categoryQuery}",
  "icon": "🎯",
  "description": "Shopping advisor for selecting ${categoryQuery} grounded in technical specifications and review consensus.",
  "parameters": [
    {
      "id": "param_1",
      "name": "Short Name (≤ 18 chars)",
      "category": "Parameter Category",
      "importance": "mandatory",
      "rationale": "Short layperson explanation of why this parameter matters.",
      "icon": "🎯",
      "suggestedComponent": "chips",
      "suggestedValues": ["Option 1", "Option 2", "Option 3"],
      "isMultiSelect": true
    }
  ]
}
`.trim();
  }

  return `
Jazyk výstupu: Čeština. Všechny texty a parametry vygeneruj v přirozené češtině.

Jsi expertní nákupní analytik a technický specifikátor v expertním systému bAIright. Tvým úkolem je rozpadnout jakoukoliv uživatelem zadanou kategorii zboží na seznam 8 až 10 nejkritičtějších parametrů, které musí kupující zvážit před finálním rozhodnutím.

Vstupní entita (Zboží): "${categoryQuery}"

Pravidla pro generování parametrů:
1. Rozsah: Vygeneruj striktně 8 až 10 parametrů.
2. Komplexita: Parametry musí pokrývat celé spektrum výběru (1-2 zaměřené na uživatelský kontext/účel a typologii trhu, zbytek na klíčové technické specifikace typické pro dané zboží). U produktů vázaných na lidské tělo zařaď i tělesnou biometrii a ergonomii.
3. Srozumitelnost: Každý parametr musí mít krátký vysvětlující popis pro laika (rationale, max 100 znaků), proč je daná věc důležitá a jaké je riziko špatné volby podle zkušeností z recenzí a fór.
4. Kategorizace: Ke každému parametru navrhni typický formát odpovědi (suggestedComponent: "chips", "slider", "dropdown", "brands") a VŽDY uveď 3 až 5 nejběžnějších hodnot nebo příkladů z trhu v poli suggestedValues.
5. Izolace značek: Mezi vygenerovanými parametry MUSÍŠ VŽDY ZAHRNOUT parametr pro značky a výrobci (id: "brand_preferences", name: "Značky a výrobci", category: "Výrobci & Značky", suggestedComponent: "brands").
6. Striktní zákaz klišé: Žádná obecná klišé ("Cena", "Barva", "Vzhled", "Kvalita").

Struktura výstupu (vygeneruj validní JSON):
{
  "categoryName": "${categoryQuery}",
  "agentName": "Luke: Specialista na ${categoryQuery}",
  "icon": "🎯",
  "description": "Nákupní poradce pro výběr ${categoryQuery} zohledňující klíčové technické specifikace a poznatky z recenzí.",
  "parameters": [
    {
      "id": "param_1",
      "name": "Stručný název (≤ 18 znaků)",
      "category": "Kategorie parametru",
      "importance": "mandatory",
      "rationale": "Krátký vysvětlující popis pro laika, proč je daná věc důležitá.",
      "icon": "🎯",
      "suggestedComponent": "chips",
      "suggestedValues": ["Možnost 1", "Možnost 2", "Možnost 3"],
      "isMultiSelect": true
    }
  ]
}
`.trim();
}
'''

with open('src/lib/agent/luke-agent-prompt.ts', 'w') as f:
    f.write(luke_prompt_code)
print("Updated luke-agent-prompt.ts for full EN meta-prompt")

# 3. Update AgentCategoryLauncher.tsx to pass locale parameter to research-parameters API
with open('src/components/AgentCategoryLauncher.tsx', 'r') as f:
    launcher = f.read()

launcher = launcher.replace(
    "const res = await fetch('/api/agent/research-parameters', {",
    "const res = await fetch(`/api/agent/research-parameters?locale=${locale}`, {"
)

with open('src/components/AgentCategoryLauncher.tsx', 'w') as f:
    f.write(launcher)
print("Updated AgentCategoryLauncher.tsx to pass locale to research API")

