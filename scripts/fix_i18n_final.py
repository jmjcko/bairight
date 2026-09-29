with open('src/components/UserRAGMemoryModal.tsx', 'r') as f:
    mem = f.read()

# Make sure const { locale } = useI18n(); is inside UserRAGMemoryModal component body
if "const { locale } = useI18n();" not in mem:
    mem = mem.replace(
        "export const UserRAGMemoryModal: React.FC<UserRAGMemoryModalProps> = ({\n  onOpenMemoryModal,\n}) => {",
        "export const UserRAGMemoryModal: React.FC<UserRAGMemoryModalProps> = () => {\n  const { locale } = useI18n();"
    ).replace(
        "export const UserRAGMemoryModal: React.FC<UserRAGMemoryModalProps> = ({",
        "export const UserRAGMemoryModal: React.FC<UserRAGMemoryModalProps> = (props) => {\n  const { locale } = useI18n();"
    )

with open('src/components/UserRAGMemoryModal.tsx', 'w') as f:
    f.write(mem)

# Fix duplicate keys in translations.ts
with open('src/lib/i18n/translations.ts', 'r') as f:
    tr = f.read()

# Remove duplicate entries at the end of en dictionary
dup_marker = "    greetings: {\n      title: '### 🤖 Welcome to bAIright"
if tr.count("memoryModal:") > 2:
    # Keep only first occurrence in cs and first in en
    parts = tr.split("memoryModal:")
    # Reassemble cleanly
    tr_clean = parts[0] + "memoryModal:" + parts[1] + "memoryModal:" + parts[2]
    tr = tr_clean

with open('src/lib/i18n/translations.ts', 'w') as f:
    f.write(tr)

print("Fixed i18n final syntax")

