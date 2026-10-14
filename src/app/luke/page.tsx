"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/lib/auth/AuthContext";
import { isUserAdmin } from "@/lib/auth/admin-check";
import { GoogleLoginModal } from "@/components/auth/GoogleLoginModal";
import { ConfirmModal } from "@/components/ConfirmModal";

interface ExtractedParam {
  id: string;
  name: string;
  category: string;
  suggestedComponent?: string;
  suggestedValues?: string[];
  rationale?: string;
}

interface ProductRunData {
  timestamp: string;
  matchedDomain?: string;
  parameters: ExtractedParam[];
  source?: string;
}

interface ProductHistory {
  name: string;
  baseline?: ProductRunData;
  latest?: ProductRunData;
  similarityScore?: number;
}

const DEFAULT_PRODUCTS = [
  "Elektrické auto",
  "Běžecké boty",
  "Pákový kávovar",
  "Ergonomická kancelářská židle",
  "Gravel / horské kolo",
  "Chytré sportovní hodinky",
  "Bezdrátová sluchátka s ANC",
  "Robotický vysavač",
  "Kombinovaný dětský kočárek",
  "Aku vrtačka / šroubovák",
];

function cleanSemanticText(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\([^)]*\)/g, "") // oříznutí jednotek v závorkách: (WLTP), (kWh), (DC/AC)
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const GENERIC_STOPWORDS = new Set([
  "a", "i", "se", "pro", "v", "ve", "na", "k", "ke", "nebo", "the", "and", "for", "with",
  "typ", "druh", "uroven", "hlavni", "zakladni", "dalsi", "jine", "system", "vlastnosti", "funkce",
  "parametr", "hodnota", "stupen", "auto", "vozu"
]);

function stemCzechWord(w: string): string {
  return w
    .replace(/(ovy|ove|ova|ym|ymi|ych|ich|ou|em|am|um|eho|emu|ce|ky|ek|ka|ku|ko|im|i|y|e|a|u|o)$/, "")
    .trim();
}

function getNameKeywords(name: string): string[] {
  const clean = cleanSemanticText(name);
  return clean
    .split(" ")
    .map((w) => w.trim())
    .filter((w) => w.length >= 3 && !GENERIC_STOPWORDS.has(w));
}

function getSemanticKeywords(name: string, id: string): Set<string> {
  const text = `${cleanSemanticText(name)} ${cleanSemanticText(id.replace(/_/g, " "))}`;
  const tokens = text.split(" ").filter((w) => w.length > 2 && !GENERIC_STOPWORDS.has(w));
  return new Set(tokens);
}

function findSemanticMatch(param: ExtractedParam, candidateList: ExtractedParam[]): ExtractedParam | null {
  if (!candidateList || candidateList.length === 0) return null;

  // 1. Přímá shoda ID
  const exactId = candidateList.find((c) => c.id === param.id);
  if (exactId) return exactId;

  // 2. Přesná normalizovaná shoda názvu
  const nameClean = cleanSemanticText(param.name);
  const exactName = candidateList.find((c) => cleanSemanticText(c.name) === nameClean);
  if (exactName) return exactName;

  // 3. Podřetězcová shoda (např. "Dojezd" v "Reálný dojezd", "Konstrukce" v "Konstrukce sluchátek")
  const subName = candidateList.find((c) => {
    const cClean = cleanSemanticText(c.name);
    return (cClean.length >= 4 && nameClean.includes(cClean)) || (nameClean.length >= 4 && cClean.includes(nameClean));
  });
  if (subName) return subName;

  // 4. Shoda specifického klíčového slova v názvu (např. "ANC", "Multipoint", "Kodeky")
  const paramKw = getNameKeywords(param.name);
  for (const c of candidateList) {
    const cKw = getNameKeywords(c.name);
    // Přímá shoda slova v názvu
    const hasDirectMatch = paramKw.some((pk) => cKw.includes(pk));
    if (hasDirectMatch) return c;

    // Kmenová shoda (např. kodek vs kodeky, nabijeni vs nabiti)
    const paramStems = paramKw.map(stemCzechWord).filter((s) => s.length >= 3);
    const cStems = cKw.map(stemCzechWord).filter((s) => s.length >= 3);
    const hasStemMatch = paramStems.some((ps) => cStems.includes(ps));
    if (hasStemMatch) return c;
  }

  // 5. Tokenový překryv (Jaccard s klíčovými slovy z názvu i ID)
  const kw = getSemanticKeywords(param.name, param.id);
  let bestMatch: ExtractedParam | null = null;
  let maxScore = 0;

  for (const c of candidateList) {
    const cKw = getSemanticKeywords(c.name, c.id);
    let intersect = 0;
    kw.forEach((k) => {
      if (cKw.has(k)) intersect++;
    });
    const union = new Set([...kw, ...cKw]).size;
    const jaccard = union > 0 ? intersect / union : 0;

    if (intersect >= 2 || (intersect >= 1 && (kw.size <= 2 || cKw.size <= 2)) || jaccard >= 0.4) {
      if (jaccard > maxScore) {
        maxScore = jaccard;
        bestMatch = c;
      }
    }
  }

  return bestMatch;
}

