# 1. Update UserRAGMemoryModal.tsx to include useI18n import and destructure locale
with open('src/components/UserRAGMemoryModal.tsx', 'r') as f:
    mem = f.read()

if "import { useI18n } from '@/lib/i18n/I18nContext';" not in mem:
    mem = "import { useI18n } from '@/lib/i18n/I18nContext';\n" + mem

if "const { locale } = useI18n();" not in mem:
    mem = mem.replace(
        "export const UserRAGMemoryModal: React.FC<UserRAGMemoryModalProps> = ({",
        "export const UserRAGMemoryModal: React.FC<UserRAGMemoryModalProps> = ({\n"
    )
    # Add inside component body
    mem = mem.replace(
        "const [activeTab, setActiveTab] = useState<'facts' | 'assessments' | 'prompts'>('facts');",
        "const { locale } = useI18n();\n  const [activeTab, setActiveTab] = useState<'facts' | 'assessments' | 'prompts'>('facts');"
    )

with open('src/components/UserRAGMemoryModal.tsx', 'w') as f:
    f.write(mem)

print("Updated UserRAGMemoryModal.tsx with useI18n hook")

