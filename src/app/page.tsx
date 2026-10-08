'use client';
import { AgentMessageRenderer } from '@/components/AgentMessageRenderer';
import { APP_VERSION } from '@/lib/version';


import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AgentChatMessage } from '@/lib/agent/types';
import { RecommendedProductRankingItem, extractRecommendedProductsFromMessages } from '@/lib/agent/ranking-parser';
import { ToolExecutionBadge } from '@/components/ToolExecutionBadge';
import { Logo } from '@/components/Logo';
import { UserProfileCapsule } from '@/components/UserProfileCapsule';
import { HeaderEngineSwitcher } from '@/components/HeaderEngineSwitcher';
import { AIEngineSubscriptionModal } from '@/components/AIEngineSubscriptionModal';
import { UserRAGMemoryModal } from '@/components/UserRAGMemoryModal';
import { AgentCategoryLauncher } from '@/components/AgentCategoryLauncher';
import { DynamicAgentWizard } from '@/components/DynamicAgentWizard';
import { TypographySwitcherModal as ColorPaletteModal } from '@/components/TypographySwitcherModal';
import { UniversalAgentPromptModal } from '@/components/UniversalAgentPromptModal';
import { BuyMeACoffeeFloatingButton } from '@/components/BuyMeACoffeeFloatingButton';
import { BuyMeACoffeeModal } from '@/components/BuyMeACoffeeModal';
import { 
  UniversalAgentDefinition,
  forgeAgentPrompt
} from '@/lib/agent/universal-agent-schema';
import { AgentStorageService } from '@/lib/agent/agent-storage-service';
import { ChatStorageService } from '@/lib/agent/chat-storage-service';
import { MemoryStorageService } from '@/lib/agent/memory-storage-service';
import { PromptStorageService } from '@/lib/agent/prompt-storage-service';
import { useAuth } from '@/lib/auth/AuthContext';
import { 
  AIProviderId, 
  SUPPORTED_AI_PROVIDERS, 
  PersistentMemoryFact, 
  INITIAL_USER_FACTS,
  CompletedAssessmentRecord,
  INITIAL_ASSESSMENT_RECORDS
} from '@/lib/agent/engine-config';
import { useI18n } from '@/lib/i18n/I18nContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeModeSwitcher } from '@/components/ThemeModeSwitcher';
import { 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  Database, 
  MessageSquare,
  ArrowLeft,
  Compass,
  CheckCircle2,
  Sliders,
  Type,
  Lock,
  Key,
  ShieldCheck,
  Zap,
  Plus
} from 'lucide-react';

export type AppTab = 'wizard' | 'chat';

const getAgentInitialGreeting = (agent: UniversalAgentDefinition | null, isEn: boolean): AgentChatMessage => {
  if (!agent) {
    return {
      id: 'greeting-root',
      role: 'assistant',
      content: isEn
        ? `### Welcome to bAIright\n\nI am your independent AI shopping expert. Select an agent or type your requirements to get started.`
        : `### Vítejte v bAIright\n\nJsem váš nezávislý nákupní rádce. Vyberte si agenta nebo zadejte své požadavky pro zahájení.`,
      timestamp: new Date().toISOString(),
    };
  }

  let displayName = agent.name;
  if (displayName.toLowerCase().startsWith('specialist:')) {
    const topic = displayName.replace(/^specialist:\s*/i, '').trim();
    const capitalizedTopic = topic.charAt(0).toUpperCase() + topic.slice(1);
    displayName = isEn ? `${capitalizedTopic} Specialist Advisor` : `Specialista: ${capitalizedTopic}`;
  }

  return {
    id: `greeting-${agent.id}`,
    role: 'assistant',
    content: isEn
      ? `### ${displayName}\n\nI am your specialized AI advisor. Feel free to ask me anything regarding product selection, technical specifications, or model comparisons.`
      : `### ${displayName}\n\nJsem váš specializovaný AI nákupní rádce. Zeptejte se mě na cokoliv ohledně výběru, technických parametrů nebo porovnání modelů.`,
    timestamp: new Date().toISOString(),
  };
};

const isPromptDump = (content: string) => {
  return (
    content.includes('MANDATORY & BINDING USER REQUIREMENTS') ||
    content.includes('STRIKTNÍ A ZÁVAZNÉ POŽADAVKY UŽIVATELE') ||
    content.includes('You are an elite AI Product Strategist') ||
    content.includes('Jsi expertní nákupní poradce') ||
    content.includes('CRITICAL LANGUAGE DIRECTIVE') ||
    content.includes('REQUIRED RESPONSE FORMAT') ||
    content.includes('POŽADOVANÝ FORMÁT ODPOVĚDI')
  );
};

const isLegacyGenericGreeting = (content: string) => {
  return (
    content.includes('Cars & Family Vehicles') ||
    content.includes('Automobily & rodinné vozy') ||
    content.includes('YOUR UNIVERSAL AI SHOPPING ADVISOR') ||
    content.includes('Váš univerzální nákupní rádce') ||
    content.includes('Welcome to bAIright: Your Universal') ||
    content.includes('Any Custom Category on Demand')
  );
};

const getAgentQuickPrompts = (agent: UniversalAgentDefinition | null, isEn: boolean) => {
  const rerunAction = isEn
    ? { label: 'Re-run research', text: 'Please re-run the market research based on my active parameters and recommend 3 current top models.' }
    : { label: 'Provést průzkum znovu', text: 'Proveď prosím průzkum trhu znovu na základě mých aktuálních parametrů a doporuč 3 nejlepší modely.' };

  if (!agent) {
    return [
      rerunAction,
      ...(isEn ? [
        { label: 'Compare top 2 choices in detail', text: 'Please give me a side-by-side comparison of the top 2 recommendations: key differences, pros, and trade-offs.' },
        { label: 'Value for money verdict', text: 'Considering price and features, which option delivers the absolute best value for money?' },
        { label: 'Lower budget alternatives', text: 'Are there any alternative models at a lower price point that still meet my mandatory criteria?' },
      ] : [
        { label: 'Porovnej 2 nejlepší v detailu', text: 'Proveď přímé srovnání 2 nejlepších doporučení: hlavní rozdíly, klíčové výhody a kompromisy.' },
        { label: 'Nejlepší poměr cena / výkon', text: 'Když zvážíme cenu a nabízené vlastnosti, která volba představuje nejvýhodnější investici?' },
        { label: 'Levnější alternativy', text: 'Existují alternativní modely s nižší cenovkou, které stále splňují má nejdůležitější kritéria?' },
      ])
    ];
  }
  const name = (agent.name || '').toLowerCase();
  const cat = (agent.category || '').toLowerCase();
  const id = (agent.id || '').toLowerCase();

  // Cycling shoes
  if (name.includes('cycling') || cat.includes('cycling') || id.includes('cycling') || name.includes('tret') || cat.includes('tret')) {
    return [
      rerunAction,
      ...(isEn ? [
        { label: 'Compare top 2 models in detail', text: 'Please provide a head-to-head comparison of the top 2 recommended cycling shoes: stiffness, fit volume, closure security, and walking stability.' },
        { label: 'Cleat & pedal compatibility', text: 'Which pedal systems and cleat standards (Look Keo, Shimano SPD-SL, Speedplay) are directly compatible with these shoes?' },
        { label: 'Sizing & wide fit advice', text: 'How do these brands (Specialized, Shimano, Lake, Sidi) run in terms of width and EU sizing? Should I size up?' },
        { label: 'Alternative models under budget', text: 'Are there any great value alternatives that retain high stiffness and BOA dials at a lower price point?' },
      ] : [
        { label: 'Detailní porovnání 2 nejlepších modelů', text: 'Proveď přímé porovnání 2 nejlepších doporučených treter: tuhost podešve, objem v prstech, zapínání a stabilita při chůzi.' },
        { label: 'Kompatibilita kufrů a pedálů', text: 'Které pedálové systémy a kufry (Look Keo, Shimano SPD-SL, Speedplay) jsou s těmito tretrami přímo kompatibilní?' },
        { label: 'Doporučení k volbě velikosti a šířky', text: 'Jak sedí tyto značky z hlediska šířky kopyta a číslování? Mám brát o půl čísla větší velikost?' },
        { label: 'Cenově dostupnější alternativy', text: 'Existují alternativy s výborným poměrem cena/výkon, které si zachovávají karbonovou podrážku a BOA zapínání?' },
      ])
    ];
  }

  // Coffee machines
  if (name.includes('coffee') || cat.includes('coffee') || id.includes('coffee') || name.includes('káv') || cat.includes('káv')) {
    return [
      rerunAction,
      ...(isEn ? [
        { label: 'Compare top 2 machines in detail', text: 'Compare the top 2 recommended coffee machines in detail: grinder quality, milk texture, and daily cleaning effort.' },
        { label: 'Maintenance & descaling', text: 'What is the required maintenance and how easy is the milk system to clean on these models?' },
        { label: 'Espresso quality vs ease of use', text: 'Which machine produces the richest crema and espresso while being simple for everyday use?' },
        { label: 'Best value alternative', text: 'Is there a slightly cheaper model that still offers great espresso and automatic milk frothing?' },
      ] : [
        { label: 'Porovnání 2 nejlepších kávovarů', text: 'Porovnej 2 nejlepší doporučené kávovary v detailu: kvalita mlýnku, pěnění mléka a náročnost čištění.' },
        { label: 'Údržba a čištění mléčných cest', text: 'Jak složitá je každodenní údržba mléčného systému a odvápňování u těchto modelů?' },
        { label: 'Kvalita espressa vs jednoduchost', text: 'Který kávovar udělá nejhustší cremu a plnou chuť při maximální jednoduchosti obsluhy?' },
        { label: 'Dostupnější alternativa', text: 'Doporuč alternativní model s nižší cenou, který stále splňuje mé hlavní požadavky.' },
      ])
    ];
  }

  // Running shoes
  if (name.includes('run') || cat.includes('run') || id.includes('run') || name.includes('běh') || cat.includes('běh')) {
    return [
      rerunAction,
      ...(isEn ? [
        { label: 'Compare top 2 shoes in detail', text: 'Compare the top 2 shoes in detail: cushioning softness, drop, stability, and lifespan.' },
        { label: 'Knee & joint impact', text: 'How do these models help protect knees and joints during road running?' },
        { label: 'Expected mileage lifespan', text: 'What is the expected mileage before midsole degradation on each model?' },
        { label: 'Wide fit & sizing advice', text: 'Do these models offer a roomy toebox and how true to size are they?' },
      ] : [
        { label: 'Detailní porovnání 2 nejlepších bot', text: 'Porovnej 2 nejlepší boty v detailu: tlumení, drop, stabilita a celková životnost.' },
        { label: 'Ochrana kolen a kloubů', text: 'Jak tyto modely pomáhají redukovat nárazy na kolena a šlachy při běhu po asfaltu?' },
        { label: 'Očekávaná životnost (kilometry)', text: 'Kolik kilometrů vydrží mezipodešev a vzorek těchto bot před ztrátou tlumení?' },
        { label: 'Šířka kopyta a velikost', text: 'Mají tyto modely dostatek prostoru pro prsty a jak sedí velikostně?' },
      ])
    ];
  }

  // Generic for any custom agent
  return [
    rerunAction,
    ...(isEn ? [
      { label: 'Compare top 2 choices in detail', text: 'Please give me a side-by-side comparison of the top 2 recommendations: key differences, pros, and trade-offs.' },
      { label: 'Best durability & longevity', text: 'Which of the recommended options has the highest build quality and expected lifespan?' },
      { label: 'Value for money verdict', text: 'Considering price and features, which option delivers the absolute best value for money?' },
      { label: 'Lower budget alternatives', text: 'Are there any alternative models at a lower price point that still meet my mandatory criteria?' },
    ] : [
      { label: 'Porovnej 2 nejlepší v detailu', text: 'Proveď přímé srovnání 2 nejlepších doporučení: hlavní rozdíly, klíčové výhody a kompromisy.' },
      { label: 'Který model má nejdelší životnost?', text: 'Která z doporučených možností vyniká nejlepší kvalitou zpracování a spolehlivostí?' },
      { label: 'Nejlepší poměr cena / výkon', text: 'Když zvážíme cenu a nabízené vlastnosti, která volba představuje nejvýhodnější investici?' },
      { label: 'Levnější alternativy', text: 'Existují alternativní modely s nižší cenovkou, které stále splňují má nejdůležitější kritéria?' },
    ])
  ];
};