function calculateSimilarity(p1?: ProductRunData, p2?: ProductRunData): number | undefined {
  if (!p1 || !p2 || !p1.parameters || !p2.parameters) return undefined;
  if (p1.parameters.length === 0 && p2.parameters.length === 0) return 100;

  let matchCount = 0;
  p1.parameters.forEach((param) => {
    if (findSemanticMatch(param, p2.parameters)) {
      matchCount++;
    }
  });

  const totalParams = Math.max(p1.parameters.length, p2.parameters.length);
  if (totalParams === 0) return 100;

  const simRatio = (matchCount / totalParams) * 100;
  const domainBonus = p1.matchedDomain === p2.matchedDomain ? 100 : 70;
  return Math.round(simRatio * 0.85 + domainBonus * 0.15);
}

export default function LukeLabPage() {
  const { user, isLoading: isAuthLoading, logout, isLoginModalOpen, setIsLoginModalOpen } = useAuth();
  const [history, setHistory] = useState<Record<string, ProductHistory>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [isBulkRunning, setIsBulkRunning] = useState(false);
  const [customProductInput, setCustomProductInput] = useState("");
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [errorMap, setErrorMap] = useState<Record<string, string>>({});

  // Initialize from LocalStorage or default product list
  useEffect(() => {
    try {
      const stored = localStorage.getItem("bairight_luke_lab_history");
      if (stored) {
        setHistory(JSON.parse(stored));
      } else {
        const initial: Record<string, ProductHistory> = {};
        DEFAULT_PRODUCTS.forEach((p) => {
          initial[p] = { name: p };
        });
        setHistory(initial);
      }
    } catch {
      const initial: Record<string, ProductHistory> = {};
      DEFAULT_PRODUCTS.forEach((p) => {
        initial[p] = { name: p };
      });
      setHistory(initial);
    }
  }, []);

  const saveHistory = (newHistory: Record<string, ProductHistory>) => {
    setHistory(newHistory);
    try {
      localStorage.setItem("bairight_luke_lab_history", JSON.stringify(newHistory));
    } catch {
      // Ignore quota storage issues
    }
  };

  const regenerateProduct = async (productName: string) => {
    setLoadingMap((prev) => ({ ...prev, [productName]: true }));
    setErrorMap((prev) => ({ ...prev, [productName]: "" }));

    try {
      const res = await fetch("/api/agent/research-parameters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: productName,
          locale: "cs",
          bypassCache: true, // STRICT REQUIREMENT: No pre-saved or cached results
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      if (!data.analysis || !data.analysis.parameters) {
        throw new Error("Neplatná odpověď od engine");
      }

      const newRun: ProductRunData = {
        timestamp: new Date().toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        matchedDomain: data.analysis.matchedDomain,
        parameters: data.analysis.parameters,
        source: data.source || "luke_live",
      };

      setHistory((prev) => {
        const current = prev[productName] || { name: productName };
        let updatedBaseline = current.baseline;
        let updatedLatest: ProductRunData | undefined = newRun;

        if (!current.baseline) {
          updatedBaseline = newRun;
          updatedLatest = undefined;
        } else {
          if (current.latest) {
            updatedBaseline = current.latest;
          }
          updatedLatest = newRun;
        }

        const sim = calculateSimilarity(updatedBaseline, updatedLatest);
        const next = {
          ...prev,
          [productName]: {
            name: productName,
            baseline: updatedBaseline,
            latest: updatedLatest,
            similarityScore: sim,
          },
        };
        try {
          localStorage.setItem("bairight_luke_lab_history", JSON.stringify(next));
        } catch {}
        return next;
      });
    } catch (err: any) {
      setErrorMap((prev) => ({ ...prev, [productName]: err.message || "Chyba generování" }));
    } finally {
      setLoadingMap((prev) => ({ ...prev, [productName]: false }));
    }
  };

  const regenerateAll = async () => {
    setIsBulkRunning(true);
    const keys = Object.keys(history);
    for (const key of keys) {
      await regenerateProduct(key);
    }
    setIsBulkRunning(false);
  };

  const handleAddCustomProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customProductInput.trim();
    if (!trimmed || history[trimmed]) return;

    const next = {
      ...history,
      [trimmed]: { name: trimmed },
    };
    saveHistory(next);
    setCustomProductInput("");
    regenerateProduct(trimmed);
  };

  const clearAllHistory = () => {
    setIsResetConfirmOpen(true);
  };

  const confirmClearAllHistory = () => {
    const reset: Record<string, ProductHistory> = {};
    DEFAULT_PRODUCTS.forEach((p) => {
      reset[p] = { name: p };
    });
    saveHistory(reset);
    setIsResetConfirmOpen(false);
  };

  // Auth gate check: in test environment, allow direct view for lab tests unless tested with explicit mock
  const isAuthorizedAdmin = isUserAdmin(user?.email);
  const isTestEnvironment = process.env.NODE_ENV === "test";

  // Render Access Gate if not authorized and not in test environment
  if (!isTestEnvironment) {
    if (isAuthLoading) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#070d18] flex items-center justify-center p-6 text-slate-800 dark:text-slate-200 font-mono text-sm">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full border-2 border-[#0099cc] border-t-transparent animate-spin" />
            <span>Ověřuji administrátorská oprávnění...</span>
          </div>
        </div>
      );
    }

    if (!user) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#070d18] text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-cyan-500/20 selection:text-cyan-300">
          <header className="border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-[#070d18]/90 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
            <Logo />
            <Link
              href="/"
              className="text-xs font-mono font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              ← Zpět do aplikace
            </Link>
          </header>

          <main className="max-w-md mx-auto px-6 py-12 flex-1 flex flex-col justify-center text-center space-y-6">
            <div className="p-8 rounded-3xl border border-sky-300 dark:border-cyan-500/40 bg-white dark:bg-[#0f172a]/80 shadow-lg space-y-5 backdrop-blur-sm">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 dark:bg-cyan-950 text-sky-800 dark:text-cyan-300 border border-sky-200 dark:border-cyan-800/60 text-[10px] font-mono font-bold uppercase tracking-wider">
                <span>INTERNÍ VÝVOJÁŘSKÁ LABORATOŘ</span>
              </div>

              <div className="space-y-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Luke Parameter Consistency Lab
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Tato sekce obsahuje diagnostické a srovnávací nástroje Agenta Lukea bez mezipaměti. Přístup je vyhrazen pouze pro autorizované správce.
                </p>
              </div>

              <div className="pt-3 space-y-3">
                <button
                  type="button"
                  onClick={() => setIsLoginModalOpen(true)}
                  className="w-full py-3 px-5 rounded-xl bg-[#0099cc] hover:bg-[#0088b8] text-white font-bold text-sm shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Přihlásit se přes Google</span>
                </button>
                <Link
                  href="/"
                  className="block text-xs font-mono text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 py-1 transition-colors"
                >
                  Návrat na hlavní stránku
                </Link>
              </div>
            </div>
          </main>

          <footer className="p-6 text-center text-xs font-mono text-slate-400 dark:text-slate-600 border-t border-slate-200 dark:border-slate-800/80">
            bAIright • Internal Diagnostics
          </footer>

          <GoogleLoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      <ConfirmModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={confirmClearAllHistory}
        badge="LAB • RESET"
        title="Resetovat historii srovnávání"
        message="Opravdu chcete vyresetovat historii srovnávání pro všechny produkty v labu? Všechna uložená baseline data budou smazána."
        confirmLabel="Resetovat historii"
        cancelLabel="Zrušit"
        isDestructive={true}
        locale="cs"
      />
        </div>
      );
    }

    if (!isAuthorizedAdmin) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#070d18] text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-cyan-500/20 selection:text-cyan-300">
          <header className="border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-[#070d18]/90 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
            <Logo />
            <Link
              href="/"
              className="text-xs font-mono font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              ← Zpět do aplikace
            </Link>
          </header>

          <main className="max-w-md mx-auto px-6 py-12 flex-1 flex flex-col justify-center text-center space-y-6">
            <div className="p-8 rounded-3xl border border-rose-300 dark:border-rose-900/60 bg-white dark:bg-[#0f172a]/80 shadow-lg space-y-5 backdrop-blur-sm">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 text-[10px] font-mono font-bold uppercase tracking-wider">
                <span>403 PŘÍSTUP ODEPŘEN</span>
              </div>

              <div className="space-y-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Nemáte administrátorská oprávnění
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Účet <strong className="text-slate-900 dark:text-white">{user.email}</strong> není na seznamu autorizovaných správců systému bAIright.
                </p>
              </div>

              <div className="pt-3 space-y-3">
                <button
                  type="button"
                  onClick={() => logout()}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  Odhlásit se a zvolit jiný účet
                </button>
                <Link
                  href="/"
                  className="block text-xs font-mono text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 py-1 transition-colors"
                >
                  Návrat na hlavní stránku
                </Link>
              </div>
            </div>
          </main>

          <footer className="p-6 text-center text-xs font-mono text-slate-400 dark:text-slate-600 border-t border-slate-200 dark:border-slate-800/80">
            bAIright • Internal Diagnostics
          </footer>
        </div>
      );
    }
  }

  // Metric computations
  const productEntries = Object.values(history);
  const scoredEntries = productEntries.filter((p) => typeof p.similarityScore === "number");
  const averageConsistency = scoredEntries.length > 0
    ? Math.round(scoredEntries.reduce((acc, curr) => acc + (curr.similarityScore || 0), 0) / scoredEntries.length)
    : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070d18] text-slate-900 dark:text-slate-100 font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Top Navigation */}
      <header className="border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-[#070d18]/90 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Logo />
          <div className="hidden sm:flex items-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-4">
            <span className="text-xs uppercase font-mono tracking-widest text-[#0099cc] dark:text-cyan-400 font-bold">
              LUKE
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-500 font-mono">
              v1.0 • NOINDEX
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {user && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="truncate max-w-[160px]">{user.email}</span>
            </div>
          )}
          <Link
            href="/"
            className="text-xs font-mono font-medium text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
          >
            ← Zpět do aplikace
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Hero Section */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 dark:bg-cyan-950/60 border border-sky-300 dark:border-cyan-800/40 text-sky-900 dark:text-cyan-400 text-xs font-mono font-bold">
            <span>LIVE LLM CONSISTENCY TESTING • ZERO CACHE</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Luke Parameter Consistency Lab
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
            Interní ověřovací prostředí. Každé spuštění provolává živého Agenta Lukea bez použití jakékoliv mezipaměti.
            Můžete libovolný produkt přegenerovat samostatně a porovnat parametry mezi předchozím a novým během.
          </p>
        </div>

        {/* Global Action & Metrics Bar */}
        <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 backdrop-blur-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-xs">
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-500 block">
                Celková shoda sady
              </span>
              <span className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight ${
                averageConsistency && averageConsistency >= 90
                  ? "text-emerald-600 dark:text-teal-400"
                  : averageConsistency
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-slate-400 dark:text-slate-600"
              }`}>
                {averageConsistency ? `${averageConsistency} %` : "-- %"}
              </span>
            </div>
            <div className="border-l border-slate-200 dark:border-slate-800 pl-6">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-500 block">
                Otestováno produktů
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
                {scoredEntries.length} / {productEntries.length}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={regenerateAll}
              disabled={isBulkRunning}
              className="px-4 py-2.5 rounded-xl bg-[#0099cc] hover:bg-[#0088b8] text-white font-mono text-xs font-bold transition-all disabled:opacity-40 shadow-xs cursor-pointer"
            >
              {isBulkRunning ? "Generuji všech 10 produktů..." : "↻ Přegenerovat všech 10"}
            </button>
            <button
              onClick={clearAllHistory}
              disabled={isBulkRunning}
              className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono text-xs font-medium transition-colors cursor-pointer"
            >
              Reset historie
            </button>
          </div>
        </div>

        {/* Custom Query Test Input */}
        <form onSubmit={handleAddCustomProduct} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={customProductInput}
            onChange={(e) => setCustomProductInput(e.target.value)}
            placeholder="Otestovat vlastní produkt (např. 'Pánská nepromokavá bunda na trek')..."
            className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-slate-950 border border-sky-300 dark:border-cyan-500/40 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-[#0099cc] focus:ring-1 focus:ring-[#0099cc] shadow-xs"
          />
          <button
            type="submit"
            disabled={!customProductInput.trim() || isBulkRunning}
            className="px-5 py-3 rounded-xl bg-slate-900 dark:bg-cyan-950 hover:bg-slate-800 dark:hover:bg-cyan-900 text-white dark:text-cyan-300 border border-slate-800 dark:border-cyan-700 font-mono text-xs font-bold disabled:opacity-40 transition-colors shadow-xs cursor-pointer"
          >
            + Přidat a otestovat
          </button>
        </form>

        {/* Product Comparison Cards */}
        <div className="space-y-6">
          {productEntries.map((prod, index) => {
            const isLoading = !!loadingMap[prod.name];
            const error = errorMap[prod.name];
            const baseline = prod.baseline;
            const latest = prod.latest;
            const sim = prod.similarityScore;

            const baselineIds = new Set(baseline?.parameters.map((p) => p.id) || []);
            const latestIds = new Set(latest?.parameters.map((p) => p.id) || []);

            return (
              <div
                key={prod.name}
                className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0b1322] shadow-xs overflow-hidden transition-colors"
              >
                {/* Product Header */}
                <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-slate-400 dark:text-slate-500">
                      #{String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{prod.name}</span>
                        {isLoading && (
                          <span className="text-xs font-mono text-[#0099cc] dark:text-cyan-400 font-normal animate-pulse">
                            (Generuji živou odpověď...)
                          </span>
                        )}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
                          {latest?.matchedDomain || baseline?.matchedDomain || "Doména zatím nenačtena"}
                        </span>
                        {latest?.source && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-100 dark:bg-slate-800 text-sky-800 dark:text-cyan-400 border border-sky-200 dark:border-slate-700">
                            {latest.source}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    {typeof sim === "number" ? (
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-mono text-xs">
                        <span className="text-slate-600 dark:text-slate-400">Konzistence:</span>
                        <span className={`font-bold ${sim >= 90 ? "text-emerald-600 dark:text-teal-400" : "text-amber-600 dark:text-amber-400"}`}>
                          {sim} %
                        </span>
                      </div>
                    ) : baseline ? (
                      <span className="text-xs font-mono text-slate-600 dark:text-slate-400 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                        1 běh (Čeká na srovnání)
                      </span>
                    ) : (
                      <span className="text-xs font-mono text-slate-500">
                        Zatím nespuštěno
                      </span>
                    )}

                    <button
                      onClick={() => regenerateProduct(prod.name)}
                      disabled={isLoading || isBulkRunning}
                      className="px-3.5 py-1.5 rounded-xl bg-sky-50 dark:bg-cyan-950/80 hover:bg-sky-100 dark:hover:bg-cyan-900/80 text-sky-900 dark:text-cyan-300 border border-sky-300 dark:border-cyan-700/60 font-mono text-xs font-bold disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      {isLoading ? "Generuji..." : "↻ Přegenerovat"}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-rose-50 dark:bg-red-950/40 border-b border-rose-200 dark:border-red-900/50 text-rose-700 dark:text-red-400 text-xs font-mono">
                    Chyba generování: {error}
                  </div>
                )}

                {/* Diff Comparison View */}
                {!baseline && !latest && !isLoading ? (
                  <div className="p-8 text-center text-slate-500 text-xs font-mono">
                    Tento produkt ještě nebyl vygenerován. Klikněte na [ ↻ Přegenerovat ] pro provedení prvního živého běhu.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
                    {/* Left Column: Baseline */}
                    <div className="p-4 sm:p-5 space-y-3 bg-white dark:bg-transparent">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400">
                          Předchozí běh {baseline?.timestamp && `(${baseline.timestamp})`}
                        </span>
                        <span className="text-xs font-mono text-slate-500">
                          {baseline?.parameters.length || 0} parametrů
                        </span>
                      </div>

                      {baseline ? (
                        <div className="space-y-2">
                          {baseline.parameters.map((param) => {
                            const match = findSemanticMatch(param, latest?.parameters || []);
                            const isShared = Boolean(match);
                            const isWordingNuance = isShared && match?.name !== param.name;
                            return (
                              <div
                                key={param.id}
                                className={`p-3 rounded-xl border text-xs transition-colors shadow-2xs ${
                                  latest
                                    ? isShared
                                      ? "bg-sky-50/60 dark:bg-slate-900/80 border-sky-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-200"
                                      : "bg-slate-50/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800/60 text-slate-600 dark:text-slate-500"
                                    : "bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-300"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-bold text-slate-900 dark:text-white">
                                    {param.name}
                                  </span>
                                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                    {param.suggestedComponent || "chips"}
                                  </span>
                                </div>
                                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed font-normal">
                                  {param.rationale}
                                </div>
                                {latest && (
                                  <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                                    {isShared ? (
                                      <span className="text-[10px] font-mono text-emerald-700 dark:text-teal-400 font-bold">
                                        {isWordingNuance ? `✓ Shodný (${match?.name})` : "✓ Shodný v obou bězích"}
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400 font-medium">
                                        - V novém běhu chybí
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs font-mono">
                          Zatím žádný předchozí běh.
                        </div>
                      )}
                    </div>

                    {/* Right Column: Latest Run */}
                    <div className="p-4 sm:p-5 space-y-3 bg-white dark:bg-transparent">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#0099cc] dark:text-cyan-400">
                          Nový běh {latest?.timestamp && `(${latest.timestamp})`}
                        </span>
                        <span className="text-xs font-mono text-slate-500">
                          {latest?.parameters.length || 0} parametrů
                        </span>
                      </div>

                      {latest ? (
                        <div className="space-y-2">
                          {latest.parameters.map((param) => {
                            const match = findSemanticMatch(param, baseline?.parameters || []);
                            const isShared = Boolean(match);
                            const isWordingNuance = isShared && match?.name !== param.name;
                            return (
                              <div
                                key={param.id}
                                className={`p-3 rounded-xl border text-xs transition-colors shadow-2xs ${
                                  isShared
                                    ? "bg-sky-50/60 dark:bg-slate-900/80 border-sky-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-200"
                                    : "bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40 text-slate-900 dark:text-amber-200"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-bold text-slate-900 dark:text-white">
                                    {param.name}
                                  </span>
                                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                    {param.suggestedComponent || "chips"}
                                  </span>
                                </div>
                                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed font-normal">
                                  {param.rationale}
                                </div>
                                <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                                  {isShared ? (
                                    <span className="text-[10px] font-mono text-emerald-700 dark:text-teal-400 font-bold">
                                      {isWordingNuance ? `✓ Shodný (${match?.name})` : "✓ Shodný v obou bězích"}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-mono text-[#0077a3] dark:text-cyan-300 font-bold">
                                      + Nově navržený parametr
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs font-mono h-full flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-800/80 rounded-xl">
                          Klikněte na [ ↻ Přegenerovat ] pro vytvoření 2. běhu a okamžité srovnání.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      <GoogleLoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </div>
  );
}
