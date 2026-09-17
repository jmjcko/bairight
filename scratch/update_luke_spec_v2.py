with open('SPEC/agents/LUKE_RESEARCH_AGENT.md', 'r') as f:
    content = f.read()

reactive_section = """
## 🔄 Autonomous Reactive Market Teardown Rule (CRITICAL)

Agent Luke MUST NOT rely on static, manually maintained hardcoded domain dictionaries.
Luke operates as a **100% autonomous, reactive market analyst**:

1. **Reactivity**: For ANY product query entered by the user (e.g., `"dřevěná terasa"`, `"vyšívací stroj"`, `"hrnek"`, `"herní monitor"`), Luke conducts a dynamic market teardown analysis.
2. **Reverse Engineering Failure Points**: Luke analyzes real-world buyer pitfalls, marketing traps, material failures, and user forum/video teardowns.
3. **1-Line Concise Rationale**: Every parameter rationale MUST be concise (1 essential sentence, max 65 characters) for high-scannability parameter tiles.
4. **L1 DB Cache & L2 LLM Researcher**:
   - **L1 DB Store**: Generated and verified parameter sets are cached locally/in DB (`DomainLearningService`) for zero-latency instant retrieval on repeated queries and pre-indexed Top 100 categories.
   - **L2 LLM Researcher**: For new queries (Cache MISS), Gemini 2.0 Flash executes the reactive market teardown meta-prompt, returns 10-14 parameters, and persists them into L1 DB.
"""

if 'Autonomous Reactive Market Teardown Rule' not in content:
    content = content.replace('## 🎯 Primary Mission & Persona', '## 🎯 Primary Mission & Persona' + '\n' + reactive_section)
    with open('SPEC/agents/LUKE_RESEARCH_AGENT.md', 'w') as f:
        f.write(content)
    print('Successfully updated SPEC/agents/LUKE_RESEARCH_AGENT.md with Reactive Rule')
else:
    print('Reactive rule already exists in spec')
