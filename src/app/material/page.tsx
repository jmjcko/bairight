'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n/I18nContext';
import { Logo } from '@/components/Logo';

type MaterialTab = 'dashboard' | 'catalog' | 'wizard' | 'chat' | 'memory';

interface AdvisorCard {
  id: string;
  name: string;
  nameEn: string;
  category: string;
  categoryEn: string;
  description: string;
  descriptionEn: string;
  accentColor: string;
  matchScore: string;
  topModel: string;
  criteriaCount: number;
}

const ADVISORS: AdvisorCard[] = [
  {
    id: 'luke_running',
    name: 'Luke — Běžecká & ortopedická obuv',
    nameEn: 'Luke — Running & Orthopedic Footwear',
    category: 'Sport & Zdraví',
    categoryEn: 'Sports & Health',
    description: 'Specializovaný rádce pro biomechaniku došlapu, kopyta 2E/4E a ochranu kolenních kloubů.',
    descriptionEn: 'Specialist advisor for foot biomechanics, 2E/4E lasts, and knee joint protection.',
    accentColor: '#4caf50',
    matchScore: '98%',
    topModel: 'Asics Gel-Nimbus 26 (2E)',
    criteriaCount: 14,
  },
  {
    id: 'ergo_chair',
    name: 'Ergonomické kancelářské židle',
    nameEn: 'Ergonomic Office Chairs',
    category: 'Práce & Kancelář',
    categoryEn: 'Work & Office',
    description: 'Synchronní mechanika, 3D/4D područky a prodyšná síťovina pro 8+ hodin zdravého sezení.',
    descriptionEn: 'Synchronous mechanisms, 3D/4D armrests, and breathable mesh for 8+ hours.',
    accentColor: '#1e88e5',
    matchScore: '97%',
    topModel: 'Herman Miller Aeron B',
    criteriaCount: 11,
  },
  {
    id: 'espresso',
    name: 'Domácí pákové kávovary',
    nameEn: 'Home Espresso Machines',
    category: 'Domácnost & Kuchyně',
    categoryEn: 'Home & Kitchen',
    description: '58mm hlava, PID regulace teploty a nerezový bojler pro precizní extrakci espressa.',
    descriptionEn: '58mm group head, PID temperature stability, and stainless boiler for espresso.',
    accentColor: '#ff9800',
    matchScore: '96%',
    topModel: 'Lelit Mara X V2',
    criteriaCount: 9,
  },
  {
    id: 'electric_suv',
    name: 'Rodinná SUV & Elektromobily',
    nameEn: 'Family SUV & Electric Vehicles',
    category: 'Auto-moto',
    categoryEn: 'Automotive',
    description: 'Dálniční dojezd 130 km/h, 800V ultrarychlé nabíjení a variabilní kufr pro rodinu.',
    descriptionEn: 'Highway range at 130 km/h, 800V fast charging, and spacious family trunk.',
    accentColor: '#0099cc',
    matchScore: '95%',
    topModel: 'Hyundai Ioniq 5 (84 kWh)',
    criteriaCount: 16,
  },
];

interface CriteriaChecklistItem {
  id: string;
  label: string;
  labelEn: string;
  detail: string;
  detailEn: string;
  checked: boolean;
}

