with open('src/app/page.tsx', 'r') as f:
    page = f.read()

# Replace static INITIAL_GREETING and SUGGESTED_PROMPTS with locale-driven helper functions
old_greetings = '''const INITIAL_GREETING: AgentChatMessage = {
  id: 'greeting-1',
  role: 'assistant',
  content: `### 🤖 Vítejte v bAIright: Váš univerzální nákupní rádce & prompt inženýr

Jsem váš nezávislý nákupní expert poháněný umělou inteligencí s kontextovou RAG pamětí.
Pomohu vám vybrat jakýkoliv produkt na základě vašich technických, ergonomických a cenových požadavků:

- 🚗 **Automobily & rodinné vozy** (motorizace, prostor, provozní náklady)
- 👟 **Sportovní & zdravotní obuv** (biomechanika, došlap, šířka kopyta, tlumení)
- ☕ **Kávovary & příprava kávy** (espresso, mléčný systém, mlecí kameny)
- 🪑 **Ergonomické sezení & židle** (ochrana páteře, mechanika, područky)
- 🎯 **Jakákoliv další kategorie na míru**

Zadejte své požadavky nebo vyberte agenta výše pro spuštění interaktivního průvodce.`,
  timestamp: new Date().toISOString(),
};

const SUGGESTED_PROMPTS = [
  {
    label: '🚗 Rodinné SUV / kombi do 650 tis. Kč',
    text: 'Hledám spolehlivé rodinné auto do 650 000 Kč s velkým kufrem, pohonem 4x4 a nízkou spotřebou.',
  },
  {
    label: '👟 Běžecké boty na asfalt pro širší chodidlo',
    text: 'Potřebuji běžecké boty na silnici s dobrým tlumením mezipodešve a širším kopytem.',
  },
  {
    label: '☕ Automatický kávovar na espresso a cappuccino',
    text: 'Doporuč tichý kávovar s jednoduchou údržbou a kvalitním mléčným systémem do 18 000 Kč.',
  },
  {
    label: '🪑 Ergonomická židle pro celodenní home office',
    text: 'Jakou kancelářskou židli zvolit při 8+ hodinách sezení denně pro prevenci bolestí beder?',
  },
];'''

new_greetings = '''function getInitialGreeting(locale: string): AgentChatMessage {
  const isEn = locale === 'en';
  return {
    id: 'greeting-1',
    role: 'assistant',
    content: isEn
      ? `### 🤖 Welcome to bAIright: Your Universal Shopping Advisor & Prompt Engineer\\n\\nI am your independent AI shopping expert powered by contextual RAG memory.\\nI will help you choose any product based on your technical, ergonomic, and budgetary requirements:\\n\\n- 🚗 **Family cars & SUVs** (engine specs, interior space, running costs)\\n- 👟 **Running & orthopedic footwear** (biomechanics, stride, 2E width, cushioning)\\n- ☕ **Espresso & coffee machines** (pressure, milk system, grinder types)\\n- 🪑 **Ergonomic seating & office chairs** (lumbar support, mechanism, armrests)\\n- 🎯 **Any custom category tailored for you**\\n\\nEnter your requirements or pick an agent above to launch the interactive wizard.`
      : `### 🤖 Vítejte v bAIright: Váš univerzální nákupní rádce & prompt inženýr\\n\\nJsem váš nezávislý nákupní expert poháněný umělou inteligencí s kontextovou RAG pamětí.\\nPomohu vám vybrat jakýkoliv produkt na základě vašich technických, ergonomických a cenových požadavků:\\n\\n- 🚗 **Automobily & rodinné vozy** (motorizace, prostor, provozní náklady)\\n- 👟 **Sportovní & zdravotní obuv** (biomechanika, došlap, šířka kopyta, tlumení)\\n- ☕ **Kávovary & příprava kávy** (espresso, mléčný systém, mlecí kameny)\\n- 🪑 **Ergonomické sezení & židle** (ochrana páteře, mechanika, područky)\\n- 🎯 **Jakákoliv další kategorie na míru**\\n\\nZadejte své požadavky nebo vyberte agenta výše pro spuštění interaktivního průvodce.`,
    timestamp: new Date().toISOString(),
  };
}

function getSuggestedPrompts(locale: string) {
  const isEn = locale === 'en';
  return isEn
    ? [
        {
          label: '🚗 Family SUV / Wagon under €25,000',
          text: 'I am looking for a reliable family car under €25,000 with a large trunk, 4x4 drive, and low fuel consumption.',
        },
        {
          label: '👟 Road running shoes for wide feet (2E)',
          text: 'I need road running shoes with good midsole cushioning and a wider 2E forefoot fit.',
        },
        {
          label: '☕ Automatic espresso & cappuccino machine',
          text: 'Recommend a quiet espresso machine with easy maintenance and high quality milk frother under €750.',
        },
        {
          label: '🪑 Ergonomic chair for full-day home office',
          text: 'Which office chair should I pick for 8+ hours of daily seating to prevent lower back pain?',
        },
      ]
    : [
        {
          label: '🚗 Rodinné SUV / kombi do 650 tis. Kč',
          text: 'Hledám spolehlivé rodinné auto do 650 000 Kč s velkým kufrem, pohonem 4x4 a nízkou spotřebou.',
        },
        {
          label: '👟 Běžecké boty na asfalt pro širší chodidlo',
          text: 'Potřebuji běžecké boty na silnici s dobrým tlumením mezipodešve a širším kopytem.',
        },
        {
          label: '☕ Automatický kávovar na espresso a cappuccino',
          text: 'Doporuč tichý kávovar s jednoduchou údržbou a kvalitním mléčným systémem do 18 000 Kč.',
        },
        {
          label: '🪑 Ergonomická židle pro celodenní home office',
          text: 'Jakou kancelářskou židli zvolit při 8+ hodinách sezení denně pro prevenci bolestí beder?',
        },
      ];
}'''

page = page.replace(old_greetings, new_greetings)
page = page.replace("const [messages, setMessages] = useState<AgentChatMessage[]>([INITIAL_GREETING]);", "const [messages, setMessages] = useState<AgentChatMessage[]>([]);")
page = page.replace("const activeProvider =", "const suggestedPrompts = getSuggestedPrompts(locale);\n  const activeProvider =")
page = page.replace("SUGGESTED_PROMPTS.map", "suggestedPrompts.map")

# Update useEffect to set initial greeting when locale changes if messages empty or single greeting
greeting_effect = '''  useEffect(() => {
    if (messages.length === 0 || (messages.length === 1 && messages[0].id === 'greeting-1')) {
      setMessages([getInitialGreeting(locale)]);
    }
  }, [locale]);'''

page = page.replace("const activeFactsCount =", greeting_effect + "\n\n  const activeFactsCount =")

with open('src/app/page.tsx', 'w') as f:
    f.write(page)
print("Updated page.tsx with dynamic i18n greetings and suggested prompts")
