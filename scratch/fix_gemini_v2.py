filepath = '/Users/jan.mynar/Documents/GitHub/bairight/src/app/api/agent/chat/route.ts'
with open(filepath, 'r') as f:
    content = f.read()

content = content.replace(
    "const candidateModels = ['gemini-2.5-flash', 'gemini-2.0-flash-001', 'gemini-1.5-flash-latest'];",
    "const candidateModels = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-2.5-flash'];"
)

with open(filepath, 'w') as f:
    f.write(content)

print("Done: Gemini models updated to 3.8/3.5/2.5")