export default function MaterialRedesignPreviewPage() {
  const { locale, setLocale } = useI18n();
  const isEn = locale === 'en';

  const [activeTab, setActiveTab] = useState<MaterialTab>('dashboard');
  const [selectedAdvisorId, setSelectedAdvisorId] = useState<string>('luke_running');
  const [searchQuery, setSearchQuery] = useState('');

  // Criteria Checklist state (mirrors the Todo list from MATERIAL ADMIN screenshot)
  const [criteriaList, setCriteriaList] = useState<CriteriaChecklistItem[]>([
    {
      id: 'c1',
      label: 'Široké kopyto 2E (> 100 mm)',
      labelEn: 'Wide Last 2E (> 100 mm)',
      detail: 'Prevence otlaků a Mortonovy neuralgie',
      detailEn: 'Prevents blistering and nerve compression',
      checked: true,
    },
    {
      id: 'c2',
      label: 'Drop podešve 6–8 mm + kolébka',
      labelEn: 'Midsole Drop 6–8 mm + Rocker',
      detail: 'Odlehčení pately a úleva pro osteoartrózu kolene',
      detailEn: 'Patella relief and knee joint protection',
      checked: true,
    },
    {
      id: 'c3',
      label: 'Povrch: Silnice & asfalt',
      labelEn: 'Surface: Road & Asphalt',
      detail: 'Vyšší vrstva tlumicí pěny PureGEL',
      detailEn: 'Higher PureGEL cushioning volume',
      checked: true,
    },
    {
      id: 'c4',
      label: 'Cenový strop: do 4 800 Kč',
      labelEn: 'Budget Limit: up to $210',
      detail: 'Striktní dodržení zadaného rozpočtu',
      detailEn: 'Strict budget compliance',
      checked: true,
    },
    {
      id: 'c5',
      label: 'Zakázané značky: Nike',
      labelEn: 'Excluded Brands: Nike',
      detail: 'Vyřazeno z důvodu úzkého kopyta',
      detailEn: 'Excluded due to narrow fit',
      checked: true,
    },
  ]);

  // Chat conversation state
  const [chatMessages, setChatMessages] = useState<
    { id: string; role: 'user' | 'agent'; text: string; time: string }[]
  >([
    {
      id: 'm-1',
      role: 'agent',
      text: isEn
        ? "Hello! I am Luke, your biomechanical advisor. I have analyzed your 5 active criteria (Road surface, knee protection drop 8mm, wide 2E last). Asics Gel-Nimbus 26 (2E) matches at 98%. What questions do you have about sizing or alternatives?"
        : "Dobrý den! Jsem Luke, váš biomechanický rádce. Analyzoval jsem vašich 5 aktivních kritérií (silniční běh, ochrana kolen, kopyto 2E). Na prvním místě je Asics Gel-Nimbus 26 (2E) se shodou 98 %. Chcete upřesnit velikost či alternativy?",
      time: "10:24",
    },
  ]);
  const [chatInput, setChatInput] = useState('');

  useEffect(() => {
    document.body.classList.add('material-mode');
    return () => {
      document.body.classList.remove('material-mode');
    };
  }, []);

  const toggleCriteria = (id: string) => {
    setCriteriaList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const userText = chatInput.trim();
    const now = new Date();
    const timeStr = now.getHours() + ":" + String(now.getMinutes()).padStart(2, "0");

    const newMsg = { id: "u-" + Date.now(), role: "user" as const, text: userText, time: timeStr };
    setChatMessages((prev) => [...prev, newMsg]);
    setChatInput("");

    setTimeout(() => {
      const replyText = isEn
        ? "Noted! Criteria updated based on \"" + userText + "\". For knee comfort, make sure you maintain a 180 cadence on asphalt."
        : "Rozumím! Aktualizoval jsem doporučení na základě dotazu \"" + userText + "\". Pro maximální úlevu kolen na silnici doporučuji držet kadenci kolem 180 kroků/min.";
      setChatMessages((prev) => [
        ...prev,
        { id: "a-" + Date.now(), role: "agent" as const, text: replyText, time: timeStr },
      ]);
    }, 600);
  };

  const activeAdvisor = ADVISORS.find((a) => a.id === selectedAdvisorId) || ADVISORS[0];
  const checkedCriteriaCount = criteriaList.filter((c) => c.checked).length;

  return (
    <div
      data-theme="google-material"
      className="min-h-screen w-full bg-[#f4f6f8] text-[#263238] font-sans flex flex-col selection:bg-[#b3e5fc] selection:text-[#014377]"
    >
      {/* 1. TOP WHITE HEADER BAR (Exact Material Admin Header) */}
      <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-40 shadow-xs">
        {/* Left: Brand Logo & Hamburger */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer text-lg font-mono font-bold"
            title="Menu"
          >
            ☰
          </button>
          <Logo size="md" />
        </div>

        {/* Center: Search pill */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
          <div className="w-full h-10 bg-[#f4f6f8] hover:bg-[#eceff1] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#0099cc]/30 rounded-full px-4 flex items-center gap-2.5 transition-all border border-slate-200/60 focus-within:border-[#0099cc]">
            <span className="text-slate-400 text-xs font-mono font-bold">Q</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isEn ? "Search shopping advisors, criteria or models..." : "Hledat nákupní rádce, kritéria či modely..."}
              className="bg-transparent border-none outline-none text-xs text-[#263238] placeholder-slate-400 w-full"
            />
          </div>
        </div>

        {/* Right: Controls & Notification & Theme Return */}
        <div className="flex items-center gap-2.5">
          {/* Notification Indicator (Mirrors the red badge on screenshot) */}
          <div className="relative p-2 rounded-full hover:bg-slate-100 text-slate-600 cursor-pointer" title="Aktivní notifikace">
            <span className="font-mono text-xs font-bold text-slate-500">SYS</span>
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#ef5350] text-white text-[9px] font-bold flex items-center justify-center font-mono">
              4
            </span>
          </div>

          {/* Language Switcher */}
          <button
            type="button"
            onClick={() => setLocale(locale === "en" ? "cs" : "en")}
            className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-[#f4f6f8] hover:bg-slate-200 text-[#37474f] border border-slate-200 cursor-pointer"
          >
            {locale.toUpperCase()}
          </button>

          {/* Model Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e1f5fe] border border-[#b3e5fc] text-xs font-medium text-[#01579b]">
            <span className="w-2 h-2 rounded-full bg-[#0099cc] shrink-0 animate-pulse" />
            <span className="font-bold">Gemini 2.0</span>
          </div>

          {/* Return to Classic Cyber-Glass Mode */}
          <Link
            href="/"
            className="px-3.5 py-1.5 rounded-full bg-[#263238] hover:bg-[#37474f] text-white text-xs font-medium transition-all shadow-xs flex items-center gap-1 cursor-pointer"
          >
            <span>{isEn ? "Classic Dark" : "Původní Dark"}</span>
            <span className="text-[10px]">↗</span>
          </Link>
        </div>
      </header>

      {/* 2. BODY LAYOUT: DARK SLATE LEFT RAIL + CRISP WHITE CONTENT CANVAS */}
      <div className="flex-1 flex overflow-hidden">
        {/* Dark Slate Left Rail (Mirrors Left Rail from MATERIAL ADMIN screenshot) */}
        <aside className="w-16 sm:w-56 bg-[#263238] text-slate-300 flex flex-col justify-between p-3 shrink-0 select-none overflow-y-auto">
          <div className="space-y-4">
            {/* Active Circular Teal Icon at Top (Mirrors screenshot circular teal home icon #33b5e5) */}
            <div className="flex justify-center sm:justify-start sm:px-2 pt-1">
              <button
                type="button"
                onClick={() => setActiveTab("dashboard")}
                className="w-10 h-10 rounded-full bg-[#33b5e5] hover:bg-[#0099cc] text-white flex items-center justify-center font-mono text-sm font-bold shadow-sm transition-transform active:scale-95 cursor-pointer shrink-0"
                title={isEn ? "Main Dashboard" : "Hlavní přehled"}
                aria-label={isEn ? "Main Dashboard" : "Hlavní přehled"}
              >
                bAI
              </button>
            </div>

            {/* Navigation links */}
            <nav className="space-y-1">
              {[
                { id: "dashboard", label: isEn ? "Overview" : "Přehled", code: "01" },
                { id: "catalog", label: isEn ? "Advisors" : "Rádci", code: "02" },
                { id: "wizard", label: isEn ? "Criteria" : "Kritéria", code: "03" },
                { id: "chat", label: isEn ? "Live Chat" : "AI Diskuse", code: "04" },
                { id: "memory", label: isEn ? "RAG Memory" : "RAG Paměť", code: "05" },
              ].map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    data-testid={`nav-tab-${item.id}`}
                    aria-label={item.label}
                    onClick={() => setActiveTab(item.id as MaterialTab)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#37474f] text-[#33b5e5] font-bold border-l-3 border-[#33b5e5]"
                        : "text-slate-400 hover:text-white hover:bg-[#37474f]/50"
                    }`}
                  >
                    <span className="text-[10px] font-mono tracking-wider opacity-75">{item.code}</span>
                    <span className="hidden sm:inline truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom rail info */}
          <div className="hidden sm:block p-3 rounded-xl bg-[#1e272c] border border-slate-700/60 text-[11px] text-slate-400 space-y-1">
            <span className="text-[10px] font-mono text-[#33b5e5] font-bold uppercase block">Material Admin</span>
            <p className="text-[10px] leading-tight text-slate-400">Teal & Slate barevný profil s čistými bílými dlaždicemi.</p>
          </div>
        </aside>

        {/* Main Canvas Workspace */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 space-y-5">
          {/* TOP ROW: 4 KPI CARDS WITH COLORED TOP ACCENT LINES (Mirrors Top Row from Screenshot) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Blue Top Line (#1e88e5) */}
            <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-xs border-t-[3px] border-t-[#1e88e5] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[#607d8b] font-semibold uppercase tracking-wider">
                  {isEn ? "Active Advisor" : "Aktivní rádce"}
                </span>
                <span className="text-[11px] font-mono font-bold text-[#0099cc] bg-[#e1f5fe] px-1.5 py-0.5 rounded">
                  0,38% ↑
                </span>
              </div>
              <div className="mt-2">
                <h3 className="text-xl sm:text-2xl font-black text-[#263238] tracking-tight">{activeAdvisor.topModel.split(" ")[0]}</h3>
                <p className="text-xs text-[#607d8b] truncate mt-0.5">{activeAdvisor.name}</p>
              </div>
            </div>

            {/* Card 2: Amber Top Line (#ff9800) */}
            <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-xs border-t-[3px] border-t-[#ff9800] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[#607d8b] font-semibold uppercase tracking-wider">
                  {isEn ? "Active Criteria" : "Aktivní kritéria"}
                </span>
                <span className="text-[11px] font-mono font-bold text-[#ff9800] bg-[#fff3e0] px-1.5 py-0.5 rounded">
                  {checkedCriteriaCount}/5 ✓
                </span>
              </div>
              <div className="mt-2">
                <h3 className="text-xl sm:text-2xl font-black text-[#263238] tracking-tight">{checkedCriteriaCount} {isEn ? "rules" : "pravidel"}</h3>
                <p className="text-xs text-[#607d8b] truncate mt-0.5">{isEn ? "Biomechanics & budget" : "Biomechanika & rozpočet"}</p>
              </div>
            </div>

            {/* Card 3: Coral Top Line (#ef5350) */}
            <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-xs border-t-[3px] border-t-[#ef5350] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[#607d8b] font-semibold uppercase tracking-wider">
                  {isEn ? "Excluded Brands" : "Vyloučené značky"}
                </span>
                <span className="text-[11px] font-mono font-bold text-[#ef5350] bg-[#ffebee] px-1.5 py-0.5 rounded">
                  Filtrováno
                </span>
              </div>
              <div className="mt-2">
                <h3 className="text-xl sm:text-2xl font-black text-[#263238] tracking-tight">Nike, drop &lt;4</h3>
                <p className="text-xs text-[#607d8b] truncate mt-0.5">{isEn ? "Strict last width rule" : "Striktní kontrola šířky"}</p>
              </div>
            </div>

            {/* Card 4: Green Top Line (#4caf50) */}
            <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-xs border-t-[3px] border-t-[#4caf50] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[#607d8b] font-semibold uppercase tracking-wider">
                  {isEn ? "Top Match Rate" : "Nejvyšší shoda"}
                </span>
                <span className="text-[11px] font-mono font-bold text-[#4caf50] bg-[#e8f5e9] px-1.5 py-0.5 rounded">
                  Model 2026
                </span>
              </div>
              <div className="mt-2">
                <h3 className="text-xl sm:text-2xl font-black text-[#0099cc] tracking-tight">{activeAdvisor.matchScore}</h3>
                <p className="text-xs text-[#607d8b] truncate mt-0.5">{activeAdvisor.topModel}</p>
              </div>
            </div>
          </div>

          {/* MIDDLE SECTION: ADVISOR SELECTION TILES + LIVE TOP 3 RANKING */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left 2 Cols: Advisor Selection Tiles (Dlaždice rádců) */}
            <div className="lg:col-span-2 bg-white rounded-xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-base font-bold text-[#263238] font-sans">
                    {isEn ? "Expert Shopping Advisors (Tiles Catalog)" : "Specializovaní nákupní rádci (Katalog dlaždic)"}
                  </h2>
                  <p className="text-xs text-[#607d8b] mt-0.5">
                    {isEn ? "Select an advisor to run real-time evaluation" : "Vyberte rádce pro okamžité spuštění vyhodnocení"}
                  </p>
                </div>
                <span className="text-xs font-mono text-[#0099cc] bg-[#e1f5fe] px-2 py-0.5 rounded font-bold">
                  {ADVISORS.length} aktivních
                </span>
              </div>

              {/* Grid of clean white advisor tiles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {ADVISORS.map((adv) => {
                  const isSelected = adv.id === selectedAdvisorId;
                  return (
                    <div
                      key={adv.id}
                      data-testid={`advisor-tile-${adv.id}`}
                      onClick={() => setSelectedAdvisorId(adv.id)}
                      className={`rounded-xl p-4.5 border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "border-[#0099cc] ring-2 ring-[#0099cc]/20 bg-[#f9fbfb] shadow-xs"
                          : "border-slate-200/80 hover:border-slate-300 bg-white"
                      }`}
                      style={{ borderTopWidth: "3px", borderTopColor: adv.accentColor }}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-[#607d8b] font-bold">
                            {isEn ? adv.categoryEn : adv.category}
                          </span>
                          <span className="text-xs font-mono font-bold text-[#0099cc]">
                            {adv.matchScore}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-[#263238] leading-snug">{isEn ? adv.nameEn : adv.name}</h4>
                        <p className="text-xs text-[#607d8b] line-clamp-2 leading-relaxed">{isEn ? adv.descriptionEn : adv.description}</p>
                      </div>

                      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-[11px] font-mono text-slate-400">
                          {adv.criteriaCount} kritérií
                        </span>
                        <span className={`text-xs font-bold ${isSelected ? "text-[#0099cc]" : "text-slate-600"}`}>
                          {isSelected ? "Aktivní ✓" : "Vybrat →"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right 1 Col: Today Stats / Top 3 Recommended Models with Teal Progress Bars */}
            <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-[#263238]">
                    {isEn ? "Top 3 Ranked Models" : "Aktuální žebříček top 3"}
                  </h3>
                  <p className="text-xs text-[#607d8b] mt-0.5">{activeAdvisor.name}</p>
                </div>
                <span className="text-[11px] font-mono text-[#0099cc] font-bold">Live Sync</span>
              </div>

              <div className="space-y-3.5 pt-1">
                {/* Model 1 */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#263238]">#1 Asics Gel-Nimbus 26 2E</span>
                    <span className="font-mono font-bold text-[#0099cc]">98 %</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-[#0099cc] rounded-full" style={{ width: "98%" }} />
                  </div>
                  <span className="text-[11px] text-[#607d8b] block">Šířka 2E, optimální drop 8 mm šetřící kolena.</span>
                </div>

                {/* Model 2 */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#263238]">#2 Hoka Bondi 8 Wide</span>
                    <span className="font-mono font-bold text-[#26a69a]">94 %</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-[#26a69a] rounded-full" style={{ width: "94%" }} />
                  </div>
                  <span className="text-[11px] text-[#607d8b] block">Maximální objemové tlumení Meta-Rocker.</span>
                </div>

                {/* Model 3 */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#263238]">#3 Brooks Ghost Max 2</span>
                    <span className="font-mono font-bold text-[#b3e5fc]">91 %</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-[#b3e5fc] rounded-full" style={{ width: "91%" }} />
                  </div>
                  <span className="text-[11px] text-[#607d8b] block">GlideRoll kolébka pro plynulý krok.</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveTab("chat")}
                  className="w-full py-2.5 rounded-lg bg-[#0099cc] hover:bg-[#0088b8] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  {isEn ? "Open Consultation Chat →" : "Konzultovat modely v chatu →"}
                </button>
              </div>
            </div>
          </div>

          {/* BOTTOM SECTION: TODO'S CRITERIA CHECKLIST + LIVE CHAT PANE */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Bottom-Left: Todo's Decision Checklist (Mirrors Todo's from Screenshot) */}
            <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-[#263238]">
                    {isEn ? "Decision Criteria (Checklist)" : "Rozhodovací kritéria (Checklist)"}
                  </h3>
                  <p className="text-xs text-[#607d8b] mt-0.5">
                    {isEn ? "Click to toggle parameter enforcement in real time" : "Kliknutím upravíte vyhodnocování parametrů v reálném čase"}
                  </p>
                </div>
                <span className="text-xs font-mono text-[#0099cc] font-bold">
                  {checkedCriteriaCount} aktivních
                </span>
              </div>

              {/* Checklist rows */}
              <div className="space-y-2.5 pt-1">
                {criteriaList.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => toggleCriteria(item.id)}
                    className="p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-[#fcfdfd] transition-all cursor-pointer flex items-start gap-3"
                  >
                    <div
                      className={`w-5 h-5 rounded border mt-0.5 flex items-center justify-center font-bold text-xs transition-colors shrink-0 ${
                        item.checked
                          ? "bg-[#0099cc] border-[#0099cc] text-white"
                          : "border-slate-300 bg-white text-transparent"
                      }`}
                    >
                      ✓
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className={`text-xs font-bold block ${item.checked ? "text-[#263238]" : "text-slate-400 line-through"}`}>
                        {isEn ? item.labelEn : item.label}
                      </span>
                      <span className="text-[11px] text-[#607d8b] block mt-0.5">
                        {isEn ? item.detailEn : item.detail}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom-Right: Live Consultation Thread (Google Messages Style) */}
            <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#e1f5fe] text-[#0099cc] font-bold flex items-center justify-center font-mono text-xs">
                    AI
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#263238]">{activeAdvisor.name}</h3>
                    <p className="text-[11px] text-[#607d8b]">Google Gemini 2.0 • BYOK Engine</p>
                  </div>
                </div>
                <span className="text-[11px] font-mono font-bold text-[#0099cc] bg-[#e1f5fe] px-2 py-0.5 rounded">
                  Aktivní
                </span>
              </div>

              {/* Chat Stream */}
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"} space-y-0.5`}
                  >
                    <div
                      className={`p-3.5 rounded-2xl text-xs leading-relaxed max-w-[85%] ${
                        msg.role === "user"
                          ? "bg-[#0099cc] text-white rounded-tr-xs"
                          : "bg-[#f4f6f8] text-[#263238] border border-slate-200/80 rounded-tl-xs"
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 px-1">{msg.time}</span>
                  </div>
                ))}
              </div>

              {/* Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2 pt-2 border-t border-slate-100"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={isEn ? "Ask Luke about sizing, cushioning or brands..." : "Zeptejte se Luka na velikost, drop či tlumení..."}
                  className="flex-1 px-3.5 py-2.5 rounded-lg bg-[#f4f6f8] border border-slate-200 text-xs text-[#263238] placeholder-slate-400 outline-none focus:border-[#0099cc] focus:bg-white transition-all"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="px-4 py-2.5 rounded-lg bg-[#0099cc] hover:bg-[#0088b8] disabled:opacity-40 text-white font-bold text-xs transition-colors cursor-pointer shrink-0"
                >
                  {isEn ? "Send" : "Odeslat"}
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
