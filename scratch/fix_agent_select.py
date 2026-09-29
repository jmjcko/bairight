with open('src/app/page.tsx', 'r') as f:
    lines = f.readlines()

# Add handleSelectAgent helper after activeFactsCount line (~ line 115)
insert_idx = -1
for i, line in enumerate(lines[:140]):
    if 'const activeFactsCount =' in line or 'const activeProvider =' in line:
        insert_idx = i + 1

if insert_idx != -1:
    helper = [
        "\n",
        "  const handleSelectAgent = (agent: UniversalAgentDefinition | null, forceShowResult?: boolean) => {\n",
        "    setSelectedAgent(agent);\n",
        "    if (agent) {\n",
        "      let isCompleted = forceShowResult ?? false;\n",
        "      if (forceShowResult === undefined && typeof window !== 'undefined') {\n",
        "        const storedStates = localStorage.getItem('bairight_agent_wizard_states');\n",
        "        if (storedStates) {\n",
        "          try {\n",
        "            const parsed = JSON.parse(storedStates);\n",
        "            if (parsed[agent.id]?.isCompleted) {\n",
        "              isCompleted = true;\n",
        "            }\n",
        "          } catch {}\n",
        "        }\n",
        "      }\n",
        "      setWizardInitialShowResult(isCompleted);\n",
        "    } else {\n",
        "      setWizardInitialShowResult(false);\n",
        "    }\n",
        "  };\n"
    ]
    lines[insert_idx:insert_idx] = helper

content = ''.join(lines)

# Replace setSelectedAgent(agent) calls with handleSelectAgent
content = content.replace(
    'onSelectAgent={(agent, initialShowResult = false) => {\n                setSelectedAgent(agent);\n                setWizardMode(\'active_agent\');\n                setWizardInitialShowResult(initialShowResult);\n              }}',
    'onSelectAgent={(agent, initialShowResult = false) => {\n                handleSelectAgent(agent, initialShowResult);\n                setWizardMode(\'active_agent\');\n              }}'
)

content = content.replace('onClick={() => setSelectedAgent(ag)}', 'onClick={() => handleSelectAgent(ag)}')

# Replace wizard tab onClick to also ensure handleSelectAgent/setWizardInitialShowResult check
target_tab = '''            <button
              onClick={() => {
                if (selectedAgent) {
                  let isCompleted = false;
                  if (typeof window !== 'undefined') {
                    const storedStates = localStorage.getItem('bairight_agent_wizard_states');
                    if (storedStates) {
                      try {
                        const parsed = JSON.parse(storedStates);
                        if (parsed[selectedAgent.id]?.isCompleted) {
                          isCompleted = true;
                        }
                      } catch {}
                    }
                  }
                  setWizardInitialShowResult(isCompleted);
                  setWizardMode('active_agent');
                }
                setActiveTab('wizard');
              }}'''

replacement_tab = '''            <button
              onClick={() => {
                if (selectedAgent) {
                  handleSelectAgent(selectedAgent);
                  setWizardMode('active_agent');
                }
                setActiveTab('wizard');
              }}'''

content = content.replace(target_tab, replacement_tab)

with open('src/app/page.tsx', 'w') as f:
    f.write(content)

print("Updated handleSelectAgent helper in src/app/page.tsx")
