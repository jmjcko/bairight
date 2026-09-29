# 1. Clean UserRAGMemoryModal.tsx
with open('src/components/UserRAGMemoryModal.tsx', 'r') as f:
    mem = f.read()

bad_sig = '''export const UserRAGMemoryModal: React.FC<UserRAGMemoryModalProps> = (props) => {
  const { locale } = useI18n();

  isOpen,
  onClose,
  facts = [],
  assessments = [],
  userName = 'Jan Mynář',
  onToggleFact,
  onAddFact,
  onDeleteFact,
  onDeleteAssessment,
}) => {'''

good_sig = '''export const UserRAGMemoryModal: React.FC<UserRAGMemoryModalProps> = ({
  isOpen,
  onClose,
  facts = [],
  assessments = [],
  userName = 'Jan Mynář',
  onToggleFact,
  onAddFact,
  onDeleteFact,
  onDeleteAssessment,
}) => {
  const { locale } = useI18n();'''

mem = mem.replace(bad_sig, good_sig)

with open('src/components/UserRAGMemoryModal.tsx', 'w') as f:
    f.write(mem)

print("Cleaned UserRAGMemoryModal.tsx signature")

# 2. Re-create clean translations.ts file with perfect syntax and no duplicate keys
cs_dict = """    memoryModal: {
      title: 'Paměť AI & Historie Posudků',
      subtitle: 'Osobní RAG biometrie, preference a uložená historie posudků pro personalizaci agenta',
      tabFacts: 'Biometrie & Míry',
      tabAssessments: 'Historie Posudků',
      tabPrompts: 'Historie Promptů',
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
    },"""

en_dict = """    memoryModal: {
      title: 'AI Memory & Assessment History',
      subtitle: 'Personal RAG biometrics, preferences, and saved prescription history for agent personalization',
      tabFacts: 'Biometrics & Specs',
      tabAssessments: 'Assessment History',
      tabPrompts: 'Prompt History',
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
    },"""

with open('src/lib/i18n/translations.ts', 'r') as f:
    tr = f.read()

# Make sure interface has optional memoryModal?: Record<string, any>;
if "memoryModal?:" not in tr:
    tr = tr.replace("export interface Translations {", "export interface Translations {\n  memoryModal?: Record<string, any>;")

# Insert cs_dict inside cs object
if "memoryModal:" not in tr:
    tr = tr.replace("    launcher: {", cs_dict + "\n    launcher: {")
    tr = tr.replace("    launcher: {\n      badge: 'Intelligent Shopping Advisor & Explorer',", en_dict + "\n    launcher: {\n      badge: 'Intelligent Shopping Advisor & Explorer',")

with open('src/lib/i18n/translations.ts', 'w') as f:
    f.write(tr)

print("Cleaned translations.ts")
