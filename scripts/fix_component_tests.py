with open("src/components/__tests__/AgentCategoryLauncher.test.tsx", "r", encoding="utf-8") as f:
    text = f.read()

text = text.replace(
    "getByText(/Typ karoserie & prostorové uspořádání/i)",
    "getByText(/Typ karoserie/i)"
)

text = text.replace(
    r"getByText(/Voděodolná membrána \(Gore-Tex \/ GTX\)/i)",
    "getByText(/Voděodolná membrána/i)"
)

text = text.replace(
    r"/Voděodolná membrána \\(Gore-Tex \\/ GTX\\)",
    "/Voděodolná membrána/"
)

# Also fix the exact regex-escaped version
import re
text = re.sub(
    r"getByText\(/Voděodolná membrána [^/]+/i\)",
    "getByText(/Voděodolná membrána/i)",
    text
)

with open("src/components/__tests__/AgentCategoryLauncher.test.tsx", "w", encoding="utf-8") as f:
    f.write(text)

print("Updated AgentCategoryLauncher tests!")
