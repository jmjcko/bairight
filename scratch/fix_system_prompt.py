import re

filepath = '/Users/jan.mynar/Documents/GitHub/bairight/src/app/api/agent/chat/route.ts'
with open(filepath, 'r') as f:
    content = f.read()

# Replace the agentDirective line to detect compiled prompts
old_directive = """  const agentDirective = agent?.systemPrompt || 'Pomáhej uživateli vybrat nejvhodnější produkty na základě technických a ergonomických parametrů.';"""

new_directive = """  // Detect if agent.systemPrompt is already a full compiled prompt (from wizard)
  // vs. a simple base directive. Compiled prompts contain the parameter block marker.
  const rawAgentSystemPrompt = agent?.systemPrompt || '';
  const isCompiledPrompt = rawAgentSystemPrompt.includes('MANDATORY & BINDING USER REQUIREMENTS') 
    || rawAgentSystemPrompt.includes('STRIKTNÍ A ZÁVAZNÉ POŽADAVKY UŽIVATELE')
    || rawAgentSystemPrompt.includes('REQUIRED RESPONSE FORMAT')
    || rawAgentSystemPrompt.includes('POŽADOVANÝ FORMÁT ODPOVĚDI');
  const agentDirective = rawAgentSystemPrompt || 'Pomáhej uživateli vybrat nejvhodnější produkty na základě technických a ergonomických parametrů.';"""

content = content.replace(old_directive, new_directive)

# Now replace the systemPrompt construction to avoid triple-duplication
# When isCompiledPrompt is true, use the compiled prompt directly as systemInstruction
# and only add the assessment "don't re-ask" instruction + RAG facts

old_system_prompt = """  const systemPrompt = isEn ? `
You are ${agentTitle} (${agentRole}) specializing in "${agentCategory}".
${agentDirective}
${assessmentPromptBlock}

### USER KNOWLEDGE HISTORY & RAG FACTS:
${formattedFacts || 'No prior user facts recorded.'}

### RESPONSE RULES & STRICT LANGUAGE DIRECTIVE:
1. CRITICAL LANGUAGE DIRECTIVE: Communicate and output ALL text, executive summaries, product names, rationale, pros & cons, trade-offs, and buying advice STRICTLY in fluent, natural English. Do NOT generate Czech sentences or paragraphs.
2. ALWAYS respond directly to what the user wrote. Never repeat mechanically.
3. If the user explicitly asks for a specific number of options or criteria, fulfill it strictly.
4. Format output clearly in Markdown using headings (###), bold text, and bullet points.
`.trim() : `
Jsi ${agentTitle} (${agentRole}) specializovaný na kategorii "${agentCategory}".
${agentDirective}
${assessmentPromptBlock}

### ZNÁMÁ DATA UŽIVATELE Z RAG PAMĚTI:
${formattedFacts || 'Žádná předchozí data zatím nejsou evidována.'}

### PRAVIDLA PRO ODPOVĚDI:
1. CRITICAL LANGUAGE DIRECTIVE: Veškerá doporučení, konkrétní přesné názvy produktových modelů (např. Lenovo Legion Slim 5 16AHR8), odůvodnění, výhody a reakce MUSÍŠ komunikovat a generovat striktně v přirozené češtině (Čeština).
2. VŽDY reaguj přímo na to, co uživatel napsal. Nikdy se mechanicky neopakuj.
3. Pokud uživatel výslovně požádá o určitý počet parametrů či kritérií, VŽDY mu vyhov a uveď přesně tolik strukturovaných bodů s vysvětlením."""

