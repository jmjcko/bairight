with open("src/components/__tests__/ParameterResearchWizardFlow.test.tsx", "r", encoding="utf-8") as f:
    text = f.read()

text = text.replace(
    "getByText(/Typ karoserie & prostorové uspořádání/i)",
    "getByText(/Typ karoserie/i)"
)

with open("src/components/__tests__/ParameterResearchWizardFlow.test.tsx", "w", encoding="utf-8") as f:
    f.write(text)

print("Updated ParameterResearchWizardFlow tests!")