export default function Home() {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const isEn = locale === 'en';
  const [activeTab, setActiveTab] = useState<AppTab>('wizard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [sessionId, setSessionId] = useState<string>('');
  const [messages, setMessages] = useState<AgentChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Modals & Controls State
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [isPaletteModalOpen, setIsPaletteModalOpen] = useState(false);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [isGlobalCoffeeModalOpen, setIsGlobalCoffeeModalOpen] = useState(false);
  const [activeFontId, setActiveFontId] = useState<string>('space-grotesk');

  // Universal Agent & BYOK State
  const [selectedAgent, setSelectedAgent] = useState<UniversalAgentDefinition | null>(null);

  useEffect(() => {
    setMessages((prev) => {
      const cleaned = prev.filter((m) => !isLegacyGenericGreeting(m.content || '') && !isPromptDump(m.content || ''));
      if (cleaned.length !== prev.length) {
        return cleaned;
      }
      return prev;
    });
  }, [isEn, selectedAgent]);
  const [storedAgents, setStoredAgents] = useState<UniversalAgentDefinition[]>([]);
  const [wizardMode, setWizardMode] = useState<'launcher' | 'active_agent'>('launcher');
  const [launcherInitialTab, setLauncherInitialTab] = useState<'active' | 'purchased'>('active');

  const handleOpenPurchaseHistory = () => {
    setActiveTab('wizard');
    setSelectedAgent(null);
    setWizardMode('launcher');
    setLauncherInitialTab('purchased');
  };
  const [activeProviderId, setActiveProviderId] = useState<AIProviderId>('google_gemini');
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [userFacts, setUserFacts] = useState<PersistentMemoryFact[]>([]);
  const [assessments, setAssessments] = useState<CompletedAssessmentRecord[]>([]);
  const [demoRunsRemaining, setDemoRunsRemaining] = useState<number>(3);
  const [wizardInitialShowResult, setWizardInitialShowResult] = useState<boolean>(false);
  const [sidebarAnswers, setSidebarAnswers] = useState<Record<string, any>>({});
  const [isSidebarAddingParam, setIsSidebarAddingParam] = useState<boolean>(false);
  const [sidebarParamName, setSidebarParamName] = useState<string>('');
  const [sidebarParamValue, setSidebarParamValue] = useState<string>('');
  const [isSidebarSwitchingAgent, setIsSidebarSwitchingAgent] = useState<boolean>(false);

  const initialWizardStepIndex = useMemo(() => {
    if (!selectedAgent || typeof window === 'undefined') return 0;
    try {
      const stored = localStorage.getItem('bairight_agent_wizard_states');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed[selectedAgent.id]) {
          return parsed[selectedAgent.id].currentStepIndex || 0;
        }
      }
    } catch {}
    return 0;
  }, [selectedAgent]);

  const activeProvider = SUPPORTED_AI_PROVIDERS.find((p) => p.id === activeProviderId) || SUPPORTED_AI_PROVIDERS[0];
  const activeFactsCount = userFacts.filter((f) => f.isEnriched).length;

  const isAgentCompleted = (a: UniversalAgentDefinition | null): boolean => {
    if (!a) return false;
    if (typeof window !== 'undefined') {
      try {
        const storedStates = localStorage.getItem('bairight_agent_wizard_states');
        if (storedStates) {
          const parsed = JSON.parse(storedStates);
          const state = parsed[a.id];
          if (state) {
            if (state.isCompleted === true) return true;
            if (state.result && Array.isArray(state.result.recommendations) && state.result.recommendations.length > 0) return true;
            if (state.isCompleted === false) return false;
          }
        }
        const completedPrompt = PromptStorageService.getCompletedPromptByAgentId(a.id);
        if (completedPrompt) return true;
        const chatInitialized = localStorage.getItem(`bairight_chat_initialized_${a.id}`) === 'true';
        if (chatInitialized) return true;
        const chatMsgs = localStorage.getItem(`bairight_chat_messages_${a.id}`);
        if (chatMsgs) {
          const parsedMsgs = JSON.parse(chatMsgs);
          if (Array.isArray(parsedMsgs) && parsedMsgs.length > 0) return true;
        }
      } catch {}
    }
    return false;
  };

  const handleSelectAgent = (agent: UniversalAgentDefinition | null, forceShowResult?: boolean) => {
    setSelectedAgent(agent);
    setIsSidebarSwitchingAgent(false);
    setWizardMode(agent ? 'active_agent' : 'launcher');
    if (agent) {
      const isCompleted = forceShowResult !== undefined ? forceShowResult : isAgentCompleted(agent);
      setWizardInitialShowResult(isCompleted);
    } else {
      setWizardInitialShowResult(false);
    }
  };

  // Sync sidebar answers with stored wizard state when selectedAgent changes
  useEffect(() => {
    if (!selectedAgent || typeof window === 'undefined') {
      setSidebarAnswers({});
      return;
    }
    try {
      const stored = localStorage.getItem('bairight_agent_wizard_states');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed[selectedAgent.id]?.answers) {
          setSidebarAnswers(parsed[selectedAgent.id].answers);
          return;
        }
      }
    } catch {}
    if (selectedAgent.targetValues && Object.keys(selectedAgent.targetValues).length > 0) {
      setSidebarAnswers(selectedAgent.targetValues);
      return;
    }
    setSidebarAnswers({});
  }, [selectedAgent]);

  // Load per-agent chat messages from localStorage / cloud when selectedAgent changes
  useEffect(() => {
    let isCurrent = true;
    if (selectedAgent && typeof window !== "undefined") {
      ChatStorageService.loadMessages(selectedAgent.id, user?.id, selectedAgent.name).then((loaded) => {
        if (!isCurrent) return;
        if (loaded && loaded.length > 0) {
          const cleaned = loaded.filter(
            (m) => !isLegacyGenericGreeting(m.content || '') && !isPromptDump(m.content || '')
          );
          if (cleaned.length > 0) {
            setMessages(cleaned);
            return;
          }
        }
        setMessages([getAgentInitialGreeting(selectedAgent, isEn)]);
      });
    } else {
      setMessages([]);
    }
    return () => {
      isCurrent = false;
    };
  }, [selectedAgent?.id, user?.id, isEn]);

  // Persist chat messages whenever they update for an active agent
  useEffect(() => {
    if (selectedAgent && messages.length > 0 && typeof window !== "undefined") {
      void ChatStorageService.saveMessages(selectedAgent.id, messages, user?.id, selectedAgent.name);
    }
  }, [messages, selectedAgent?.id, user?.id]);
  const hasActiveSubscription = Boolean(
    apiKeys['google_gemini']?.trim() ||
    apiKeys['openai_gpt4o']?.trim() ||
    apiKeys['anthropic_claude']?.trim() ||
    (apiKeys[activeProviderId]?.trim())
  );

  // Load persisted font preference, theme, assessments, BYOK keys, saved agents & facts from localStorage
  useEffect(() => {
    // Force migration to Google Material Design 3
    localStorage.setItem('bairight_active_theme', 'google-material');
    document.documentElement.setAttribute('data-theme', 'google-material');
    document.documentElement.setAttribute('data-design-system', 'material-admin');
    document.body.classList.add('material-mode');

    const storedFont = localStorage.getItem('bairight_active_font') || 'inter-tight';
    setActiveFontId(storedFont);
    document.documentElement.setAttribute('data-font', storedFont);

    // 1. Clean legacy mock facts and load actual user facts
    const storedFacts = localStorage.getItem('bairight_user_facts');
    if (storedFacts) {
      try {
        const parsed = JSON.parse(storedFacts);
        if (Array.isArray(parsed)) {
          // Filter out legacy mock facts (fact-1, fact-2, fact-3, fact-4)
          const filtered = parsed.filter((f: any) => !['fact-1', 'fact-2', 'fact-3', 'fact-4'].includes(f.id));
          setUserFacts(filtered);
          localStorage.setItem('bairight_user_facts', JSON.stringify(filtered));
        } else {
          setUserFacts([]);
        }
      } catch (e) {
        console.error('Failed to parse stored facts:', e);
        setUserFacts([]);
      }
    } else {
      setUserFacts([]);
      localStorage.setItem('bairight_user_facts', JSON.stringify([]));
    }

    // 2. Clean legacy mock assessments
    const storedAssessments = localStorage.getItem('bairight_assessments');
    if (storedAssessments) {
      try {
        const parsed = JSON.parse(storedAssessments);
        if (Array.isArray(parsed)) {
          // Filter out legacy mock assessment-rec-1
          const filtered = parsed.filter((a: any) => a.id !== 'assessment-rec-1');
          setAssessments(filtered);
          localStorage.setItem('bairight_assessments', JSON.stringify(filtered));
        } else {
          setAssessments([]);
        }
      } catch (e) {
        console.error('Failed to parse stored assessments:', e);
        setAssessments([]);
      }
    } else {
      setAssessments([]);
      localStorage.setItem('bairight_assessments', JSON.stringify([]));
    }

    // 3. Load user's actual stored custom agents (strictly from account)
    const userStoredAgents = AgentStorageService.getAllAgents();
    setStoredAgents(userStoredAgents);
    if (selectedAgent && !userStoredAgents.some((a) => a.id === selectedAgent.id)) {
      setSelectedAgent(null);
    }

    const storedProvider = localStorage.getItem('bairight_active_provider');
    if (storedProvider) {
      setActiveProviderId(storedProvider as AIProviderId);
    }

    const storedKeys = localStorage.getItem('bairight_api_keys');
    if (storedKeys) {
      try {
        setApiKeys(JSON.parse(storedKeys));
      } catch (e) {
        console.error('Failed to parse stored API keys:', e);
      }
    }

    const sid = localStorage.getItem('bairight_session_id') || `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    localStorage.setItem('bairight_session_id', sid);
    setSessionId(sid);
  }, []);
  // Cloud sync for authenticated users (Supabase agents & memory facts)
  useEffect(() => {
    if (user?.id) {
      AgentStorageService.syncWithCloud(user.id).then((synced) => {
        if (synced && synced.length > 0) {
          setStoredAgents(synced);
        }
      });
      MemoryStorageService.syncWithCloud(user.id).then((syncedFacts) => {
        if (syncedFacts && syncedFacts.length > 0) {
          setUserFacts(syncedFacts);
        }
      });
    }
  }, [user?.id]);


  const handleSelectFont = (fontId: string) => {
    setActiveFontId(fontId);
    document.documentElement.setAttribute('data-font', fontId);
    localStorage.setItem('bairight_active_font', fontId);
  };

  const handleToggleFact = (factId: string) => {
    const updated = MemoryStorageService.toggleFact(factId, user?.id);
    setUserFacts(updated);
  };

  const handleAddFact = (
    label: string,
    value: string,
    category: 'biometrics' | 'medical' | 'preference' | 'history'
  ) => {
    const newFact: PersistentMemoryFact = {
      id: `fact-${Date.now()}`,
      label,
      value,
      category,
      source: 'Uživatelský záznam',
      updatedAt: new Date().toLocaleDateString('cs-CZ'),
      isEnriched: true,
    };
    const updated = MemoryStorageService.saveFact(newFact, user?.id);
    setUserFacts(updated);
  };

  const handleDeleteFact = (factId: string) => {
    const target = userFacts.find((f) => f.id === factId);
    const updated = MemoryStorageService.deleteFact(factId, target?.label || '', user?.id);
    setUserFacts(updated);
  };

  const handleDeleteAssessment = (assessmentId: string) => {
    setAssessments((prev) => {
      const updated = prev.filter((a) => a.id !== assessmentId);
      localStorage.setItem('bairight_assessments', JSON.stringify(updated));
      return updated;
    });
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleAddSidebarParam = () => {
    if (!sidebarParamName.trim() || !sidebarParamValue.trim() || !selectedAgent) return;
    const name = sidebarParamName.trim();
    const value = sidebarParamValue.trim();
    const existingCustom = Array.isArray(sidebarAnswers.customParameters)
      ? sidebarAnswers.customParameters
      : [];
    const newCustom = [...existingCustom, { id: `param-${Date.now()}`, name, value }];
    const updatedAnswers = { ...sidebarAnswers, customParameters: newCustom };
    setSidebarAnswers(updatedAnswers);
    setIsSidebarAddingParam(false);
    setSidebarParamName('');
    setSidebarParamValue('');

    // Persist to localStorage
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('bairight_agent_wizard_states');
        const parsed = stored ? JSON.parse(stored) : {};
        parsed[selectedAgent.id] = {
          ...(parsed[selectedAgent.id] || {}),
          answers: updatedAnswers,
        };
        localStorage.setItem('bairight_agent_wizard_states', JSON.stringify(parsed));
      } catch {}
    }

    // Re-forge prompt and update selectedAgent
    const enrichedFacts = Array.isArray(userFacts)
      ? userFacts.map((f: any) => ({ fact: f.fact || `${f.label || 'Poznámka'}: ${f.value || ''}`, category: f.category || 'preference' }))
      : [];
    const purchasedHistory = AgentStorageService.getPurchasedAgents().map((a) => ({
      name: a.name,
      category: a.category,
      targetValues: a.targetValues,
    }));
    const updatedPrompt = forgeAgentPrompt(selectedAgent, updatedAnswers, enrichedFacts, locale, purchasedHistory);
    const updatedAgent = { ...selectedAgent, systemPrompt: updatedPrompt };
    setSelectedAgent(updatedAgent);
    AgentStorageService.saveAgent(updatedAgent, user?.id);
    PromptStorageService.saveCompletedPrompt({
      agentId: selectedAgent.id,
      agentName: selectedAgent.name,
      category: selectedAgent.category,
      prompt: updatedPrompt,
      answersSummary: Object.entries(updatedAnswers)
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
        .join(' • '),
    });

    // Send direct instruction to chat
    const chatMsg = isEn
      ? `I updated my parameters with constraint: "${name}: ${value}". Please recalibrate and suggest 3 models adhering strictly to this requirement.`
      : `Aktualizoval jsem své zadání o parametr: "${name}: ${value}". Prosím přehodnoť svá doporučení a nabídni 3 modely, které tento požadavek striktně splňují.`;
    handleSendMessage(chatMsg);
  };

  const handleRemoveSidebarParam = (paramId: string) => {
    if (!selectedAgent) return;
    const existingCustom = Array.isArray(sidebarAnswers.customParameters)
      ? sidebarAnswers.customParameters
      : [];
    const updatedCustom = existingCustom.filter((p: any) => p.id !== paramId);
    const updatedAnswers = { ...sidebarAnswers, customParameters: updatedCustom };
    setSidebarAnswers(updatedAnswers);

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('bairight_agent_wizard_states');
        const parsed = stored ? JSON.parse(stored) : {};
        parsed[selectedAgent.id] = {
          ...(parsed[selectedAgent.id] || {}),
          answers: updatedAnswers,
        };
        localStorage.setItem('bairight_agent_wizard_states', JSON.stringify(parsed));
      } catch {}
    }

    const enrichedFacts = Array.isArray(userFacts)
      ? userFacts.map((f: any) => ({ fact: f.fact || `${f.label || 'Poznámka'}: ${f.value || ''}`, category: f.category || 'preference' }))
      : [];
    const purchasedHistory = AgentStorageService.getPurchasedAgents().map((a) => ({
      name: a.name,
      category: a.category,
      targetValues: a.targetValues,
    }));
    const updatedPrompt = forgeAgentPrompt(selectedAgent, updatedAnswers, enrichedFacts, locale, purchasedHistory);
    const updatedAgent = { ...selectedAgent, systemPrompt: updatedPrompt };
    setSelectedAgent(updatedAgent);
    AgentStorageService.saveAgent(updatedAgent, user?.id);
  };

  // Dynamic recommendations leaderboard (žebříček) for active agent
  // Dynamically parses the latest assistant recommendation from chat turns, or falls back to wizard states
  const dynamicLeaderboard = useMemo<RecommendedProductRankingItem[]>(() => {
    if (!selectedAgent) return [];

    const fromChat = extractRecommendedProductsFromMessages(messages);
    if (fromChat.length > 0) {
      return fromChat;
    }

    if (typeof window !== 'undefined') {
      try {
        const storedStates = localStorage.getItem('bairight_agent_wizard_states');
        if (storedStates) {
          const parsed = JSON.parse(storedStates);
          const recs = parsed[selectedAgent.id]?.result?.recommendations;
          if (Array.isArray(recs)) {
            const valid = recs
              .filter((r: any) => (r.model && r.model.trim()) || (r.brand && r.brand.trim()))
              .map((r: any, idx: number) => {
                const name = [r.brand, r.model].filter(Boolean).join(' ').trim();
                return {
                  id: `wizard-rec-${idx}`,
                  rank: idx + 1,
                  fullName: name,
                  matchScore: typeof r.matchScore === 'number' ? `${r.matchScore}%` : r.matchScore,
                };
              });
            if (valid.length > 0) return valid.slice(0, 3);
          }
        }
      } catch {}
    }

    const assessment = assessments.find((a) => a.missionId === selectedAgent.id);
    if (assessment && Array.isArray(assessment.recommendedModels)) {
      const valid = assessment.recommendedModels
        .filter((m: any) => (m.model && m.model.trim()) || (m.brand && m.brand.trim()))
        .map((m: any, idx: number) => {
          const name = [m.brand, m.model].filter(Boolean).join(' ').trim();
          return {
            id: m.id || `asmt-rec-${idx}`,
            rank: idx + 1,
            fullName: name,
            matchScore: typeof m.matchScore === 'number' ? `${m.matchScore}%` : m.matchScore,
          };
        });
      if (valid.length > 0) return valid.slice(0, 3);
    }

    return [];
  }, [selectedAgent?.id, messages, assessments]);

    const handleSendMessage = async (textToSend?: string, isFreshStart?: boolean) => {
    const message = textToSend || inputValue.trim();
    if (!message || isLoading) return;

    if (!textToSend) {
      setInputValue('');
    }

    const userMessage: AgentChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => {
      const cleanPrev = isFreshStart
        ? []
        : prev.filter((m) => !m.id.startsWith('greeting-'));
      return [...cleanPrev, userMessage];
    });
    setIsLoading(true);

    try {
      const cleanHistory = isFreshStart
        ? []
        : messages.filter((m) => !m.id.startsWith('greeting-'));

      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId || 'default-session',
          message,
          agent: selectedAgent,
          history: [...cleanHistory, userMessage].slice(-8),
          ragFacts: userFacts.filter((f) => f.isEnriched),
          providerId: activeProviderId,
          apiKey: apiKeys[activeProviderId],
          locale,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Došlo k chybě při spojení s AI konzultantem. Zkontrolujte prosím své připojení nebo API klíč a zkuste to znovu.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoHome = () => {
    setActiveTab('wizard');
    setWizardMode('launcher');
    setSelectedAgent(null);
    setWizardInitialShowResult(false);
    setIsSidebarSwitchingAgent(false);
  };

  const renderSidebarContent = () => (
    <>
    
            <div className="space-y-3">
              {/* Material 3 Inspector Header */}
              {selectedAgent && !isSidebarSwitchingAgent ? (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-[#f8fafc] border border-slate-200 shadow-xs space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#01579b] font-bold block">
                          {selectedAgent.category}
                        </span>
                        <h3 className="text-sm font-black text-[#263238] leading-tight mt-0.5">{selectedAgent.name}</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsSidebarSwitchingAgent(true)}
                        title={isEn ? "Switch active agent" : "Přepnout aktivního agenta"}
                        className="px-2 py-1 rounded-md bg-white hover:bg-slate-100 border border-slate-300 text-[#263238] text-[10px] font-mono font-bold tracking-wider uppercase transition-all cursor-pointer shadow-xs shrink-0"
                      >
                        {isEn ? 'Switch Agent' : 'Změnit agenta'}
                      </button>
                    </div>
                    <p className="text-xs text-[#546e7a] line-clamp-2 leading-relaxed">
                      {selectedAgent.description}
                    </p>
                  </div>

                  {/* Star Component: Dynamic Top 3 Recommendations Leaderboard (Žebříček) */}
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 border-t-2 border-t-[#0099cc] shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0099cc]" />
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#263238] font-bold">
                          {isEn ? 'Top 3 Recommendations' : 'Aktuální žebříček top 3'}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-[#e1f5fe] border border-[#b3e5fc] text-[#01579b] font-bold uppercase tracking-wider">
                        {isEn ? 'Live Sync' : 'Živý stav'}
                      </span>
                    </div>

                    {dynamicLeaderboard.length > 0 ? (
                      <div className="space-y-2">
                        {dynamicLeaderboard.map((item, idx) => {
                          const isTop = idx === 0;
                          const isSecond = idx === 1;
                          return (
                            <div
                              key={item.id || idx}
                              className="p-2.5 rounded-lg flex items-center justify-between gap-2 border bg-[#f8fafc] border-slate-200 shadow-xs transition-all"
                            >
                              <div className="min-w-0 flex items-center gap-2">
                                <span
                                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 ${
                                    isTop
                                      ? 'text-[#014377] bg-[#e1f5fe] border border-[#b3e5fc]'
                                      : 'text-[#263238] bg-slate-100 border border-slate-200'
                                  }`}
                                >
                                  #{idx + 1}
                                </span>
                                <span className="text-xs font-bold text-[#263238] truncate">
                                  {item.fullName}
                                </span>
                              </div>
                              {item.matchScore && (
                                <span
                                  className="text-[10px] font-mono px-1.5 py-0.5 rounded-md font-bold shrink-0 bg-[#e1f5fe] text-[#01579b] border border-[#b3e5fc]"
                                >
                                  {item.matchScore}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-2.5 text-center bg-[#f8fafc] rounded-lg border border-slate-200 px-2">
                        <p className="text-[11px] text-[#546e7a] italic leading-relaxed">
                          {isEn
                            ? 'Awaiting agent recommendations in chat...'
                            : 'Čekám na doporučení produktů agentem v chatu...'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Agent Parameters & Active Criteria Widget */}
                  <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#546e7a] font-bold">
                        {isEn ? 'Agent Parameters' : 'Parametry agenta'}
                      </span>
                      {!isSidebarAddingParam && (
                        <button
                          type="button"
                          onClick={() => setIsSidebarAddingParam(true)}
                          className="text-[10px] font-mono text-[#0099cc] hover:text-[#0277bd] font-bold cursor-pointer"
                        >
                          + {isEn ? 'Add' : 'Přidat'}
                        </button>
                      )}
                    </div>

                    {/* Inline Add Parameter Input */}
                    {isSidebarAddingParam && (
                      <div className="p-2.5 rounded-lg bg-[#f8fafc] border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-[#01579b] font-bold">
                            {isEn ? 'New Criterion (e.g. Budget)' : 'Nové kritérium (např. cena)'}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setIsSidebarAddingParam(false);
                              setSidebarParamName('');
                              setSidebarParamValue('');
                            }}
                            className="text-[10px] text-[#546e7a] hover:text-[#263238] cursor-pointer"
                          >
                            {isEn ? 'Cancel' : 'Zrušit'}
                          </button>
                        </div>

                        <div className="space-y-1.5">
                          <input
                            type="text"
                            value={sidebarParamName}
                            onChange={(e) => setSidebarParamName(e.target.value)}
                            placeholder={isEn ? 'Criterion (e.g. Budget)' : 'Kritérium (např. Cena)'}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-[#263238] placeholder-slate-400 outline-none"
                          />
                          <input
                            type="text"
                            value={sidebarParamValue}
                            onChange={(e) => setSidebarParamValue(e.target.value)}
                            placeholder={isEn ? 'Value (e.g. max $250)' : 'Hodnota (např. max 5 000 Kč)'}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-[#263238] placeholder-slate-400 outline-none"
                          />
                        </div>

                        <button
                          type="button"
                          disabled={!sidebarParamName.trim() || !sidebarParamValue.trim()}
                          onClick={handleAddSidebarParam}
                          className="w-full py-1.5 rounded-lg bg-[#0099cc] hover:bg-[#0088b8] text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                        >
                          {isEn ? 'Save & Send to Chat' : 'Uložit a odeslat do chatu'}
                        </button>
                      </div>
                    )}

                    {/* List of Custom & Active Parameters */}
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {/* Custom Parameters */}
                      {Array.isArray(sidebarAnswers.customParameters) && sidebarAnswers.customParameters.map((cp: any) => (
                        <div
                          key={cp.id}
                          className="px-2.5 py-1.5 rounded-lg bg-[#e1f5fe] border border-[#b3e5fc] flex items-center justify-between text-xs gap-1.5"
                        >
                          <div className="min-w-0">
                            <span className="text-[10px] font-mono text-[#01579b] font-bold block truncate">{cp.name}</span>
                            <span className="text-[#263238] font-bold block truncate">{cp.value}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveSidebarParam(cp.id)}
                            className="text-slate-400 hover:text-red-400 text-xs font-mono p-1 cursor-pointer shrink-0"
                            title={isEn ? 'Remove' : 'Odebrat'}
                          >
                            ×
                          </button>
                        </div>
                      ))}

                      {/* Standard Questions Answers Summary */}
                      {selectedAgent.questions.map((q) => {
                        const val = sidebarAnswers[q.id];
                        if (val === undefined || val === null || val === '' || val === '__SKIP__') return null;
                        let displayVal = String(val);
                        if (Array.isArray(val)) {
                          if (val.length === 0 || (val.length === 1 && val[0] === '__SKIP__')) return null;
                          displayVal = val.map((v) => q.options?.find((o) => o.value === v)?.label || String(v)).join(', ');
                        } else if (typeof val === 'object') {
                          displayVal = Object.entries(val).map(([k, v]) => `${k}: ${v}`).join('; ');
                        } else if (q.options) {
                          const opt = q.options.find((o) => o.value === val);
                          if (opt?.label) displayVal = opt.label;
                        }
                        return (
                          <div
                            key={q.id}
                            className="px-2.5 py-1.5 rounded-lg bg-[#f8fafc] border border-slate-200 text-xs"
                          >
                            <span className="text-[10px] font-mono text-[#01579b] font-bold block truncate">{q.title}</span>
                            <span className="text-[#263238] font-bold block truncate">{displayVal}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#01579b] font-bold block">
                        {isEn ? 'Switch Agent' : 'Změna agenta'}
                      </span>
                      <h3 className="text-xs font-bold text-[#263238] block mt-0.5">
                        {isEn ? 'Saved agents in your account:' : 'Uložení agenti na vašem účtu:'}
                      </h3>
                    </div>
                    {selectedAgent && (
                      <button
                        type="button"
                        onClick={() => setIsSidebarSwitchingAgent(false)}
                        className="px-2.5 py-1 rounded-md bg-[#e1f5fe] hover:bg-[#b3e5fc] border border-[#b3e5fc] text-[#01579b] text-[10px] font-mono font-bold tracking-wider uppercase transition-all cursor-pointer shadow-xs shrink-0"
                        title={isEn ? "Return to active chat" : "Zpět do aktivního chatu"}
                      >
                        {isEn ? '← Back to Chat' : '← Zpět do chatu'}
                      </button>
                    )}
                  </div>
                  {storedAgents.length > 0 ? (
                    <div className="space-y-1.5">
                      {storedAgents.map((ag) => {
                        const isActive = selectedAgent?.id === ag.id;
                        return (
                          <button
                            key={ag.id}
                            onClick={() => {
                              handleSelectAgent(ag);
                              setIsSidebarSwitchingAgent(false);
                            }}
                            className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between gap-2.5 text-xs transition-all cursor-pointer border ${
                              isActive
                                ? 'bg-[#e1f5fe] border-[#0099cc] shadow-xs'
                                : 'bg-[#f8fafc] hover:bg-slate-100 border-slate-200 shadow-xs'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className={`font-bold truncate block ${isActive ? 'text-[#01579b]' : 'text-[#263238]'}`}>
                                  {ag.name}
                                </span>
                                {isActive && (
                                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#0099cc] text-white font-bold shrink-0 uppercase tracking-wider">
                                    {isEn ? 'Active' : 'Aktivní'}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] font-mono text-[#546e7a] truncate block mt-0.5">
                                {ag.category}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-4 px-2 space-y-2.5 bg-[#f8fafc] rounded-xl border border-slate-200">
                      <p className="text-[11px] text-[#546e7a] leading-relaxed">
                        {isEn ? 'No shopping agents saved in your account yet.' : 'Na svém účtu zatím nemáte uloženého žádného nákupního agenta.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('wizard');
                          setWizardMode('launcher');
                          setIsSidebarSwitchingAgent(false);
                        }}
                        className="w-full py-1.5 px-3 rounded-lg bg-[#0099cc] hover:bg-[#0088b8] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                      >
                        {isEn ? 'Create agent in wizard' : 'Vytvořit agenta v průvodci'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Unified System Context & Status Panel (Secondary / Low-contrast Footer) */}
            <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2 text-[#546e7a]">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#546e7a] border-b border-slate-200 pb-1 font-bold">
                <span>{isEn ? 'System Status' : 'Stav systému'}</span>
                <span className={`flex items-center gap-1 font-bold ${hasActiveSubscription ? 'text-emerald-700' : 'text-amber-700'}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  <span>{hasActiveSubscription ? (isEn ? 'Online' : 'Připojeno') : 'Offline'}</span>
                </span>
              </div>

              {/* Model & RAG summary */}
              <div className="flex items-center justify-between text-[10px] text-[#546e7a]">
                <span className="truncate font-semibold text-[#263238]">{activeProvider.name}</span>
                <button
                  type="button"
                  onClick={() => setIsSubscriptionModalOpen(true)}
                  className="text-[#0099cc] font-bold hover:underline cursor-pointer font-mono"
                >
                  {isEn ? 'Change' : 'Změnit'}
                </button>
              </div>

              <div className="flex items-center justify-between text-[10px] text-[#546e7a] pt-1 border-t border-slate-200">
                <span>{isEn ? `RAG Facts: ${userFacts.length}` : `RAG Fakta: ${userFacts.length}`}</span>
                <button
                  type="button"
                  onClick={() => setIsMemoryModalOpen(true)}
                  className="text-[#0099cc] font-bold hover:underline cursor-pointer font-mono"
                >
                  {isEn ? 'Memory' : 'Paměť'}
                </button>
              </div>

              {/* Selection Wizard Action (Sleek Low-contrast Ghost Button) */}
              <div className="pt-1.5">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedAgent) {
                      const isCompleted = isAgentCompleted(selectedAgent);
                      handleSelectAgent(selectedAgent, isCompleted);
                      setWizardInitialShowResult(isCompleted);
                      setWizardMode('active_agent');
                    } else {
                      setWizardMode('launcher');
                    }
                    setActiveTab('wizard');
                  }}
                  className="w-full py-1.5 px-3 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-[#263238] text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <span>{isEn ? 'Open Selection Wizard' : 'Otevřít průvodce výběrem'}</span>
                </button>
              </div>
            </div>
    </>
  );

  return (
    <div className="flex h-screen flex-col bg-[#f4f6f8] text-[#263238] overflow-hidden font-sans">
      {/* Top Navbar: Clean Executive Header */}
      <header className="h-14 sm:h-16 border-b border-slate-200/80 bg-white px-3 sm:px-8 flex items-center justify-between shrink-0 z-20 shadow-xs relative">
        {/* Left: Brand Logo & Version */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Logo size="md" onClick={handleGoHome} />
          <span className="hidden xs:inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#e1f5fe] border border-[#b3e5fc] text-[#01579b]">
            {APP_VERSION}
          </span>
        </div>

        {/* Center: Centered Mode Switcher (Contextual — only visible when inside an active agent, Result Hub or Chat) */}
        {(wizardMode === "active_agent" || activeTab === "chat" || selectedAgent !== null) && (
          <div className="segmented-tabs-wrapper hidden sm:flex items-center justify-center absolute left-1/2 -translate-x-1/2 pointer-events-auto">
          <div className="segmented-tabs-container flex items-center gap-1.5 p-1 rounded-xl bg-[#f4f6f8] border border-slate-200 text-xs font-sans">
            <button
              onClick={() => {
                const activeOrStored = selectedAgent || (typeof window !== 'undefined' ? AgentStorageService.getAllAgents()[0] : null);
                if (activeOrStored) {
                  const isCompleted = isAgentCompleted(activeOrStored);
                  handleSelectAgent(activeOrStored, isCompleted);
                  setWizardInitialShowResult(isCompleted);
                  setWizardMode('active_agent');
                }
                setActiveTab('wizard');
              }}
              style={activeTab === "wizard" ? { backgroundColor: "#0099cc", color: "#ffffff" } : undefined}
              className={`segmented-tab-btn px-4 py-1.5 rounded-lg transition-all cursor-pointer font-semibold ${
                activeTab === "wizard"
                  ? "segmented-tab-active !bg-[#0099cc] !text-white shadow-xs"
                  : "text-[#607d8b] hover:text-[#263238]"
              }`}
            >
              {t.header.wizardTab}
            </button>
            <button
              onClick={() => {
                setActiveTab('chat');
                setIsSidebarSwitchingAgent(false);
                const userStoredAgents = AgentStorageService.getAllAgents();
                setStoredAgents(userStoredAgents);
                if (selectedAgent && !userStoredAgents.some((a) => a.id === selectedAgent.id)) {
                  setSelectedAgent(null);
                }
              }}
              style={activeTab === "chat" ? { backgroundColor: "#0099cc", color: "#ffffff" } : undefined}
              className={`segmented-tab-btn px-4 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 font-semibold ${
                activeTab === "chat"
                  ? "segmented-tab-active !bg-[#0099cc] !text-white shadow-xs"
                  : "text-[#607d8b] hover:text-[#263238]"
              }`}
            >
              <span>{t.header.chatTab}</span>
              {selectedAgent && !isSidebarSwitchingAgent ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#e1f5fe] text-[#01579b] border border-[#b3e5fc] font-sans font-bold hidden md:inline">
                  {selectedAgent.name}
                </span>
              ) : null}
            </button>
          </div>
        </div>
        )}

        {/* Right: User Profile & Customization Capsules */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <HeaderEngineSwitcher
            activeProviderId={activeProviderId}
            onSelectProvider={(pId: AIProviderId) => {
              setActiveProviderId(pId);
              localStorage.setItem("bairight_active_provider", pId);
            }}
            onOpenVaultModal={() => setIsSubscriptionModalOpen(true)}
            currentApiKeys={apiKeys}
          />

          <ThemeModeSwitcher />
          <LanguageSwitcher />
          <UserProfileCapsule
            userName="Jan Mynář"
            demoRunsRemaining={demoRunsRemaining}
            activeProvider={activeProvider}
            onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
            onOpenMemoryModal={() => setIsMemoryModalOpen(true)}
            onOpenPurchaseHistory={handleOpenPurchaseHistory}
          />
        </div>
      </header>

      {/* Main Workspace: Wizard or Chat */}
      {activeTab === 'wizard' && (
        <div className="flex-1 overflow-y-auto bg-[var(--background)] p-3 sm:p-6">
          {wizardMode === 'launcher' || !selectedAgent ? (
            <AgentCategoryLauncher
              userName="Jan Mynář"
              currentAgent={selectedAgent}
              initialTab={launcherInitialTab}
              agents={storedAgents}
              onAgentsChange={setStoredAgents}
              onSelectAgent={(agent, initialShowResult) => {
                const showResult = initialShowResult !== undefined ? initialShowResult : isAgentCompleted(agent);
                handleSelectAgent(agent, showResult);
                setWizardMode('active_agent');
              }}
              activeProviderId={activeProviderId}
              currentApiKeys={apiKeys}
            />
          ) : (
            <DynamicAgentWizard
              key={selectedAgent.id}
              agent={selectedAgent}
              onBackToLauncher={() => setWizardMode('launcher')}
              onStepChange={(stepIdx, stepAnswers) => {
                setSidebarAnswers(stepAnswers);
              }}
              onOpenChat={(customPrompt) => {
                setActiveTab('chat');
                if (selectedAgent) {
                  // Ingest live compiled prompt into agent system instructions
                  if (customPrompt) {
                    selectedAgent.systemPrompt = customPrompt;
                  }
                  // Only send the initial recommendation prompt ONCE — the first time
                  // the chat is opened after wizard completion.
                  const chatInitKey = `bairight_chat_initialized_${selectedAgent.id}`;
                  const alreadyInitialized = typeof window !== 'undefined'
                    ? localStorage.getItem(chatInitKey) === 'true'
                    : false;

                  let hasExistingChat = alreadyInitialized;
                  if (!hasExistingChat && typeof window !== 'undefined') {
                    try {
                      const storedMessages = localStorage.getItem(`bairight_chat_messages_${selectedAgent.id}`);
                      if (storedMessages) {
                        const parsed = JSON.parse(storedMessages);
                        if (Array.isArray(parsed) && parsed.some((m: any) => m.role === 'user')) {
                          hasExistingChat = true;
                        }
                      }
                    } catch {}
                  }

                  if (!hasExistingChat) {
                    if (typeof window !== 'undefined') {
                      localStorage.setItem(chatInitKey, 'true');
                    }
                    const userFacingPrompt = locale === 'en'
                      ? 'Please recommend your top 3 specific product choices based on my parameters from the wizard.'
                      : 'Doporuč mi prosím své 3 konkrétní doporučené produkty na základě zadaných parametrů z průvodce.';
                    handleSendMessage(userFacingPrompt, true);
                  }
                }
              }}
              onResetWizard={() => {
                if (selectedAgent && typeof window !== 'undefined') {
                  localStorage.removeItem(`bairight_chat_initialized_${selectedAgent.id}`);
                  localStorage.removeItem(`bairight_chat_messages_${selectedAgent.id}`);
                  setMessages([]);
                }
              }}
              activeProviderId={activeProviderId}
              currentApiKeys={apiKeys}
              userFacts={userFacts}
              onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
              initialSavedAnswers={sidebarAnswers && Object.keys(sidebarAnswers).length > 0 ? sidebarAnswers : selectedAgent?.targetValues}
              onEditWizard={() => setWizardInitialShowResult(false)}
              initialShowResult={wizardInitialShowResult}
              initialStepIndex={initialWizardStepIndex}
              locale={locale}
              onAssessmentCompleted={(answers, evalRes, completedPrompt) => {
                // Mark wizard as completed and show results view
                setWizardInitialShowResult(true);
                setSidebarAnswers(answers);
                if (typeof window !== 'undefined' && selectedAgent) {
                  try {
                    const storedStates = localStorage.getItem('bairight_agent_wizard_states');
                    const parsed = storedStates ? JSON.parse(storedStates) : {};
                    parsed[selectedAgent.id] = {
                      ...(parsed[selectedAgent.id] || {}),
                      answers,
                      result: evalRes,
                      isCompleted: true,
                    };
                    localStorage.setItem('bairight_agent_wizard_states', JSON.stringify(parsed));
                  } catch (e) {}
                }
                if (selectedAgent) {
                  const updatedAgent = {
                    ...selectedAgent,
                    targetValues: answers,
                    systemPrompt: completedPrompt || selectedAgent.systemPrompt,
                  };
                  setSelectedAgent(updatedAgent);
                  AgentStorageService.saveAgent(updatedAgent, user?.id);
                }
                const now = new Date();
                const dateFormatted = `${now.toLocaleDateString('cs-CZ')}, ${now.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}`;
                const newRecord: CompletedAssessmentRecord = {
                  id: `universal-rec-${Date.now()}`,
                  missionId: selectedAgent.id,
                  missionName: selectedAgent.name,
                  dateFormatted,
                  timestamp: now.toISOString(),
                  doctorAgentName: `${selectedAgent.name} v${selectedAgent.version || '1.0'}`,
                  diagnosisSummary: `Doporučení pro kategorii ${selectedAgent.category}: ${(evalRes?.recommendations || []).map((r: any) => r.model).join(', ')}`,
                  keyParameters: answers,
                  recommendedModels: (evalRes?.recommendations || []).map((r: any, idx: number) => ({
                    id: `rec-${idx}`,
                    brand: r.brand,
                    model: r.model,
                    badge: `Shoda ${r.matchScore}%`,
                    matchScore: r.matchScore,
                    priceCzk: 0,
                    rationale: r.reasoning,
                  })),
                  clinicalReport: evalRes?.summaryAssessment || 'Doporučení úspěšně vygenerováno expertním agentem.',
                  status: 'active_prescription',
                  completedPrompt,
                };
                setAssessments((prev) => {
                  const updated = [newRecord, ...prev];
                  localStorage.setItem('bairight_assessments', JSON.stringify(updated));
                  return updated;
                });
              }}
            />
          )}
        </div>
      )}

      {/* Universal Consultative Chat Tab — Gated by Subscription (BYOK) */}
      
{activeTab === 'chat' && (
        <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
          {/* Left: Agent Selection & Context Sidebar */}
          
          {/* Mobile Top Navigation & Filter Bar for Active Agent */}
          <div className="lg:hidden flex items-center justify-between px-3.5 py-2 bg-white border-b border-slate-200 shrink-0 z-10">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
              <span className="font-bold text-[#263238] text-xs truncate max-w-[150px]">
                {selectedAgent?.name || (isEn ? "Universal Shopping Agent" : "Univerzální nákupní agent")}
              </span>
              {dynamicLeaderboard.length > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 truncate max-w-[120px]">
                  #1 {dynamicLeaderboard[0].fullName.split(" ")[0]}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-[#e1f5fe] border border-[#b3e5fc] text-[#01579b] text-[11px] font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
            >
              <span>{isEn ? "Parameters & Top 3" : "Parametry & Top 3"}</span>
              <span className="text-[9px]">▾</span>
            </button>
          </div>

          {/* Mobile Parameters & Leaderboard Bottom Sheet */}
          {isMobileSidebarOpen && (
            <div 
              role="dialog"
              aria-modal="true"
              className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={(e) => {
                if (e.target === e.currentTarget) setIsMobileSidebarOpen(false);
              }}
            >
              <div className="bg-white border-t border-slate-200 rounded-t-2xl max-h-[85vh] flex flex-col shadow-2xl safe-area-bottom">
                <div className="p-3.5 border-b border-slate-200 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span className="text-xs font-mono font-bold text-[#01579b] uppercase tracking-wider">
                      {isEn ? "Agent Parameters & Leaderboard" : "Parametry agenta & Žebříček"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-[#263238] text-xs font-mono font-bold cursor-pointer shadow-xs"
                  >
                    {isEn ? "Close" : "Zavřít"} ✕
                  </button>
                </div>
                <div className="p-4 overflow-y-auto space-y-4">
                  {renderSidebarContent()}
                </div>
              </div>
            </div>
          )}

          {/* Desktop Left: Agent Selection & Context Sidebar */}
          <aside className="hidden lg:block w-80 border-r border-slate-200 bg-white text-[#263238] p-4 space-y-4 overflow-y-auto shrink-0 shadow-xs">
            {renderSidebarContent()}
          </aside>


          {/* Right: Conversational Stream or Subscription Lock View */}
          <main className="flex-1 flex flex-col justify-between overflow-hidden bg-[#f4f6f8] text-[#263238]">
            {!hasActiveSubscription ? (
              /* Subscription Paywall Screen */
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-200 overflow-y-auto">


                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 font-mono text-[11px] font-bold">
                    <span>{isEn ? 'Agent Discussion • Requires BYOK Model' : 'Diskuse s agentem • Vyžaduje vlastní model (BYOK)'}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                    {isEn ? 'Connect your AI subscription for live discussion' : 'Propojte své AI předplatné pro živou diskusi'}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
                    {isEn ? 'Live conversation and tuning runs directly through your own AI subscription (Google Gemini, OpenAI ChatGPT, Anthropic Claude). The agent utilizes your RAG memory and your data stays secure.' : 'Živá konverzace a ladění probíhá přímo přes vaše vlastní AI předplatné (Google Gemini, OpenAI ChatGPT, Anthropic Claude). Agent využije vaši RAG paměť a vaše data zůstanou v bezpečí.'}
                  </p>
                </div>

                {/* Current Agent Info Card */}
                <div className="w-full p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-left flex items-center gap-3 shadow-md">

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white truncate">
                        {selectedAgent?.name || 'Luke (Běžecká & zdravotní obuv)'}
                      </h4>
                      <span className="text-[10px] font-mono text-cyan-400 font-bold px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/30">
                        {selectedAgent?.category || 'Sport & Lifestyle'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                      {selectedAgent?.description || 'Biomechanický nákupčí obuvi a konzultant'}
                    </p>
                  </div>
                </div>

                {/* Benefits Badges */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full text-left">
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    
                    <span className="text-xs font-bold text-slate-200 block">{isEn ? 'Own Tokens' : 'Vlastní tokeny'}</span>
                    <span className="text-[10px] text-slate-500 leading-tight">{isEn ? 'Unlimited discussion without token or credit limits.' : 'Neomezená diskuse bez kreditových stropů.'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    
                    <span className="text-xs font-bold text-slate-200 block">{isEn ? 'RAG Context' : 'RAG kontext'}</span>
                    <span className="text-[10px] text-slate-500 leading-tight">{isEn ? 'Agent knows your stored biometric & preference facts.' : 'Agent zná vaše uložená biometrická fakta.'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    
                    <span className="text-xs font-bold text-slate-200 block">{isEn ? '100% Privacy' : '100% soukromí'}</span>
                    <span className="text-[10px] text-slate-500 leading-tight">{isEn ? 'API keys are stored exclusively in your browser.' : 'Klíč se ukládá pouze ve vašem prohlížeči.'}</span>
                  </div>
                </div>

                {/* CTA Actions */}
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full pt-1">
                  <button
                    onClick={() => setIsSubscriptionModalOpen(true)}
                    className="w-full sm:flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:brightness-110 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-950/60 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span>{isEn ? 'Connect Account / BYOK' : 'Propojit vlastní model / předplatné'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setWizardMode(selectedAgent ? 'active_agent' : 'launcher');
                      setActiveTab('wizard');
                    }}
                    className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-mono font-medium transition-all cursor-pointer"
                  >
                    {isEn ? 'Open Shopping Wizard' : 'Otevřít průvodce nákupem'}
                  </button>
                </div>
              </div>
            ) : (
              /* Unlocked Chat Stream */
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                {/* Unified Material Header Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-white border border-slate-200 text-xs shadow-xs mb-2">
                  <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#e1f5fe] text-[#01579b] border border-[#b3e5fc] font-bold text-[11px] font-mono shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0099cc]" />
                      <span>{isEn ? 'Live Discussion' : 'Živá diskuse'}</span>
                    </span>
                    <span className="text-[#263238] font-bold truncate">
                      {selectedAgent?.name || (isEn ? 'General Shopping Advisor' : 'Všeobecný nákupní poradce')}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-[#546e7a] border border-slate-200 shrink-0 font-semibold">
                      {activeProvider.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {selectedAgent && (
                      <button
                        type="button"
                        onClick={() => {
                          handleSelectAgent(selectedAgent, true);
                          setWizardInitialShowResult(true);
                          setWizardMode('active_agent');
                          setActiveTab('wizard');
                        }}
                        className="text-xs font-mono text-[#01579b] font-bold px-2.5 py-1 rounded-md bg-[#e1f5fe] hover:bg-[#b3e5fc] border border-[#b3e5fc] transition-colors cursor-pointer"
                        title={isEn ? 'View agent deliverable & calibrated parameters' : 'Zobrazit výsledky agenta & zkalibrované parametry'}
                      >
                        {isEn ? 'Agent Hub & Results →' : 'Výsledky & Agent Hub →'}
                      </button>
                    )}
                    {dynamicLeaderboard.length > 0 && (
                      <span className="hidden sm:inline-block text-[11px] font-mono text-[#01579b] font-semibold bg-[#e1f5fe] px-2 py-0.5 rounded">
                        {isEn ? `${dynamicLeaderboard.length} recommendations live` : `${dynamicLeaderboard.length} ověřená doporučení`}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsSubscriptionModalOpen(true)}
                      className="text-xs font-mono text-[#0099cc] font-bold hover:underline cursor-pointer"
                    >
                      {isEn ? 'Switch Model' : 'Změnit model'}
                    </button>
                  </div>
                </div>

                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500 space-y-2">
                    <div className="text-xs font-mono tracking-wider uppercase text-cyan-400/80">
                      {selectedAgent
                        ? (isEn ? "Discussion with " + selectedAgent.name + " active" : "Diskuse s agentem " + selectedAgent.name + " aktivní")
                        : (isEn ? 'Universal Shopping Consultant ready' : 'Univerzální nákupní rádce připraven')}
                    </div>
                    <p className="text-xs text-slate-400 max-w-md">
                      {isEn
                        ? 'Ask any product question below or select a suggested action to begin.'
                        : 'Zadejte svůj nákupní dotaz níže nebo zvolte jednu z doporučených akcí.'}
                    </p>
                  </div>
                )}

                {messages.map((msg, msgIdx) => {
                  const isUser = msg.role === 'user';
                  const isDuplicateUser = isUser && msgIdx > 0 && messages[msgIdx - 1]?.role === 'user' && messages[msgIdx - 1]?.content === msg.content;
                  if (isDuplicateUser) return null;
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 max-w-4xl ${isUser ? 'ml-auto justify-end' : 'mr-auto justify-start'}`}
                    >


                      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[85%]`}>
                        <div
                          className={`p-5 sm:p-6 rounded-xl text-sm leading-relaxed shadow-xs ${
                            isUser
                              ? 'bg-[#0099cc] text-white rounded-2xl rounded-tr-sm shadow-xs px-5 py-4'
                              : 'bg-white border border-slate-200 text-[#263238] rounded-2xl rounded-tl-sm shadow-xs p-6'
                          }`}
                        >
                          {!isUser && activeFactsCount > 0 && (
                            <div 
                              onClick={() => setIsMemoryModalOpen(true)}
                              className="flex items-center gap-1.5 text-[10px] font-mono text-[#01579b] bg-[#e1f5fe] border border-[#b3e5fc] px-2.5 py-1 rounded-md font-bold w-fit mb-3 shadow-xs hover:bg-[#b3e5fc] cursor-pointer transition-all"
                              title="Klikněte pro zobrazení a správu RAG faktů z databáze"
                            >
                              <span>{isEn ? `RAG Memory: Enriched with ${activeFactsCount} preference facts` : `RAG paměť: Obohaceno o ${activeFactsCount} preferenčních faktů`}</span>
                            </div>
                          )}

                          {!isUser ? (
                            <AgentMessageRenderer content={msg.content} isEn={isEn} />
                          ) : isPromptDump(msg.content) ? (
                            <div className="flex flex-col gap-1 text-white">
                              <span className="font-semibold text-sm">
                                {isEn 
                                  ? 'Please recommend your top 3 specific product choices based on my parameters from the wizard.' 
                                  : 'Doporuč mi prosím 3 nejlepší produkty na základě mých parametrů z průvodce.'}
                              </span>
                              <span className="text-[11px] font-mono text-teal-100">
                                {isEn ? 'All parameters and criteria have been loaded into agent context' : 'Všechny parametry a kritéria byla úspěšně načtena do kontextu agenta'}
                              </span>
                            </div>
                          ) : (
                            <div className="prose prose-invert prose-sm max-w-none space-y-3">
                              {msg.content.split('\\n\\n').map((paragraph, idx) => (
                                <p key={idx} className="whitespace-pre-line">{paragraph}</p>
                              ))}
                            </div>
                          )}

                          {/* Tool Call Badges */}
                          {msg.toolCalls && msg.toolCalls.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                                {isEn ? 'Agent Executed Tools' : 'Provedené nástroje agenta'}
                              </span>
                              {msg.toolCalls.map((tc) => (
                                <ToolExecutionBadge
                                  key={tc.id}
                                  toolName={tc.toolName}
                                  status={tc.status}
                                  args={tc.args}
                                />
                              ))}
                            </div>
                          )}
                        </div>

                        <span className="text-[10px] text-slate-500 mt-1 px-1">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>


                    </div>
                  );
                })}

                {isLoading && (
                  <div className="flex gap-3 items-center text-xs text-slate-400">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
                    <div className="flex items-center gap-2 p-3 bg-slate-900 border border-slate-800 rounded-xl">
                      <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      <span className="ml-2 font-medium">{isEn ? 'Agent is thinking...' : 'Agent přemýšlí...'}</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Quick Prompts & Chat Input Form or Locked Input Footer */}
            {!hasActiveSubscription ? (
              <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/90 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>{isEn ? 'Connect your AI subscription to send messages to the agent.' : 'Pro odesílání zpráv do diskuse s agentem nejprve propojte své AI předplatné.'}</span>
                </div>
                <button
                  onClick={() => setIsSubscriptionModalOpen(true)}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-300 hover:text-white text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>{isEn ? 'Connect model' : 'Propojit model'}</span>
                </button>
              </div>
            ) : (
              <div className="p-4 sm:p-5 border-t border-slate-200 bg-white shadow-xs">
                {(() => {
                  const quickPrompts = getAgentQuickPrompts(selectedAgent, isEn);
                  if (quickPrompts.length === 0) return null;
                  return (
                    <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-2 no-scrollbar">
                      <span className="text-[11px] font-bold text-[#546e7a] shrink-0 flex items-center gap-1 uppercase tracking-wider">
                        <span>{isEn ? 'Suggested actions:' : 'Doporučené akce:'}</span>
                      </span>
                      {quickPrompts.map((prompt, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(prompt.text)}
                          disabled={isLoading}
                          className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white hover:bg-slate-50 border border-slate-300 hover:border-[#0099cc] text-[#263238] hover:text-[#01579b] transition-all shrink-0 disabled:opacity-50 cursor-pointer shadow-xs"
                        >
                          {prompt.label}
                        </button>
                      ))}
                    </div>
                  );
                })()}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={
                      selectedAgent
                        ? (isEn ? `Ask agent ${selectedAgent.name} about parameters, brands, or budget...` : `Zeptejte se agenta ${selectedAgent.name} na parametry, značky či rozpočet...`)
                        : (isEn ? "Enter your purchasing intent, specific product requirements, or budget..." : "Zadejte svůj nákupní záměr, specifické požadavky na produkt či rozpočet...")
                    }
                    disabled={isLoading}
                    className="flex-1 bg-[#f8fafc] border border-slate-300 focus:border-[#0099cc] focus:ring-1 focus:ring-[#0099cc] rounded-xl px-4 py-3 text-base sm:text-sm text-[#263238] placeholder:text-[#78909c] outline-none transition-all shadow-xs"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !inputValue.trim()}
                    className="p-3 bg-[#0099cc] hover:bg-[#0088b8] disabled:bg-slate-200 text-white disabled:text-slate-400 font-bold rounded-xl transition-all shadow-xs disabled:shadow-none cursor-pointer flex items-center justify-center min-w-[44px]"
                  >
                    <span className="font-bold text-base leading-none">➤</span>
                  </button>
                </form>

                <p className="text-[11px] text-center text-[#546e7a] mt-2 font-medium">
                  {isEn ? 'Discussion runs directly via your connected AI model utilizing your persistent RAG memory.' : 'Diskuse s agentem běží přímo přes vaše propojené AI předplatné s plným využitím vaší RAG paměti.'}
                </p>
              </div>
            )}
          </main>
        </div>
      )}

      {/* Global Interactive Modals */}
      
      {/* Mobile Bottom Navigation Bar (Cyber-glass Style) */}
      <nav 
        aria-label="Mobile Navigation" 
        className="sm:hidden border-t border-cyan-500/20 bg-[#0B121E]/95 backdrop-blur-xl px-3 py-1.5 flex items-center justify-around shrink-0 z-30 shadow-[0_-4px_25px_rgba(0,0,0,0.6)] safe-area-bottom"
      >
        <button
          type="button"
          aria-label={isEn ? "Mobile Wizard Navigation" : "Navigace průvodce pro mobil"}
          data-testid="mobile-nav-wizard"
          onClick={() => {
            setIsMobileSidebarOpen(false);
            const activeOrStored = selectedAgent || (typeof window !== "undefined" ? AgentStorageService.getAllAgents()[0] : null);
            if (activeOrStored) {
              const isCompleted = isAgentCompleted(activeOrStored);
              handleSelectAgent(activeOrStored, isCompleted);
              setWizardInitialShowResult(isCompleted);
              setWizardMode("active_agent");
            }
            setActiveTab("wizard");
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-xl transition-all cursor-pointer ${
            activeTab === "wizard"
              ? "text-cyan-300 font-bold bg-cyan-950/60 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <span className="text-[11px] font-mono tracking-wider font-semibold">{t.header.wizardTab}</span>
        </button>

        <div className="w-px h-6 bg-slate-800 mx-2" />

        <button
          type="button"
          aria-label={isEn ? "Mobile Chat Navigation" : "Navigace chatu pro mobil"}
          data-testid="mobile-nav-chat"
          onClick={() => {
            setIsMobileSidebarOpen(false);
            setActiveTab("chat");
            setIsSidebarSwitchingAgent(false);
            const userStoredAgents = AgentStorageService.getAllAgents();
            setStoredAgents(userStoredAgents);
            if (selectedAgent && !userStoredAgents.some((a) => a.id === selectedAgent.id)) {
              setSelectedAgent(null);
            }
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-xl transition-all cursor-pointer ${
            activeTab === "chat"
              ? "text-cyan-300 font-bold bg-cyan-950/60 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <span className="text-[11px] font-mono tracking-wider font-semibold">{t.header.chatTab}</span>
        </button>

        <div className="w-px h-6 bg-slate-800 mx-2" />

        <button
          type="button"
          aria-label={isEn ? "Mobile Memory Navigation" : "Navigace paměti pro mobil"}
          data-testid="mobile-nav-memory"
          onClick={() => {
            setIsMobileSidebarOpen(false);
            setIsMemoryModalOpen(true);
          }}
          className="flex-1 flex flex-col items-center justify-center py-1.5 rounded-xl text-slate-400 hover:text-cyan-300 transition-all cursor-pointer"
        >
          <span className="text-[11px] font-mono tracking-wider font-semibold">{isEn ? "AI Memory" : "Paměť AI"}</span>
        </button>
      </nav>

      {/* 1. BYOK AI Engine & Subscription Modal */}
      <AIEngineSubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        activeProviderId={activeProviderId}
        onSaveProvider={(providerId, keys) => {
          setActiveProviderId(providerId);
          setApiKeys(keys);
          if (typeof window !== 'undefined') {
            localStorage.setItem('bairight_active_provider', providerId);
            localStorage.setItem('bairight_api_keys', JSON.stringify(keys));
          }
        }}
        currentApiKeys={apiKeys}
        demoRunsRemaining={demoRunsRemaining}
      />

      {/* 2. Persistent RAG Memory Modal */}
      <UserRAGMemoryModal
        isOpen={isMemoryModalOpen}
        onClose={() => setIsMemoryModalOpen(false)}
        facts={userFacts}
        assessments={assessments}
        onToggleFact={handleToggleFact}
        onAddFact={handleAddFact}
        onDeleteFact={handleDeleteFact}
        onDeleteAssessment={handleDeleteAssessment}
      />

      {/* 3. Color Palette Switcher Modal (Google Pixel & Material Design combinations) */}
      <ColorPaletteModal
        isOpen={isPaletteModalOpen}
        onClose={() => setIsPaletteModalOpen(false)}
        activeFontId={activeFontId}
        onSelectFont={setActiveFontId}
      />

      {/* 5. Universal Agent Prompt & Rules Inspector */}
      <UniversalAgentPromptModal
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
        agent={selectedAgent}
      />

      {/* 6. Buy Me a Coffee Floating Capsule & Modal */}
      <BuyMeACoffeeFloatingButton
        onClick={() => setIsGlobalCoffeeModalOpen(true)}
        locale={locale}
      />
      <BuyMeACoffeeModal
        isOpen={isGlobalCoffeeModalOpen}
        onClose={() => setIsGlobalCoffeeModalOpen(false)}
        agent={selectedAgent}
        locale={locale}
      />
    </div>
  );
}