new_system_prompt = """  // When the system prompt is already a fully compiled prompt from the wizard,
  // use it directly to avoid triple-duplication of parameters and format instructions.
  // Only add RAG facts and the "don't re-ask" instruction.
  let systemPrompt: string;
  if (isCompiledPrompt) {
    // The compiled prompt already contains: base persona, parameters, format, language directive.
    // We only add: RAG facts, assessment "don't re-ask" guard, and conversational rules.
    const ragBlock = formattedFacts 
      ? (isEn 
        ? `\\n### USER KNOWLEDGE HISTORY & RAG FACTS:\\n${formattedFacts}` 
        : `\\n### ZNALOSTNÍ HISTORIE & RAG FAKTA UŽIVATELE:\\n${formattedFacts}`)
      : '';
    const dontReaskBlock = assessmentContext 
      ? (isEn
        ? `\\n\\nCRITICAL MANDATORY INSTRUCTION:\\nThe user has already completed the purchasing wizard. All criteria are in the instructions above. NEVER ask the user to re-enter criteria or restart the wizard! Answer directly and serve as their independent shopping expert.`
        : `\\n\\nSTRIKTNÍ KRITICKÁ INSTRUKCE:\\nUživatel už tento průvodce nákupem dokončil! Všechna jeho kritéria MÁŠ K DISPOZICI VÝŠE. NIKDY se uživatele nesmíš ptát, aby znova zadával kritéria! Přímo mu odpovídej na jeho dotaz.`)
      : '';
    const conversationalRules = isEn
      ? `\\n\\n### CONVERSATIONAL RULES:\\n1. ALWAYS respond directly to what the user wrote.\\n2. If the user asks for a specific number of options, fulfill it strictly.\\n3. Format output clearly in Markdown.`
      : `\\n\\n### PRAVIDLA PRO ODPOVĚDI:\\n1. VŽDY reaguj přímo na to, co uživatel napsal.\\n2. Pokud uživatel požádá o určitý počet kritérií, VŽDY mu vyhov.\\n3. Formátuj odpověď přehledně v Markdownu.`;
    systemPrompt = `${agentDirective}${ragBlock}${dontReaskBlock}${conversationalRules}`.trim();
  } else {
    // Standard non-compiled prompt: build the full system instruction
    systemPrompt = isEn ? `
You are ${agentTitle} (${agentRole}) specializing in "${agentCategory}".
${agentDirective}
${assessmentPromptBlock}

### USER KNOWLEDGE HISTORY & RAG FACTS:
${formattedFacts || 'No prior user facts recorded.'}

### RESPONSE RULES & STRICT LANGUAGE DIRECTIVE:
1. CRITICAL LANGUAGE DIRECTIVE: Communicate and output ALL text, executive summaries, product names, rationale, pros & cons, trade-offs, and buying advice STRICTLY in fluent, natural English. Do NOT generate Czech sentences or paragraphs.
2. ALWAYS respond directly to what the user wrote. Never repeat mechanically.
3. If the user explicitly asks for a specific number of options or criteria, fulfill it strictly.
4. Format output clearly in Markdown using headings (###), bold text, and bullet points.
`.trim() : `
Jsi ${agentTitle} (${agentRole}) specializovaný na kategorii "${agentCategory}".
${agentDirective}
${assessmentPromptBlock}

### ZNÁMÁ DATA UŽIVATELE Z RAG PAMĚTI:
${formattedFacts || 'Žádná předchozí data zatím nejsou evidována.'}

### PRAVIDLA PRO ODPOVĚDI:
1. CRITICAL LANGUAGE DIRECTIVE: Veškerá doporučení, konkrétní přesné názvy produktových modelů (např. Lenovo Legion Slim 5 16AHR8), odůvodnění, výhody a reakce MUSÍŠ komunikovat a generovat striktně v přirozené češtině (Čeština).
2. VŽDY reaguj přímo na to, co uživatel napsal. Nikdy se mechanicky neopakuj.
3. Pokud uživatel výslovně požádá o určitý počet parametrů či kritérií, VŽDY mu vyhov a uveď přesně tolik strukturovaných bodů s vysvětlením."""

content = content.replace(old_system_prompt, new_system_prompt)

with open(filepath, 'w') as f:
    f.write(content)

print("Done: system prompt restructured")
