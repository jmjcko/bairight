filepath = '/Users/jan.mynar/Documents/GitHub/bairight/src/app/api/agent/chat/route.ts'
with open(filepath, 'r') as f:
    content = f.read()

# Fix 1: Update Gemini model names
content = content.replace(
    "const candidateModels = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];",
    "const candidateModels = ['gemini-2.5-flash', 'gemini-2.0-flash-001', 'gemini-1.5-flash-latest'];"
)

with open(filepath, 'w') as f:
    f.write(content)

print("Done: Gemini model names updated")
